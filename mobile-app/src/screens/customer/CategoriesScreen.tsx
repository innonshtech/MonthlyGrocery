import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import AppLoader from '../../components/AppLoader';
import AppIcon from '../../components/AppIcon';
import { HomeSearchIcon } from '../../components/home/HomeFigmaIcons';
import {
  fetchCategoriesConfigWithStatus,
  fetchCategoryList,
  CategoriesScreenConfig,
  CategoryItem,
} from '../../services/categoriesApi';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const H_PADDING = 20;
const TILE_SIZE = 78;
const TILE_ICON_HEIGHT = 74;
const tileGap = Math.max(4, (width - H_PADDING * 2 - TILE_SIZE * 4) / 3);

interface CategoryTile extends CategoryItem {}

const SECTION_KEYWORDS = {
  grocery: [
    'atta', 'rice', 'oil', 'ghee', 'dal', 'pulse', 'spice', 'masala',
    'dairy', 'milk', 'egg', 'bakery', 'bread', 'fruit', 'veg', 'dry',
  ],
  snacks: ['snack', 'namkeen', 'cold', 'drink', 'beverage', 'biscuit', 'cookie', 'tea', 'coffee'],
  household: ['clean', 'detergent', 'personal', 'care', 'soap', 'shampoo', 'baby', 'diaper', 'home', 'kitchen'],
} as const;

function buildSectionGroups(config: CategoriesScreenConfig) {
  return [
    { label: config.section_grocery_label, keywords: SECTION_KEYWORDS.grocery },
    { label: config.section_snacks_label, keywords: SECTION_KEYWORDS.snacks },
    { label: config.section_household_label, keywords: SECTION_KEYWORDS.household },
  ];
}

function getSectionLabel(
  name: string,
  groups: ReturnType<typeof buildSectionGroups>,
  defaultLabel: string,
): string {
  const norm = name.toLowerCase();
  for (const sec of groups) {
    if (sec.keywords.some((k) => norm.includes(k))) return sec.label;
  }
  return defaultLabel;
}

function CategoryTileItem({
  item,
  onPress,
}: {
  item: CategoryTile;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.tileIconBox}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.tilePng} resizeMode="cover" />
        ) : (
          <AppIcon name="categories" size={26} color="#1E7A46" />
        )}
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionEyebrow}>{label}</Text>;
}

function TileRow({
  tiles,
  navigation,
}: {
  tiles: CategoryTile[];
  navigation: any;
}) {
  const slots = [...tiles];
  while (slots.length < 4) {
    slots.push({ id: `__empty_${slots.length}`, name: '', image_url: '' });
  }

  return (
    <View style={styles.tileRow}>
      {slots.map((t, idx) =>
        t.name === '' ? (
          <View key={`empty-${idx}`} style={styles.tile} />
        ) : (
          <CategoryTileItem
            key={`${t.id || t.name}-${idx}`}
            item={t}
            onPress={() =>
              navigation.navigate('CategoryProducts', {
                categoryId: t.id,
                categoryName: t.name,
              })
            }
          />
        ),
      )}
    </View>
  );
}

