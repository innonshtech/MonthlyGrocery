import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AppIcon, { IconName } from '../../components/AppIcon';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import { API_BASE } from '../../config/api';

const { width } = Dimensions.get('window');

// Tile width: 4 per row, 20px side padding + 8px gaps × 3
const TILE_W = Math.floor((width - 40 - 24) / 4);

interface CategoryTile {
  id: string;
  name: string;
  icon: IconName;
  image_url?: string;
}

// ─── Pastel background per category (from Figma) ──────────────────────────────
const CATEGORY_BG: Record<string, string> = {
  'atta':         '#FFF3D6',
  'rice':         '#FFF3D6',
  'oil':          '#E4F3EA',
  'ghee':         '#E4F3EA',
  'dal':          '#F6E9E1',
  'pulse':        '#F6E9E1',
  'spice':        '#FDE7E7',
  'masala':       '#FDE7E7',
  'dairy':        '#EDE9FB',
  'egg':          '#EDE9FB',
  'milk':         '#EDE9FB',
  'bakery':       '#FBEEDD',
  'bread':        '#FBEEDD',
  'fruit':        '#EAF6D6',
  'veg':          '#EAF6D6',
  'dry':          '#E1F0FB',
  'snack':        '#FBEEDD',
  'namkeen':      '#FBEEDD',
  'drink':        '#E1F0FB',
  'cold':         '#E1F0FB',
  'beverage':     '#E1F0FB',
  'biscuit':      '#FDEFD3',
  'cookie':       '#FDEFD3',
  'tea':          '#F6E9E1',
  'coffee':       '#F6E9E1',
  'clean':        '#EAF6D6',
  'detergent':    '#E4F3EA',
  'personal':     '#FDE7E7',
  'care':         '#FDE7E7',
  'soap':         '#FDE7E7',
  'shampoo':      '#FDE7E7',
  'baby':         '#EDE9FB',
  'diaper':       '#EDE9FB',
  'home':         '#E4F3EA',
  'kitchen':      '#E4F3EA',
};

function getCategoryBg(name: string): string {
  const norm = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_BG)) {
    if (norm.includes(key)) return CATEGORY_BG[key];
  }
  return '#F4F3EE';
}

function getCategoryIcon(name: string): IconName {
  const norm = name.toLowerCase().trim();
  if (norm.includes('atta') || norm.includes('rice')) return 'cat-atta-rice';
  if (norm.includes('oil') || norm.includes('ghee')) return 'cat-oils-ghee';
  if (norm.includes('dal') || norm.includes('pulse')) return 'cat-dals-pulses';
  if (norm.includes('spice') || norm.includes('masala')) return 'cat-spices-masala';
  if (norm.includes('dry') || norm.includes('fruit')) return 'cat-dry-fruits';
  if (norm.includes('snack') || norm.includes('namkeen')) return 'cat-snacks';
  if (norm.includes('beverage') || norm.includes('drink') || norm.includes('tea') || norm.includes('coffee')) return 'cat-beverages';
  if (norm.includes('biscuit') || norm.includes('cookie') || norm.includes('bakery')) return 'cat-biscuits';
  if (norm.includes('clean') || norm.includes('detergent')) return 'cat-cleaning';
  if (norm.includes('personal') || norm.includes('care') || norm.includes('soap') || norm.includes('shampoo')) return 'cat-personal-care';
  if (norm.includes('home') || norm.includes('kitchen')) return 'cat-home-kitchen';
  if (norm.includes('baby') || norm.includes('diaper')) return 'cat-baby-care';
  if (norm.includes('dairy') || norm.includes('milk') || norm.includes('egg')) return 'cat-baby-care';
  if (norm.includes('veg') || norm.includes('fruit')) return 'cat-dry-fruits';
  return 'shopping-bag';
}

// ─── Section definitions (Figma layout) ──────────────────────────────────────
const SECTION_GROUPS = [
  {
    label: 'GROCERY & KITCHEN',
    keywords: ['atta', 'rice', 'oil', 'ghee', 'dal', 'pulse', 'spice', 'masala',
               'dairy', 'milk', 'egg', 'bakery', 'bread', 'fruit', 'veg', 'dry'],
  },
  {
    label: 'SNACKS & BEVERAGES',
    keywords: ['snack', 'namkeen', 'cold', 'drink', 'beverage', 'biscuit', 'cookie', 'tea', 'coffee'],
  },
  {
    label: 'HOUSEHOLD & CARE',
    keywords: ['clean', 'detergent', 'personal', 'care', 'soap', 'shampoo', 'baby', 'diaper', 'home', 'kitchen'],
  },
];

function getSectionLabel(name: string): string {
  const norm = name.toLowerCase();
  for (const sec of SECTION_GROUPS) {
    if (sec.keywords.some((k) => norm.includes(k))) return sec.label;
  }
  return 'GROCERY & KITCHEN'; // default
}

