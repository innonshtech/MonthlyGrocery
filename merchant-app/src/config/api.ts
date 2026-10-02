import { NativeModules, Platform } from 'react-native';

/**
 * Live AWS EC2 Production Server URL
 */
export const AWS_SERVER_URL = 'http://13.233.159.143/api';

/**
 * Local Development Server URL (For Wireless Phone Debugging)
 * Your PC IP: 10.122.236.147 or use 'http://localhost:8001/api' with adb reverse
 */
/** Phone via ADB: run `adb reverse tcp:8001 tcp:8001` */
export const LOCAL_SERVER_URL = 'http://localhost:8001/api';

/**
 * Active Backend API Endpoint
 * Live AWS EC2 Production Server
 */
export const API_BASE = AWS_SERVER_URL;
