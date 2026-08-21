import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export type SystemStateType = 'offline' | 'unserviceable' | 'error' | 'maintenance';

interface SystemStateProps {
  route?: {
    params?: {
      type?: SystemStateType;
      areaName?: string;
      onRetry?: () => void;
    };
  };
  navigation?: any;
  type?: SystemStateType;
  onRetry?: () => void;
}

export default function SystemStateScreen({ route, navigation, type: propType, onRetry: propOnRetry }: SystemStateProps) {
  const stateType: SystemStateType = propType || route?.params?.type || 'offline';
  const areaName = route?.params?.areaName || 'this area';
  const onRetry = propOnRetry || route?.params?.onRetry;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.reset({ index: 0, routes: [{ name: 'Splash' }] });
    }
  };

  const handleNotifyMe = () => {
    Alert.alert(
      'Notification Saved!',
      `We've saved your request. You'll be the first to know the moment MonthlyGrocery begins deliveries in ${areaName}!`
    );
  };

  const handleChangeArea = () => {
    if (navigation) {
      navigation.navigate('CitySelection');
    }
  };

  const handleGoHome = () => {
    if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'Shop' }] });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Status Space */}
      <View style={styles.topSpace} />

      <View style={styles.contentWrap}>
        {/* =========================================================================
           1. STATE: OFFLINE / NO INTERNET (H1 IN FIGMA)
           ========================================================================= */}
        {stateType === 'offline' && (
          <View style={styles.stateContainer}>
            <View style={styles.mintCircle}>
              <Text style={styles.iconWifiCross}>📡 ✕</Text>
            </View>

            <Text style={styles.headline}>You're offline</Text>
            <Text style={styles.subtitle}>
              Check your internet connection and try again.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =========================================================================
           2. STATE: AREA NOT SERVICEABLE (H2 IN FIGMA)
           ========================================================================= */}
        {stateType === 'unserviceable' && (
          <View style={styles.stateContainer}>
            <View style={styles.mintCircle}>
              <AppIcon name="map-pin" size={30} color={COLORS.green700} />
            </View>

            <Text style={styles.headline}>We're not here yet</Text>
            <Text style={styles.subtitle}>
              MonthlyGrocery doesn't deliver to {areaName} yet, but we're expanding fast.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleNotifyMe}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Notify me when you're live</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLinkBtn}
              onPress={handleChangeArea}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryLinkText}>Change area</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =========================================================================
           3. STATE: GENERIC ERROR (H3 IN FIGMA)
           ========================================================================= */}
        {stateType === 'error' && (
          <View style={styles.stateContainer}>
            <View style={styles.peachCircle}>
              <Text style={styles.warningTriangleEmoji}>⚠️</Text>
            </View>

            <Text style={styles.headline}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              We hit a snag on our end. Please try again in a moment.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Try again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLinkBtn}
              onPress={handleGoHome}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryLinkText}>Go to home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =========================================================================
           4. STATE: MAINTENANCE (H4 IN FIGMA)
           ========================================================================= */}
        {stateType === 'maintenance' && (
          <View style={styles.stateContainer}>
            <View style={styles.mintCircle}>
              <Text style={styles.wrenchEmoji}>🔧</Text>
            </View>

            <Text style={styles.headline}>Back in a bit</Text>
            <Text style={styles.subtitle}>
              We're doing some quick upkeep to serve you better. Please check back shortly.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topSpace: {
    height: 40,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  stateContainer: {
    width: '100%',
    alignItems: 'center',
  },
  mintCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green50, // Mint #E4F3EA
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  peachCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWifiCross: {
    fontSize: 26,
    color: COLORS.green700,
  },
  warningTriangleEmoji: {
    fontSize: 32,
  },
  wrenchEmoji: {
    fontSize: 30,
  },
  headline: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.green700, // Primary Green #1E7A46
    height: 50,
    borderRadius: RADIUS.pill, // 999px
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryLinkBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.green700,
  },
});
