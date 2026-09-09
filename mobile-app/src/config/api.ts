import { NativeModules, Platform } from 'react-native';

/**
 * SET THIS FLAG:
 * - true  => Connects to your local PC backend (http://127.0.0.1:8001/api via ADB reverse or http://192.168.1.15:8001/api via Wi-Fi)
 * - false => Connects to live Vercel cloud server (https://monthly-grocery-rust.vercel.app/api)
 */
export const USE_LOCAL_BACKEND = true;

/**
 * Your PC's Wi‑Fi IPv4 — from `ipconfig` on Windows
 */
export const DEV_MACHINE_IP = '192.168.1.15';

function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  const c = NativeModules.PlatformConstants || {};
  const model = String(c.Model || '').toLowerCase();
  const fingerprint = String(c.Fingerprint || '').toLowerCase();
  const brand = String(c.Brand || '').toLowerCase();
  return (
    fingerprint.includes('generic') ||
    fingerprint.includes('emulator') ||
    model.includes('emulator') ||
    model.includes('sdk') ||
    brand.includes('generic')
  );
}

function resolveApiHost(): string {
  if (Platform.OS === 'android') {
    // With `adb reverse tcp:8001 tcp:8001`, 127.0.0.1 / localhost connects directly through ADB tunnel!
    return isAndroidEmulator() ? '10.0.2.2' : '127.0.0.1';
  }
  return 'localhost';
}

export const API_BASE = USE_LOCAL_BACKEND
  ? `http://${resolveApiHost()}:8001/api`
  : 'https://monthly-grocery-rust.vercel.app/api';
