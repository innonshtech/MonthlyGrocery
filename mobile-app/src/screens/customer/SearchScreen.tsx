import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

// ─── Pastel tile backgrounds (same system as rest of app) ────────────────────
const TILE_BG = [
  '#FFF3D6', '#F6E9E1', '#E4F3EA', '#FDE4E7',
  '#EDE9FB', '#FBEEDD', '#EAF6D6', '#E1F0FB',
];
function tileBg(index: number) { return TILE_BG[index % TILE_BG.length]; }

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Build suggestion strings from raw product list ───────────────────────────
function buildSuggestions(products: Product[], rawQuery: string): string[] {
  if (!rawQuery.trim()) return [];
  const q = rawQuery.toLowerCase().trim();
  const seen = new Set<string>();
  const out: string[] = [];

  // Exact product names that match
  for (const p of products) {
    const name = p.name?.toLowerCase() ?? '';
    const brand = p.brand?.toLowerCase() ?? '';
    if (name.includes(q) || brand.includes(q)) {
      // Add "<brand> <unit>" as suggestion if not already added
      const suggestion = p.brand
        ? `${p.brand.toLowerCase()} ${p.unit ?? ''}`.trim()
        : p.name.toLowerCase();
      const key = suggestion.slice(0, 30);
      if (!seen.has(key)) { seen.add(key); out.push(suggestion); }
      if (out.length >= 5) break;
    }
  }

  // Always add the raw query itself as first suggestion if it has results
  if (products.length > 0 && !seen.has(rawQuery.toLowerCase())) {
    out.unshift(`${rawQuery.toLowerCase()} ${products[0]?.unit ?? ''}`.trim());
  }

  return out.slice(0, 5);
}

export default function SearchScreen({ navigation }: any) {
  const { city, area } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();

  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<any>(null);
  const debouncedQuery = useDebounce(query, 350);

  // ── Fetch from backend whenever the debounced query changes ─────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetch_ = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/search?q=${encodeURIComponent(debouncedQuery)}`;
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
    fetch_();
  }, [debouncedQuery, city, area]);

  // ── Suggestions: built from current live results ─────────────────────────────
  const suggestions = showSuggestions
    ? buildSuggestions(products, query)
    : [];

  // ── Commit a suggestion / submit ─────────────────────────────────────────────
  const commitQuery = useCallback((text: string) => {
    setQuery(text);
    setCommittedQuery(text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, []);

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const getQty = (id: string) => items.find((i) => i.product?.id === id)?.quantity ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ── 1. Top header: back + active search bar ─────────────────────────── */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>

        {/* Active search bar — green border when focused (Figma spec) */}
        <View style={styles.searchBar}>
          <AppIcon name="search" size={17} color={COLORS.ink300} />

          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={`Search "atta", "rice", "oil"…`}
            placeholderTextColor={COLORS.ink300}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={() => commitQuery(query)}
            returnKeyType="search"
            autoFocus
          />

          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setCommittedQuery('');
                setProducts([]);
                setShowSuggestions(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="minus" size={16} color={COLORS.ink300} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 2. Unified Scrollable List ────────────────────────────────────────── */}
      {query.trim().length === 0 ? (
        // Popular Searches view when query is empty
        <View style={styles.center}>
          <Text style={styles.popularLabel}>POPULAR SEARCHES</Text>
          <View style={styles.popularChips}>
            {['Atta', 'Rice', 'Oils & Ghee', 'Dals', 'Spices', 'Snacks', 'Drinks', 'Biscuits'].map((chip) => (
              <TouchableOpacity
                key={chip}
                style={styles.chip}
                onPress={() => commitQuery(chip)}
              >
                <Text style={styles.chipTxt}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : loading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {/* Suggestions List (max 3 items as per B2 Figma) */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  {suggestions.slice(0, 3).map((s, idx) => (
                    <TouchableOpacity
                      key={`${s}-${idx}`}
                      style={styles.suggestionRow}
                      onPress={() => commitQuery(s)}
                      activeOpacity={0.75}
                    >
                      <AppIcon name="search" size={16} color={COLORS.ink500} />
                      <Text style={styles.suggestionTxt} numberOfLines={1}>{s}</Text>
                      <AppIcon name="arrow-right" size={14} color={COLORS.ink300} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Eyebrow Label "PRODUCTS" */}
              {products.length > 0 && (
                <View style={styles.eyebrowRow}>
                  <Text style={styles.eyebrowTxt}>PRODUCTS</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const qty = getQty(item.id);
            const price = parseFloat(item.price as any) || 0;
            const mrp = parseFloat(item.mrp as any) || price;

            return (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: item.id })
                }
                activeOpacity={0.8}
              >
                {/* Colored 48x48 image tile */}
                <View style={[styles.imgTile, { backgroundColor: tileBg(index) }]}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.tileImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <AppIcon name="shopping-bag" size={24} color={COLORS.green700} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
                  {item.unit ? (
                    <Text style={styles.rowUnit}>{item.unit}</Text>
                  ) : null}
                  <View style={styles.priceRow}>
                    <Text style={styles.rowPrice}>₹{price}</Text>
                    {mrp > price && (
                      <Text style={styles.rowMrp}>₹{mrp}</Text>
                    )}
                  </View>
                </View>

                {/* ADD / Stepper */}
                {qty > 0 ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.id, qty - 1)}
                    >
                      <Text style={styles.stepTxt}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepQty}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={styles.stepTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addBtnTxt}>ADD</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.center}>
                <AppIcon name="search" size={40} color={COLORS.ink300} />
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptySubtitle}>Try another search term</Text>
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active search bar — green stroke when focused (Figma: 1.6px #1E7A46 border)
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.6,
    borderColor: COLORS.green700,
    borderRadius: 12,
    paddingHorizontal: 13,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink900,
    padding: 0,
  },

  // ── Suggestions ───────────────────────────────────────────────────────────────
  suggestionsBox: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.line,
  },
  suggestionTxt: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink700,
  },

  // ── Eyebrow ───────────────────────────────────────────────────────────────────
  eyebrowRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  eyebrowTxt: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44,
    textTransform: 'uppercase',
  },

  // ── Results list ──────────────────────────────────────────────────────────────
  resultsList: {
    paddingBottom: 40,
  },

  // Product row (Figma: 11px v-padding, 20px h-padding, 1.5px bottom border)
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.line,
    backgroundColor: '#FFFFFF',
  },

  // Image tile (Figma: 48×48, 10px radius, coloured bg)
  imgTile: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tileImg: {
    width: 32,
    height: 32,
  },

  // Info
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  rowUnit: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowPrice: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  rowMrp: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },

  // ADD button (Figma: #E4F3EA bg, #2A8B54 border 1.5px, 10px radius, "ADD" Label 13px SemiBold)
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: '#E4F3EA',
    borderWidth: 1.5,
    borderColor: '#2A8B54',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  addBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.green700,
  },

  // Stepper (same green pill as rest of app)
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 9,
    height: 36,
    flexShrink: 0,
  },
  stepBtn: {
    width: 30,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTxt: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    minWidth: 18,
    textAlign: 'center',
  },

  // ── Empty / loading states ────────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
  },
  popularLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44,
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center',
  },
  popularChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
});

