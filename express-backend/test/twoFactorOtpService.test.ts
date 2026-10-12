import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  sendOtp,
  verifyOtp,
  format2FactorPhone,
  maskPhone,
  getLockoutRemainingSeconds,
  isTestPhoneNumber,
  isProductionEnvironment,
  isDevBypassAllowed,
  _setFetchForTesting,
  _clearStoresForTesting,
} from '../src/services/twoFactorOtpService';

describe('2Factor OTP Service Comprehensive Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DEV_OTP_BYPASS;
    process.env.TWO_FACTOR_API_KEY = 'test_secret_api_key_12345';
    process.env.TWO_FACTOR_OTP_TEMPLATE = 'OTP1';
    _clearStoresForTesting();
    _setFetchForTesting(null);
  });

  test('1. format2FactorPhone formats Indian mobile numbers to 12-digit without plus', () => {
    assert.equal(format2FactorPhone('9876543210'), '919876543210');
    assert.equal(format2FactorPhone('+919876543210'), '919876543210');
    assert.equal(format2FactorPhone('919876543210'), '919876543210');
    assert.equal(format2FactorPhone('09876543210'), '919876543210');
    assert.equal(format2FactorPhone('+91 98765-43210'), '919876543210');
  });

  test('2. maskPhone obscures mobile number in logs', () => {
    assert.equal(maskPhone('919876543210'), '91******3210');
    assert.equal(maskPhone('8830480015'), '88******0015');
    assert.equal(maskPhone('123'), '***');
  });

  test('3. Rejects invalid phone numbers', async () => {
    const res = await sendOtp('12345');
    assert.equal(res.success, false);
    assert.match(res.error || '', /valid 10-digit Indian mobile number/i);
  });

  test('4. Fails safely when TWO_FACTOR_API_KEY is missing in production', async () => {
    delete process.env.TWO_FACTOR_API_KEY;
    const res = await sendOtp('9876543210');
    assert.equal(res.success, false);
    assert.match(res.error || '', /TWO_FACTOR_API_KEY is not set/i);
  });

  test('5. Successful OTP request dispatches AUTOGEN request and stores session', async () => {
    let capturedUrl = '';
    _setFetchForTesting(async (url: any) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: '3a3f5b21-session-uuid-12345',
        }),
        { status: 200 }
      );
    });

    const res = await sendOtp('9876543210');
    assert.equal(res.success, true);
    assert.equal(res.message, 'OTP sent successfully to your mobile number.');
    // Check that API URL follows the required 2Factor pattern
    assert.ok(capturedUrl.includes('/SMS/919876543210/AUTOGEN/OTP1'));
    assert.ok(capturedUrl.includes('test_secret_api_key_12345'));
  });

  test('6. Successful OTP verification calls 2Factor VERIFY and succeeds', async () => {
    // First send OTP
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-id-xyz',
        }),
        { status: 200 }
      );
    });

    await sendOtp('9876543210');

    // Mock verify call
    let capturedVerifyUrl = '';
    _setFetchForTesting(async (url: any) => {
      capturedVerifyUrl = String(url);
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'OTP Matched',
        }),
        { status: 200 }
      );
    });

    const verifyRes = await verifyOtp('9876543210', '458921');
    assert.equal(verifyRes.success, true);
    assert.ok(capturedVerifyUrl.includes('/SMS/VERIFY/session-id-xyz/458921'));

    // Check that session was cleared and cannot be re-verified (replay prevention)
    const secondVerifyRes = await verifyOtp('9876543210', '458921');
    assert.equal(secondVerifyRes.success, false);
    assert.match(secondVerifyRes.error || '', /No OTP requested for this number or OTP has expired/i);
  });

  test('7. Incorrect OTP decrements remaining attempts', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-id-xyz',
        }),
        { status: 200 }
      );
    });
    await sendOtp('9876543210');

    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Error',
          Details: 'OTP Mismatch',
        }),
        { status: 200 }
      );
    });

    const verify1 = await verifyOtp('9876543210', '000000');
    assert.equal(verify1.success, false);
    assert.equal(verify1.remainingAttempts, 2);
    assert.match(verify1.error || '', /2 attempts remaining/i);
  });

  test('8. Excessive failed verification attempts locks out phone for 60 seconds', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-id-xyz',
        }),
        { status: 200 }
      );
    });
    await sendOtp('9876543210');

    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Error',
          Details: 'OTP Mismatch',
        }),
        { status: 200 }
      );
    });

    await verifyOtp('9876543210', '000001'); // Attempt 1
    await verifyOtp('9876543210', '000002'); // Attempt 2
    const verify3 = await verifyOtp('9876543210', '000003'); // Attempt 3 -> Lockout

    assert.equal(verify3.success, false);
    assert.equal(verify3.locked, true);
    assert.equal(verify3.remainingSeconds, 60);
    assert.match(verify3.error || '', /locked for 60 seconds/i);

    // Verify lockout active on subsequent sendOtp call
    const sendWhileLocked = await sendOtp('9876543210');
    assert.equal(sendWhileLocked.success, false);
    assert.match(sendWhileLocked.error || '', /Too many failed attempts/i);
  });

  test('9. Provider rejection on send is gracefully returned to caller', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Error',
          Details: 'Insufficient Balance in 2Factor Wallet',
        }),
        { status: 200 }
      );
    });

    const res = await sendOtp('9876543210');
    assert.equal(res.success, false);
    assert.equal(res.error, 'Insufficient Balance in 2Factor Wallet');
  });

  test('10. Provider network timeout is handled safely', async () => {
    _setFetchForTesting(async () => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'TimeoutError';
      throw err;
    });

    const res = await sendOtp('9876543210');
    assert.equal(res.success, false);
    assert.match(res.error || '', /SMS gateway timed out/i);
  });

  test('11. Malformed non-JSON provider response is caught safely', async () => {
    _setFetchForTesting(async () => {
      return new Response('<html>502 Bad Gateway</html>', { status: 502 });
    });

    const res = await sendOtp('9876543210');
    assert.equal(res.success, false);
    assert.match(res.error || '', /Invalid response from SMS gateway/i);
  });

  test('12. Resend cooldown prevents rapid repeated requests', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-id-1',
        }),
        { status: 200 }
      );
    });

    const res1 = await sendOtp('9876543210');
    assert.equal(res1.success, true);

    // Immediate second send should hit the 15-second cooldown
    const res2 = await sendOtp('9876543210');
    assert.equal(res2.success, false);
    assert.match(res2.error || '', /Please wait \d+ seconds before requesting another OTP/i);
  });

  test('13. Cross-user / cross-phone verification is strictly prevented', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-user-a',
        }),
        { status: 200 }
      );
    });

    // User A requests OTP
    await sendOtp('9876543210');

    // User B tries to verify code for their own number without requesting OTP
    const verifyUserB = await verifyOtp('9123456780', '123456');
    assert.equal(verifyUserB.success, false);
    assert.match(verifyUserB.error || '', /No OTP requested for this number/i);
  });

  test('14. Expired OTP reported by 2Factor invalidates session', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-expired-test',
        }),
        { status: 200 }
      );
    });
    await sendOtp('9876543210');

    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Error',
          Details: 'OTP Expired',
        }),
        { status: 200 }
      );
    });

    const verifyRes = await verifyOtp('9876543210', '112233');
    assert.equal(verifyRes.success, false);
    assert.match(verifyRes.error || '', /OTP has expired/i);
  });

  test('15. Test/Dev phone numbers bypass external network and verify with 123456 ONLY when explicitly enabled in non-prod', async () => {
    process.env.DEV_OTP_BYPASS = 'true';
    process.env.NODE_ENV = 'test';

    assert.equal(isProductionEnvironment(), false);
    assert.equal(isDevBypassAllowed(), true);
    assert.equal(isTestPhoneNumber('9000000000'), true);
    assert.equal(isTestPhoneNumber('9999999999'), true);
    assert.equal(isTestPhoneNumber('9876543210'), false);

    const testSend = await sendOtp('9000000000');
    assert.equal(testSend.success, true);
    assert.equal(testSend.devOtp, '123456');

    const testVerify = await verifyOtp('9000000000', '123456');
    assert.equal(testVerify.success, true);
  });

  test('16. CRITICAL: In production (NODE_ENV=production), dev bypass is strictly IMPOSSIBLE even if DEV_OTP_BYPASS=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_OTP_BYPASS = 'true';

    assert.equal(isProductionEnvironment(), true);
    assert.equal(isDevBypassAllowed(), false, 'isDevBypassAllowed must be false in production');
    assert.equal(isTestPhoneNumber('9000000000'), false, 'isTestPhoneNumber must be false in production');

    // Attempting sendOtp for test number in production must NOT return devOtp and must call real API
    let externalApiCalled = false;
    _setFetchForTesting(async () => {
      externalApiCalled = true;
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'prod-session-id-999',
        }),
        { status: 200 }
      );
    });

    const sendRes = await sendOtp('9000000000');
    assert.equal(sendRes.success, true);
    assert.equal(sendRes.devOtp, undefined, 'devOtp must NEVER be returned in production');
    assert.equal(externalApiCalled, true, 'Real 2Factor API must be invoked in production');

    // Attempting to verify with hardcoded '123456' must call provider VERIFY, not local dev bypass
    let verifyApiCalled = false;
    _setFetchForTesting(async () => {
      verifyApiCalled = true;
      return new Response(
        JSON.stringify({
          Status: 'Error',
          Details: 'OTP Mismatch',
        }),
        { status: 200 }
      );
    });

    const verifyRes = await verifyOtp('9000000000', '123456');
    assert.equal(verifyRes.success, false, '123456 must NOT authenticate in production');
    assert.equal(verifyApiCalled, true, 'Provider verify must be called, not bypassed');
  });

  test('17. CRITICAL: In production, RDS database URL automatically triggers production lockdown', async () => {
    delete process.env.NODE_ENV;
    process.env.DATABASE_URL = 'postgresql://admin:secret@monthlygrocery.cxyz.rds.amazonaws.com:5432/postgres';
    process.env.DEV_OTP_BYPASS = 'true';

    assert.equal(isProductionEnvironment(), true);
    assert.equal(isDevBypassAllowed(), false);
    assert.equal(isTestPhoneNumber('9000000000'), false);
  });

  test('18. CRITICAL: In production, remote EC2 IP in PUBLIC_API_URL triggers production lockdown', async () => {
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    process.env.PUBLIC_API_URL = 'http://13.233.159.143:5000/api';
    process.env.DEV_OTP_BYPASS = 'true';

    assert.equal(isProductionEnvironment(), true);
    assert.equal(isDevBypassAllowed(), false);
    assert.equal(isTestPhoneNumber('9000000000'), false);
  });

  test('19. Role Isolation: OTP requested for consumer cannot be verified for admin or super_admin', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-role-test',
        }),
        { status: 200 }
      );
    });

    // Request OTP as consumer
    const sendRes = await sendOtp('9876543210', 'consumer');
    assert.equal(sendRes.success, true);

    // Attempt to verify with role admin
    const verifyAdmin = await verifyOtp('9876543210', '123456', 'admin');
    assert.equal(verifyAdmin.success, false);
    assert.match(verifyAdmin.error || '', /Authentication role mismatch/i);

    // Attempt to verify with role super_admin
    const verifySuperAdmin = await verifyOtp('9876543210', '123456', 'super_admin');
    assert.equal(verifySuperAdmin.success, false);
    assert.match(verifySuperAdmin.error || '', /Authentication role mismatch/i);

    // Verify with matching role consumer calls provider verify
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'OTP Matched',
        }),
        { status: 200 }
      );
    });

    const verifyConsumer = await verifyOtp('9876543210', '123456', 'consumer');
    assert.equal(verifyConsumer.success, true);
  });

  test('20. Substring Safety: "OTP Mismatch" details string is strictly rejected and never treated as matched', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-mismatch-test',
        }),
        { status: 200 }
      );
    });
    await sendOtp('9876543210');

    // Even if Status was somehow Success with Details: "OTP Mismatch"
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'OTP Mismatch',
        }),
        { status: 200 }
      );
    });

    const verifyRes = await verifyOtp('9876543210', '000000');
    assert.equal(verifyRes.success, false);
    assert.match(verifyRes.error || '', /Incorrect OTP code/i);
  });
});
