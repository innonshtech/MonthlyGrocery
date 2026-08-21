import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../constants/theme';

export default function SplashScreen({ navigation }: any) {
  const { token, user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token && user?.role !== 'consumer') {
        navigation.replace('MerchantDashboard');
      } else if (token) {
        navigation.replace('Shop');
      } else {
        navigation.replace('ValueIntro');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [token, user, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {/* Golden-Orange Marigold Squircle Logo Badge */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoLetter}>M</Text>
        </View>

        {/* Brand Title */}
        <Text style={styles.brandTitle}>MonthlyGrocery</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Plan once · Order monthly · Save more</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.green800, // Exact rich dark green #155A38
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl, // 20px squircle
    backgroundColor: COLORS.marigold500, // Exact signature savings marigold #F5A524
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  logoLetter: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.ink900, // Exact #17251E
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.green100, // Exact #E4F3EA
    letterSpacing: 0.2,
    fontWeight: '500',
  },
});
