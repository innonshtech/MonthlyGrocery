import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

const STEPS = [
  { id: 1, title: 'Address Details' },
  { id: 2, title: 'Delivery Slot' },
  { id: 3, title: 'Payment Option' },
  { id: 4, title: 'Confirm Order' }
];

export default function CheckoutScreen({ navigation }: any) {
  const { token } = useAuth();
  const { items, clearCart, totalAmount, minOrderLimit } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Address State
  const [flat, setFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pin, setPin] = useState('');

  // Delivery Slot State
  const [deliveryDay, setDeliveryDay] = useState('Tomorrow');
  const [deliveryTime, setDeliveryTime] = useState('8:00 AM - 12:00 PM');

  // Payment Option State
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const deliveryCharge = totalAmount >= 1000 ? 0 : 49;
  const grandTotal = totalAmount + deliveryCharge;

  const handleNextStep = () => {
    if (step === 1) {
      // Validate address details
      if (!flat.trim() || !street.trim() || !landmark.trim() || !pin.trim()) {
        Alert.alert('Validation Error', 'Please complete all address fields.');
        return;
      }
      if (pin.trim().length !== 6 || isNaN(Number(pin.trim()))) {
        Alert.alert('Validation Error', 'Please enter a valid 6-digit PIN code.');
        return;
      }
      if (landmark.trim().length < 3) {
        Alert.alert('Validation Error', 'Landmark should be descriptive (minimum 3 characters).');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handlePlaceOrder = async () => {
    if (!token) {
      Alert.alert('Session Expired', 'Please login to complete your order.');
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    try {
      const fullAddress = `${flat.trim()}, ${street.trim()} | Landmark: ${landmark.trim()} | PIN: ${pin.trim()} | Slot: ${deliveryDay} (${deliveryTime}) | Pay: ${paymentMethod}`;

      const orderItems = items.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
        price: it.product.price,
      }));

      const payload = {
        shop_id: items[0].product.shop_id,
        items: orderItems,
        total_amount: grandTotal,
        delivery_address: fullAddress,
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        clearCart();
        navigation.replace('OrderSuccess', {
          orderId: data.order.id,
          total: grandTotal,
          deliveryDay,
          deliveryTime
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to place order.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Text style={styles.label}>Flat / House No. / Building Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 402, Sunrise Apt"
              value={flat}
              onChangeText={setFlat}
            />

            <Text style={styles.label}>Area / Street / Locality</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Linking Road, Bandra West"
              value={street}
              onChangeText={setStreet}
            />

            <Text style={styles.label}>Landmark</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Opposite Axis Bank ATM"
              value={landmark}
              onChangeText={setLandmark}
            />

            <Text style={styles.label}>PIN Code (6-digit)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 400050"
              keyboardType="number-pad"
              maxLength={6}
              value={pin}
              onChangeText={setPin}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Delivery Day</Text>
            <View style={styles.row}>
              {['Tomorrow', 'Day After', 'Next Monday'].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.pill, deliveryDay === day && styles.pillActive]}
                  onPress={() => setDeliveryDay(day)}
                >
                  <Text style={[styles.pillText, deliveryDay === day && styles.pillTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.cardTitle, { marginTop: 25 }]}>Select Delivery Slot</Text>
            {['8:00 AM - 12:00 PM', '12:00 PM - 4:00 PM', '4:00 PM - 8:00 PM'].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotItem, deliveryTime === slot && styles.slotItemActive]}
                onPress={() => setDeliveryTime(slot)}
              >
                <Text style={[styles.slotText, deliveryTime === slot && styles.slotTextActive]}>
                  {deliveryTime === slot ? '🟢  ' : '⚪  '}{slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Payment Option</Text>
            {[
              { id: 'COD', label: '💵  Cash on Delivery / Pay on Delivery', sub: 'Pay with cash or UPI on delivery' },
              { id: 'UPI', label: '⚡  Paytm / PhonePe / BHIM UPI', sub: 'Instant mobile UPI verification' },
              { id: 'CARD', label: '💳  Credit / Debit Cards', sub: 'Secure bank checkouts' }
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.paymentItem, paymentMethod === option.id && styles.paymentItemActive]}
                onPress={() => setPaymentMethod(option.id)}
              >
                <View style={styles.radioRow}>
                  <Text style={styles.radioCircle}>{paymentMethod === option.id ? '🟢' : '⚪'}</Text>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.paymentName}>{option.label}</Text>
                    <Text style={styles.paymentSub}>{option.sub}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary Details</Text>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Delivery To</Text>
              <Text style={styles.summaryVal}>{flat}, {street}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Landmark & PIN</Text>
              <Text style={styles.summaryVal}>{landmark} (PIN {pin})</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Scheduled Slot</Text>
              <Text style={styles.summaryVal}>{deliveryDay} @ {deliveryTime}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Payment Choice</Text>
              <Text style={styles.summaryVal}>
                {paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod === 'UPI' ? 'UPI Pay' : 'Card'}
              </Text>
            </View>

            <View style={[styles.summaryItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.summaryLabel}>Bill Details</Text>
              <View style={styles.billDetails}>
                <View style={styles.billLine}>
                  <Text style={styles.billLineText}>Items total</Text>
                  <Text style={styles.billLineVal}>₹{totalAmount}</Text>
                </View>
                <View style={styles.billLine}>
                  <Text style={styles.billLineText}>Delivery fee</Text>
                  <Text style={styles.billLineVal}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text>
                </View>
                <View style={[styles.billLine, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, marginTop: 8 }]}>
                  <Text style={[styles.billLineText, { fontWeight: 'bold', color: '#0B1220' }]}>Grand Total</Text>
                  <Text style={[styles.billLineVal, { fontWeight: 'bold', color: '#22C55E', fontSize: 16 }]}>₹{grandTotal}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 1 ? navigation.goBack() : handlePrevStep())} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Process</Text>
      </View>

      {/* Steps Indicator Bar */}
      <View style={styles.indicatorContainer}>
        {STEPS.map((s) => (
          <View key={s.id} style={styles.indicatorItem}>
            <View style={[styles.indicatorStep, step >= s.id && styles.indicatorStepActive]}>
              <Text style={[styles.indicatorStepText, step >= s.id && styles.indicatorStepTextActive]}>{s.id}</Text>
            </View>
            <Text style={[styles.indicatorLabel, step === s.id && styles.indicatorLabelActive]}>{s.title}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalPrice}>₹{grandTotal}</Text>
        </View>

        {step < 4 ? (
          <TouchableOpacity style={styles.btn} onPress={handleNextStep}>
            <Text style={styles.btnText}>Continue ➔</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handlePlaceOrder} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Confirm Order 🎉</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  backBtn: {
    marginRight: 15,
  },
  backText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  indicatorItem: {
    alignItems: 'center',
    flex: 1,
  },
  indicatorStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorStepActive: {
    backgroundColor: '#22C55E',
  },
  indicatorStepText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  indicatorStepTextActive: {
    color: '#fff',
  },
  indicatorLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  indicatorLabelActive: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 15,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0B1220',
    marginTop: 6,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pillActive: {
    backgroundColor: '#22C55E',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  pillTextActive: {
    color: '#fff',
  },
  slotItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  slotItemActive: {
    borderColor: '#22C55E',
    backgroundColor: '#22C55E08',
  },
  slotText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  slotTextActive: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  paymentItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  paymentItemActive: {
    borderColor: '#22C55E',
    backgroundColor: '#22C55E08',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    fontSize: 18,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  paymentSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  summaryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 4,
  },
  billDetails: {
    backgroundColor: '#FFF8ED',
    borderWidth: 1,
    borderColor: '#F1EAD8',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLineText: {
    fontSize: 13,
    color: '#666',
  },
  billLineVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  bottomBar: {
    backgroundColor: '#fff',
    height: 76,
    borderTopWidth: 1,
    borderTopColor: '#F1EAD8',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBlock: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 2,
  },
  btn: {
    backgroundColor: '#22C55E',
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: '#6C3BFF',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
