import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

import LoginScreen from '../screens/LoginScreen';
import LandingScreen from '../screens/LandingScreen';
import ShopScreen from '../screens/customer/ShopScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import OrdersDashboard from '../screens/merchant/OrdersDashboard';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <CartProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token === null ? (
            // 1. Auth Flow
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
            </>
          ) : user?.role === 'consumer' ? (
            // 2. Customer Portal Flow
            <>
              <Stack.Screen name="Shop" component={ShopScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
            </>
          ) : (
            // 3. Merchant Portal Flow (role: admin, super_admin)
            <Stack.Screen name="MerchantDashboard" component={OrdersDashboard} />
          )}
        </Stack.Navigator>
      </CartProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8ED',
  },
});
