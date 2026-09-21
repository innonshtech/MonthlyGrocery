import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { readDb, writeDb } from '../config/localDb';
import { reverseGeocodeCoordinates, forwardGeocodeAddress } from '../services/geocodingService';
import { validateIndianPincode } from '../utils/pincodeValidator';

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

// POST & GET /reverse-geocode — Convert lat/lng to structured location data (Google Maps / Fallback)
const handleReverseGeocode = async (req: AuthRequest, res: Response) => {
  try {
    const latRaw = req.body?.latitude ?? req.body?.lat ?? req.query?.latitude ?? req.query?.lat;
    const lngRaw = req.body?.longitude ?? req.body?.lng ?? req.query?.longitude ?? req.query?.lng;
    const lat = parseFloat(String(latRaw));
    const lng = parseFloat(String(lngRaw));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required' });
    }

    const geoResult = await reverseGeocodeCoordinates(lat, lng);
    return res.json({ success: true, location: geoResult });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Reverse geocoding failed' });
  }
};

router.post('/reverse-geocode', handleReverseGeocode);
router.get('/reverse-geocode', handleReverseGeocode);

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

// GET /google-maps-status — Check whether Google Maps API is active and functioning
router.get('/google-maps-status', async (_req: AuthRequest, res: Response) => {
  try {
    const { getGoogleMapsApiStatus } = require('../services/geocodingService');
    const status = await getGoogleMapsApiStatus();
    return res.json({ success: true, ...status });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Status check failed' });
  }
});

