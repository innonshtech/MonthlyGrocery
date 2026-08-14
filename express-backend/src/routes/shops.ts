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

    return res.json({ success: true, shops: shops || [] });
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
  const { shop_name, owner_name, owner_mobile } = req.body;

  if (!shop_name || !shop_name.trim() || !owner_name || !owner_name.trim() || !owner_mobile) {
    return res.status(400).json({ success: false, error: 'Shop name, owner name, and owner mobile number are required' });
  }

  // Normalize phone (pure digits, 10 digit check)
  let cleanMobile = owner_mobile.replace(/[^\d]/g, '');
  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  }

  try {
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
    const { data: newShop, error: createShopError } = await supabase
      .from('shops')
      .insert({
        owner_id: ownerId,
        shop_name: shop_name.trim(),
        status: 'approved' // Direct Super Admin registration is auto-approved
      })
      .select()
      .single();

    if (createShopError || !newShop) {
      return res.status(500).json({ success: false, error: createShopError?.message || 'Failed to create shop' });
    }

    return res.json({
      success: true,
      message: 'Store registered successfully',
      shop: newShop
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
