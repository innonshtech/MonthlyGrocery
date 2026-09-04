import { NativeModules, Platform } from 'react-native';

/**
 * Your PC's Wi‑Fi IPv4 — run `ipconfig` on Windows and update when network changes.
 * Phone and PC must be on the same Wi‑Fi (e.g. both 192.168.0.x).
 */
const DEV_MACHINE_IP = '192.168.1.14';

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

function resolveDevApiHost(): string {
  if (Platform.OS === 'android') {
    return isAndroidEmulator() ? '10.0.2.2' : DEV_MACHINE_IP;
  }
  return 'localhost';
}

export const API_BASE = `http://${resolveDevApiHost()}:8001/api`;
