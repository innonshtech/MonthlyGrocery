import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
  StatusBar,
  TextInput,
  FlatList,
  Keyboard,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '../config/api';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import {
  reverseGeocodeLocation,
  fetchPlacesAutocomplete,
  forwardGeocodeLocation,
} from '../services/addressApi';
import { getCurrentCoordinates } from '../services/locationService';
import AppIcon from './AppIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_LAT_DELTA = 0.0035;
const DEFAULT_LNG_DELTA = 0.0035;

// Authentic Blinkit / Swiggy rich daylight map styling (warm cream land, clear white roads with borders, green parks, blue rivers)
const LIGHT_MAP_STYLE = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f4f1ea' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#eee9e0' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#e8e4dc' }],
  },
  {
    featureType: 'landscape.natural.landcover',
    elementType: 'geometry',
    stylers: [{ color: '#e8e4dc' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#dcd5c7' }, { weight: 1 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#ffdc73' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#f59e0b' }, { weight: 1.2 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d5cec0' }, { weight: 1 }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e4ded4' }, { weight: 0.8 }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eae5db' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#c7e8c8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2e7d32' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a0d6f2' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284c7' }],
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e4ded4' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1e293b' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 3 }],
  },
];

interface LocationMapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  streetOrArea?: string;
  city?: string;
  detectingLocation: boolean;
  onUseCurrentLocation: () => void;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    formatted_address?: string;
  }) => void;
}

