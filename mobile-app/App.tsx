import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { NetworkProvider } from './src/context/NetworkContext';
import OfflineBanner from './src/components/OfflineBanner';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar barStyle="dark-content" />
            <OfflineBanner />
            <AppNavigator />
          </ToastProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

