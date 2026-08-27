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
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

export default function CheckoutScreen({ route, navigation }: any) {
  const { token, city: authCity, area: authArea } = useAuth();
  const { items, minOrderLimit = 2500 } = useCart();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(route?.params?.appliedCoupon || null);

  // Selected Address State (Starts as null to trigger First-time Checkout variant if no address is set)
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Selected Slot State (Starts as null to trigger First-time Checkout variant)
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Load latest parameters passed back from select pages
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

  // Load saved default address from storage if present (Convenience feature)
  useEffect(() => {
    const loadSavedAddress = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_addresses');
        if (stored) {
          const list = JSON.parse(stored);
          if (list.length > 0) {
            // Find default address or pick first
            const defAddr = list.find((a: any) => a.isDefault) || list[0];
            setSelectedAddress(defAddr);
          }
        }
      } catch (err) {}
    };
    loadSavedAddress();
  }, []);

  const minLimit = minOrderLimit || 2500;

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
        Math.round((itemTotalPrice * appliedCoupon.discount_value) / 100),
        appliedCoupon.max_discount || 200
      );
    } else {
      couponDiscount = appliedCoupon.discount_value || 50;
    }
  }

  const rawSavings = itemTotalMrp - itemTotalPrice;
  const totalSavings = rawSavings + couponDiscount;
  const toPay = Math.max(0, itemTotalPrice - couponDiscount);
  const isBelowMin = toPay < minLimit;
  const amountNeeded = minLimit - toPay;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectAddress = () => {
    navigation.navigate('DeliveryAddress', {
      selectedAddress,
      onSelect: (addr: any) => setSelectedAddress(addr)
    });
  };

  const handleSelectSlot = () => {
    navigation.navigate('DeliverySlot', { selectedSlot });
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress || !selectedSlot) {
      Alert.alert('Delivery info required', 'Please add both delivery address and slot to proceed.');
      return;
    }

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

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const isCheckoutReady = selectedAddress && selectedSlot;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP HEADER ROW (Figma spec: Baloo 2 Title)
         ========================================================================= */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon name="arrow-left" size={20} color={COLORS.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           2. BELOW MINIMUM WARNING NOTICE
           ========================================================================= */}
        {isBelowMin && (
          <View style={styles.belowMinNotice}>
            <AppIcon name="help" size={15} color="#8A5200" />
            <Text style={styles.belowMinText}>
              Add ₹{amountNeeded} more to reach the ₹{minLimit} minimum order value
            </Text>
          </View>
        )}

        {/* =========================================================================
           3. DELIVER TO CARD (Dynamic First-time vs Normal variant)
           ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.cardLayoutRow}>
            {/* Left Column: 38x38px circle icon */}
            <View style={styles.iconCircle}>
              <AppIcon name="map-pin" size={16} color={COLORS.green700} />
            </View>

            {/* Middle Column: Details block */}
            <View style={styles.detailsBlock}>
              {!selectedAddress ? (
                // First-time Placeholder State
                <TouchableOpacity onPress={handleSelectAddress} activeOpacity={0.7}>
                  <Text style={styles.placeholderTitle}>Add delivery address</Text>
                  <Text style={styles.placeholderSub}>Where should we deliver your order?</Text>
                </TouchableOpacity>
              ) : (
                // Normal Populated State
                <View>
                  <Text style={styles.eyebrow}>DELIVER TO</Text>
                  <Text style={styles.cardTitle}>Home · {selectedAddress.tag || 'Address'}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {selectedAddress.flat}, {selectedAddress.street} · {selectedAddress.pincode}
                  </Text>
                </View>
              )}
            </View>

            {/* Right Column: Action text button */}
            <TouchableOpacity onPress={handleSelectAddress} style={styles.actionBtn}>
              <Text style={styles.actionBtnTxt}>{selectedAddress ? 'Change' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
           4. DELIVERY SLOT CARD (Dynamic First-time vs Normal variant)
           ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.cardLayoutRow}>
            {/* Left Column: 38x38px circle icon */}
            <View style={styles.iconCircle}>
              <AppIcon name="clock" size={16} color={COLORS.green700} />
            </View>

            {/* Middle Column: Details block */}
            <View style={styles.detailsBlock}>
              {!selectedSlot ? (
                // First-time Placeholder State
                <TouchableOpacity onPress={handleSelectSlot} activeOpacity={0.7}>
                  <Text style={styles.placeholderTitle}>Choose delivery slot</Text>
                  <Text style={styles.placeholderSub}>Pick a planned 4-hour window</Text>
                </TouchableOpacity>
              ) : (
                // Normal Populated State
                <View>
                  <Text style={styles.eyebrow}>DELIVERY SLOT</Text>
                  <Text style={styles.cardTitle}>{selectedSlot.dateLabel}, {selectedSlot.timeWindow}</Text>
                  <Text style={styles.cardSub}>Planned 4-hour delivery window</Text>
                </View>
              )}
            </View>

            {/* Right Column: Action text button */}
            <TouchableOpacity onPress={handleSelectSlot} style={styles.actionBtn}>
              <Text style={styles.actionBtnTxt}>{selectedSlot ? 'Change' : 'Select'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================================================================
           5. BASKET PREVIEW (Row of thumbnail images)
           ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.basketHeader}>
            <Text style={styles.basketTitle}>Order summary</Text>
            <Text style={styles.basketCount}>{totalItemCount} items</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbsScroll}>
            {items.map((cartItem) => (
              <View key={cartItem.product.id} style={styles.itemThumbWrap}>
                {cartItem.product.image_url ? (
                  <Image source={{ uri: cartItem.product.image_url }} style={styles.thumbImage} resizeMode="contain" />
                ) : (
                  <AppIcon name="shopping-bag" size={18} color={COLORS.green700} />
                )}
                {cartItem.quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>{cartItem.quantity}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* =========================================================================
           6. APPLIED COUPON CARD (Matches Figma C3/E1 specs)
           ========================================================================= */}
        {appliedCoupon ? (
          <View style={styles.appliedCouponCard}>
            <View style={styles.couponLeft}>
              <AppIcon name="percent" size={16} color="#1E7A46" />
              <View style={styles.couponDetails}>
                <Text style={styles.appliedCouponCode}>{appliedCoupon.code} applied</Text>
                <Text style={styles.appliedCouponSavings}>You saved ₹{couponDiscount} extra</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
              <Text style={styles.removeCouponBtnTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noCouponCard}
            onPress={() => navigation.navigate('OffersCoupons', { currentTotal: itemTotalPrice })}
            activeOpacity={0.8}
          >
            <View style={styles.couponLeft}>
              <AppIcon name="tag" size={16} color={COLORS.ink700} />
              <Text style={styles.noCouponTitle}>Apply coupon</Text>
            </View>
            <Text style={styles.selectLinkText}>Select ›</Text>
          </TouchableOpacity>
        )}

        {/* =========================================================================
           7. BILL DETAILS SUMMARY
           ========================================================================= */}
        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Bill details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total (MRP)</Text>
            <Text style={styles.billVal}>₹{itemTotalMrp}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: COLORS.marigold700 }]}>Savings</Text>
            <Text style={[styles.billVal, { color: COLORS.marigold700 }]}>− ₹{totalSavings}</Text>
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
         8. STICKY BOTTOM PAYMENT BAR (First-time Disabled vs Normal Active)
         ========================================================================= */}
      <View style={styles.bottomBar}>
        {!isCheckoutReady ? (
          // E1 First-time: Full-width disabled continuation indicator
          <View style={styles.disabledBarBtn}>
            <Text style={styles.disabledBarBtnText}>Add address & slot to continue</Text>
          </View>
        ) : (
          // E1 Normal Redesign: Dual-column payment navigation row
          <View style={styles.paymentRow}>
            <View style={styles.payableSummary}>
              <Text style={styles.payableLabel}>TO PAY</Text>
              <Text style={styles.payableAmount}>₹{toPay}</Text>
            </View>

            <TouchableOpacity
              style={styles.proceedPayBtn}
              onPress={handleProceedToPayment}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedPayBtnText}>Proceed to pay</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper background
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.paper,
  },
  backBtn: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    color: COLORS.ink900,
    lineHeight: 24,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120, // Space to scroll past bottom sticky bar
  },
  belowMinNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  belowMinText: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: COLORS.marigold700,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 14,
  },
  cardLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailsBlock: {
    flex: 1,
    paddingRight: 10,
  },
  placeholderTitle: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.green700,
  },
  placeholderSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1,
  },
  eyebrow: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    color: COLORS.ink500,
    letterSpacing: 1.1,
  },
  cardTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
    marginTop: 1,
  },
  cardSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1.5,
    lineHeight: 16,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  basketTitle: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  basketCount: {
    ...FONTS.muktaMedium,
    fontSize: 12.5,
    color: COLORS.ink500,
  },
  thumbsScroll: {
    flexDirection: 'row',
  },
  itemThumbWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  thumbImage: {
    width: 36,
    height: 36,
  },
  quantityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.ink700,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  noCouponCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 14,
  },
  noCouponTitle: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: COLORS.ink900,
  },
  selectLinkText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  appliedCouponCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.green100, // Light green applied block E1/C3
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  couponDetails: {
    flex: 1,
  },
  appliedCouponCode: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: COLORS.green900,
  },
  appliedCouponSavings: {
    ...FONTS.muktaMedium,
    fontSize: 11.5,
    color: COLORS.green800,
    marginTop: 0.5,
  },
  removeCouponBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeCouponBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 12.5,
    color: COLORS.ink700,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 20,
  },
  billHeading: {
    ...FONTS.muktaBold,
    fontSize: 14,
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
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    color: COLORS.ink700,
  },
  billVal: {
    ...FONTS.muktaMedium,
    fontSize: 13.5,
    color: COLORS.ink900,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    marginVertical: 11,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    color: COLORS.ink900,
  },
  billTotalVal: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
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
    height: 98,
    justifyContent: 'center',
  },
  disabledBarBtn: {
    backgroundColor: COLORS.muted,
    height: 49,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBarBtnText: {
    ...FONTS.balooSemiBold,
    color: COLORS.ink300,
    fontSize: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payableSummary: {
    justifyContent: 'center',
  },
  payableLabel: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: COLORS.ink500,
    letterSpacing: 0.8,
  },
  payableAmount: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
    marginTop: -2,
  },
  proceedPayBtn: {
    backgroundColor: COLORS.green700, // #1E7A46
    height: 49,
    borderRadius: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.green900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  proceedPayBtnText: {
    ...FONTS.balooSemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
