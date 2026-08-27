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
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

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
  image_url?: string;
}

interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  action_link?: string;
  active: boolean;
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

function getCategoryBgColor(name: string): string {
  const norm = name.toLowerCase().trim();
  if (norm.includes('atta') || norm.includes('rice')) return '#FFF9E5'; // Soft yellow tint
  if (norm.includes('oil') || norm.includes('ghee')) return '#EAF5EE'; // Soft green tint
  if (norm.includes('dal') || norm.includes('pulse')) return '#FCECE9'; // Soft red/orange tint
  if (norm.includes('spice') || norm.includes('masala')) return '#F0F3F7'; // Soft blue/grey tint
  if (norm.includes('snack')) return '#F7EFE4'; // Soft beige tint
  if (norm.includes('beverage') || norm.includes('drink')) return '#FDF1E5'; // Soft orange/peach tint
  if (norm.includes('dairy') || norm.includes('milk') || norm.includes('egg')) return '#EDF5F6'; // Soft teal tint
  if (norm.includes('clean') || norm.includes('home')) return '#F1EDF6'; // Soft purple/grey tint
  return '#F4F3EE';
}

function getCategoryIconColor(name: string): string {
  const norm = name.toLowerCase().trim();
  if (norm.includes('atta') || norm.includes('rice')) return '#C77E12'; // Marigold 600
  if (norm.includes('oil') || norm.includes('ghee')) return '#1E7A46'; // Green 700
  if (norm.includes('dal') || norm.includes('pulse')) return '#D8453B'; // Red
  if (norm.includes('spice') || norm.includes('masala')) return '#3D4A44'; // Ink 700
  if (norm.includes('snack')) return '#8A5200';
  if (norm.includes('beverage') || norm.includes('drink')) return '#C77E12';
  if (norm.includes('dairy') || norm.includes('milk') || norm.includes('egg')) return '#1E7A46';
  if (norm.includes('clean') || norm.includes('home')) return '#6B7772';
  return '#1E7A46';
}

const fallbackCategories: CategoryItem[] = [
  { id: 'atta-rice', name: 'Atta & Rice', icon: 'cat-atta-rice', emoji: '' },
  { id: 'oils-ghee', name: 'Oils & Ghee', icon: 'cat-oils-ghee', emoji: '' },
  { id: 'dals-pulses', name: 'Dals & Pulses', icon: 'cat-dals-pulses', emoji: '' },
  { id: 'spices-masala', name: 'Spices & Masala', icon: 'cat-spices-masala', emoji: '' },
  { id: 'dry-fruits', name: 'Dry Fruits', icon: 'cat-dry-fruits', emoji: '' },
  { id: 'snacks', name: 'Snacks', icon: 'cat-snacks', emoji: '' },
  { id: 'beverages', name: 'Beverages', icon: 'cat-beverages', emoji: '' },
  { id: 'biscuits', name: 'Biscuits', icon: 'cat-biscuits', emoji: '' },
  { id: 'cleaning', name: 'Cleaning', icon: 'cat-cleaning', emoji: '' },
  { id: 'personal-care', name: 'Personal Care', icon: 'cat-personal-care', emoji: '' },
  { id: 'home-kitchen', name: 'Home & Kitchen', icon: 'cat-home-kitchen', emoji: '' },
  { id: 'baby-care', name: 'Baby Care', icon: 'cat-baby-care', emoji: '' },
];

