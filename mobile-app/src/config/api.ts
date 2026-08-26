import { Platform } from 'react-native';

// Physical device on same Wi‑Fi without adb reverse: replace with your PC IP, e.g. '192.168.1.15'
const DEV_API_HOST = Platform.OS === 'android' ? 'localhost' : 'localhost';

export const API_BASE = `http://${DEV_API_HOST}:8001/api`;
