import { useMemo } from 'react';
import {
  Platform,
  StatusBar,
  useWindowDimensions,
  type KeyboardAvoidingViewProps,
} from 'react-native';
import {
  useSafeAreaInsets,
  type EdgeInsets,
} from 'react-native-safe-area-context';

/** Figma onboarding frame size — scale layouts from this baseline on all devices. */
export const ONBOARDING_FIGMA_WIDTH = 390;
export const ONBOARDING_FIGMA_HEIGHT = 844;

/** Classic Android 3-button navigation bar height (48dp). */
export const ANDROID_NAV_BAR_HEIGHT = 48;

/** Gap between footer buttons and system nav / home indicator. */
export const ONBOARDING_FOOTER_CONTENT_GAP = 16;

export function getOnboardingWidthScale(screenWidth: number): number {
  return screenWidth / ONBOARDING_FIGMA_WIDTH;
}

/**
 * Effective bottom inset on Android — covers both gesture nav and 3-button nav.
 * Edge-to-edge usually reports the real inset; some OEMs return 0 → use nav bar fallback.
 */
export function getAndroidEffectiveBottomInset(safeBottom: number): number {
  if (Platform.OS !== 'android') return safeBottom;
  return safeBottom > 0 ? safeBottom : ANDROID_NAV_BAR_HEIGHT;
}

/** Usable screen height excluding status bar and system navigation area. */
export function getOnboardingAvailableHeight(
  windowHeight: number,
  insets: Pick<EdgeInsets, 'top' | 'bottom'>,
): number {
  const bottomInset =
    Platform.OS === 'android'
      ? getAndroidEffectiveBottomInset(insets.bottom)
      : insets.bottom;
  return Math.max(windowHeight - insets.top - bottomInset, windowHeight * 0.55);
}

/** Responsive illustration header height (Value Intro, etc.). */
export function getOnboardingIllustrationHeight(
  windowHeight: number,
  safeBottom = 0,
  safeTop = 0,
): number {
  const available = getOnboardingAvailableHeight(windowHeight, {
    top: safeTop,
    bottom: safeBottom,
  });
  const scaled = 432 * (available / ONBOARDING_FIGMA_HEIGHT);
  return Math.round(Math.min(scaled, available * 0.52));
}

export const ONBOARDING_KEYBOARD_BEHAVIOR: KeyboardAvoidingViewProps['behavior'] =
  Platform.OS === 'ios' ? 'padding' : undefined;

export const ONBOARDING_HORIZONTAL_PADDING = 24;

/**
 * Bottom padding for sticky footers — sits above gesture bar OR 3-button nav.
 */
export function getOnboardingBottomPadding(safeBottom: number): number {
  const bottomInset =
    Platform.OS === 'android'
      ? getAndroidEffectiveBottomInset(safeBottom)
      : Math.max(safeBottom, 12);
  return bottomInset + ONBOARDING_FOOTER_CONTENT_GAP;
}

/** Absolute bottom offset (footnote, etc.) — flush above system navigation. */
export function getOnboardingBottomOffset(safeBottom: number): number {
  if (Platform.OS === 'android') {
    return getAndroidEffectiveBottomInset(safeBottom) + 8;
  }
  return Math.max(safeBottom, 12) + 8;
}

/** Extra top offset when content sits below the status bar on Android. */
export function getOnboardingStatusBarOffset(): number {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight ?? 0;
  }
  return 0;
}

/** Shared layout metrics — use on every onboarding slide (iOS + Android nav buttons). */
export function useOnboardingLayout() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => ({
      insets,
      widthScale: getOnboardingWidthScale(width),
      illustrationHeight: getOnboardingIllustrationHeight(
        height,
        insets.bottom,
        insets.top,
      ),
      bottomPadding: getOnboardingBottomPadding(insets.bottom),
      bottomOffset: getOnboardingBottomOffset(insets.bottom),
      availableHeight: getOnboardingAvailableHeight(height, insets),
      keyboardBehavior: ONBOARDING_KEYBOARD_BEHAVIOR,
    }),
    [insets, width, height],
  );
}
