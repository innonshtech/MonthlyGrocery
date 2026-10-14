/**
 * 2Factor OTP Service
 * Production-ready SMS OTP delivery and verification service using 2Factor.in API.
 * 
 * API Endpoints:
 * - Send OTP (AUTOGEN):   GET https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE_NUMBER}/AUTOGEN/{TEMPLATE}
 * - Verify OTP:          GET https://2factor.in/API/V1/{API_KEY}/SMS/VERIFY/{SESSION_ID}/{OTP_ENTERED}
 */

interface StoredOtpSession {
  sessionId: string;
  phone: string;
  role: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

// In-memory OTP session store (10-minute expiry, max 3 verification attempts)
const otpStore = new Map<string, StoredOtpSession>();

// In-memory lockout store (60-second lock after 3 failed attempts)
const lockoutStore = new Map<string, number>();

// In-memory rate limiting store for OTP requests (timestamp array per phone)
const requestRateLimitStore = new Map<string, number[]>();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const RESEND_COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown between resends
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 OTP requests per 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes window

const BASE_URL = 'https://2factor.in/API/V1';

// Pluggable fetch for automated testing
let customFetch: typeof fetch | null = null;

export function _setFetchForTesting(fn: typeof fetch | null): void {
  customFetch = fn;
}

export function _clearStoresForTesting(): void {
  otpStore.clear();
  lockoutStore.clear();
  requestRateLimitStore.clear();
}

export function _getOtpStoreSizeForTesting(): number {
  return otpStore.size;
}

/**
 * Check if the application is running in a production environment.
 * Strict multi-factor check: NODE_ENV flag, RDS endpoint, or remote EC2 IP.
 */
export function isProductionEnvironment(): boolean {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase().trim();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    return true;
  }
  const dbUrl = (process.env.DATABASE_URL || '').toLowerCase();
  if (dbUrl.includes('rds.amazonaws.com')) {
    return true;
  }
  const apiUrl = (process.env.PUBLIC_API_URL || '').toLowerCase();
  if (apiUrl.includes('13.233.159.143')) {
    return true;
  }
  return false;
}

/**
 * Check if development bypass is permissible.
 * CRITICAL RULE: Development bypass is ALWAYS impossible in production.
 */
export function isDevBypassAllowed(): boolean {
  if (isProductionEnvironment()) {
    return false;
  }
  return process.env.DEV_OTP_BYPASS?.toLowerCase() === 'true';
}

const TEST_NUMBERS = [
  '9000000000',
  '9999999999',
  '7777777777',
  '6666666666',
];

/**
 * Check if phone number is a whitelisted test number.
 * In production, test numbers NEVER bypass real OTP verification.
 */
export function isTestPhoneNumber(phone: string): boolean {
  if (isProductionEnvironment() || !isDevBypassAllowed()) {
    return false;
  }
  const clean = phone.replace(/[^\d]/g, '');
  return TEST_NUMBERS.some((num) => clean.endsWith(num));
}

/**
 * Format Indian mobile number to 12 digits (91XXXXXXXXXX) without '+' sign as required by 2Factor API.
 */
export function format2FactorPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    return '91' + clean;
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    return '91' + clean.slice(1);
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean;
  }
  return clean;
}

/**
 * Safely mask phone number for logging (e.g. 91******0015).
 */
export function maskPhone(phone: string): string {
  const p = String(phone || '').replace(/[^\d]/g, '');
  if (p.length < 6) return '***';
  return `${p.slice(0, 2)}******${p.slice(-4)}`;
}

/**
 * Redact secret API key from log output if present in error message strings.
 */
function sanitizeLog(message: string, apiKey?: string): string {
  if (!message) return '';
  if (!apiKey) return message;
  return message.split(apiKey).join('***REDACTED***');
}

/**
 * Check remaining lockout seconds for a phone number.
 */
export function getLockoutRemainingSeconds(phone: string): number {
  const formatted = format2FactorPhone(phone);
  const lockUntil = lockoutStore.get(formatted);
  if (!lockUntil) return 0;
  const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    lockoutStore.delete(formatted);
    return 0;
  }
  return remaining;
}

/**
 * Send OTP via 2Factor.in AUTOGEN API.
 */
