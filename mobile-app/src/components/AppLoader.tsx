import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/theme';
import { SkeletonBox, SkeletonLine, useSkeletonPulse } from './Skeleton';

interface AppLoaderProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  type?: 'skeleton' | 'spinner';
}

/**
 * Universal AppLoader:
 * By default renders interactive pulsing skeleton boxes and lines across all screens
 * to make data loading feel fast and responsive rather than stuck on a spinner.
 */
export default function AppLoader({
  message,
  size = 'large',
  color = COLORS.green700,
  type = 'skeleton',
}: AppLoaderProps) {
  const pulse = useSkeletonPulse();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type !== 'spinner') return;
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
  }, [spinValue, type]);

  if (type === 'spinner') {
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

  // Interactive Skeleton Filler (Default across entire app)
  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBox width={56} height={56} borderRadius={14} opacity={pulse} />
          <View style={styles.skeletonTextCol}>
            <SkeletonLine width="85%" height={12} opacity={pulse} />
            <SkeletonLine width="58%" height={10} style={{ marginTop: 7 }} opacity={pulse} />
            <SkeletonLine width="38%" height={9} style={{ marginTop: 5 }} opacity={pulse} />
          </View>
        </View>
      ))}

      {message ? (
        <View style={styles.messagePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EDF1EE',
  },
  skeletonTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  messagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#F0F5F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green600,
    marginRight: 6,
  },
  message: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.green800,
  },
});
