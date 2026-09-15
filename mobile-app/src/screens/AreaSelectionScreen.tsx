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
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
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
import { reverseGeocodeLocation } from '../services/addressApi';

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
  const { setCityAndArea, user, token, city: currentCity, area: currentArea } = useAuth();
  const { items, clearCart } = useCart();
  const { showToast } = useToast();
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
  const [gpsLocating, setGpsLocating] = useState(false);

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
    setLoadError(!areaConfig);
    setLoading(false);
  }, [cityName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUseCurrentGps = async () => {
    setGpsLocating(true);
    try {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'MonthlyGrocery needs your location to find nearby serviceable areas and stores.',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            showToast({
              type: 'error',
              title: 'Permission Denied',
              message: 'Location permission was denied. You can search by area name or pincode.',
            });
            setGpsLocating(false);
            return;
          }
        } catch {
          // Continue if permission dialog fails
        }
      }

      const nav = (globalThis as any)?.navigator;
      if (nav && nav.geolocation && typeof nav.geolocation.getCurrentPosition === 'function') {
        nav.geolocation.getCurrentPosition(
          async (pos: any) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const details = await reverseGeocodeLocation(lat, lng);
            if (details) {
              if (details.pincode) {
                setSearchQuery(details.pincode);
                showToast({
                  type: 'success',
                  title: 'Location Detected',
                  message: `Found PIN ${details.pincode}${details.area ? ` (${details.area})` : ''}. Showing areas & stores nearby!`,
                });
              } else if (details.area) {
                setSearchQuery(details.area);
                showToast({
                  type: 'success',
                  title: 'Location Detected',
                  message: `Found ${details.area}. Showing nearby areas!`,
                });
              }
            } else {
              showToast({
                type: 'info',
                title: 'Location Found',
                message: 'Could not resolve exact pincode. Please search your area or pincode.',
              });
            }
            setGpsLocating(false);
          },
          async (err: any) => {
            console.warn('GPS error in AreaSelection, trying fallback:', err?.message);
            // Fallback: check city or first available area
            if (areas.length > 0) {
              const firstWithPin = areas.find((a) => a.pincode);
              if (firstWithPin?.pincode) {
                setSearchQuery(firstWithPin.pincode);
                showToast({
                  type: 'info',
                  title: 'Default Location',
                  message: `Showing areas in ${cityName} (PIN ${firstWithPin.pincode}).`,
                });
              }
            } else {
              showToast({
                type: 'info',
                title: 'Search Location',
                message: 'GPS unavailable. Please search by area name or 6-digit pincode.',
              });
            }
            setGpsLocating(false);
          },
          { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
        );
      } else {
        if (areas.length > 0 && areas[0].pincode) {
          setSearchQuery(areas[0].pincode);
        }
        showToast({
          type: 'info',
          title: 'Search Location',
          message: 'GPS is not available on this device. Showing all areas.',
        });
        setGpsLocating(false);
      }
    } catch {
      setGpsLocating(false);
    }
  };

  const handleAreaSelect = async (area: CityArea) => {
    if (!area.serviceable) return;
    const isDifferentArea = Boolean(
      (currentCity && currentCity.toLowerCase() !== cityName.toLowerCase()) ||
      (currentArea && currentArea.toLowerCase() !== area.name.toLowerCase()),
    );

    setSelectedAreaId(area.id);

    if (items.length > 0 && isDifferentArea) {
      clearCart();
      showToast({
        type: 'info',
        title: 'Area Changed',
        message: 'Your area was updated and cart refreshed for this location.',
      });
    }

    await setCityAndArea(cityName, area.name, area.pincode || null);
    if (token && user?.name) {
      navigation.navigate('Shop');
    } else {
      navigation.navigate('ProfileSetup');
    }
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
      showToast({
        type: 'success',
        title: 'Notification Set',
        message: config.notify_success_message || 'We will notify you once we launch in your area!',
      });
      setSearchQuery('');
    } else {
      showToast({
        type: 'error',
        title: 'Error',
        message: res.error || config?.notify_error_message || 'Could not save notification request.',
      });
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.pincode && a.pincode.includes(searchQuery.trim())),
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
              placeholder={config.search_placeholder || 'Search area or 6-digit pincode...'}
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

          <TouchableOpacity
            style={[styles.gpsButton, gpsLocating && styles.gpsButtonLoading]}
            onPress={handleUseCurrentGps}
            disabled={gpsLocating}
            activeOpacity={0.7}
          >
            {gpsLocating ? (
              <ActivityIndicator size="small" color={COLORS.green700} />
            ) : (
              <View style={styles.gpsIconCircle}>
                <OnboardingAreaPinIcon size={16} color={COLORS.green700} />
              </View>
            )}
            <View style={styles.gpsTextCol}>
              <Text style={styles.gpsTitle}>
                {gpsLocating ? 'Detecting current location...' : 'Use my current location (GPS)'}
              </Text>
              <Text style={styles.gpsSubtitle}>
                Auto-detect Pincode & nearby grocery stores
              </Text>
            </View>
          </TouchableOpacity>

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
                    <View style={styles.areaTitleRow}>
                      <Text
                        style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}
                      >
                        {item.name}
                      </Text>
                      {item.pincode ? (
                        <View style={styles.pinPill}>
                          <Text style={styles.pinPillText}>{item.pincode}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                    {item.serviceable && item.shop_name ? (
                      <View style={styles.shopBadgeRow}>
                        <Text style={styles.shopBadgeIcon}>🏪</Text>
                        <Text style={styles.shopBadgeText} numberOfLines={1}>
                          {item.shop_name}
                          {item.shop_count && item.shop_count > 1 ? ` (+${item.shop_count - 1} more)` : ''}
                        </Text>
                      </View>
                    ) : item.serviceable ? (
                      <View style={styles.shopBadgeRow}>
                        <Text style={styles.shopBadgeIcon}>🏪</Text>
                        <Text style={styles.shopBadgeText}>Delivering in this PIN</Text>
                      </View>
                    ) : null}
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
    marginBottom: 10,
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
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 12,
  },
  gpsButtonLoading: {
    opacity: 0.8,
  },
  gpsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 13.5,
    color: COLORS.green800,
  },
  gpsSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    color: COLORS.green600,
    marginTop: 1,
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
    paddingVertical: 12,
    minHeight: 68,
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
  areaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  rowTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  rowTitleSelected: { color: COLORS.green700 },
  pinPill: {
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pinPillText: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.green800,
  },
  rowSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
    marginTop: 1,
  },
  shopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  shopBadgeIcon: {
    fontSize: 11,
  },
  shopBadgeText: {
    ...FONTS.muktaMedium,
    fontSize: 11.5,
    color: COLORS.green700,
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
