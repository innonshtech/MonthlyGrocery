import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { getMerchantShopForUser } from '../services/shopResolution';
import { validateIndianPincode } from '../utils/pincodeValidator';

const router = Router();
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Maximum 5MB for photos
});

const s3MediaClient = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BASE_PUBLIC_API_URL = (process.env.PUBLIC_API_URL || 'http://13.233.159.143/api').replace(/\/+$/, '');

export const formatDocUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith('data:')) return s;

  // Extract S3 key if raw AWS S3 URL
  const s3Match = s.match(/amazonaws\.com\/(.+)$/);
  if (s3Match) {
    return `${BASE_PUBLIC_API_URL}/shops/doc-file/${s3Match[1]}`;
  }
  if (s.startsWith('/api/shops/doc-file/')) {
    return `${BASE_PUBLIC_API_URL}${s.replace(/^\/api/, '')}`;
  }
  if (s.startsWith('http://localhost:8001') || s.startsWith('http://10.0.2.2:8001')) {
    return s.replace(/^http:\/\/(localhost|10\.0\.2\.2):8001\/api/, BASE_PUBLIC_API_URL);
  }
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  const cleanKey = s.replace(/^\/+/, '');
  return `${BASE_PUBLIC_API_URL}/shops/doc-file/${cleanKey.startsWith('merchant-documents/') ? cleanKey : 'merchant-documents/' + cleanKey}`;
};

