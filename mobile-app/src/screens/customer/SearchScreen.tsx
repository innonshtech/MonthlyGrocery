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
import { appendLocationParams } from '../../utils/locationParams';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { HomeSearchIcon, HomeMicIcon, HomeArrowRightIcon } from '../../components/home/HomeFigmaIcons';
import {
  fetchSearchConfigWithStatus,
  fetchPopularCategoryNames,
  formatSearchTemplate,
  SearchScreenConfig,
} from '../../services/searchApi';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import { getProductPackLabel } from '../../utils/packUnit';

const TILE_BG = [
  '#FFF3D6', '#F6E9E1', '#E4F3EA', '#FDE4E7',
  '#EDE9FB', '#FBEEDD', '#EAF6D6', '#E1F0FB',
];
function tileBg(index: number) {
  return TILE_BG[index % TILE_BG.length];
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function buildSuggestions(products: Product[], rawQuery: string): string[] {
  if (!rawQuery.trim()) return [];
  const q = rawQuery.toLowerCase().trim();
  const seen = new Set<string>();
  const out: string[] = [];

  for (const p of products) {
    const name = p.name?.toLowerCase() ?? '';
    const brand = p.brand?.toLowerCase() ?? '';
    if (name.includes(q) || brand.includes(q)) {
      const suggestion = p.brand
        ? `${p.brand} ${p.unit ?? ''}`.trim().toLowerCase()
        : name;
      const key = suggestion.slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(suggestion);
      }
      if (out.length >= 5) break;
    }
  }

  if (products.length > 0) {
    const first = products[0];
    const primary = `${q} ${first?.unit ?? ''}`.trim();
    if (!seen.has(primary)) out.unshift(primary);
  }

  return out.slice(0, 3);
}

