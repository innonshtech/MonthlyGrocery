import { Platform } from 'react-native';

export const COLORS = {
  // Brand Colors
  green900: '#0F3D28', // Deep headings / on-light
  green800: '#155A38', // Hover / gradients
  green700: '#1E7A46', // PRIMARY
  green600: '#2A8B54',
  green500: '#33A862', // Bright / success accent
  green100: '#E4F3EA', // Tints / fills
  green50: '#F2F9F5',  // Subtle backgrounds

  // Savings & Offers (SIGNATURE GLOW — never decorative)
  marigold700: '#8A5200', // Savings text on light
  marigold600: '#C77E12',
  marigold500: '#F5A524', // SECONDARY — savings & offers only
  marigold200: '#FBE0AE',
  marigold100: '#FDEFD3', // Savings pill bg

  // Ink / Text
  ink900: '#17251E', // Primary text
  ink700: '#3D4A44', // Secondary text
  ink500: '#6B7772', // Muted / captions
  ink300: '#A7B0AB', // Placeholder / disabled

  // Surfaces
  paper: '#FAF9F5',   // App background (warm)
  surface: '#FFFFFF', // Cards
  muted: '#F4F3EE',   // Subtle fills
  line: '#EAE9E2',    // Warm borders

  // Semantic
  success: '#2A8B54',
  warning: '#F5A524',
  error: '#D8453B',
  errorBg: '#FBE9E7',
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12, // cards
  lg: 16,
  xl: 20,
  pill: 999, // buttons & badges
};

export const FONTS = {
  // Baloo 2 variants
  balooExtraBold: Platform.select({
    ios: { fontFamily: 'Baloo2-ExtraBold', fontWeight: '800' as const },
    android: { fontFamily: 'Baloo2-ExtraBold', fontWeight: 'normal' as const },
  }),
  balooBold: Platform.select({
    ios: { fontFamily: 'Baloo2-Bold', fontWeight: '700' as const },
    android: { fontFamily: 'Baloo2-Bold', fontWeight: 'normal' as const },
  }),
  balooSemiBold: Platform.select({
    ios: { fontFamily: 'Baloo2-SemiBold', fontWeight: '600' as const },
    android: { fontFamily: 'Baloo2-SemiBold', fontWeight: 'normal' as const },
  }),
  balooMedium: Platform.select({
    ios: { fontFamily: 'Baloo2-Medium', fontWeight: '500' as const },
    android: { fontFamily: 'Baloo2-Medium', fontWeight: 'normal' as const },
  }),
  balooRegular: Platform.select({
    ios: { fontFamily: 'Baloo2-Regular', fontWeight: '400' as const },
    android: { fontFamily: 'Baloo2-Regular', fontWeight: 'normal' as const },
  }),

  // Mukta variants
  muktaBold: Platform.select({
    ios: { fontFamily: 'Mukta-Bold', fontWeight: '700' as const },
    android: { fontFamily: 'Mukta-Bold', fontWeight: 'normal' as const },
  }),
  muktaSemiBold: Platform.select({
    ios: { fontFamily: 'Mukta-SemiBold', fontWeight: '600' as const },
    android: { fontFamily: 'Mukta-SemiBold', fontWeight: 'normal' as const },
  }),
  muktaMedium: Platform.select({
    ios: { fontFamily: 'Mukta-Medium', fontWeight: '500' as const },
    android: { fontFamily: 'Mukta-Medium', fontWeight: 'normal' as const },
  }),
  muktaRegular: Platform.select({
    ios: { fontFamily: 'Mukta-Regular', fontWeight: '400' as const },
    android: { fontFamily: 'Mukta-Regular', fontWeight: 'normal' as const },
  }),
};


