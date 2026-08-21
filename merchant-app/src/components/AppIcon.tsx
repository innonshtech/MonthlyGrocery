import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
}

const EMOJI_MAP: { [key: string]: string } = {
  store: '🏪',
  package: '📦',
  'shopping-bag': '🛍️',
  'arrow-right': '➔',
  'map-pin': '📍',
  check: '✓',
  phone: '📞',
  bell: '🔔',
  'help-circle': '❓',
  user: '👤',
  chevron_right: '›',
  truck: '🚚',
  clock: '🕒',
  shield: '🛡️',
  dollar: '₹',
  alert: '⚠️',
  star: '⭐',
  refresh: '🔄',
  search: '🔍',
  bar_chart: '📊',
  settings: '⚙️',
  logout: '🚪',
  inbox: '📥',
  plus: '➕',
  trash: '🗑️',
};

export default function AppIcon({ name, size = 20 }: AppIconProps) {
  const emoji = EMOJI_MAP[name] || '•';
  return (
    <View style={[styles.container, { width: size * 1.3, height: size * 1.3 }]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
