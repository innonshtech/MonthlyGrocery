import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon, { IconName } from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const H_PAD = 14;
const CONTENT_W = width - H_PAD * 2;
const CAT_SIZE = 80;
const CAT_GAP = 10;
const DEAL_W = 150;
const DEAL_H = 227;

interface CategoryItem {
  id: string;
  name: string;
  icon: IconName;
  emoji: string;
}

function getCategoryIcon(name: string): IconName {
  const norm = name.toLowerCase().trim();
  if (norm.includes('atta') || norm.includes('rice')) return 'cat-atta-rice';
  if (norm.includes('oil') || norm.includes('ghee')) return 'cat-oils-ghee';
  if (norm.includes('dal') || norm.includes('pulse')) return 'cat-dals-pulses';
  if (norm.includes('spice') || norm.includes('masala')) return 'cat-spices-masala';
  if (norm.includes('snack')) return 'cat-snacks';
  if (norm.includes('beverage') || norm.includes('drink') || norm.includes('tea')) return 'cat-beverages';
  if (norm.includes('dairy') || norm.includes('milk') || norm.includes('egg')) return 'cat-baby-care';
  if (norm.includes('clean') || norm.includes('home')) return 'cat-cleaning';
  return 'shopping-bag';
}

function getCategoryEmoji(name: string): string {
  const norm = name.toLowerCase().trim();
  if (norm.includes('atta') || norm.includes('rice')) return '🌾';
  if (norm.includes('oil') || norm.includes('ghee')) return '🫒';
  if (norm.includes('dal') || norm.includes('pulse')) return '🫘';
  if (norm.includes('masala') || norm.includes('spice')) return '🧂';
  if (norm.includes('snack')) return '🍪';
  if (norm.includes('beverage') || norm.includes('drink')) return '🥤';
  if (norm.includes('dairy') || norm.includes('milk') || norm.includes('egg')) return '🥛';
  if (norm.includes('clean') || norm.includes('home')) return '🧹';
  return '🛒';
}

const fallbackCategories: CategoryItem[] = [
  { id: 'atta-rice', name: 'Atta & Rice', icon: 'cat-atta-rice', emoji: '🌾' },
  { id: 'oils-ghee', name: 'Oils & Ghee', icon: 'cat-oils-ghee', emoji: '🫒' },
  { id: 'dals-pulses', name: 'Dals & Pulses', icon: 'cat-dals-pulses', emoji: '🫘' },
  { id: 'masala', name: 'Masala', icon: 'cat-spices-masala', emoji: '🧂' },
  { id: 'snacks', name: 'Snacks', icon: 'cat-snacks', emoji: '🍪' },
  { id: 'beverages', name: 'Beverages', icon: 'cat-beverages', emoji: '🥤' },
  { id: 'dairy-eggs', name: 'Dairy & Eggs', icon: 'cat-baby-care', emoji: '🥛' },
  { id: 'cleaning-home', name: 'Cleaning & Home', icon: 'cat-cleaning', emoji: '🧹' },
];

