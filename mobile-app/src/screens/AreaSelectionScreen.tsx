import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import AppIcon from '../components/AppIcon';
import {
  OnboardingBackButton,
  OnboardingRadio,
  OnboardingSectionLabel,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import { COLORS, RADIUS } from '../constants/theme';

interface AreaItem {
  id: string;
  name: string;
  pincode: string;
  serviceable: boolean;
  subtitle: string;
}

const DEFAULT_PUNE_AREAS: AreaItem[] = [
  {
    id: 'kothrud',
    name: 'Kothrud',
    pincode: '411038',
    serviceable: true,
    subtitle: '4-hour windows · daily',
  },
  {
    id: 'baner',
    name: 'Baner',
    pincode: '411045',
    serviceable: true,
    subtitle: '4-hour windows · daily',
  },
  {
    id: 'aundh',
    name: 'Aundh',
    pincode: '411007',
    serviceable: true,
    subtitle: '4-hour windows · daily',
  },
  {
    id: 'viman-nagar',
    name: 'Viman Nagar',
    pincode: '411014',
    serviceable: true,
    subtitle: '4-hour windows · daily',
  },
  {
    id: 'hadapsar',
    name: 'Hadapsar',
    pincode: '411028',
    serviceable: false,
    subtitle: 'Launching next month',
  },
];

export default function AreaSelectionScreen({ route, navigation }: any) {
  const { setCityAndArea } = useAuth();
  const { cityName } = route.params || { cityName: 'Pune' };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('kothrud');
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
              serviceable: loc.is_serviceable !== false,
              subtitle: loc.is_serviceable === false
                ? 'Launching next month'
                : '4-hour windows · daily',
            }));
            setAreas(mapped);
          }
        }
      } catch {
        setAreas(DEFAULT_PUNE_AREAS);
      }
    };
    fetchAreas();
  }, [cityName]);

  const handleAreaSelect = async (area: AreaItem) => {
    if (!area.serviceable) return;
    setSelectedAreaId(area.id);
    await setCityAndArea(cityName, area.name);
    navigation.navigate('ProfileSetup');
  };

  const handleNotifyMe = () => {
    Alert.alert(
      'Subscribed',
      `We'll notify you when MonthlyGrocery starts delivering in ${searchQuery || 'your area'}.`
    );
    setSearchQuery('');
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.pincode.includes(searchQuery.trim())
  );

  const isUnserviceableSearch =
    searchQuery.trim().length > 0 && filteredAreas.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.mainTitle}>Select your area</Text>
            <View style={styles.servingRow}>
              <AppIcon name="map-pin" size={15} color={COLORS.green700} />
              <Text style={styles.servingText}>Serving {cityName}</Text>
              <Text style={styles.dotSep}>·</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CitySelection')}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchCard}>
            <AppIcon name="search" size={18} color={COLORS.ink300} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your area or pincode"
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

          <OnboardingSectionLabel label="AREAS WE DELIVER TO" />

          <FlatList
            data={filteredAreas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedAreaId === item.id;
              return (
                <TouchableOpacity
                  style={[styles.rowCard, !item.serviceable && styles.rowDisabled]}
                  onPress={() => handleAreaSelect(item)}
                  activeOpacity={item.serviceable ? 0.7 : 1}
                  disabled={!item.serviceable}
                >
                  <View style={styles.rowIcon}>
                    <AppIcon name="map-pin" size={18} color={COLORS.green700} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text
                      style={[styles.rowTitle, isSelected && styles.rowTitleSelected]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                  </View>
                  {item.serviceable ? (
                    <OnboardingRadio selected={isSelected} />
                  ) : (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming soon</Text>
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

          <View style={styles.unserviceableCenter}>
            <View style={styles.peachCircle}>
              <AppIcon name="map-pin" size={48} color={COLORS.marigold600} />
            </View>
            <Text style={styles.unserviceableTitle}>
              We're not in {searchQuery} yet
            </Text>
            <Text style={styles.unserviceableSubtitle}>
              MonthlyGrocery is growing fast. Get notified the moment we start
              delivering to your area.
            </Text>
          </View>

          <View style={styles.unserviceableBottom}>
            <OnboardingPrimaryButton
              label="Notify me when you arrive"
              onPress={handleNotifyMe}
            />
            <TouchableOpacity onPress={() => setSearchQuery('')}>
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
    backgroundColor: COLORS.paper,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerBlock: {
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
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
    fontSize: 15,
    color: COLORS.ink500,
    lineHeight: 24,
  },
  dotSep: {
    fontSize: 15,
    color: COLORS.ink500,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 15,
    color: COLORS.ink900,
    padding: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: COLORS.ink300,
    fontWeight: 'bold',
  },
  list: { paddingBottom: 24 },
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink900,
    lineHeight: 20,
  },
  rowTitleSelected: { color: COLORS.green700 },
  rowSubtitle: {
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
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink500,
  },
  unserviceableWrap: {
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
    backgroundColor: COLORS.marigold100,
    borderWidth: 1.5,
    borderColor: COLORS.marigold200,
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
  chooseDiffText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green700,
    paddingVertical: 8,
  },
});
