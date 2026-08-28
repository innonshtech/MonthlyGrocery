import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';

interface AppLoaderProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function AppLoader({
  message,
  size = 'large',
  color = COLORS.green700,
}: AppLoaderProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();
    return () => spinAnimation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dimension = size === 'large' ? 36 : 22;
  const strokeWidth = size === 'large' ? 3.5 : 2.5;
  const radius = (dimension - strokeWidth) / 2;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: spin }], width: dimension, height: dimension }}>
        <Svg width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={COLORS.green100}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${radius * 2} ${radius * 1.5}`}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink500,
    marginTop: 8,
  },
});
