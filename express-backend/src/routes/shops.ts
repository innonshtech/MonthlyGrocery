import { Router } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { getMerchantShopForUser } from '../services/shopResolution';

const router = Router();

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

// 0.1 PUT /me/settings: Update merchant's store location, delivery radius, and open/closed status
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
      is_open,
    } = req.body;

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
      is_open: is_open !== undefined ? is_open === true : (idx >= 0 ? db.shop_territories[idx].is_open !== false : true),
    };

    if (idx >= 0) {
      db.shop_territories[idx] = updatedTerritory;
    } else {
      db.shop_territories.push(updatedTerritory);
    }
    writeDb(db);

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

// 1. GET /all: List all shops (Super Admin only)
router.get('/all', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select(`
        id,
        shop_name,
        status,
        created_at,
        profiles (
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const { readDb } = require('../config/localDb');
    const db = readDb();
    const territoryMap = new Map<string, any>((db.shop_territories || []).map((t: any) => [t.shop_id, t]));

    const enrichedShops = (shops || []).map((shop: any) => {
      const territory = territoryMap.get(shop.id);
      return {
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
        is_open: territory?.is_open !== false,
      };
    });

    return res.json({ success: true, shops: enrichedShops });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 2. POST /:shop_id/status: Approve/Reject a shop (Super Admin only)
router.post('/:shop_id/status', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const { data: shop, error } = await supabase
      .from('shops')
      .update({ status })
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
    if (db.shop_territories) {
      const tIdx = db.shop_territories.findIndex((t: any) => t.shop_id === shop_id);
      if (tIdx >= 0) {
        db.shop_territories[tIdx].is_open = status === 'approved';
      }
    }
    if (status === 'rejected' && db.serviceable_locations) {
      db.serviceable_locations = db.serviceable_locations.map((loc: any) => {
        if (loc.shop_id === shop_id) {
          return { ...loc, shop_id: null, is_serviceable: false };
        }
        return loc;
      });
    }
    writeDb(db);

    return res.json({ success: true, message: `Shop status updated to ${status}`, shop });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3. POST /register: Create/Register a new shop and owner profile (Super Admin only)
router.post('/register', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const {
    shop_name,
    owner_name,
    owner_mobile,
    state_id,
    district_id,
    city,
    area_name,
    address_line,
    pincode,
    latitude,
    longitude,
    delivery_radius_km,
  } = req.body;

  if (!shop_name || !shop_name.trim() || !owner_name || !owner_name.trim() || !owner_mobile) {
    return res.status(400).json({ success: false, error: 'Shop name, owner name, and owner mobile number are required' });
  }

  if (!state_id || !district_id || !city?.trim()) {
    return res.status(400).json({ success: false, error: 'State, district, and city are required for merchant access' });
  }

  let cleanMobile = owner_mobile.replace(/[^\d]/g, '');
  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  }

  try {
    const { readDb, writeDb } = require('../config/localDb');
    const db = readDb();
    const state = (db.states || []).find((s: any) => s.id === state_id);
    const district = (db.districts || []).find((d: any) => d.id === district_id);

    if (!state) {
      return res.status(400).json({ success: false, error: 'Selected state is invalid' });
    }
    if (!district || district.state_id !== state_id) {
      return res.status(400).json({ success: false, error: 'Selected district is invalid for this state' });
    }

    const cityName = city.trim();
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
        .update({ role: 'admin', name: owner_name.trim() })
        .eq('id', ownerId);

      if (updateRoleError) {
        return res.status(500).json({ success: false, error: 'Failed to update owner profile role: ' + updateRoleError.message });
      }
    } else {
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        phone: cleanMobile,
        phone_confirm: true,
        user_metadata: { name: owner_name.trim(), role: 'admin' }
      });

      if (createUserError || !newUser.user) {
        return res.status(500).json({ success: false, error: createUserError?.message || 'Failed to create owner user' });
      }

      ownerId = newUser.user.id;

      await supabase
        .from('profiles')
        .upsert({
          id: ownerId,
          phone: cleanMobile,
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

    const shopPayload: Record<string, any> = {
      owner_id: ownerId,
      shop_name: shop_name.trim(),
      status: 'approved',
    };

    let newShop: any = null;
    let createShopError: any = null;

    const primaryInsert = await supabase
      .from('shops')
      .insert({ ...shopPayload, city: cityName })
      .select()
      .single();

    if (primaryInsert.error) {
      const fallbackInsert = await supabase
        .from('shops')
        .insert(shopPayload)
        .select()
        .single();
      newShop = fallbackInsert.data;
      createShopError = fallbackInsert.error;
    } else {
      newShop = primaryInsert.data;
    }

    if (createShopError || !newShop) {
      return res.status(500).json({ success: false, error: createShopError?.message || 'Failed to create shop' });
    }

    const parsedLat = latitude != null && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
    const parsedLng = longitude != null && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;
    const radius = delivery_radius_km != null && !isNaN(parseFloat(String(delivery_radius_km))) ? parseFloat(String(delivery_radius_km)) : 5.0;

    if (!db.shop_territories) db.shop_territories = [];
    db.shop_territories = db.shop_territories.filter((t: any) => t.shop_id !== newShop.id);
    db.shop_territories.push({
      shop_id: newShop.id,
      state_id: state.id,
      state_name: state.name,
      district_id: district.id,
      district_name: district.name,
      city: cityName,
      area_name: area_name?.trim() || '',
      address_line: address_line?.trim() || '',
      pincode: pincode?.trim() || '',
      latitude: parsedLat,
      longitude: parsedLng,
      delivery_radius_km: radius,
      is_open: true,
    });

    // Auto-link or create serviceable locality for this store
    if (area_name?.trim()) {
      if (!db.serviceable_locations) db.serviceable_locations = [];
      const cleanPin = pincode ? String(pincode).replace(/\D/g, '').slice(0, 6) : '';
      const existingLoc = db.serviceable_locations.find(
        (loc: any) =>
          loc.city.trim().toLowerCase() === cityName.toLowerCase() &&
          loc.area_name.trim().toLowerCase() === area_name.trim().toLowerCase()
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
    }

    writeDb(db);

    return res.json({
      success: true,
      message: 'Store registered successfully',
      shop: {
        ...newShop,
        state_name: state.name,
        district_name: district.name,
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
