import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
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
  hasCompletedValueIntroThisSession,
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

function MonthlyGroceryLogo({ width, height }: { width: number; height: number }) {
  const iconSize = Math.round(height * 0.4);
  const deepGreen = COLORS.green900;
  const limeGreen = '#8BE354';

  return (
    <View style={[styles.logoCard, { width, height, borderRadius: height * 0.2 }]}>
      <View style={[styles.logoMark, { width: iconSize + 10, height: iconSize + 10 }]}>
        <Svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none">
          <Path
            d="M8 12 h6 v2 l3 11 h15 l4 -13"
            stroke={deepGreen}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M21 24 C18.5 21, 15.5 22.5, 15 23 C16.5 25, 19.5 25.5, 21 24.5 Z"
            fill={limeGreen}
          />
          <Path
            d="M22 23 C24.5 17.5, 29.5 16, 31.5 16.5 C29.5 21, 26 23.5, 22.5 23.5 Z"
            fill={limeGreen}
          />
          <Circle cx={18} cy={32} r={2.5} stroke={deepGreen} strokeWidth={3} fill="none" />
          <Circle cx={30} cy={32} r={2.5} stroke={deepGreen} strokeWidth={3} fill="none" />
        </Svg>
      </View>
      <View style={styles.logoTextCol}>
        <Text style={[styles.logoTitleMonthly, { fontSize: height * 0.27, lineHeight: height * 0.3 }]}>
          Monthly
        </Text>
        <Text style={[styles.logoTitleGrocery, { fontSize: height * 0.27, lineHeight: height * 0.3 }]}>
          Grocery
        </Text>
      </View>
    </View>
  );
}

export default function SplashScreen({ navigation }: any) {
  const { token, user } = useAuth();
  const { width, height } = useWindowDimensions();
  const { bottomOffset, availableHeight } = useOnboardingLayout();
  const sx = width / FIGMA_W;
  const sy = availableHeight / FIGMA_H;
  const footnoteBottom = bottomOffset;

  const [splashConfig, setSplashConfig] = useState<OnboardingSplashConfig | null>(null);
  const [configReady, setConfigReady] = useState(false);

  const spreadAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const authRef = useRef({ token, user });
  authRef.current = { token, user };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await fetchOnboardingConfig();
      if (!cancelled) {
        setSplashConfig(config?.splash ?? null);
        setConfigReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!configReady || hasNavigated.current) return;

    spreadAnim.setValue(0);
    contentAnim.setValue(0);

    Animated.timing(spreadAnim, {
      toValue: 1,
      duration: 700,
      delay: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 420,
      delay: 780,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      if (!hasCompletedValueIntroThisSession()) {
        navigation.replace('ValueIntro');
        return;
      }

      const { token: activeToken, user: activeUser } = authRef.current;
      if (activeToken && activeUser?.role === 'consumer') {
        navigation.replace('Shop');
      } else {
        navigation.replace('Login');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [configReady, navigation, spreadAnim, contentAnim]);

  const chips = splashConfig?.emoji_chips ?? [];
  const showContent = splashConfig !== null;

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

      {!configReady ? (
        <View style={styles.loadingWrap}>
          <AppLoader color={COLORS.green100} />
        </View>
      ) : null}

      {configReady && chips.map((item, index) => {
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

      {configReady && showContent ? (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              left: CENTER.left * sx,
              top: CENTER.top * sy,
              width: CENTER.width * sx,
              height: CENTER.height * sy,
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
              alignItems: 'center',
            }}
          >
            <MonthlyGroceryLogo width={LOGO.width * sx} height={LOGO.height * sy} />
            {splashConfig?.tagline ? (
              <Text
                style={[
                  styles.tagline,
                  {
                    marginTop: (TAGLINE.top - LOGO.height) * sy,
                    width: TAGLINE.width * sx,
                    fontSize: 14 * Math.min(sx, sy),
                    lineHeight: TAGLINE.height * sy,
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
                  left: FOOTNOTE.left * sx,
                  bottom: footnoteBottom,
                  width: FOOTNOTE.width * sx,
                  fontSize: 13 * Math.min(sx, sy),
                  lineHeight: FOOTNOTE.height * sy,
                  opacity: contentAnim,
                },
              ]}
            >
              {splashConfig.footnote}
            </Animated.Text>
          ) : null}
        </>
      ) : null}

      {configReady && !showContent ? (
        <View style={styles.fallbackCenter}>
          <MonthlyGroceryLogo width={LOGO.width * sx} height={LOGO.height * sy} />
        </View>
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
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: '#17251E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  logoMark: {
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextCol: {
    justifyContent: 'center',
  },
  logoTitleMonthly: {
    ...FONTS.balooExtraBold,
    color: COLORS.green900,
    letterSpacing: -0.4,
  },
  logoTitleGrocery: {
    ...FONTS.balooExtraBold,
    color: '#8BE354',
    letterSpacing: -0.4,
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
