import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMerchantAuth } from '../context/MerchantAuthContext';

import MerchantSplashScreen from '../screens/MerchantSplashScreen';
import MerchantLoginScreen from '../screens/MerchantLoginScreen';
import MerchantTabScreen from '../screens/MerchantTabScreen';
import DeliverySlotsScreen from '../screens/DeliverySlotsScreen';

const Stack = createNativeStackNavigator();

export default function MerchantAppNavigator() {
  const { token, user, loading } = useMerchantAuth();
  const isAuthenticated = !!(token && user);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <NavigationContainer key={isAuthenticated ? 'merchant-auth' : 'merchant-guest'}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MerchantDashboard" component={MerchantTabScreen} />
            <Stack.Screen name="DeliverySlots" component={DeliverySlotsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MerchantSplash" component={MerchantSplashScreen} />
            <Stack.Screen name="MerchantLogin" component={MerchantLoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
