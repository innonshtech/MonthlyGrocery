import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  StatusBar,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { SPLASH_SCREEN_BASE64 } from '../constants/splashBase64';

const SPLASH_IMG_W = 571;
const SPLASH_IMG_H = 1024;
const SPLASH_IMG_RATIO = SPLASH_IMG_W / SPLASH_IMG_H;

const SPLASH_SOURCE = { uri: SPLASH_SCREEN_BASE64 };

export default function SplashScreen({ navigation }: any) {
  const { token, user, city, area } = useAuth();
  const { width, height } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const hasNavigated = useRef(false);
  const authRef = useRef({ token, user, city, area });
  authRef.current = { token, user, city, area };

  useEffect(() => {
    // 1. Smooth entrance fade-in (280ms)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();

    // 2. Dynamic progress bar animation: fills smoothly from 0 to 100% in 1150ms
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1150,
      delay: 100,
      easing: Easing.bezier(0.25, 0.75, 0.25, 1),
      useNativeDriver: false,
    }).start();

    // Subtle leading-edge pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Navigation transition: opens app at 1450ms (~1.45s)
    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      const { token: activeToken } = authRef.current;
      if (activeToken) {
        navigation.replace('Shop');
      } else {
        navigation.replace('ValueIntro');
      }
    }, 1450);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation, fadeAnim, progressAnim, glowAnim]);

  // Compute exact coordinates of the progress bar in the scaled/covered image
  const screenRatio = width / (height || 1);
  let displayedWidth: number;
  let displayedHeight: number;
  let offsetY = 0;

  if (screenRatio > SPLASH_IMG_RATIO) {
    // Wider screens (tablets/landscape)
    displayedWidth = width;
    displayedHeight = width / SPLASH_IMG_RATIO;
    offsetY = (height - displayedHeight) / 2;
  } else {
    // Standard phone portrait screens
    displayedHeight = height;
    displayedWidth = height * SPLASH_IMG_RATIO;
    offsetY = 0;
  }

  // Exact location of the progress bar track matching the design
  const barTop = offsetY + displayedHeight * (579 / SPLASH_IMG_H);
  const barWidth = Math.round(displayedWidth * (172 / SPLASH_IMG_W));
  const barHeight = Math.max(Math.round(displayedHeight * (8.5 / SPLASH_IMG_H)), 7);
  const barRadius = barHeight / 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen new splash screen design embedded via base64 for instant OTA loading */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          source={SPLASH_SOURCE}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fadeDuration={0}
        />
      </Animated.View>

      {/* Smoothly animated glowing progress bar overlaid exactly on the track */}
      <View
        style={[
          styles.progressTrack,
          {
            top: barTop,
            width: barWidth,
            height: barHeight,
            borderRadius: barRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              borderRadius: barRadius,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <Svg width={barWidth} height={barHeight} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="splashBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#22C55E" />
                <Stop offset="45%" stopColor="#84CC16" />
                <Stop offset="80%" stopColor="#A3E635" />
                <Stop offset="100%" stopColor="#FACC15" />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={barWidth}
              height={barHeight}
              rx={barRadius}
              ry={barRadius}
              fill="url(#splashBarGrad)"
            />
          </Svg>

          {/* Leading edge subtle glowing shine */}
          <Animated.View
            style={[
              styles.glowHead,
              {
                height: barHeight,
                width: barHeight * 1.5,
                borderRadius: barRadius,
                opacity: glowAnim,
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003B20',
  },
  progressTrack: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(47, 120, 78, 0.45)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  glowHead: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});
