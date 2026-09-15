import { NativeModules, Platform } from 'react-native';

/**
 * Local IP / Host for Wireless & ADB Debugging
 * With `adb reverse tcp:8001 tcp:8001`, 127.0.0.1 connects directly through the ADB bridge!
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
    if (isAndroidEmulator()) {
      return '10.0.2.2';
    }
    return '127.0.0.1';
  }
  return 'localhost';
}

export const API_BASE = `http://${resolveApiHost()}:8001/api`;
