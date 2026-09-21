/**
 * LocationPickerScreen — Blinkit-style delivery address picker
 *
 * Two modes:
 *  1. Live Location — GPS → reverse geocode → auto-fill street address
 *  2. Another Location — Search bar with Places Autocomplete suggestions
 *
 * After confirming, navigates to AddAddressScreen with pre-filled address data.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getCurrentCoordinates } from '../../services/locationService';
import {
  fetchPlacesAutocomplete,
  forwardGeocodeLocation,
  reverseGeocodeLocation,
} from '../../services/addressApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlaceSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface ResolvedLocation {
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 400;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LocationPickerScreen({ navigation, route }: any) {
  const { city: authCity } = useAuth();
  const activeCity = route?.params?.city || authCity || 'Pune';
  const fromCheckout = route?.params?.fromCheckout ?? false;
  const fromOnboarding = route?.params?.fromOnboarding ?? false;

  const initialMode = (route?.params?.initialMode as 'default' | 'search') || 'default';

  // State
  const [mode, setMode] = useState<'default' | 'search'>(initialMode);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsResolved, setGpsResolved] = useState<ResolvedLocation | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [resolving, setResolving] = useState(false);

  // Animation
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;
  const gpsCardOpacity = useRef(new Animated.Value(initialMode === 'search' ? 0 : 1)).current;

  // Debounce ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Input ref
  const searchRef = useRef<any>(null);

  // ── GPS Handler ─────────────────────────────────────────────────────────────
  const handleUseLiveLocation = useCallback(async () => {
    setGpsLoading(true);
    setGpsError('');
    setGpsResolved(null);
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) {
        setGpsError('Could not detect GPS. Please check location permissions or search manually.');
        setGpsLoading(false);
        return;
      }
      const geo = await reverseGeocodeLocation(coords.latitude, coords.longitude);
      if (geo) {
        setGpsResolved({ ...geo, latitude: coords.latitude, longitude: coords.longitude });
      } else {
        setGpsError('Address lookup failed. Please search manually below.');
      }
    } catch {
      setGpsError('Location detection failed. Please search manually.');
    } finally {
      setGpsLoading(false);
    }
  }, []);

  // ── Switch to search mode ───────────────────────────────────────────────────
  const switchToSearch = useCallback(() => {
    setMode('search');
    Animated.timing(gpsCardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setTimeout(() => searchRef.current?.focus(), 250);
  }, [gpsCardOpacity]);

  // Auto-start GPS on mount if default mode, or focus search if search mode
  useEffect(() => {
    if (initialMode === 'search') {
      switchToSearch();
    } else {
      handleUseLiveLocation();
    }
  }, [handleUseLiveLocation, switchToSearch, initialMode]);

  // ── Autocomplete ────────────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (text.trim().length < 2) {
        setSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }
      setSuggestionsLoading(true);
      const results = await fetchPlacesAutocomplete(text.trim(), activeCity);
      setSuggestions(results);
      setSuggestionsLoading(false);
      Animated.timing(suggestionsOpacity, {
        toValue: results.length > 0 ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [suggestionsOpacity, activeCity],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchSuggestions(text), DEBOUNCE_MS);
    },
    [fetchSuggestions],
  );

  // ── Suggestion selected ─────────────────────────────────────────────────────
  const handleSuggestionSelect = useCallback(
    async (item: PlaceSuggestion) => {
      Keyboard.dismiss();
      setSearchText(item.description);
      setSuggestions([]);
      setResolving(true);
      const geo = await forwardGeocodeLocation(item.description);
      setResolving(false);
      const resolved: ResolvedLocation = {
        street: geo?.street || geo?.area || item.main_text,
        area: geo?.area || item.main_text,
        city: geo?.city || activeCity,
        district: geo?.district || geo?.city || activeCity,
        state: geo?.state || 'Maharashtra',
        pincode: geo?.pincode || '',
        formatted_address: geo?.formatted_address || item.description,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
      };
      navigateWithAddress(resolved);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, fromCheckout, fromOnboarding],
  );

  // ── GPS confirm ─────────────────────────────────────────────────────────────
  const handleConfirmGps = useCallback(() => {
    if (!gpsResolved) return;
    navigateWithAddress({
      ...gpsResolved,
      street: gpsResolved.street || gpsResolved.formatted_address || gpsResolved.area || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsResolved]);

  // ── Navigation helper ───────────────────────────────────────────────────────
  const navigateWithAddress = (resolved: ResolvedLocation) => {
    navigation.navigate('AddAddress', {
      prefilled: resolved,
      fromCheckout,
      fromOnboarding,
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose delivery location</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            {/* Search icon */}
            <View style={styles.searchIconWrap}>
              <View style={styles.searchIconCircle} />
              <View style={styles.searchIconHandle} />
            </View>
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder={`Search area or street in ${activeCity}...`}
              placeholderTextColor={COLORS.ink300}
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={switchToSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {suggestionsLoading && (
              <ActivityIndicator size="small" color={COLORS.green700} />
            )}
            {searchText.length > 0 && !suggestionsLoading && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText('');
                  setSuggestions([]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearBtn}>{'✕'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.cityScopePill}>
            <Text style={styles.cityScopePillText}>📍 Showing results in {activeCity}</Text>
          </View>
        </View>

        {/* Autocomplete Suggestions */}
        {mode === 'search' && suggestions.length > 0 && (
          <Animated.View style={[styles.suggestionsContainer, { opacity: suggestionsOpacity }]}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, i) => item.place_id || String(i)}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.suggestionDivider} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionRow}
                  onPress={() => handleSuggestionSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionPin}>
                    <View style={styles.suggestionPinDot} />
                    <View style={styles.suggestionPinStem} />
                  </View>
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionMain} numberOfLines={1}>
                      {item.main_text || item.description}
                    </Text>
                    {item.secondary_text ? (
                      <Text style={styles.suggestionSub} numberOfLines={1}>
                        {item.secondary_text}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}

        {/* Resolving spinner */}
        {resolving && (
          <View style={styles.resolvingRow}>
            <ActivityIndicator size="small" color={COLORS.green700} />
            <Text style={styles.resolvingText}>Getting location details...</Text>
          </View>
        )}

        {/* Default mode: GPS card + divider + Another location */}
        {mode === 'default' && (
          <Animated.View style={[styles.defaultContent, { opacity: gpsCardOpacity }]}>
            {/* GPS Card */}
            <View style={styles.gpsCard}>
              <View style={styles.gpsLiveDot}>
                <View style={styles.gpsLiveDotInner} />
              </View>
              <View style={styles.gpsCardBody}>
                <Text style={styles.gpsCardTitle}>{'📍  Use my current location'}</Text>
                {gpsLoading ? (
                  <View style={styles.gpsLoadingRow}>
                    <ActivityIndicator size="small" color={COLORS.green700} />
                    <Text style={styles.gpsLoadingText}>Detecting your location...</Text>
                  </View>
                ) : gpsResolved ? (
                  <>
                    <Text style={styles.gpsStreet} numberOfLines={2}>
                      {gpsResolved.street || gpsResolved.formatted_address || gpsResolved.area}
                    </Text>
                    {(gpsResolved.area || gpsResolved.city) && (
                      <Text style={styles.gpsArea} numberOfLines={1}>
                        {[gpsResolved.area, gpsResolved.city, gpsResolved.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.confirmGpsBtn}
                      onPress={handleConfirmGps}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.confirmGpsBtnText}>Confirm this location →</Text>
                    </TouchableOpacity>
                  </>
                ) : gpsError ? (
                  <>
                    <Text style={styles.gpsErrorText}>{gpsError}</Text>
                    <TouchableOpacity onPress={handleUseLiveLocation} style={styles.retryBtn}>
                      <Text style={styles.retryBtnText}>Retry GPS</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>

            {/* OR Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            {/* Another Location CTA */}
            <TouchableOpacity
              style={styles.anotherLocationBtn}
              onPress={switchToSearch}
              activeOpacity={0.85}
            >
              <View style={styles.anotherLocationIconWrap}>
                <Text style={styles.anotherLocationIcon}>🔍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.anotherLocationTitle}>Enter another location</Text>
                <Text style={styles.anotherLocationSub}>
                  Order for a different address or city
                </Text>
              </View>
              <Text style={styles.anotherArrow}>{'›'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Search mode empty state */}
        {mode === 'search' &&
          !suggestionsLoading &&
          suggestions.length === 0 &&
          searchText.length > 1 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateSub}>
                Try a different area name, street or pincode.
              </Text>
            </View>
          )}

        {/* Search mode hint (nothing typed yet) */}
        {mode === 'search' && searchText.length === 0 && (
          <View style={styles.searchHintWrap}>
            <Text style={styles.searchHintTitle}>Search your delivery location</Text>
            <Text style={styles.searchHintSub}>
              Type area name, locality, street or 6-digit pincode
            </Text>
            {/* Quick: use GPS result if available */}
            {gpsResolved && (
              <TouchableOpacity
                style={styles.quickSuggestion}
                onPress={handleConfirmGps}
                activeOpacity={0.8}
              >
                <View style={styles.quickDot}>
                  <View style={styles.quickDotInner} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickLabel}>Current location</Text>
                  <Text style={styles.quickValue} numberOfLines={1}>
                    {gpsResolved.street || gpsResolved.area || gpsResolved.formatted_address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.paper },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  backBtn: { marginRight: 12 },
  backArrow: { fontSize: 22, color: COLORS.ink700, lineHeight: 28 },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
    letterSpacing: -0.2,
  },

  // Search bar
  searchBarWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIconWrap: { alignItems: 'center', justifyContent: 'center', width: 18, height: 18 },
  searchIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.ink400,
  },
  searchIconHandle: {
    width: 2,
    height: 5,
    backgroundColor: COLORS.ink400,
    marginTop: 1,
    marginLeft: 6,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: COLORS.ink900,
    padding: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  clearBtn: { fontSize: 14, color: COLORS.ink300, fontWeight: 'bold' },

  // Suggestions
  suggestionsContainer: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    maxHeight: 340,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  suggestionPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionPinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green700,
  },
  suggestionPinStem: {
    width: 2,
    height: 4,
    backgroundColor: COLORS.green700,
    marginTop: 1,
  },
  suggestionText: { flex: 1 },
  suggestionMain: { ...FONTS.muktaSemiBold, fontSize: 14, color: COLORS.ink900 },
  suggestionSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1,
  },
  suggestionDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginLeft: 58,
  },

  // Resolving
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resolvingText: { ...FONTS.muktaRegular, fontSize: 13, color: COLORS.ink500 },

  // Default content
  defaultContent: { flex: 1 },

  // GPS Card
  gpsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green100,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 14,
  },
  gpsLiveDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.green100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  gpsLiveDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green700,
  },
  gpsCardBody: { flex: 1 },
  gpsCardTitle: { ...FONTS.muktaSemiBold, fontSize: 14, color: COLORS.green800, marginBottom: 8 },
  gpsLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsLoadingText: { ...FONTS.muktaRegular, fontSize: 13, color: COLORS.green600 },
  gpsStreet: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  gpsArea: { ...FONTS.muktaRegular, fontSize: 12, color: COLORS.ink500, marginTop: 2 },
  confirmGpsBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  confirmGpsBtnText: { ...FONTS.muktaSemiBold, fontSize: 13, color: '#fff' },
  gpsErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: '#C0392B',
    lineHeight: 18,
  },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start' },
  retryBtnText: { ...FONTS.muktaSemiBold, fontSize: 13, color: COLORS.green700 },

  // OR divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 10,
  },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.line },
  orText: { ...FONTS.muktaRegular, fontSize: 13, color: COLORS.ink300 },

  // Another Location
  anotherLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  anotherLocationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherLocationIcon: { fontSize: 20 },
  anotherLocationTitle: { ...FONTS.muktaSemiBold, fontSize: 14, color: COLORS.ink900 },
  anotherLocationSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 2,
  },
  anotherArrow: { fontSize: 24, color: COLORS.ink400 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyStateIcon: { fontSize: 40, marginBottom: 12 },
  emptyStateTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 16,
    color: COLORS.ink700,
    marginBottom: 6,
  },
  emptyStateSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Search hint
  searchHintWrap: { paddingHorizontal: 20, paddingTop: 8 },
  searchHintTitle: {
    ...FONTS.muktaSemiBold,
    fontSize: 15,
    color: COLORS.ink700,
    marginBottom: 4,
  },
  searchHintSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink400,
    lineHeight: 18,
    marginBottom: 20,
  },
  quickSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  quickDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green700 },
  quickLabel: { ...FONTS.muktaSemiBold, fontSize: 13, color: COLORS.green700 },
  quickValue: { ...FONTS.muktaRegular, fontSize: 12, color: COLORS.ink600, marginTop: 1 },
  cityScopePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cityScopePillText: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#1E7A46',
  },
});
