import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

export default function StoreSettingsScreen() {
  const navigation = useNavigation<any>();
  const { token, user, logout } = useMerchantAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  const fetchShopProfile = () => {
    if (!token) return;
    fetch(`${API_BASE}/shops/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shop) {
          setShop(data.shop);
          setIsOpen(data.shop.is_open !== false);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchShopProfile();
  }, [token]);

  const handleToggleStoreStatus = async (newValue: boolean) => {
    setIsOpen(newValue);
    setTogglingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/shops/me/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_open: newValue }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsOpen(!newValue); // revert on failure
        Alert.alert('Error', data.error || 'Failed to update store status');
      } else {
        setShop(data.shop);
      }
    } catch {
      setIsOpen(!newValue);
      Alert.alert('Error', 'Network error updating store status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleUpdateStoreGps = async () => {
    setLocatingGps(true);
    try {
      const nav = (globalThis as any)?.navigator;
      if (nav && nav.geolocation) {
        nav.geolocation.getCurrentPosition(
          async (pos: any) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            await saveGpsCoordinates(lat, lng);
          },
          async () => {
            const fallbackLat = 18.5204;
            const fallbackLng = 73.8567;
            await saveGpsCoordinates(fallbackLat, fallbackLng);
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        const fallbackLat = 18.5204;
        const fallbackLng = 73.8567;
        await saveGpsCoordinates(fallbackLat, fallbackLng);
      }
    } catch {
      setLocatingGps(false);
    }
  };

  const saveGpsCoordinates = async (lat: number, lng: number, customRadius?: number) => {
    try {
      const radiusToSave = customRadius != null ? customRadius : (shop?.delivery_radius_km || 5.0);
      const res = await fetch(`${API_BASE}/shops/me/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          delivery_radius_km: radiusToSave,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShop(data.shop);
        if (customRadius != null) {
          Alert.alert('Updated', `Delivery radius updated to ${customRadius} km`);
        } else {
          Alert.alert('Success', `Store GPS coordinates pinned to (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } else {
        Alert.alert('Notice', data.error || 'Could not update settings');
      }
    } catch {
      Alert.alert('Error', 'Failed to save store settings');
    } finally {
      setLocatingGps(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out from the Merchant Partner console?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleOpenSupport = () => {
    const whatsappUrl = 'https://wa.me/918830480015?text=Hello%20MonthlyGrocery%20Super%20Admin,%20I%20need%20help%20with%20my%20merchant%20store.';
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Support', 'Please contact admin support at: support@monthlygrocery.in or +91 8830480015');
    });
  };

  const storeIdDisplay = shop?.id ? `#${shop.id.slice(0, 8).toUpperCase()}` : '';

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Store Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Open / Closed Status Toggle */}
        <View style={[styles.statusToggleCard, isOpen ? styles.statusOpen : styles.statusClosed]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusToggleHeading}>
              {isOpen ? '🟢 STORE IS ONLINE' : '🔴 STORE IS OFFLINE'}
            </Text>
            <Text style={styles.statusToggleSub}>
              {isOpen ? 'Accepting incoming customer grocery orders' : 'Orders paused — turn on to resume'}
            </Text>
          </View>
          {togglingStatus ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : (
            <Switch
              value={isOpen}
              onValueChange={handleToggleStoreStatus}
              trackColor={{ false: '#EF4444', true: '#22C55E' }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>

        {/* Store Profile Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeIconBox}>
            <Text style={{ fontSize: 32 }}>🏪</Text>
          </View>
          <View style={styles.storeInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.storeRoleBadge}>AUTHORIZED STORE PARTNER</Text>
              {storeIdDisplay ? (
                <Text style={styles.storeIdBadge}>{storeIdDisplay}</Text>
              ) : null}
            </View>
            <Text style={styles.storeName}>{shop?.shop_name || user?.name || 'Local Kirana Partner'}</Text>
            <Text style={styles.storeOwner}>👤 {user?.name || 'Store Owner'}</Text>
            <Text style={styles.storePhone}>📞 +91 {user?.mobile ? user.mobile.slice(-10) : 'N/A'}</Text>
            {shop?.city ? (
              <Text style={styles.storeTerritory}>📍 {shop.city.toUpperCase()}{shop.district_name ? ` · ${shop.district_name}` : ''}</Text>
            ) : null}
          </View>
        </View>

        {/* Location & Geospatial Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>GEOSPATIAL & DELIVERY RADIUS</Text>

          <View style={styles.locRow}>
            <Text style={styles.locLabel}>GPS Coordinates:</Text>
            <Text style={styles.locValue}>
              {shop?.latitude != null && shop?.longitude != null
                ? `${shop.latitude.toFixed(4)}, ${shop.longitude.toFixed(4)}`
                : 'Not pinned yet'}
            </Text>
          </View>

          <View style={styles.locRow}>
            <Text style={styles.locLabel}>Operational Radius:</Text>
            <Text style={styles.locValue}>{shop?.delivery_radius_km || 5.0} km</Text>
          </View>

          {/* Quick Dynamic Radius Selector */}
          <View style={styles.radiusSelectorRow}>
            {[3, 5, 7, 10, 15, 20].map((r) => {
              const active = Math.round(shop?.delivery_radius_km || 5) === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, active && styles.radiusChipActive]}
                  onPress={() => saveGpsCoordinates(shop?.latitude || 18.5204, shop?.longitude || 73.8567, r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.locRow}>
            <Text style={styles.locLabel}>Base Area:</Text>
            <Text style={styles.locValue}>{shop?.area_name || shop?.city || 'Assigned Base Area'}</Text>
          </View>

          {shop?.assigned_locations && Array.isArray(shop.assigned_locations) && shop.assigned_locations.length > 0 ? (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
              <Text style={[styles.locLabel, { marginBottom: 6, color: '#0F172A', fontWeight: '700' }]}>
                🎯 Assigned Serviceable Localities ({shop.assigned_locations.length}):
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {shop.assigned_locations.map((loc: any) => (
                  <View
                    key={loc.id}
                    style={{
                      backgroundColor: '#F0FDF4',
                      borderColor: '#BBF7D0',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>
                      📍 {loc.area_name} {loc.pincode ? `(${loc.pincode})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.gpsUpdateBtn}
            onPress={handleUpdateStoreGps}
            disabled={locatingGps}
            activeOpacity={0.85}
          >
            {locatingGps ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.gpsUpdateBtnText}>📍 Pin Store to Device GPS</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Operational Guidelines */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PARTNER OPERATIONS GUIDE</Text>

          <View style={styles.guideRow}>
            <Text style={styles.guideIcon}>⏱️</Text>
            <View style={styles.guideTextCol}>
              <Text style={styles.guideHeading}>Fast Order Acceptance</Text>
              <Text style={styles.guideDesc}>Accept incoming customer orders within 15 minutes to maintain 100% store rating.</Text>
            </View>
          </View>

          <View style={styles.guideRow}>
            <Text style={styles.guideIcon}>📦</Text>
            <View style={styles.guideTextCol}>
              <Text style={styles.guideHeading}>Live Stock Updates</Text>
              <Text style={styles.guideDesc}>Toggle Out of Stock immediately if an item runs out to avoid customer order cancellations.</Text>
            </View>
          </View>

          <View style={styles.guideRow}>
            <Text style={styles.guideIcon}>🛵</Text>
            <View style={styles.guideTextCol}>
              <Text style={styles.guideHeading}>Scheduled Delivery Slots</Text>
              <Text style={styles.guideDesc}>Ensure dispatch matches the customer's chosen Morning, Afternoon, or Evening slot.</Text>
            </View>
          </View>
        </View>

        {/* Delivery slot management */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DELIVERY OPERATIONS</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('DeliverySlots')}
          >
            <Text style={styles.actionIcon}>🕐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Manage Delivery Slots</Text>
              <Text style={styles.actionSub}>Set capacity, mark full, recommended windows</Text>
            </View>
            <Text style={styles.actionArrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Support & Contacts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleOpenSupport}>
            <Text style={styles.actionIcon}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Chat with Super Admin</Text>
              <Text style={styles.actionSub}>WhatsApp Support Channel</Text>
            </View>
            <Text style={styles.actionArrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoBox}>
          <Text style={styles.appVersion}>MonthlyGrocery Partner v1.0.0 (Production Build)</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out from Store Console</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  statusToggleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusOpen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusClosed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusToggleHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusToggleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  storeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeRoleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storeIdBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeOwner: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  storePhone: {
    fontSize: 13,
    color: '#475569',
  },
  storeTerritory: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  locRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  locLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  locValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsUpdateBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  gpsUpdateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  guideTextCol: {
    flex: 1,
  },
  guideHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  guideDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 16,
    color: '#94A3B8',
  },
  appInfoBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  appVersion: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  radiusSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  radiusChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  radiusChipTextActive: {
    color: '#15803D',
  },
});