export async function sendOtp(mobile: string, role = 'consumer'): Promise<{
  success: boolean;
  message?: string;
  devOtp?: string;
  error?: string;
}> {
  const formattedPhone = format2FactorPhone(mobile);
  if (!formattedPhone || formattedPhone.length !== 12 || !formattedPhone.startsWith('91')) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit Indian mobile number',
    };
  }

  // 1. Check if user is currently locked out
  const remainingLock = getLockoutRemainingSeconds(formattedPhone);
  if (remainingLock > 0) {
    return {
      success: false,
      error: `Too many failed attempts. Please wait ${remainingLock} seconds before requesting a new OTP.`,
    };
  }

  // 2. Check resend cooldown and rate limiting
  const now = Date.now();
  const existingSession = otpStore.get(formattedPhone);
  if (existingSession && now - existingSession.createdAt < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existingSession.createdAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting another OTP.`,
    };
  }

  const timestamps = (requestRateLimitStore.get(formattedPhone) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      success: false,
      error: 'Too many OTP requests. Please wait a few minutes before trying again.',
    };
  }

  // 3. Dev Bypass / Test Mode (STRICTLY BLOCKED IN PRODUCTION)
  if (isDevBypassAllowed() && isTestPhoneNumber(formattedPhone)) {
    const devCode = '123456';
    otpStore.set(formattedPhone, {
      sessionId: 'MOCK_DEV_SESSION',
      phone: formattedPhone,
      role,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
      createdAt: now,
    });
    timestamps.push(now);
    requestRateLimitStore.set(formattedPhone, timestamps);
    console.log(`[2Factor OTP] Test/Dev OTP '${devCode}' generated for ${maskPhone(formattedPhone)}`);
    return {
      success: true,
      message: 'OTP sent successfully. (Test mode code: 123456)',
      devOtp: devCode,
    };
  }

  // 4. Validate API Key
  const apiKey = process.env.TWO_FACTOR_API_KEY?.trim();
  if (!apiKey) {
    console.error('[2Factor OTP] Missing TWO_FACTOR_API_KEY in server environment variables.');
    return {
      success: false,
      error: 'SMS service configuration incomplete. TWO_FACTOR_API_KEY is not set.',
    };
  }

  const template = process.env.TWO_FACTOR_OTP_TEMPLATE?.trim() || 'OTP1';
  const sendUrl = `${BASE_URL}/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(formattedPhone)}/AUTOGEN/${encodeURIComponent(template)}`;

  try {
    const activeFetch = customFetch || globalThis.fetch;
    const response = await activeFetch(sendUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10s request timeout
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`[2Factor OTP] Malformed provider response for ${maskPhone(formattedPhone)}`);
      return {
        success: false,
        error: 'Invalid response from SMS gateway. Please try again.',
      };
    }

    if (data?.Status === 'Success' && data?.Details) {
      const sessionId = String(data.Details).trim();
      otpStore.set(formattedPhone, {
        sessionId,
        phone: formattedPhone,
        role,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0,
        createdAt: now,
      });

      timestamps.push(now);
      requestRateLimitStore.set(formattedPhone, timestamps);

      console.log(`[2Factor OTP] OTP dispatched to ${maskPhone(formattedPhone)} via template ${template}`);
      return {
        success: true,
        message: 'OTP sent successfully to your mobile number.',
      };
    }

    const errorDetails = data?.Details || data?.Status || 'Failed to send OTP';
    console.error(`[2Factor OTP] Provider rejected send for ${maskPhone(formattedPhone)}: ${sanitizeLog(String(errorDetails), apiKey)}`);
    return {
      success: false,
      error: String(errorDetails),
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT';
    console.error(`[2Factor OTP] Network error for ${maskPhone(formattedPhone)}:`, isTimeout ? 'Request timed out' : sanitizeLog(err?.message || '', apiKey));
    return {
      success: false,
      error: isTimeout
        ? 'SMS gateway timed out. Please try again shortly.'
        : 'Unable to connect to SMS gateway. Please try again later.',
    };
  }
}

/**
 * Verify OTP code entered by user using 2Factor.in VERIFY API.
 */
export async function verifyOtp(mobile: string, code: string, expectedRole?: string): Promise<{
  success: boolean;
  locked?: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
  error?: string;
}> {
  const formattedPhone = format2FactorPhone(mobile);
  const enteredCode = String(code || '').trim();

  // 1. Check if user is currently locked out
  const remainingLock = getLockoutRemainingSeconds(formattedPhone);
  if (remainingLock > 0) {
    return {
      success: false,
      locked: true,
      remainingSeconds: remainingLock,
      remainingAttempts: 0,
      error: `Too many failed attempts. OTP input is locked for ${remainingLock} seconds.`,
    };
  }

  // 2. Validate code format
  if (!enteredCode || !/^\d{4,8}$/.test(enteredCode)) {
    return {
      success: false,
      locked: false,
      error: 'Please enter a valid OTP code.',
    };
  }

  // 3. Look up active session
  const record = otpStore.get(formattedPhone);
  if (!record) {
    return {
      success: false,
      error: 'No OTP requested for this number or OTP has expired.',
    };
  }

  // 4. Prevent cross-user or cross-phone verification
  if (record.phone !== formattedPhone) {
    return {
      success: false,
      error: 'Invalid session for this phone number.',
    };
  }

  // 5. Prevent cross-role verification
  if (expectedRole && record.role && record.role !== expectedRole) {
    return {
      success: false,
      error: `Authentication role mismatch. OTP was requested for ${record.role}, cannot verify for ${expectedRole}.`,
    };
  }

  // 6. Check expiry
  if (Date.now() > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return {
      success: false,
      error: 'OTP has expired. Please request a new one.',
    };
  }

  // 7. Dev Bypass Verification (STRICTLY BLOCKED IN PRODUCTION)
  if (isDevBypassAllowed() && record.sessionId === 'MOCK_DEV_SESSION') {
    if (enteredCode === '123456') {
      otpStore.delete(formattedPhone);
      lockoutStore.delete(formattedPhone);
      return { success: true };
    }

    record.attempts += 1;
    return handleFailedAttempt(formattedPhone, record);
  }

  // In production or when real session exists, MOCK_DEV_SESSION is invalid
  if (record.sessionId === 'MOCK_DEV_SESSION') {
    otpStore.delete(formattedPhone);
    return {
      success: false,
      error: 'Development bypass session is not permitted in production.',
    };
  }

  // 8. Call 2Factor Verification API
  const apiKey = process.env.TWO_FACTOR_API_KEY?.trim();
  if (!apiKey) {
    console.error('[2Factor OTP] Missing TWO_FACTOR_API_KEY during verification.');
    return {
      success: false,
      error: 'SMS service configuration incomplete. TWO_FACTOR_API_KEY is not set.',
    };
  }

  const verifyUrl = `${BASE_URL}/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(record.sessionId)}/${encodeURIComponent(enteredCode)}`;

  try {
    const activeFetch = customFetch || globalThis.fetch;
    const response = await activeFetch(verifyUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10s request timeout
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`[2Factor OTP] Malformed verify response for ${maskPhone(formattedPhone)}`);
      return {
        success: false,
        error: 'Invalid response from SMS gateway. Please try again.',
      };
    }

    const details = String(data?.Details || '').trim();
    const detailsLower = details.toLowerCase();

    // 2Factor success response: { "Status": "Success", "Details": "OTP Matched" }
    // Crucial: "mismatch" contains "match", so we explicitly ensure it is not a mismatch!
    const isMatched =
      data?.Status === 'Success' &&
      !detailsLower.includes('mismatch') &&
      (detailsLower === 'otp matched' || detailsLower.includes('matched'));

    if (isMatched) {
      // Invalidate session immediately to prevent replay attacks
      otpStore.delete(formattedPhone);
      lockoutStore.delete(formattedPhone);
      console.log(`[2Factor OTP] OTP verified successfully for ${maskPhone(formattedPhone)}`);
      return { success: true };
    }

    // 2Factor error responses: { "Status": "Error", "Details": "OTP Expired" } or "OTP Mismatch"
    if (detailsLower.includes('expired')) {
      otpStore.delete(formattedPhone);
      return {
        success: false,
        error: 'OTP has expired. Please request a new one.',
      };
    }

    // Handle Incorrect Code Attempt
    record.attempts += 1;
    return handleFailedAttempt(formattedPhone, record);
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT';
    console.error(`[2Factor OTP] Verify network error for ${maskPhone(formattedPhone)}:`, isTimeout ? 'Request timed out' : sanitizeLog(err?.message || '', apiKey));
    return {
      success: false,
      error: isTimeout
        ? 'Verification timed out. Please try again.'
        : 'Unable to verify OTP right now. Please check your internet connection.',
    };
  }
}

/**
 * Handle failed OTP attempt, lockout logic, and remaining attempt counters.
 */
function handleFailedAttempt(
  phone: string,
  record: StoredOtpSession
): {
  success: false;
  locked: boolean;
  remainingSeconds?: number;
  remainingAttempts: number;
  error: string;
} {
  if (record.attempts >= MAX_ATTEMPTS) {
    lockoutStore.set(phone, Date.now() + LOCKOUT_DURATION_MS);
    otpStore.delete(phone);
    console.warn(`[2Factor OTP Lockout] Phone ${maskPhone(phone)} locked for 60s after ${MAX_ATTEMPTS} failed attempts.`);
    return {
      success: false,
      locked: true,
      remainingSeconds: 60,
      remainingAttempts: 0,
      error: 'Too many failed attempts. OTP input is locked for 60 seconds.',
    };
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return {
    success: false,
    locked: false,
    remainingAttempts,
    error: `Incorrect OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
  };
}
