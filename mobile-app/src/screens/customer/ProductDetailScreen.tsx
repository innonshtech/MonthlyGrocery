import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart, Product } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const PACK_SIZES = [
  { size: '1 kg', multiplier: 0.22 },
  { size: '5 kg', multiplier: 1.0 },
  { size: '10 kg', multiplier: 1.95 },
];

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  const { items, addToCart, updateQuantity } = useCart();
  const { city, area } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackIndex, setSelectedPackIndex] = useState(1); // 5 kg default
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/products/all?limit=100`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.products) {
          const found = data.products.find((p: any) => p.id === productId);
          if (found) {
            setProduct(found);
          } else {
            // Default sample product if not found
            setProduct({
              id: productId || 'p-default',
              shop_id: 'shop-1',
              name: 'Aashirvaad Select Atta',
              brand: 'Aashirvaad',
              primary_category: 'Atta, Rice & Dals',
              image_url: '',
              unit: '5 kg pack',
              mrp: 310,
              price: 255,
            });
          }
        }
      } catch (err) {
        setProduct({
          id: productId || 'p-default',
          shop_id: 'shop-1',
          name: 'Aashirvaad Select Atta',
          brand: 'Aashirvaad',
          primary_category: 'Atta, Rice & Dals',
          image_url: '',
          unit: '5 kg pack',
          mrp: 310,
          price: 255,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, city, area]);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.green700} />
      </SafeAreaView>
    );
  }

  const basePrice = parseFloat(product.price as any) || 255;
  const baseMrp = parseFloat(product.mrp as any) || Math.round(basePrice * 1.22);
  const multiplier = PACK_SIZES[selectedPackIndex].multiplier;
  const currentPrice = Math.round(basePrice * multiplier);
  const currentMrp = Math.round(baseMrp * multiplier);
  const diffSavings = currentMrp - currentPrice;
  const discountPercent = Math.round((diffSavings / currentMrp) * 100);

  const activePackUnit = PACK_SIZES[selectedPackIndex].size;
  const currentProductObj: Product = {
    ...product,
    unit: activePackUnit,
    price: currentPrice,
    mrp: currentMrp,
  };

  const cartItem = items.find((i) => i.product?.id === product.id);
  const cartCount = cartItem ? cartItem.quantity : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP HEADER ROW (Back + Favorite)
         ========================================================================= */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.favBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.favIcon, isFavorite && styles.favIconActive]}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           2. HERO IMAGE CONTAINER (C1)
           ========================================================================= */}
        <View style={styles.heroBox}>
          {/* Top-Left Savings Pill */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
          </View>

          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.heroImg} resizeMode="contain" />
          ) : (
            <View style={styles.heroBagPlaceholder}>
              <AppIcon name="shopping-bag" size={72} color={COLORS.green700} />
            </View>
          )}
        </View>

        {/* =========================================================================
           3. PRODUCT INFO & PRICING
           ========================================================================= */}
        <View style={styles.infoSection}>
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.productSubtitle}>
            Whole wheat · {activePackUnit} pack
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrent}>₹{currentPrice}</Text>
            <Text style={styles.priceMrp}>₹{currentMrp}</Text>
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>Save ₹{diffSavings}</Text>
            </View>
          </View>
        </View>

        {/* =========================================================================
           4. PACK SIZE SELECTOR
           ========================================================================= */}
        <View style={styles.packSection}>
          <Text style={styles.sectionLabel}>Pack size</Text>
          <View style={styles.packPillsRow}>
            {PACK_SIZES.map((pack, idx) => {
              const isSelected = selectedPackIndex === idx;
              return (
                <TouchableOpacity
                  key={pack.size}
                  style={[styles.packPill, isSelected && styles.packPillSelected]}
                  onPress={() => setSelectedPackIndex(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.packPillText, isSelected && styles.packPillTextSelected]}>
                    {pack.size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* =========================================================================
           5. MONTHLY INSIGHT ADVICE BOX
           ========================================================================= */}
        <View style={styles.adviceBox}>
          <View style={styles.adviceHeaderRow}>
            <Text style={styles.adviceIcon}>💡</Text>
            <Text style={styles.adviceHeading}>Buying for the month?</Text>
          </View>
          <Text style={styles.adviceText}>
            Most 3-4 person homes in {area || 'Kothrud'} get 2 for a full month.
          </Text>
        </View>

        {/* =========================================================================
           6. "WHY YOU'LL LIKE IT" CHECKLIST
           ========================================================================= */}
        <View style={styles.checklistSection}>
          <Text style={styles.sectionLabel}>Why you'll like it</Text>
          <View style={styles.checkItem}>
            <Text style={styles.checkTick}>✓</Text>
            <Text style={styles.checkText}>Chakki-fresh whole wheat, no maida</Text>
          </View>
          <View style={styles.checkItem}>
            <Text style={styles.checkTick}>✓</Text>
            <Text style={styles.checkText}>Milled in small batches for softer rotis</Text>
          </View>
          <View style={styles.checkItem}>
            <Text style={styles.checkTick}>✓</Text>
            <Text style={styles.checkText}>Best before 6 months from packing</Text>
          </View>
        </View>
      </ScrollView>

      {/* =========================================================================
         7. STICKY BOTTOM ACTION BAR (C1)
         ========================================================================= */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomPrice}>₹{currentPrice}</Text>
          <Text style={styles.bottomStockLabel}>{activePackUnit} · In stock</Text>
        </View>

        {cartCount > 0 ? (
          <View style={styles.bottomStepper}>
            <TouchableOpacity
              style={styles.bottomStepBtn}
              onPress={() => updateQuantity(product.id, cartCount - 1)}
            >
              <Text style={styles.bottomStepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.bottomStepCountText}>{cartCount}</Text>
            <TouchableOpacity
              style={styles.bottomStepBtn}
              onPress={() => addToCart(currentProductObj)}
            >
              <Text style={styles.bottomStepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={() => addToCart(currentProductObj)}
            activeOpacity={0.85}
          >
            <Text style={styles.addToCartBtnText}>Add to cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 34,
  },
  favBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  favIcon: {
    fontSize: 24,
    color: COLORS.ink500,
  },
  favIconActive: {
    color: COLORS.error,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroBox: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg, // 16px
    backgroundColor: COLORS.green50, // #F2F9F5
    borderWidth: 1,
    borderColor: COLORS.green100, // #E4F3EA
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 18,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.marigold500, // #F5A524
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    zIndex: 2,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  heroImg: {
    width: 140,
    height: 140,
  },
  heroBagPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  productSubtitle: {
    fontSize: 13.5,
    color: COLORS.ink500,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceCurrent: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  priceMrp: {
    fontSize: 14,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
  savePill: {
    backgroundColor: COLORS.marigold100, // #FDEFD3
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
  },
  savePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.marigold700, // #8A5200
  },
  packSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink700,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  packPill: {
    flex: 1,
    height: 42,
    borderRadius: RADIUS.md, // 12px
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packPillSelected: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green50,
  },
  packPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  packPillTextSelected: {
    color: COLORS.green700,
    fontWeight: '800',
  },
  adviceBox: {
    backgroundColor: COLORS.green50, // #F2F9F5
    borderWidth: 1,
    borderColor: COLORS.green100, // #E4F3EA
    borderRadius: RADIUS.md, // 12px
    padding: 14,
    marginBottom: 22,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  adviceIcon: {
    fontSize: 14,
  },
  adviceHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  adviceText: {
    fontSize: 12.5,
    color: COLORS.ink700,
    lineHeight: 18,
  },
  checklistSection: {
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkTick: {
    fontSize: 14,
    color: COLORS.green700,
    fontWeight: '800',
  },
  checkText: {
    fontSize: 13,
    color: COLORS.ink700,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  bottomBarLeft: {},
  bottomPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  bottomStockLabel: {
    fontSize: 11.5,
    color: COLORS.green700,
    fontWeight: '600',
  },
  addToCartBtn: {
    backgroundColor: COLORS.green700, // #1E7A46
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    height: 40,
    paddingHorizontal: 6,
  },
  bottomStepBtn: {
    width: 30,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomStepBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomStepCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
});
