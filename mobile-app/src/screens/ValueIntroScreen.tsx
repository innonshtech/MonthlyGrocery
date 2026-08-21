import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon, { IconName } from '../components/AppIcon';
import { COLORS, RADIUS } from '../constants/theme';

interface ValueSlide {
  id: string;
  badge: string;
  icon: IconName;
  title: string;
  subtitle: string;
}

const SLIDES: ValueSlide[] = [
  {
    id: 'slide-1',
    badge: 'Save ₹340 / month',
    icon: 'shopping-bag',
    title: 'Plan your whole month in one go',
    subtitle: 'Build your household staples basket once. We batch deliver with zero rush and zero markup.'
  },
  {
    id: 'slide-2',
    badge: 'Reorder in seconds',
    icon: 'calendar',
    title: 'Copy last month in one tap',
    subtitle: 'Your family essentials are remembered. Tweak quantities, swap brands, and checkout in 30 seconds.'
  },
  {
    id: 'slide-3',
    badge: 'Lowest monthly price',
    icon: 'trending-down',
    title: 'Save more on every order',
    subtitle: 'Direct local hub fulfillment means wholesale prices on atta, rice, oil, dals and dry fruits.'
  }
];

export default function ValueIntroScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Visual Center */}
      <View style={styles.visualContainer}>
        {/* Signature Savings Marigold Pill */}
        <View style={styles.pillBadge}>
          <Text style={styles.pillBadgeText}>{slide.badge}</Text>
        </View>

        {/* Big Mint Circle with Outline Icon */}
        <View style={styles.illustrationCircle}>
          <AppIcon name={slide.icon} size={64} color={COLORS.green700} />
        </View>

        {/* Text Block */}
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      {/* Bottom Area with Dots & Pill Button */}
      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.dotActive : styles.dotInactive
              ]}
            />
          ))}
        </View>

        {/* Pill Primary CTA Button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper, // Exact warm paper #FAF9F5
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 36,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green700, // #1E7A46
  },
  visualContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pillBadge: {
    backgroundColor: COLORS.marigold100, // #FDEFD3
    borderWidth: 1,
    borderColor: COLORS.marigold200, // #FBE0AE
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 28,
  },
  pillBadgeText: {
    color: COLORS.marigold700, // #8A5200
    fontSize: 13,
    fontWeight: '700',
  },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.green100, // #E4F3EA
    borderWidth: 2,
    borderColor: COLORS.green500, // #33A862
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.ink900, // #17251E
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.ink500, // #6B7772
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },
  bottomContainer: {
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.green700, // #1E7A46
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.line, // #EAE9E2
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: RADIUS.pill, // 999px
    backgroundColor: COLORS.green700, // #1E7A46
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
