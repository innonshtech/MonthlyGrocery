import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  fetchUserAddresses,
  cacheAddressesLocally,
} from '../../services/addressApi';
import {
  CheckoutBackIcon,
  CheckoutHomeIcon,
  CheckoutClockIcon,
  CheckoutPlusIcon,
  CheckoutPercentIcon,
  CheckoutFallbackEmoji,
  THUMB_BG,
} from '../../components/CheckoutFigmaIcons';

/** Figma E1 Checkout canvas background */
const CHECKOUT_BG = '#FBFAF6';
const REQUIRED_BG = '#FDEEEC';

const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function CheckoutScreen({ route, navigation }: any) {
  const { items, minOrderLimit = 2500 } = useCart();
  const { token } = useAuth();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(route?.params?.appliedCoupon || null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  useEffect(() => {
    if (route?.params?.appliedCoupon) {
      setAppliedCoupon(route.params.appliedCoupon);
    }
  }, [route?.params?.appliedCoupon]);

  // Sync address/slot when returning from child screens (merge params)
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.selectedAddress) {
        setSelectedAddress(route.params.selectedAddress);
      }
      if (route?.params?.selectedSlot) {
        setSelectedSlot(route.params.selectedSlot);
      }
      if (route?.params?.appliedCoupon) {
        setAppliedCoupon(route.params.appliedCoupon);
      }
    }, [
      route?.params?.selectedAddress,
      route?.params?.selectedSlot,
      route?.params?.appliedCoupon,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadDefaultAddress = async () => {
        if (route?.params?.selectedAddress) return;
        if (!token) return;
        try {
          const list = await fetchUserAddresses(token);
          await cacheAddressesLocally(list);
          if (list.length > 0) {
            const defAddr = list.find((a) => a.isDefault) || list[0];
            setSelectedAddress(defAddr);
          }
        } catch {
          /* ignore */
        }
      };
      loadDefaultAddress();
    }, [token, route?.params?.selectedAddress]),
  );

  const minLimit = minOrderLimit || 2500;

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
    const discountValue =
      appliedCoupon.discount_value ?? appliedCoupon.value ?? appliedCoupon.discount_amount ?? 0;
    const discountType = appliedCoupon.discount_type;
    if (discountType === 'percentage') {
      couponDiscount = Math.min(
        Math.round((itemTotalPrice * discountValue) / 100),
        appliedCoupon.max_discount || 200,
      );
    } else {
      couponDiscount = discountValue || 50;
    }
  }

  const productSavings = Math.max(0, itemTotalMrp - itemTotalPrice);
  const toPay = Math.max(0, itemTotalPrice - couponDiscount);
  const isBelowMin = toPay < minLimit;
  const amountNeeded = minLimit - toPay;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addressLabel =
    selectedAddress?.tag || selectedAddress?.label || selectedAddress?.type || 'Home';
  const addressLine = selectedAddress
    ? [
        selectedAddress.flat,
        selectedAddress.building,
        selectedAddress.street || selectedAddress.area || selectedAddress.locality,
        selectedAddress.city,
        selectedAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const handleSelectAddress = () => {
    navigation.navigate('DeliveryAddress', {
      selectedAddress,
      fromCheckout: true,
    });
  };

  const handleSelectSlot = () => {
    const shopId = items[0]?.product?.shop_id;
    navigation.navigate('DeliverySlot', {
      selectedSlot,
      fromCheckout: true,
      shopId,
      pincode: selectedAddress?.pincode,
    });
  };

  const handleApplyCoupon = () => {
    navigation.navigate('OffersCoupons', {
      currentTotal: itemTotalPrice,
      fromCheckout: true,
    });
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress || !selectedSlot) {
      Alert.alert('Delivery info required', 'Please add both delivery address and slot to proceed.');
      return;
    }
    if (isBelowMin) {
      Alert.alert(
        'Minimum order not met',
        `Please add ₹${amountNeeded} more to reach the ₹${minLimit} minimum order value.`,
      );
      return;
    }
    navigation.navigate('PaymentMethod', {
      selectedAddress,
      selectedSlot,
      appliedCoupon,
      couponDiscount,
      productSavings,
      totalAmount: toPay,
      itemTotalMrp,
      totalSavings: productSavings + couponDiscount,
    });
  };

  const isCheckoutReady = !!(selectedAddress && selectedSlot);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={CHECKOUT_BG} />

      {/* Header — Figma: pl16 pr20 pt4 pb8, gap 10 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isBelowMin && (
          <View style={styles.belowMinNotice}>
            <Text style={styles.belowMinText}>
              Add {formatInr(amountNeeded)} more to reach the {formatInr(minLimit)} minimum order
              value
            </Text>
          </View>
        )}

        {/* Address card */}
        {!selectedAddress ? (
          <TouchableOpacity style={styles.sectionCard} onPress={handleSelectAddress} activeOpacity={0.75}>
            <View style={styles.iconSquare}>
              <CheckoutHomeIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.requiredTitle}>Add delivery address</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Where should we deliver your order?</Text>
            </View>
            <CheckoutPlusIcon size={20} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sectionCard}>
            <View style={styles.iconSquare}>
              <CheckoutHomeIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{addressLabel}</Text>
                {selectedAddress.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardSub} numberOfLines={2}>
                {addressLine}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSelectAddress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Slot card */}
        {!selectedSlot ? (
          <TouchableOpacity style={styles.sectionCard} onPress={handleSelectSlot} activeOpacity={0.75}>
            <View style={styles.iconSquare}>
              <CheckoutClockIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.requiredTitle}>Choose delivery slot</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Pick a planned 4-hour window</Text>
            </View>
            <CheckoutPlusIcon size={20} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sectionCard}>
            <View style={styles.iconSquare}>
              <CheckoutClockIcon size={20} />
            </View>
            <View style={styles.detailsBlock}>
              <Text style={styles.cardTitle}>
                {selectedSlot.dateLabel}, {selectedSlot.timeWindow}
              </Text>
              <Text style={styles.cardSub}>Planned 4-hour delivery window</Text>
            </View>
            <TouchableOpacity onPress={handleSelectSlot} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order summary — Figma E1 */}
        <View style={styles.sectionCardCol}>
          <View style={styles.basketHeader}>
            <Text style={styles.basketTitle}>Order summary</Text>
            <Text style={styles.basketCount}>{totalItemCount} items</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbsRow}>
            {(items.length > 0 ? items : [null, null, null, null]).map((cartItem, index) => (
              <View
                key={cartItem?.product?.id ?? `fallback-${index}`}
                style={[styles.itemThumbWrap, { backgroundColor: THUMB_BG[index % THUMB_BG.length] }]}
              >
                {cartItem?.product?.image_url ? (
                  <Image
                    source={{ uri: cartItem.product.image_url }}
                    style={styles.thumbImage}
                    resizeMode="contain"
                  />
                ) : (
                  <CheckoutFallbackEmoji index={index} size={28} />
                )}
                {cartItem && cartItem.quantity > 1 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityBadgeText}>{cartItem.quantity}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Coupon — always visible on E1 redesign */}
        {appliedCoupon ? (
          <View style={styles.appliedCouponCard}>
            <CheckoutPercentIcon size={20} />
            <View style={styles.couponDetails}>
              <Text style={styles.appliedCouponCode}>{appliedCoupon.code} applied</Text>
              <Text style={styles.appliedCouponSavings}>
                You saved {formatInr(couponDiscount)} extra
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
              <Text style={styles.removeCouponBtnTxt}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noCouponCard}
            onPress={handleApplyCoupon}
            activeOpacity={0.8}
          >
            <View style={styles.couponLeft}>
              <CheckoutPercentIcon size={20} />
              <Text style={styles.noCouponTitle}>Apply coupon</Text>
            </View>
            <Text style={styles.changeLink}>Select</Text>
          </TouchableOpacity>
        )}

        {/* Bill details — always visible on E1 redesign (529:685) */}
        <View style={styles.billCard}>
          <Text style={styles.billHeading}>Bill details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total (MRP)</Text>
            <Text style={styles.billVal}>{formatInr(itemTotalMrp)}</Text>
          </View>

          {appliedCoupon && couponDiscount > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon ({appliedCoupon.code})</Text>
              <Text style={styles.billValMarigold}>− {formatInr(couponDiscount)}</Text>
            </View>
          ) : null}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Savings</Text>
            <Text style={styles.billValMarigold}>− {formatInr(productSavings)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={styles.billValFree}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>To pay</Text>
            <Text style={styles.billTotalVal}>{formatInr(toPay)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar — Figma height 98, px 20 */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          {!isCheckoutReady ? (
            <View style={styles.disabledBarBtn}>
              <Text style={styles.disabledBarBtnText}>Add address & slot to continue</Text>
            </View>
          ) : (
            <View style={styles.paymentRow}>
              <View style={styles.payableSummary}>
                <Text style={styles.payableLabel}>TO PAY</Text>
                <Text style={styles.payableAmount}>{formatInr(toPay)}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CHECKOUT_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: CHECKOUT_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 14,
  },
  belowMinNotice: {
    backgroundColor: COLORS.marigold100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  belowMinText: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.marigold700,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCardCol: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  sectionCardBordered: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  cardTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  requiredTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.green700,
  },
  cardSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
  },
  defaultBadge: {
    backgroundColor: COLORS.green100,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.green700,
  },
  requiredBadge: {
    backgroundColor: REQUIRED_BG,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredBadgeText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.error,
  },
  changeLink: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.green700,
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  basketTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  basketCount: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  itemThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadgeText: {
    ...FONTS.muktaSemiBold,
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 12,
  },
  appliedCouponCard: {
    backgroundColor: COLORS.marigold100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponDetails: {
    flex: 1,
    gap: 1,
  },
  appliedCouponCode: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.marigold700,
  },
  appliedCouponSavings: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink700,
  },
  removeCouponBtnTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.green700,
  },
  noCouponCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noCouponTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 11,
  },
  billHeading: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink700,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.ink500,
  },
  billVal: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  billValMarigold: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.marigold700,
  },
  billValFree: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.green700,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    width: '100%',
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  billTotalVal: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 72,
    justifyContent: 'center',
  },
  disabledBarBtn: {
    backgroundColor: COLORS.muted,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBarBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: COLORS.ink300,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payableSummary: {
    justifyContent: 'center',
  },
  payableLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink500,
  },
  payableAmount: {
    ...FONTS.balooSemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: COLORS.ink900,
  },
  proceedPayBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    width: 192,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedPayBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
