import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import { appendLocationParams } from '../../utils/locationParams';
import AppIcon from '../../components/AppIcon';
import {
  HomeSearchIcon,
  HomeMicIcon,
  HomeChevronDownIcon,
  HomeDeliveryIcon,
  HomeSparkleIcon,
  HomeArrowRightIcon,
  HomePromoIllustration,
} from '../../components/home/HomeFigmaIcons';
import {
  fetchHomeConfigWithStatus,
  fetchPromotionalBanners,
  formatHomeTemplate,
  navigateFromActionLink,
  HomeScreenConfig,
  PromotionalBanner,
} from '../../services/homeApi';
import { fetchCategoryList } from '../../services/categoriesApi';
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
  image_url: string;
}

function buildDisplayLocation(
  home: HomeScreenConfig | null,
  city?: string | null,
  area?: string | null,
  pincode?: string | null,
): string {
  if (!home) return '';
  if (area && city) {
    const base = `${home.location_prefix} ${area}, ${city}`;
    return pincode ? `${base} · ${pincode}` : base;
  }
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
  const { city, area, pincode, token, user } = useAuth();
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

  const displayLocation = buildDisplayLocation(home, city, area, pincode);
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

  const loadBanners = useCallback(async () => {
    const list = await fetchPromotionalBanners();
    setBanners(sortBanners(list));
  }, []);

  useEffect(() => {
    loadHomeConfig();
    loadBanners();
  }, [loadBanners]);

  useFocusEffect(
    useCallback(() => {
      loadBanners();
    }, [loadBanners]),
  );

  useEffect(() => {
    const loadCategories = async () => {
      const result = await fetchCategoryList();
      if (!result.error) {
        const withTiles = result.items
          .filter((item) => Boolean(item.image_url?.trim()))
          .map((item) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url!.trim(),
          }));
        setCategories(withTiles);
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
        const url = appendLocationParams(`${API_BASE}/products/all?deals=true&limit=8`, {
          city,
          area,
          pincode,
        });
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
  }, [city, area, pincode, hasDeliveryArea]);

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
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="promoGrad" x1="27%" y1="7%" x2="76%" y2="93%">
                <Stop offset="0%" stopColor="#F5A524" />
                <Stop offset="100%" stopColor="#E07C0E" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#promoGrad)" />
          </Svg>
          <View style={styles.promoLeft}>
            <Text style={styles.promoLabel}>{banner.title || 'MONTHLY SAVINGS SALE'}</Text>
            <Text style={styles.promoTitle} numberOfLines={2}>{banner.subtitle || 'Up to ₹500 off'}</Text>
            <Text style={styles.promoSub}>{banner.body || 'on your full monthly basket'}</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>{banner.cta_text || 'Grab deals'}</Text>
            </View>
          </View>
          <View style={styles.promoRight}>
            <Image
              source={require('../../assets/figma/promo_coconut_illustration.png')}
              style={styles.promoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.outerWrap}>
      <StatusBar barStyle="dark-content" />
      <View style={{ height: insets.top, backgroundColor: '#F5A524' }} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {homeLoadError ? (
          <View style={styles.homeErrorWrap}>
            <Text style={styles.homeErrorText}>
              {'Could not load home screen. Check that the backend is running.'}
            </Text>
            <TouchableOpacity style={styles.homeRetryBtn} onPress={loadHomeConfig} activeOpacity={0.85}>
              <Text style={styles.homeRetryBtnText}>{'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* ── Orange gradient header (Figma Node 542:725) ── */}
            <View style={styles.header}>
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="headerGrad" x1="27%" y1="7%" x2="76%" y2="93%">
                    <Stop offset="0%" stopColor="#F5A524" />
                    <Stop offset="100%" stopColor="#E07C0E" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#headerGrad)" />
              </Svg>

              <View style={styles.topSectionGroup}>
                <View style={styles.headerTopRow}>
                  <TouchableOpacity
                    style={styles.locationBlock}
                    onPress={() => navigation.navigate('CitySelection')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.deliveringLabel}>{home?.delivering_label || 'DELIVERING TO'}</Text>
                    <View style={styles.locationRow}>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {displayLocation}
                      </Text>
                      <HomeChevronDownIcon size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.avatarBtn} onPress={openAccount}>
                    {user?.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                    ) : userInitial ? (
                      <Text style={styles.avatarText}>{userInitial}</Text>
                    ) : (
                      <AppIcon name="account" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.deliveryPill}>
                  <HomeDeliveryIcon size={15} color="#FFFFFF" />
                  <Text style={styles.deliveryPillText}>{home?.delivery_pill_text || 'Planned monthly delivery · 4-hour window'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.searchBar}
                onPress={() => navigation.navigate('Search')}
                activeOpacity={0.85}
              >
                <HomeSearchIcon size={20} color="#1E7A46" />
                <Text style={styles.searchPlaceholder}>{home?.search_placeholder || 'Search atta, rice, oil…'}</Text>
                <HomeMicIcon size={20} color="#1E7A46" />
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
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                  <Defs>
                    <LinearGradient id="mmgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#1E7A46" />
                      <Stop offset="100%" stopColor="#124F2E" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#mmgGrad)" />
                </Svg>
                <View style={styles.mmgIconWrap}>
                  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                    <Defs>
                      <LinearGradient id="mmgIconGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#F5A524" />
                        <Stop offset="100%" stopColor="#E07C0E" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" rx="24" fill="url(#mmgIconGrad)" />
                  </Svg>
                  <HomeSparkleIcon size={26} />
                </View>
                <View style={styles.mmgTextCol}>
                  <Text style={styles.mmgLabel}>{home?.mmg_label || 'MY MONTHLY GROCERY'}</Text>
                  <Text style={styles.mmgTitle}>{home?.mmg_title || 'Build your month in one tap'}</Text>
                  <Text style={styles.mmgSub}>{home?.mmg_subtitle || 'A smart basket from what your home buys'}</Text>
                </View>
                <View style={styles.mmgArrow}>
                  <HomeArrowRightIcon size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* ── Content sheet (Figma: content from y=470) ── */}
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
                  contentContainerStyle={styles.catRail}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.catRailItem}
                      onPress={() =>
                        navigation.navigate('CategoryProducts', {
                          categoryId: cat.id,
                          categoryName: cat.name,
                        })
                      }
                      activeOpacity={0.75}
                    >
                      <View style={styles.catTile}>
                        <Image
                          source={{ uri: cat.image_url }}
                          style={styles.categoryPng}
                          resizeMode="contain"
                        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    flex: 1,
    backgroundColor: '#F7F6F1',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F6F1',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F7F6F1',
    paddingBottom: 16,
  },
  mainContent: {
    flexGrow: 1,
  },
  header: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    height: 470,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 17,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
  },
  topSectionGroup: {
    alignSelf: 'stretch',
    gap: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationBlock: {
    flex: 1,
    marginRight: 12,
  },
  deliveringLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    letterSpacing: 1.32,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  locationText: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: '#2A8B54',
    borderWidth: 1.5,
    borderColor: '#4FBF7E',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.59)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deliveryPillText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7772',
  },
  bannerScrollView: {
    width: CONTENT_W,
    height: 130,
  },
  bannerScrollContent: {
    gap: 0,
  },
  bannerItem: {
    width: CONTENT_W,
    height: 130,
    borderRadius: 18,
    backgroundColor: '#F4F3EE',
    overflow: 'hidden',
  },
  bannerImage: {
    width: CONTENT_W,
    height: 130,
    borderRadius: 18,
    backgroundColor: '#F4F3EE',
  },
  promoCardFallback: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: CONTENT_W,
    height: 130,
    overflow: 'hidden',
  },
  promoLeft: {
    flex: 1,
    paddingRight: 4,
  },
  promoRight: {
    width: 90,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoImage: {
    width: 90,
    height: 80,
  },
  promoLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#17251E',
    letterSpacing: 1.44,
    textTransform: 'uppercase',
  },
  promoTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.26,
    lineHeight: 32,
    marginTop: 2,
  },
  promoSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#17251E',
    lineHeight: 16,
    marginTop: 2,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#17251E',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  promoBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  mmgCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 100,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 13,
    borderRadius: 18,
    overflow: 'hidden',
  },
  mmgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mmgTextCol: {
    flex: 1,
    gap: 2,
  },
  mmgLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#FBE0AE',
    letterSpacing: 1.44,
    textTransform: 'uppercase',
  },
  mmgTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  mmgSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#E4F3EA',
    lineHeight: 16,
  },
  mmgArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSheet: {
    flexGrow: 1,
    backgroundColor: '#F7F6F1',
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
    ...FONTS.balooSemiBold,
    fontSize: 18,
    color: '#17251E',
    letterSpacing: -0.25,
    lineHeight: 24,
  },
  seeAll: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: '#1E7A46',
  },
  catRail: {
    gap: CAT_GAP,
    paddingBottom: 4,
    marginBottom: 20,
  },
  catRailItem: {
    width: CAT_SIZE,
    alignItems: 'center',
  },
  catTile: {
    width: CAT_SIZE,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    backgroundColor: '#F4F3EE',
  },
  categoryPng: {
    width: 46,
    height: 46,
  },
  catName: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#3D4A44',
    textAlign: 'center',
    lineHeight: 16,
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
    borderColor: '#EAE9E2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 100,
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
    borderColor: '#FFFFFF',
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
    color: '#17251E',
  },
  reorderSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#6B7772',
    marginTop: 1,
  },
  reorderBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  reorderBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 16,
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
