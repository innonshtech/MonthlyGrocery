import { NativeModules, Platform } from 'react-native';

/**
 * Live Vercel Cloud Production Server URL
 */
export const VERCEL_SERVER_URL = 'https://monthly-grocery-rust.vercel.app/api';

/**
 * Local IP / Host for Wireless & ADB Debugging
 */
export const DEV_MACHINE_IP = '192.168.1.15';

/**
 * Toggle to connect the app to the live Vercel Cloud Server.
 * Set to TRUE for production APK and cloud testing.
 */
export const USE_VERCEL_SERVER = false;

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

function resolveApiBase(): string {
  if (USE_VERCEL_SERVER) {
    return VERCEL_SERVER_URL;
  }
  if (Platform.OS === 'android') {
    if (isAndroidEmulator()) {
      return 'http://10.0.2.2:8001/api';
    }
    return `http://${DEV_MACHINE_IP}:8001/api`;
  }
  return 'http://localhost:8001/api';
}

export const API_BASE = resolveApiBase();
