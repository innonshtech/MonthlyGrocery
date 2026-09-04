import { Router } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

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
    // 1. Update the shop status
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

    // 2. If approved, elevate the owner profile to 'admin' (merchant)
    if (status === 'approved') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', shop.owner_id);

      if (profileError) {
        console.error('Failed to elevate user to admin:', profileError.message);
      }
    }

    return res.json({ success: true, message: `Shop status updated to ${status}`, shop });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 3. POST /register: Create/Register a new shop and owner profile (Super Admin only)
router.post('/register', authMiddleware, requireRole(['super_admin']), async (req: AuthRequest, res) => {
  const { shop_name, owner_name, owner_mobile, state_id, district_id, city } = req.body;

  if (!shop_name || !shop_name.trim() || !owner_name || !owner_name.trim() || !owner_mobile) {
    return res.status(400).json({ success: false, error: 'Shop name, owner name, and owner mobile number are required' });
  }

  if (!state_id || !district_id || !city?.trim()) {
    return res.status(400).json({ success: false, error: 'State, district, and city are required for merchant access' });
  }

  // Normalize phone (pure digits, 10 digit check)
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
    // 1. Check if the owner profile already exists in public.profiles (case of returning consumer upgraded to merchant)
    let { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanMobile)
      .maybeSingle();

    let ownerId: string;

    if (existingProfile) {
      ownerId = existingProfile.id;
      // Upgrade role to admin if not already, and update name
      const { error: updateRoleError } = await supabase
        .from('profiles')
        .update({ role: 'admin', name: owner_name.trim() })
        .eq('id', ownerId);

      if (updateRoleError) {
        return res.status(500).json({ success: false, error: 'Failed to update owner profile role: ' + updateRoleError.message });
      }
    } else {
      // Create a new auth user in Supabase Auth using Auth Admin API
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        phone: cleanMobile,
        phone_confirm: true,
        user_metadata: { name: owner_name.trim(), role: 'admin' }
      });

      if (createUserError || !newUser.user) {
        return res.status(500).json({ success: false, error: createUserError?.message || 'Failed to create owner user' });
      }

      ownerId = newUser.user.id;

      // Upsert profiles row
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: ownerId,
          phone: cleanMobile,
          role: 'admin',
          name: owner_name.trim()
        });

      if (insertProfileError) {
        console.error('Failed to create profile row:', insertProfileError.message);
      }
    }

    // 2. Check if this owner already owns a shop
    let { data: existingShop, error: shopCheckError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingShop) {
      return res.status(400).json({ success: false, error: 'This owner already has a registered shop.' });
    }

    // 3. Create the new shop
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

    if (!db.shop_territories) db.shop_territories = [];
    db.shop_territories = db.shop_territories.filter((t: any) => t.shop_id !== newShop.id);
    db.shop_territories.push({
      shop_id: newShop.id,
      state_id: state.id,
      state_name: state.name,
      district_id: district.id,
      district_name: district.name,
      city: cityName,
    });
    writeDb(db);

    return res.json({
      success: true,
      message: 'Store registered successfully',
      shop: {
        ...newShop,
        state_name: state.name,
        district_name: district.name,
        city: cityName,
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
    writeDb(db);

    return res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