// ─── Fallback list ────────────────────────────────────────────────────────────
const fallbackCategories: CategoryTile[] = [
  { id: 'atta-rice',     name: 'Atta & Rice',     icon: 'cat-atta-rice' },
  { id: 'oils-ghee',     name: 'Oils & Ghee',     icon: 'cat-oils-ghee' },
  { id: 'dals-pulses',   name: 'Dals & Pulses',   icon: 'cat-dals-pulses' },
  { id: 'spices-masala', name: 'Spices & Masala', icon: 'cat-spices-masala' },
  { id: 'dry-fruits',    name: 'Dry Fruits',      icon: 'cat-dry-fruits' },
  { id: 'dairy-eggs',    name: 'Dairy & Eggs',    icon: 'cat-baby-care' },
  { id: 'snacks',        name: 'Snacks',          icon: 'cat-snacks' },
  { id: 'cold-drinks',   name: 'Cold Drinks',     icon: 'cat-beverages' },
  { id: 'biscuits',      name: 'Biscuits',        icon: 'cat-biscuits' },
  { id: 'tea-coffee',    name: 'Tea & Coffee',    icon: 'cat-beverages' },
  { id: 'cleaning',      name: 'Cleaning',        icon: 'cat-cleaning' },
  { id: 'personal-care', name: 'Personal Care',   icon: 'cat-personal-care' },
  { id: 'detergents',    name: 'Detergents',      icon: 'cat-cleaning' },
  { id: 'baby-care',     name: 'Baby Care',       icon: 'cat-baby-care' },
];

// ─── Category Tile ────────────────────────────────────────────────────────────
function CategoryTileItem({
  item,
  onPress,
}: {
  item: CategoryTile;
  onPress: () => void;
}) {
  const bg = getCategoryBg(item.name);
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.tileIconBox, { backgroundColor: bg }]}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.tilePng}
            resizeMode="contain"
          />
        ) : (
          <AppIcon name={item.icon} size={26} color={COLORS.green700} />
        )}
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionEyebrow}>{label}</Text>;
}

// ─── Tile Row (4 per row) ─────────────────────────────────────────────────────
function TileRow({
  tiles,
  navigation,
}: {
  tiles: CategoryTile[];
  navigation: any;
}) {
  // Always render 4 slots; fill empty with ghost placeholders
  const slots = [...tiles];
  while (slots.length < 4) slots.push({ id: `__empty_${slots.length}`, name: '', icon: 'shopping-bag' });

  return (
    <View style={styles.tileRow}>
      {slots.map((t) =>
        t.name === '' ? (
          <View key={t.id} style={styles.tile} />
        ) : (
          <CategoryTileItem
            key={t.id}
            item={t}
            onPress={() =>
              navigation.navigate('CategoryProducts', {
                categoryId: t.id,
                categoryName: t.name,
              })
            }
          />
        )
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CategoriesScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryTile[]>(fallbackCategories);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/categories`);
        const data = await res.json();
        if (res.ok && data.success) {
          const list = data.categoriesFull || [];
          const mapped: CategoryTile[] = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            icon: getCategoryIcon(item.name),
            image_url: item.image_url,
          }));
          if (mapped.length > 0) setCategories(mapped);
          else if (data.categories) {
            setCategories(
              (data.categories as string[]).map((name, i) => ({
                id: `cat-${i}`,
                name,
                icon: getCategoryIcon(name),
              }))
            );
          }
        }
      } catch (e) {
        // keep fallback
      }
    };
    load();
  }, []);

  // ── Filter by search ────────────────────────────────────────────────────────
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Group into sections ─────────────────────────────────────────────────────
  type SectionData = { label: string; rows: CategoryTile[][] };
  const buildSections = (): SectionData[] => {
    const map: Record<string, CategoryTile[]> = {};
    for (const sec of SECTION_GROUPS) map[sec.label] = [];

    for (const cat of filtered) {
      const sec = getSectionLabel(cat.name);
      if (!map[sec]) map[sec] = [];
      map[sec].push(cat);
    }

    const result: SectionData[] = [];
    for (const sec of SECTION_GROUPS) {
      const cats = map[sec.label];
      if (cats.length === 0) continue;
      const rows: CategoryTile[][] = [];
      for (let i = 0; i < cats.length; i += 4) rows.push(cats.slice(i, i + 4));
      result.push({ label: sec.label, rows });
    }
    return result;
  };

  const sections = buildSections();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>All categories</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <AppIcon name="search" size={18} color={COLORS.ink300} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search "atta", "rice", "oil"…`}
            placeholderTextColor={COLORS.ink300}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Grouped sections ───────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.label} style={styles.section}>
            <SectionHeader label={section.label} />
            {section.rows.map((row, ri) => (
              <TileRow key={ri} tiles={row} navigation={navigation} />
            ))}
          </View>
        ))}

        {sections.length === 0 && (
          <View style={styles.emptyState}>
            <AppIcon name="search" size={40} color={COLORS.ink300} />
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        )}

        {/* Bottom spacing for nav bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
    backgroundColor: '#FBFAF6',
  },
  mainTitle: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    letterSpacing: -0.22,
  },

  // Search
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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionEyebrow: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44, // 0.12em of 12px
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Tile row
  tileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Tile
  tile: {
    width: TILE_W,
    alignItems: 'center',
    gap: 6,
  },
  tileIconBox: {
    width: TILE_W,
    height: 74,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tilePng: {
    width: 44,
    height: 44,
  },
  tileLabel: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink700,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Empty
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
