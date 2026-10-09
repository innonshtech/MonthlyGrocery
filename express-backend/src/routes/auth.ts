import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { sendOtp, verifyOtp, isTestPhoneNumber } from '../services/twilioOtpService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-me';
const SUPER_ADMIN_MOBILE = process.env.SUPER_ADMIN_MOBILE || '+918830480015';
const SUPER_ADMIN_MOBILE_CLEAN = SUPER_ADMIN_MOBILE.replace(/[^\d]/g, '');

// Helper to normalize phone to digits only (e.g. 918830480015)
export function isValidIndianPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[^\d]/g, '');
  let base10 = clean;
  if (clean.length === 12 && clean.startsWith('91')) {
    base10 = clean.slice(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    base10 = clean.slice(1);
  }
  return base10.length === 10 && /^[6-9]\d{9}$/.test(base10);
}

function normalizePhone(phone: string): string {
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }
  return clean;
}

// Check if a mobile number belongs to a registered merchant / store partner with status check
async function checkMerchantStatus(normalizedPhone: string): Promise<{ registered: boolean; status?: string; shopName?: string; rejection_reason?: string | null }> {
  if (normalizedPhone === SUPER_ADMIN_MOBILE_CLEAN || isTestPhoneNumber(normalizedPhone)) {
    return { registered: true, status: 'approved', shopName: 'MonthlyGrocery Test Store' };
  }

  try {
    // 1. Check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (profile) {
      if (profile.role === 'super_admin') {
        return { registered: true, status: 'approved' };
      }
      // Check if user owns a shop
      const { data: shop } = await supabase
        .from('shops')
        .select('id, shop_name, status, rejection_reason')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (shop) {
        return {
          registered: true,
          status: shop.status || 'approved',
          shopName: shop.shop_name,
          rejection_reason: shop.rejection_reason || null,
        };
      }

      // Admin role without a linked shop is not a valid merchant partner (no OTP bypass).
      if (profile.role === 'admin') {
        return { registered: false };
      }
    }

    // 2. Check shops table directly by phone number
    const { data: shopByPhone } = await supabase
      .from('shops')
      .select('id, shop_name, status, rejection_reason')
      .eq('phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (shopByPhone) {
      return {
        registered: true,
        status: shopByPhone.status || 'approved',
        shopName: shopByPhone.shop_name,
        rejection_reason: shopByPhone.rejection_reason || null,
      };
    }

    const { data: shopByPhonePlus } = await supabase
      .from('shops')
      .select('id, shop_name, status, rejection_reason')
      .eq('phone', '+' + normalizedPhone)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (shopByPhonePlus) {
      return {
        registered: true,
        status: shopByPhonePlus.status || 'approved',
        shopName: shopByPhonePlus.shop_name,
        rejection_reason: shopByPhonePlus.rejection_reason || null,
      };
    }
  } catch (err) {
    console.warn('[checkMerchantStatus] Database check error:', err);
  }

  return { registered: false };
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
  if (!mobile || !isValidIndianPhone(String(mobile))) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 10-digit mobile number',
    });
  }

  const normalized = normalizePhone(mobile);

  // Validate merchant / super_admin registration before sending SMS OTP
  if (role === 'admin') {
    const merchantCheck = await checkMerchantStatus(normalized);
    if (!merchantCheck.registered) {
      return res.status(403).json({
        success: false,
        code: 'NOT_REGISTERED',
        error: 'This mobile number is not registered as an authorized Kirana Store with MonthlyGrocery. Please register your store first to get onboarded.',
      });
    }
    if (merchantCheck.status === 'pending') {
      return res.status(403).json({
        success: false,
        code: 'PENDING_APPROVAL',
        error: `Your store registration ${merchantCheck.shopName ? `"${merchantCheck.shopName}" ` : ''}is currently under review. Please wait for Web Admin document verification and approval before signing in.`,
      });
    }
    if (merchantCheck.status === 'rejected') {
      const reasonSuffix = merchantCheck.rejection_reason
        ? ` Reason: ${merchantCheck.rejection_reason}.`
        : '';
      return res.status(403).json({
        success: false,
        code: 'REJECTED',
        rejection_reason: merchantCheck.rejection_reason || null,
        error: `Your store registration application was rejected by Web Admin.${reasonSuffix} Please contact support or submit a fresh registration.`,
      });
    }
  } else if (role === 'super_admin') {
    const isSuperAdmin = await isAuthorizedSuperAdmin(normalized);
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED_ADMIN',
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
  if (!mobile || !isValidIndianPhone(String(mobile))) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 10-digit mobile number',
    });
  }
  if (!code || String(code).trim().length < 4) {
    return res.status(400).json({
      success: false,
      error: 'Please enter the verification code',
    });
  }

  const normalized = normalizePhone(mobile);

  try {
    const verification = await verifyOtp(normalized, code);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        locked: verification.locked,
        remainingSeconds: verification.remainingSeconds,
        remainingAttempts: verification.remainingAttempts,
        error: verification.error || 'Invalid or expired OTP code',
      });
    }

    let isNewUser = false;

    // Check if profile already exists in Supabase
    let { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .or(`phone.eq.${normalized},phone.eq.+${normalized}`)
      .maybeSingle();

    if (fetchError) {
      console.warn('[verify-otp] fetch profile warning:', fetchError.message);
    }

    const selectedRole =
      role === 'super_admin' && normalized === SUPER_ADMIN_MOBILE_CLEAN
        ? 'super_admin'
        : (role === 'admin' ? 'admin' : 'customer');

    // If profile does not exist, create user in Supabase Auth & ensure row in profiles table
    if (!profile) {
      isNewUser = true;
      let createdUserId: string | undefined;

      try {
        const { data: authUser } = await supabase.auth.admin.createUser({
          phone: '+' + normalized,
          phone_confirm: true,
          user_metadata: {
            name: name || 'User',
            role: selectedRole,
          },
        });

        if (authUser?.user) {
          createdUserId = authUser.user.id;
        }
      } catch (authErr) {
        console.warn('[verify-otp] createUser warning:', authErr);
      }

      // Fetch the profile if created by auth trigger
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${normalized},phone.eq.+${normalized}${createdUserId ? `,id.eq.${createdUserId}` : ''}`)
        .maybeSingle();

      if (newProfile) {
        if (newProfile.phone !== normalized) {
          await supabase.from('profiles').update({ phone: normalized }).eq('id', newProfile.id);
          newProfile.phone = normalized;
        }
        profile = newProfile;
      } else {
        // Upsert into profiles table with conflict handling to avoid duplicate key errors
        const { data: directProfile, error: directError } = await supabase
          .from('profiles')
          .upsert({
            ...(createdUserId ? { id: createdUserId } : {}),
            phone: normalized,
            name: name || 'User',
            role: selectedRole,
          }, { onConflict: 'id' })
          .select()
          .single();

        if (directError) {
          // Fallback check if it was inserted concurrently
          const { data: fallbackProfile } = await supabase
            .from('profiles')
            .select('*')
            .or(`phone.eq.${normalized},phone.eq.+${normalized}`)
            .maybeSingle();

          if (fallbackProfile) {
            profile = fallbackProfile;
          } else {
            console.error('[verify-otp] Error creating profile:', directError);
            return res.status(500).json({ success: false, error: directError.message });
          }
        } else {
          profile = directProfile;
        }
      }
    } else {
      // If user exists but hasn't set their custom name yet, flag as new/incomplete user
      if (!profile.name || profile.name.trim() === 'User') {
        isNewUser = true;
      }
    }

    // Explicit super_admin login requested from Admin Portal
    if (role === 'super_admin' && normalized === SUPER_ADMIN_MOBILE_CLEAN && profile.role !== 'super_admin') {
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

    // Merchant login: only approved store partners receive admin access
    if (role === 'admin' && profile.role !== 'super_admin') {
      const merchantCheck = await checkMerchantStatus(normalized);
      if (!merchantCheck.registered || merchantCheck.status !== 'approved') {
        const code =
          merchantCheck.status === 'pending'
            ? 'PENDING_APPROVAL'
            : merchantCheck.status === 'rejected'
              ? 'REJECTED'
              : 'NOT_REGISTERED';
        const errorMsg =
          merchantCheck.status === 'pending'
            ? `Your store registration ${merchantCheck.shopName ? `"${merchantCheck.shopName}" ` : ''}is under review. Please wait for Web Admin approval.`
            : merchantCheck.status === 'rejected'
              ? `Your store registration was rejected.${merchantCheck.rejection_reason ? ` Reason: ${merchantCheck.rejection_reason}.` : ''} Please submit a fresh onboarding application from the merchant app.`
              : 'This mobile number is not registered as an approved store partner.';
        return res.status(403).json({
          success: false,
          code,
          rejection_reason: merchantCheck.rejection_reason || null,
          error: errorMsg,
        });
      }

      if (profile.role !== 'admin') {
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
      isNewUser,
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
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing user session' });
  }

  try {
    const { deleteConsumerAccount } = require('../services/deleteAccount');
    const result = await deleteConsumerAccount(req.user.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to delete account' });
    }
    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

export default router;
