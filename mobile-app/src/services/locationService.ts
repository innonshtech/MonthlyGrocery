import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { NativeLocationModule } = NativeModules;

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Request location permission on Android with fine & coarse fallback.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const fineGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    const coarseGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );

    if (fineGranted || coarseGranted) {
      return true;
    }

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    return (
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED ||
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.warn('Error requesting location permission:', err);
    return false;
  }
}

/**
 * Get current GPS coordinates from the native Android LocationManager module.
 */
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    if (NativeLocationModule && NativeLocationModule.getCurrentLocation) {
      const location = await NativeLocationModule.getCurrentLocation();
      if (
        location &&
        typeof location.latitude === 'number' &&
        typeof location.longitude === 'number'
      ) {
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        };
      }
    }
  } catch (err: any) {
    console.warn('NativeLocationModule getCurrentLocation error:', err?.message || err);
  }

  return null;
}
