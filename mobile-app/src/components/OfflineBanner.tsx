import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../context/NetworkContext';
import { FONTS } from '../constants/theme';

export default function OfflineBanner() {
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 8) }]} pointerEvents="none">
      <Text style={styles.text}>No Internet Connection. Please check your network.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    ...FONTS.muktaMedium,
  },
});
