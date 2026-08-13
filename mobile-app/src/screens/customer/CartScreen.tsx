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
  const { items, minOrderLimit, updateQuantity, clearCart, totalAmount } = useCart();
  const [loading, setLoading] = useState(false);

  const deliveryCharge = totalAmount >= 1000 ? 0 : 49;
  const grandTotal = totalAmount + deliveryCharge;

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!token) {
      Alert.alert('Login Required', 'You must log in to proceed to checkout.', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login', { redirect: 'Checkout' }) }
      ]);
      return;
    }

    navigation.navigate('Checkout');
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
            {/* Minimum Order Limit Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Monthly Order Progress</Text>
                <Text style={styles.progressValue}>₹{totalAmount} / ₹{minOrderLimit}</Text>
              </View>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min((totalAmount / minOrderLimit) * 100, 100)}%` }]} />
              </View>

              {totalAmount < minOrderLimit ? (
                <Text style={styles.progressTip}>
                  💡 Add <Text style={{fontWeight: 'bold'}}>₹{minOrderLimit - totalAmount}</Text> more to place order.
                </Text>
              ) : (
                <Text style={[styles.progressTip, { color: '#22C55E', fontWeight: 'bold' }]}>
                  🎉 Minimum order limit met!
                </Text>
              )}
            </View>



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
            <TouchableOpacity 
              style={[styles.checkoutBtn, totalAmount < minOrderLimit && styles.checkoutBtnDisabled]} 
              onPress={handleCheckout} 
              disabled={loading || totalAmount < minOrderLimit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : totalAmount < minOrderLimit ? (
                <Text style={styles.checkoutTextDisabled}>Add ₹{minOrderLimit - totalAmount} more to checkout</Text>
              ) : (
                <Text style={styles.checkoutText}>Proceed to Checkout · ₹{grandTotal}</Text>
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
  checkoutBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutTextDisabled: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6C3BFF',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  progressTip: {
    fontSize: 12,
    color: '#666',
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
