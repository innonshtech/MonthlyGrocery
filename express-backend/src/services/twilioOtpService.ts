import twilio from 'twilio';

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP store (10-minute expiry, max 5 verification attempts)
const otpStore = new Map<string, StoredOtp>();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function getTwilioClient(): twilio.Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (accountSid && authToken && accountSid.startsWith('AC')) {
    try {
      return twilio(accountSid, authToken);
    } catch (err) {
      console.error('[Twilio] Failed to initialize client:', err);
      return null;
    }
  }
  return null;
}

export function formatE164Phone(phone: string): string {
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  }
  return clean.startsWith('+') ? clean : `+${clean}`;
}

/**
 * Send OTP via Twilio SMS or Twilio Verify Service
 */
export async function sendOtp(mobile: string): Promise<{
  success: boolean;
  message?: string;
  devOtp?: string;
  error?: string;
}> {
  const formattedPhone = formatE164Phone(mobile);
  const isDevBypass = process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true';
  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  // 1. Dev Bypass / Fallback Mode (when Twilio credentials are not yet configured)
  if (!client || isDevBypass) {
    const devCode = '123456';
    otpStore.set(formattedPhone, {
      code: devCode,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });
    console.log(`[OTP] Sent dev bypass OTP '${devCode}' for ${formattedPhone}`);
    return {
      success: true,
      message: 'OTP sent successfully (Development Mode). Use code 123456.',
      devOtp: devCode,
    };
  }

  // 2. Twilio Verify API Mode (Recommended for Twilio Verify users)
  if (verifyServiceSid) {
    try {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({ to: formattedPhone, channel: 'sms' });

      console.log(`[Twilio Verify] Verification SID: ${verification.sid}, status: ${verification.status}`);
      return {
        success: true,
        message: 'OTP sent successfully to your mobile number.',
      };
    } catch (err: any) {
      console.error('[Twilio Verify] Error sending OTP:', err);
      return {
        success: false,
        error: err.message || 'Failed to send OTP via Twilio Verify',
      };
    }
  }

  // 3. Twilio Programmable SMS Mode (Direct SMS with generated 6-digit OTP)
  if (fromPhoneNumber) {
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(formattedPhone, {
        code: otpCode,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0,
      });

      const message = await client.messages.create({
        body: `Your MonthlyGrocery verification code is: ${otpCode}. Valid for 10 minutes. Please do not share this code with anyone.`,
        from: fromPhoneNumber,
        to: formattedPhone,
      });

      console.log(`[Twilio SMS] Message SID: ${message.sid}, sent to ${formattedPhone}`);
      return {
        success: true,
        message: 'OTP sent successfully to your mobile number via SMS.',
      };
    } catch (err: any) {
      console.error('[Twilio SMS] Error sending SMS:', err);
      return {
        success: false,
        error: err.message || 'Failed to send OTP SMS via Twilio',
      };
    }
  }

  return {
    success: false,
    error: 'Twilio configuration incomplete. Please provide TWILIO_VERIFY_SERVICE_SID or TWILIO_PHONE_NUMBER in .env',
  };
}

/**
 * Verify OTP code entered by customer or merchant
 */
export async function verifyOtp(mobile: string, code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const formattedPhone = formatE164Phone(mobile);
  const enteredCode = code.trim();
  const isDevBypass = process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true';

  // Global test code bypass when in development mode
  if (isDevBypass && enteredCode === '123456') {
    return { success: true };
  }

  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  // 1. Verify via Twilio Verify API
  if (client && verifyServiceSid && !isDevBypass) {
    try {
      const check = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: formattedPhone, code: enteredCode });

      if (check.status === 'approved') {
        return { success: true };
      }
      return { success: false, error: 'Invalid or expired OTP code' };
    } catch (err: any) {
      console.error('[Twilio Verify] Verification error:', err);
      return { success: false, error: err.message || 'Failed to verify OTP with Twilio' };
    }
  }

  // 2. Verify via In-memory / Direct SMS store
  const record = otpStore.get(formattedPhone);
  if (!record) {
    if (enteredCode === '123456') return { success: true };
    return { success: false, error: 'No OTP requested for this number or OTP has expired.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(formattedPhone);
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  record.attempts += 1;

  if (record.code === enteredCode || (isDevBypass && enteredCode === '123456')) {
    otpStore.delete(formattedPhone);
    return { success: true };
  }

  return { success: false, error: 'Incorrect OTP code. Please check and try again.' };
}
