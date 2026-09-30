import twilio from 'twilio';

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP store (10-minute expiry, max 3 verification attempts)
const otpStore = new Map<string, StoredOtp>();

// In-memory lockout store (60-second lock after 3 failed attempts)
const lockoutStore = new Map<string, number>();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

export function getLockoutRemainingSeconds(phone: string): number {
  const formattedPhone = formatE164Phone(phone);
  const lockUntil = lockoutStore.get(formattedPhone);
  if (!lockUntil) return 0;
  const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    lockoutStore.delete(formattedPhone);
    return 0;
  }
  return remaining;
}

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

const TEST_NUMBERS = [
  '8830480015',
  '9876543210',
  '9000000000',
  '9999999999',
  '7777777777',
  '6666666666',
];

export function isTestPhoneNumber(phone: string): boolean {
  const clean = phone.replace(/[^\d]/g, '');
  return TEST_NUMBERS.some((num) => clean.endsWith(num));
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
  const remainingLock = getLockoutRemainingSeconds(mobile);
  if (remainingLock > 0) {
    return {
      success: false,
      error: `Too many failed attempts. Please wait ${remainingLock} seconds before requesting a new OTP.`,
    };
  }

  const isDevBypass = process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true';
  const isTest = isTestPhoneNumber(mobile);
  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  // 1. Dev Bypass / Test Phone Numbers / Fallback Mode
  if (!client || isDevBypass || isTest) {
    const devCode = '123456';
    otpStore.set(formattedPhone, {
      code: devCode,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });
    console.log(`[OTP] Test/Dev OTP '${devCode}' generated for ${formattedPhone}`);
    return {
      success: true,
      message: 'OTP sent successfully. (Test mode code: 123456)',
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
      otpStore.set(formattedPhone, {
        code: 'TWILIO_VERIFY',
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0,
      });
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
  locked?: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
  error?: string;
}> {
  const formattedPhone = formatE164Phone(mobile);
  const enteredCode = code.trim();
  const isDevBypass = process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true';

  // 1. Check if user is currently locked out
  const remainingLock = getLockoutRemainingSeconds(mobile);
  if (remainingLock > 0) {
    return {
      success: false,
      locked: true,
      remainingSeconds: remainingLock,
      remainingAttempts: 0,
      error: `Too many failed attempts. OTP input is locked for ${remainingLock} seconds.`,
    };
  }

  // 2. Look up active OTP record or initialize
  let record = otpStore.get(formattedPhone);
  if (!record) {
    // If in test/dev mode without prior sendOtp call
    if (isTestPhoneNumber(mobile) || isDevBypass) {
      record = {
        code: '123456',
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0,
      };
      otpStore.set(formattedPhone, record);
    } else {
      return { success: false, error: 'No OTP requested for this number or OTP has expired.' };
    }
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  let isCorrect = false;

  if (client && verifyServiceSid && !isDevBypass && record.code === 'TWILIO_VERIFY') {
    try {
      const check = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: formattedPhone, code: enteredCode });

      if (check.status === 'approved') {
        isCorrect = true;
      }
    } catch (err: any) {
      console.error('[Twilio Verify] Verification check error:', err);
    }
  } else {
    // Direct or Dev code check
    if (record.code === enteredCode || (isDevBypass && enteredCode === '123456')) {
      isCorrect = true;
    }
  }

  if (isCorrect) {
    otpStore.delete(formattedPhone);
    lockoutStore.delete(formattedPhone);
    return { success: true };
  }

  // Handle Incorrect Attempt
  record.attempts += 1;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);

  if (record.attempts >= MAX_ATTEMPTS) {
    lockoutStore.set(formattedPhone, Date.now() + LOCKOUT_DURATION_MS);
    otpStore.delete(formattedPhone);
    console.warn(`[OTP Lockout] Phone ${formattedPhone} locked for 60s after ${MAX_ATTEMPTS} failed attempts.`);
    return {
      success: false,
      locked: true,
      remainingSeconds: 60,
      remainingAttempts: 0,
      error: 'Too many failed attempts. OTP input is locked for 60 seconds.',
    };
  }

  return {
    success: false,
    locked: false,
    remainingAttempts,
    error: `Incorrect OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
  };
}
