import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import AppIcon from '../components/AppIcon';
import {
  OnboardingBackButton,
  OnboardingRadio,
  OnboardingSectionLabel,
} from '../components/onboarding/OnboardingUI';
import { COLORS, RADIUS, FONTS } from '../constants/theme';

interface CityItem {
  id: string;
  name: string;
  region: string;
}

const DEFAULT_POPULAR_CITIES: CityItem[] = [
  { id: 'pune', name: 'Pune', region: 'Maharashtra' },
  { id: 'mumbai', name: 'Mumbai', region: 'Maharashtra' },
  { id: 'delhi', name: 'Delhi', region: 'NCR' },
  { id: 'bengaluru', name: 'Bengaluru', region: 'Karnataka' },
  { id: 'hyderabad', name: 'Hyderabad', region: 'Telangana' },
];

const CITY_REGIONS: Record<string, string> = {
  pune: 'Maharashtra',
  mumbai: 'Maharashtra',
  delhi: 'NCR',
  bengaluru: 'Karnataka',
  hyderabad: 'Telangana',
};

export default function CitySelectionScreen({ navigation }: any) {
  const { setCityAndArea } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<CityItem[]>(DEFAULT_POPULAR_CITIES);
  const [selectedCity, setSelectedCity] = useState('Pune');
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
            region:
              CITY_REGIONS[cName.toLowerCase().replace(/\s+/g, '-')] || 'India',
          }));

          DEFAULT_POPULAR_CITIES.forEach((defCity) => {
            if (!list.find((c) => c.name.toLowerCase() === defCity.name.toLowerCase())) {
              list.push(defCity);
            }
          });

          setCities(list);
        }
      } catch {
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

      <OnboardingBackButton
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />

      <View style={styles.headerBlock}>
        <Text style={styles.mainTitle}>Choose your city</Text>
        <Text style={styles.subtitle}>
          We deliver monthly groceries in these cities.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.locationCard}
        onPress={handleDetectLocation}
        activeOpacity={0.8}
        disabled={detecting}
      >
        <View style={styles.locationTextCol}>
          <Text style={styles.locationTitle}>Use my current location</Text>
          <Text style={styles.locationSubtitle}>Find your city automatically</Text>
        </View>
        {detecting ? (
          <ActivityIndicator size="small" color={COLORS.green700} />
        ) : (
          <AppIcon name="chevron-right" size={18} color={COLORS.green700} />
        )}
      </TouchableOpacity>

      <View style={styles.searchCard}>
        <AppIcon name="search" size={18} color={COLORS.ink300} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for your city"
          placeholderTextColor={COLORS.ink300}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <OnboardingSectionLabel label="POPULAR CITIES" />

      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected =
            selectedCity.toLowerCase() === item.name.toLowerCase();
          return (
            <TouchableOpacity
              style={[styles.rowCard, isSelected && styles.rowCardSelected]}
              onPress={() => handleCitySelect(item.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, isSelected ? styles.rowIconSelected : styles.rowIconDefault]}>
                <AppIcon
                  name="building"
                  size={18}
                  color={isSelected ? COLORS.green700 : COLORS.ink700}
                />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}>
                  {item.name}
                </Text>
                <Text style={styles.rowSubtitle}>{item.region}</Text>
              </View>
              <OnboardingRadio selected={isSelected} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No city found matching "{searchQuery}"</Text>
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
    marginBottom: 16,
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
  },
  clearSearchText: {
    fontSize: 14,
    color: COLORS.ink300,
    fontWeight: 'bold',
  },
  list: { paddingBottom: 24, gap: 0 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    minHeight: 60,
  },
  rowCardSelected: {
    backgroundColor: '#F2F9F5',
  },
  rowIcon: {
    width: 40,
    height: 40,
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
    lineHeight: 22,
  },
  rowTitleSelected: {
    color: COLORS.ink900,
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
