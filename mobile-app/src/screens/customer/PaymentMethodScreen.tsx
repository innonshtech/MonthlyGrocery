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
import { SafeAreaView } from 'react-native-safe-area-context';
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

/** Figma E5 Payment canvas background */
const SCREEN_BG = '#FBFAF6';

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
  const { token, city, area } = useAuth();
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
        pincode: selectedAddress?.pincode || null,
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CheckoutBackIcon size={24} />
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
          <Text style={styles.sectionLabel}>payment METHODS</Text>

          <TouchableOpacity
            style={styles.paymentCard}
            onPress={() => setCodSelected(true)}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <PaymentCodIcon size={20} />
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

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
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
    gap: 10,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 8,
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
    paddingBottom: 24,
    gap: 16,
  },
  amountPayableBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.green100,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  payableLabelText: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.green800,
  },
  payableAmountVal: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.green800,
  },
  methodsSection: {
    gap: 10,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.44,
    color: COLORS.ink500,
    textTransform: 'uppercase',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    gap: 1,
  },
  methodTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  methodSubtitle: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  payBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
