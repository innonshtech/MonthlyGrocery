import React, { useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Dimensions } from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';

const { width } = Dimensions.get('window');

export default function MerchantSplashScreen({ navigation }: any) {
  const { token, user, loading } = useMerchantAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (token && user) {
        navigation.replace('MerchantDashboard');
      } else {
        navigation.replace('MerchantLogin');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [token, user, loading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.badge}>
        <Text style={styles.badgeText}>STORE PARTNER APP</Text>
      </View>

      <View style={styles.iconBox}>
        <Text style={styles.icon}>🏪</Text>
      </View>

      <Text style={styles.appName}>MonthlyGrocery</Text>
      <Text style={styles.appSub}>PARTNER CONSOLE</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Kirana Order & Inventory Management System</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  badge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  icon: {
    fontSize: 44,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 3,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
