import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Modal,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { HomeSearchIcon } from '../../components/home/HomeFigmaIcons';
import BrowseProductCard from '../../components/browse/BrowseProductCard';
import {
  fetchCategoryProductsConfigWithStatus,
  fetchCategoryProducts,
  fetchBrowseCategoryImage,
  fetchSubcategoriesForCategory,
  buildSidebarTabs,
  formatCategoryProductsTemplate,
  CategoryProductsScreenConfig,
  AdminSubcategory,
} from '../../services/categoryProductsApi';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import { getProductPackLabel } from '../../utils/packUnit';

const { width } = Dimensions.get('window');

const SIDEBAR_W = 76;
const GRID_W = width - SIDEBAR_W;
const CARD_W = (GRID_W - 12 - 12 - 10) / 2;

export default function CategoryProductsScreen({ route, navigation }: any) {
  const {
    categoryName,
    categoryId,
    dealsOnly = false,
  } = route?.params || {};

  const { city, area, pincode } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const insets = useSafeAreaInsets();

  const [screenConfig, setScreenConfig] = useState<CategoryProductsScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [activeSubCat, setActiveSubCat] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'discount'>('relevance');
  const [selectedPackSize, setSelectedPackSize] = useState('');
  const [parentCategoryImage, setParentCategoryImage] = useState<string | undefined>();
  const [adminSubcategories, setAdminSubcategories] = useState<AdminSubcategory[]>([]);

  const hasDeliveryArea = Boolean(city?.trim() && area?.trim());
  const totalCartCount = items.reduce((s, i) => s + i.quantity, 0);

  const loadConfig = useCallback(async () => {
    const result = await fetchCategoryProductsConfigWithStatus();
    setScreenConfig(result.config);
    setConfigError(result.error);
    return result;
  }, []);

  const loadProducts = useCallback(async () => {
    if (!hasDeliveryArea) {
      setProducts([]);
      setProductsError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setProductsError(false);
    const result = await fetchCategoryProducts({
      dealsOnly,
      categoryName,
      categoryId,
      city: city ?? undefined,
      area: area ?? undefined,
      pincode: pincode ?? undefined,
    });

    if (result.error) {
      setProductsError(true);
      setProducts([]);
    } else {
      setProducts(result.products);
    }
    setLoading(false);
  }, [hasDeliveryArea, dealsOnly, categoryName, categoryId, city, area, pincode]);

  const loadAll = useCallback(async () => {
    await loadConfig();
    if (!dealsOnly) {
      const [img, subs] = await Promise.all([
        fetchBrowseCategoryImage(categoryId, categoryName),
        fetchSubcategoriesForCategory(categoryId, categoryName),
      ]);
      setParentCategoryImage(img);
      setAdminSubcategories(subs);
    } else {
      setParentCategoryImage(undefined);
      setAdminSubcategories([]);
    }
    await loadProducts();
  }, [loadConfig, loadProducts, dealsOnly, categoryId, categoryName]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (screenConfig?.sub_category_all_label) {
      setActiveSubCat(screenConfig.sub_category_all_label);
    }
  }, [screenConfig?.sub_category_all_label]);

  const clearFilters = () => {
    setSortBy('relevance');
    setSelectedPackSize('');
  };

  const allLabel = screenConfig?.sub_category_all_label ?? '';

  const displayTitle = dealsOnly
    ? (categoryName || screenConfig?.deals_title || '')
    : (categoryName || categoryId || screenConfig?.deals_title || '');

  const filtered = products
    .filter((p) => {
      if (activeSubCat && activeSubCat !== allLabel) {
        const sub = (p.secondary_category || '').trim();
        if (sub !== activeSubCat) return false;
      }
      if (selectedPackSize && getProductPackLabel(p).toLowerCase() !== selectedPackSize.toLowerCase()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const pa = parseFloat(String(a.price)) || 0;
      const pb = parseFloat(String(b.price)) || 0;
      if (sortBy === 'price_low') return pa - pb;
      if (sortBy === 'price_high') return pb - pa;
      if (sortBy === 'discount') {
        return (
          ((parseFloat(String(b.mrp)) || pb) - pb) - ((parseFloat(String(a.mrp)) || pa) - pa)
        );
      }
      return 0;
    });

  const sidebarTabs = useMemo(
    () =>
      allLabel
        ? buildSidebarTabs(products, allLabel, parentCategoryImage, adminSubcategories)
        : [],
    [products, allLabel, parentCategoryImage, adminSubcategories],
  );

  const packSizes = Array.from(
    new Set(products.map((p) => getProductPackLabel(p)).filter((u) => u.trim().length > 0)),
  ).slice(0, 6);

  const itemsCountLabel = screenConfig
    ? formatCategoryProductsTemplate(screenConfig.items_count_template, {
        category: displayTitle,
        count: filtered.length,
      })
    : '';

  const searchPlaceholder = screenConfig
    ? formatCategoryProductsTemplate(screenConfig.search_placeholder_template, {
        category: displayTitle,
      })
    : '';

  const cartCountLabel =
    totalCartCount === 1
      ? screenConfig?.cart_item_label ?? ''
      : screenConfig
        ? formatCategoryProductsTemplate(screenConfig.cart_items_template, { count: totalCartCount })
        : '';

  const sortOptions = screenConfig
    ? [
        { key: 'relevance' as const, label: screenConfig.filter_sort_relevance },
        { key: 'price_low' as const, label: screenConfig.filter_sort_price_low },
        { key: 'price_high' as const, label: screenConfig.filter_sort_price_high },
        { key: 'discount' as const, label: screenConfig.filter_sort_discount },
      ]
    : [];

  if (configError && !screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>
            Could not load product list screen. Check that the backend is running.
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

      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineSearch}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <HomeSearchIcon size={16} color={COLORS.ink300} />
          <Text style={styles.inlineSearchTxt} numberOfLines={1}>
            {searchPlaceholder}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
          <AppIcon
            name="cart"
            size={22}
            color={COLORS.ink900}
            badge={totalCartCount > 0 ? totalCartCount : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
            {sidebarTabs.map((tab) => {
              const active = activeSubCat === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.subCatItem, active && styles.subCatItemActive]}
                  onPress={() => setActiveSubCat(tab.key)}
                  activeOpacity={0.75}
                >
                  {active && <View style={styles.activeBar} />}
                  <View
                    style={[
                      styles.subCatTile,
                      active ? styles.subCatTileActive : styles.subCatTileInactive,
                    ]}
                  >
                    {tab.image_url ? (
                      <Image source={{ uri: tab.image_url }} style={styles.subCatThumb} resizeMode="contain" />
                    ) : null}
                  </View>
                  <Text style={[styles.subCatLabel, active && styles.subCatLabelActive]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.gridArea}>
          <View style={styles.sortRow}>
            <Text style={styles.sortRowTitle} numberOfLines={1}>
              {itemsCountLabel}
            </Text>
            <TouchableOpacity
              style={styles.sortPill}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.8}
            >
              <AppIcon name="trending-down" size={13} color={COLORS.ink700} />
              <Text style={styles.sortPillTxt}>{screenConfig?.sort_label}</Text>
            </TouchableOpacity>
          </View>

          {!hasDeliveryArea ? (
            <View style={styles.centeredState}>
              <Text style={styles.errorText}>{screenConfig?.location_required_message}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => navigation.navigate('CitySelection')}
                activeOpacity={0.85}
              >
                <Text style={styles.retryBtnText}>{screenConfig?.choose_location_label}</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.centeredState}>
              <AppLoader message="Loading items..." />
            </View>
          ) : productsError ? (
            <View style={styles.centeredState}>
              <Text style={styles.errorText}>{screenConfig?.load_error_message}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadProducts} activeOpacity={0.85}>
                <Text style={styles.retryBtnText}>{screenConfig?.retry_label}</Text>
              </TouchableOpacity>
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
                    addButtonLabel={screenConfig?.add_button_label}
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
                  <Text style={styles.emptyTxt}>{screenConfig?.empty_message}</Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {totalCartCount > 0 && (
        <TouchableOpacity
          style={[
            styles.floatingCart,
            { bottom: 44 + insets.bottom },
          ]}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeftGroup}>
            <View style={styles.floatingCartIcon}>
              <AppIcon name="cart" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.floatingCartTextCol}>
              <Text style={styles.floatingCartLabel}>{screenConfig?.view_cart_label || 'View cart'}</Text>
              <Text style={styles.floatingCartCount}>{cartCountLabel}</Text>
            </View>
          </View>
          <AppIcon name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilterModal(false)} activeOpacity={1} />

          <View style={styles.sheet}>
            <View style={styles.sheetHandleRow}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{screenConfig?.filter_sheet_title}</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowFilterModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="minus" size={18} color={COLORS.ink700} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetSectionWrap}>
              <Text style={styles.sheetSection}>{screenConfig?.filter_sort_section_label}</Text>
              <View style={styles.radioGroup}>
                {sortOptions.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={styles.radioRow}
                    onPress={() => setSortBy(r.key)}
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

            {packSizes.length > 0 && (
              <View style={styles.sheetSectionWrap}>
                <Text style={styles.sheetSection}>{screenConfig?.filter_pack_section_label}</Text>
                <View style={styles.chips}>
                  {packSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[styles.chip, selectedPackSize === size && styles.chipOn]}
                      onPress={() => setSelectedPackSize(selectedPackSize === size ? '' : size)}
                    >
                      <Text style={[styles.chipTxt, selectedPackSize === size && styles.chipTxtOn]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.sheetBtnsRow}>
              <TouchableOpacity style={styles.clearAllBtn} onPress={clearFilters} activeOpacity={0.85}>
                <Text style={styles.clearAllBtnTxt}>{screenConfig?.filter_clear_label}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnTxt}>{screenConfig?.filter_apply_label}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
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
  body: {
    flex: 1,
    flexDirection: 'row',
  },
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
    overflow: 'hidden',
  },
  subCatTileActive: {
    backgroundColor: COLORS.green50,
  },
  subCatTileInactive: {
    backgroundColor: '#FFFFFF',
  },
  subCatThumb: {
    width: 30,
    height: 30,
  },
  subCatLabel: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: SIDEBAR_W - 8,
  },
  subCatLabelActive: {
    color: COLORS.green700,
  },
  gridArea: {
    flex: 1,
  },
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
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 10,
    marginBottom: 12,
  },
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
  floatingCart: {
    position: 'absolute',
    left: 102,
    width: 167,
    height: 58,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 100,
    borderTopWidth: 1.5,
    borderTopColor: '#EAE9E2',
    backgroundColor: 'rgba(30, 122, 70, 0.90)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  floatingCartLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCartIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartTextCol: {
    justifyContent: 'center',
  },
  floatingCartLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  floatingCartCount: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 14,
  },
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
