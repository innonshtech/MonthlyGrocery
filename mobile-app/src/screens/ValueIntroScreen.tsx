import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  OnboardingCategoryBadge,
  OnboardingEmojiChip,
  OnboardingDots,
  OnboardingNextPill,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import { COLORS } from '../constants/theme';

interface EmojiPlacement {
  emoji: string;
  size: number;
  left: number;
  top: number;
}

interface FloatingBadge {
  label: string;
  left: number;
  top: number;
}

interface ValueSlide {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  emojis: EmojiPlacement[];
  center?: { emoji: string; size: number };
  badge?: FloatingBadge;
  showSkip: boolean;
}

const SLIDES: ValueSlide[] = [
  {
    id: 'slide-1',
    category: 'MONTHLY BASKET',
    title: 'Plan your whole month in one go',
    subtitle:
      'No daily scrambling. Build your household’s monthly grocery once, then reorder in a single tap.',
    center: { emoji: '🍚', size: 88 },
    badge: { label: 'Save ₹1,340/mo', left: 250, top: 176 },
    emojis: [
      { emoji: '🫒', size: 70, left: 74, top: 116 },
      { emoji: '🥬', size: 78, left: 258, top: 104 },
      { emoji: '🫘', size: 68, left: 72, top: 244 },
      { emoji: '🍎', size: 66, left: 286, top: 236 },
      { emoji: '🍞', size: 72, left: 214, top: 286 },
    ],
    showSkip: true,
  },
  {
    id: 'slide-2',
    category: 'REORDER',
    title: 'Copy last month in one tap',
    subtitle:
      'Your last basket, ready to go. Tweak what you need and check out in seconds.',
    center: { emoji: '📋', size: 112 },
    badge: { label: '1-tap reorder', left: 232, top: 182 },
    emojis: [
      { emoji: '🍚', size: 66, left: 58, top: 112 },
      { emoji: '🫒', size: 64, left: 272, top: 116 },
      { emoji: '🫘', size: 64, left: 66, top: 266 },
      { emoji: '🥬', size: 68, left: 264, top: 260 },
    ],
    showSkip: true,
  },
  {
    id: 'slide-3',
    category: 'BEST VALUE',
    title: 'Save more on every order',
    subtitle:
      'Baskets over ₹2,500 unlock the best prices - delivered in a planned 4-hour window, not a frantic 10 minutes.',
    center: { emoji: '💰', size: 112 },
    emojis: [
      { emoji: '🫒', size: 64, left: 74, top: 116 },
      { emoji: '🍚', size: 64, left: 262, top: 262 },
    ],
    badge: { label: '20% OFF', left: 250, top: 120 },
    showSkip: false,
  },
];

const GRADIENTS = [
  { start: '#E4F3EA', end: '#C6E9D3' }, // Slide 1: Green-ish
  { start: '#E7EEFB', end: '#D3DFF6' }, // Slide 2: Blue-ish
  { start: '#FDEFD3', end: '#FBE7B6' }, // Slide 3: Orange-ish
];

export default function ValueIntroScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const scale = width / 390;

  const slide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => navigation.navigate('Login');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Illustration area */}
      <View style={styles.illustrationArea}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id={`grad-${currentIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={GRADIENTS[currentIndex].start} />
              <Stop offset="100%" stopColor={GRADIENTS[currentIndex].end} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#grad-${currentIndex})`} />
        </Svg>

        {slide.showSkip ? (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}

        {slide.emojis.map((item, index) => (
          <OnboardingEmojiChip
            key={index}
            emoji={item.emoji}
            size={item.size * scale}
            style={{ left: item.left * scale, top: item.top * scale }}
          />
        ))}

        {slide.center ? (
          <View
            style={[
              styles.centerChip,
              {
                width: slide.center.size * scale,
                height: slide.center.size * scale,
                borderRadius: slide.center.size * scale * 0.5,
                left: (195 - slide.center.size / 2) * scale,
                top: 150 * scale,
              },
            ]}
          >
            <Text style={{ fontSize: slide.center.size * scale * 0.42 }}>
              {slide.center.emoji}
            </Text>
          </View>
        ) : null}

        {slide.badge ? (
          <View
            style={[
              styles.floatingBadge,
              { left: slide.badge.left * scale, top: slide.badge.top * scale },
            ]}
          >
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.floatingBadgeText}>{slide.badge.label}</Text>
          </View>
        ) : null}

        {currentIndex === 2 ? (
          <View style={[styles.floatingBadge, { left: 60 * scale, top: 268 * scale }]}>
            <Text style={styles.floatingBadgeText}>Lowest price</Text>
          </View>
        ) : null}
      </View>

      {/* Copy block */}
      <View style={styles.copyBlock}>
        <OnboardingCategoryBadge label={slide.category} />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {isLastSlide ? (
          <>
            <View style={styles.footerDotsCenter}>
              <OnboardingDots total={SLIDES.length} activeIndex={currentIndex} />
            </View>
            <OnboardingPrimaryButton label="Get started" onPress={handleNext} />
          </>
        ) : (
          <View style={styles.footerRow}>
            <OnboardingDots total={SLIDES.length} activeIndex={currentIndex} />
            <OnboardingNextPill onPress={handleNext} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  illustrationArea: {
    height: 432,
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  skipBtn: {
    position: 'absolute',
    top: 58,
    right: 26,
    zIndex: 10,
  },
  skipPlaceholder: {
    height: 16,
  },
  skipText: {
    fontFamily: 'Mukta',
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink500,
  },
  centerChip: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F3D26',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.marigold500,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    zIndex: 5,
  },
  sparkle: {
    fontSize: 12,
    color: COLORS.ink900,
    fontWeight: '700',
  },
  floatingBadgeText: {
    fontFamily: 'Mukta',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  copyBlock: {
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Baloo 2',
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Mukta',
    fontSize: 16,
    color: COLORS.ink500,
    lineHeight: 24,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 26,
    paddingBottom: 28,
    gap: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
  },
  footerDotsCenter: {
    alignItems: 'center',
    marginBottom: 8,
  },
});
