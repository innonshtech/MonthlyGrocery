import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export type MerchantIconName =
  | 'store'
  | 'package'
  | 'shopping-bag'
  | 'arrow-right'
  | 'map-pin'
  | 'check'
  | 'phone'
  | 'bell'
  | 'user'
  | 'chevron_right'
  | 'truck'
  | 'clock'
  | 'shield'
  | 'dollar'
  | 'alert'
  | 'star'
  | 'refresh'
  | 'search'
  | 'bar_chart'
  | 'settings'
  | 'logout'
  | 'inbox'
  | 'plus'
  | 'trash';

interface AppIconProps {
  name: MerchantIconName | string;
  size?: number;
  color?: string;
}

export default function AppIcon({ name, size = 22, color = '#16A34A' }: AppIconProps) {
  const stroke = 2;

  // 1. Store / Shop Outline
  if (name === 'store') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 22, height: 20, alignItems: 'center' }}>
          {/* Roof */}
          <View
            style={{
              width: 14,
              height: 14,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: 2,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              top: 1,
            }}
          />
          {/* Walls */}
          <View
            style={{
              width: 16,
              height: 10,
              borderLeftWidth: stroke,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              position: 'absolute',
              bottom: 1.5,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Door */}
            <View style={{ width: 4, height: 6, backgroundColor: color, position: 'absolute', bottom: 0 }} />
          </View>
        </View>
      </View>
    );
  }

  // 2. Package / Box Outline (Inventory)
  if (name === 'package') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 18,
            height: 18,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: 3.5,
            position: 'relative',
          }}
        >
          {/* Top Lid Split */}
          <View style={{ height: stroke, backgroundColor: color, position: 'absolute', top: 5, left: 0, right: 0 }} />
          {/* Inner Vertical Split */}
          <View style={{ width: stroke, backgroundColor: color, position: 'absolute', top: 5, bottom: 0, left: 6.5 }} />
        </View>
      </View>
    );
  }

  // 3. Inbox / Incoming Orders Folder Tray
  if (name === 'inbox') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 20, height: 18, justifyContent: 'flex-end', position: 'relative' }}>
          <View
            style={{
              width: '100%',
              height: 11,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              position: 'relative',
            }}
          >
            {/* Inner tray notch */}
            <View
              style={{
                width: 8,
                height: 3,
                borderWidth: stroke,
                borderTopWidth: 0,
                borderColor: color,
                borderBottomLeftRadius: 1.5,
                borderBottomRightRadius: 1.5,
                position: 'absolute',
                top: 0,
                left: 4,
                backgroundColor: 'transparent',
              }}
            />
          </View>
          {/* Back wall of tray */}
          <View
            style={{
              width: '100%',
              height: stroke,
              backgroundColor: color,
              position: 'absolute',
              top: 2,
              borderRadius: 1,
            }}
          />
        </View>
      </View>
    );
  }

  // 4. Bar Chart (Analytics)
  if (name === 'bar_chart') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 18, height: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ width: 3.5, height: 7, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 3.5, height: 14, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 3.5, height: 10, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    );
  }

  // 5. Settings Gear Outline
  if (name === 'settings') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: stroke + 0.5,
            borderColor: color,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Gear teeth */}
          <View style={{ width: 3, height: 3, backgroundColor: color, position: 'absolute', top: -3.5, borderRadius: 0.5 }} />
          <View style={{ width: 3, height: 3, backgroundColor: color, position: 'absolute', bottom: -3.5, borderRadius: 0.5 }} />
          <View style={{ width: 3, height: 3, backgroundColor: color, position: 'absolute', left: -3.5, borderRadius: 0.5 }} />
          <View style={{ width: 3, height: 3, backgroundColor: color, position: 'absolute', right: -3.5, borderRadius: 0.5 }} />
        </View>
      </View>
    );
  }

  // 6. User Profile Outline
  if (name === 'user') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              borderWidth: stroke,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          <View
            style={{
              width: 14,
              height: 7,
              borderTopLeftRadius: 7,
              borderTopRightRadius: 7,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
        </View>
      </View>
    );
  }

  // 7. Logout / Exit
  if (name === 'logout') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 18, height: 18, position: 'relative', justifyContent: 'center' }}>
          {/* Door bracket */}
          <View
            style={{
              width: 11,
              height: 18,
              borderWidth: stroke,
              borderColor: color,
              borderRightWidth: 0,
              borderTopLeftRadius: 2.5,
              borderBottomLeftRadius: 2.5,
              position: 'absolute',
              left: 0,
            }}
          />
          {/* Exit arrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', right: 0 }}>
            <View style={{ width: 8, height: stroke, backgroundColor: color, borderRadius: 1 }} />
            <Text style={{ color, fontSize: 13, marginLeft: -5, fontWeight: '900', marginTop: -3.5 }}>➔</Text>
          </View>
        </View>
      </View>
    );
  }

  // 8. Shield Outline
  if (name === 'shield') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 16,
            height: 18,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        />
      </View>
    );
  }

  // 9. Trash Bin Outline
  if (name === 'trash') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 15, height: 17, alignItems: 'center' }}>
          <View style={{ width: 11, height: stroke, backgroundColor: color, borderRadius: 0.5, marginBottom: 1 }} />
          <View
            style={{
              width: 13,
              height: 12,
              borderWidth: stroke,
              borderColor: color,
              borderTopWidth: 0,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
            }}
          />
        </View>
      </View>
    );
  }

  // 10. Clock Outline
  if (name === 'clock') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: stroke,
            borderColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Clock Hands */}
          <View style={{ width: stroke, height: 5, backgroundColor: color, position: 'absolute', top: 4 }} />
          <View style={{ width: 4, height: stroke, backgroundColor: color, position: 'absolute', right: 4 }} />
        </View>
      </View>
    );
  }

  // 11. Shopping Bag
  if (name === 'shopping-bag') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 5,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: 15,
              height: 13,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 2.5,
            }}
          />
        </View>
      </View>
    );
  }

  // Fallback text glyphs
  const glyphMap: Record<string, string> = {
    'search': '🔍',
    'map-pin': '📍',
    'check': '✓',
    'phone': '📞',
    'plus': '+',
    'chevron_right': '›',
    'arrow-right': '➔',
    'alert': '⚠️',
    'star': '⭐',
    'refresh': '🔄',
    'dollar': '₹',
    'bell': '🔔',
  };

  const symbol = glyphMap[name] || '•';

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Text style={{ fontSize: size * 0.75, color, fontWeight: '700', lineHeight: size }}>
        {symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
