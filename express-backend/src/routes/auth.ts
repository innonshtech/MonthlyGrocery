import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { sendOtp, verifyOtp } from '../services/twilioOtpService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-me';
const SUPER_ADMIN_MOBILE = process.env.SUPER_ADMIN_MOBILE || '+918830480015';
const SUPER_ADMIN_MOBILE_CLEAN = SUPER_ADMIN_MOBILE.replace(/[^\d]/g, '');

// Helper to normalize phone to digits only (e.g. 918830480015)
function normalizePhone(phone: string): string {
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }
  return clean;
}

// Check if a mobile number belongs to a registered merchant / store partner
async function isRegisteredMerchant(normalizedPhone: string): Promise<boolean> {
  if (normalizedPhone === SUPER_ADMIN_MOBILE_CLEAN) {
    return true;
  }

  try {
    // 1. Check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (profile) {
      if (profile.role === 'admin' || profile.role === 'super_admin') {
        return true;
      }
      // Check if user owns a shop
      const { data: shop } = await supabase
        .from('shops')
        .select('id, status')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (shop) {
        return true;
      }
    }

    // 2. Check shops table directly by phone number
    const { data: shopByPhone } = await supabase
      .from('shops')
      .select('id, status')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (shopByPhone) {
      return true;
    }

    const { data: shopByPhonePlus } = await supabase
      .from('shops')
      .select('id, status')
      .eq('phone', '+' + normalizedPhone)
      .maybeSingle();

    if (shopByPhonePlus) {
      return true;
    }
  } catch (err) {
    console.warn('[isRegisteredMerchant] Database check error:', err);
  }

  return false;
}

// Check if a mobile number is authorized as Super Admin
async function isAuthorizedSuperAdmin(normalizedPhone: string): Promise<boolean> {
  if (normalizedPhone === SUPER_ADMIN_MOBILE_CLEAN) {
    return true;
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (profile && profile.role === 'super_admin') {
      return true;
    }
  } catch (err) {
    console.warn('[isAuthorizedSuperAdmin] DB check error:', err);
  }

  return false;
}

// 1. Send OTP Endpoint
router.post('/send-otp', async (req, res) => {
  const { mobile, role } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }

  const normalized = normalizePhone(mobile);

  // Validate merchant / super_admin registration before sending SMS OTP
  if (role === 'admin') {
    const isRegistered = await isRegisteredMerchant(normalized);
    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        error: 'This mobile number is not registered as a store partner. Please sign up and register your store first.',
      });
    }
  } else if (role === 'super_admin') {
    const isSuperAdmin = await isAuthorizedSuperAdmin(normalized);
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: This mobile number is not registered as an authorized Super Admin.',
      });
    }
  }

  try {
    const result = await sendOtp(normalized);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send OTP',
      });
    }

    return res.json({
      success: true,
      message: result.message,
      mobile: normalized,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (error: any) {
    console.error('[Auth send-otp] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error sending OTP',
    });
  }
});

// 2. Verify OTP Endpoint
router.post('/verify-otp', async (req, res) => {
  const { mobile, code, name, role } = req.body;
  if (!mobile || !code) {
    return res.status(400).json({ success: false, error: 'Mobile number and OTP code are required' });
  }

  const normalized = normalizePhone(mobile);

  try {
    const verification = await verifyOtp(normalized, code);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: verification.error || 'Invalid or expired OTP code',
      });
    }

    // Check if profile already exists in Supabase
    let { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalized)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ success: false, error: fetchError.message });
    }

    const selectedRole = normalized === SUPER_ADMIN_MOBILE_CLEAN ? 'super_admin' : (role || 'consumer');

    // If profile does not exist, create user in Supabase Auth & ensure row in profiles table
    if (!profile) {
      let createdUserId: string | undefined;

      const { data: authUser } = await supabase.auth.admin.createUser({
        phone: '+' + normalized,
        phone_confirm: true,
        user_metadata: {
          name: name || 'User',
          role: selectedRole,
        }
      });

      if (authUser?.user) {
        createdUserId = authUser.user.id;
      }

      // Fetch the profile if created by auth trigger
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', normalized)
        .maybeSingle();

      if (newProfile) {
        profile = newProfile;
      } else {
        // Insert directly into profiles table
        const { data: directProfile, error: directError } = await supabase
          .from('profiles')
          .insert({
            id: createdUserId,
            phone: normalized,
            name: name || 'User',
            role: selectedRole,
          })
          .select()
          .single();

        if (directError) {
          return res.status(500).json({ success: false, error: directError.message });
        }
        profile = directProfile;
      }
    }

    // Force super_admin role check if matching environment config
    if (normalized === SUPER_ADMIN_MOBILE_CLEAN && profile.role !== 'super_admin') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', profile.id)
        .select()
        .single();

      if (!updateError && updatedProfile) {
        profile = updatedProfile;
      }
    }

    // Merchant login: upgrade profile to 'admin' role if owning a shop or registered merchant
    if (role === 'admin' && profile.role !== 'super_admin') {
      let isMerchant = profile.role === 'admin';
      if (!isMerchant) {
        // Check by owner_id
        const { data: shopByOwner } = await supabase
          .from('shops')
          .select('id, status')
          .eq('owner_id', profile.id)
          .maybeSingle();

        if (shopByOwner) {
          isMerchant = true;
        } else {
          // Check by phone number
          const { data: shopByPhone } = await supabase
            .from('shops')
            .select('id, status')
            .eq('phone', normalized)
            .maybeSingle();

          if (shopByPhone) {
            isMerchant = true;
          }
        }
      }

      if (isMerchant) {
        const { data: upgradedProfile, error: upgradeError } = await supabase
          .from('profiles')
          .update({ role: 'admin', ...(name ? { name: String(name).trim() } : {}) })
          .eq('id', profile.id)
          .select()
          .single();

        if (!upgradeError && upgradedProfile) {
          profile = upgradedProfile;
        } else {
          profile.role = 'admin';
        }
      }
    }

    // Generate JWT payload
    const token = jwt.sign(
      { id: profile.id, mobile: profile.phone, role: profile.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: profile.id,
        mobile: profile.phone,
        name: profile.name || name || 'User',
        role: profile.role,
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during verification' });
  }
});

