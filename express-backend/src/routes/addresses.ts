import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { readDb, writeDb } from '../config/localDb';
import { reverseGeocodeCoordinates, forwardGeocodeAddress } from '../services/geocodingService';

const router = Router();

export interface UserAddressRecord {
  id: string;
  consumer_id: string;
  tag: string;
  flat: string;
  street: string;
  landmark?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  formatted_address?: string;
  isDefault?: boolean;
  created_at?: string;
  updated_at?: string;
}

// POST /reverse-geocode — Convert lat/lng to structured location data (Google Maps / Fallback)
router.post('/reverse-geocode', async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const lat = parseFloat(String(latitude));
    const lng = parseFloat(String(longitude));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required' });
    }

    const geoResult = await reverseGeocodeCoordinates(lat, lng);
    return res.json({ success: true, location: geoResult });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Reverse geocoding failed' });
  }
});

// POST & GET /forward-geocode — Convert address/area/pincode query to coordinates
const handleForwardGeocode = async (req: AuthRequest, res: Response) => {
  try {
    const query = String(req.body?.query || req.query?.query || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query string is required' });
    }

    const geoResult = await forwardGeocodeAddress(query);
    if (!geoResult) {
      return res.status(404).json({ success: false, error: 'Coordinates not found for given location' });
    }
    return res.json({ success: true, location: geoResult });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Forward geocoding failed' });
  }
};

router.post('/forward-geocode', handleForwardGeocode);
router.get('/forward-geocode', handleForwardGeocode);


// GET /check-serviceability — Verify whether a pincode, area, or coordinates are serviceable
router.get('/check-serviceability', async (req: AuthRequest, res: Response) => {
  try {
    const { checkLocationServiceability } = require('../services/shopResolution');
    const lat = req.query.lat != null ? parseFloat(String(req.query.lat)) : (req.query.latitude != null ? parseFloat(String(req.query.latitude)) : null);
    const lng = req.query.lng != null ? parseFloat(String(req.query.lng)) : (req.query.longitude != null ? parseFloat(String(req.query.longitude)) : null);
    const pincode = String(req.query.pincode || '').replace(/\D/g, '').slice(0, 6);
    const city = String(req.query.city || '').trim();
    const area = String(req.query.area || req.query.area_name || '').trim();

    const result = checkLocationServiceability({
      pincode,
      city,
      areaName: area,
      latitude: lat,
      longitude: lng,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Serviceability check failed' });
  }
});

// GET / — List saved addresses for logged-in consumer
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = readDb() as any;
    const addresses: UserAddressRecord[] = (db.user_addresses || []).filter(
      (a: UserAddressRecord) => a.consumer_id === req.user!.id,
    );
    return res.json({ success: true, addresses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to load addresses' });
  }
});

// POST / — Create or update an address
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const {
    id,
    tag,
    flat,
    street,
    landmark,
    area,
    city,
    district,
    state,
    pincode,
    phone,
    latitude,
    longitude,
    formatted_address,
    isDefault,
  } = req.body;

  if (!flat?.trim() || !street?.trim() || !pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Flat/house, area/locality, and pincode are required',
    });
  }

  const parsedLat = latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
  const parsedLng = longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;

  try {
    const db = readDb() as any;
    if (!db.user_addresses) db.user_addresses = [];

    const consumerId = req.user!.id;
    const now = new Date().toISOString();
    let saved: UserAddressRecord;

    if (id) {
      const idx = db.user_addresses.findIndex(
        (a: UserAddressRecord) => a.id === id && a.consumer_id === consumerId,
      );
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Address not found' });
      }
      saved = {
        ...db.user_addresses[idx],
        tag: (tag || 'Home').trim(),
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark?.trim() || '',
        area: area?.trim() || db.user_addresses[idx].area || '',
        city: city?.trim() || db.user_addresses[idx].city || '',
        district: district?.trim() || db.user_addresses[idx].district || '',
        state: state?.trim() || db.user_addresses[idx].state || '',
        pincode: pincode.trim(),
        phone: (phone || '').trim(),
        latitude: parsedLat ?? db.user_addresses[idx].latitude ?? null,
        longitude: parsedLng ?? db.user_addresses[idx].longitude ?? null,
        formatted_address: formatted_address?.trim() || db.user_addresses[idx].formatted_address || '',
        isDefault: isDefault === true,
        updated_at: now,
      };
      db.user_addresses[idx] = saved;
    } else {
      saved = {
        id: `addr-${Date.now()}`,
        consumer_id: consumerId,
        tag: (tag || 'Home').trim(),
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark?.trim() || '',
        area: area?.trim() || '',
        city: city?.trim() || '',
        district: district?.trim() || '',
        state: state?.trim() || '',
        pincode: pincode.trim(),
        phone: (phone || '').trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        formatted_address: formatted_address?.trim() || '',
        isDefault: isDefault === true || db.user_addresses.filter(
          (a: UserAddressRecord) => a.consumer_id === consumerId,
        ).length === 0,
        created_at: now,
        updated_at: now,
      };
      db.user_addresses.push(saved);
    }

    if (saved.isDefault) {
      db.user_addresses = db.user_addresses.map((a: UserAddressRecord) => {
        if (a.consumer_id !== consumerId) return a;
        return { ...a, isDefault: a.id === saved.id };
      });
    }

    writeDb(db);
    const addresses = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    return res.json({ success: true, address: saved, addresses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to save address' });
  }
});

// DELETE /:id — Remove an address
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const db = readDb() as any;
    const consumerId = req.user!.id;
    const exists = (db.user_addresses || []).some(
      (a: UserAddressRecord) => a.id === id && a.consumer_id === consumerId,
    );
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    db.user_addresses = (db.user_addresses || []).filter(
      (a: UserAddressRecord) => a.id !== id || a.consumer_id !== consumerId,
    );

    const remaining = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    if (remaining.length > 0 && !remaining.some((a: UserAddressRecord) => a.isDefault)) {
      remaining[0].isDefault = true;
    }

    writeDb(db);
    return res.json({ success: true, addresses: remaining });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to delete address' });
  }
});

export default router;
