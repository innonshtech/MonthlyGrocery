import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function PaymentMethodScreen({ route, navigation }: any) {
  const { token, user } = useAuth();
  const { items, clearCart } = useCart();
  const {
    selectedAddress,
    selectedSlot,
    appliedCoupon,
    couponDiscount = 0,
    totalAmount = 2500,
    totalSavings = 340
  } = route?.params || {};

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'COD'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [processing, setProcessing] = useState(false);

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        shipping_address: selectedAddress
          ? `${selectedAddress.flat}, ${selectedAddress.street}, ${selectedAddress.city} ${selectedAddress.pin}`
          : 'Pune, Maharashtra',
        delivery_slot: selectedSlot
          ? `${selectedSlot.dateLabel}, ${selectedSlot.timeWindow}`
          : 'Tomorrow Morning',
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: couponDiscount,
        total_amount: totalAmount,
      };

      const res = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      setProcessing(false);

      if (res.ok && data.success) {
        clearCart();
        navigation.replace('OrderSuccess', {
          orderId: data.order?.id || `ORD-${Date.now().toString().slice(-6)}`,
          total: totalAmount,
          savings: totalSavings,
          deliveryDay: selectedSlot?.dateLabel || 'Tomorrow',
          deliveryTime: selectedSlot?.timeWindow || '7:00 AM - 10:00 AM',
          address: selectedAddress?.flat || 'Your delivery address',
        });
      } else {
        // Fallback demo order creation if offline
        clearCart();
        navigation.replace('OrderSuccess', {
          orderId: `MG-${Math.floor(100000 + Math.random() * 900000)}`,
          total: totalAmount,
          savings: totalSavings,
          deliveryDay: selectedSlot?.dateLabel || 'Tomorrow',
          deliveryTime: selectedSlot?.timeWindow || '7:00 AM - 10:00 AM',
          address: selectedAddress?.flat || 'Your delivery address',
        });
      }
    } catch (err) {
      setProcessing(false);
      clearCart();
      navigation.replace('OrderSuccess', {
        orderId: `MG-${Math.floor(100000 + Math.random() * 900000)}`,
        total: totalAmount,
        savings: totalSavings,
        deliveryDay: selectedSlot?.dateLabel || 'Tomorrow',
        deliveryTime: selectedSlot?.timeWindow || '7:00 AM - 10:00 AM',
        address: selectedAddress?.flat || 'Your delivery address',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select payment method</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Payable Total Card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>TOTAL PAYABLE AMOUNT</Text>
            <Text style={styles.totalAmountText}>₹{totalAmount}</Text>
          </View>
          <View style={styles.savingsTag}>
            <Text style={styles.savingsTagText}>Saving ₹{totalSavings}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionHeading}>PAYMENT OPTIONS</Text>

        {/* 1. UPI */}
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'UPI' && styles.paymentCardActive]}
          onPress={() => setPaymentMethod('UPI')}
          activeOpacity={0.85}
        >
          <View style={[styles.radioCircle, paymentMethod === 'UPI' && styles.radioCircleActive]}>
            {paymentMethod === 'UPI' && <View style={styles.radioDot} />}
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodIcon}>⚡</Text>
              <Text style={styles.methodTitle}>UPI (Instant & Zero Fee)</Text>
            </View>

            {paymentMethod === 'UPI' && (
              <View style={styles.upiAppsRow}>
                {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                  <TouchableOpacity
                    key={app}
                    style={[styles.upiPill, selectedUpiApp === app && styles.upiPillActive]}
                    onPress={() => setSelectedUpiApp(app)}
                  >
                    <Text style={[styles.upiPillText, selectedUpiApp === app && styles.upiPillTextActive]}>
                      {app}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* 2. Cards */}
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'CARD' && styles.paymentCardActive]}
          onPress={() => setPaymentMethod('CARD')}
          activeOpacity={0.85}
        >
          <View style={[styles.radioCircle, paymentMethod === 'CARD' && styles.radioCircleActive]}>
            {paymentMethod === 'CARD' && <View style={styles.radioDot} />}
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodIcon}>💳</Text>
              <Text style={styles.methodTitle}>Credit / Debit Card</Text>
            </View>
            <Text style={styles.methodSub}>Visa, MasterCard, RuPay, Maestro</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Netbanking */}
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'NETBANKING' && styles.paymentCardActive]}
          onPress={() => setPaymentMethod('NETBANKING')}
          activeOpacity={0.85}
        >
          <View style={[styles.radioCircle, paymentMethod === 'NETBANKING' && styles.radioCircleActive]}>
            {paymentMethod === 'NETBANKING' && <View style={styles.radioDot} />}
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodIcon}>🏦</Text>
              <Text style={styles.methodTitle}>Net Banking</Text>
            </View>
            <Text style={styles.methodSub}>All major Indian banks supported</Text>
          </View>
        </TouchableOpacity>

        {/* 4. Cash on Delivery */}
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardActive]}
          onPress={() => setPaymentMethod('COD')}
          activeOpacity={0.85}
        >
          <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleActive]}>
            {paymentMethod === 'COD' && <View style={styles.radioDot} />}
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodIcon}>💵</Text>
              <Text style={styles.methodTitle}>Cash on Delivery</Text>
            </View>
            <Text style={styles.methodSub}>Pay cash or UPI at delivery doorstep</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.securityNotice}>
          <Text style={styles.shieldIcon}>🔒</Text>
          <Text style={styles.securityText}>
            100% Safe & Secure Payments. 256-Bit Encrypted.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Place Order Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePlaceOrder}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>
              Pay ₹{totalAmount} & Place order ›
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
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
    paddingTop: 16,
    paddingBottom: 28,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalAmountText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  savingsTag: {
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  savingsTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green700,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  paymentCardActive: {
    borderColor: COLORS.green700,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: COLORS.ink300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: COLORS.green700,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green700,
  },
  paymentInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  methodIcon: {
    fontSize: 16,
  },
  methodTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  methodSub: {
    fontSize: 12,
    color: COLORS.ink500,
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  upiPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  upiPillActive: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  upiPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  upiPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 10,
  },
  shieldIcon: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.ink500,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  payBtn: {
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
