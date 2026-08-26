import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../constants/theme';
import { OnboardingEmojiChip } from '../components/onboarding/OnboardingUI';
import AppIcon from '../components/AppIcon';

/**
 * A1 · Splash — Redesign (Figma node 390:603)
 * Design canvas: 390 × 844
 *
 * Animation keyframes in Figma:
 * - 401:636 KF1 START — chips clustered at (168, 380), ~21–24px
 * - 401:603 KF2       — chips at final positions (spread)
 * - 390:603 Final     — logo + tagline + footnote fully visible
 */
const FIGMA_W = 390;
const FIGMA_H = 844;

/** Final-state floating chips from frame 390:603 */
const FLOATING_ITEMS = [
  { emoji: '🍚', size: 66, left: 84, top: 210, glyph: 48 },
  { emoji: '🫒', size: 62, left: 226, top: 102, glyph: 44 },
  { emoji: '🍎', size: 60, left: 318, top: 224, glyph: 42 },
  { emoji: '🥬', size: 68, left: 60, top: 498, glyph: 50 },
  { emoji: '🍞', size: 64, left: 270, top: 536, glyph: 46 },
  { emoji: '🥕', size: 62, left: 140, top: 618, glyph: 44 },
] as const;

/** KF1 START cluster origin (401:636) */
const CLUSTER = { left: 168, top: 380 };

/** Center brand block (390:631): x=76 y=359.5 w=238 h=125 */
const CENTER = { left: 76, top: 359.5, width: 238, height: 125 };
/** Logo / MonthlyGrocery (401:602): 238×89 */
const LOGO = { width: 238, height: 89 };
/** Tagline wrap (390:637): x=6.5 y=105 w=225 h=20 */
const TAGLINE = { left: 6.5, top: 105, width: 225, height: 20 };
/** Footnote (390:644): x=95 y=792 w=189 h=20 */
const FOOTNOTE = { left: 95, top: 792, width: 189, height: 20 };

function MonthlyGroceryLogo({ width, height }: { width: number; height: number }) {
  const iconSize = Math.round(height * 0.4);
  const deepGreen = COLORS.green900;
  const limeGreen = '#8BE354';

  return (
    <View style={[styles.logoCard, { width, height, borderRadius: height * 0.2 }]}>
      <View style={[styles.logoMark, { width: iconSize + 10, height: iconSize + 10 }]}>
        <Svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none">
          {/* Shopping Cart Body (Dark Green) */}
          <Path
            d="M8 12 h6 v2 l3 11 h15 l4 -13"
            stroke={deepGreen}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Left Leaf (Small) */}
          <Path
            d="M21 24 C18.5 21, 15.5 22.5, 15 23 C16.5 25, 19.5 25.5, 21 24.5 Z"
            fill={limeGreen}
          />
          {/* Right Leaf (Large) */}
          <Path
            d="M22 23 C24.5 17.5, 29.5 16, 31.5 16.5 C29.5 21, 26 23.5, 22.5 23.5 Z"
            fill={limeGreen}
          />
          {/* Wheels */}
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
  const sx = width / FIGMA_W;
  const sy = height / FIGMA_H;

  const spreadAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      if (token && user?.role === 'consumer') {
        navigation.replace('Shop');
      } else if (token) {
        navigation.replace('Login');
      } else {
        navigation.replace('ValueIntro');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [token, user, navigation, spreadAnim, contentAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Full-screen Linear Gradient Background */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.green900} />
            <Stop offset="100%" stopColor={COLORS.green700} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grad)" />
      </Svg>

      {FLOATING_ITEMS.map((item, index) => {
        const finalSize = item.size * sx;
        // KF1 sizes are ~35% of final (e.g. 23.1 / 66)
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
            key={index}
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
        <MonthlyGroceryLogo
          width={LOGO.width * sx}
          height={LOGO.height * sy}
        />
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
          Plan once · Order monthly · Save more
        </Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.footnote,
          {
            left: FOOTNOTE.left * sx,
            top: FOOTNOTE.top * sy,
            width: FOOTNOTE.width * sx,
            fontSize: 13 * Math.min(sx, sy),
            lineHeight: FOOTNOTE.height * sy,
            opacity: contentAnim,
          },
        ]}
      >
        from your neighbourhood store
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: 'Baloo 2',
    fontWeight: '800',
    color: COLORS.green900,
    letterSpacing: -0.4,
  },
  logoTitleGrocery: {
    fontFamily: 'Baloo 2',
    fontWeight: '800',
    color: '#8BE354',
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: 'Mukta',
    fontWeight: '500',
    color: COLORS.green100,
    textAlign: 'center',
  },
  footnote: {
    position: 'absolute',
    fontFamily: 'Mukta',
    fontWeight: '500',
    color: 'rgba(228, 243, 234, 0.7)', // COLORS.green100 with 0.7 opacity
    textAlign: 'center',
  },
});
