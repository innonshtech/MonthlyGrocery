import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Modal,
  Switch,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import BrowseProductCard from '../../components/browse/BrowseProductCard';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ─── Layout constants from Figma B4 ──────────────────────────────────────────
const SIDEBAR_W = 76;
const GRID_W = width - SIDEBAR_W;
const CARD_W = (GRID_W - 12 - 12 - 10) / 2; // 2 columns, 12px sides, 10px gap

// ─── Derive sub-categories from product list ──────────────────────────────────
function getSubCategories(products: Product[]): string[] {
  const seen = new Set<string>();
  const subs: string[] = [];
  for (const p of products) {
    const sub = (p as any).primary_category || '';
    if (sub && !seen.has(sub)) {
      seen.add(sub);
      subs.push(sub);
    }
  }
  // Always add an "All" entry
  return ['All', ...subs].slice(0, 8);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CategoryProductsScreen({ route, navigation }: any) {
  const { categoryName = 'Atta & Rice', categoryId } = route?.params || {};
  const { city, area } = useAuth();
  const { addToCart, items, updateQuantity, totalAmount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubCat, setActiveSubCat] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter & Sort (Figma B5: SORT BY + PACK SIZE)
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'discount'>('relevance');
  const [selectedPackSize, setSelectedPackSize] = useState('');

  const totalCartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/all?limit=50`;
        const q = categoryName || categoryId;
        if (q && q !== 'all') url += `&category=${encodeURIComponent(q)}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;
        const res = await fetch(url);
        const data = await res.json();
        setProducts(res.ok && data.success ? data.products : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId, categoryName, city, area]);

  const clearFilters = () => {
    setSortBy('relevance');
    setSelectedPackSize('');
  };

  // ── Filter & sort ────────────────────────────────────────────────────────────
  const filtered = products
    .filter((p) => {
      if (activeSubCat !== 'All') {
        const sub = (p as any).primary_category || '';
        if (sub !== activeSubCat) return false;
      }
      // PACK SIZE filter (Figma B5)
      if (selectedPackSize && p.unit && p.unit.toLowerCase() !== selectedPackSize.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => {
      const pa = parseFloat(a.price as any) || 0;
      const pb = parseFloat(b.price as any) || 0;
      if (sortBy === 'price_low') return pa - pb;
      if (sortBy === 'price_high') return pb - pa;
      if (sortBy === 'discount') {
        return ((parseFloat(b.mrp as any) || pb) - pb) - ((parseFloat(a.mrp as any) || pa) - pa);
      }
      return 0;
    });

  const subCats = getSubCategories(products);

  // ── Derive unique pack sizes from real product units (Figma B5: PACK SIZE chips) ─
  const packSizes = Array.from(
    new Set(products.map((p) => p.unit).filter((u): u is string => !!u && u.trim().length > 0))
  ).slice(0, 6);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        {/* Back */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>

        {/* Search bar (inline, Figma: height 44, radius 12) */}
        <TouchableOpacity
          style={styles.inlineSearch}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <AppIcon name="search" size={16} color={COLORS.ink300} />
          <Text style={styles.inlineSearchTxt} numberOfLines={1}>
            Search in {categoryName}
          </Text>
        </TouchableOpacity>

        {/* Cart icon with badge */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <AppIcon name="cart" size={22} color={COLORS.ink900} badge={totalCartCount > 0 ? totalCartCount : undefined} />
        </TouchableOpacity>
      </View>

      {/* ── Body: left sidebar + right grid ────────────────────────────────── */}
      <View style={styles.body}>

        {/* ── Left sidebar ── */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
            {subCats.map((sub, idx) => {
              const active = activeSubCat === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.subCatItem, active && styles.subCatItemActive]}
                  onPress={() => setActiveSubCat(sub)}
                  activeOpacity={0.75}
                >
                  {/* Active indicator bar */}
                  {active && <View style={styles.activeBar} />}

                  {/* Icon tile */}
                  <View style={[styles.subCatTile, active ? styles.subCatTileActive : styles.subCatTileInactive]}>
                    <AppIcon name="shopping-bag" size={22} color={active ? COLORS.green700 : COLORS.ink500} />
                  </View>

                  <Text style={[styles.subCatLabel, active && styles.subCatLabelActive]} numberOfLines={1}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Right product grid ── */}
        <View style={styles.gridArea}>
          {/* Sort row */}
          <View style={styles.sortRow}>
            <Text style={styles.sortRowTitle} numberOfLines={1}>
              {categoryName} · {filtered.length} items
            </Text>
            <TouchableOpacity
              style={styles.sortPill}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.8}
            >
              <AppIcon name="trending-down" size={13} color={COLORS.ink700} />
              <Text style={styles.sortPillTxt}>Sort</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={COLORS.green700} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(p) => p.id}
              numColumns={2}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item, index }) => {
                const cartItem = items.find((i) => i.product?.id === item.id);
                const qty = cartItem?.quantity ?? 0;
                return (
                  <BrowseProductCard
                    item={item}
                    index={index}
                    width={CARD_W}
                    quantity={qty}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                    onAdd={() => addToCart(item)}
                    onIncrement={() => addToCart(item)}
                    onDecrement={() => updateQuantity(item.id, qty - 1)}
                  />
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <AppIcon name="shopping-bag" size={40} color={COLORS.ink300} />
                  <Text style={styles.emptyTxt}>No products found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* ── Floating cart bar (Figma: rgba green pill, centered) ───────────── */}
      {totalCartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartIcon}>
              <AppIcon name="cart" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.floatingCartLabel}>View cart</Text>
              <Text style={styles.floatingCartCount}>
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* ── B5 · Filter & Sort sheet (Figma #474:680) ──────────────────────── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Dark backdrop */}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilterModal(false)} activeOpacity={1} />

          <View style={styles.sheet}>
            {/* Drag handle */}
            <View style={styles.sheetHandleRow}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header: title + X icon (Figma: #474:685) */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort & filter</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowFilterModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="minus" size={18} color={COLORS.ink700} />
              </TouchableOpacity>
            </View>

            {/* SORT BY (Figma: #474:690) */}
            <View style={styles.sheetSectionWrap}>
              <Text style={styles.sheetSection}>SORT BY</Text>
              <View style={styles.radioGroup}>
                {[
                  { key: 'relevance', label: 'Relevance' },
                  { key: 'price_low', label: 'Price — Low to High' },
                  { key: 'price_high', label: 'Price — High to Low' },
                  { key: 'discount', label: 'Discount — High to Low' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={styles.radioRow}
                    onPress={() => setSortBy(r.key as any)}
                  >
                    <Text style={[styles.radioTxt, sortBy === r.key && styles.radioTxtOn]}>{r.label}</Text>
                    {sortBy === r.key ? (
                      <View style={styles.radioCircleOn}>
                        <View style={styles.radioDot} />
                      </View>
                    ) : (
                      <View style={styles.radioCircle} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* PACK SIZE chips — from real product units (Figma: #474:706) */}
            {packSizes.length > 0 && (
              <View style={styles.sheetSectionWrap}>
                <Text style={styles.sheetSection}>PACK SIZE</Text>
                <View style={styles.chips}>
                  {packSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[styles.chip, selectedPackSize === size && styles.chipOn]}
                      onPress={() => setSelectedPackSize(selectedPackSize === size ? '' : size)}
                    >
                      <Text style={[styles.chipTxt, selectedPackSize === size && styles.chipTxtOn]}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Bottom: Clear all + Apply side-by-side (Figma: #474:717) */}
            <View style={styles.sheetBtnsRow}>
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={clearFilters}
                activeOpacity={0.85}
              >
                <Text style={styles.clearAllBtnTxt}>Clear all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnTxt}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },

  // ── Top header ───────────────────────────────────────────────────────────────
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: '#FBFAF6',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  inlineSearchTxt: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink300,
  },

  // ── Body split pane ───────────────────────────────────────────────────────────
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Left sidebar (Figma: 76px wide, #F4F3EE bg, shadow) ─────────────────────
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: '#F4F3EE',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  sidebarContent: {
    paddingVertical: 8,
    gap: 2,
  },
  subCatItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 0,
    gap: 4,
    position: 'relative',
  },
  subCatItemActive: {
    backgroundColor: '#FFFFFF',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: -1,
    bottom: -1,
    width: 3,
    backgroundColor: COLORS.green700,
    borderRadius: 999,
  },
  subCatTile: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCatTileActive: {
    backgroundColor: COLORS.green50,
  },
  subCatTileInactive: {
    backgroundColor: '#FFFFFF',
  },
  subCatLabel: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 14,
  },
  subCatLabelActive: {
    color: COLORS.green700,
  },

  // ── Right grid area ───────────────────────────────────────────────────────────
  gridArea: {
    flex: 1,
  },

  // Sort row
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sortRowTitle: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 999,
  },
  sortPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink700,
  },

  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Grid
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 10,
    marginBottom: 12,
  },

  // Empty
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTxt: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
  },

  // ── Floating cart bar (Figma: green 0.9 alpha, 100px radius, centered) ────────
  floatingCart: {
    position: 'absolute',
    bottom: 16,
    left: SIDEBAR_W + 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 122, 70, 0.9)',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderTopWidth: 0,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartLabel: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  floatingCartCount: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#E4F3EA',
  },

  // ── Filter & Sort sheet ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23,37,30,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 18,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.line,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetSectionWrap: {
    gap: 10,
  },
  sheetSection: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  radioGroup: { gap: 2 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: COLORS.ink300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleOn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.green700,
  },
  radioTxt: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink700,
  },
  radioTxtOn: {
    ...FONTS.muktaBold,
    color: COLORS.ink900,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  chipTxt: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink700,
  },
  chipTxtOn: { color: '#FFFFFF' },
  togglePlaceholder: { height: 0 }, // kept for type safety
  sheetBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  clearAllBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink700,
  },
  applyBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
