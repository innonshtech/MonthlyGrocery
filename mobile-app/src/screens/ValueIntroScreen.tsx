import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  FlatList,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppLoader from '../components/AppLoader';
import {
  OnboardingCategoryBadge,
  OnboardingEmojiChip,
  OnboardingDots,
  OnboardingNextPill,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import { OnboardingBackIcon } from '../components/onboarding/OnboardingFigmaIcons';
import {
  useOnboardingLayout,
} from '../components/onboarding/onboardingLayout';
import { COLORS, FONTS } from '../constants/theme';
import {
  fetchOnboardingConfig,
  ValueIntroSlideConfig,
  ValueIntroMetaConfig,
  markValueIntroCompletedThisSession,
} from '../services/onboardingApi';
import { useAuth } from '../context/AuthContext';

const VEGGIE_FRUIT_REPLACEMENTS: Record<string, string> = {
  '🫒': '🌾', // Olive -> Wheat/Atta
  '🥬': '🧈', // Lettuce/Cabbage -> Ghee/Oil
  '🍎': '🧂', // Apple -> Spices/Salt
  '🍞': '☕', // Bread -> Tea/Coffee
};

const sanitizeSlideEmoji = (emoji?: string): string => {
  if (!emoji) return '';
  return VEGGIE_FRUIT_REPLACEMENTS[emoji] || emoji;
};

const DEFAULT_SLIDES: ValueIntroSlideConfig[] = [
  {
    id: 'value-intro-1',
    order: 1,
    category: 'MONTHLY BASKET',
    title: 'Plan your whole month in one go',
    subtitle:
      'Add everything your home needs for the month, order once, and skip the weekly grocery runs.',
    badge_label: 'Save ₹340/mo',
    badge_left: 250,
    badge_top: 176,
    show_skip: true,
    gradient_start: '#E4F3EA',
    gradient_end: '#C6E9D3',
    center_emoji: '🍚',
    center_size: 88,
    emoji_chips: [
      { emoji: '🌾', size: 70, left: 74, top: 116 },
      { emoji: '🧈', size: 78, left: 258, top: 104 },
      { emoji: '🫘', size: 68, left: 72, top: 244 },
      { emoji: '🧂', size: 66, left: 286, top: 236 },
      { emoji: '☕', size: 72, left: 214, top: 286 },
    ],
  },
  {
    id: 'value-intro-2',
    order: 2,
    category: 'REORDER',
    title: 'Copy last month in one tap',
    subtitle:
      'Your last basket, ready to go. Tweak what you need and check out in seconds.',
    badge_label: '1-tap reorder',
    badge_left: 232,
    badge_top: 182,
    show_skip: true,
    gradient_start: '#E7EEFB',
    gradient_end: '#D3DFF6',
    center_emoji: '📋',
    center_size: 112,
    emoji_chips: [
      { emoji: '🍚', size: 66, left: 58, top: 112 },
      { emoji: '🌾', size: 64, left: 272, top: 116 },
      { emoji: '🫘', size: 64, left: 66, top: 266 },
      { emoji: '🧈', size: 68, left: 264, top: 260 },
    ],
  },
  {
    id: 'value-intro-3',
    order: 3,
    category: 'BEST VALUE',
    title: 'Save more on every order',
    subtitle:
      'We compare and pick the lowest area price for you, so your monthly basket always costs less.',
    badge_label: '20% OFF',
    badge_left: 250,
    badge_top: 120,
    secondary_badge_label: 'Lowest price',
    secondary_badge_left: 60,
    secondary_badge_top: 268,
    show_skip: false,
    gradient_start: '#FDEFD3',
    gradient_end: '#FBE7B6',
    center_emoji: '💰',
    center_size: 112,
    emoji_chips: [
      { emoji: '🌾', size: 64, left: 74, top: 116 },
      { emoji: '🍚', size: 64, left: 262, top: 262 },
    ],
  },
];

export default function ValueIntroScreen({ navigation }: any) {
  const { token, user, city, area } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [slides, setSlides] = useState<ValueIntroSlideConfig[]>(DEFAULT_SLIDES);
  const [introMeta, setIntroMeta] = useState<ValueIntroMetaConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { widthScale: scale, illustrationHeight, bottomPadding: footerBottomPad } =
    useOnboardingLayout();

  const loadSlides = useCallback(async () => {
    try {
      const config = await fetchOnboardingConfig();
      if (config?.value_intro_meta) {
        setIntroMeta(config.value_intro_meta);
      }
      if (config?.value_intro_slides && config.value_intro_slides.length > 0) {
        const list = config.value_intro_slides
          .map((slide) => ({
            ...slide,
            center_emoji: sanitizeSlideEmoji(slide.center_emoji),
            emoji_chips: slide.emoji_chips.map((chip) => ({
              ...chip,
              emoji: sanitizeSlideEmoji(chip.emoji),
            })),
          }))
          .sort((a, b) => a.order - b.order);
        setSlides(list);
      }
    } catch {
      // Keep DEFAULT_SLIDES on network error
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
      return true;
    }
    return false;
  }, [currentIndex]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      return handlePrev();
    });
    return () => subscription.remove();
  }, [handlePrev]);

  const isLastSlide = slides.length > 0 && currentIndex === slides.length - 1;

  const goToLogin = async (markCompleted = true) => {
    if (markCompleted) {
      await markValueIntroCompletedThisSession();
    }
    if (token && user?.role === 'consumer') {
      if (!city || !area) {
        navigation.navigate('CitySelection');
        return;
      }
      navigation.replace('Shop');
      return;
    }
    navigation.navigate('Login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      goToLogin(true);
    }
  };

  const handleScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index >= 0 && index < slides.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const getItemLayout = (_: any, index: number) => ({
    length: windowWidth,
    offset: windowWidth * index,
    index,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <AppLoader message="Loading..." />
      </SafeAreaView>
    );
  }

  if (loadError || slides.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorTitle}>
          {introMeta?.load_error_title || ''}
        </Text>
        <Text style={styles.errorSubtitle}>
          {introMeta?.load_error_subtitle || ''}
        </Text>
        <OnboardingPrimaryButton
          label={introMeta?.retry_label || 'Retry'}
          onPress={loadSlides}
        />
        <TouchableOpacity onPress={() => goToLogin(true)} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>
            {introMeta?.skip_to_login_label || ''}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderSlideItem = ({ item: slide }: { item: ValueIntroSlideConfig }) => {
    return (
      <View style={{ width: windowWidth, flex: 1 }}>
        <View style={[styles.illustrationArea, { height: illustrationHeight }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id={`grad-${slide.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={slide.gradient_start} />
                <Stop offset="100%" stopColor={slide.gradient_end} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#grad-${slide.id})`} />
          </Svg>

          {currentIndex > 0 && (
            <TouchableOpacity
              style={styles.introBackBtn}
              onPress={handlePrev}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <OnboardingBackIcon size={20} />
            </TouchableOpacity>
          )}

          {slide.show_skip ? (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => goToLogin(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}

          {slide.emoji_chips.map((chip, chipIdx) => (
            <OnboardingEmojiChip
              key={`${slide.id}-chip-${chipIdx}`}
              emoji={sanitizeSlideEmoji(chip.emoji)}
              size={chip.size * scale}
              style={{ left: chip.left * scale, top: chip.top * scale }}
            />
          ))}

          {slide.center_emoji && slide.center_size ? (
            <View
              style={[
                styles.centerChip,
                {
                  width: slide.center_size * scale,
                  height: slide.center_size * scale,
                  borderRadius: slide.center_size * scale * 0.5,
                  left: (195 - slide.center_size / 2) * scale,
                  top: 150 * scale,
                },
              ]}
            >
              <Text style={{ fontSize: slide.center_size * scale * 0.42 }}>
                {sanitizeSlideEmoji(slide.center_emoji)}
              </Text>
            </View>
          ) : null}

          {slide.badge_label && slide.badge_left != null && slide.badge_top != null ? (
            <View
              style={[
                styles.floatingBadge,
                { left: slide.badge_left * scale, top: slide.badge_top * scale },
              ]}
            >
              <Text style={styles.sparkle}>✦</Text>
              <Text style={styles.floatingBadgeText}>{slide.badge_label}</Text>
            </View>
          ) : null}

          {slide.secondary_badge_label &&
          slide.secondary_badge_left != null &&
          slide.secondary_badge_top != null ? (
            <View
              style={[
                styles.floatingBadge,
                {
                  left: slide.secondary_badge_left * scale,
                  top: slide.secondary_badge_top * scale,
                },
              ]}
            >
              <Text style={styles.floatingBadgeText}>{slide.secondary_badge_label}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.copyBlock}>
          <OnboardingCategoryBadge label={slide.category} />
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderSlideItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={getItemLayout}
        style={{ flex: 1 }}
      />

      <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
        {isLastSlide ? (
          <>
            <View style={styles.footerDotsCenter}>
              <OnboardingDots total={slides.length} activeIndex={currentIndex} />
            </View>
            <OnboardingPrimaryButton
              label={introMeta?.final_cta_label || 'Continue'}
              onPress={handleNext}
            />
          </>
        ) : (
          <View style={styles.footerRow}>
            <OnboardingDots total={slides.length} activeIndex={currentIndex} />
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
  centered: {
    flex: 1,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.ink900,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  skipLink: {
    paddingVertical: 8,
  },
  skipLinkText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.green700,
  },
  illustrationArea: {
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  introBackBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.green500,
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
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink900,
  },
  copyBlock: {
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink500,
    lineHeight: 24,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 26,
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
