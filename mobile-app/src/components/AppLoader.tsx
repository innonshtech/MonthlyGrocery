import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
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
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
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

