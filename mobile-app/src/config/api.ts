import { NativeModules, Platform } from 'react-native';

/**
 * Live AWS EC2 Production Server URL
 */
export const AWS_SERVER_URL = 'http://13.233.159.143/api';

/**
 * Local IP / Host for Wireless & ADB Debugging
 */
export const DEV_MACHINE_IP = '192.168.1.15';

/**
 * Toggle to connect the app to the live AWS EC2 Cloud Server.
 * Set to TRUE for production APK and cloud testing.
 */
export const USE_AWS_SERVER = false;

function resolveApiBase(): string {
  if (USE_AWS_SERVER) {
    return AWS_SERVER_URL;
  }
  // With adb reverse tcp:8001 tcp:8001, localhost:8001 maps directly to local express backend
  return 'http://localhost:8001/api';
}

export const API_BASE = resolveApiBase();

/**
 * Google Maps API Key for Static Maps, Geocoding & Places
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDmN6Z7J7u9p7RDWze_39SPh9rLbmQ62wQ';

