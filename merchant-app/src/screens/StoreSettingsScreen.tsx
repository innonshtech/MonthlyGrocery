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
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

export default function StoreSettingsScreen() {
  const navigation = useNavigation<any>();
  const { token, user, logout } = useMerchantAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  // Custom Coordinates & Geocoding Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const fetchShopProfile = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/shops/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shop) {
          setShop(data.shop);
          setIsOpen(data.shop.is_open !== false);
          if (data.shop.latitude != null) setManualLat(String(data.shop.latitude));
          if (data.shop.longitude != null) setManualLng(String(data.shop.longitude));
        } else {
          setShop(null);
        }
      })
      .catch(() => {
        setShop(null);
      })
      .finally(() => {
        setLoading(false);
      });
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
      if (nav && nav.geolocation && typeof nav.geolocation.getCurrentPosition === 'function') {
        nav.geolocation.getCurrentPosition(
          async (pos: any) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            await saveGpsCoordinates(lat, lng);
          },
          async () => {
            // If device hardware GPS failed or timed out, attempt automatic area geocoding
            await fallbackGeocodeStore();
          },
          { timeout: 6000, enableHighAccuracy: true }
        );
      } else {
        // Fallback to backend geocoding using store territory info
        await fallbackGeocodeStore();
      }
    } catch {
      await fallbackGeocodeStore();
    }
  };

  const fallbackGeocodeStore = async () => {
    const targetQuery = shop?.area_name
      ? `${shop.area_name}, ${shop.city || ''}`
      : (shop?.city || shop?.district_name || 'Maharashtra, India');

    try {
      const res = await fetch(`${API_BASE}/addresses/forward-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });
      const data = await res.json();
      if (data.success && data.location?.latitude && data.location?.longitude) {
        const lat = data.location.latitude;
        const lng = data.location.longitude;
        await saveGpsCoordinates(lat, lng);
        Alert.alert(
          'GPS Coordinates Pinned',
          `Pinned to ${targetQuery} coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)}).\nYou can adjust coordinates anytime in "Edit Coordinates".`,
        );
      } else {
        setLocatingGps(false);
        setModalVisible(true);
      }
    } catch {
      setLocatingGps(false);
      setModalVisible(true);
    }
  };

  const handleSearchAndPin = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Area', 'Please type a city, area name, or pincode (e.g. Ravet, Pune).');
      return;
    }
    setSearchingLocation(true);
    try {
      const res = await fetch(`${API_BASE}/addresses/forward-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (data.success && data.location?.latitude && data.location?.longitude) {
        const lat = data.location.latitude;
        const lng = data.location.longitude;
        setManualLat(String(lat));
        setManualLng(String(lng));
        await saveGpsCoordinates(lat, lng);
        setModalVisible(false);
      } else {
        Alert.alert('Location Not Found', 'Could not locate coordinates for this search. You can enter Latitude and Longitude manually below.');
      }
    } catch {
      Alert.alert('Error', 'Failed to search location.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSaveManualCoordinates = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Please enter valid numbers for Latitude (-90 to 90) and Longitude (-180 to 180).');
      return;
    }
    await saveGpsCoordinates(lat, lng);
    setModalVisible(false);
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
        setManualLat(String(lat));
        setManualLng(String(lng));
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

  const handleOpenGoogleMaps = () => {
    if (shop?.latitude != null && shop?.longitude != null) {
      const url = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open Google Maps');
      });
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
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Loading store settings...</Text>
          </View>
        ) : !shop ? (
          /* Store Pending / Not Whitelisted Card */
          <View style={styles.pendingCard}>
            <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>🏪</Text>
            <Text style={styles.pendingTitle}>Store Whitelisting Pending</Text>
            <Text style={styles.pendingSub}>
              Your account (+91 {user?.mobile ? user.mobile.slice(-10) : '...'}) is logged in, but has not yet been assigned to an approved Kirana Store.
            </Text>
            <View style={styles.pendingGuideBox}>
              <Text style={styles.pendingGuideHeading}>📋 Store Onboarding Instructions:</Text>
              <Text style={styles.pendingGuideText}>1. Open the Web Admin Portal (Store Approvals tab).</Text>
              <Text style={styles.pendingGuideText}>2. Register your store with mobile number: +91 {user?.mobile ? user.mobile.slice(-10) : '...'}</Text>
              <Text style={styles.pendingGuideText}>3. Click "Approve" to activate this store partner.</Text>
            </View>
            <TouchableOpacity style={styles.refreshPendingBtn} onPress={fetchShopProfile}>
              <Text style={styles.refreshPendingBtnText}>🔄 Refresh Store Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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

              {shop?.latitude != null && shop?.longitude != null ? (
                <TouchableOpacity style={styles.mapLinkBtn} onPress={handleOpenGoogleMaps} activeOpacity={0.8}>
                  <Text style={styles.mapLinkText}>🗺️ View Store Location on Google Maps ➔</Text>
                </TouchableOpacity>
              ) : null}

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

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.gpsUpdateBtn, { flex: 1 }]}
                  onPress={handleUpdateStoreGps}
                  disabled={locatingGps}
                  activeOpacity={0.85}
                >
                  {locatingGps ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.gpsUpdateBtnText}>📍 Auto-Pin GPS</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gpsEditBtn, { flex: 1 }]}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gpsEditBtnText}>✏️ Set Coordinates</Text>
                </TouchableOpacity>
              </View>
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
          </>
        )}

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

      {/* Manual GPS / Geocode Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Store GPS Coordinates</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Option A: Search Area / Landmark */}
              <Text style={styles.modalSectionLabel}>1. Search Area / Landmark / Pincode</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g. Ravet, Pune or 412101"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={handleSearchAndPin}
                  disabled={searchingLocation}
                >
                  {searchingLocation ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.searchBtnText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Option B: Manual Coordinates */}
              <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>2. Or Enter Exact Latitude & Longitude</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Latitude</Text>
                  <TextInput
                    style={styles.coordInput}
                    placeholder="e.g. 18.6476"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={manualLat}
                    onChangeText={setManualLat}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Longitude</Text>
                  <TextInput
                    style={styles.coordInput}
                    placeholder="e.g. 73.7431"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={manualLng}
                    onChangeText={setManualLng}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveCoordBtn} onPress={handleSaveManualCoordinates}>
                <Text style={styles.saveCoordBtnText}>Save Coordinates ✓</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  pendingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  pendingGuideBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    width: '100%',
    marginVertical: 16,
    gap: 6,
  },
  pendingGuideHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pendingGuideText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  refreshPendingBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  refreshPendingBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
  mapLinkBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    marginVertical: 2,
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  gpsUpdateBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsUpdateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gpsEditBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsEditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
    padding: 4,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  searchBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  coordInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  saveCoordBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveCoordBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
