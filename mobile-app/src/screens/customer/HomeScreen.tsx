import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon, { IconName } from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  name: string;
  icon: IconName;
}

const CATEGORIES_LIST: CategoryItem[] = [
  { id: 'atta-rice', name: 'Atta & Rice', icon: 'cat-atta-rice' },
  { id: 'oils-ghee', name: 'Oils & Ghee', icon: 'cat-oils-ghee' },
  { id: 'dals-pulses', name: 'Dals & Pulses', icon: 'cat-dals-pulses' },
  { id: 'spices-masala', name: 'Masalas', icon: 'cat-spices-masala' },
  { id: 'snacks', name: 'Snacks', icon: 'cat-snacks' },
  { id: 'beverages', name: 'Beverages', icon: 'cat-beverages' },
  { id: 'cleaning', name: 'Cleaning', icon: 'cat-cleaning' },
  { id: 'personal-care', name: 'Personal Care', icon: 'cat-personal-care' },
];

export default function HomeScreen({ navigation }: any) {
  const { city, area } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const displayLocation = area ? `${area}, ${city || 'Pune'}` : (city || 'Kothrud, Pune');

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        let url = `${API_BASE}/products/all?limit=6`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (area) url += `&area_name=${encodeURIComponent(area)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [city, area]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* =========================================================================
         1. TOP LOCATION & PROFILE BAR
         ========================================================================= */}
      <View style={styles.topHeaderRow}>
        <TouchableOpacity 
          style={styles.locationDropdown}
          onPress={() => navigation.navigate('CitySelection')}
          activeOpacity={0.75}
        >
          <Text style={styles.deliverToLabel}>DELIVER TO</Text>
          <View style={styles.locationTitleRow}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {displayLocation}
            </Text>
            <Text style={styles.locationChevron}>⌄</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.profileAvatarBtn}
          onPress={() => navigation.navigate('Account')}
        >
          <View style={styles.avatarCircle}>
            <AppIcon name="user" size={18} color={COLORS.ink700} />
          </View>
        </TouchableOpacity>
      </View>

      {/* =========================================================================
         2. SEARCH BAR (Taps to B2 Search Screen)
         ========================================================================= */}
      <TouchableOpacity 
        style={styles.searchBarBtn}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.85}
      >
        <AppIcon name="search" size={18} color={COLORS.ink300} />
        <Text style={styles.searchPlaceholder}>Search for atta, rice, oil...</Text>
      </TouchableOpacity>

      {/* =========================================================================
         3. ❖ MY MONTHLY GROCERY MAGIC CTA BANNER
         ========================================================================= */}
      <TouchableOpacity 
        style={styles.magicCtaBanner}
        onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
        activeOpacity={0.85}
      >
        <View style={styles.magicLeft}>
          <Text style={styles.magicSparkle}>✦</Text>
          <View>
            <Text style={styles.magicTitle}>My Monthly Grocery</Text>
            <Text style={styles.magicSubtitle}>Build this month's basket in one tap</Text>
          </View>
        </View>
        <Text style={styles.magicArrow}>›</Text>
      </TouchableOpacity>

      {/* =========================================================================
         4. MONTHLY SAVINGS HIGHLIGHT CARD (SIGNATURE SHOWPIECE)
         ========================================================================= */}
      <View style={styles.savingsCard}>
        <View style={styles.savingsLeft}>
          <Text style={styles.savingsLabel}>SAVED THIS MONTH</Text>
          <Text style={styles.savingsAmount}>₹1,240</Text>
          <Text style={styles.savingsSubtitle}>across 3 monthly orders</Text>
        </View>

        <View style={styles.coinCircle}>
          <Text style={styles.coinSymbol}>₹</Text>
        </View>
      </View>

      {/* =========================================================================
         5. DUAL QUICK ACTION CARDS (Reorder & Saved Baskets)
         ========================================================================= */}
      <View style={styles.dualCardsRow}>
        {/* Left: Reorder Last Basket */}
        <TouchableOpacity 
          style={styles.quickCard}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
          activeOpacity={0.8}
        >
          <View style={styles.quickIconCircle}>
            <Text style={styles.quickIcon}>↻</Text>
          </View>
          <Text style={styles.quickTitle}>Reorder last basket</Text>
          <Text style={styles.quickSubtitle}>28 items · ₹3,120</Text>
        </TouchableOpacity>

        {/* Right: Saved Baskets */}
        <TouchableOpacity 
          style={styles.quickCard}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
          activeOpacity={0.8}
        >
          <View style={styles.quickIconCircle}>
            <Text style={styles.quickIcon}>🔖</Text>
          </View>
          <Text style={styles.quickTitle}>Saved baskets</Text>
          <Text style={styles.quickSubtitle}>3 saved</Text>
        </TouchableOpacity>
      </View>

      {/* =========================================================================
         6. SHOP BY CATEGORY GRID (Clean Line Vectors from Design System)
         ========================================================================= */}
      <View style={styles.categorySection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAllText}>See all ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORIES_LIST.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => navigation.navigate('CategoryProducts', { categoryId: cat.id, categoryName: cat.name })}
              activeOpacity={0.75}
            >
              <View style={styles.categoryCircle}>
                <AppIcon name={cat.icon} size={24} color={COLORS.green700} />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* =========================================================================
         7. MONTHLY ESSENTIALS / PRODUCT CARDS
         ========================================================================= */}
      <View style={styles.dealsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Monthly Essentials</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAllText}>See all ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {products.map((item) => {
            const mrpVal = parseFloat(item.mrp as any) || Math.round(Number(item.price) * 1.18);
            const priceVal = parseFloat(item.price as any) || 0;
            const diff = mrpVal - priceVal;
            const cartItem = items.find((i) => i.product?.id === item.id);
            const count = cartItem ? cartItem.quantity : 0;

            return (
              <TouchableOpacity 
                key={item.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                activeOpacity={0.8}
              >
                {/* Image Wrap with Signature Marigold Savings Pill */}
                <View style={styles.imageWrap}>
                  <View style={styles.savePill}>
                    <Text style={styles.savePillText}>SAVE ₹{diff > 0 ? diff : 58}</Text>
                  </View>

                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.productImg} resizeMode="contain" />
                  ) : (
                    <View style={styles.bagPlaceholder}>
                      <AppIcon name="shopping-bag" size={34} color={COLORS.green700} />
                    </View>
                  )}
                </View>

                {/* Product Info */}
                <Text style={styles.productPackSize}>{item.unit || '5 kg'}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

                <View style={styles.priceRow}>
                  <View style={styles.priceCol}>
                    <Text style={styles.currentPrice}>₹{item.price}</Text>
                    <Text style={styles.originalPrice}>₹{mrpVal}</Text>
                  </View>

                  {/* Add Button or Stepper */}
                  {count > 0 ? (
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity 
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.id, count - 1)}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepCountText}>{count}</Text>
                      <TouchableOpacity 
                        style={styles.stepBtn}
                        onPress={() => addToCart(item)}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addBtn}
                      onPress={() => addToCart(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addBtnText}>ADD</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  /* Top Location Bar */
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationDropdown: {
    flex: 1,
  },
  deliverToLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.ink500, // #6B7772
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900, // #17251E
  },
  locationChevron: {
    fontSize: 14,
    color: COLORS.ink900,
    fontWeight: 'bold',
  },
  profileAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Search Bar */
  searchBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface, // #FFFFFF
    borderWidth: 1.5,
    borderColor: COLORS.line, // #EAE9E2
    borderRadius: RADIUS.md, // 12px
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.ink300, // #A7B0AB
  },
  /* Magic CTA Banner */
  magicCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.green700, // #1E7A46
    borderRadius: RADIUS.lg, // 16px
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  magicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  magicSparkle: {
    fontSize: 20,
    color: COLORS.marigold500, // #F5A524
    fontWeight: 'bold',
  },
  magicTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  magicSubtitle: {
    fontSize: 11.5,
    color: COLORS.green100,
    marginTop: 2,
  },
  magicArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  /* Savings Highlight Card */
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.green800, // #155A38
    borderRadius: RADIUS.lg,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
  },
  savingsLeft: {
    gap: 2,
  },
  savingsLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.green100,
    letterSpacing: 0.8,
  },
  savingsAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  savingsSubtitle: {
    fontSize: 11.5,
    color: COLORS.green100,
  },
  coinCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.marigold500, // #F5A524
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.marigold200,
  },
  coinSymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.marigold700,
  },
  /* Dual Action Cards */
  dualCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface, // #FFFFFF
    borderWidth: 1,
    borderColor: COLORS.line, // #EAE9E2
    borderRadius: RADIUS.md,
    padding: 14,
  },
  quickIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickIcon: {
    fontSize: 16,
    color: COLORS.ink900,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  quickSubtitle: {
    fontSize: 11,
    color: COLORS.ink500,
  },
  /* Shop By Category */
  categorySection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryItem: {
    width: (width - 36 - 30) / 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.md, // 12px tile
    backgroundColor: COLORS.green50, // #F2F9F5
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.green100, // #E4F3EA
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink700,
    textAlign: 'center',
  },
  /* Monthly Essentials / Product Grid */
  dealsSection: {
    marginBottom: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: (width - 36 - 12) / 2,
    backgroundColor: COLORS.surface, // #FFFFFF
    borderWidth: 1,
    borderColor: COLORS.line, // #EAE9E2
    borderRadius: RADIUS.md, // 12px
    padding: 10,
    marginBottom: 12,
  },
  imageWrap: {
    width: '100%',
    height: 120,
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
    backgroundColor: COLORS.marigold500, // Exact #F5A524
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    zIndex: 2,
  },
  savePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ink900, // #17251E
  },
  productImg: {
    width: 80,
    height: 80,
  },
  bagPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 6,
    minHeight: 34,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
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
  addBtn: {
    backgroundColor: COLORS.green50, // #F2F9F5
    borderWidth: 1.5,
    borderColor: COLORS.green600, // #2A8B54
    borderRadius: RADIUS.sm, // 8px
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addBtnText: {
    color: COLORS.green700, // #1E7A46
    fontSize: 12,
    fontWeight: '800',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700, // #1E7A46
    borderRadius: RADIUS.sm, // 8px
    height: 28,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 20,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
});