// 0. GET /me & /my: Retrieve logged-in merchant's shop profile
const handleGetMyMerchantShop = async (req: AuthRequest, res: any) => {
  try {
    const shop = await getMerchantShopForUser({
      id: req.user!.id,
      role: req.user!.role,
      mobile: (req.user as any)?.mobile || (req.user as any)?.phone,
    });

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Merchant store not found.', shop_not_found: true });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const territory = (db.shop_territories || []).find((t: any) => t.shop_id === shop.id);
    const assignedLocations = (db.serviceable_locations || [])
      .filter((loc: any) => loc.shop_id === shop.id && loc.is_serviceable !== false)
      .map((loc: any) => ({
        id: loc.id,
        area_name: loc.area_name,
        city: loc.city,
        pincode: loc.pincode,
      }));

    return res.json({
      success: true,
      shop: {
        ...shop,
        state_name: territory?.state_name || null,
        district_name: territory?.district_name || null,
        city: territory?.city || null,
        area_name: territory?.area_name || null,
        pincode: territory?.pincode || null,
        address_line: territory?.address_line || null,
        latitude: territory?.latitude != null ? parseFloat(territory.latitude) : null,
        longitude: territory?.longitude != null ? parseFloat(territory.longitude) : null,
        delivery_radius_km: territory?.delivery_radius_km || 5.0,
        free_delivery_radius_km: territory?.free_delivery_radius_km != null ? parseFloat(String(territory.free_delivery_radius_km)) : 5.0,
        extra_delivery_fee_per_km: territory?.extra_delivery_fee_per_km != null ? parseFloat(String(territory.extra_delivery_fee_per_km)) : 10.0,
        is_open: territory?.is_open !== false,
        assigned_locations: assignedLocations,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

router.get('/me', authMiddleware, requireRole(['admin', 'super_admin']), handleGetMyMerchantShop);
router.get('/my', authMiddleware, requireRole(['admin', 'super_admin']), handleGetMyMerchantShop);

// 0.1 PUT /me/settings: Update merchant's store location, delivery radius, fee structure, and open/closed status
router.put('/me/settings', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res) => {
  try {
    const shop = await getMerchantShopForUser({
      id: req.user!.id,
      role: req.user!.role,
      mobile: (req.user as any)?.mobile || (req.user as any)?.phone,
    });

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Merchant store not found', shop_not_found: true });
    }

    const {
      latitude,
      longitude,
      address_line,
      area_name,
      city,
      district_name,
      state_name,
      pincode,
      delivery_radius_km,
      free_delivery_radius_km,
      extra_delivery_fee_per_km,
      is_open,
    } = req.body;

    if (pincode && String(pincode).trim()) {
      const pinVal = validateIndianPincode(String(pincode));
      if (!pinVal.isValid) {
        return res.status(400).json({ success: false, error: pinVal.error });
      }
    }

    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;
    if (!db.shop_territories) db.shop_territories = [];

    const idx = db.shop_territories.findIndex((t: any) => t.shop_id === shop.id);
    const updatedTerritory = {
      ...(idx >= 0 ? db.shop_territories[idx] : {}),
      shop_id: shop.id,
      latitude: latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : (idx >= 0 ? db.shop_territories[idx].latitude : null),
      longitude: longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : (idx >= 0 ? db.shop_territories[idx].longitude : null),
      address_line: address_line !== undefined ? String(address_line).trim() : (idx >= 0 ? db.shop_territories[idx].address_line : ''),
      area_name: area_name !== undefined ? String(area_name).trim() : (idx >= 0 ? db.shop_territories[idx].area_name : ''),
      city: city !== undefined ? String(city).trim() : (idx >= 0 ? db.shop_territories[idx].city : ''),
      district_name: district_name !== undefined ? String(district_name).trim() : (idx >= 0 ? db.shop_territories[idx].district_name : ''),
      state_name: state_name !== undefined ? String(state_name).trim() : (idx >= 0 ? db.shop_territories[idx].state_name : ''),
      pincode: pincode !== undefined ? String(pincode).trim() : (idx >= 0 ? db.shop_territories[idx].pincode : ''),
      delivery_radius_km: delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km))) ? parseFloat(String(delivery_radius_km)) : (idx >= 0 ? (db.shop_territories[idx].delivery_radius_km || 5.0) : 5.0),
      free_delivery_radius_km: free_delivery_radius_km != null && !isNaN(parseFloat(String(free_delivery_radius_km))) ? parseFloat(String(free_delivery_radius_km)) : (idx >= 0 && db.shop_territories[idx].free_delivery_radius_km != null ? db.shop_territories[idx].free_delivery_radius_km : 5.0),
      extra_delivery_fee_per_km: extra_delivery_fee_per_km != null && !isNaN(parseFloat(String(extra_delivery_fee_per_km))) ? parseFloat(String(extra_delivery_fee_per_km)) : (idx >= 0 && db.shop_territories[idx].extra_delivery_fee_per_km != null ? db.shop_territories[idx].extra_delivery_fee_per_km : 10.0),
      is_open: is_open !== undefined ? is_open === true : (idx >= 0 ? db.shop_territories[idx].is_open !== false : true),
    };

    if (idx >= 0) {
      db.shop_territories[idx] = updatedTerritory;
    } else {
      db.shop_territories.push(updatedTerritory);
    }
    writeDb(db);

    // Also update PostgreSQL shops table directly
    try {
      const pgUpdate: Record<string, any> = {};
      if (updatedTerritory.latitude != null) pgUpdate.latitude = updatedTerritory.latitude;
      if (updatedTerritory.longitude != null) pgUpdate.longitude = updatedTerritory.longitude;
      if (updatedTerritory.city) pgUpdate.city = updatedTerritory.city;
      if (updatedTerritory.area_name) pgUpdate.area_name = updatedTerritory.area_name;
      if (updatedTerritory.address_line) pgUpdate.address_line = updatedTerritory.address_line;
      if (updatedTerritory.pincode) pgUpdate.pincode = updatedTerritory.pincode;
      if (updatedTerritory.delivery_radius_km) pgUpdate.delivery_radius_km = updatedTerritory.delivery_radius_km;
      if (updatedTerritory.is_open !== undefined) pgUpdate.is_open = updatedTerritory.is_open;
      
      if (Object.keys(pgUpdate).length > 0) {
        await supabase.from('shops').update(pgUpdate).eq('id', shop.id);
      }
    } catch (pgErr: any) {
      console.warn('Warning updating shops table in PG:', pgErr?.message);
    }

    return res.json({
      success: true,
      message: 'Store settings updated successfully',
      shop: {
        ...shop,
        ...updatedTerritory,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});


// 0.15 GET /by-area: Return all approved shops serving a specific area (for customer shop picker)
router.get('/by-area', async (req, res) => {
  try {
    const areaParam = String(req.query.area || req.query.area_name || '').trim().toLowerCase();
    const cityParam = String(req.query.city || '').trim().toLowerCase();

    if (!areaParam) {
      return res.status(400).json({ success: false, error: 'area query param is required' });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const serviceableLocations: any[] = db.serviceable_locations || [];
    const shopTerritories: any[] = db.shop_territories || [];

    // Find all serviceable_locations matching the area (and optionally city)
    const matchingLocs = serviceableLocations.filter((loc: any) => {
      const locArea = String(loc.area_name || '').trim().toLowerCase();
      const locCity = String(loc.city || '').trim().toLowerCase();
      const areaMatch = locArea === areaParam;
      const cityMatch = !cityParam || locCity === cityParam;
      return areaMatch && cityMatch && loc.is_serviceable !== false && loc.shop_id;
    });

    // Collect unique shop_ids
    const shopIds = [...new Set(matchingLocs.map((l: any) => l.shop_id as string).filter(Boolean))];

    if (shopIds.length === 0) {
      return res.json({ success: true, count: 0, shops: [] });
    }

    // Fetch those shops from Supabase (must be approved)
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, shop_name, status')
      .in('id', shopIds)
      .eq('status', 'approved');

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const territoryMap = new Map<string, any>(shopTerritories.map((t: any) => [t.shop_id, t]));

    const enriched = (shops || []).map((shop: any) => {
      const territory = territoryMap.get(shop.id);
      const isOpen = territory?.is_open !== false;
      return {
        id: shop.id,
        shop_name: shop.shop_name,
        status: shop.status,
        address_line: territory?.address_line || '',
        area_name: territory?.area_name || areaParam,
        city: territory?.city || cityParam,
        pincode: territory?.pincode || '',
        delivery_radius_km: territory?.delivery_radius_km != null ? parseFloat(String(territory.delivery_radius_km)) : 5.0,
        is_open: isOpen,
        distance_km: null,
        within_radius: true,
      };
    });

    // Sort: open shops first, then alphabetically
    enriched.sort((a: any, b: any) => {
      if (a.is_open !== b.is_open) return a.is_open ? -1 : 1;
      return a.shop_name.localeCompare(b.shop_name);
    });

    return res.json({ success: true, count: enriched.length, shops: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 0.2 GET /nearby: Find all active approved shops delivering to the customer's location within their dynamic radius
router.get('/nearby', async (req, res) => {
  try {
    const lat = req.query.lat != null ? parseFloat(String(req.query.lat)) : null;
    const lng = req.query.lng != null ? parseFloat(String(req.query.lng)) : null;
    const pincode = String(req.query.pincode || '').replace(/\D/g, '').slice(0, 6);
    const city = String(req.query.city || '').trim().toLowerCase();
    const area = String(req.query.area || req.query.area_name || '').trim().toLowerCase();
    const queryRadius = req.query.radius != null ? parseFloat(String(req.query.radius)) : null;

    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, shop_name, status, created_at')
      .eq('status', 'approved');

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const territoryMap = new Map<string, any>((db.shop_territories || []).map((t: any) => [t.shop_id, t]));
    const serviceableLocations = db.serviceable_locations || [];

    const hasCustomerGps = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

    const enriched = (shops || []).map((shop: any) => {
      const territory = territoryMap.get(shop.id);
      const shopLat = territory?.latitude != null ? parseFloat(String(territory.latitude)) : null;
      const shopLng = territory?.longitude != null ? parseFloat(String(territory.longitude)) : null;
      const deliveryRadiusKm = territory?.delivery_radius_km != null ? parseFloat(String(territory.delivery_radius_km)) : 5.0;
      const isOpen = territory?.is_open !== false;

      let distanceKm: number | null = null;
      let withinRadius = false;
      let matchedByPincode = false;
      let matchedByArea = false;
      let isAreaPrimary = false;
      let isPincodePrimary = false;

      // Find all areas assigned to this shop in serviceable_locations
      const shopLocations = serviceableLocations.filter((loc: any) => loc.shop_id === shop.id && loc.is_serviceable !== false);
      const assignedAreas = shopLocations.map((loc: any) => loc.area_name);

      if (hasCustomerGps && shopLat != null && shopLng != null && !isNaN(shopLat) && !isNaN(shopLng)) {
        const { calculateHaversineDistanceKm } = require('../services/geocodingService');
        distanceKm = calculateHaversineDistanceKm(lat!, lng!, shopLat, shopLng);
        const effectiveRadius = queryRadius && !isNaN(queryRadius) ? queryRadius : deliveryRadiusKm;
        withinRadius = distanceKm != null && distanceKm <= effectiveRadius;
      }

      // Check area match
      if (area) {
        const areaLoc = shopLocations.find(
          (loc: any) => loc.area_name.trim().toLowerCase() === area && (!city || loc.city.trim().toLowerCase() === city)
        );
        if (areaLoc) {
          isAreaPrimary = true;
          matchedByArea = true;
          withinRadius = true;
        } else if (territory?.area_name && territory.area_name.trim().toLowerCase() === area) {
          matchedByArea = true;
          withinRadius = true;
        }
      }

      // Check pincode serviceability
      if (pincode && pincode.length === 6) {
        if (territory?.pincode && String(territory.pincode).trim() === pincode) {
          isPincodePrimary = true;
          matchedByPincode = true;
          withinRadius = true;
        }
        const locMatch = shopLocations.find(
          (loc: any) => String(loc.pincode || '').trim() === pincode
        );
        if (locMatch) {
          isPincodePrimary = true;
          matchedByPincode = true;
          withinRadius = true;
        }
      }

      // Check city match
      if (city && territory?.city && String(territory.city).trim().toLowerCase() === city) {
        if (!hasCustomerGps && !pincode && !area) {
          withinRadius = true;
        }
      }

      // If no filters provided, allow all active shops
      if (!hasCustomerGps && !pincode && !city && !area) {
        withinRadius = true;
      }

      return {
        id: shop.id,
        shop_name: shop.shop_name,
        status: shop.status,
        address_line: territory?.address_line || '',
        area_name: territory?.area_name || '',
        city: territory?.city || '',
        pincode: territory?.pincode || '',
        latitude: shopLat,
        longitude: shopLng,
        delivery_radius_km: deliveryRadiusKm,
        is_open: isOpen,
        distance_km: distanceKm,
        within_radius: withinRadius,
        matched_by_pincode: matchedByPincode,
        matched_by_area: matchedByArea,
        is_area_primary: isAreaPrimary,
        is_pincode_primary: isPincodePrimary,
        assigned_areas: assignedAreas,
      };
    });

    const matchingShops = enriched
      .filter((s: any) => s.within_radius && s.is_open)
      .sort((a: any, b: any) => {
        // Priority 1: Exact area primary shop
        if (a.is_area_primary && !b.is_area_primary) return -1;
        if (!a.is_area_primary && b.is_area_primary) return 1;

        // Priority 2: Pincode primary shop
        if (a.is_pincode_primary && !b.is_pincode_primary) return -1;
        if (!a.is_pincode_primary && b.is_pincode_primary) return 1;

        // Priority 3: Distance
        if (a.distance_km != null && b.distance_km != null) {
          return a.distance_km - b.distance_km;
        }
        if (a.distance_km != null) return -1;
        if (b.distance_km != null) return 1;
        return 0;
      });

    const resultList = matchingShops.length > 0 ? matchingShops : enriched.sort((a: any, b: any) => (a.distance_km || 999) - (b.distance_km || 999));

    return res.json({
      success: true,
      count: resultList.length,
      query_radius_km: queryRadius,
      customer_coords: hasCustomerGps ? { latitude: lat, longitude: lng } : null,
      shops: resultList,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 1. GET /all: List all shops with full legal document details (Super Admin only)
router.get('/all', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const territoryMap = new Map<string, any>((db.shop_territories || []).map((t: any) => [t.shop_id, t]));

    // Fetch profiles map for owner names & phones
    const { data: profiles } = await supabase.from('profiles').select('id, name, phone, email');
    const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    const enrichedShops = (shops || []).map((shop: any) => {
      const territory = territoryMap.get(shop.id);
      const ownerProfile = profileMap.get(shop.owner_id);
      return {
        ...shop,
        shop_name: shop.shop_name || shop.name || 'MonthlyGrocery',
        owner_name: shop.owner_name || ownerProfile?.name || 'Owner',
        phone: shop.phone || ownerProfile?.phone || '',
        status: shop.status || shop.kyc_status || 'approved',
        profiles: {
          name: shop.owner_name || ownerProfile?.name || 'Owner',
          phone: shop.phone || ownerProfile?.phone || '',
          email: ownerProfile?.email || '',
        },
        state_name: territory?.state_name || shop.state_name || null,
        district_name: territory?.district_name || shop.district_name || null,
        city: territory?.city || shop.city || null,
        area_name: territory?.area_name || shop.area_name || null,
        pincode: territory?.pincode || shop.pincode || null,
        address_line: territory?.address_line || shop.address || shop.address_line || null,
        street_address: shop.street_address || territory?.street_address || null,
        detailed_address: shop.detailed_address || territory?.detailed_address || null,
        aadhaar_number: shop.aadhaar_number || null,
        aadhaar_doc_url: formatDocUrl(shop.aadhaar_doc_url || territory?.aadhaar_doc_url),
        fssai_number: shop.fssai_number || null,
        fssai_doc_url: formatDocUrl(shop.fssai_doc_url || territory?.fssai_doc_url),
        pan_number: shop.pan_number || null,
        pan_doc_url: formatDocUrl(shop.pan_doc_url || territory?.pan_doc_url),
        gstin: shop.gstin || null,
        shop_photo_url: formatDocUrl(shop.shop_photo_url || territory?.shop_photo_url),
        rejection_reason: shop.rejection_reason || null,
        onboarding_source: shop.onboarding_source || 'merchant_app',
        latitude: territory?.latitude != null ? parseFloat(territory.latitude) : (shop.latitude != null ? parseFloat(shop.latitude) : null),
        longitude: territory?.longitude != null ? parseFloat(territory.longitude) : (shop.longitude != null ? parseFloat(shop.longitude) : null),
        delivery_radius_km: territory?.delivery_radius_km || shop.delivery_radius_km || 5.0,
        is_open: territory?.is_open !== false,
      };
    });

    return res.json({ success: true, shops: enrichedShops });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 1.1 GET /pending: List only pending merchant registrations for Super Admin review
router.get('/pending', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const territoryMap = new Map<string, any>((db.shop_territories || []).map((t: any) => [t.shop_id, t]));

    const { data: profiles } = await supabase.from('profiles').select('id, name, phone, email');
    const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    const enrichedShops = (shops || []).map((shop: any) => {
      const territory = territoryMap.get(shop.id);
      const ownerProfile = profileMap.get(shop.owner_id);
      return {
        ...shop,
        shop_name: shop.shop_name || shop.name || 'MonthlyGrocery',
        owner_name: shop.owner_name || ownerProfile?.name || 'Owner',
        phone: shop.phone || ownerProfile?.phone || '',
        status: shop.status || shop.kyc_status || 'pending',
        profiles: {
          name: shop.owner_name || ownerProfile?.name || 'Owner',
          phone: shop.phone || ownerProfile?.phone || '',
          email: ownerProfile?.email || '',
        },
        state_name: territory?.state_name || shop.state_name || null,
        district_name: territory?.district_name || shop.district_name || null,
        city: territory?.city || shop.city || null,
        area_name: territory?.area_name || shop.area_name || null,
        pincode: territory?.pincode || shop.pincode || null,
        address_line: territory?.address_line || shop.address || shop.address_line || null,
        street_address: shop.street_address || territory?.street_address || null,
        detailed_address: shop.detailed_address || territory?.detailed_address || null,
        aadhaar_number: shop.aadhaar_number || null,
        aadhaar_doc_url: formatDocUrl(shop.aadhaar_doc_url || territory?.aadhaar_doc_url),
        fssai_number: shop.fssai_number || null,
        fssai_doc_url: formatDocUrl(shop.fssai_doc_url || territory?.fssai_doc_url),
        pan_number: shop.pan_number || null,
        pan_doc_url: formatDocUrl(shop.pan_doc_url || territory?.pan_doc_url),
        gstin: shop.gstin || null,
        shop_photo_url: formatDocUrl(shop.shop_photo_url || territory?.shop_photo_url),
        rejection_reason: shop.rejection_reason || null,
        onboarding_source: shop.onboarding_source || 'merchant_app',
        latitude: territory?.latitude != null ? parseFloat(territory.latitude) : (shop.latitude != null ? parseFloat(shop.latitude) : null),
        longitude: territory?.longitude != null ? parseFloat(territory.longitude) : (shop.longitude != null ? parseFloat(shop.longitude) : null),
        delivery_radius_km: territory?.delivery_radius_km || shop.delivery_radius_km || 5.0,
        is_open: territory?.is_open !== false,
      };
    });

    return res.json({ success: true, count: enrichedShops.length, shops: enrichedShops });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 1.2 GET /doc-file/*: Secure Stream / Media Proxy for merchant KYC documents from S3 / Local
router.get('/doc-file/*', async (req: any, res: any) => {
  try {
    const rawKey = (req.params as any)[0] || '';
    if (!rawKey) {
      return res.status(400).send('Document key required');
    }

    const cleanKey = rawKey.replace(/^\/+/, '');
    const s3Key = cleanKey.startsWith('merchant-documents/') ? cleanKey : `merchant-documents/${cleanKey}`;

    // 1. Check if file is cached locally on disk
    const localPath = path.join(__dirname, '../../uploads', s3Key);
    if (fs.existsSync(localPath)) {
      const ext = path.extname(localPath).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.pdf') contentType = 'application/pdf';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(localPath).pipe(res);
    }

    // 2. Fetch directly from AWS S3 using IAM credentials
    const cmd = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'monthly-grocery-media-prod',
      Key: s3Key,
    });

    const s3Res = await s3MediaClient.send(cmd);
    res.setHeader('Content-Type', s3Res.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (s3Res.ContentLength) {
      res.setHeader('Content-Length', s3Res.ContentLength);
    }

    (s3Res.Body as any).pipe(res);
  } catch (err: any) {
    console.warn('[Doc File Proxy Error]:', err?.message || err);
    return res.status(404).send('Document not found or inaccessible');
  }
});

// 1.3 POST /upload-doc: Upload merchant legal documents (Aadhaar, FSSAI, PAN, Shop photo)
router.post(
  '/upload-doc',
  (req: any, res: any, next: any) => {
    docUpload.any()(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, error: 'Maximum photo size is 5MB. Please upload an image under 5MB.' });
        }
        return res.status(400).json({ success: false, error: err.message || 'File upload error' });
      }
      next();
    });
  },
  async (req: any, res: any) => {
    try {
      const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

      if (!file && !req.body?.base64) {
        return res.status(400).json({ success: false, error: 'No document or photo file uploaded' });
      }

      let buffer: Buffer;
      let contentType: string;
      let cleanExt: string;

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ success: false, error: 'Maximum photo size is 5MB. Please upload an image under 5MB.' });
        }
        buffer = file.buffer;
        const fileExt = (file.originalname || 'document.jpg').split('.').pop() || 'jpg';
        cleanExt = fileExt.toLowerCase();
        contentType = file.mimetype || 'image/jpeg';
        if (cleanExt === 'pdf') contentType = 'application/pdf';
        else if (cleanExt === 'png') contentType = 'image/png';
        else if (cleanExt === 'webp') contentType = 'image/webp';
      } else {
        const match = String(req.body.base64).match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          contentType = match[1];
          buffer = Buffer.from(match[2], 'base64');
          cleanExt = contentType.split('/')[1] || 'jpg';
        } else {
          contentType = 'image/jpeg';
          buffer = Buffer.from(req.body.base64, 'base64');
          cleanExt = 'jpg';
        }
      }

      const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
      const filePath = fileName;

      // 1. Save to local disk cache
      try {
        const localDir = path.join(__dirname, '../../uploads/merchant-documents');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        fs.writeFileSync(path.join(localDir, fileName), buffer);
      } catch (localErr) {
        console.warn('[Doc Upload] Local cache write warning:', localErr);
      }

      // 2. Upload to AWS S3
      await supabase.storage
        .from('merchant-documents')
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        });

      // 3. Return robust proxied streaming URL
      const proxyUrl = `${BASE_PUBLIC_API_URL}/shops/doc-file/merchant-documents/${fileName}`;

      return res.json({
        success: true,
        document_url: proxyUrl,
        file_url: proxyUrl,
        url: proxyUrl,
        file_name: fileName,
      });
    } catch (error: any) {
      console.error('[Merchant Doc Upload] Catch error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to upload document' });
    }
  }
);

// 1.3 GET /registration-status/:mobile: Public status tracking for merchant onboarding
router.get('/registration-status/:mobile', async (req, res) => {
  try {
    let cleanMobile = String(req.params.mobile || '').replace(/[^\d]/g, '');
    if (cleanMobile.length === 10) cleanMobile = '91' + cleanMobile;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, phone, role')
      .eq('phone', cleanMobile)
      .maybeSingle();

    if (!profile) {
      return res.json({ success: true, status: 'not_found', message: 'No registration application found for this mobile number.' });
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (!shop) {
      return res.json({ success: true, status: 'not_found', message: 'No shop registered for this user.' });
    }

    return res.json({
      success: true,
      status: shop.status, // 'pending' | 'approved' | 'rejected'
      shop: {
        id: shop.id,
        shop_name: shop.shop_name,
        owner_name: shop.owner_name || profile.name,
        phone: profile.phone,
        status: shop.status,
        rejection_reason: shop.rejection_reason || null,
        city: shop.city,
        area_name: shop.area_name,
        street_address: shop.street_address,
        detailed_address: shop.detailed_address,
        aadhaar_number: shop.aadhaar_number,
        aadhaar_doc_url: shop.aadhaar_doc_url,
        fssai_number: shop.fssai_number,
        fssai_doc_url: shop.fssai_doc_url,
        pan_number: shop.pan_number,
        pan_doc_url: shop.pan_doc_url,
        gstin: shop.gstin,
        shop_photo_url: shop.shop_photo_url,
        latitude: shop.latitude != null ? parseFloat(String(shop.latitude)) : null,
        longitude: shop.longitude != null ? parseFloat(String(shop.longitude)) : null,
        created_at: shop.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 2. POST /:shop_id/status: Approve/Reject a shop with optional GPS & Area assignment (Super Admin only)
router.post('/:shop_id/status', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  const {
    status,
    rejection_reason,
    latitude,
    longitude,
    delivery_radius_km,
    free_delivery_radius_km,
    extra_delivery_fee_per_km,
    area_name,
    city,
    pincode,
  } = req.body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const updatePayload: Record<string, any> = { status };
    if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason;
    if (status === 'approved') updatePayload.rejection_reason = null;

    if (latitude != null && !isNaN(parseFloat(String(latitude)))) updatePayload.latitude = parseFloat(String(latitude));
    if (longitude != null && !isNaN(parseFloat(String(longitude)))) updatePayload.longitude = parseFloat(String(longitude));
    if (delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km)))) updatePayload.delivery_radius_km = parseFloat(String(delivery_radius_km));
    if (area_name && String(area_name).trim()) updatePayload.area_name = String(area_name).trim();
    if (city && String(city).trim()) updatePayload.city = String(city).trim();
    if (pincode && String(pincode).trim()) updatePayload.pincode = String(pincode).trim();

    const { data: shop, error } = await supabase
      .from('shops')
      .update(updatePayload)
      .eq('id', shop_id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!shop) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    if (status === 'approved') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', shop.owner_id);

      if (profileError) {
        console.error('Failed to elevate user to admin:', profileError.message);
      }
    } else if (status === 'rejected') {
      try {
        await supabase
          .from('profiles')
          .update({ role: 'customer' })
          .eq('id', shop.owner_id);
      } catch {}
    }

    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;
    if (!db.shop_territories) db.shop_territories = [];
    
    let tIdx = db.shop_territories.findIndex((t: any) => t.shop_id === shop_id);
    if (tIdx < 0) {
      db.shop_territories.push({
        shop_id,
        is_open: status === 'approved',
        delivery_radius_km: delivery_radius_km || 5.0,
      });
      tIdx = db.shop_territories.length - 1;
    }

    db.shop_territories[tIdx].is_open = status === 'approved';
    if (latitude != null && !isNaN(parseFloat(String(latitude)))) {
      db.shop_territories[tIdx].latitude = parseFloat(String(latitude));
    }
    if (longitude != null && !isNaN(parseFloat(String(longitude)))) {
      db.shop_territories[tIdx].longitude = parseFloat(String(longitude));
    }
    if (delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km)))) {
      db.shop_territories[tIdx].delivery_radius_km = parseFloat(String(delivery_radius_km));
    }
    if (area_name && String(area_name).trim()) {
      db.shop_territories[tIdx].area_name = String(area_name).trim();
    }
    if (city && String(city).trim()) {
      db.shop_territories[tIdx].city = String(city).trim();
    }
    if (pincode && String(pincode).trim()) {
      db.shop_territories[tIdx].pincode = String(pincode).trim();
    }
    if (free_delivery_radius_km != null && !isNaN(parseFloat(String(free_delivery_radius_km)))) {
      db.shop_territories[tIdx].free_delivery_radius_km = parseFloat(String(free_delivery_radius_km));
    }
    if (extra_delivery_fee_per_km != null && !isNaN(parseFloat(String(extra_delivery_fee_per_km)))) {
      db.shop_territories[tIdx].extra_delivery_fee_per_km = parseFloat(String(extra_delivery_fee_per_km));
    }

    const { additional_areas, assigned_areas } = req.body;

    if (status === 'approved') {
      const territory = db.shop_territories[tIdx];
      if (!db.serviceable_locations) db.serviceable_locations = [];
      if (!db.areas) db.areas = [];
      if (!db.cities) db.cities = [];

      const shopCity = (territory?.city || shop.city || city || '').trim();
      const shopArea = (territory?.area_name || shop.area_name || area_name || '').trim();
      const shopPin = (territory?.pincode || shop.pincode || pincode || '000000').trim();

      // Find matched master city
      let matchedCityObj = db.cities.find(
        (c: any) => c.name.trim().toLowerCase() === shopCity.toLowerCase() || c.id === shopCity
      );

      // Collect all areas to assign: primary area + additional selected areas
      const allAreasToAssign: Array<{ area_name: string; city: string; pincode: string }> = [];
      if (shopArea) {
        allAreasToAssign.push({ area_name: shopArea, city: matchedCityObj ? matchedCityObj.name : shopCity, pincode: shopPin });
      }

      const rawAdditional = assigned_areas || additional_areas || [];
      if (Array.isArray(rawAdditional)) {
        for (const item of rawAdditional) {
          const aName = typeof item === 'string' ? item.trim() : (item.area_name || '').trim();
          const aCity = (typeof item === 'object' && item.city ? item.city : (matchedCityObj ? matchedCityObj.name : shopCity)).trim();
          const aPin = (typeof item === 'object' && item.pincode ? item.pincode : shopPin).trim();
          if (aName && !allAreasToAssign.some((x) => x.area_name.toLowerCase() === aName.toLowerCase() && x.city.toLowerCase() === aCity.toLowerCase())) {
            allAreasToAssign.push({ area_name: aName, city: aCity, pincode: aPin || '000000' });
          }
        }
      }

      // Link each registered area in db.serviceable_locations
      for (const target of allAreasToAssign) {
        // 1. Sync in db.serviceable_locations
        const existingLoc = db.serviceable_locations.find(
          (loc: any) =>
            String(loc.city || '').trim().toLowerCase() === target.city.toLowerCase() &&
            String(loc.area_name || '').trim().toLowerCase() === target.area_name.toLowerCase()
        );
        if (existingLoc) {
          existingLoc.shop_id = shop_id;
          existingLoc.is_serviceable = true;
          if (target.pincode && target.pincode !== '000000') existingLoc.pincode = target.pincode;
        } else {
          db.serviceable_locations.push({
            id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            city: target.city,
            area_name: target.area_name,
            pincode: target.pincode || '000000',
            is_serviceable: true,
            shop_id: shop_id,
          });
        }
      }
    } else if (status === 'rejected' && db.serviceable_locations) {
      db.serviceable_locations = db.serviceable_locations.map((loc: any) => {
        if (loc.shop_id === shop_id) {
          return { ...loc, shop_id: null, is_serviceable: false };
        }
        return loc;
      });
    }
    writeDb(db);

    return res.json({ 
      success: true, 
      message: `Shop status updated to ${status}`, 
      shop: {
        ...shop,
        ...db.shop_territories[tIdx]
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 2.1 PUT /:shop_id/location: Update shop coordinates and delivery radius directly (Super Admin only)
router.put('/:shop_id/location', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  const { latitude, longitude, delivery_radius_km, address_line, city, area_name, pincode } = req.body;

  try {
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;
    if (!db.shop_territories) db.shop_territories = [];

    let tIdx = db.shop_territories.findIndex((t: any) => t.shop_id === shop_id);
    if (tIdx < 0) {
      db.shop_territories.push({ shop_id, is_open: true });
      tIdx = db.shop_territories.length - 1;
    }

    if (latitude != null && !isNaN(parseFloat(String(latitude)))) {
      db.shop_territories[tIdx].latitude = parseFloat(String(latitude));
    }
    if (longitude != null && !isNaN(parseFloat(String(longitude)))) {
      db.shop_territories[tIdx].longitude = parseFloat(String(longitude));
    }
    if (delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km)))) {
      db.shop_territories[tIdx].delivery_radius_km = parseFloat(String(delivery_radius_km));
    }
    if (address_line !== undefined) db.shop_territories[tIdx].address_line = String(address_line).trim();
    if (city !== undefined) db.shop_territories[tIdx].city = String(city).trim();
    if (area_name !== undefined) db.shop_territories[tIdx].area_name = String(area_name).trim();
    if (pincode !== undefined) db.shop_territories[tIdx].pincode = String(pincode).trim();

    writeDb(db);
    return res.json({ success: true, message: 'Shop location updated successfully', territory: db.shop_territories[tIdx] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 2.2 POST /self-register: Public Merchant Self-Registration with Legal Documents & GPS Coordinates
router.post('/self-register', async (req, res) => {
  const {
    shop_name,
    owner_name,
    owner_mobile,
    mobile,
    email,
    city,
    area_name,
    address_line,
    street_address,
    detailed_address,
    pincode,
    state_name,
    district_name,
    latitude,
    longitude,
    delivery_radius_km,
    aadhaar_number,
    aadhaar_doc_url,
    fssai_number,
    fssai_doc_url,
    pan_number,
    pan_doc_url,
    gstin,
    shop_photo_url,
  } = req.body;

  const resolvedMobile = owner_mobile || mobile;
  if (!shop_name?.trim() || !owner_name?.trim() || !resolvedMobile) {
    return res.status(400).json({ success: false, error: 'Store name, owner name, and mobile number are required' });
  }

  if (!aadhaar_doc_url) {
    return res.status(400).json({ success: false, error: 'Aadhaar Card document upload is mandatory for store registration.' });
  }

  if (pincode && String(pincode).trim()) {
    const pinVal = validateIndianPincode(String(pincode));
    if (!pinVal.isValid) {
      return res.status(400).json({ success: false, error: pinVal.error });
    }
  }

  let cleanMobile = String(resolvedMobile).replace(/[^\d]/g, '');
  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  }

  try {
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;

    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, name, phone, role')
      .eq('phone', cleanMobile)
      .maybeSingle();

    let ownerId: string;
    if (existingProfile) {
      ownerId = existingProfile.id;
      // Check if user already has an active shop
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id, shop_name, status')
        .eq('owner_id', ownerId)
        .maybeSingle();

      if (existingShop && existingShop.status === 'approved') {
        return res.status(400).json({ success: false, error: 'A store with this mobile number is already approved and registered.' });
      }
      if (existingShop && existingShop.status === 'pending') {
        // Update the pending shop application with newly uploaded details
        const parsedLat = latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
        const parsedLng = longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;

        await supabase
          .from('shops')
          .update({
            shop_name: shop_name.trim(),
            owner_name: owner_name.trim(),
            phone: cleanMobile,
            email: email?.trim() || null,
            city: city?.trim() || 'Pune',
            area_name: area_name?.trim() || '',
            address: (detailed_address || address_line || '').trim(),
            address_line: (address_line || detailed_address || '').trim(),
            street_address: street_address?.trim() || null,
            detailed_address: detailed_address?.trim() || null,
            pincode: pincode?.trim() || '',
            state_name: state_name?.trim() || 'Maharashtra',
            district_name: district_name?.trim() || 'Pune',
            latitude: parsedLat,
            longitude: parsedLng,
            aadhaar_number: aadhaar_number?.trim() || null,
            aadhaar_doc_url: aadhaar_doc_url || null,
            fssai_number: fssai_number?.trim() || null,
            fssai_doc_url: fssai_doc_url || null,
            pan_number: pan_number?.trim() || null,
            pan_doc_url: pan_doc_url || null,
            gstin: gstin?.trim() || null,
            shop_photo_url: shop_photo_url || null,
            onboarding_source: 'merchant_app',
            status: 'pending',
          })
          .eq('id', existingShop.id);

        if (!db.shop_territories) db.shop_territories = [];
        db.shop_territories = db.shop_territories.filter((t: any) => t.shop_id !== existingShop.id);
        db.shop_territories.push({
          shop_id: existingShop.id,
          state_name: state_name?.trim() || 'Maharashtra',
          district_name: district_name?.trim() || 'Pune',
          city: city?.trim() || 'Pune',
          area_name: area_name?.trim() || '',
          address_line: (detailed_address || address_line || '').trim(),
          street_address: street_address?.trim() || '',
          detailed_address: detailed_address?.trim() || '',
          pincode: pincode?.trim() || '',
          latitude: parsedLat,
          longitude: parsedLng,
          delivery_radius_km: delivery_radius_km || 5.0,
          free_delivery_radius_km: 5.0,
          extra_delivery_fee_per_km: 10.0,
          aadhaar_doc_url: aadhaar_doc_url || null,
          fssai_doc_url: fssai_doc_url || null,
          pan_doc_url: pan_doc_url || null,
          shop_photo_url: shop_photo_url || null,
          is_open: false,
        });
        writeDb(db);

        return res.status(200).json({ 
          success: true, 
          message: 'Your registration application was updated and is pending Admin approval.',
          status: 'pending',
          shop_id: existingShop.id
        });
      }
    } else {
      const { data: newProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          phone: cleanMobile,
          name: owner_name.trim(),
          email: email?.trim() || null,
          role: 'customer',
        })
        .select()
        .single();

      if (profileErr || !newProfile) {
        return res.status(500).json({ success: false, error: profileErr?.message || 'Failed to create owner profile' });
      }
      ownerId = newProfile.id;
    }

    const parsedLat = latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
    const parsedLng = longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;
    const radius = delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km))) ? parseFloat(String(delivery_radius_km)) : 5.0;

    const fullAddr = (detailed_address ? `${detailed_address}, ${street_address || ''}` : (address_line || '')).trim();

    const { data: newShop, error: shopErr } = await supabase
      .from('shops')
      .insert({
        owner_id: ownerId,
        shop_name: shop_name.trim(),
        owner_name: owner_name.trim(),
        phone: cleanMobile,
        email: email?.trim() || null,
        city: city?.trim() || 'Pune',
        area_name: area_name?.trim() || '',
        address: fullAddr,
        address_line: address_line?.trim() || fullAddr,
        street_address: street_address?.trim() || null,
        detailed_address: detailed_address?.trim() || null,
        pincode: pincode?.trim() || '',
        state_name: state_name?.trim() || 'Maharashtra',
        district_name: district_name?.trim() || 'Pune',
        latitude: parsedLat,
        longitude: parsedLng,
        delivery_radius_km: radius,
        aadhaar_number: aadhaar_number?.trim() || null,
        aadhaar_doc_url: aadhaar_doc_url || null,
        fssai_number: fssai_number?.trim() || null,
        fssai_doc_url: fssai_doc_url || null,
        pan_number: pan_number?.trim() || null,
        pan_doc_url: pan_doc_url || null,
        gstin: gstin?.trim() || null,
        shop_photo_url: shop_photo_url || null,
        onboarding_source: 'merchant_app',
        status: 'pending',
      })
      .select()
      .single();

    if (shopErr || !newShop) {
      return res.status(500).json({ success: false, error: shopErr?.message || 'Failed to submit store registration' });
    }

    if (!db.shop_territories) db.shop_territories = [];
    db.shop_territories = db.shop_territories.filter((t: any) => t.shop_id !== newShop.id);
    db.shop_territories.push({
      shop_id: newShop.id,
      state_name: state_name?.trim() || 'Maharashtra',
      district_name: district_name?.trim() || 'Pune',
      city: city?.trim() || 'Pune',
      area_name: area_name?.trim() || '',
      address_line: fullAddr,
      street_address: street_address?.trim() || '',
      detailed_address: detailed_address?.trim() || '',
      pincode: pincode?.trim() || '',
      latitude: parsedLat,
      longitude: parsedLng,
      delivery_radius_km: radius,
      free_delivery_radius_km: 5.0,
      extra_delivery_fee_per_km: 10.0,
      aadhaar_doc_url: aadhaar_doc_url || null,
      fssai_doc_url: fssai_doc_url || null,
      pan_doc_url: pan_doc_url || null,
      shop_photo_url: shop_photo_url || null,
      is_open: false,
    });

    writeDb(db);

    return res.json({
      success: true,
      message: 'Store registration with documents submitted successfully! Web Admin will review and approve your store.',
      shop: {
        id: newShop.id,
        shop_name: newShop.shop_name,
        owner_name: newShop.owner_name,
        status: 'pending',
        latitude: parsedLat,
        longitude: parsedLng,
        city: city?.trim() || '',
        area_name: area_name?.trim() || '',
        street_address: street_address?.trim() || '',
        detailed_address: detailed_address?.trim() || '',
        aadhaar_number: newShop.aadhaar_number,
        fssai_number: newShop.fssai_number,
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3. POST /register: Create/Register a new shop and owner profile (Super Admin direct onboard)
router.post('/register', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const {
    shop_name,
    owner_name,
    owner_mobile,
    email,
    state_id,
    district_id,
    state_name: customStateName,
    district_name: customDistrictName,
    city,
    area_name,
    address_line,
    street_address,
    detailed_address,
    pincode,
    latitude,
    longitude,
    delivery_radius_km,
    aadhaar_number,
    aadhaar_doc_url,
    fssai_number,
    fssai_doc_url,
    pan_number,
    pan_doc_url,
    gstin,
    shop_photo_url,
    status: initialStatus = 'approved',
  } = req.body;

  if (!shop_name || !shop_name.trim() || !owner_name || !owner_name.trim() || !owner_mobile) {
    return res.status(400).json({ success: false, error: 'Shop name, owner name, and owner mobile number are required' });
  }

  let cleanMobile = String(owner_mobile).replace(/[^\d]/g, '');
  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  }

  try {
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb();
    const state = (db.states || []).find((s: any) => s.id === state_id);
    const district = (db.districts || []).find((d: any) => d.id === district_id);

    const resolvedStateName = state?.name || customStateName || 'Maharashtra';
    const resolvedDistrictName = district?.name || customDistrictName || 'Pune';
    const cityName = (city || 'Pune').trim();

    let { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanMobile)
      .maybeSingle();

    let ownerId: string;

    if (existingProfile) {
      ownerId = existingProfile.id;
      const { error: updateRoleError } = await supabase
        .from('profiles')
        .update({ role: 'admin', name: owner_name.trim(), email: email?.trim() || null })
        .eq('id', ownerId);

      if (updateRoleError) {
        return res.status(500).json({ success: false, error: 'Failed to update owner profile role: ' + updateRoleError.message });
      }
    } else {
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        phone: cleanMobile,
        email: email?.trim() || undefined,
        user_metadata: { name: owner_name.trim(), role: 'admin' }
      });

      if (createUserError || !newUser?.user) {
        return res.status(500).json({ success: false, error: createUserError?.message || 'Failed to create owner user' });
      }

      ownerId = newUser.user.id;

      await supabase
        .from('profiles')
        .upsert({
          id: ownerId,
          phone: cleanMobile,
          email: email?.trim() || null,
          role: 'admin',
          name: owner_name.trim()
        });
    }

    let { data: existingShop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingShop) {
      return res.status(400).json({ success: false, error: 'This owner already has a registered shop.' });
    }

    const parsedLat = latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
    const parsedLng = longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;
    const radius = delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km))) ? parseFloat(String(delivery_radius_km)) : 5.0;
    const fullAddr = (detailed_address ? `${detailed_address}, ${street_address || ''}` : (address_line || '')).trim();

    const shopPayload: Record<string, any> = {
      owner_id: ownerId,
      shop_name: shop_name.trim(),
      owner_name: owner_name.trim(),
      phone: cleanMobile,
      email: email?.trim() || null,
      city: cityName,
      area_name: area_name?.trim() || '',
      address: fullAddr,
      address_line: address_line?.trim() || fullAddr,
      street_address: street_address?.trim() || null,
      detailed_address: detailed_address?.trim() || null,
      pincode: pincode?.trim() || '',
      state_name: resolvedStateName,
      district_name: resolvedDistrictName,
      latitude: parsedLat,
      longitude: parsedLng,
      delivery_radius_km: radius,
      aadhaar_number: aadhaar_number?.trim() || null,
      aadhaar_doc_url: aadhaar_doc_url || null,
      fssai_number: fssai_number?.trim() || null,
      fssai_doc_url: fssai_doc_url || null,
      pan_number: pan_number?.trim() || null,
      pan_doc_url: pan_doc_url || null,
      gstin: gstin?.trim() || null,
      shop_photo_url: shop_photo_url || null,
      onboarding_source: 'web_admin_direct',
      status: initialStatus,
    };

    const { data: newShop, error: createShopError } = await supabase
      .from('shops')
      .insert(shopPayload)
      .select()
      .single();

    if (createShopError || !newShop) {
      return res.status(500).json({ success: false, error: createShopError?.message || 'Failed to create shop' });
    }

    if (!db.shop_territories) db.shop_territories = [];
    db.shop_territories = db.shop_territories.filter((t: any) => t.shop_id !== newShop.id);
    db.shop_territories.push({
      shop_id: newShop.id,
      state_id: state?.id || null,
      state_name: resolvedStateName,
      district_id: district?.id || null,
      district_name: resolvedDistrictName,
      city: cityName,
      area_name: area_name?.trim() || '',
      address_line: fullAddr,
      street_address: street_address?.trim() || '',
      detailed_address: detailed_address?.trim() || '',
      pincode: pincode?.trim() || '',
      latitude: parsedLat,
      longitude: parsedLng,
      delivery_radius_km: radius,
      is_open: initialStatus === 'approved',
    });

    // Auto-link or create serviceable locality for this store
    if (area_name?.trim()) {
      if (!db.serviceable_locations) db.serviceable_locations = [];
      const cleanPin = pincode ? String(pincode).replace(/\D/g, '').slice(0, 6) : '';
      const existingLoc = db.serviceable_locations.find(
        (loc: any) =>
          String(loc.city || '').trim().toLowerCase() === cityName.toLowerCase() &&
          String(loc.area_name || '').trim().toLowerCase() === area_name.trim().toLowerCase()
      );
      if (existingLoc) {
        existingLoc.shop_id = newShop.id;
        existingLoc.is_serviceable = true;
        if (cleanPin) existingLoc.pincode = cleanPin;
      } else {
        db.serviceable_locations.push({
          id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          city: cityName,
          area_name: area_name.trim(),
          pincode: cleanPin || '000000',
          is_serviceable: true,
          shop_id: newShop.id,
        });
      }

      // Also auto-assign all master areas in db.areas under this pincode if unassigned
      if (cleanPin && cleanPin.length === 6) {
        const matchingAreas = (db.areas || []).filter(
          (a: any) => String(a?.pincode || '').trim() === cleanPin
        );
        for (const area of matchingAreas) {
          if (!area || !area.name) continue;
          const areaLoc = db.serviceable_locations.find(
            (loc: any) =>
              String(loc.area_name || '').trim().toLowerCase() === String(area.name || '').trim().toLowerCase() &&
              String(loc.pincode || '').trim() === cleanPin
          );
          if (areaLoc) {
            if (!areaLoc.shop_id) {
              areaLoc.shop_id = newShop.id;
            }
          } else {
            db.serviceable_locations.push({
              id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              city: cityName,
              area_name: String(area.name).trim(),
              pincode: cleanPin,
              is_serviceable: true,
              shop_id: newShop.id,
            });
          }
        }
      }
    }

    writeDb(db);

    return res.json({
      success: true,
      message: 'Store registered successfully',
      shop: {
        ...newShop,
        state_name: state?.name || resolvedStateName,
        district_name: district?.name || resolvedDistrictName,
        city: cityName,
        area_name: area_name?.trim() || '',
        address_line: address_line?.trim() || '',
        pincode: pincode?.trim() || '',
        latitude: parsedLat,
        longitude: parsedLng,
        delivery_radius_km: radius,
        is_open: true,
      },
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 4. DELETE /:shop_id: Delete a store and its territory (Super Admin only)
router.delete('/:shop_id', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;

  try {
    // 1. Delete dependent order items and orders to avoid foreign key errors
    try {
      const { data: relatedOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('shop_id', shop_id);

      if (relatedOrders && relatedOrders.length > 0) {
        const orderIds = relatedOrders.map((o: any) => o.id);
        await supabase.from('order_items').delete().in('order_id', orderIds);
        await supabase.from('orders').delete().eq('shop_id', shop_id);
      }
    } catch (e: any) {
      console.warn('Notice clearing related orders:', e.message);
    }

    // 2. Delete shop products if any in supabase
    try {
      await supabase.from('shop_products').delete().eq('shop_id', shop_id);
    } catch {}

    // 3. Delete shop from Supabase
    const { error: shopDelError } = await supabase
      .from('shops')
      .delete()
      .eq('id', shop_id);

    if (shopDelError) {
      return res.status(500).json({ success: false, error: shopDelError.message });
    }

    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb() as any;
    if (db.shop_territories) {
      db.shop_territories = db.shop_territories.filter((t: any) => t.shop_id !== shop_id);
    }
    if (db.shop_products) {
      db.shop_products = db.shop_products.filter((sp: any) => sp.shop_id !== shop_id);
    }
    if (db.serviceable_locations) {
      db.serviceable_locations = db.serviceable_locations.filter((loc: any) => loc.shop_id !== shop_id);
    }
    if (db.orders) {
      db.orders = db.orders.filter((o: any) => o.shop_id !== shop_id);
    }
    writeDb(db);

    return res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
