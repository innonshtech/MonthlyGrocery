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
import {
  HomeSearchIcon,
  HomeMicIcon,
  HomeChevronDownIcon,
  HomeDeliveryIcon,
  HomeSparkleIcon,
  HomeArrowRightIcon,
} from '../../components/home/HomeFigmaIcons';
import {
  fetchHomeConfigWithStatus,
  fetchPromotionalBanners,
  formatHomeTemplate,
  navigateFromActionLink,
  HomeScreenConfig,
  PromotionalBanner,
} from '../../services/homeApi';
import HomeDealCard from '../../components/home/HomeDealCard';
import AppLoader from '../../components/AppLoader';
import { CheckoutFallbackEmoji } from '../../components/CheckoutFigmaIcons';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const H_PAD = 14;
const CONTENT_W = width - H_PAD * 2;
const CAT_SIZE = 80;
const CAT_GAP = 10;

interface CategoryItem {
  id: string;
  name: string;
  icon: IconName;
  emoji: string;
  image_url?: string;
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

function buildDisplayLocation(
  home: HomeScreenConfig | null,
  city?: string | null,
  area?: string | null,
): string {
  if (!home) return '';
  if (area && city) return `${home.location_prefix} ${area}, ${city}`;
  if (area) return `${home.location_prefix} ${area}`;
  if (city) return `${home.location_prefix} ${city}`;
  return home.choose_location_label;
}

function sortBanners(banners: PromotionalBanner[]): PromotionalBanner[] {
  return [...banners].sort((a, b) => {
    const aPromo = a.kind === 'promo' ? 0 : 1;
    const bPromo = b.kind === 'promo' ? 0 : 1;
    return aPromo - bPromo;
  });
}

function getReorderPreviewItems(lastOrder: any) {
  const items = lastOrder?.order_items || [];
  if (!items.length) return [];
  const withImages = items.filter((it: any) => it.image_url);
  const pool = withImages.length >= 3 ? withImages : items;
  return pool.slice(0, 3);
}

export default function HomeScreen({ navigation, setActiveTab }: any) {
  const insets = useSafeAreaInsets();
  const { city, area, token, user } = useAuth();
  const { addToCart, items, updateQuantity } = useCart();
  const [home, setHome] = useState<HomeScreenConfig | null>(null);
  const [homeLoadError, setHomeLoadError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState<{
    orderCount: number;
    lastOrder: any | null;
  }>({ orderCount: 0, lastOrder: null });

  const displayLocation = buildDisplayLocation(home, city, area);
  const hasDeliveryArea = Boolean(city?.trim() && area?.trim());
  const userInitial = user?.name?.trim()?.[0]?.toUpperCase();
  const hasPastOrder = orderStats.orderCount > 0 && orderStats.lastOrder;
  const lastOrderItemCount = hasPastOrder
    ? (orderStats.lastOrder.order_items || []).reduce(
        (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
        0,
      )
    : 0;
  const lastOrderTotal = hasPastOrder ? Number(orderStats.lastOrder.total_amount) || 0 : 0;
  const reorderPreviewItems = hasPastOrder ? getReorderPreviewItems(orderStats.lastOrder) : [];

  const loadHomeConfig = async () => {
    const result = await fetchHomeConfigWithStatus();
    setHome(result.home);
    setHomeLoadError(result.error);
  };

  useEffect(() => {
    loadHomeConfig();
    fetchPromotionalBanners().then((list) => setBanners(sortBanners(list)));
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
          } else if (data.categories?.length) {
            const nameMapped: CategoryItem[] = data.categories
              .slice(0, 8)
              .map((name: string, index: number) => ({
                id: `cat-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                name,
                icon: getCategoryIcon(name),
                emoji: '',
              }));
            setCategories(nameMapped);
          } else {
            setCategories([]);
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
      if (!hasDeliveryArea) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let url = `${API_BASE}/products/all?deals=true&limit=8`;
        url += `&city=${encodeURIComponent(city!)}`;
        url += `&area_name=${encodeURIComponent(area!)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.success && data.products) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [city, area, hasDeliveryArea]);

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

  const openDeals = () => {
    navigation.navigate('CategoryProducts', {
      dealsOnly: true,
      categoryName: home?.deals_title || 'Deals of the month',
    });
  };

  const handleBannerPress = (banner: PromotionalBanner) => {
    navigateFromActionLink(navigation, banner.action_link);
  };

  const renderPromoBanner = (banner: PromotionalBanner) => (
    <TouchableOpacity
      key={banner.id}
      style={styles.bannerItem}
      onPress={() => handleBannerPress(banner)}
      activeOpacity={0.9}
    >
      {banner.image_url && banner.kind !== 'promo' ? (
        <Image
          source={{ uri: banner.image_url }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.promoCardFallback}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoLabel}>{banner.title}</Text>
            {banner.subtitle ? (
              <Text style={styles.promoTitle} numberOfLines={2}>{banner.subtitle}</Text>
            ) : null}
            {banner.body ? <Text style={styles.promoSub}>{banner.body}</Text> : null}
            {banner.cta_text ? (
              <View style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>{banner.cta_text}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={styles.scrollContent}
    >
      {homeLoadError && !home ? (
        <View style={[styles.homeErrorWrap, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.homeErrorText}>
            {home?.load_error_message ?? 'Could not load home screen. Check that the backend is running.'}
          </Text>
          <TouchableOpacity style={styles.homeRetryBtn} onPress={loadHomeConfig} activeOpacity={0.85}>
            <Text style={styles.homeRetryBtnText}>{home?.retry_label ?? 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContent}>
      {/* ── Green header (Figma: 390×470) ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.locationBlock}
            onPress={() => navigation.navigate('CitySelection')}
            activeOpacity={0.75}
          >
            <Text style={styles.deliveringLabel}>{home?.delivering_label}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {displayLocation}
              </Text>
              <HomeChevronDownIcon size={16} color={COLORS.green900} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarBtn} onPress={openAccount}>
            {userInitial ? (
              <Text style={styles.avatarText}>{userInitial}</Text>
            ) : (
              <AppIcon name="account" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.deliveryPill}>
          <HomeDeliveryIcon size={12} />
          <Text style={styles.deliveryPillText}>{home?.delivery_pill_text}</Text>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.85}
        >
          <HomeSearchIcon size={18} color={COLORS.ink300} />
          <Text style={styles.searchPlaceholder}>{home?.search_placeholder}</Text>
          <HomeMicIcon size={18} color={COLORS.ink300} />
        </TouchableOpacity>

        {banners.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerScrollView}
            contentContainerStyle={styles.bannerScrollContent}
          >
            {banners.map((banner) => renderPromoBanner(banner))}
          </ScrollView>
        ) : null}

        <TouchableOpacity
          style={styles.mmgCard}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
          activeOpacity={0.85}
        >
          <View style={styles.mmgIconWrap}>
            <HomeSparkleIcon size={24} />
          </View>
          <View style={styles.mmgTextCol}>
            <Text style={styles.mmgLabel}>{home?.mmg_label}</Text>
            <Text style={styles.mmgTitle}>{home?.mmg_title}</Text>
            <Text style={styles.mmgSub}>{home?.mmg_subtitle}</Text>
          </View>
          <View style={styles.mmgArrow}>
            <HomeArrowRightIcon size={18} color={COLORS.green900} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── White content sheet (Figma: content from y=470) ── */}
      <View style={styles.contentSheet}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{home?.categories_title}</Text>
          <TouchableOpacity onPress={openCategories}>
            <Text style={styles.seeAll}>{home?.categories_see_all}</Text>
          </TouchableOpacity>
        </View>

        {categories.length > 0 ? (
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
        ) : null}

        <View style={[styles.sectionHeader, { marginTop: 6 }]}>
          <Text style={styles.sectionTitle}>{home?.deals_title}</Text>
          <TouchableOpacity onPress={openDeals}>
            <Text style={styles.seeAll}>{home?.deals_see_all}</Text>
          </TouchableOpacity>
        </View>

        {!hasDeliveryArea ? (
          <TouchableOpacity
            style={styles.locationHintRow}
            onPress={() => navigation.navigate('CitySelection')}
            activeOpacity={0.85}
          >
            <Text style={styles.locationHintText}>
              {home?.location_required_deals_label}
            </Text>
            <Text style={styles.locationHintCta}>{home?.choose_location_label}</Text>
          </TouchableOpacity>
        ) : loading ? (
          <AppLoader message={home?.loading_deals_label || 'Loading deals...'} />
        ) : products.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealsRail}
          >
            {products.map((item, index) => {
              const cartItem = items.find((i) => i.product?.id === item.id);
              const qty = cartItem?.quantity ?? 0;
              return (
                <HomeDealCard
                  key={item.id}
                  item={item}
                  index={index}
                  quantity={qty}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  onAdd={() => addToCart(item)}
                  onIncrement={() => addToCart(item)}
                  onDecrement={() => updateQuantity(item.id, qty - 1)}
                />
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.loadingText}>{home?.empty_deals_label}</Text>
        )}

        <TouchableOpacity
          style={styles.reorderCard}
          onPress={() =>
            hasPastOrder
              ? navigation.navigate('CopyLastMonth')
              : navigation.navigate('OneClickCart')
          }
          activeOpacity={0.85}
        >
          <View style={styles.reorderAvatars}>
            {hasPastOrder && reorderPreviewItems.length > 0 ? (
              reorderPreviewItems.map((previewItem: any, idx: number) => (
                <View
                  key={`${previewItem.product_id || idx}-${idx}`}
                  style={[
                    styles.reorderAvatar,
                    idx > 0 && styles.reorderAvatarOverlap,
                    { zIndex: reorderPreviewItems.length - idx },
                  ]}
                >
                  {previewItem.image_url ? (
                    <Image
                      source={{ uri: previewItem.image_url }}
                      style={styles.reorderThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <CheckoutFallbackEmoji index={idx} size={22} />
                  )}
                </View>
              ))
            ) : (
              <>
                <View style={[styles.reorderAvatar, { zIndex: 3, backgroundColor: COLORS.marigold100 }]}>
                  <CheckoutFallbackEmoji index={0} size={22} />
                </View>
                <View style={[styles.reorderAvatar, styles.reorderAvatarOverlap, { zIndex: 2, backgroundColor: COLORS.green100 }]}>
                  <CheckoutFallbackEmoji index={1} size={22} />
                </View>
                <View style={[styles.reorderAvatar, styles.reorderAvatarOverlap, { zIndex: 1, backgroundColor: '#FCECE9' }]}>
                  <CheckoutFallbackEmoji index={2} size={22} />
                </View>
              </>
            )}
          </View>
          <View style={styles.reorderTextCol}>
            <Text style={styles.reorderTitle}>
              {hasPastOrder ? home?.reorder_title : home?.first_basket_title}
            </Text>
            <Text style={styles.reorderSub}>
              {hasPastOrder
                ? formatHomeTemplate(home?.reorder_subtitle_template || '', {
                    count: lastOrderItemCount,
                    total: lastOrderTotal.toLocaleString('en-IN'),
                  })
                : home?.first_basket_subtitle}
            </Text>
          </View>
          <View style={styles.reorderBtn}>
            <Text style={styles.reorderBtnText}>
              {hasPastOrder ? home?.reorder_cta_label : home?.first_basket_cta_label}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    paddingBottom: 16,
  },
  mainContent: {
    flexGrow: 1,
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
    flexGrow: 1,
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
    overflow: 'hidden',
  },
  reorderThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  homeErrorWrap: {
    flex: 1,
    paddingHorizontal: H_PAD,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
  homeErrorText: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  homeRetryBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  homeRetryBtnText: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  locationHintRow: {
    backgroundColor: COLORS.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
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
});
