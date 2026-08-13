import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

import LoginScreen from '../screens/LoginScreen';
import LandingScreen from '../screens/LandingScreen';
import SplashScreen from '../screens/SplashScreen';
import ValueIntroScreen from '../screens/ValueIntroScreen';
import CitySelectionScreen from '../screens/CitySelectionScreen';
import AreaSelectionScreen from '../screens/AreaSelectionScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import MainTabScreen from '../screens/customer/MainTabScreen';
import CategoryProductsScreen from '../screens/customer/CategoryProductsScreen';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import MyMonthlyGroceryHub from '../screens/customer/MyMonthlyGroceryHub';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderSuccessScreen from '../screens/customer/OrderSuccessScreen';
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
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          {token !== null && user?.role !== 'consumer' ? (
            // 1. Merchant Portal Flow (role: admin, super_admin)
            <Stack.Screen name="MerchantDashboard" component={OrdersDashboard} />
          ) : (
            // 2. Customer & Guest Flow
            <>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="ValueIntro" component={ValueIntroScreen} />
              <Stack.Screen name="CitySelection" component={CitySelectionScreen} />
              <Stack.Screen name="AreaSelection" component={AreaSelectionScreen} />
              <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Shop" component={MainTabScreen} />
              <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="MyMonthlyGroceryHub" component={MyMonthlyGroceryHub} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
            </>
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
