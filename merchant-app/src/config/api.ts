import { Platform } from 'react-native';

/**
 * Local dev API host for physical Android phones (same Wi‑Fi as your PC).
 * Run `ipconfig` on Windows and set this to your PC's IPv4 address.
 *
 * Alternatives:
 * - Android emulator: use `10.0.2.2`
 * - USB debugging with port reverse: use `localhost` after `npm run connect`
 */
const DEV_MACHINE_IP = '192.168.1.15';

function resolveDevApiHost(): string {
  if (Platform.OS === 'android') {
    return DEV_MACHINE_IP;
  }
  return 'localhost';
}

export const API_BASE = __DEV__
  ? `http://${resolveDevApiHost()}:8001/api`
  : 'https://monthly-grocery-rust.vercel.app/api';