// 3. Get Current User profile
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    let email = '';
    let avatar_url = profile.avatar_url || '';
    const { data: authUser } = await supabase.auth.admin.getUserById(req.user.id);
    if (authUser?.user?.user_metadata?.email) {
      email = String(authUser.user.user_metadata.email).trim();
    }
    if (authUser?.user?.user_metadata?.avatar_url) {
      avatar_url = String(authUser.user.user_metadata.avatar_url).trim();
    }

    return res.json({
      success: true,
      user: {
        id: profile.id,
        mobile: profile.phone,
        name: profile.name,
        role: profile.role,
        email,
        avatar_url,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

router.get('/account-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { buildAccountSummary } = require('../services/accountSummary');
    const summary = await buildAccountSummary(req.user!.id);
    return res.json({ success: true, summary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 4. Update consumer profile (name + optional email metadata + avatar_url)
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { name, email, avatar_url } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }

  try {
    const updateData: any = { name: String(name).trim() };
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    // Try updating profiles table
    let { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      // If avatar_url column doesn't exist yet in profiles table, fall back to updating name only
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('profiles')
        .update({ name: String(name).trim() })
        .eq('id', req.user.id)
        .select()
        .single();
      
      if (fallbackError || !fallbackProfile) {
        return res.status(500).json({ success: false, error: fallbackError?.message || 'Failed to update profile' });
      }
      profile = fallbackProfile;
    }

    let savedEmail = '';
    const userMetadata: any = {};
    if (email && String(email).trim()) {
      savedEmail = String(email).trim();
      userMetadata.email = savedEmail;
    }
    if (avatar_url !== undefined) {
      userMetadata.avatar_url = avatar_url;
    }

    if (Object.keys(userMetadata).length > 0) {
      await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: userMetadata,
      });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(req.user.id);
    if (!savedEmail && authUser?.user?.user_metadata?.email) {
      savedEmail = String(authUser.user.user_metadata.email).trim();
    }
    const finalAvatarUrl = avatar_url ?? authUser?.user?.user_metadata?.avatar_url ?? profile?.avatar_url ?? '';

    return res.json({
      success: true,
      user: {
        id: profile.id,
        mobile: profile.phone,
        name: profile.name,
        role: profile.role,
        email: savedEmail,
        avatar_url: finalAvatarUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// 5. Upload avatar photo to Supabase Storage Bucket 'avatars'
router.post('/avatar', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, error: 'Image data is required' });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const filename = `${req.user.id}-${Date.now()}.jpg`;

    // Try uploading to Supabase Storage bucket 'avatars'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      // Create bucket if it doesn't exist
      await supabase.storage.createBucket('avatars', { public: true });
      const { data: retryData, error: retryError } = await supabase.storage
        .from('avatars')
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (retryError) {
        // Fallback to data URI if storage bucket creation fails
        const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
        return res.json({ success: true, avatar_url: dataUrl });
      }
    }

    // Get public URL of uploaded photo in Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    const avatarUrl = publicUrlData.publicUrl;

    return res.json({
      success: true,
      avatar_url: avatarUrl,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to upload avatar' });
  }
});

router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.user.role !== 'consumer') {
    return res.status(403).json({
      success: false,
      error: 'This account type cannot be deleted from the app.',
    });
  }

  try {
    const { deleteConsumerAccount } = require('../services/deleteAccount');
    const result = await deleteConsumerAccount(req.user.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to delete account' });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
