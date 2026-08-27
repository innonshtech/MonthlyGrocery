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
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

export default function OrderSuccessScreen({ route, navigation }: any) {
  const {
    orderId = 'MG-849201',
    total = 2160,
    savings = 340,
    deliveryDay = 'Tomorrow',
    deliveryTime = '7:00 AM - 10:00 AM',
    address = 'Flat 402, Green Acres, Paud Road, Pune 411038',
    paymentMethod = 'Google Pay',
  } = route?.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           1. CONFIRMATION CHECK ICON (Figma spec: 130x130px circle with shadow)
           ========================================================================= */}
        <View style={styles.badgeWrapper}>
          <View style={styles.successIconCircle}>
            <AppIcon name="check" size={48} color="#FFFFFF" />
          </View>
          {/* Confetti floating dots elements */}
          <View style={[styles.confettiDot, { top: 12, left: 0, backgroundColor: COLORS.marigold500, width: 10, height: 10 }]} />
          <View style={[styles.confettiDot, { top: 22, right: 0, backgroundColor: COLORS.green600, width: 8, height: 8 }]} />
          <View style={[styles.confettiDot, { bottom: 12, left: 10, backgroundColor: COLORS.marigold500, width: 7, height: 7 }]} />
          <View style={[styles.confettiDot, { bottom: 18, right: 10, backgroundColor: COLORS.ink300, width: 9, height: 9 }]} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.successTitle}>Order Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your monthly grocery basket has been placed and scheduled for delivery.
        </Text>

        {/* =========================================================================
           2. ORDER DETAILS CARD (Figma E7 spec)
           ========================================================================= */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValBold}>#{orderId}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Arriving</Text>
            <Text style={styles.detailVal}>{deliveryDay} · {deliveryTime}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deliver to</Text>
            <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {address}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailVal}>{paymentMethod} · ₹{total}</Text>
          </View>
        </View>

        {/* =========================================================================
           3. SAVINGS INDICATOR PILL (Figma spec: green/yellow pill)
           ========================================================================= */}
        {savings > 0 && (
          <View style={styles.savingsPill}>
            <AppIcon name="percent" size={12} color={COLORS.green700} />
            <Text style={styles.savingsPillTxt}>You saved ₹{savings} on this order</Text>
          </View>
        )}

        {/* =========================================================================
           4. MONTHLY REORDER QUICK LINK CARD (Figma E7 spec)
           ========================================================================= */}
        <View style={styles.hubLinkCard}>
          <View style={styles.hubIconCircle}>
            <AppIcon name="sparkles" size={15} color={COLORS.green700} />
          </View>
          <View style={styles.hubDetails}>
            <Text style={styles.hubTitle}>One-Click Reorder Hub</Text>
            <Text style={styles.hubSub}>Reorder everything in one tap next month</Text>
          </View>
          <TouchableOpacity
            style={styles.hubBtn}
            onPress={() => {
              navigation.replace('Shop');
              navigation.navigate('MyMonthlyGroceryHub');
            }}
          >
            <Text style={styles.hubBtnTxt}>Open</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* =========================================================================
         5. BOTTOM STICKED NAVIGATION BUTTONS
         ========================================================================= */}
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
    backgroundColor: COLORS.paper, // Warm Paper background
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 130, // Space for sticky bottom buttons
    alignItems: 'center',
  },
  badgeWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.green700, // Deep solid green confirm circle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.green900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  confettiDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  successTitle: {
    ...FONTS.balooBold,
    fontSize: 24,
    color: COLORS.ink900,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    ...FONTS.muktaMedium,
    fontSize: 13.5,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 24,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  detailLabel: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
  },
  detailVal: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink900,
  },
  detailValBold: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: COLORS.green700,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    marginVertical: 10,
  },
  savingsPill: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.green100, // #E4F3EA green/yellow indicators E7
    borderRadius: 999,
    marginBottom: 16,
  },
  savingsPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.green800,
  },
  hubLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50, // soft green tint
    borderWidth: 1.5,
    borderColor: COLORS.green100,
    borderRadius: 14,
    padding: 12,
    width: '100%',
  },
  hubIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hubDetails: {
    flex: 1,
    paddingRight: 6,
  },
  hubTitle: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink900,
  },
  hubSub: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    color: COLORS.ink500,
    marginTop: 1,
  },
  hubBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.green700,
    borderRadius: 8,
  },
  hubBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 116,
    gap: 8,
  },
  trackBtn: {
    backgroundColor: COLORS.green700,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnText: {
    ...FONTS.balooSemiBold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  homeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    ...FONTS.balooSemiBold,
    color: COLORS.ink700,
    fontSize: 14.5,
  },
});
