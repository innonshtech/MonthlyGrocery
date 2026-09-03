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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AppLoader from '../components/AppLoader';
import {
  OnboardingBackButton,
  OnboardingRadio,
  OnboardingSectionLabel,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import {
  OnboardingAreaPinIcon,
  OnboardingAreaPinLargeIcon,
  OnboardingSearchIcon,
} from '../components/onboarding/OnboardingFigmaIcons';
import { useOnboardingLayout } from '../components/onboarding/onboardingLayout';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import {
  fetchAreasForCity,
  submitAreaNotifyRequest,
  CityArea,
} from '../services/areasApi';
import {
  AreaSelectionConfig,
  fetchOnboardingConfig,
} from '../services/onboardingApi';

function formatUnserviceableSubtitle(
  template: string,
  area: string,
  city: string,
): string {
  return template.replace('{area}', area).replace('{city}', city);
}

/**
 * A6 · Area Selection — Redesign (Figma node 409:617)
 * Areas from /api/admin/locations; copy from /api/admin/onboarding.
 */
export default function AreaSelectionScreen({ route, navigation }: any) {
  const { setCityAndArea, user } = useAuth();
  const cityName = route.params?.cityName?.trim() || '';
  const { bottomPadding } = useOnboardingLayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areas, setAreas] = useState<CityArea[]>([]);
  const [config, setConfig] = useState<AreaSelectionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [missingCity, setMissingCity] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setMissingCity(false);

    const onboarding = await fetchOnboardingConfig();
    const areaConfig = onboarding?.area_selection ?? null;
    setConfig(areaConfig);

    if (!cityName) {
      setMissingCity(true);
      setAreas([]);
      setLoading(false);
      return;
    }

    const list = await fetchAreasForCity(cityName);
    setAreas(list);
    setLoadError(!areaConfig || list.length === 0);
    setLoading(false);
  }, [cityName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAreaSelect = async (area: CityArea) => {
    if (!area.serviceable) return;
    setSelectedAreaId(area.id);
    await setCityAndArea(cityName, area.name, area.pincode || null);
    navigation.navigate('ProfileSetup');
  };

  const handleNotifyMe = async () => {
    if (!config || !searchQuery.trim()) return;
    setNotifyLoading(true);
    const res = await submitAreaNotifyRequest(
      cityName,
      searchQuery.trim(),
      user?.mobile,
    );
    setNotifyLoading(false);
    if (res.success) {
      Alert.alert('', config.notify_success_message);
      setSearchQuery('');
    } else {
      Alert.alert('Error', res.error || config?.notify_error_message || '');
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.pincode.includes(searchQuery.trim()),
  );

  const isUnserviceableSearch =
    searchQuery.trim().length > 0 && filteredAreas.length === 0;

  if (missingCity) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorTitle}>
          {config?.missing_city_message || 'Please choose a city first.'}
        </Text>
        <OnboardingPrimaryButton
          label={config?.choose_city_button_label || 'Choose city'}
          onPress={() => navigation.navigate('CitySelection')}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <AppLoader message="Loading areas..." />
      </SafeAreaView>
    );
  }

  if (loadError || !config) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorTitle}>
          {config?.load_error_message || 'Could not load areas.'}
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
          if (isUnserviceableSearch) setSearchQuery('');
          else if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      {!isUnserviceableSearch ? (
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.mainTitle}>{config.title}</Text>
            <View style={styles.servingRow}>
              <OnboardingAreaPinIcon size={15} color={COLORS.green700} />
              <Text style={styles.servingText}>
                {config.serving_prefix} {cityName}
              </Text>
              <Text style={styles.dotSep}>·</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CitySelection')}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.changeLink}>{config.change_label}</Text>
              </TouchableOpacity>
            </View>
          </View>

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
            data={filteredAreas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selectedAreaId === item.id;
              const subtitle = item.serviceable
                ? item.pincode
                  ? `${config.serviceable_subtitle} · PIN ${item.pincode}`
                  : config.serviceable_subtitle
                : config.coming_soon_subtitle;
              return (
                <TouchableOpacity
                  style={[styles.rowCard, !item.serviceable && styles.rowDisabled]}
                  onPress={() => handleAreaSelect(item)}
                  activeOpacity={item.serviceable ? 0.7 : 1}
                  disabled={!item.serviceable}
                >
                  <View style={styles.rowIcon}>
                    <OnboardingAreaPinIcon size={18} color={COLORS.green700} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text
                      style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                  </View>
                  {item.serviceable ? (
                    <OnboardingRadio selected={isSelected} />
                  ) : (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>
                        {config.coming_soon_badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : (
        <View style={styles.unserviceableWrap}>
          <View style={styles.searchCard}>
            <OnboardingSearchIcon size={18} color={COLORS.ink300} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.unserviceableCenter}>
            <View style={styles.peachCircle}>
              <OnboardingAreaPinLargeIcon size={48} color={COLORS.marigold600} />
            </View>
            <Text style={styles.unserviceableTitle}>{config.unserviceable_title}</Text>
            <Text style={styles.unserviceableSubtitle}>
              {formatUnserviceableSubtitle(
                config.unserviceable_subtitle_template,
                searchQuery.trim(),
                cityName,
              )}
            </Text>
            <View style={styles.areaChip}>
              <OnboardingAreaPinIcon size={14} color={COLORS.ink700} />
              <Text style={styles.areaChipText}>
                {searchQuery.trim()}, {cityName}
              </Text>
            </View>
          </View>

          <View style={[styles.unserviceableBottom, { paddingBottom: bottomPadding }]}>
            <OnboardingPrimaryButton
              label={config.notify_button_label}
              onPress={handleNotifyMe}
              loading={notifyLoading}
            />
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.chooseDiffText}>{config.choose_different_label}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    gap: 8,
  },
  mainTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  servingText: {
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: COLORS.ink500,
    lineHeight: 24,
  },
  dotSep: {
    fontSize: 15,
    color: COLORS.ink500,
  },
  changeLink: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 65,
    marginBottom: 8,
  },
  rowDisabled: { opacity: 0.85 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTextCol: { flex: 1 },
  rowTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  rowTitleSelected: { color: COLORS.green700 },
  rowSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
    marginTop: 1,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    color: COLORS.ink500,
  },
  unserviceableWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  unserviceableCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  peachCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.marigold100,
    borderWidth: 1.5,
    borderColor: COLORS.marigold200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  unserviceableTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  unserviceableSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 318,
    marginBottom: 16,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  areaChipText: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink700,
  },
  unserviceableBottom: {
    gap: 16,
    alignItems: 'center',
    paddingTop: 12,
  },
  chooseDiffText: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.green700,
    paddingVertical: 8,
  },
});
