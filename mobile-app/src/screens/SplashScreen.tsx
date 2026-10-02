import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  StatusBar,
  useWindowDimensions,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import AppLoader from '../components/AppLoader';
import { OnboardingEmojiChip } from '../components/onboarding/OnboardingUI';
import {
  ONBOARDING_FIGMA_HEIGHT,
  ONBOARDING_FIGMA_WIDTH,
  useOnboardingLayout,
} from '../components/onboarding/onboardingLayout';
import {
  fetchOnboardingConfig,
  OnboardingSplashConfig,
} from '../services/onboardingApi';

/**
 * A1 · Splash — Redesign (Figma node 390:603)
 * Copy & emoji chips loaded from /api/admin/onboarding (no hardcoded marketing text).
 */
const FIGMA_W = ONBOARDING_FIGMA_WIDTH;
const FIGMA_H = ONBOARDING_FIGMA_HEIGHT;

/** KF1 START cluster origin (401:636) */
const CLUSTER = { left: 168, top: 380 };

/** Center brand block (390:631) */
const CENTER = { left: 76, top: 359.5, width: 238, height: 125 };
const LOGO = { width: 238, height: 89 };
const TAGLINE = { left: 6.5, top: 105, width: 225, height: 20 };
const FOOTNOTE = { left: 95, top: 792, width: 189, height: 20 };

function EverLogo({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.logoCard, { width, height }]}>
      <Image
        source={require('../assets/ever-logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
}

const DEFAULT_SPLASH: OnboardingSplashConfig = {
  tagline: 'Fresh staples & everyday essentials at lowest prices',
  footnote: 'Delivering across Maharashtra',
  emoji_chips: [
    { emoji: '🌾', size: 66, left: 68, top: 220 },
    { emoji: '🍚', size: 60, left: 260, top: 200 },
    { emoji: '🫒', size: 62, left: 60, top: 480 },
    { emoji: '🧺', size: 68, left: 270, top: 500 },
  ],
};

export default function SplashScreen({ navigation }: any) {
  const { token, user, city, area } = useAuth();
  const { width, height } = useWindowDimensions();
  const { bottomOffset, availableHeight } = useOnboardingLayout();
  const sx = width / FIGMA_W;
  const sy = availableHeight / FIGMA_H;
  const footnoteBottom = bottomOffset;

  const logoCardWidth = Math.min(width * 0.88, 350);
  const logoCardHeight = Math.round(logoCardWidth / 2.74) + 14;

  const [splashConfig, setSplashConfig] = useState<OnboardingSplashConfig>(DEFAULT_SPLASH);

  const spreadAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const authRef = useRef({ token, user, city, area });
  authRef.current = { token, user, city, area };

  useEffect(() => {
    // 1. Logo fades in immediately without waiting for network API
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 350,
      delay: 50,
      useNativeDriver: true,
    }).start();

    // 2. Emoji chips spread outward smoothly
    Animated.timing(spreadAnim, {
      toValue: 1,
      duration: 650,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 3. Background fetch for dynamic remote tagline/chips (never blocks the logo)
    let cancelled = false;
    (async () => {
      try {
        const config = await fetchOnboardingConfig();
        if (!cancelled && config?.splash) {
          setSplashConfig(config.splash);
        }
      } catch {}
    })();

    // 4. Smooth auto-navigation after splash duration
    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      const { token: activeToken } = authRef.current;
      if (activeToken) {
        navigation.replace('Shop');
      } else {
        navigation.replace('ValueIntro');
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation, spreadAnim, contentAnim]);

  const chips = splashConfig?.emoji_chips ?? [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.green900} />
            <Stop offset="100%" stopColor={COLORS.green700} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grad)" />
      </Svg>

      {chips.map((item, index) => {
        const finalSize = item.size * sx;
        const startScale = 23.1 / 66;
        const left = spreadAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [CLUSTER.left * sx, item.left * sx],
        });
        const top = spreadAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [CLUSTER.top * sy, item.top * sy],
        });
        const scale = spreadAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [startScale, 1],
        });

        return (
          <Animated.View
            key={`${item.emoji}-${index}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: finalSize,
              height: finalSize,
              transform: [{ scale }],
            }}
          >
            <OnboardingEmojiChip
              emoji={item.emoji}
              size={finalSize}
              style={{
                position: 'relative',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderWidth: 0,
                shadowOpacity: 0,
                elevation: 0,
              }}
            />
          </Animated.View>
        );
      })}

      <Animated.View
        style={{
          position: 'absolute',
          top: availableHeight * 0.35,
          left: 0,
          right: 0,
          alignItems: 'center',
          opacity: contentAnim,
          transform: [
            {
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        }}
      >
        <EverLogo width={logoCardWidth} height={logoCardHeight} />
        {splashConfig?.tagline ? (
          <Text
            style={[
              styles.tagline,
              {
                marginTop: 18,
                width: width * 0.88,
                fontSize: 15 * Math.min(sx, sy),
                lineHeight: 22 * sy,
              },
            ]}
          >
            {splashConfig.tagline}
          </Text>
        ) : null}
      </Animated.View>

      {splashConfig?.footnote ? (
        <Animated.Text
          style={[
            styles.footnote,
            {
              left: 0,
              right: 0,
              bottom: footnoteBottom,
              fontSize: 13 * Math.min(sx, sy),
              lineHeight: FOOTNOTE.height * sy,
              opacity: contentAnim,
            },
          ]}
        >
          {splashConfig.footnote}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    ...FONTS.muktaMedium,
    color: COLORS.green100,
    textAlign: 'center',
  },
  footnote: {
    position: 'absolute',
    ...FONTS.muktaMedium,
    color: 'rgba(228, 243, 234, 0.7)',
    textAlign: 'center',
  },
});
