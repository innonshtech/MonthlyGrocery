import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import AppIcon from '../AppIcon';
import {
  OnboardingBackIcon,
  OnboardingRadioIcon,
} from './OnboardingFigmaIcons';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

export function OnboardingBackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.backBtn}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <OnboardingBackIcon size={22} />
    </TouchableOpacity>
  );
}

export function OnboardingCategoryBadge({ label }: { label: string }) {
  return (
    <View style={styles.categoryBadge}>
      <Text style={styles.categoryBadgeText}>{label}</Text>
    </View>
  );
}

export function OnboardingEmojiChip({
  emoji,
  size,
  style,
}: {
  emoji: string;
  size: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.emojiChip,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
}

export function OnboardingRadio({ selected }: { selected: boolean }) {
  return <OnboardingRadioIcon selected={selected} size={22} />;
}

export function OnboardingPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  showArrow = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  showArrow?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.primaryBtnInner}>
          <Text style={styles.primaryBtnText}>{label}</Text>
          {showArrow ? (
            <AppIcon name="arrow-right" size={18} color="#FFFFFF" />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function OnboardingNextPill({
  label = 'Next',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.nextPill} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.nextPillText}>{label}</Text>
      <AppIcon name="arrow-right" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

export function OnboardingDots({
  total,
  activeIndex,
}: {
  total: number;
  activeIndex: number;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            activeIndex === index ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingSectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 12,
  },
  categoryBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.green700,
    letterSpacing: 0.6,
  },
  emojiChip: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F3D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  primaryBtn: {
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    ...FONTS.balooSemiBold,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 16,
  },
  nextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 22,
    height: 46,
  },
  nextPillText: {
    ...FONTS.balooSemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.green700,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.ink300,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    marginBottom: 16,
  },
});
