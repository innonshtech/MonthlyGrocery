import React from 'react';
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

export default function OrderSuccessScreen({ route, navigation }: any) {
  const {
    orderId = 'MG-849201',
    total = 2160,
    savings = 340,
    deliveryDay = 'Tomorrow',
    deliveryTime = '7:00 AM - 10:00 AM',
    address = 'Flat 402, Green Acres, Paud Road, Pune 411038',
  } = route?.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconCircle}>
          <Text style={styles.checkTick}>✓</Text>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.successTitle}>Order confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your monthly grocery basket has been placed and scheduled for delivery.
        </Text>

        {/* Order Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValBold}>#{orderId}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery slot</Text>
            <Text style={styles.detailVal}>{deliveryDay} · {deliveryTime}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery address</Text>
            <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {address}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total paid</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalPaidText}>₹{total}</Text>
              {savings > 0 && (
                <Text style={styles.savedText}>You saved ₹{savings}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.85}
        >
          <Text style={styles.trackBtnText}>Track order status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Shop')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Continue shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green50,
    borderWidth: 2,
    borderColor: COLORS.green500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkTick: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.green700,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.ink500,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  detailValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.green700,
  },
  totalPaidText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  savedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.green700,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 12,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 10,
  },
  trackBtn: {
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  homeBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green700,
  },
});
