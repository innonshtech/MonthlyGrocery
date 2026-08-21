import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MerchantAuthProvider } from './src/context/MerchantAuthContext';
import MerchantAppNavigator from './src/navigation/MerchantAppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <MerchantAuthProvider>
        <StatusBar barStyle="light-content" />
        <MerchantAppNavigator />
      </MerchantAuthProvider>
    </SafeAreaProvider>
  );
}
