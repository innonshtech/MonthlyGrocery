import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';
import AppIcon from '../components/AppIcon';

type SlotWindow = {
  id: string;
  label: string;
  badge: string;
  badgeType: string;
  disabled: boolean;
  booked_count: number;
  max_capacity: number;
  is_closed: boolean;
  is_recommended: boolean;
};

type DaySlot = {
  id: string;
  date: string;
  label: string;
  day: string;
  windows: SlotWindow[];
};

export default function DeliverySlotsScreen() {
  const navigation = useNavigation();
  const { token } = useMerchantAuth();
  const [days, setDays] = useState<DaySlot[]>([]);
  const [selectedDayId, setSelectedDayId] = useState('day-0');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadSlots = async () => {
    try {
      const res = await fetch(`${API_BASE}/delivery-slots/merchant?days=4`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDays(data.days || []);
        if (!data.days?.some((d: DaySlot) => d.id === selectedDayId)) {
          setSelectedDayId(data.days?.[0]?.id || 'day-0');
        }
      }
    } catch {
      Alert.alert('Error', 'Could not load delivery slots. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        setLoading(true);
        loadSlots();
      }
    }, [token]),
  );

  const selectedDay = days.find((d) => d.id === selectedDayId) || days[0];

  const updateSlot = async (
    date: string,
    windowId: string,
    updates: Record<string, unknown>,
  ) => {
    setUpdatingId(`${date}-${windowId}`);
    try {
      const res = await fetch(`${API_BASE}/delivery-slots/merchant`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, window_id: windowId, ...updates }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDays(data.days || []);
      } else {
        Alert.alert('Update failed', data.error || 'Could not update slot');
      }
    } catch {
      Alert.alert('Error', 'Network error while updating slot');
    } finally {
      setUpdatingId(null);
    }
  };

  const adjustCapacity = (window: SlotWindow, delta: number) => {
    const next = Math.max(1, Math.min(500, window.max_capacity + delta));
    if (next !== window.max_capacity) {
      updateSlot(selectedDay.date, window.id, { max_capacity: next });
    }
  };

  const badgeStyle = (type: string) => {
    if (type === 'full') return styles.badgeFull;
    if (type === 'filling') return styles.badgeFilling;
    if (type === 'recommended') return styles.badgeRecommended;
    return styles.badgeAvailable;
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: '#0F172A' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Delivery Slots</Text>
          <Text style={styles.headerSub}>Live capacity · customers see this in real time</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>SELECT A DAY</Text>
          <View style={styles.dateRow}>
            {days.map((d) => {
              const selected = d.id === selectedDayId;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dateCard, selected && styles.dateCardSelected]}
                  onPress={() => setSelectedDayId(d.id)}
                >
                  <Text style={[styles.dateLabel, selected && styles.dateLabelSelected]}>{d.label}</Text>
                  <Text style={[styles.dateDay, selected && styles.dateDaySelected]}>{d.day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>4-HOUR WINDOWS</Text>
          {selectedDay?.windows.map((window) => {
            const busy = updatingId === `${selectedDay.date}-${window.id}`;
            return (
              <View key={window.id} style={styles.slotCard}>
                <View style={styles.slotTop}>
                  <Text style={styles.slotLabel}>{window.label}</Text>
                  <View style={[styles.badge, badgeStyle(window.badgeType)]}>
                    <Text style={styles.badgeText}>{window.badge}</Text>
                  </View>
                </View>

                <Text style={styles.bookedText}>
                  Booked: {window.booked_count} / {window.max_capacity}
                </Text>

                <View style={styles.capacityRow}>
                  <Text style={styles.capacityLabel}>Max orders</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustCapacity(window, -1)}
                      disabled={busy}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.capacityValue}>{window.max_capacity}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustCapacity(window, 1)}
                      disabled={busy}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Mark as Full (closed)</Text>
                  <Switch
                    value={window.is_closed}
                    onValueChange={(val) =>
                      updateSlot(selectedDay.date, window.id, { is_closed: val })
                    }
                    trackColor={{ false: '#E2E8F0', true: '#FECACA' }}
                    thumbColor={window.is_closed ? '#DC2626' : '#94A3B8'}
                    disabled={busy}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Recommended badge</Text>
                  <Switch
                    value={window.is_recommended}
                    onValueChange={(val) =>
                      updateSlot(selectedDay.date, window.id, { is_recommended: val })
                    }
                    trackColor={{ false: '#E2E8F0', true: '#BBF7D0' }}
                    thumbColor={window.is_recommended ? '#16A34A' : '#94A3B8'}
                    disabled={busy}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dateCardSelected: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  dateLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  dateLabelSelected: { color: '#FFFFFF' },
  dateDay: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  dateDaySelected: { color: '#FFFFFF' },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeAvailable: { backgroundColor: '#DCFCE7' },
  badgeRecommended: { backgroundColor: '#DCFCE7' },
  badgeFilling: { backgroundColor: '#FEF3C7' },
  badgeFull: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  bookedText: { fontSize: 12, color: '#64748B', marginTop: 8 },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  capacityLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  capacityValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', minWidth: 28, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleLabel: { fontSize: 13, color: '#334155', fontWeight: '500' },
});
