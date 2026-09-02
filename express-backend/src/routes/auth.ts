import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-me';
const SUPER_ADMIN_MOBILE = process.env.SUPER_ADMIN_MOBILE || '+918830480015';
const SUPER_ADMIN_MOBILE_CLEAN = SUPER_ADMIN_MOBILE.replace(/[^\d]/g, '');

// Helper to normalize phone to digits only (e.g. 918830480015)
function normalizePhone(phone: string): string {
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

// 1. Send OTP Endpoint
router.post('/send-otp', async (req, res) => {
  const { mobile, role } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }

  const normalized = normalizePhone(mobile);

  // Default to OTP 123456 if Twilio is not configured or in development mode
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.DEV_OTP_BYPASS?.toLowerCase() !== 'false') {
    console.log(`[OTP] Sent OTP '123456' for mobile: ${normalized}`);
    return res.json({
      success: true,
      message: 'OTP sent successfully. Use code 123456.',
      mobile: normalized,
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Twilio provider not configured.',
  });
});

// 2. Verify OTP Endpoint
router.post('/verify-otp', async (req, res) => {
  const { mobile, code, name, role } = req.body;
  if (!mobile || !code) {
    return res.status(400).json({ success: false, error: 'Mobile number and OTP code are required' });
  }

  const normalized = normalizePhone(mobile);

  // Always accept 123456 as valid OTP for testing without Twilio
  const isValid = (code === '123456');

  if (!isValid) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
  }

  try {
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
    const { data: authUser } = await supabase.auth.admin.getUserById(req.user.id);
    if (authUser?.user?.user_metadata?.email) {
      email = String(authUser.user.user_metadata.email).trim();
    }

    return res.json({
      success: true,
      user: {
        id: profile.id,
        mobile: profile.phone,
        name: profile.name,
        role: profile.role,
        email,
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

// 4. Update consumer profile (name + optional email metadata)
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { name, email } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ name: String(name).trim() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error || !profile) {
      return res.status(500).json({ success: false, error: error?.message || 'Failed to update profile' });
    }

    let savedEmail = '';
    if (email && String(email).trim()) {
      savedEmail = String(email).trim();
      await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: { email: savedEmail },
      });
    } else {
      const { data: authUser } = await supabase.auth.admin.getUserById(req.user.id);
      if (authUser?.user?.user_metadata?.email) {
        savedEmail = String(authUser.user.user_metadata.email).trim();
      }
    }

    return res.json({
      success: true,
      user: {
        id: profile.id,
        mobile: profile.phone,
        name: profile.name,
        role: profile.role,
        email: savedEmail,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
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

// 5. Upload profile avatar to Supabase Storage bucket 'avatars'
router.post('/upload-avatar', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { base64Image, mimeType } = req.body;
  if (!base64Image) {
    return res.status(400).json({ success: false, error: 'base64Image is required' });
  }

  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `avatar_${req.user.id}_${Date.now()}.jpg`;

    // Ensure 'avatars' storage bucket exists in Supabase
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find((b) => b.name === 'avatars')) {
        await supabase.storage.createBucket('avatars', { public: true });
      }
    } catch (bErr) {
      console.warn('Bucket check warning:', bErr);
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      return res.status(500).json({ success: false, error: uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Update avatar_url in profiles table
    try {
      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', req.user.id);
    } catch (pErr) {
      console.warn('Profile avatar_url update warning:', pErr);
    }

    return res.json({
      success: true,
      avatar_url: avatarUrl,
    });
  } catch (error: any) {
    console.error('Avatar upload exception:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
