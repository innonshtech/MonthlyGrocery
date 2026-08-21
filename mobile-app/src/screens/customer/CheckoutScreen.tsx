import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function CheckoutScreen({ route, navigation }: any) {
  const { token, city: authCity, area: authArea } = useAuth();
  const { items, minOrderLimit = 2000 } = useCart();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(route?.params?.appliedCoupon || null);

  // Selected Address State
  const [selectedAddress, setSelectedAddress] = useState<any>({
    id: 'addr-default',
    tag: 'Home',
    flat: 'Flat 402, Green Acres',
    street: 'Paud Road, Kothrud',
    city: authCity || 'Pune',
    pincode: '411038',
  });

  // Selected Slot State
  const [selectedSlot, setSelectedSlot] = useState<any>({
    dateLabel: 'Tomorrow',
    timeWindow: 'Morning 7:00 AM - 10:00 AM',
  });

  // Load latest selected address/slot if passed back via params
  useEffect(() => {
    if (route?.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
    }
    if (route?.params?.selectedSlot) {
      setSelectedSlot(route.params.selectedSlot);
    }
    if (route?.params?.appliedCoupon) {
      setAppliedCoupon(route.params.appliedCoupon);
    }
  }, [route?.params]);

  // Load saved address from storage
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const saved = await AsyncStorage.getItem('@saved_user_addresses');
        if (saved) {
          const list = JSON.parse(saved);
          if (list.length > 0) {
            setSelectedAddress(list[0]);
          }
        }
      } catch (err) {}
    };
    loadAddress();
  }, []);

  const minLimit = minOrderLimit || 2000;

  // Real Dynamic Calculations
  const itemTotalMrp = items.reduce((sum, item) => {
    const mrp = parseFloat(item.product.mrp as any) || Math.round(Number(item.product.price) * 1.22);
    return sum + mrp * item.quantity;
  }, 0);

  const itemTotalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.product.price as any) || 0;
    return sum + price * item.quantity;
  }, 0);

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscount = Math.min(
        Math.round((itemTotalPrice * appliedCoupon.value) / 100),
        appliedCoupon.max_discount || 200
      );
    } else {
      couponDiscount = appliedCoupon.value || 50;
    }
  }

  const rawSavings = itemTotalMrp - itemTotalPrice;
  const totalSavings = rawSavings + couponDiscount;
  const toPay = Math.max(0, itemTotalPrice - couponDiscount);
  const isBelowMin = toPay < minLimit;
  const amountNeeded = minLimit - toPay;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToPayment = () => {
    if (isBelowMin) {
      Alert.alert(
        'Minimum order not met',
        `Please add ₹${amountNeeded} more to reach the ₹${minLimit} minimum order value.`
      );
      return;
    }

    navigation.navigate('PaymentMethod', {
      selectedAddress,
      selectedSlot,
      appliedCoupon,
      couponDiscount,
      totalAmount: toPay,
      itemTotalMrp,
      totalSavings,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP HEADER ROW (E1)
         ========================================================================= */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order summary</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           2. BELOW MINIMUM WARNING NOTICE (E1 SUB-STATE)
           ========================================================================= */}
        {isBelowMin && (
          <View style={styles.belowMinNotice}>
            <Text style={styles.belowMinIcon}>⚠️</Text>
            <Text style={styles.belowMinText}>
              Add ₹{amountNeeded} more to reach the ₹{minLimit} minimum
            </Text>
          </View>
        )}

        {/* =========================================================================
           3. DELIVERY ADDRESS CARD (E1 -> E2)
           ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionCardTitle}>Delivery address</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('DeliveryAddress', { selectedAddress })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.changeLinkText}>Change ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressPreviewWrap}>
            <View style={styles.addressTagBadge}>
              <Text style={styles.addressTagText}>{selectedAddress.tag || 'Home'}</Text>
            </View>
            <Text style={styles.addressFullText}>
              {selectedAddress.flat}, {selectedAddress.street}, {selectedAddress.city} {selectedAddress.pincode}
            </Text>
          </View>
        </View>

        {/* =========================================================================
           4. DELIVERY SLOT CARD (E1 -> E4)
           ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🕒</Text>
              <Text style={styles.sectionCardTitle}>Delivery slot</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('DeliverySlot', { selectedSlot })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.changeLinkText}>Change ›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.slotPreviewText}>
            {selectedSlot.dateLabel} · {selectedSlot.timeWindow}
          </Text>
        </View>

        {/* =========================================================================
           5. ITEMS IN BASKET PREVIEW (E1)
           ========================================================================= */}
        <View style={styles.sectionCard}>
          <Text style={styles.basketTitle}>
            Basket items ({totalItemCount})
          </Text>

          {items.map((cartItem) => {
            const price = parseFloat(cartItem.product.price as any) || 0;
            const lineTotal = price * cartItem.quantity;

            return (
              <View key={cartItem.product.id} style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  {cartItem.product.image_url ? (
                    <Image source={{ uri: cartItem.product.image_url }} style={styles.thumbImg} resizeMode="contain" />
                  ) : (
                    <AppIcon name="shopping-bag" size={20} color={COLORS.green700} />
                  )}
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {cartItem.product.name}
                  </Text>
                  <Text style={styles.itemSub}>
                    {cartItem.product.unit || '1 unit'} × {cartItem.quantity}
                  </Text>
                </View>

                <Text style={styles.itemLineTotal}>₹{lineTotal}</Text>
              </View>
            );
          })}
        </View>

        {/* =========================================================================
           6. COUPON WIDGET (E1 -> C3)
           ========================================================================= */}
        <TouchableOpacity
          style={styles.couponCard}
          onPress={() => navigation.navigate('OffersCoupons', { currentTotal: itemTotalPrice })}
          activeOpacity={0.8}
        >
          <View style={styles.couponLeft}>
            <Text style={styles.couponIcon}>🏷️</Text>
            <View>
              <Text style={styles.couponTitle}>
                {appliedCoupon ? `Coupon "${appliedCoupon.code}" applied` : 'Apply coupon'}
              </Text>
              {appliedCoupon && (
                <Text style={styles.couponSub}>₹{couponDiscount} discount applied to this order</Text>
              )}
            </View>
          </View>
          <Text style={styles.changeLinkText}>
            {appliedCoupon ? 'Change ›' : 'Select ›'}
          </Text>
        </TouchableOpacity>

        {/* =========================================================================
           7. BILL DETAILS SUMMARY (E1)
           ========================================================================= */}
        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Bill details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total (MRP)</Text>
            <Text style={styles.billVal}>₹{itemTotalMrp}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: COLORS.green700 }]}>Savings</Text>
            <Text style={[styles.billVal, { color: COLORS.green700 }]}>− ₹{totalSavings}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={[styles.billVal, { color: COLORS.green700, fontWeight: '700' }]}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>To pay</Text>
            <Text style={styles.billTotalVal}>₹{toPay}</Text>
          </View>
        </View>
      </ScrollView>

      {/* =========================================================================
         8. STICKY BOTTOM PAYMENT CTA (E1 Active vs Below-Min Gate)
         ========================================================================= */}
      <View style={styles.bottomBar}>
        {isBelowMin ? (
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={handleProceedToPayment}
            activeOpacity={0.9}
          >
            <Text style={styles.gateBtnText}>Add ₹{amountNeeded} to checkout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={handleProceedToPayment}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedBtnText}>Select payment method ›</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
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
    paddingTop: 14,
    paddingBottom: 28,
  },
  belowMinNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  belowMinIcon: {
    fontSize: 16,
  },
  belowMinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 15,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  changeLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  addressPreviewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTagBadge: {
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  addressTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green700,
  },
  addressFullText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.ink700,
    lineHeight: 17,
  },
  slotPreviewText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  basketTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  thumbImg: {
    width: 28,
    height: 28,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  itemSub: {
    fontSize: 11,
    color: COLORS.ink500,
  },
  itemLineTotal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  couponCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  couponIcon: {
    fontSize: 18,
  },
  couponTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  couponSub: {
    fontSize: 11,
    color: COLORS.green700,
    marginTop: 1,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 16,
  },
  billHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.ink500,
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 10,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  billTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  proceedBtn: {
    backgroundColor: COLORS.green700, // #1E7A46
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  gateBtn: {
    backgroundColor: COLORS.muted,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateBtnText: {
    color: COLORS.ink500,
    fontSize: 14,
    fontWeight: '700',
  },
});
