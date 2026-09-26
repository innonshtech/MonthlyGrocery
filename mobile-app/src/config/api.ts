import { NativeModules, Platform } from 'react-native';

/**
 * Live AWS EC2 Production Server URL
 */
export const AWS_SERVER_URL = 'http://13.233.159.143/api';

/**
 * Local Development Server URL (For Wireless Phone Debugging)
 * Your PC IP: 10.122.236.147 or use 'http://localhost:8001/api' with adb reverse
 */
export const LOCAL_SERVER_URL = 'http://10.122.236.147:8001/api';

/**
 * Change to:
 * - LOCAL_SERVER_URL: for testing your local laptop backend
 * - AWS_SERVER_URL: for testing live AWS production backend
 */
export const API_BASE = LOCAL_SERVER_URL;

/**
 * Google Maps API Key for Static Maps, Geocoding & Places
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDmN6Z7J7u9p7RDWze_39SPh9rLbmQ62wQ';

