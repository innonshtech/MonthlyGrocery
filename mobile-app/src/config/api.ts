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
 * Auto-resolves the development backend host:
 * - On physical device via Wi-Fi: automatically uses the Metro host IP (e.g. 192.168.1.15)
 * - On emulator / ADB reverse: connects to localhost:8002
 */
const getDevApiUrl = (): string => {
  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:8002/api`;
      }
    }
  } catch {}
  return 'http://localhost:8002/api';
};

export const LOCAL_SERVER_URL = getDevApiUrl();

/**
 * Active Backend API Endpoint
 * Connected to AWS QA Server (Port 8002 / AWS RDS PostgreSQL QA)
 */
export const API_BASE = AWS_QA_SERVER_URL;
export const AWS_SERVER_URL = AWS_QA_SERVER_URL;

/**
 * Google Maps API Key for Static Maps, Geocoding & Places
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyDmN6Z7J7u9p7RDWze_39SPh9rLbmQ62wQ';

