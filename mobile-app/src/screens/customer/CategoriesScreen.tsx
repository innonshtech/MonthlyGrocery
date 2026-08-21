import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

interface CategoryTile {
  id: string;
  name: string;
  icon: IconName;
}

const ALL_CATEGORIES: CategoryTile[] = [
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

  const filteredCategories = ALL_CATEGORIES.filter((c) =>
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
