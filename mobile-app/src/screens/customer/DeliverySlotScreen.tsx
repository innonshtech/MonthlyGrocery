import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckoutBackIcon,
  AddressRadioOnIcon,
  AddressRadioOffIcon,
  SlotInfoIcon,
} from '../../components/CheckoutFigmaIcons';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS } from '../../constants/theme';
import { API_BASE } from '../../config/api';

const SCREEN_BG = '#F8FAF8';

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
  const insets = useSafeAreaInsets();
  const currentSlot = route?.params?.selectedSlot;
  const shopId = route?.params?.shopId;
  const pincode = route?.params?.pincode;
  const city = route?.params?.city;
  const area = route?.params?.area;

  const [resolvedShopId, setResolvedShopId] = useState<string | undefined>(shopId);

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
      if (city) params.set('city', city);
      if (area) params.set('area', area);

      const res = await fetch(`${API_BASE}/delivery-slots?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load slots');
      }

      if (data.shop_id) {
        setResolvedShopId(data.shop_id);
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
  }, [shopId, pincode, city, area, currentSlot?.dateLabel, currentSlot?.date, currentSlot?.timeWindow]);

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
      shopId: resolvedShopId || shopId || undefined,
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

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <CheckoutBackIcon size={22} />
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
          <SlotInfoIcon size={18} />
          <Text style={styles.infoBannerText}>
            Your whole monthly order arrives together in this one 4-hour window.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedWindow || selectedWindow.disabled) && styles.confirmBtnDisabled]}
          onPress={handleConfirmSlot}
          activeOpacity={0.85}
          disabled={!selectedWindow || selectedWindow.disabled}
        >
          <Text style={styles.confirmBtnText}>Confirm slot</Text>
        </TouchableOpacity>
      </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dateCardSelected: {
    backgroundColor: '#1E7A46',
  },
  dateCardLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  dateCardLabelSelected: {
    color: '#FFFFFF',
  },
  dateCardDay: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 22,
    color: '#111827',
  },
  dateCardDaySelected: {
    color: '#FFFFFF',
  },
  windowList: {
    gap: 10,
  },
  windowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  windowCardSelected: {
    borderWidth: 1.5,
    borderColor: '#1E7A46',
  },
  windowCardDisabled: {
    opacity: 0.5,
  },
  windowLabel: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  windowLabelDisabled: {
    color: '#94A3B8',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeAvailable: {
    backgroundColor: '#EAF5EE',
  },
  badgeRecommended: {
    backgroundColor: '#EAF5EE',
  },
  badgeFilling: {
    backgroundColor: '#FDF0DC',
  },
  badgeFull: {
    backgroundColor: '#F1F5F2',
  },
  badgeText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: '#1E7A46',
  },
  badgeTextFilling: {
    color: '#B45309',
  },
  badgeTextMuted: {
    color: '#64748B',
  },
  infoBanner: {
    backgroundColor: '#EAF5EE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  infoBannerText: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#1E7A46',
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  confirmBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  confirmBtnDisabled: {
    backgroundColor: '#1E7A46',
    opacity: 0.45,
  },
  confirmBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