// GET & POST /places-autocomplete — Search places with Google Places API or fallback
const handlePlacesAutocomplete = async (req: AuthRequest, res: Response) => {
  try {
    const { autocompletePlaces } = require('../services/geocodingService');
    const input = String(req.body?.input || req.query?.input || req.query?.q || '').trim();
    const city = String(req.body?.city || req.query?.city || '').trim();
    if (!input) {
      return res.json({ success: true, predictions: [] });
    }
    const predictions = await autocompletePlaces(input, city || undefined);
    return res.json({ success: true, predictions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Autocomplete failed' });
  }
};

router.get('/places-autocomplete', handlePlacesAutocomplete);
router.post('/places-autocomplete', handlePlacesAutocomplete);

// POST /driving-distance — Calculate driving road distance & time with Google Distance Matrix
router.post('/driving-distance', async (req: AuthRequest, res: Response) => {
  try {
    const { calculateDrivingDistanceMatrix } = require('../services/geocodingService');
    const { origin_lat, origin_lng, dest_lat, dest_lng } = req.body;
    const oLat = parseFloat(String(origin_lat));
    const oLng = parseFloat(String(origin_lng));
    const dLat = parseFloat(String(dest_lat));
    const dLng = parseFloat(String(dest_lng));

    if (isNaN(oLat) || isNaN(oLng) || isNaN(dLat) || isNaN(dLng)) {
      return res.status(400).json({ success: false, error: 'Valid origin and destination coordinates required' });
    }

    const result = await calculateDrivingDistanceMatrix(oLat, oLng, dLat, dLng);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Distance matrix failed' });
  }
});


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

// Helper function to deduplicate addresses and enforce single default per consumer
function cleanupUserAddresses(allAddresses: UserAddressRecord[], targetConsumerId: string): UserAddressRecord[] {
  const userAddrs = (allAddresses || []).filter((a) => a.consumer_id === targetConsumerId);
  const otherAddrs = (allAddresses || []).filter((a) => a.consumer_id !== targetConsumerId);

  // Group by normalized tag for 'home' and 'work'
  const seenTags = new Set<string>();
  const cleaned: UserAddressRecord[] = [];

  // Sort: most recently updated/created first
  const sorted = [...userAddrs].sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  for (const addr of sorted) {
    const tagNorm = (addr.tag || 'Home').trim().toLowerCase();
    if (tagNorm === 'home' || tagNorm === 'work') {
      if (!seenTags.has(tagNorm)) {
        seenTags.add(tagNorm);
        cleaned.push(addr);
      }
    } else {
      cleaned.push(addr);
    }
  }

  // Ensure exactly one address has isDefault = true
  const hasDefault = cleaned.some((a) => a.isDefault);
  if (!hasDefault && cleaned.length > 0) {
    cleaned[0].isDefault = true;
  } else {
    // If multiple have isDefault = true, only the first (latest) retains it
    let foundFirstDefault = false;
    for (const a of cleaned) {
      if (a.isDefault) {
        if (!foundFirstDefault) {
          foundFirstDefault = true;
        } else {
          a.isDefault = false;
        }
      }
    }
  }

  return [...otherAddrs, ...cleaned];
}

// GET / — List saved addresses for logged-in consumer
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = readDb() as any;
    if (!db.user_addresses) db.user_addresses = [];
    const consumerId = req.user!.id;

    const prevCount = db.user_addresses.length;
    db.user_addresses = cleanupUserAddresses(db.user_addresses, consumerId);
    if (db.user_addresses.length !== prevCount) {
      writeDb(db);
    }

    const addresses: UserAddressRecord[] = (db.user_addresses || []).filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
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
  } = req.body;

  if (!flat?.trim() || !street?.trim() || !pincode?.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Flat/house, area/locality, and pincode are required',
    });
  }

  const pinVal = validateIndianPincode(String(pincode));
  if (!pinVal.isValid) {
    return res.status(400).json({
      success: false,
      error: pinVal.error,
    });
  }

  const parsedLat = latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
  const parsedLng = longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;

  try {
    const db = readDb() as any;
    if (!db.user_addresses) db.user_addresses = [];

    const consumerId = req.user!.id;
    const now = new Date().toISOString();
    const cleanTag = (tag || 'Home').trim();
    const cleanTagLower = cleanTag.toLowerCase();
    let saved: UserAddressRecord;

    // Check if an existing address for this consumer matches:
    // 1) Explicit ID match, OR
    // 2) For standard tags ('Home' or 'Work'), match any existing address with the same tag to prevent duplicates
    let existingIndex = -1;
    if (id) {
      existingIndex = db.user_addresses.findIndex(
        (a: UserAddressRecord) => a.id === id && a.consumer_id === consumerId,
      );
    } else if (cleanTagLower === 'home' || cleanTagLower === 'work') {
      existingIndex = db.user_addresses.findIndex(
        (a: UserAddressRecord) => a.consumer_id === consumerId && (a.tag || '').trim().toLowerCase() === cleanTagLower,
      );
    }

    if (existingIndex !== -1) {
      const existingId = db.user_addresses[existingIndex].id;
      saved = {
        ...db.user_addresses[existingIndex],
        id: existingId,
        consumer_id: consumerId,
        tag: cleanTag,
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark?.trim() || '',
        area: area?.trim() || db.user_addresses[existingIndex].area || '',
        city: city?.trim() || db.user_addresses[existingIndex].city || '',
        district: district?.trim() || db.user_addresses[existingIndex].district || '',
        state: state?.trim() || db.user_addresses[existingIndex].state || '',
        pincode: pincode.trim(),
        phone: (phone || '').trim(),
        latitude: parsedLat ?? db.user_addresses[existingIndex].latitude ?? null,
        longitude: parsedLng ?? db.user_addresses[existingIndex].longitude ?? null,
        formatted_address: formatted_address?.trim() || db.user_addresses[existingIndex].formatted_address || '',
        isDefault: true, // Newly saved/edited address is ALWAYS set as active default
        updated_at: now,
      };
      db.user_addresses[existingIndex] = saved;
    } else {
      saved = {
        id: `addr-${Date.now()}`,
        consumer_id: consumerId,
        tag: cleanTag,
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
        isDefault: true, // Newly added address is ALWAYS set as active default
        created_at: now,
        updated_at: now,
      };
      db.user_addresses.push(saved);
    }

    // Set all other addresses for this consumer to isDefault: false
    db.user_addresses = db.user_addresses.map((a: UserAddressRecord) => {
      if (a.consumer_id !== consumerId) return a;
      return { ...a, isDefault: a.id === saved.id };
    });

    // Run deduplication to clean up any other duplicates in DB
    db.user_addresses = cleanupUserAddresses(db.user_addresses, consumerId);

    writeDb(db);
    const addresses = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    return res.json({ success: true, address: saved, addresses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to save address' });
  }
});

// POST /:id/default — Set specific address as default
router.post('/:id/default', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const db = readDb() as any;
    if (!db.user_addresses) db.user_addresses = [];
    const consumerId = req.user!.id;

    const exists = db.user_addresses.some(
      (a: UserAddressRecord) => a.id === id && a.consumer_id === consumerId,
    );
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    db.user_addresses = db.user_addresses.map((a: UserAddressRecord) => {
      if (a.consumer_id !== consumerId) return a;
      return { ...a, isDefault: a.id === id };
    });

    db.user_addresses = cleanupUserAddresses(db.user_addresses, consumerId);
    writeDb(db);

    const addresses = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    const selected = addresses.find((a: UserAddressRecord) => a.id === id);
    return res.json({ success: true, address: selected, addresses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to set default address' });
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

    db.user_addresses = cleanupUserAddresses(db.user_addresses, consumerId);
    writeDb(db);

    const remaining = db.user_addresses.filter(
      (a: UserAddressRecord) => a.consumer_id === consumerId,
    );
    return res.json({ success: true, addresses: remaining });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to delete address' });
  }
});

export default router;
