import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_BASE } from '../../config/api';

export default function CartScreen({ navigation }: any) {
  const { token } = useAuth();
  const { items, updateQuantity, clearCart, totalAmount } = useCart();
  const [address, setAddress] = useState('Flat 402, Building A, Sunrise Apartment, Mumbai');
  const [loading, setLoading] = useState(false);

  const deliveryCharge = totalAmount >= 1000 ? 0 : 49;
  const grandTotal = totalAmount + deliveryCharge;

  const handleCheckout = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Create request payload
      const orderItems = items.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
        price: it.product.price,
      }));

      const payload = {
        shop_id: items[0].product.shop_id, // associate with the first product's shop
        items: orderItems,
        total_amount: grandTotal,
        delivery_address: address.trim(),
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', 'Order placed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              navigation.navigate('Orders');
            }
          }
        ]);
      } else {
        Alert.alert('Checkout Failed', data.error || 'Failed to place order');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItemCard}>
      <Image source={{ uri: item.product.image_url }} style={styles.itemImage} resizeMode="contain" />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        <Text style={styles.itemPrice}>₹{item.product.price} each</Text>
      </View>
      <View style={styles.quantitySection}>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
          >
            <Text style={styles.stepText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
          >
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtotalText}>₹{item.product.price * item.quantity}</Text>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptyDesc}>Add items from the store to checkout.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Shop')}>
            <Text style={styles.shopBtnText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Delivery address */}
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Enter complete delivery address"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />

            {/* Bill Details */}
            <Text style={styles.sectionTitle}>Bill Summary</Text>
            <View style={styles.billCard}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Items Total</Text>
                <Text style={styles.billValue}>₹{totalAmount}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Charge</Text>
                <Text style={styles.billValue}>
                  {deliveryCharge === 0 ? <Text style={{ color: '#22C55E' }}>FREE</Text> : `₹${deliveryCharge}`}
                </Text>
              </View>
              <View style={[styles.billRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
              </View>
            </View>

            {/* Checkout button */}
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkoutText}>Place Order · ₹{grandTotal}</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  listContainer: {
    padding: 15,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
  },
  itemUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  quantitySection: {
    alignItems: 'flex-end',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  stepBtn: {
    paddingHorizontal: 6,
  },
  stepText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 15,
  },
  qtyVal: {
    color: '#0B1220',
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 6,
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 6,
  },
  footer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 10,
    marginTop: 10,
  },
  addressInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F1EAD8',
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    height: 80,
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1220',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginBottom: 0,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  checkoutBtn: {
    backgroundColor: '#22C55E',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 30,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 20,
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 50,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
