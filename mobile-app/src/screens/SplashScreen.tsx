import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen({ navigation }: any) {
  const { token, user, city, area } = useAuth();

  useEffect(() => {
    // Small delay to show the brand splash
    const timer = setTimeout(() => {
      if (token && user?.role !== 'consumer') {
        // This is a merchant, handled by AppNavigator root, but route to MerchantDashboard as safety
        navigation.replace('MerchantDashboard');
      } else if (token) {
        // Return consumer -> go to Shop
        navigation.replace('Shop');
      } else {
        // No token (Unauthenticated) -> Go directly to Login page!
        navigation.replace('Login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [token, user, city, area, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.brandContainer}>
        <Text style={styles.logo}>MonthlyGrocery</Text>
        <Text style={styles.tagline}>India's Digital Monthly Grocery Assistant</Text>
      </View>
      <ActivityIndicator size="small" color="#22C55E" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0B1220',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  loader: {
    position: 'absolute',
    bottom: 50,
  },
});
