import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckoutBackIcon,
  AddressRadioOnIcon,
  AddressRadioOffIcon,
  SlotInfoIcon,
} from '../../components/CheckoutFigmaIcons';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS } from '../../constants/theme';
import { API_BASE } from '../../config/api';

const SCREEN_BG = '#FBFAF6';

type BadgeType = 'available' | 'recommended' | 'filling' | 'full';

type SlotWindow = {
  id: string;
  label: string;
  badge: string;
  badgeType: BadgeType;
  disabled: boolean;
};

type DayOption = {
  id: string;
  date: string;
  label: string;
  day: string;
  windows: SlotWindow[];
};

export default function DeliverySlotScreen({ route, navigation }: any) {
  const currentSlot = route?.params?.selectedSlot;
  const shopId = route?.params?.shopId;
  const pincode = route?.params?.pincode;

  const [days, setDays] = useState<DayOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateId, setSelectedDateId] = useState('day-0');
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: '4' });
      if (shopId) params.set('shop_id', shopId);
      if (pincode) params.set('pincode', pincode);

      const res = await fetch(`${API_BASE}/delivery-slots?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load slots');
      }

      const loadedDays: DayOption[] = data.days || [];
      setDays(loadedDays);

      const matchDate =
        loadedDays.find((d) => d.label === currentSlot?.dateLabel)?.id ||
        loadedDays.find((d) => d.date === currentSlot?.date)?.id ||
        loadedDays[0]?.id;
      setSelectedDateId(matchDate || 'day-0');

      const dayForWindow =
        loadedDays.find((d) => d.id === matchDate) || loadedDays[0];
      const matchWindow =
        dayForWindow?.windows.find((w) => w.label === currentSlot?.timeWindow)?.id ||
        dayForWindow?.windows.find((w) => !w.disabled)?.id ||
        dayForWindow?.windows[0]?.id;
      setSelectedWindowId(matchWindow || null);
    } catch (err: any) {
      Alert.alert('Could not load slots', err.message || 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [shopId, pincode, currentSlot?.dateLabel, currentSlot?.date, currentSlot?.timeWindow]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const selectedDate = days.find((d) => d.id === selectedDateId) || days[0];
  const timeWindows = selectedDate?.windows || [];

  useEffect(() => {
    if (!selectedDate) return;
    const current = timeWindows.find((w) => w.id === selectedWindowId);
    if (!current || current.disabled) {
      const firstOpen = timeWindows.find((w) => !w.disabled);
      if (firstOpen) setSelectedWindowId(firstOpen.id);
    }
  }, [selectedDateId, days]);

  const selectedWindow = timeWindows.find((w) => w.id === selectedWindowId);

  const handleConfirmSlot = () => {
    if (!selectedDate || !selectedWindow || selectedWindow.disabled) {
      Alert.alert('Select a slot', 'Please choose an available delivery window.');
      return;
    }

    const slotData = {
      date: selectedDate.date,
      dateLabel: selectedDate.label,
      timeWindow: selectedWindow.label,
      windowId: selectedWindow.id,
      shopId: shopId || undefined,
    };

    navigation.navigate({
      name: 'Checkout',
      params: { selectedSlot: slotData },
      merge: true,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingWrap}>
          <AppLoader message="Loading live delivery slots..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose delivery slot</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT A DAY</Text>
          <View style={styles.dateRow}>
            {days.map((d) => {
              const selected = d.id === selectedDateId;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dateCard, selected && styles.dateCardSelected]}
                  onPress={() => setSelectedDateId(d.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dateCardLabel, selected && styles.dateCardLabelSelected]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.dateCardDay, selected && styles.dateCardDaySelected]}>
                    {d.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>4-HOUR DELIVERY WINDOWS</Text>
          <View style={styles.windowList}>
            {timeWindows.map((window) => {
              const selected = window.id === selectedWindowId;
              const disabled = window.disabled;
              return (
                <TouchableOpacity
                  key={window.id}
                  style={[
                    styles.windowCard,
                    selected && styles.windowCardSelected,
                    disabled && styles.windowCardDisabled,
                  ]}
                  onPress={() => !disabled && setSelectedWindowId(window.id)}
                  activeOpacity={disabled ? 1 : 0.85}
                  disabled={disabled}
                >
                  {selected ? <AddressRadioOnIcon size={22} /> : <AddressRadioOffIcon size={22} />}
                  <Text
                    style={[
                      styles.windowLabel,
                      disabled && styles.windowLabelDisabled,
                    ]}
                  >
                    {window.label}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      window.badgeType === 'available' && styles.badgeAvailable,
                      window.badgeType === 'recommended' && styles.badgeRecommended,
                      window.badgeType === 'filling' && styles.badgeFilling,
                      window.badgeType === 'full' && styles.badgeFull,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        window.badgeType === 'filling' && styles.badgeTextFilling,
                        window.badgeType === 'full' && styles.badgeTextMuted,
                      ]}
                    >
                      {window.badge}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.infoBanner}>
          <SlotInfoIcon size={17} />
          <Text style={styles.infoBannerText}>
            Your whole monthly order arrives together in this one 4-hour window.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirmBtn, (selectedWindow?.disabled) && styles.confirmBtnDisabled]}
            onPress={handleConfirmSlot}
            activeOpacity={0.85}
            disabled={!selectedWindow || selectedWindow.disabled}
          >
            <Text style={styles.confirmBtnText}>Confirm slot</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink500,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 16,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.44,
    color: COLORS.ink500,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 9,
  },
  dateCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: 11,
    alignItems: 'center',
    gap: 2,
  },
  dateCardSelected: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  dateCardLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink500,
  },
  dateCardLabelSelected: {
    color: '#FFFFFF',
  },
  dateCardDay: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  dateCardDaySelected: {
    color: '#FFFFFF',
  },
  windowList: {
    gap: 10,
  },
  windowCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  windowCardSelected: {
    backgroundColor: COLORS.green50,
    borderColor: COLORS.green700,
    borderWidth: 1.8,
  },
  windowCardDisabled: {
    opacity: 1,
  },
  windowLabel: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
    flex: 1,
  },
  windowLabelDisabled: {
    color: COLORS.ink300,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeAvailable: {
    backgroundColor: COLORS.green100,
  },
  badgeRecommended: {
    backgroundColor: COLORS.green100,
  },
  badgeFilling: {
    backgroundColor: COLORS.marigold100,
  },
  badgeFull: {
    backgroundColor: COLORS.muted,
  },
  badgeText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.green700,
  },
  badgeTextFilling: {
    color: COLORS.marigold700,
  },
  badgeTextMuted: {
    color: COLORS.ink500,
  },
  infoBanner: {
    backgroundColor: COLORS.green100,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  infoBannerText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.green800,
    flex: 1,
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  confirmBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.ink300,
  },
  confirmBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
