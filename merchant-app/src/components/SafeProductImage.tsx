import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, View, Text, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';

interface SafeProductImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  fallbackText?: string;
}

export default function SafeProductImage({
  uri,
  style,
  resizeMode = 'contain',
  fallbackText = '📦',
}: SafeProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={styles.fallbackEmoji}>{fallbackText}</Text>
      </View>
    );
  }

  const cleanUri = uri.trim();
  const isSvg = cleanUri.toLowerCase().endsWith('.svg') || cleanUri.includes('.svg?');

  if (isSvg) {
    const flattened = StyleSheet.flatten(style) || {};
    const w = flattened.width || 48;
    const h = flattened.height || 48;

    return (
      <View style={[style, styles.svgWrapper]}>
        <SvgUri
          width={w}
          height={h}
          uri={cleanUri}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: cleanUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 20,
  },
  svgWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
