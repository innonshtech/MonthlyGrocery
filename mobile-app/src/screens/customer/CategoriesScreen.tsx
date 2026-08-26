import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  StatusBar
} from 'react-native';
import AppIcon, { IconName } from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';
import { API_BASE } from '../../config/api';

const { width } = Dimensions.get('window');

interface CategoryTile {
  id: string;
  name: string;
  icon: IconName;
}

// Helper to assign correct icon to category dynamically
function getCategoryIcon(name: string): IconName {
  const norm = name.toLowerCase().trim();
  if (norm.includes('atta') || norm.includes('rice')) return 'cat-atta-rice';
  if (norm.includes('oil') || norm.includes('ghee')) return 'cat-oils-ghee';
  if (norm.includes('dal') || norm.includes('pulse')) return 'cat-dals-pulses';
  if (norm.includes('spice') || norm.includes('masala')) return 'cat-spices-masala';
  if (norm.includes('dry') || norm.includes('fruit')) return 'cat-dry-fruits';
  if (norm.includes('snack') || norm.includes('namkeen')) return 'cat-snacks';
  if (norm.includes('beverage') || norm.includes('drink') || norm.includes('tea') || norm.includes('juice')) return 'cat-beverages';
  if (norm.includes('biscuit') || norm.includes('cookies')) return 'cat-biscuits';
  if (norm.includes('clean') || norm.includes('household') || norm.includes('detergent')) return 'cat-cleaning';
  if (norm.includes('personal') || norm.includes('shampoo') || norm.includes('soap') || norm.includes('care')) return 'cat-personal-care';
  if (norm.includes('home') || norm.includes('kitchen') || norm.includes('appliances')) return 'cat-home-kitchen';
  if (norm.includes('baby') || norm.includes('diaper')) return 'cat-baby-care';
  return 'shopping-bag';
}

const fallbackCategories: CategoryTile[] = [
  { id: 'atta-rice', name: 'Atta & Rice', icon: 'cat-atta-rice' },
  { id: 'oils-ghee', name: 'Oils & Ghee', icon: 'cat-oils-ghee' },
  { id: 'dals-pulses', name: 'Dals & Pulses', icon: 'cat-dals-pulses' },
  { id: 'spices-masala', name: 'Spices & Masala', icon: 'cat-spices-masala' },
  { id: 'dry-fruits', name: 'Dry Fruits', icon: 'cat-dry-fruits' },
  { id: 'snacks', name: 'Snacks', icon: 'cat-snacks' },
  { id: 'beverages', name: 'Beverages', icon: 'cat-beverages' },
  { id: 'biscuits', name: 'Biscuits', icon: 'cat-biscuits' },
  { id: 'cleaning', name: 'Cleaning', icon: 'cat-cleaning' },
  { id: 'personal-care', name: 'Personal Care', icon: 'cat-personal-care' },
  { id: 'home-kitchen', name: 'Home & Kitchen', icon: 'cat-home-kitchen' },
  { id: 'baby-care', name: 'Baby Care', icon: 'cat-baby-care' },
];

export default function CategoriesScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryTile[]>(fallbackCategories);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/categories`);
        const data = await res.json();
        if (res.ok && data.success && data.categories) {
          const mapped: CategoryTile[] = data.categories.map((name: string, index: number) => ({
            id: `cat-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            name: name,
            icon: getCategoryIcon(name)
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TITLE HEADER
         ========================================================================= */}
      <View style={styles.headerBlock}>
        <Text style={styles.mainTitle}>Categories</Text>
      </View>

      {/* =========================================================================
         2. SEARCH BAR
         ========================================================================= */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <AppIcon name="search" size={18} color={COLORS.ink300} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories & products"
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

      {/* =========================================================================
         3. 3-COLUMN CATEGORY GRID (12 EXACT FIGMA TILES)
         ========================================================================= */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() =>
              navigation.navigate('CategoryProducts', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <AppIcon name={item.icon} size={30} color={COLORS.green700} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure clean surface
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.ink900,
    letterSpacing: -0.4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md, // 12px
    height: 50,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink900,
    padding: 0,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.ink300,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  gridContainer: {
    paddingHorizontal: 14,
    paddingBottom: 32,
  },
  categoryCard: {
    width: (width - 28) / 3,
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  iconBox: {
    width: '100%',
    height: 78,
    borderRadius: RADIUS.lg, // 16px rounded corners matching screenshot
    backgroundColor: COLORS.green50, // #F2F9F5 soft mint fill
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink900, // #17251E
    textAlign: 'center',
    lineHeight: 16,
  },
});