export default function HomeScreen({ navigation, setActiveTab }: any) {
  const insets = useSafeAreaInsets();
  const { city, area, token, user } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
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
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/banners`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.banners)) {
          setBanners(data.banners);
        }
      } catch (err) {
        console.error('Error fetching promotional banners:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/categories`);
        const data = await res.json();
        if (res.ok && data.success) {
          const list = data.categoriesFull || [];
          const mapped: CategoryItem[] = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            icon: getCategoryIcon(item.name),
            image_url: item.image_url,
            emoji: '',
          }));
          if (mapped.length > 0) {
            setCategories(mapped.slice(0, 8));
          } else if (data.categories) {
            const fallbackMapped: CategoryItem[] = data.categories
              .slice(0, 8)
              .map((name: string, index: number) => ({
                id: `cat-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                name,
                icon: getCategoryIcon(name),
                emoji: '',
              }));
            setCategories(fallbackMapped);
          }
        }
      } catch (err) {
        console.error('Error loading categories:', err);
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

  const openCategories = () => {
    if (setActiveTab) setActiveTab('Categories');
    else navigation.navigate('Categories');
  };

  const renderDealCard = (item: Product) => {
    const priceVal = parseFloat(item.price as any) || 0;
    const mrpVal = parseFloat(item.mrp as any) || priceVal;
    const pctOff = mrpVal > priceVal ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;
    const cartItem = items.find((i) => i.product?.id === item.id);
    const count = cartItem ? cartItem.quantity : 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.dealCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.85}
      >
        <View style={[styles.dealImageWrap, { backgroundColor: getCategoryBgColor(item.name) }]}>
          {pctOff > 0 && (
            <View style={styles.dealBadge}>
              <Text style={styles.dealBadgeText}>{pctOff}% OFF</Text>
            </View>
          )}
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.dealImg} resizeMode="contain" />
          ) : (
            <AppIcon name={getCategoryIcon(item.name)} size={38} color={getCategoryIconColor(item.name)} />
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
          <AppIcon name="sparkles" size={12} color="#FFFFFF" />
          <Text style={styles.deliveryPillText}>Planned monthly delivery · 4-hour window</Text>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.85}
        >
          <AppIcon name="search" size={18} color={COLORS.ink300} />
          <Text style={styles.searchPlaceholder}>Search atta, rice, oil…</Text>
          <AppIcon name="mic" size={18} color={COLORS.ink300} />
        </TouchableOpacity>

        {banners.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScrollView}
            contentContainerStyle={styles.bannerScrollContent}
          >
            {banners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={styles.bannerItem}
                onPress={() => navigation.navigate('OffersCoupons')}
                activeOpacity={0.9}
              >
                {banner.image_url ? (
                  <Image
                    source={{ uri: banner.image_url }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                    onError={(e) => console.warn(`Error loading banner ${banner.id}:`, e.nativeEvent.error)}
                  />
                ) : (
                  <View style={styles.promoCardFallback}>
                    <View style={styles.promoLeft}>
                      <Text style={styles.promoLabel}>PROMOTIONAL OFFER</Text>
                      <Text style={styles.promoTitle} numberOfLines={2}>
                        {banner.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.promoBtn}
                        onPress={() => navigation.navigate('OffersCoupons')}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.promoBtnText}>View details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.bannerItem}
            onPress={() => navigation.navigate('OffersCoupons')}
            activeOpacity={0.9}
          >
            <View style={styles.promoCardFallback}>
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
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.mmgCard}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
          activeOpacity={0.85}
        >
          <View style={styles.mmgIconWrap}>
            <AppIcon name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.mmgTextCol}>
            <Text style={styles.mmgLabel}>MY MONTHLY GROCERY</Text>
            <Text style={styles.mmgTitle}>Build your month in one tap</Text>
            <Text style={styles.mmgSub}>A smart basket from what your home buys</Text>
          </View>
          <View style={styles.mmgArrow}>
            <AppIcon name="arrow-right" size={18} color={COLORS.green900} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── White content sheet (Figma: content from y=470) ── */}
      <View style={styles.contentSheet}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <TouchableOpacity onPress={openCategories}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScrollView}
          contentContainerStyle={styles.catScrollContent}
        >
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
              <View style={[styles.catTile, { backgroundColor: getCategoryBgColor(cat.name) }]}>
                {cat.image_url ? (
                  <Image
                    source={{ uri: cat.image_url }}
                    style={styles.categoryPng}
                    resizeMode="contain"
                  />
                ) : (
                  <AppIcon name={cat.icon} size={28} color={getCategoryIconColor(cat.name)} />
                )}
              </View>
              <Text style={styles.catName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.sectionHeader, { marginTop: 6 }]}>
          <Text style={styles.sectionTitle}>Deals of the month</Text>
          <TouchableOpacity onPress={openCategories}>
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
            <View style={[styles.reorderAvatar, { zIndex: 3, backgroundColor: '#FFF9E5' }]}>
              <AppIcon name="cat-atta-rice" size={20} color="#C77E12" />
            </View>
            <View style={[styles.reorderAvatar, styles.reorderAvatarOverlap, { zIndex: 2, backgroundColor: '#EAF5EE' }]}>
              <AppIcon name="cat-oils-ghee" size={20} color="#1E7A46" />
            </View>
            <View style={[styles.reorderAvatar, styles.reorderAvatarOverlap, { zIndex: 1, backgroundColor: '#FCECE9' }]}>
              <AppIcon name="cat-dals-pulses" size={20} color="#D8453B" />
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
    backgroundColor: '#F5A524',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    backgroundColor: '#F5A524',
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
    ...FONTS.muktaBold,
    fontSize: 10,
    color: COLORS.green900,
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  locationText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: COLORS.green900,
    maxWidth: width * 0.6,
  },
  locationChevron: {
    fontSize: 14,
    color: COLORS.green900,
    fontWeight: '700',
    marginTop: -2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(15, 61, 40, 0.12)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  deliveryPillText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    color: COLORS.green900,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  searchPlaceholder: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: COLORS.ink500,
  },
  bannerScrollView: {
    marginBottom: 12,
    width: CONTENT_W,
    height: 130,
  },
  bannerScrollContent: {
    gap: 0,
  },
  bannerItem: {
    width: CONTENT_W,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#F4F3EE',
    overflow: 'hidden',
  },
  bannerImage: {
    width: CONTENT_W,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#F4F3EE',
  },
  promoCardFallback: {
    flexDirection: 'row',
    backgroundColor: '#E08E1A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: CONTENT_W,
    height: 130,
    overflow: 'hidden',
  },
  promoLeft: {
    flex: 1,
    paddingRight: 4,
  },
  promoLabel: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  promoTitle: {
    ...FONTS.balooBold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginTop: 2,
  },
  promoSub: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 4,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.ink900,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  promoBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  mmgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green900,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
    gap: 12,
  },
  mmgIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5A524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mmgTextCol: {
    flex: 1,
  },
  mmgLabel: {
    ...FONTS.muktaBold,
    fontSize: 10,
    color: '#FDEFD3',
    letterSpacing: 0.5,
  },
  mmgTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 2,
    lineHeight: 22,
  },
  mmgSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#BFE4CD',
    marginTop: 2,
    lineHeight: 16,
  },
  mmgArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
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
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
    letterSpacing: -0.25,
  },
  seeAll: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.green700,
  },
  catScrollView: {
    marginBottom: 20,
    width: CONTENT_W,
  },
  catScrollContent: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  catItem: {
    width: 72,
    alignItems: 'center',
  },
  catTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  categoryPng: {
    width: 48,
    height: 48,
  },
  catName: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    color: COLORS.ink700,
    textAlign: 'center',
    lineHeight: 14,
    width: 72,
  },
  loadingText: {
    ...FONTS.muktaRegular,
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    padding: 8,
  },
  dealImageWrap: {
    width: '100%',
    height: 100,
    borderRadius: 8,
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
    ...FONTS.muktaBold,
    fontSize: 10,
    color: COLORS.ink900,
  },
  dealImg: {
    width: 70,
    height: 70,
  },
  dealName: {
    ...FONTS.balooSemiBold,
    fontSize: 13,
    color: COLORS.ink900,
    lineHeight: 16,
    height: 38,
    marginBottom: 2,
  },
  dealUnit: {
    ...FONTS.muktaRegular,
    fontSize: 12,
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
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
    lineHeight: 18,
  },
  dealMrp: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
    lineHeight: 14,
  },
  dealAddBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 30,
    justifyContent: 'center',
  },
  dealAddText: {
    ...FONTS.balooBold,
    fontSize: 12,
    color: COLORS.green700,
    textAlign: 'center',
  },
  dealStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 8,
    paddingHorizontal: 4,
    height: 30,
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 88,
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
    borderColor: COLORS.line,
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
    marginLeft: 12,
  },
  reorderTitle: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  reorderSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 1,
  },
  reorderBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    height: 36,
    justifyContent: 'center',
  },
  reorderBtnText: {
    ...FONTS.balooBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
