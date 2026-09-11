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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
import { calculateCouponDiscount } from '../../utils/couponDiscount';
import { API_BASE } from '../../config/api';

/** Figma E1 Checkout canvas background */
const CHECKOUT_BG = '#F8FAF8';
const REQUIRED_BG = '#FDEEEC';

const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function CheckoutScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, minOrderLimit = 2500, appliedCoupon, setAppliedCoupon } = useCart();
  const { token, city, area, pincode: areaPincode } = useAuth();
  const { showToast } = useToast();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  useEffect(() => {
    if (route?.params?.appliedCoupon) {
      setAppliedCoupon(route.params.appliedCoupon);
    }
  }, [route?.params?.appliedCoupon, setAppliedCoupon]);

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
      setAppliedCoupon,
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

  useFocusEffect(
    useCallback(() => {
      const loadDefaultSlot = async () => {
        if (route?.params?.selectedSlot || selectedSlot) return;
        try {
          const shopId = items[0]?.product?.shop_id;
          const params = new URLSearchParams({ days: '4' });
          if (shopId) params.set('shop_id', shopId);
          const pin = selectedAddress?.pincode || areaPincode;
          if (pin) params.set('pincode', pin);
          if (city) params.set('city', city);
          if (area) params.set('area', area);

          const res = await fetch(`${API_BASE}/delivery-slots?${params.toString()}`);
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.days) && data.days.length > 0) {
            const firstDay = data.days.find((d: any) => d.windows?.some((w: any) => !w.disabled)) || data.days[0];
            const firstWindow = firstDay?.windows?.find((w: any) => !w.disabled) || firstDay?.windows?.[0];
            if (firstDay && firstWindow) {
              setSelectedSlot({
                date: firstDay.date,
                dateLabel: firstDay.label,
                timeWindow: firstWindow.label,
                windowId: firstWindow.id,
                shopId: data.shop_id || shopId || undefined,
              });
            }
          }
        } catch {
          /* ignore */
        }
      };
      loadDefaultSlot();
    }, [items, selectedAddress?.pincode, areaPincode, city, area, route?.params?.selectedSlot, selectedSlot]),
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

  let couponDiscount = calculateCouponDiscount(appliedCoupon, itemTotalPrice);

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
      pincode: selectedAddress?.pincode || areaPincode || undefined,
      city,
      area,
    });
  };

  const handleApplyCoupon = () => {
    navigation.navigate('OffersCoupons', {
      currentTotal: itemTotalPrice,
      fromCheckout: true,
    });
  };

  const handleProceedToPayment = () => {
    if (!city?.trim() || !area?.trim()) {
      showToast({
        type: 'info',
        title: 'Location Required',
        message: 'Please select your delivery city and area before proceeding.',
        actionLabel: 'Select',
        onAction: () => navigation.navigate('CitySelection'),
      });
      return;
    }
    if (!selectedAddress) {
      navigation.navigate('DeliveryAddress', {
        selectedAddress,
        fromCheckout: true,
      });
      return;
    }
    if (!selectedSlot) {
      handleSelectSlot();
      return;
    }
    if (isBelowMin) {
      showToast({
        type: 'info',
        title: 'Minimum order not met',
        message: `Please add ₹${amountNeeded} more to reach the ₹${minLimit} minimum order value.`,
      });
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

    return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header — Figma: pl16 pr20 pt8 pb12 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <CheckoutBackIcon size={22} />
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

        {/* Coupon card */}
        {appliedCoupon ? (
          <View style={styles.appliedCouponCard}>
            <CheckoutPercentIcon size={20} color="#B45309" />
            <View style={styles.couponDetails}>
              <Text style={styles.appliedCouponCode}>{appliedCoupon.code} applied</Text>
              <Text style={styles.appliedCouponSavings}>
                You saved {formatInr(couponDiscount)} extra
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAppliedCoupon(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
              <CheckoutPercentIcon size={20} color="#1E7A46" />
              <Text style={styles.noCouponTitle}>Apply coupon</Text>
            </View>
            <Text style={styles.changeLink}>Select</Text>
          </TouchableOpacity>
        )}

        {/* Bill details — Figma E1 (529:685) */}
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

      {/* Sticky bottom bar — Figma height ~74, shows TO PAY & Proceed to pay, or disabled full-width button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {!selectedAddress || !selectedSlot ? (
          <View style={styles.disabledBottomBtn}>
            <Text style={styles.disabledBottomBtnText}>
              {!selectedAddress && !selectedSlot
                ? 'Add address & slot to continue'
                : !selectedAddress
                ? 'Add delivery address to continue'
                : 'Select delivery slot to continue'}
            </Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: CHECKOUT_BG,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  belowMinNotice: {
    backgroundColor: COLORS.marigold100,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  belowMinText: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.marigold700,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCardCol: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF5EE',
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
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  requiredTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#1E7A46',
  },
  cardSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#EAF5EE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: '#1E7A46',
    textTransform: 'uppercase',
  },
  requiredBadge: {
    backgroundColor: REQUIRED_BG,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: COLORS.error,
    textTransform: 'uppercase',
  },
  changeLink: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: '#1E7A46',
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  basketTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  basketCount: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  itemThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  quantityBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadgeText: {
    ...FONTS.muktaBold,
    color: '#FFFFFF',
    fontSize: 9.5,
    lineHeight: 12,
  },
  appliedCouponCard: {
    backgroundColor: '#FDF0DC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponDetails: {
    flex: 1,
    gap: 2,
  },
  appliedCouponCode: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#8A5200',
  },
  appliedCouponSavings: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 16,
    color: '#92400E',
  },
  removeCouponBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#1E7A46',
  },
  noCouponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    ...FONTS.muktaSemiBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#111827',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
  },
  billHeading: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#334155',
    marginBottom: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  billVal: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
  },
  billValMarigold: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: '#B45309',
  },
  billValFree: {
    ...FONTS.muktaBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#1E7A46',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F1',
    width: '100%',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  billTotalVal: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
    minHeight: 74,
    justifyContent: 'center',
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
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  payableAmount: {
    ...FONTS.muktaBold,
    fontSize: 24,
    lineHeight: 28,
    color: '#111827',
  },
  proceedPayBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedPayBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15.5,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  disabledBottomBtn: {
    backgroundColor: '#F3F3EE',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabledBottomBtnText: {
    ...FONTS.muktaMedium,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#9CA3AF',
  },
});