export default function HomeScreen({ navigation, setActiveTab }: any) {
  const insets = useSafeAreaInsets();
  const { city, area, token, user } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState<{
    orderCount: number;
    lastOrder: any | null;
  }>({ orderCount: 0, lastOrder: null });

  const displayLocation = area
    ? `Home · ${area}, ${city || 'Pune'}`
    : `Home · ${city || 'Kothrud, Pune'}`;
  const userInitial = (user?.name?.trim()?.[0] || 'A').toUpperCase();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/categories`);
        const data = await res.json();
        if (res.ok && data.success && data.categories) {
          const mapped: CategoryItem[] = data.categories
            .slice(0, 8)
            .map((name: string, index: number) => ({
              id: `cat-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              name,
              icon: getCategoryIcon(name),
              emoji: getCategoryEmoji(name),
            }));
          if (mapped.length > 0) setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        let url = `${API_BASE}/products/all?limit=8`;
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

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!token) {
        setOrderStats({ orderCount: 0, lastOrder: null });
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setOrderStats({ orderCount: data.orders.length, lastOrder: data.orders[0] });
        } else {
          setOrderStats({ orderCount: 0, lastOrder: null });
        }
      } catch (err) {
        console.error('Failed to fetch user order stats:', err);
      }
    };
    fetchUserStats();
  }, [token]);

  const openAccount = () => {
    if (setActiveTab) setActiveTab('Account');
    else navigation.navigate('Account');
  };

  const renderDealCard = (item: Product) => {
    const mrpVal = parseFloat(item.mrp as any) || Math.round(Number(item.price) * 1.18);
    const priceVal = parseFloat(item.price as any) || 0;
    const pctOff = mrpVal > 0 ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;
    const cartItem = items.find((i) => i.product?.id === item.id);
    const count = cartItem ? cartItem.quantity : 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.dealCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.dealImageWrap}>
          {pctOff > 0 && (
            <View style={styles.dealBadge}>
              <Text style={styles.dealBadgeText}>{pctOff}% OFF</Text>
            </View>
          )}
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.dealImg} resizeMode="contain" />
          ) : (
            <Text style={styles.dealEmoji}>🛒</Text>
          )}
        </View>
        <Text style={styles.dealName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.dealUnit}>{item.unit || '5 kg'}</Text>
        <View style={styles.dealPriceRow}>
          <View style={styles.dealPriceCol}>
            <Text style={styles.dealPrice}>₹{priceVal}</Text>
            {mrpVal > priceVal && <Text style={styles.dealMrp}>₹{mrpVal}</Text>}
          </View>
          {count > 0 ? (
            <View style={styles.dealStepper}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, count - 1)}>
                <Text style={styles.dealStepBtn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.dealStepCount}>{count}</Text>
              <TouchableOpacity onPress={() => addToCart(item)}>
                <Text style={styles.dealStepBtn}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.dealAddBtn} onPress={() => addToCart(item)}>
              <Text style={styles.dealAddText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const lastOrderItems = orderStats.lastOrder?.order_items?.length || 24;
  const lastOrderTotal = orderStats.lastOrder?.total_amount || 2880;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Green header (Figma: 390×470) ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.locationBlock}
            onPress={() => navigation.navigate('CitySelection')}
            activeOpacity={0.75}
          >
            <Text style={styles.deliveringLabel}>DELIVERING TO</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {displayLocation}
              </Text>
              <Text style={styles.locationChevron}>⌄</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarBtn} onPress={openAccount}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deliveryPill}>
          <AppIcon name="truck" size={13} color="#FFFFFF" />
          <Text style={styles.deliveryPillText}>Planned monthly delivery · 4-hour window</Text>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.85}
        >
          <AppIcon name="search" size={18} color={COLORS.ink300} />
          <Text style={styles.searchPlaceholder}>Search atta, rice, oil…</Text>
          <AppIcon name="sparkles" size={18} color={COLORS.green700} />
        </TouchableOpacity>

        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoLabel}>MONTHLY SAVINGS SALE</Text>
            <Text style={styles.promoTitle}>Up to ₹500 off</Text>
            <Text style={styles.promoSub}>on your full monthly basket</Text>
            <TouchableOpacity
              style={styles.promoBtn}
              onPress={() => navigation.navigate('OffersCoupons')}
              activeOpacity={0.85}
            >
              <Text style={styles.promoBtnText}>Grab deals</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoEmojis}>
            <Text style={[styles.promoEmoji, { top: 22, left: 8, fontSize: 44 }]}>🫘</Text>
            <Text style={[styles.promoEmoji, { top: 4, left: 38, fontSize: 42 }]}>🫒</Text>
            <Text style={[styles.promoEmoji, { top: 38, left: 42, fontSize: 38 }]}>🍚</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.mmgCard}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
          activeOpacity={0.85}
        >
          <View style={styles.mmgIconWrap}>
            <AppIcon name="sparkles" size={24} color={COLORS.green700} />
          </View>
          <View style={styles.mmgTextCol}>
            <Text style={styles.mmgLabel}>MY MONTHLY GROCERY</Text>
            <Text style={styles.mmgTitle}>Build your month in one tap</Text>
            <Text style={styles.mmgSub}>A smart basket from what your home buys</Text>
          </View>
          <View style={styles.mmgArrow}>
            <AppIcon name="arrow-right" size={18} color={COLORS.green700} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── White content sheet (Figma: content from y=470) ── */}
      <View style={styles.contentSheet}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.catGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catItem}
              onPress={() =>
                navigation.navigate('CategoryProducts', {
                  categoryId: cat.id,
                  categoryName: cat.name,
                })
              }
              activeOpacity={0.75}
            >
              <View style={styles.catTile}>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={styles.catName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 6 }]}>
          <Text style={styles.sectionTitle}>Deals of the month</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading deals…</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealsRail}
          >
            {products.map((item) => renderDealCard(item))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.reorderCard}
          onPress={() =>
            orderStats.orderCount > 0
              ? navigation.navigate('CopyLastMonth')
              : navigation.navigate('OneClickCart')
          }
          activeOpacity={0.85}
        >
          <View style={styles.reorderAvatars}>
            <View style={[styles.reorderAvatar, { zIndex: 3 }]}>
              <Text style={styles.reorderAvatarEmoji}>🌾</Text>
            </View>
            <View style={[styles.reorderAvatar, styles.reorderAvatarOverlap, { zIndex: 2 }]}>
              <Text style={styles.reorderAvatarEmoji}>🫒</Text>
            </View>
            <View style={[styles.reorderAvatar, styles.reorderAvatarOverlap, { zIndex: 1 }]}>
              <Text style={styles.reorderAvatarEmoji}>🫘</Text>
            </View>
          </View>
          <View style={styles.reorderTextCol}>
            <Text style={styles.reorderTitle}>
              {orderStats.orderCount > 0 ? 'Reorder last month' : 'Build your first basket'}
            </Text>
            <Text style={styles.reorderSub}>
              {orderStats.orderCount > 0
                ? `${lastOrderItems} items · ₹${Number(lastOrderTotal).toLocaleString('en-IN')}`
                : 'Curated essentials for your home'}
            </Text>
          </View>
          <View style={styles.reorderBtn}>
            <Text style={styles.reorderBtnText}>
              {orderStats.orderCount > 0 ? 'Reorder' : 'Start'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.green800,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    backgroundColor: COLORS.green800,
    paddingHorizontal: H_PAD,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationBlock: {
    flex: 1,
    marginRight: 12,
  },
  deliveringLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: width * 0.6,
  },
  locationChevron: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: -2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.green700,
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  deliveryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    height: 50,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink300,
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.marigold100,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    minHeight: 130,
    overflow: 'hidden',
  },
  promoLeft: {
    flex: 1,
    paddingRight: 4,
  },
  promoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.marigold700,
    letterSpacing: 0.4,
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink900,
    letterSpacing: -0.5,
    lineHeight: 32,
    marginTop: 2,
  },
  promoSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.marigold700,
    marginTop: 4,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  promoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green700,
  },
  promoEmojis: {
    width: 90,
    height: 80,
    position: 'relative',
    alignSelf: 'center',
  },
  promoEmoji: {
    position: 'absolute',
  },
  mmgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 20,
    minHeight: 100,
    gap: 12,
  },
  mmgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mmgTextCol: {
    flex: 1,
  },
  mmgLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.green700,
    letterSpacing: 0.5,
  },
  mmgTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginTop: 2,
    lineHeight: 22,
  },
  mmgSub: {
    fontSize: 11,
    color: COLORS.ink500,
    marginTop: 2,
    lineHeight: 15,
  },
  mmgArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -4,
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 8,
    minHeight: 400,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink900,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: CAT_GAP,
    rowGap: 14,
    marginBottom: 20,
    width: CONTENT_W,
  },
  catItem: {
    width: CAT_SIZE,
    alignItems: 'center',
  },
  catTile: {
    width: CAT_SIZE,
    height: 72,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  catEmoji: {
    fontSize: 34,
  },
  catName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink700,
    textAlign: 'center',
    lineHeight: 14,
    width: CAT_SIZE,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.ink500,
    marginBottom: 20,
  },
  dealsRail: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 18,
  },
  dealCard: {
    width: DEAL_W,
    height: DEAL_H,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 8,
  },
  dealImageWrap: {
    width: '100%',
    height: 96,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  dealBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.marigold500,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 2,
  },
  dealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  dealImg: {
    width: 60,
    height: 60,
  },
  dealEmoji: {
    fontSize: 40,
  },
  dealName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink900,
    lineHeight: 16,
    height: 40,
    marginBottom: 2,
  },
  dealUnit: {
    fontSize: 11,
    color: COLORS.ink500,
    marginBottom: 6,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dealPriceCol: {
    height: 34,
    justifyContent: 'center',
  },
  dealPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
    lineHeight: 18,
  },
  dealMrp: {
    fontSize: 11,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
    lineHeight: 14,
  },
  dealAddBtn: {
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    height: 32,
    justifyContent: 'center',
  },
  dealAddText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.green700,
  },
  dealStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 4,
    height: 32,
    gap: 2,
  },
  dealStepBtn: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  dealStepCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  reorderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.green100,
    paddingHorizontal: 12,
    paddingVertical: 20,
    minHeight: 100,
    marginBottom: 8,
  },
  reorderAvatars: {
    flexDirection: 'row',
    width: 76,
  },
  reorderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderAvatarOverlap: {
    marginLeft: -18,
  },
  reorderAvatarEmoji: {
    fontSize: 18,
  },
  reorderTextCol: {
    flex: 1,
    marginLeft: 8,
  },
  reorderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  reorderSub: {
    fontSize: 11,
    color: COLORS.ink500,
    marginTop: 2,
  },
  reorderBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 36,
    justifyContent: 'center',
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
