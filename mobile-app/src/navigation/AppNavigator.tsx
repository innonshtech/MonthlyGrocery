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
import SearchScreen from '../screens/customer/SearchScreen';
import MyMonthlyGroceryHub from '../screens/customer/MyMonthlyGroceryHub';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderSuccessScreen from '../screens/customer/OrderSuccessScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import SavedAddressesScreen from '../screens/customer/SavedAddressesScreen';
import MyCouponsScreen from '../screens/customer/MyCouponsScreen';
import HelpSupportScreen from '../screens/customer/HelpSupportScreen';
import EditProfileScreen from '../screens/customer/EditProfileScreen';
import OffersCouponsScreen from '../screens/customer/OffersCouponsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { loading } = useAuth();

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
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="MyMonthlyGroceryHub" component={MyMonthlyGroceryHub} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
          <Stack.Screen name="MyCoupons" component={MyCouponsScreen} />
          <Stack.Screen name="OffersCoupons" component={OffersCouponsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
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
