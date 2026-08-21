import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import AppIcon from '../components/AppIcon';
import { COLORS, RADIUS } from '../constants/theme';

interface CityItem {
  id: string;
  name: string;
}

const DEFAULT_POPULAR_CITIES: CityItem[] = [
  { id: 'pune', name: 'Pune' },
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'delhi', name: 'Delhi' },
  { id: 'bengaluru', name: 'Bengaluru' },
  { id: 'hyderabad', name: 'Hyderabad' },
];

export default function CitySelectionScreen({ navigation }: any) {
  const { setCityAndArea } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<CityItem[]>(DEFAULT_POPULAR_CITIES);
  const [selectedCity, setSelectedCity] = useState<string>('Pune');
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/locations`);
        const data = await res.json();
        if (res.ok && data.success && data.locations.length > 0) {
          const uniqueCities = Array.from(
            new Set(data.locations.map((loc: any) => loc.city))
          ) as string[];

          const list: CityItem[] = uniqueCities.map((cName) => ({
            id: cName.toLowerCase().replace(/\s+/g, '-'),
            name: cName,
          }));

          DEFAULT_POPULAR_CITIES.forEach((defCity) => {
            if (!list.find((c) => c.name.toLowerCase() === defCity.name.toLowerCase())) {
              list.push(defCity);
            }
          });

          setCities(list);
        }
      } catch (err) {
        setCities(DEFAULT_POPULAR_CITIES);
      }
    };
    fetchCities();
  }, []);

  const handleCitySelect = async (cityName: string) => {
    setSelectedCity(cityName);
    await setCityAndArea(cityName, null);
    navigation.navigate('AreaSelection', { cityName });
  };

  const handleDetectLocation = async () => {
    setDetecting(true);
    setTimeout(async () => {
      setDetecting(false);
      await handleCitySelect('Pune');
    }, 600);
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar with Back Chevron */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          style={styles.backArrowBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrowText}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* Main Title */}
      <View style={styles.headerBlock}>
        <Text style={styles.mainTitle}>Choose your city</Text>
      </View>

      {/* Detect My Location Banner */}
      <TouchableOpacity
        style={styles.detectLocationCard}
        onPress={handleDetectLocation}
        activeOpacity={0.8}
        disabled={detecting}
      >
        <View style={styles.detectIconBox}>
          <AppIcon name="map-pin" size={18} color={COLORS.green700} />
        </View>
        {detecting ? (
          <ActivityIndicator size="small" color={COLORS.green700} />
        ) : (
          <Text style={styles.detectLocationText}>Detect my location</Text>
        )}
      </TouchableOpacity>

      {/* Search Input Card */}
      <View style={styles.searchCard}>
        <AppIcon name="search" size={18} color={COLORS.ink300} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for your city"
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

      {/* Section Header: POPULAR CITIES */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeaderText}>POPULAR CITIES</Text>
      </View>

      {/* Popular Cities List */}
      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.citiesList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();
          return (
            <TouchableOpacity
              style={styles.cityRow}
              onPress={() => handleCitySelect(item.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                {item.name}
              </Text>
              {isSelected ? (
                <Text style={styles.checkMark}>✓</Text>
              ) : (
                <Text style={styles.chevronArrow}>›</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No city found matching "{searchQuery}"</Text>
          </View>
        }
      />
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
  headerBlock: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.ink900,
    letterSpacing: -0.5,
  },
  detectLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50, // #F2F9F5
    borderRadius: RADIUS.md, // 12px
    borderWidth: 1,
    borderColor: COLORS.green100, // #E4F3EA
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  detectIconBox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green700, // #1E7A46
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
  citiesList: {
    paddingBottom: 24,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: COLORS.line,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink900,
  },
  cityNameSelected: {
    color: COLORS.green700,
    fontWeight: '700',
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
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.ink500,
  },
});