export default function SearchScreen({ navigation }: any) {
  const { city, area, pincode } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();

  const [searchConfig, setSearchConfig] = useState<SearchScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const inputRef = useRef<TextInput>(null);
  const debouncedQuery = useDebounce(query, 350);
  const hasDeliveryArea = Boolean(city?.trim() && area?.trim());

  const loadConfig = async () => {
    const result = await fetchSearchConfigWithStatus();
    setSearchConfig(result.search);
    setConfigError(result.error);
  };

  useEffect(() => {
    loadConfig();
    fetchPopularCategoryNames(8).then(setPopularSearches);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    if (!hasDeliveryArea) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = appendLocationParams(
          `${API_BASE}/products/all?q=${encodeURIComponent(debouncedQuery)}&limit=50`,
          { city, area, pincode },
        );
        const res = await fetch(url);
        const data = await res.json();
        setProducts(res.ok && data.success ? data.products : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedQuery, city, area, pincode, hasDeliveryArea]);

  const suggestions = showSuggestions && query.trim()
    ? buildSuggestions(products, query)
    : [];

  const commitQuery = useCallback((text: string) => {
    setQuery(text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, []);

  const getQty = (id: string) => items.find((i) => i.product?.id === id)?.quantity ?? 0;

  if (configError && !searchConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.configErrorWrap}>
          <Text style={styles.configErrorText}>
            Could not load search screen. Check that the backend is running.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadConfig} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* B2 header — back + active search bar (469:677) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <HomeSearchIcon size={18} color={COLORS.ink300} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={searchConfig?.search_placeholder}
            placeholderTextColor={COLORS.ink300}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={() => setShowSuggestions(false)}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? <View style={styles.inputDivider} /> : null}
          <HomeMicIcon size={18} color={COLORS.ink300} />
        </View>
      </View>

      {!hasDeliveryArea && query.trim().length > 0 ? (
        <TouchableOpacity
          style={styles.locationHint}
          onPress={() => navigation.navigate('CitySelection')}
          activeOpacity={0.85}
        >
          <Text style={styles.locationHintText}>{searchConfig?.location_required_message}</Text>
          <Text style={styles.locationHintCta}>{searchConfig?.choose_location_label}</Text>
        </TouchableOpacity>
      ) : null}

      {query.trim().length === 0 ? (
        <View style={styles.popularWrap}>
          {popularSearches.length > 0 ? (
            <>
              <Text style={styles.popularLabel}>{searchConfig?.popular_searches_label}</Text>
              <View style={styles.popularChips}>
                {popularSearches.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={styles.chip}
                    onPress={() => commitQuery(chip)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.chipTxt}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.hintText}>{searchConfig?.search_placeholder}</Text>
          )}
        </View>
      ) : loading && products.length === 0 ? (
        <View style={styles.center}>
          <AppLoader message="Searching..." />
        </View>
      ) : (
        <FlatList
          data={hasDeliveryArea ? products : []}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {suggestions.length > 0 ? (
                <View style={styles.suggestionsBox}>
                  {suggestions.map((s, idx) => (
                    <TouchableOpacity
                      key={`${s}-${idx}`}
                      style={styles.suggestionRow}
                      onPress={() => commitQuery(s)}
                      activeOpacity={0.75}
                    >
                      <HomeSearchIcon size={18} color={COLORS.ink500} />
                      <Text style={styles.suggestionTxt} numberOfLines={1}>{s}</Text>
                      <HomeArrowRightIcon size={16} color={COLORS.ink300} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {products.length > 0 ? (
                <View style={styles.eyebrowRow}>
                  <Text style={styles.eyebrowTxt}>{searchConfig?.products_section_label}</Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const qty = getQty(item.id);
            const price = parseFloat(String(item.price)) || 0;
            const mrp = parseFloat(String(item.mrp)) || price;

            return (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                activeOpacity={0.8}
              >
                <View style={[styles.imgTile, { backgroundColor: tileBg(index) }]}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.tileImg} resizeMode="contain" />
                  ) : (
                    <AppIcon name="shopping-bag" size={24} color={COLORS.green700} />
                  )}
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
                  {getProductPackLabel(item) ? <Text style={styles.rowUnit}>{getProductPackLabel(item)}</Text> : null}
                  <View style={styles.priceRow}>
                    <Text style={styles.rowPrice}>₹{price}</Text>
                    {mrp > price ? <Text style={styles.rowMrp}>₹{mrp}</Text> : null}
                  </View>
                </View>

                {qty > 0 ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(item.id, qty - 1)}>
                      <Text style={styles.stepTxt}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepQty}>{qty}</Text>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => addToCart(item)}>
                      <Text style={styles.stepTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)} activeOpacity={0.85}>
                    <Text style={styles.addBtnTxt}>ADD</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loading && hasDeliveryArea ? (
              <View style={styles.emptyWrap}>
                <AppIcon name="search" size={40} color={COLORS.ink300} />
                <Text style={styles.emptyTitle}>
                  {formatSearchTemplate(searchConfig?.empty_title_template || '', { query })}
                </Text>
                <Text style={styles.emptySubtitle}>{searchConfig?.empty_subtitle}</Text>
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 10,
    height: 60,
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: COLORS.surface,
    borderWidth: 1.6,
    borderColor: COLORS.green700,
    borderRadius: 12,
    paddingHorizontal: 13,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink900,
    padding: 0,
    minWidth: 0,
  },
  inputDivider: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.line,
    marginHorizontal: 2,
  },
  suggestionsBox: {
    backgroundColor: COLORS.surface,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48,
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
  resultsList: {
    paddingBottom: 40,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 82,
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
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
  addBtn: {
    width: 65,
    height: 34,
    backgroundColor: COLORS.green100,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 10,
    height: 34,
    minWidth: 65,
    flexShrink: 0,
  },
  stepBtn: {
    width: 28,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTxt: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 32,
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
  popularWrap: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  popularLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  popularChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: COLORS.surface,
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
  hintText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  locationHint: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationHintText: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink700,
    lineHeight: 18,
  },
  locationHintCta: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.green700,
    marginTop: 6,
  },
  configErrorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  configErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
