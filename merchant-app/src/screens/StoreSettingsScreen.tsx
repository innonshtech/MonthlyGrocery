import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMerchantAuth } from '../context/MerchantAuthContext';

export default function StoreSettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useMerchantAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out from the Merchant Partner console?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const handleOpenSupport = () => {
    const whatsappUrl = 'https://wa.me/918830480015?text=Hello%20MonthlyGrocery%20Super%20Admin,%20I%20need%20help%20with%20my%20merchant%20store.';
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Support', 'Please contact admin support at: support@monthlygrocery.in or +91 8830480015');
    });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Store Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Profile Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeIconBox}>
            <Text style={{ fontSize: 32 }}>🏪</Text>
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeRoleBadge}>AUTHORIZED STORE PARTNER</Text>
            <Text style={styles.storeName}>{user?.name || 'Local Kirana Partner'}</Text>
            <Text style={styles.storePhone}>📞 +91 {user?.mobile ? user.mobile.slice(-10) : 'N/A'}</Text>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  storeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  storeInfo: {
    flex: 1,
  },
  storeRoleBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  storePhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  guideIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  guideTextCol: {
    flex: 1,
  },
  guideHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  guideDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  actionArrow: {
    fontSize: 14,
    color: '#94A3B8',
  },
  appInfoBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  appVersion: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
