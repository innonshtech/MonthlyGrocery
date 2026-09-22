import { NativeModules, Vibration, Platform } from 'react-native';

const { OrderAlertSound } = NativeModules;

let isAlerting = false;
let vibrationLoopTimer: any = null;

function safeVibrate(pattern: number | number[], repeat: boolean = false) {
  try {
    Vibration.vibrate(pattern, repeat);
  } catch (err) {
    // Silently ignore if device doesn't have vibration permission
  }
}

function safeCancelVibration() {
  try {
    Vibration.cancel();
  } catch (err) {
    // Silently ignore
  }
}

/**
 * Plays a tone alert and vibration pattern
 * for new incoming merchant grocery orders (if audio alert is enabled).
 */
export async function playNewOrderAlertSound(): Promise<void> {
  if (isAlerting) return;
  isAlerting = true;

  // 1. Try Native Android Ringtone / ToneGenerator
  if (Platform.OS === 'android' && OrderAlertSound?.playNewOrderAlert) {
    try {
      await OrderAlertSound.playNewOrderAlert();
      return;
    } catch (err) {
      console.warn('[soundAlert] Native OrderAlertSound failed:', err);
    }
  }

  // 2. Cross-platform React Native Vibration pattern fallback
  const VIBRATION_PATTERN = [0, 600, 300, 600, 300, 600];
  safeVibrate(VIBRATION_PATTERN, true);

  if (!vibrationLoopTimer) {
    vibrationLoopTimer = setInterval(() => {
      if (isAlerting) {
        safeVibrate(VIBRATION_PATTERN, true);
      }
    }, 4000);
  }
}

/**
 * Stops any ongoing order alert sound, tone, or vibration.
 */
export async function stopNewOrderAlertSound(): Promise<void> {
  isAlerting = false;

  if (vibrationLoopTimer) {
    clearInterval(vibrationLoopTimer);
    vibrationLoopTimer = null;
  }
  safeCancelVibration();

  if (Platform.OS === 'android' && OrderAlertSound?.stopNewOrderAlert) {
    try {
      await OrderAlertSound.stopNewOrderAlert();
    } catch (err) {
      console.warn('[soundAlert] Error stopping native alert sound:', err);
    }
  }
}

/**
 * Plays a quick, pleasant single confirmation chime when merchant accepts an order.
 */
export async function playOrderSuccessChime(): Promise<void> {
  if (Platform.OS === 'android' && OrderAlertSound?.playSuccessChime) {
    try {
      await OrderAlertSound.playSuccessChime();
      return;
    } catch (err) {
      // fallback
    }
  }
  safeVibrate(150);
}

export function isOrderAlertPlaying(): boolean {
  return isAlerting;
}
