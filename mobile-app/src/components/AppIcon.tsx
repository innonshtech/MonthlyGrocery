import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export type IconName =
  | 'home'
  | 'categories'
  | 'cart'
  | 'orders'
  | 'account'
  | 'sparkles'
  | 'shopping-bag'
  | 'cat-atta-rice'
  | 'cat-oils-ghee'
  | 'cat-dals-pulses'
  | 'cat-spices-masala'
  | 'cat-dry-fruits'
  | 'cat-snacks'
  | 'cat-beverages'
  | 'cat-biscuits'
  | 'cat-cleaning'
  | 'cat-personal-care'
  | 'cat-home-kitchen'
  | 'cat-baby-care'
  | 'calendar'
  | 'trending-down'
  | 'shield-check'
  | 'arrow-right'
  | 'arrow-left'
  | 'search'
  | 'map-pin'
  | 'user'
  | 'tag'
  | 'package'
  | 'phone'
  | 'check'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'clock'
  | 'chevron-right'
  | 'truck'
  | 'wallet'
  | 'help'
  | 'star'
  | 'percent';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  badge?: number;
}

export default function AppIcon({ name, size = 26, color = '#1E7A46', badge }: AppIconProps) {
  const stroke = 2.2;

  // 1. Home Icon (Outline House)
  if (name === 'home') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 22, height: 22, alignItems: 'center' }}>
          <View
            style={{
              width: 15,
              height: 15,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: 2.5,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              top: 2,
            }}
          />
          <View
            style={{
              width: 14,
              height: 10,
              borderLeftWidth: stroke,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderBottomLeftRadius: 2.5,
              borderBottomRightRadius: 2.5,
              borderColor: color,
              position: 'absolute',
              bottom: 1.5,
            }}
          />
        </View>
      </View>
    );
  }

  // 2. Categories Icon (4 Rounded Micro-Squares)
  if (name === 'categories') {
    const box = 7.5;
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 19, height: 19, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: box, height: box, borderRadius: 2.5, borderWidth: stroke, borderColor: color }} />
            <View style={{ width: box, height: box, borderRadius: 2.5, borderWidth: stroke, borderColor: color }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: box, height: box, borderRadius: 2.5, borderWidth: stroke, borderColor: color }} />
            <View style={{ width: box, height: box, borderRadius: 2.5, borderWidth: stroke, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // 3. Cart Icon (Trolley + Badge)
  if (name === 'cart') {
    return (
      <View style={[styles.center, { width: size, height: size, position: 'relative' }]}>
        <View style={{ width: 22, height: 20, position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              top: 1,
              left: 0,
              width: 5,
              height: stroke,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 1,
              left: 3.5,
              width: stroke,
              height: 10,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: '-15deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 4.5,
              left: 5.5,
              width: 14,
              height: 9.5,
              borderWidth: stroke,
              borderColor: color,
              borderTopWidth: 0,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 7,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 15,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        </View>

        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -3,
              right: -5,
              backgroundColor: '#1E7A46',
              width: 16,
              height: 16,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '800', lineHeight: 11 }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // 4. Orders Icon (Receipt Sheet)
  if (name === 'orders') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 17,
            height: 20,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: 3.5,
            paddingHorizontal: 3,
            paddingVertical: 3.5,
            justifyContent: 'space-evenly',
          }}
        >
          <View style={{ height: 1.8, backgroundColor: color, borderRadius: 1, width: '100%' }} />
          <View style={{ height: 1.8, backgroundColor: color, borderRadius: 1, width: '100%' }} />
          <View style={{ height: 1.8, backgroundColor: color, borderRadius: 1, width: '65%' }} />
        </View>
      </View>
    );
  }

  // 5. Account Icon (User Outline)
  if (name === 'account' || name === 'user') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: stroke,
              borderColor: color,
              marginBottom: 1.5,
            }}
          />
          <View
            style={{
              width: 16,
              height: 8,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
        </View>
      </View>
    );
  }

  /* =========================================================================
     EXACT 12 FIGMA CATEGORY ICONS
     ========================================================================= */

  // 1. Atta & Rice (Bowl/Basket with Top Handle)
  if (name === 'cat-atta-rice') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 13,
              height: 7,
              borderTopLeftRadius: 6.5,
              borderTopRightRadius: 6.5,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: 22,
              height: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // 2. Oils & Ghee (Oil Bottle)
  if (name === 'cat-oils-ghee') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 5,
              height: 4,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
              borderTopLeftRadius: 1.5,
              borderTopRightRadius: 1.5,
            }}
          />
          <View
            style={{
              width: 11,
              height: 17,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 2.5,
            }}
          />
        </View>
      </View>
    );
  }

  // 3. Dals & Pulses (3 Grouped Pulses/Seeds)
  if (name === 'cat-dals-pulses') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 19, height: 19, position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 2,
              width: 7.5,
              height: 7.5,
              borderRadius: 3.75,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 7.5,
              height: 7.5,
              borderRadius: 3.75,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 7.5,
              height: 7.5,
              borderRadius: 3.75,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // 4. Spices & Masala (Spice Jar)
  if (name === 'cat-spices-masala') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 6,
              height: 3,
              backgroundColor: color,
              borderTopLeftRadius: 1.5,
              borderTopRightRadius: 1.5,
            }}
          />
          <View
            style={{
              width: 14,
              height: 18,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 3.5,
            }}
          />
        </View>
      </View>
    );
  }

  // 5. Dry Fruits (Almond / Teardrop Outline)
  if (name === 'cat-dry-fruits') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 15,
            height: 20,
            borderTopLeftRadius: 7.5,
            borderTopRightRadius: 7.5,
            borderBottomLeftRadius: 7.5,
            borderBottomRightRadius: 2,
            borderWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    );
  }

  // 6. Snacks (Shopping Tote Bag)
  if (name === 'cat-snacks') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 10,
              height: 6,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
              borderTopLeftRadius: 5,
              borderTopRightRadius: 5,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: 16,
              height: 16,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    );
  }

  // 7. Beverages (Cup with Handle)
  if (name === 'cat-beverages') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 15,
              height: 14,
              borderWidth: stroke,
              borderColor: color,
              borderTopWidth: 0,
              borderBottomLeftRadius: 3.5,
              borderBottomRightRadius: 3.5,
            }}
          />
          <View
            style={{
              width: 5,
              height: 8,
              borderWidth: stroke,
              borderColor: color,
              borderLeftWidth: 0,
              borderTopRightRadius: 4,
              borderBottomRightRadius: 4,
            }}
          />
        </View>
      </View>
    );
  }

  // 8. Biscuits (Cookie with 3 Inner Dots)
  if (name === 'cat-biscuits') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: stroke,
            borderColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 9, height: 9, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }}>
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color, alignSelf: 'center' }} />
          </View>
        </View>
      </View>
    );
  }

  // 9. Cleaning (Spray Bottle)
  if (name === 'cat-cleaning') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1 }}>
            <View style={{ width: 8, height: 3, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: 4, height: 2, backgroundColor: color }} />
          </View>
          <View
            style={{
              width: 10,
              height: 16,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 2.5,
              marginLeft: 1,
            }}
          />
        </View>
      </View>
    );
  }

  // 10. Personal Care (Lotion / Tube Bottle)
  if (name === 'cat-personal-care') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: 10,
            height: 22,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: 5,
            alignItems: 'center',
            paddingTop: 3,
          }}
        >
          <View style={{ width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    );
  }

  // 11. Home & Kitchen (House Outline)
  if (name === 'cat-home-kitchen') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 20, height: 20, alignItems: 'center' }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: 2.5,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              top: 1.5,
            }}
          />
          <View
            style={{
              width: 13,
              height: 9.5,
              borderLeftWidth: stroke,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderBottomLeftRadius: 2.5,
              borderBottomRightRadius: 2.5,
              borderColor: color,
              position: 'absolute',
              bottom: 1,
            }}
          />
        </View>
      </View>
    );
  }

  // 12. Baby Care (Person / Baby Silhouette)
  if (name === 'cat-baby-care') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: stroke,
              borderColor: color,
              marginBottom: 1.5,
            }}
          />
          <View
            style={{
              width: 16,
              height: 8,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderWidth: stroke,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
        </View>
      </View>
    );
  }

  // Shopping Bag
  if (name === 'shopping-bag') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.28,
              borderWidth: 1.8,
              borderColor: color,
              borderBottomWidth: 0,
              borderTopLeftRadius: size * 0.2,
              borderTopRightRadius: size * 0.2,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: size * 0.78,
              height: size * 0.62,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3.5,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: size * 0.3, height: 1.6, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      </View>
    );
  }

  // Sparkles (✦)
  if (name === 'sparkles' || name === 'star') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.9, color: color || '#F5A524', fontWeight: 'bold' }}>
          ✦
        </Text>
      </View>
    );
  }

  // Fallback text glyphs
  const glyphMap: Record<string, string> = {
    'search': '🔍',
    'map-pin': '📍',
    'check': '✓',
    'plus': '+',
    'minus': '−',
    'chevron-right': '›',
    'arrow-right': '➔',
    'arrow-left': '‹',
    'tag': '🏷️',
    'package': '📦',
    'trash': '🗑️',
    'clock': '🕒',
    'truck': '🚚',
    'wallet': '💳',
    'percent': '%',
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
