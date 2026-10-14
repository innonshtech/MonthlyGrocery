import test, { describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { AddressInfo } from 'node:net';
import {
  _setFetchForTesting,
  _clearStoresForTesting,
} from '../src/services/twoFactorOtpService';
import authRouter from '../src/routes/auth';

describe('Auth Router 2Factor Integration Regression Tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);

  let server: any;
  let baseUrl = '';

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/auth`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(() => {
    delete process.env.DEV_OTP_BYPASS;
    process.env.TWO_FACTOR_API_KEY = 'test_secret_key_regression';
    process.env.TWO_FACTOR_OTP_TEMPLATE = 'OTP1';
    _clearStoresForTesting();
    _setFetchForTesting(null);
  });

  test('POST /auth/send-otp rejects invalid Indian phone number with 400', async () => {
    const res = await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '123' }),
    });

    const data: any = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.error, /Please enter a valid 10-digit mobile number/i);
  });

  test('POST /auth/send-otp calls 2Factor service and returns success message', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-id-integration-123',
        }),
        { status: 200 }
      );
    });

    const res = await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' }),
    });

    const data: any = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.message, 'OTP sent successfully to your mobile number.');
    assert.equal(data.mobile, '919876543210');
  });

  test('POST /auth/verify-otp validates code length and formats', async () => {
    const res = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210', code: '12' }),
    });

    const data: any = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.error, /Please enter the verification code/i);
  });

  test('POST /auth/verify-otp returns 400 with attempt counter on incorrect code', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-id-integration-123',
        }),
        { status: 200 }
      );
    });

    // Send OTP first
    await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' }),
    });

    // Mock 2Factor verify error
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Error',
          Details: 'OTP Mismatch',
        }),
        { status: 200 }
      );
    });

    const res = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210', code: '999999' }),
    });

    const data: any = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.remainingAttempts, 2);
    assert.match(data.error, /Incorrect OTP code/i);
  });

  test('POST /auth/send-otp NEVER returns devOtp in production even if DEV_OTP_BYPASS=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_OTP_BYPASS = 'true';

    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'prod-session-id-1234',
        }),
        { status: 200 }
      );
    });

    const res = await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9000000000' }),
    });

    const data: any = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.devOtp, undefined, 'devOtp must NEVER be included in response in production');
  });

  test('POST /auth/verify-otp blocks cross-role verification with 400', async () => {
    _setFetchForTesting(async () => {
      return new Response(
        JSON.stringify({
          Status: 'Success',
          Details: 'session-role-456',
        }),
        { status: 200 }
      );
    });

    // Send OTP as consumer
    await fetch(`${baseUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210', role: 'consumer' }),
    });

    // Attempt to verify as admin
    const res = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210', code: '123456', role: 'admin' }),
    });

    const data: any = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.error, /Authentication role mismatch/i);
  });
});