export default function CategoriesScreen({ navigation, setActiveTab }: any) {
  const [screenConfig, setScreenConfig] = useState<CategoriesScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    if (setActiveTab) {
      setActiveTab('Home');
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Shop', { initialTab: 'Home' });
    }
  };

  const loadConfig = useCallback(async () => {
    const result = await fetchCategoriesConfigWithStatus();
    setScreenConfig(result.categories);
    setConfigError(result.error);
    return result;
  }, []);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(false);
    const result = await fetchCategoryList();
    if (result.error) {
      setCategoriesError(true);
      setCategories([]);
    } else {
      setCategories(result.items);
    }
    setCategoriesLoading(false);
  }, []);

  const loadAll = useCallback(async () => {
    await loadConfig();
    await loadCategories();
  }, [loadConfig, loadCategories]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const sectionGroups = useMemo(
    () => (screenConfig ? buildSectionGroups(screenConfig) : []),
    [screenConfig],
  );

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  type SectionData = { label: string; rows: CategoryTile[][] };

  const sections = useMemo((): SectionData[] => {
    if (!screenConfig) return [];
    const defaultLabel = screenConfig.section_default_label || 'More Categories';
    const map: Record<string, CategoryTile[]> = {};
    for (const sec of sectionGroups) map[sec.label] = [];
    if (!map[defaultLabel]) map[defaultLabel] = [];

    for (const cat of filtered) {
      const sec = getSectionLabel(cat.name, sectionGroups, defaultLabel);
      if (!map[sec]) map[sec] = [];
      map[sec].push(cat);
    }

    const result: SectionData[] = [];
    const processedLabels = new Set<string>();

    for (const sec of sectionGroups) {
      if (processedLabels.has(sec.label)) continue;
      processedLabels.add(sec.label);
      const cats = map[sec.label];
      if (!cats || cats.length === 0) continue;
      const rows: CategoryTile[][] = [];
      for (let i = 0; i < cats.length; i += 4) rows.push(cats.slice(i, i + 4));
      result.push({ label: sec.label, rows });
    }

    // Include the default section if not already processed
    if (!processedLabels.has(defaultLabel)) {
      processedLabels.add(defaultLabel);
      const defaultCats = map[defaultLabel];
      if (defaultCats && defaultCats.length > 0) {
        const rows: CategoryTile[][] = [];
        for (let i = 0; i < defaultCats.length; i += 4) rows.push(defaultCats.slice(i, i + 4));
        result.push({ label: defaultLabel, rows });
      }
    }

    // Include any other dynamic custom category groups
    for (const key of Object.keys(map)) {
      if (processedLabels.has(key)) continue;
      processedLabels.add(key);
      const otherCats = map[key];
      if (otherCats && otherCats.length > 0) {
        const rows: CategoryTile[][] = [];
        for (let i = 0; i < otherCats.length; i += 4) rows.push(otherCats.slice(i, i + 4));
        result.push({ label: key, rows });
      }
    }

    return result;
  }, [filtered, sectionGroups, screenConfig]);

  if (configError && !screenConfig) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>
            Could not load categories screen. Check that the backend is running.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAll} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const emptyMessage = screenConfig?.empty_message ?? '';
  const loadErrorMessage = screenConfig?.load_error_message ?? '';
  const retryLabel = screenConfig?.retry_label ?? 'Retry';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={COLORS.ink900} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.mainTitle}>{screenConfig?.title || 'All Categories'}</Text>
        </View>

        <View style={styles.searchBar}>
          <HomeSearchIcon size={18} color={COLORS.ink300} />
          <TextInput
            style={styles.searchInput}
            placeholder={screenConfig?.search_placeholder}
            placeholderTextColor={COLORS.ink300}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {categoriesLoading ? (
        <View style={styles.centeredState}>
          <AppLoader message="Loading categories..." />
        </View>
      ) : categoriesError ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{loadErrorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadCategories} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>{retryLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, sIdx) => (
            <View key={`${section.label}-${sIdx}`} style={styles.section}>
              <SectionHeader label={section.label} />
              {section.rows.map((row, ri) => (
                <TileRow key={ri} tiles={row} navigation={navigation} />
              ))}
            </View>
          ))}

          {sections.length === 0 && (
            <View style={styles.emptyState}>
              <AppIcon name="search" size={40} color={COLORS.ink300} />
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
  header: {
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: '#FBFAF6',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  mainTitle: {
    ...FONTS.muktaBold,
    fontSize: 22,
    color: COLORS.ink900,
    letterSpacing: -0.22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink900,
    padding: 0,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.ink300,
    paddingHorizontal: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionEyebrow: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tileRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: tileGap,
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    gap: 6,
  },
  tileIconBox: {
    width: TILE_SIZE,
    height: TILE_ICON_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tilePng: {
    width: '100%',
    height: '100%',
  },
  tileLabel: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink700,
    textAlign: 'center',
    lineHeight: 16,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  retryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink300,
  },
});
