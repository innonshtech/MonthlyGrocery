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

  // Check if bypass mode is active
  if (process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true') {
    console.log(`[DEV_OTP_BYPASS] Generated OTP for ${normalized}. Enter code '123456' to verify.`);
    return res.json({
      success: true,
      message: 'OTP sent successfully (Development Bypass Active)',
      mobile: normalized,
    });
  }

  // Production Twilio Verify Flow (Not currently active for local testing)
  // Under standard production integration, this calls the Twilio client.
  return res.status(400).json({
    success: false,
    error: 'Twilio provider not configured. Please enable DEV_OTP_BYPASS=true in your server environment.',
  });
});

// 2. Verify OTP Endpoint
router.post('/verify-otp', async (req, res) => {
  const { mobile, code, name, role } = req.body;
  if (!mobile || !code) {
    return res.status(400).json({ success: false, error: 'Mobile number and OTP code are required' });
  }

  const normalized = normalizePhone(mobile);

  // Validate OTP code
  let isValid = false;
  if (process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true') {
    isValid = (code === '123456');
  }

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

    // If profile does not exist, create user in Supabase Auth (trigger handles profiles row insert)
    if (!profile) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: '+' + normalized,
        phone_confirm: true,
        user_metadata: {
          name: name || 'User',
          role: selectedRole,
        }
      });

      if (authError) {
        return res.status(400).json({ success: false, error: authError.message });
      }

      // Fetch the newly inserted profile row
      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', normalized)
        .single();

      if (newProfileError) {
        return res.status(500).json({ success: false, error: newProfileError.message });
      }

      profile = newProfile;
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

export default router;
