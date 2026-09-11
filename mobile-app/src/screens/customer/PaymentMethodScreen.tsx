import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import { COLORS, FONTS } from '../../constants/theme';
import {
  CheckoutBackIcon,
  PaymentCodIcon,
  AddressRadioOnIcon,
  AddressRadioOffIcon,
} from '../../components/CheckoutFigmaIcons';
import {
  buildDeliverToLabel,
  buildShippingAddress,
} from '../../services/addressApi';
import { normalizePincode, validateAddressPincode } from '../../utils/locationParams';

/** Figma E5 Payment canvas background */
const SCREEN_BG = '#F8FAF8';

const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

function mapFailureReason(error?: string, isNetwork = false): string {
  if (isNetwork) return 'network connection failed';
  if (!error) return 'transaction declined by bank';
  const trimmed = error.trim();
  if (trimmed.length > 80) return `${trimmed.slice(0, 77)}...`;
  return trimmed;
}

function buildPaymentRetryParams(
  selectedAddress: any,
  selectedSlot: any,
  appliedCoupon: any,
  couponDiscount: number,
  totalAmount: number,
  totalSavings: number,
  productSavings: number,
) {
  return {
    selectedAddress,
    selectedSlot,
    appliedCoupon,
    couponDiscount,
    totalAmount,
    totalSavings,
    productSavings,
  };
}

function mapOrderItemsForBasket(orderItems: any[]) {
  return (orderItems || []).map((oi) => {
    const name = (oi.product_name || oi.name || '').trim();
    return {
      id: oi.product_id || oi.id,
      name,
      price: oi.unit_price || oi.price || 0,
      qty: oi.quantity || oi.qty || 1,
      unit: oi.unit || '1 unit',
    };
  });
}

export default function PaymentMethodScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token, city, area, pincode: areaPincode } = useAuth();
  const { items, clearCart } = useCart();
  const cartSubtotal = items.reduce(
    (sum, i) => sum + (Number(i.product.price) || 0) * (i.quantity || 1),
    0,
  );
  const {
    selectedAddress,
    selectedSlot,
    appliedCoupon,
    couponDiscount = 0,
    totalAmount = Math.max(0, cartSubtotal - couponDiscount),
    totalSavings = 0,
    productSavings = 0,
  } = route?.params || {};

  const [codSelected, setCodSelected] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!codSelected) {
      Alert.alert('Select payment', 'Please select cash on delivery to continue.');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address required', 'Please select a delivery address before placing the order.');
      return;
    }

    const shippingAddress = buildShippingAddress(selectedAddress);
    if (!shippingAddress) {
      Alert.alert('Address incomplete', 'Please complete your delivery address before placing the order.');
      return;
    }

    if (!selectedSlot?.dateLabel || !selectedSlot?.timeWindow) {
      Alert.alert('Delivery slot required', 'Please select a delivery slot before placing the order.');
      return;
    }

    const addressPin = normalizePincode(selectedAddress.pincode);
    const pinCheck = validateAddressPincode(addressPin, areaPincode);
    if (!pinCheck.valid) {
      Alert.alert('Invalid pincode', pinCheck.message || 'Please check your delivery pincode.');
      return;
    }

    const slotLabel = `${selectedSlot.dateLabel}, ${selectedSlot.timeWindow}`;

    setProcessing(true);
    try {
      const deliverToLabel = buildDeliverToLabel(selectedAddress);
      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          shop_id: i.product.shop_id,
          quantity: i.quantity,
          price: i.product.price,
          name: i.product.name,
          unit: i.product.unit,
          image_url: i.product.image_url || '',
        })),
        shipping_address: shippingAddress,
        deliver_to_label: deliverToLabel || shippingAddress,
        product_savings: productSavings || Math.max(0, totalSavings - couponDiscount),
        delivery_slot: slotLabel,
        delivery_slot_date: selectedSlot?.date || null,
        delivery_slot_window_id: selectedSlot?.windowId || null,
        shop_id: selectedSlot?.shopId || items[0]?.product?.shop_id || null,
        city: city || null,
        area_name: area || null,
        pincode: addressPin || areaPincode || null,
        payment_method: 'COD',
        coupon_code: appliedCoupon?.code || null,
        discount_amount: couponDiscount,
        total_amount: totalAmount,
      };

      const res = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      setProcessing(false);

      if (res.ok && data.success) {
        const order = data.order;
        const orderItemsSnapshot = mapOrderItemsForBasket(
          order?.order_items || items.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            unit_price: i.product.price,
            quantity: i.quantity,
            unit: i.product.unit,
          })),
        );

        clearCart();
        navigation.replace('OrderSuccess', {
          orderId: order?.display_id || order?.id,
          backendOrderId: order?.id,
          total: order?.total_amount ?? totalAmount,
          savings: order?.total_savings ?? totalSavings,
          arriving: order?.delivery_slot || slotLabel,
          deliverTo: order?.deliver_to_label || deliverToLabel || shippingAddress,
          paymentMethod: order?.payment_method_label || order?.payment_method || 'Cash on Delivery',
          deliveryOtp: order?.delivery_otp,
          orderItems: orderItemsSnapshot,
        });
      } else {
        navigation.replace('PaymentFailed', {
          failureReason: mapFailureReason(data.error),
          paymentParams: buildPaymentRetryParams(
            selectedAddress,
            selectedSlot,
            appliedCoupon,
            couponDiscount,
            totalAmount,
            totalSavings,
            productSavings,
          ),
        });
      }
    } catch {
      setProcessing(false);
      navigation.replace('PaymentFailed', {
        failureReason: mapFailureReason(undefined, true),
        paymentParams: buildPaymentRetryParams(
          selectedAddress,
          selectedSlot,
          appliedCoupon,
          couponDiscount,
          totalAmount,
          totalSavings,
          productSavings,
        ),
      });
    }
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CheckoutBackIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountPayableBanner}>
          <Text style={styles.payableLabelText}>Amount payable</Text>
          <Text style={styles.payableAmountVal}>{formatInr(totalAmount)}</Text>
        </View>

        <View style={styles.methodsSection}>
          <Text style={styles.sectionLabel}>PAYMENT METHODS</Text>

          <TouchableOpacity
            style={styles.paymentCard}
            onPress={() => setCodSelected(true)}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <PaymentCodIcon size={22} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.methodTitle}>Cash on delivery</Text>
              <Text style={styles.methodSubtitle}>Pay when your order arrives</Text>
            </View>
            {codSelected ? (
              <AddressRadioOnIcon size={22} />
            ) : (
              <AddressRadioOffIcon size={22} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePlaceOrder}
          disabled={processing || !codSelected}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>Pay On Delivery</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: SCREEN_BG,
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
    gap: 16,
  },
  amountPayableBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2F2E7',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  payableLabelText: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#1E7A46',
  },
  payableAmountVal: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#1E7A46',
  },
  methodsSection: {
    gap: 8,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    gap: 2,
  },
  methodTitle: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  methodSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  payBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  payBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
