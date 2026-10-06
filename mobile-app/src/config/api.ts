import { NativeModules, Platform } from 'react-native';

/**
 * Live AWS EC2 Production Server URL (Port 80/8001)
 */
export const AWS_PROD_SERVER_URL = 'http://13.233.159.143/api';

/**
 * Live AWS EC2 QA Server URL (Port 8002)
 */
export const AWS_QA_SERVER_URL = 'http://13.233.159.143:8002/api';

/**
 * Local Development Server URL (For Wireless Phone Debugging)
 */
export const LOCAL_SERVER_URL = 'http://localhost:8002/api';

/**
 * Active Backend API Endpoint
 * Switched to QA Server (Port 8002) for QA Branch
 */
export const API_BASE = AWS_QA_SERVER_URL;
export const AWS_SERVER_URL = AWS_QA_SERVER_URL;

/**
 * Google Maps API Key for Static Maps, Geocoding & Places
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDmN6Z7J7u9p7RDWze_39SPh9rLbmQ62wQ';

