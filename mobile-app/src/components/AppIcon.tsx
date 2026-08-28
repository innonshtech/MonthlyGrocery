import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  | 'building'
  | 'mic'
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

  // 1b. Building / City Skyscraper Icon (Lucide-style dual towers)
  if (name === 'building') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 16, height: 16, justifyContent: 'flex-end', alignItems: 'flex-end', position: 'relative' }}>
            {/* Main taller tower */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: 9,
                height: 16,
                borderWidth: 1.8,
                borderColor: color,
                borderBottomWidth: 0,
                borderTopLeftRadius: 1.5,
                borderTopRightRadius: 1.5,
                justifyContent: 'space-evenly',
                alignItems: 'center',
                paddingVertical: 1.5,
              }}
            >
              {/* Windows */}
              <View style={{ width: 3, height: 1.5, backgroundColor: color, borderRadius: 0.2 }} />
              <View style={{ width: 3, height: 1.5, backgroundColor: color, borderRadius: 0.2 }} />
              <View style={{ width: 3, height: 1.5, backgroundColor: color, borderRadius: 0.2 }} />
            </View>
            {/* Side shorter tower */}
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 7,
                height: 11,
                borderWidth: 1.8,
                borderColor: color,
                borderLeftWidth: 0,
                borderBottomWidth: 0,
                borderTopRightRadius: 1.5,
                justifyContent: 'space-evenly',
                alignItems: 'center',
                paddingVertical: 1,
              }}
            >
              {/* Windows */}
              <View style={{ width: 2, height: 1.2, backgroundColor: color, borderRadius: 0.2 }} />
              <View style={{ width: 2, height: 1.2, backgroundColor: color, borderRadius: 0.2 }} />
            </View>
            {/* Bottom floor ground line */}
            <View
              style={{
                position: 'absolute',
                left: -1,
                bottom: 0,
                width: 18,
                height: 1.8,
                backgroundColor: color,
                borderRadius: 0.5,
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // 1c. Mic / Microphone Icon (Lucide-style vector outline)
  if (name === 'mic') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: 14, height: 18, alignItems: 'center', justifyContent: 'center' }}>
          {/* Mic capsule */}
          <View
            style={{
              width: 8,
              height: 11,
              borderRadius: 4,
              borderWidth: stroke,
              borderColor: color,
              backgroundColor: 'transparent',
            }}
          />
          {/* Stand bracket */}
          <View
            style={{
              width: 12,
              height: 6,
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: color,
              marginTop: -3,
            }}
          />
          {/* Bottom base support */}
          <View style={{ width: 5, height: stroke, backgroundColor: color, borderRadius: 0.5 }} />
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

  // 3. Cart Icon (Exact Figma Shopping Cart Vector + Dynamic Badge)
  if (name === 'cart') {
    return (
      <View style={[styles.center, { width: size, height: size, position: 'relative' }]}>
        <Svg width={size * 0.9} height={size * 0.9} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 21.4C9.7732 21.4 10.4 20.7732 10.4 20C10.4 19.2268 9.7732 18.6 9 18.6C8.2268 18.6 7.6 19.2268 7.6 20C7.6 20.7732 8.2268 21.4 9 21.4Z"
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M18 21.4C18.7732 21.4 19.4 20.7732 19.4 20C19.4 19.2268 18.7732 18.6 18 18.6C17.2268 18.6 16.6 19.2268 16.6 20C16.6 20.7732 17.2268 21.4 18 21.4Z"
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2 3H5L7.4 15.4C7.47013 15.7439 7.65864 16.0523 7.93271 16.2716C8.20679 16.4909 8.54908 16.6071 8.9 16.6H17.1C17.4509 16.6071 17.7932 16.4909 18.0673 16.2716C18.3414 16.0523 18.5299 15.7439 18.6 15.4L21 7H6"
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -3,
              right: -5,
              backgroundColor: '#0F3D28',
              minWidth: 16,
              height: 16,
              paddingHorizontal: 3,
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700', lineHeight: 11 }}>
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

  // Calendar
  if (name === 'calendar') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: size * 0.72,
            height: size * 0.72,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: 4,
            paddingTop: size * 0.14,
            paddingHorizontal: 3,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: size * 0.14,
              backgroundColor: color,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          />
          <View style={{ height: 1.8, backgroundColor: color, marginBottom: 3 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Trending down
  if (name === 'trending-down') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: size * 0.72, height: size * 0.72, justifyContent: 'center' }}>
          <View
            style={{
              width: size * 0.55,
              height: stroke,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: '35deg' }],
              alignSelf: 'flex-start',
            }}
          />
          <View
            style={{
              width: size * 0.22,
              height: size * 0.22,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              right: size * 0.08,
              bottom: size * 0.18,
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

  // 13. Search Icon (Lucide-style vector outline)
  if (name === 'search') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: size * 0.75, height: size * 0.75, position: 'relative' }}>
          <View
            style={{
              width: size * 0.52,
              height: size * 0.52,
              borderRadius: (size * 0.52) / 2,
              borderWidth: stroke,
              borderColor: color,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          <View
            style={{
              width: stroke,
              height: size * 0.32,
              backgroundColor: color,
              borderRadius: 0.5,
              transform: [{ rotate: '-45deg' }],
              position: 'absolute',
              bottom: size * 0.08,
              right: size * 0.12,
            }}
          />
        </View>
      </View>
    );
  }

  // 14. Chevron Right Icon (Lucide-style vector arrow)
  if (name === 'chevron-right') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View
          style={{
            width: size * 0.3,
            height: size * 0.3,
            borderRightWidth: stroke,
            borderTopWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
            marginLeft: -size * 0.08,
          }}
        />
      </View>
    );
  }

  // 15. Arrow Left Icon (Lucide-style vector back arrow)
  if (name === 'arrow-left') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: size * 0.72, height: size * 0.72, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              position: 'absolute',
              left: size * 0.08,
              width: size * 0.34,
              height: size * 0.34,
              borderLeftWidth: stroke,
              borderTopWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
          <View
            style={{
              width: size * 0.6,
              height: stroke,
              backgroundColor: color,
              borderRadius: 0.5,
            }}
          />
        </View>
      </View>
    );
  }

  // 16. Check Icon (Lucide-style vector tick)
  if (name === 'check') {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <View style={{ width: size * 0.65, height: size * 0.5, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: size * 0.42,
              height: size * 0.22,
              borderLeftWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
              marginTop: -size * 0.06,
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
