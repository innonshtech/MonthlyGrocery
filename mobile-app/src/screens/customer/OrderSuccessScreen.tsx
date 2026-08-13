import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

export default function OrderSuccessScreen({ route, navigation }: any) {
  const { orderId, total, deliveryDay, deliveryTime } = route.params || {
    orderId: 'ORD-98402',
    total: 3049,
    deliveryDay: 'Tomorrow',
    deliveryTime: '8:00 AM - 12:00 PM'
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.container}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.successIcon}>🎉</Text>
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for choosing MonthlyGrocery. Your restocking schedule has been confirmed with the store.
        </Text>

        {/* Order Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Order Reference ID</Text>
            <Text style={styles.value} numberOfLines={1}>{orderId}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Amount Billed</Text>
            <Text style={[styles.value, { color: '#22C55E' }]}>₹{total}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Scheduled Slot</Text>
            <Text style={styles.value}>{deliveryDay} ({deliveryTime})</Text>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.label}>Estimated Delivery</Text>
            <Text style={styles.value}>⚡ Within 4 Hours of Slot Start</Text>
          </View>
        </View>

        {/* Help Tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 You can modify items, adjust repeating slot frequencies, or request cancellations directly from the Order History page.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity 
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.primaryBtnText}>Track Order Live ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Shop')}
        >
          <Text style={styles.secondaryBtnText}>Back to Home Feed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  successIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B1220',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
    maxWidth: '60%',
    textAlign: 'right',
  },
  tipBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1EAD8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 35,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#22C55E',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6C3BFF',
  },
  secondaryBtnText: {
    color: '#6C3BFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
