import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const DATE_OPTIONS = [
  { id: 'd1', label: 'Tomorrow', sub: 'Wed, 19 Aug', isDefault: true },
  { id: 'd2', label: 'Day After', sub: 'Thu, 20 Aug', isDefault: false },
  { id: 'd3', label: 'Friday', sub: '21 Aug', isDefault: false },
];

const TIME_WINDOWS = [
  { id: 't1', title: 'Morning', time: '7:00 AM - 10:00 AM', badge: 'Most Popular' },
  { id: 't2', title: 'Afternoon', time: '12:00 PM - 3:00 PM' },
  { id: 't3', title: 'Evening', time: '6:00 PM - 9:00 PM' },
];

export default function DeliverySlotScreen({ route, navigation }: any) {
  const currentSlot = route?.params?.selectedSlot || {};
  const [selectedDate, setSelectedDate] = useState<string>('Tomorrow');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>(
    currentSlot.timeWindow || 'Morning 7:00 AM - 10:00 AM'
  );

  const handleConfirmSlot = () => {
    const slotData = {
      dateLabel: selectedDate,
      timeWindow: selectedTimeWindow,
    };
    navigation.navigate('Checkout', { selectedSlot: slotData });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select delivery slot</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Date Selection */}
        <Text style={styles.sectionHeading}>SELECT DELIVERY DATE</Text>
        <View style={styles.dateRow}>
          {DATE_OPTIONS.map((d) => {
            const isSelected = selectedDate === d.label;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDate(d.label)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateLabel, isSelected && styles.dateLabelActive]}>
                  {d.label}
                </Text>
                <Text style={[styles.dateSub, isSelected && styles.dateSubActive]}>
                  {d.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time Window Selection */}
        <Text style={styles.sectionHeading}>SELECT TIME WINDOW</Text>
        <View style={styles.timeList}>
          {TIME_WINDOWS.map((t) => {
            const isSelected = selectedTimeWindow.includes(t.title);
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.timeCard, isSelected && styles.timeCardActive]}
                onPress={() => setSelectedTimeWindow(`${t.title} ${t.time}`)}
                activeOpacity={0.85}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                <View style={styles.timeInfo}>
                  <View style={styles.timeTitleRow}>
                    <Text style={styles.timeTitle}>{t.title}</Text>
                    {t.badge && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>{t.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timeSub}>{t.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmSlot}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm delivery slot</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  dateCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  dateCardActive: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green50,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  dateLabelActive: {
    color: COLORS.green700,
  },
  dateSub: {
    fontSize: 11,
    color: COLORS.ink500,
  },
  dateSubActive: {
    color: COLORS.green700,
    fontWeight: '600',
  },
  timeList: {
    gap: 12,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  timeCardActive: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.surface,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: COLORS.ink300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioCircleActive: {
    borderColor: COLORS.green700,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green700,
  },
  timeInfo: {
    flex: 1,
  },
  timeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  popularBadge: {
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.marigold700,
  },
  timeSub: {
    fontSize: 12.5,
    color: COLORS.ink500,
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  confirmBtn: {
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
