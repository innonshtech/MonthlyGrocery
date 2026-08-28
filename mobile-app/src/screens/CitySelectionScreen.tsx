import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AppLoader from '../components/AppLoader';
import {
  OnboardingBackButton,
  OnboardingPrimaryButton,
  OnboardingRadio,
  OnboardingSectionLabel,
} from '../components/onboarding/OnboardingUI';
import {
  OnboardingChevronRightIcon,
  OnboardingCityIcon,
  OnboardingSearchIcon,
} from '../components/onboarding/OnboardingFigmaIcons';
import { useOnboardingLayout } from '../components/onboarding/onboardingLayout';
import { COLORS, FONTS } from '../constants/theme';
import { fetchServiceableCities, ServiceableCity } from '../services/citiesApi';
import {
  CitySelectionConfig,
  fetchOnboardingConfig,
} from '../services/onboardingApi';

/**
 * A5 · City Selection — Redesign (Figma node 408:612)
 * Cities from /api/admin/cities filtered by serviceable /api/admin/locations.
 */
export default function CitySelectionScreen({ navigation }: any) {
  const { setCityAndArea } = useAuth();
  const { bottomPadding } = useOnboardingLayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<ServiceableCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [config, setConfig] = useState<CitySelectionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [detectMessage, setDetectMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setDetectMessage('');

    const onboarding = await fetchOnboardingConfig();
    const cityConfig = onboarding?.city_selection ?? null;
    setConfig(cityConfig);

    const list = await fetchServiceableCities();
    setCities(list);
    setLoadError(!cityConfig || list.length === 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCitySelect = async (cityName: string) => {
    setSelectedCity(cityName);
    setDetectMessage('');
    await setCityAndArea(cityName, null);
    navigation.navigate('AreaSelection', { cityName });
  };

  const handleDetectLocation = () => {
    if (!config) return;
    setDetectMessage(config.detect_unavailable_message);
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <AppLoader message="Loading cities..." />
      </SafeAreaView>
    );
  }

  if (loadError || !config) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorTitle}>
          {config?.load_error_message || 'Could not load cities.'}
        </Text>
        <OnboardingPrimaryButton
          label={config?.retry_label || 'Retry'}
          onPress={loadData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <OnboardingBackButton
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      <View style={styles.headerBlock}>
        <Text style={styles.mainTitle}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      </View>

      <TouchableOpacity
        style={styles.locationCard}
        onPress={handleDetectLocation}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.locationTextCol}>
          <Text style={styles.locationTitle}>{config.detect_title}</Text>
          <Text style={styles.locationSubtitle}>{config.detect_subtitle}</Text>
        </View>
        <OnboardingChevronRightIcon size={20} color={COLORS.green700} />
      </TouchableOpacity>

      {detectMessage ? (
        <Text style={styles.detectMessage}>{detectMessage}</Text>
      ) : null}

      <View style={styles.searchCard}>
        <OnboardingSearchIcon size={18} color={COLORS.ink300} />
        <TextInput
          style={styles.searchInput}
          placeholder={config.search_placeholder}
          placeholderTextColor={COLORS.ink300}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <OnboardingSectionLabel label={config.section_label} />

      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected =
            selectedCity?.toLowerCase() === item.name.toLowerCase();
          return (
            <TouchableOpacity
              style={[styles.rowCard, isSelected && styles.rowCardSelected]}
              onPress={() => handleCitySelect(item.name)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.rowIcon,
                  isSelected ? styles.rowIconSelected : styles.rowIconDefault,
                ]}
              >
                <OnboardingCityIcon
                  size={19}
                  color={isSelected ? COLORS.green700 : COLORS.ink700}
                />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                {item.region ? (
                  <Text style={styles.rowSubtitle}>{item.region}</Text>
                ) : null}
              </View>
              <OnboardingRadio selected={isSelected} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{config.empty_search_message}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerBlock: {
    marginTop: 16,
    marginBottom: 16,
    gap: 6,
  },
  mainTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
  },
  subtitle: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink500,
    lineHeight: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E4F3EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  locationTextCol: { flex: 1, paddingRight: 12 },
  locationTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.green700,
    lineHeight: 20,
  },
  locationSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink700,
    lineHeight: 16,
    marginTop: 1,
  },
  detectMessage: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
    marginBottom: 12,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: COLORS.ink900,
    padding: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  clearSearchText: {
    fontSize: 14,
    color: COLORS.ink300,
    fontWeight: 'bold',
  },
  list: { gap: 0 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    minHeight: 65,
  },
  rowCardSelected: {
    backgroundColor: '#F2F9F5',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowIconSelected: {
    backgroundColor: '#E4F3EA',
  },
  rowIconDefault: {
    backgroundColor: '#F4F3EE',
  },
  rowTextCol: { flex: 1 },
  rowTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  rowSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
    marginTop: 1,
  },
  emptyText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
