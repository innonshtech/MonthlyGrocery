import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Modal,
  Switch,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function CategoryProductsScreen({ route, navigation }: any) {
  const { categoryName = 'Atta & Rice', categoryId } = route?.params || {};
  const { city, area } = useAuth();
  const { addToCart, items, updateQuantity, totalAmount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter & Sort State (B5)
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'discount'>('relevance');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [discountOnly, setDiscountOnly] = useState(false);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/all?limit=50`;
        const catQuery = categoryName || categoryId;
        if (catQuery && catQuery !== 'all') {
          url += `&category=${encodeURIComponent(catQuery)}`;
        }
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryId, categoryName, city, area]);

  const handleClearFilters = () => {
    setSortBy('relevance');
    setSelectedBrand('');
    setSelectedPriceRange('');
    setDiscountOnly(false);
  };

  // Dynamic Filtering & Sorting
  const filteredProducts = products.filter((p) => {
    if (selectedBrand && p.brand?.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }
    const price = parseFloat(p.price as any) || 0;
    if (selectedPriceRange === 'Under ₹200' && price >= 200) return false;
    if (selectedPriceRange === '₹200 - ₹500' && (price < 200 || price > 500)) return false;
    if (selectedPriceRange === '₹500 - ₹1,000' && (price < 500 || price > 1000)) return false;
    if (selectedPriceRange === '₹1,000+' && price < 1000) return false;
    if (discountOnly) {
      const mrp = parseFloat(p.mrp as any) || price;
      if (mrp <= price) return false;
    }
    return true;
  }).sort((a, b) => {
    const priceA = parseFloat(a.price as any) || 0;
    const priceB = parseFloat(b.price as any) || 0;
    if (sortBy === 'price_low') return priceA - priceB;
    if (sortBy === 'price_high') return priceB - priceA;
    if (sortBy === 'discount') {
      const discA = ((parseFloat(a.mrp as any) || priceA) - priceA);
      const discB = ((parseFloat(b.mrp as any) || priceB) - priceB);
      return discB - discA;
    }
    return 0;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP CATEGORY HEADER (B4)
         ========================================================================= */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.categoryHeaderTitle} numberOfLines={1}>
          {categoryName}
        </Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <AppIcon name="search" size={18} color={COLORS.ink700} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterBtnText}>⚙ Filter ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================================================================
         2. 2-COLUMN PRODUCT GRID (B4)
         ========================================================================= */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const mrpVal = parseFloat(item.mrp as any) || Math.round(Number(item.price) * 1.18);
            const priceVal = parseFloat(item.price as any) || 0;
            const diff = mrpVal - priceVal;
            const cartItem = items.find((i) => i.product?.id === item.id);
            const count = cartItem ? cartItem.quantity : 0;

            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                activeOpacity={0.8}
              >
                {/* Image Wrap */}
                <View style={styles.imageWrap}>
                  {diff > 0 && (
                    <View style={styles.savePill}>
                      <Text style={styles.savePillText}>SAVE ₹{diff}</Text>
                    </View>
                  )}

                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.productImg} resizeMode="contain" />
                  ) : (
                    <View style={styles.bagPlaceholder}>
                      <AppIcon name="shopping-bag" size={36} color={COLORS.green700} />
                    </View>
                  )}

                  {/* ADD / Stepper */}
                  {count > 0 ? (
                    <View style={styles.cardStepperWrap}>
                      <TouchableOpacity
                        style={styles.cardStepBtn}
                        onPress={() => updateQuantity(item.id, count - 1)}
                      >
                        <Text style={styles.cardStepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.cardStepCountText}>{count}</Text>
                      <TouchableOpacity
                        style={styles.cardStepBtn}
                        onPress={() => addToCart(item)}
                      >
                        <Text style={styles.cardStepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addPillBtn}
                      onPress={() => addToCart(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addPillText}>ADD</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Product Info */}
                <Text style={styles.productPackSize}>{item.unit || '1 unit'}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>₹{item.price}</Text>
                  {mrpVal > priceVal && (
                    <Text style={styles.originalPrice}>₹{mrpVal}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyMsg}>No products found in this category.</Text>
            </View>
          }
        />
      )}

      {/* =========================================================================
         3. STICKY FLOATING BOTTOM CART BAR (B4)
         ========================================================================= */}
      {totalCartCount > 0 && (
        <View style={styles.floatingCartWrap}>
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartBarLeft}>
              <Text style={styles.cartBarItemsText}>
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} · ₹{totalAmount}
              </Text>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.viewCartText}>View cart ›</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* =========================================================================
         4. B5 · FILTER & SORT MODAL BOTTOM SHEET
         ========================================================================= */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowFilterModal(false)}
            activeOpacity={1}
          />

          <View style={styles.sheetContainer}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort & filter</Text>
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            {/* SORT BY */}
            <Text style={styles.sheetSectionLabel}>SORT BY</Text>
            <View style={styles.radioGroup}>
              {[
                { key: 'relevance', label: 'Relevance' },
                { key: 'price_low', label: 'Price — low to high' },
                { key: 'price_high', label: 'Price — high to low' },
                { key: 'discount', label: 'Discount — high to low' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={styles.radioRow}
                  onPress={() => setSortBy(r.key as any)}
                >
                  <View style={[styles.radioCircle, sortBy === r.key && styles.radioCircleActive]}>
                    {sortBy === r.key && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text style={[styles.radioLabel, sortBy === r.key && styles.radioLabelActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BRAND */}
            <Text style={styles.sheetSectionLabel}>BRAND</Text>
            <View style={styles.chipsWrap}>
              {['Aashirvaad', 'Fortune', 'India Gate', 'Tata Sampann', 'Daawat', 'Amul'].map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={[styles.filterChip, selectedBrand.toLowerCase() === brand.toLowerCase() && styles.filterChipActive]}
                  onPress={() => setSelectedBrand(selectedBrand.toLowerCase() === brand.toLowerCase() ? '' : brand)}
                >
                  <Text style={[styles.filterChipText, selectedBrand.toLowerCase() === brand.toLowerCase() && styles.filterChipTextActive]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* PRICE */}
            <Text style={styles.sheetSectionLabel}>PRICE</Text>
            <View style={styles.chipsWrap}>
              {['Under ₹200', '₹200 - ₹500', '₹500 - ₹1,000', '₹1,000+'].map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[styles.filterChip, selectedPriceRange === price && styles.filterChipActive]}
                  onPress={() => setSelectedPriceRange(selectedPriceRange === price ? '' : price)}
                >
                  <Text style={[styles.filterChipText, selectedPriceRange === price && styles.filterChipTextActive]}>
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ONLY SHOW DISCOUNTED ITEMS TOGGLE */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Only show discounted items</Text>
              <Switch
                value={discountOnly}
                onValueChange={setDiscountOnly}
                trackColor={{ false: COLORS.line, true: COLORS.green600 }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* APPLY BUTTON */}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>
                Apply · {filteredProducts.length} items
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  categoryHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    paddingHorizontal: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: {
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green700,
  },
  productsGrid: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 80,
  },
  productCard: {
    width: (width - 24 - 10) / 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md, // 12px
    padding: 10,
    margin: 5,
  },
  imageWrap: {
    width: '100%',
    height: 125,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  savePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.marigold500, // #F5A524
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    zIndex: 2,
  },
  savePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  productImg: {
    width: 80,
    height: 80,
  },
  bagPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPillBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 3,
  },
  addPillText: {
    color: COLORS.green700,
    fontSize: 11,
    fontWeight: '800',
  },
  cardStepperWrap: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    height: 26,
    paddingHorizontal: 4,
    zIndex: 3,
  },
  cardStepBtn: {
    width: 18,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStepBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardStepCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  productPackSize: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink500,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 4,
    minHeight: 34,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  originalPrice: {
    fontSize: 11.5,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyMsg: {
    fontSize: 14,
    color: COLORS.ink500,
  },
  /* Floating Bottom Cart Bar */
  floatingCartWrap: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingCartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.green700, // #1E7A46
    height: 52,
    borderRadius: RADIUS.pill, // 999px
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBarLeft: {},
  cartBarItemsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartBarRight: {},
  viewCartText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  /* B5 Filter & Sort Sheet */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green700,
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },
  radioGroup: {
    gap: 10,
    marginBottom: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  radioCircleActive: {
    borderColor: COLORS.green700,
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.green700,
  },
  radioLabel: {
    fontSize: 13.5,
    color: COLORS.ink700,
  },
  radioLabelActive: {
    fontWeight: '600',
    color: COLORS.ink900,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  applyBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
