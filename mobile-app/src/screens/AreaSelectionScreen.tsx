import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import AppIcon from '../components/AppIcon';
import { COLORS, RADIUS } from '../constants/theme';

interface AreaItem {
  id: string;
  name: string;
  pincode: string;
  state: string;
  serviceable: boolean;
}

const DEFAULT_PUNE_AREAS: AreaItem[] = [
  { id: 'kothrud', name: 'Kothrud', pincode: '411038', state: 'Maharashtra', serviceable: true },
  { id: 'baner', name: 'Baner', pincode: '411045', state: 'Maharashtra', serviceable: true },
  { id: 'aundh', name: 'Aundh', pincode: '411007', state: 'Maharashtra', serviceable: true },
  { id: 'hinjewadi', name: 'Hinjewadi', pincode: '411057', state: 'Maharashtra', serviceable: true },
  { id: 'wakad', name: 'Wakad', pincode: '411057', state: 'Maharashtra', serviceable: true },
  { id: 'viman-nagar', name: 'Viman Nagar', pincode: '411014', state: 'Maharashtra', serviceable: true },
];

export default function AreaSelectionScreen({ route, navigation }: any) {
  const { setCityAndArea } = useAuth();
  const { cityName } = route.params || { cityName: 'Pune' };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('kothrud');
  const [areas, setAreas] = useState<AreaItem[]>(DEFAULT_PUNE_AREAS);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/locations`);
        const data = await res.json();
        if (res.ok && data.success && data.locations.length > 0) {
          const matched = data.locations.filter(
            (loc: any) => loc.city.toLowerCase() === cityName.toLowerCase()
          );
          if (matched.length > 0) {
            const mapped: AreaItem[] = matched.map((loc: any) => ({
              id: loc.id || loc.area_name.toLowerCase().replace(/\s+/g, '-'),
              name: loc.area_name,
              pincode: loc.pincode || '411001',
              state: 'Maharashtra',
              serviceable: loc.is_serviceable !== false,
            }));
            setAreas(mapped);
          }
        }
      } catch (err) {
        setAreas(DEFAULT_PUNE_AREAS);
      }
    };
    fetchAreas();
  }, [cityName]);

  const handleAreaSelect = async (area: AreaItem) => {
    setSelectedAreaId(area.id);
    await setCityAndArea(cityName, area.name);
    navigation.navigate('ProfileSetup');
  };

  const handleNotifyMe = () => {
    Alert.alert('Subscribed', `We will notify you as soon as MonthlyGrocery begins delivery in ${searchQuery || 'your area'}!`);
    setSearchQuery('');
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.pincode.includes(searchQuery.trim())
  );

  const isUnserviceableSearch = searchQuery.trim().length > 0 && filteredAreas.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar with Back Chevron */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (isUnserviceableSearch) {
              setSearchQuery('');
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          style={styles.backArrowBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrowText}>‹</Text>
        </TouchableOpacity>
      </View>

      {!isUnserviceableSearch ? (
        <View style={styles.mainContainer}>
          {/* Main Title & Delivering Location Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.mainTitle}>Select your area</Text>
            <View style={styles.locationSubtitleRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.deliveringText}>
                Delivering in {cityName} ·{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CitySelection')}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Input */}
          <View style={styles.searchCard}>
            <AppIcon name="search" size={18} color={COLORS.ink300} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area or society"
              placeholderTextColor={COLORS.ink300}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Section Header: AREAS IN [CITY] */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeaderText}>AREAS IN {cityName.toUpperCase()}</Text>
          </View>

          {/* Areas List */}
          <FlatList
            data={filteredAreas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.areasList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedAreaId === item.id;
              return (
                <TouchableOpacity
                  style={styles.areaRow}
                  onPress={() => handleAreaSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.areaInfoCol}>
                    <Text style={[styles.areaName, isSelected && styles.areaNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.areaAddress}>
                      {cityName}, {item.state} {item.pincode}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : (
                    <Text style={styles.chevronArrow}>›</Text>
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
          />
        </View>
      ) : (
        <View style={styles.unserviceableContainer}>
          {/* Top Search bar with query */}
          <View style={styles.searchCard}>
            <AppIcon name="search" size={18} color={COLORS.ink300} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Center Illustration & Content */}
          <View style={styles.unserviceableCenter}>
            <View style={styles.peachCircle}>
              <AppIcon name="map-pin" size={48} color={COLORS.marigold600} />
            </View>

            <Text style={styles.unserviceableTitle}>We're not in {searchQuery} yet</Text>
            <Text style={styles.unserviceableSubtitle}>
              MonthlyGrocery is growing fast. Get notified the moment we start delivering to your area.
            </Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.unserviceableBottom}>
            <TouchableOpacity
              style={styles.notifyBtn}
              onPress={handleNotifyMe}
              activeOpacity={0.85}
            >
              <Text style={styles.notifyBtnText}>Notify me when you arrive</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.chooseDiffBtn}>
              <Text style={styles.chooseDiffText}>Choose a different area</Text>
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
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  topBar: {
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: 16,
  },
  backArrowBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 34,
  },
  mainContainer: {
    flex: 1,
  },
  headerBlock: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.ink900,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  locationSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  deliveringText: {
    fontSize: 13.5,
    color: COLORS.ink500,
    fontWeight: '500',
  },
  changeLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.green700,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink900,
    padding: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: COLORS.ink300,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  sectionHeaderWrap: {
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  areasList: {
    paddingBottom: 24,
  },
  areaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: COLORS.line,
  },
  areaInfoCol: {
    flex: 1,
    paddingRight: 16,
  },
  areaName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink900,
    marginBottom: 4,
  },
  areaNameSelected: {
    color: COLORS.green700,
    fontWeight: '700',
  },
  areaAddress: {
    fontSize: 12,
    color: COLORS.ink500,
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green700,
  },
  chevronArrow: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.ink300,
  },
  /* Unserviceable State */
  unserviceableContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  unserviceableCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  peachCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.marigold100, // #FDEFD3
    borderWidth: 1.5,
    borderColor: COLORS.marigold200, // #FBE0AE
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  unserviceableTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink900,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  unserviceableSubtitle: {
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  unserviceableBottom: {
    gap: 16,
    alignItems: 'center',
  },
  notifyBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.pill, // 999px
    backgroundColor: COLORS.green700, // #1E7A46
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chooseDiffBtn: {
    paddingVertical: 8,
  },
  chooseDiffText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green700,
  },
});