export default function LocationMapPreview({
  latitude,
  longitude,
  streetOrArea,
  city = 'Pune',
  detectingLocation,
  onUseCurrentLocation,
  onLocationChange,
}: LocationMapPreviewProps) {
  const initialLat = latitude ?? 18.5204;
  const initialLng = longitude ?? 73.8567;

  // Selected coordinates
  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [currentDelta, setCurrentDelta] = useState({
    latitudeDelta: DEFAULT_LAT_DELTA,
    longitudeDelta: DEFAULT_LNG_DELTA,
  });

  // Map references
  const fullMapRef = useRef<MapView | null>(null);
  const compactMapRef = useRef<MapView | null>(null);

  // Full Screen Modal State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullStreet, setFullStreet] = useState(streetOrArea || 'Locating address...');
  const [fullSubtitle, setFullSubtitle] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Search State in Full Screen
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounce = useRef<any>(null);

  // Pin Lift / Bounce Animation
  const pinAnim = useRef(new Animated.Value(0)).current;
  const geocodeTimer = useRef<any>(null);

  // Sync with incoming props
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
      compactMapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: DEFAULT_LAT_DELTA,
          longitudeDelta: DEFAULT_LNG_DELTA,
        },
        500
      );
    }
    if (streetOrArea) {
      setFullStreet(streetOrArea);
    }
  }, [latitude, longitude, streetOrArea]);

  // Lift pin when user starts dragging
  const handleRegionChangeStart = () => {
    setIsDragging(true);
    Animated.timing(pinAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  // Drop pin and reverse geocode when user finishes dragging
  const handleRegionChangeComplete = (region: Region) => {
    setIsDragging(false);
    setCurrentLat(region.latitude);
    setCurrentLng(region.longitude);
    setCurrentDelta({
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });

    // Bounce pin back down
    Animated.spring(pinAnim, {
      toValue: 0,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Debounced reverse geocoding
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const geo = await reverseGeocodeLocation(region.latitude, region.longitude);
        setIsGeocoding(false);
        if (geo) {
          const mainTitle = geo.street || geo.area || geo.formatted_address || 'Selected Location';
          const subTitle = [geo.area, geo.city, geo.pincode].filter(Boolean).join(', ');
          setFullStreet(mainTitle);
          setFullSubtitle(subTitle);
          onLocationChange?.({
            latitude: region.latitude,
            longitude: region.longitude,
            street: geo.street || geo.area,
            area: geo.area,
            city: geo.city,
            state: geo.state,
            pincode: geo.pincode,
            formatted_address: geo.formatted_address,
          });
        }
      } catch {
        setIsGeocoding(false);
      }
    }, 400);
  };

  // Handle GPS detection in full screen
  const handleGpsInFullScreen = async () => {
    setLocatingGps(true);
    // Animate pin jump
    Animated.sequence([
      Animated.timing(pinAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(pinAnim, { toValue: 0, friction: 3, tension: 70, useNativeDriver: true }),
    ]).start();

    try {
      const coords = await getCurrentCoordinates();
      if (coords) {
        setCurrentLat(coords.latitude);
        setCurrentLng(coords.longitude);

        fullMapRef.current?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: DEFAULT_LAT_DELTA,
            longitudeDelta: DEFAULT_LNG_DELTA,
          },
          600
        );

        setIsGeocoding(true);
        const geo = await reverseGeocodeLocation(coords.latitude, coords.longitude);
        setIsGeocoding(false);
        if (geo) {
          const mainTitle = geo.street || geo.area || geo.formatted_address || 'Current Location';
          const subTitle = [geo.area, geo.city, geo.pincode].filter(Boolean).join(', ');
          setFullStreet(mainTitle);
          setFullSubtitle(subTitle);
          onLocationChange?.({
            latitude: coords.latitude,
            longitude: coords.longitude,
            street: geo.street || geo.area,
            area: geo.area,
            city: geo.city,
            state: geo.state,
            pincode: geo.pincode,
            formatted_address: geo.formatted_address,
          });
        }
      }
    } catch {
      setIsGeocoding(false);
    } finally {
      setLocatingGps(false);
    }
  };

  // Search autocomplete in full screen
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      const res = await fetchPlacesAutocomplete(text.trim(), city);
      setSuggestions(res);
      setSearchLoading(false);
    }, 350);
  };

  // On place suggestion select
  const handleSelectSuggestion = async (item: any) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setSuggestions([]);
    setIsGeocoding(true);
    const geo = await forwardGeocodeLocation(item.description);
    setIsGeocoding(false);

    if (geo && geo.latitude != null && geo.longitude != null) {
      setCurrentLat(geo.latitude);
      setCurrentLng(geo.longitude);
      const mainTitle = geo.street || geo.area || item.main_text;
      const subTitle = [geo.area, geo.city, geo.pincode].filter(Boolean).join(', ');
      setFullStreet(mainTitle);
      setFullSubtitle(subTitle);

      fullMapRef.current?.animateToRegion(
        {
          latitude: geo.latitude,
          longitude: geo.longitude,
          latitudeDelta: DEFAULT_LAT_DELTA,
          longitudeDelta: DEFAULT_LNG_DELTA,
        },
        600
      );

      // Animate pin drop
      Animated.sequence([
        Animated.timing(pinAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(pinAnim, { toValue: 0, friction: 3, tension: 70, useNativeDriver: true }),
      ]).start();

      onLocationChange?.({
        latitude: geo.latitude,
        longitude: geo.longitude,
        street: geo.street || geo.area || item.main_text,
        area: geo.area || item.main_text,
        city: geo.city || city,
        state: geo.state,
        pincode: geo.pincode,
        formatted_address: geo.formatted_address || item.description,
      });
    }
  };

  // Zoom In (+)
  const handleZoomIn = () => {
    const nextLatDelta = Math.max(currentDelta.latitudeDelta / 2, 0.0008);
    const nextLngDelta = Math.max(currentDelta.longitudeDelta / 2, 0.0008);
    setCurrentDelta({ latitudeDelta: nextLatDelta, longitudeDelta: nextLngDelta });
    fullMapRef.current?.animateToRegion(
      {
        latitude: currentLat,
        longitude: currentLng,
        latitudeDelta: nextLatDelta,
        longitudeDelta: nextLngDelta,
      },
      300
    );
  };

  // Zoom Out (−)
  const handleZoomOut = () => {
    const nextLatDelta = Math.min(currentDelta.latitudeDelta * 2, 0.08);
    const nextLngDelta = Math.min(currentDelta.longitudeDelta * 2, 0.08);
    setCurrentDelta({ latitudeDelta: nextLatDelta, longitudeDelta: nextLngDelta });
    fullMapRef.current?.animateToRegion(
      {
        latitude: currentLat,
        longitude: currentLng,
        latitudeDelta: nextLatDelta,
        longitudeDelta: nextLngDelta,
      },
      300
    );
  };

  // Confirm and close full screen
  const handleConfirmFullScreen = () => {
    setIsFullScreen(false);
  };

  // Pin animation values
  const pinTranslateY = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const pinScale = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const shadowScale = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
  });
  const shadowOpacity = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.12],
  });

  return (
    <>
      {/* ─── Compact Map Preview (Inside AddAddressScreen) ─── */}
      <TouchableOpacity
        style={styles.previewContainer}
        onPress={() => setIsFullScreen(true)}
        activeOpacity={0.92}
      >
        <MapView
          ref={compactMapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.compactMapView}
          mapType="standard"
          userInterfaceStyle="light"
          customMapStyle={LIGHT_MAP_STYLE}
          initialRegion={{
            latitude: currentLat,
            longitude: currentLng,
            latitudeDelta: DEFAULT_LAT_DELTA,
            longitudeDelta: DEFAULT_LNG_DELTA,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        />

        {/* Center Pin Marker on Preview (Animated on GPS / location change) */}
        <Animated.View
          style={[
            styles.centerMarkerWrap,
            {
              transform: [{ translateY: pinTranslateY }, { scale: pinScale }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.deliveringPill}>
            <Text style={styles.deliveringText}>Delivering here</Text>
            <View style={styles.deliveringArrow} />
          </View>
          <View style={styles.pinCircleOuter}>
            <View style={styles.pinCircleInner} />
          </View>
          <View style={styles.pinStem} />
          <View style={styles.pinShadow} />
        </Animated.View>

        {/* Top Left: Address / Area Badge */}
        {streetOrArea ? (
          <View style={styles.topBadge} pointerEvents="none">
            <Text style={styles.topBadgeText} numberOfLines={1}>
              📍 {streetOrArea}
            </Text>
          </View>
        ) : null}

        {/* Top Right: Full Screen Expand Button */}
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setIsFullScreen(true)}
          activeOpacity={0.8}
        >
          <AppIcon name="map-pin" size={13} color="#1E293B" />
          <Text style={styles.expandBtnText}>Expand Map</Text>
        </TouchableOpacity>

        {/* Bottom Banner: Tap to open full screen */}
        <View style={styles.bottomTapBanner} pointerEvents="none">
          <Text style={styles.bottomTapText}>👆 Tap to drag map & adjust exact location</Text>
        </View>

        {/* Bottom Right: Live GPS */}
        <TouchableOpacity
          style={styles.previewGpsBtn}
          onPress={(e) => {
            e.stopPropagation();
            Animated.sequence([
              Animated.timing(pinAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
              Animated.spring(pinAnim, { toValue: 0, friction: 3, tension: 70, useNativeDriver: true }),
            ]).start();
            onUseCurrentLocation();
          }}
          disabled={detectingLocation}
          activeOpacity={0.85}
        >
          {detectingLocation ? (
            <ActivityIndicator size="small" color="#1E7A46" />
          ) : (
            <View style={styles.recenterContent}>
              <AppIcon name="map-pin" size={13} color="#1E7A46" />
              <Text style={styles.recenterText}>Live GPS</Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      {/* ─── Full-Screen Interactive Location Picker Modal (Blinkit Style Native 60 FPS Map) ─── */}
      <Modal
        visible={isFullScreen}
        animationType="slide"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <SafeAreaView style={styles.fullModalSafe} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="dark-content" />

          {/* Full Screen Header & Search */}
          <View style={styles.fullHeader}>
            <TouchableOpacity
              style={styles.fullBackBtn}
              onPress={() => setIsFullScreen(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AppIcon name="chevron-left" size={24} color="#1E293B" />
            </TouchableOpacity>

            <View style={styles.fullSearchWrap}>
              <AppIcon name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.fullSearchInput}
                placeholder={`Search area, street or landmark in ${city}...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCorrect={false}
              />
              {searchLoading && <ActivityIndicator size="small" color="#1E7A46" />}
              {searchQuery.length > 0 && !searchLoading && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                >
                  <Text style={styles.fullSearchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Autocomplete Suggestions Popup */}
          {suggestions.length > 0 && (
            <View style={styles.fullSuggestionsCard}>
              <FlatList
                data={suggestions}
                keyExtractor={(item, i) => item.place_id || String(i)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.fullSuggestionRow}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.fullSuggestionPin}>
                      <AppIcon name="map-pin" size={16} color="#1E7A46" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fullSuggestionMain} numberOfLines={1}>
                        {item.main_text || item.description}
                      </Text>
                      {item.secondary_text ? (
                        <Text style={styles.fullSuggestionSub} numberOfLines={1}>
                          {item.secondary_text}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.fullSuggestionDiv} />}
              />
            </View>
          )}

          {/* Full Screen Interactive Map Viewport */}
          <View style={styles.fullMapContainer}>
            <MapView
              ref={fullMapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.fullMapView}
              mapType="standard"
              userInterfaceStyle="light"
              customMapStyle={LIGHT_MAP_STYLE}
              initialRegion={{
                latitude: currentLat,
                longitude: currentLng,
                latitudeDelta: DEFAULT_LAT_DELTA,
                longitudeDelta: DEFAULT_LNG_DELTA,
              }}
              onRegionChange={handleRegionChangeStart}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
            />

            {/* Center Animated Pinmark (Fixed at center, map moves smoothly under it) */}
            <View style={styles.fullCenterPinWrap} pointerEvents="none">
              <Animated.View
                style={[
                  styles.fullPinContent,
                  {
                    transform: [{ translateY: pinTranslateY }, { scale: pinScale }],
                  },
                ]}
              >
                <View style={styles.fullDeliveringPill}>
                  <Text style={styles.fullDeliveringPillText}>
                    {isDragging
                      ? '📍 Move map to doorstep'
                      : isGeocoding
                      ? '⏳ Updating address...'
                      : '📍 Order will be delivered here'}
                  </Text>
                  <View style={styles.fullDeliveringArrow} />
                </View>

                {/* Pin Circle with outer glow */}
                <View style={styles.fullPinCircleOuter}>
                  <View style={styles.fullPinCircleInner} />
                </View>
                <View style={styles.fullPinStem} />
              </Animated.View>

              {/* Pulsating ground ring */}
              <Animated.View
                style={[
                  styles.fullPinShadow,
                  {
                    opacity: shadowOpacity,
                    transform: [{ scale: shadowScale }],
                  },
                ]}
              />
            </View>

            {/* Floating Zoom In (+) / Zoom Out (-) Controls */}
            <View style={styles.fullZoomContainer}>
              <TouchableOpacity
                style={styles.fullZoomBtn}
                onPress={handleZoomIn}
                activeOpacity={0.75}
              >
                <Text style={styles.fullZoomText}>+</Text>
              </TouchableOpacity>
              <View style={styles.fullZoomDiv} />
              <TouchableOpacity
                style={styles.fullZoomBtn}
                onPress={handleZoomOut}
                activeOpacity={0.75}
              >
                <Text style={styles.fullZoomText}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Floating "Locate Me" Button */}
            <TouchableOpacity
              style={styles.fullGpsFloatingBtn}
              onPress={handleGpsInFullScreen}
              disabled={locatingGps}
              activeOpacity={0.85}
            >
              {locatingGps ? (
                <ActivityIndicator size="small" color="#1E7A46" />
              ) : (
                <>
                  <AppIcon name="map-pin" size={15} color="#1E7A46" />
                  <Text style={styles.fullGpsFloatingText}>Locate Me</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ─── Blinkit Style Bottom Delivery Location Card ─── */}
          <SafeAreaView edges={['bottom']} style={styles.fullBottomCard}>
            <View style={styles.bottomHandle} />
            <View style={styles.bottomHeaderRow}>
              <View style={styles.locationTagPill}>
                <AppIcon name="map-pin" size={13} color="#1E7A46" />
                <Text style={styles.locationTagText}>DELIVERING TO</Text>
              </View>
              {isGeocoding && <ActivityIndicator size="small" color="#1E7A46" />}
            </View>

            <Text style={styles.bottomMainStreet} numberOfLines={2}>
              {fullStreet}
            </Text>
            {fullSubtitle ? (
              <Text style={styles.bottomSubText} numberOfLines={1}>
                {fullSubtitle}
              </Text>
            ) : null}

            {/* Big Green Action Button */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmFullScreen}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Confirm Location & Enter Details →</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Compact Preview Container
  previewContainer: {
    height: 195,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F0EA',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#D0DDD4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  compactMapView: {
    width: '100%',
    height: '100%',
  },
  centerMarkerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveringPill: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
    elevation: 4,
    position: 'relative',
  },
  deliveringText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  deliveringArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#111827',
    position: 'absolute',
    bottom: -5,
  },
  pinCircleOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  pinCircleInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  pinStem: {
    width: 2,
    height: 6,
    backgroundColor: '#E11D48',
  },
  pinShadow: {
    width: 12,
    height: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -1,
  },
  topBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '55%',
    elevation: 2,
  },
  topBadgeText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11.5,
    color: '#1E293B',
  },
  expandBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 3,
  },
  expandBtnText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#1E293B',
  },
  bottomTapBanner: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  bottomTapText: {
    ...FONTS.muktaMedium,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  previewGpsBtn: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderWidth: 1,
    borderColor: '#D8E5DC',
    elevation: 3,
  },
  recenterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recenterText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#1E7A46',
  },

  // ─── Full-Screen Modal Styles ───
  fullModalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
    zIndex: 10,
  },
  fullBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullSearchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  fullSearchInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  fullSearchClear: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  fullSuggestionsCard: {
    position: 'absolute',
    top: 65,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 280,
    zIndex: 99,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  fullSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  fullSuggestionPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullSuggestionMain: {
    ...FONTS.muktaSemiBold,
    fontSize: 13.5,
    color: '#1E293B',
  },
  fullSuggestionSub: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  fullSuggestionDiv: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // Full Map Viewport
  fullMapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E8F0EA',
  },
  fullMapView: {
    width: '100%',
    height: '100%',
  },
  fullCenterPinWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPinContent: {
    alignItems: 'center',
  },
  fullDeliveringPill: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fullDeliveringPillText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  fullDeliveringArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#111827',
    position: 'absolute',
    bottom: -6,
  },
  fullPinCircleOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E11D48',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fullPinCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  fullPinStem: {
    width: 2.5,
    height: 8,
    backgroundColor: '#E11D48',
  },
  fullPinShadow: {
    width: 18,
    height: 6,
    borderRadius: 9,
    backgroundColor: '#000000',
    marginTop: -2,
  },

  // Floating controls on Full Map
  fullZoomContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 5,
    overflow: 'hidden',
    alignItems: 'center',
  },
  fullZoomBtn: {
    width: 42,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullZoomText: {
    ...FONTS.muktaBold,
    fontSize: 22,
    color: '#1E293B',
    lineHeight: 24,
  },
  fullZoomDiv: {
    width: '80%',
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // Floating GPS button on full map
  fullGpsFloatingBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#1E7A46',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fullGpsFloatingText: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#1E7A46',
  },

  // Full Screen Bottom Card
  fullBottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  bottomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF5EE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  locationTagText: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    color: '#1E7A46',
    letterSpacing: 0.5,
  },
  bottomMainStreet: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 2,
  },
  bottomSubText: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  confirmBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15.5,
    color: '#FFFFFF',
  },
});
