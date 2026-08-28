import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import {
  SYSTEM_STATE_ICON_SIZES,
  SystemStateErrorIcon,
  SystemStateMaintenanceIcon,
  SystemStateOfflineIcon,
  SystemStateUnserviceableIcon,
} from '../../components/system/SystemStateFigmaIcons';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import {
  SystemStatesScreenConfig,
  SystemStateVariantConfig,
  fetchSystemStatesScreenConfig,
  formatSystemStateTemplate,
} from '../../services/systemStatesApi';
import { submitAreaNotifyRequest } from '../../services/areasApi';

const SCREEN_BG = '#FBFAF6';

export type SystemStateType = 'offline' | 'unserviceable' | 'error' | 'maintenance';

interface SystemStateProps {
  route?: {
    params?: {
      type?: SystemStateType;
      areaName?: string;
      cityName?: string;
      onRetry?: () => void;
    };
  };
  navigation?: any;
  type?: SystemStateType;
  onRetry?: () => void;
}

type StateViewProps = {
  config: SystemStateVariantConfig;
  iconCircleStyle: object;
  icon: React.ReactNode;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryLoading?: boolean;
};

function StateView({
  config,
  iconCircleStyle,
  icon,
  onPrimary,
  onSecondary,
  primaryLoading,
}: StateViewProps) {
  return (
    <View style={styles.stateContainer}>
      <View style={iconCircleStyle}>{icon}</View>
      <Text style={styles.headline}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onPrimary}
        disabled={primaryLoading}
        activeOpacity={0.85}
      >
        {primaryLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>{config.primary_button_label}</Text>
        )}
      </TouchableOpacity>

      {config.secondary_button_label && onSecondary ? (
        <TouchableOpacity
          style={styles.secondaryLinkBtn}
          onPress={onSecondary}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryLinkText}>{config.secondary_button_label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function SystemStateScreen({
  route,
  navigation,
  type: propType,
  onRetry: propOnRetry,
}: SystemStateProps) {
  const { city, area, user } = useAuth();
  const stateType: SystemStateType = propType || route?.params?.type || 'offline';
  const areaName =
    route?.params?.areaName?.trim() || area?.trim() || 'this area';
  const cityName = route?.params?.cityName?.trim() || city?.trim() || '';
  const onRetry = propOnRetry || route?.params?.onRetry;

  const [screenConfig, setScreenConfig] = useState<SystemStatesScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchSystemStatesScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig]),
  );

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    if (navigation?.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation?.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  const handleNotifyMe = async () => {
    if (!screenConfig) return;
    const unserviceable = screenConfig.unserviceable;
    if (!cityName || !areaName || areaName === 'this area') {
      Alert.alert(unserviceable.notify_error_message);
      return;
    }

    setNotifyLoading(true);
    const result = await submitAreaNotifyRequest(cityName, areaName, user?.mobile);
    setNotifyLoading(false);

    if (result.success) {
      Alert.alert('', unserviceable.notify_success_message);
    } else {
      Alert.alert(result.error || unserviceable.notify_error_message);
    }
  };

  const handleChangeArea = () => {
    navigation?.navigate('CitySelection');
  };

  const handleGoHome = () => {
    navigation?.reset({ index: 0, routes: [{ name: 'Shop' }] });
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadConfig()}>
            <ActivityIndicator color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const unserviceableConfig: SystemStateVariantConfig = {
    ...screenConfig.unserviceable,
    subtitle: screenConfig.unserviceable.subtitle_template
      ? formatSystemStateTemplate(screenConfig.unserviceable.subtitle_template, {
          area: areaName,
          city: cityName,
        })
      : screenConfig.unserviceable.subtitle,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topSpace} />
      <View style={styles.contentWrap}>
        {stateType === 'offline' ? (
          <StateView
            config={screenConfig.offline}
            iconCircleStyle={styles.mintCircle}
            icon={<SystemStateOfflineIcon size={SYSTEM_STATE_ICON_SIZES.offline} />}
            onPrimary={handleRetry}
          />
        ) : null}

        {stateType === 'unserviceable' ? (
          <StateView
            config={unserviceableConfig}
            iconCircleStyle={styles.peachCircle}
            icon={<SystemStateUnserviceableIcon size={SYSTEM_STATE_ICON_SIZES.unserviceable} />}
            onPrimary={handleNotifyMe}
            onSecondary={handleChangeArea}
            primaryLoading={notifyLoading}
          />
        ) : null}

        {stateType === 'error' ? (
          <StateView
            config={screenConfig.error}
            iconCircleStyle={styles.errorCircle}
            icon={<SystemStateErrorIcon size={SYSTEM_STATE_ICON_SIZES.error} />}
            onPrimary={handleRetry}
            onSecondary={handleGoHome}
          />
        ) : null}

        {stateType === 'maintenance' ? (
          <StateView
            config={screenConfig.maintenance}
            iconCircleStyle={styles.mintCircle}
            icon={<SystemStateMaintenanceIcon size={SYSTEM_STATE_ICON_SIZES.maintenance} />}
            onPrimary={handleRetry}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  peachCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.marigold100,
    borderWidth: 1.5,
    borderColor: COLORS.marigold200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  headline: {
    ...FONTS.balooBold,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
    maxWidth: 310,
  },
  primaryBtn: {
    width: 250,
    alignSelf: 'center',
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  secondaryLinkBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryLinkText: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.green700,
  },
});
