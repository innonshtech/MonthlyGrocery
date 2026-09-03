import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
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

/**
 * A2 · Value Intro 1–3 — Redesign (Figma nodes 391:602, 392:602, 393:602)
 * All copy, gradients, and chip layout from /api/admin/onboarding.
 */
export default function ValueIntroScreen({ navigation }: any) {
  const { token, user } = useAuth();
  const [slides, setSlides] = useState<ValueIntroSlideConfig[]>([]);
  const [introMeta, setIntroMeta] = useState<ValueIntroMetaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { widthScale: scale, illustrationHeight, bottomPadding: footerBottomPad } =
    useOnboardingLayout();

  const loadSlides = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const config = await fetchOnboardingConfig();
    setIntroMeta(config?.value_intro_meta ?? null);
    const list = config?.value_intro_slides
      ? [...config.value_intro_slides].sort((a, b) => a.order - b.order)
      : [];
    setSlides(list);
    setCurrentIndex(0);
    setLoadError(list.length === 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const slide = slides[currentIndex];
  const isLastSlide = slides.length > 0 && currentIndex === slides.length - 1;

  const goToLogin = async (markCompleted = true) => {
    if (markCompleted) {
      await markValueIntroCompletedThisSession();
    }
    if (token && user?.role === 'consumer') {
      navigation.replace('Shop');
      return;
    }
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      goToLogin();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <AppLoader message="Loading..." />
      </SafeAreaView>
    );
  }

  if (loadError || !slide) {
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
        <TouchableOpacity onPress={() => goToLogin(false)} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>
            {introMeta?.skip_to_login_label || ''}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

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

        {slide.show_skip ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={goToLogin}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}

        {slide.emoji_chips.map((item, index) => (
          <OnboardingEmojiChip
            key={`${slide.id}-chip-${index}`}
            emoji={item.emoji}
            size={item.size * scale}
            style={{ left: item.left * scale, top: item.top * scale }}
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
              {slide.center_emoji}
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
