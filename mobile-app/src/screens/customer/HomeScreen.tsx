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
  Platform,
  useWindowDimensions,
  Animated,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import { appendLocationParams } from '../../utils/locationParams';
import { getCurrentCoordinates } from '../../services/locationService';
import { reverseGeocodeLocation } from '../../services/addressApi';
import AppIcon from '../../components/AppIcon';
import {
  HomeSearchIcon,
  HomeMicIcon,
  HomeChevronDownIcon,
  HomeSparkleIcon,
  HomeArrowRightIcon,
  HomePromoIllustration,
  HomeLocationPinIcon,
  HomeGroceryBasketIcon,
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
import { HomeCategoryEmojiIcon, getCategoryEmojiKind } from '../../components/home/HomeEmojiIcons';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import ShopPickerSlide from '../../components/ShopPickerSlide';
import { NearbyShop } from '../../services/shopsApi';
import {
  Camera,
  FileText,
  Sparkles,
  Bot,
  Users,
  RotateCcw,
  BadgePercent,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const H_PAD = 14;
const CONTENT_W = width - H_PAD * 2;
const CAT_SIZE = 72;
const CAT_GAP = 12;

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
  livePincode?: string | null,
): string {
  const prefix = home?.location_prefix || 'Home ·';
  const effectivePincode = livePincode || pincode;
  if (effectivePincode) {
    return `${prefix} ${effectivePincode}`;
  }
  if (area) return `${prefix} ${area}`;
  if (city) return `${prefix} ${city}`;
  return home?.choose_location_label || `${prefix} Set Location`;
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
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.max(windowWidth - H_PAD * 2, 280);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { city, area, pincode, token, user, selectedShop } = useAuth();
  const { addToCart, items, updateQuantity, syncActiveShop } = useCart();
  const [home, setHome] = useState<HomeScreenConfig | null>(null);
  const [homeLoadError, setHomeLoadError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const bannerScrollRef = React.useRef<any>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isBannerInteracting, setIsBannerInteracting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState<{
    orderCount: number;
    lastOrder: any | null;
  }>({ orderCount: 0, lastOrder: null });
  const [livePincode, setLivePincode] = useState<string | null>(pincode || null);

  useEffect(() => {
    let isMounted = true;
    const loadAndDetectPincode = async () => {
      try {
        const savedPin = await AsyncStorage.getItem('@user_pincode');
        if (savedPin && isMounted) {
          setLivePincode(savedPin);
        }
        const coords = await getCurrentCoordinates();
        if (coords && isMounted) {
          const geo = await reverseGeocodeLocation(coords.latitude, coords.longitude);
          if (geo?.pincode && isMounted) {
            setLivePincode(geo.pincode);
            await AsyncStorage.setItem('@user_pincode', geo.pincode);
          }
        }
      } catch {}
    };
    loadAndDetectPincode();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayLocation = buildDisplayLocation(home, city, area, pincode, livePincode);
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

  // Shop picker slide (for "Change" from HomeScreen)
  const [shopPickerVisible, setShopPickerVisible] = React.useState(false);
  const { setSelectedShop } = useAuth();

  // When idle (scrollY = 0), overlay is 100% transparent so the header is 1 continuous shade.
  // As user scrolls, it transitions into frosted glass as content passes underneath.
  const statusBarBg = scrollY.interpolate({
    inputRange: [0, 60, 200, 320],
    outputRange: [
      'rgba(13, 79, 44, 0)',
      'rgba(13, 79, 44, 0.45)',
      'rgba(255, 255, 255, 0.92)',
      'rgba(255, 255, 255, 0.98)',
    ],
    extrapolate: 'clamp',
  });

  const statusBarBorder = scrollY.interpolate({
    inputRange: [0, 200, 320],
    outputRange: [
      'rgba(226, 232, 240, 0)',
      'rgba(226, 232, 240, 0.4)',
      'rgba(226, 232, 240, 0.9)',
    ],
    extrapolate: 'clamp',
  });

  const statusBarShadow = scrollY.interpolate({
    inputRange: [0, 200, 320],
    outputRange: [0, 1, 4],
    extrapolate: 'clamp',
  });

  const loadHomeConfig = async () => {
    const result = await fetchHomeConfigWithStatus();
    setHome(result.home);
    setHomeLoadError(result.error);
  };

  const loadBanners = useCallback(async () => {
    const list = await fetchPromotionalBanners();
    setBanners(sortBanners(list));
  }, []);

  const loadCategories = useCallback(async () => {
    const result = await fetchCategoryList();
    if (!result.error && result.items) {
      setCategories(result.items);
    }
  }, []);

  useEffect(() => {
    loadHomeConfig();
    loadBanners();
    loadCategories();
  }, [loadBanners, loadCategories]);

  useFocusEffect(
    useCallback(() => {
      (StatusBar as any).setTranslucent?.(true);
      if (Platform.OS === 'android') {
        (StatusBar as any).setBackgroundColor?.('transparent');
      }
      loadBanners();
      loadCategories();
    }, [loadBanners, loadCategories]),
  );

  useEffect(() => {
    if (banners.length <= 1 || isBannerInteracting) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => {
        const nextIndex = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * contentWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [banners.length, isBannerInteracting, contentWidth]);

  useEffect(() => {
    const fetchFeatured = async () => {
      if (!hasDeliveryArea) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let url = appendLocationParams(`${API_BASE}/products/all?deals=true&limit=8`, {
          city,
          area,
          pincode,
          shop_id: selectedShop?.id || null,
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
  }, [city, area, pincode, hasDeliveryArea, selectedShop]);

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

  // ── 150° CSS gradient → pixel coordinates for SVG userSpaceOnUse ──
  // CSS 150°: direction = (sin(150°), -cos(150°)) = (0.5, 0.866)
  // Half-length per CSS spec: (W*|sin|+H*|cos|)/2
  // ── Dynamic Proportional Banner Height (Responsive on Phones & Tablets) ──
  // Standard promotional banner aspect ratio: ~2.25:1
  // On phones (~360-400px wide): bannerHeight is ~165-175px
  // On tablets (600px-1000px wide): scales proportionally up to 320px so full graphic is visible
  const bannerAspectRatio = 2.25;
  const bannerHeight = Math.min(Math.max(Math.round(contentWidth / bannerAspectRatio), 160), 320);
  const promoH = bannerHeight;
  const pgHalf = (contentWidth * 0.5 + promoH * 0.866) / 2;
  const pgX1 = contentWidth / 2 - pgHalf * 0.5;
  const pgY1 = promoH / 2 - pgHalf * 0.866;
  const pgX2 = contentWidth / 2 + pgHalf * 0.5;
  const pgY2 = promoH / 2 + pgHalf * 0.866;

  const renderPromoBanner = (banner: PromotionalBanner) => (
    <TouchableOpacity
      key={banner.id}
      style={[styles.bannerItem, { width: contentWidth, height: bannerHeight }]}
      onPress={() => handleBannerPress(banner)}
      activeOpacity={0.9}
    >
      {banner.image_url && banner.kind !== 'promo' ? (
        <Image
          source={{ uri: banner.image_url }}
          style={[styles.bannerImage, { width: contentWidth, height: bannerHeight }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.promoCardOuter, { width: contentWidth, height: promoH }]}>
          <Svg width={contentWidth} height={promoH}>
            <Defs>
              <LinearGradient
                id="promoGrad150"
                gradientUnits="userSpaceOnUse"
                x1={String(pgX1)}
                y1={String(pgY1)}
                x2={String(pgX2)}
                y2={String(pgY2)}
              >
                <Stop offset="0.05" stopColor="#1B7846" />
                <Stop offset="0.55" stopColor="#136037" />
                <Stop offset="1" stopColor="#0D4829" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={contentWidth} height={promoH} fill="url(#promoGrad150)" />
            <Path
              d="M 12 10 C 35 -5 55 12 60 35 C 38 42 18 30 12 10 Z"
              fill="rgba(255, 255, 255, 0.12)"
            />
            <Path
              d="M 70 25 C 92 10 110 25 114 45 C 92 50 78 40 70 25 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
            <Path
              d="M -5 85 C 20 65 38 82 42 105 C 18 110 2 98 -5 85 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
          </Svg>
          <View style={styles.promoContentOverlay}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoLabel}>{banner.title || 'MONTHLY SAVINGS SALE'}</Text>
              <Text style={styles.promoTitle} numberOfLines={1}>{banner.subtitle || 'Up to ₹500 off'}</Text>
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
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
    <View style={styles.outerWrap}>
      <StatusBar barStyle="light-content" />
      {/* Dynamic Frosted Glass Status Bar that adapts its color as user scrolls */}
      {insets.top > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            backgroundColor: statusBarBg,
            borderBottomWidth: 1,
            borderBottomColor: statusBarBorder,
            zIndex: 999,
            elevation: statusBarShadow,
          }}
        />
      ) : null}
      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={styles.scrollContent}
      >
        {homeLoadError ? (
          <View style={[styles.homeErrorWrap, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.homeErrorText}>
              {'Could not load home screen. Check that the backend is running.'}
            </Text>
            <TouchableOpacity style={styles.homeRetryBtn} onPress={loadHomeConfig} activeOpacity={0.85}>
              <Text style={styles.homeRetryBtnText}>{'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* ── Emerald Green Botanical Header ── */}
            <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 14 : 16 }]}>
              {/* Green Gradient Background */}
              <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <Defs>
                  <LinearGradient id="headerGrad" x1="0" y1="0" x2="0.6" y2="1">
                    <Stop offset="0" stopColor="#0D4F2C" />
                    <Stop offset="0.5" stopColor="#136338" />
                    <Stop offset="1" stopColor="#1B7846" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#headerGrad)" />
              </Svg>

              {/* Botanical Leaf Overlay */}
              <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 390 200"
                preserveAspectRatio="none"
                pointerEvents="none"
              >
                {/* Top-right branch stem */}
                <Path
                  d="M 400 -10 Q 360 25 330 75"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Foliage leaves along stem */}
                <Path
                  d="M 330 75 C 310 70 300 52 308 42 C 322 46 330 62 330 75 Z"
                  fill="rgba(255, 255, 255, 0.20)"
                />
                <Path
                  d="M 345 54 C 342 34 355 20 368 24 C 368 38 356 50 345 54 Z"
                  fill="rgba(255, 255, 255, 0.20)"
                />
                <Path
                  d="M 362 34 C 354 16 360 2 376 5 C 378 18 372 28 362 34 Z"
                  fill="rgba(255, 255, 255, 0.18)"
                />
                <Path
                  d="M 370 65 C 388 72 398 90 392 102 C 378 100 372 82 370 65 Z"
                  fill="rgba(255, 255, 255, 0.18)"
                />
                <Path
                  d="M 345 95 C 330 115 342 135 358 130 C 364 116 358 100 345 95 Z"
                  fill="rgba(255, 255, 255, 0.15)"
                />
                {/* Bottom-left leaf accent */}
                <Path
                  d="M -10 150 C 18 135 35 152 40 175 C 18 180 -5 168 -10 150 Z"
                  fill="rgba(255, 255, 255, 0.14)"
                />
                <Path
                  d="M 12 178 C 32 166 48 180 50 200 C 30 204 15 194 12 178 Z"
                  fill="rgba(255, 255, 255, 0.12)"
                />
              </Svg>

              <View style={styles.headerTopRow}>
                <TouchableOpacity
                  style={styles.locationBlock}
                  onPress={() => navigation.navigate('CitySelection')}
                  activeOpacity={0.75}
                >
                  <View style={styles.locationHeaderRow}>
                    <HomeLocationPinIcon size={24} color="#FFFFFF" />
                    <View style={styles.locationTextGroup}>
                      <Text style={styles.deliveringLabel}>{home?.delivering_label || 'DELIVERING TO'}</Text>
                      <View style={styles.locationRow}>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {displayLocation}
                        </Text>
                        <HomeChevronDownIcon size={16} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                  {selectedShop ? (
                    <View style={styles.shopBadgePill}>
                      <View style={styles.calendarBadge}>
                        <View style={styles.calendarHeader}>
                          <View style={styles.calendarRing} />
                          <View style={styles.calendarRing} />
                        </View>
                        <View style={styles.calendarBody}>
                          <Text style={styles.calendarDayText}>24</Text>
                        </View>
                      </View>
                      <Text style={styles.shopNameLabel} numberOfLines={1}>
                        {selectedShop.name}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); setShopPickerVisible(true); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.changeShopBtn}
                      >
                        <Text style={styles.changeShopText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
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

              <TouchableOpacity
                style={styles.searchBar}
                onPress={() => navigation.navigate('Search')}
                activeOpacity={0.85}
              >
                <HomeSearchIcon size={20} color="#156C3E" />
                <Text style={styles.searchPlaceholder}>{home?.search_placeholder || 'Search atta, rice, oil…'}</Text>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); navigation.navigate('UploadGroceryList', { initialTab: 'image' }); }}
                  activeOpacity={0.75}
                  style={styles.searchScanBtn}
                >
                  <Camera size={13} color="#156C3E" />
                  <Text style={styles.searchScanBtnText}>AI Scan</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* ── Banner Section (Clean White Background) ── */}
            {banners.length > 0 ? (
              <View style={styles.bannerWrapper}>
                <ScrollView
                  ref={bannerScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={[styles.bannerScrollView, { width: contentWidth, height: bannerHeight }]}
                  contentContainerStyle={styles.bannerScrollContent}
                  onScrollBeginDrag={() => setIsBannerInteracting(true)}
                  onMomentumScrollEnd={(e) => {
                    const offset = e.nativeEvent.contentOffset.x;
                    const index = Math.round(offset / contentWidth);
                    setActiveBannerIndex(index);
                    setIsBannerInteracting(false);
                  }}
                  onScrollEndDrag={() => {
                    setTimeout(() => setIsBannerInteracting(false), 2000);
                  }}
                >
                  {banners.map((banner) => renderPromoBanner(banner))}
                </ScrollView>

                {banners.length > 1 ? (
                  <View style={styles.bannerDotsContainer}>
                    {banners.map((_, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => {
                          setActiveBannerIndex(idx);
                          bannerScrollRef.current?.scrollTo({
                            x: idx * contentWidth,
                            animated: true,
                          });
                        }}
                        style={[
                          styles.bannerDot,
                          activeBannerIndex === idx ? styles.bannerDotActive : styles.bannerDotInactive,
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* ── My Monthly Grocery Card (Emerald Botanical Theme) ── */}
            <View style={styles.mmgCardWrapper}>
              <TouchableOpacity
                style={styles.mmgCard}
                onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
                activeOpacity={0.85}
              >
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                  <Defs>
                    <LinearGradient id="mmgGrad" x1="0" y1="0" x2="1" y2="0.8">
                      <Stop offset="0" stopColor="#1B7846" />
                      <Stop offset="0.6" stopColor="#136037" />
                      <Stop offset="1" stopColor="#0D4829" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" rx="18" fill="url(#mmgGrad)" />
                  <Path
                    d="M 12 6 C 28 -2 44 10 48 28 C 30 33 16 24 12 6 Z"
                    fill="rgba(255, 255, 255, 0.10)"
                  />
                  <Path
                    d="M 285 42 C 305 28 322 40 326 56 C 308 61 294 54 285 42 Z"
                    fill="rgba(255, 255, 255, 0.08)"
                  />
                </Svg>

                <View style={styles.mmgIconWrap}>
                  <HomeGroceryBasketIcon size={24} color="#FFFFFF" />
                </View>

                <View style={styles.mmgTextCol}>
                  <Text style={styles.mmgLabel} numberOfLines={1}>{home?.mmg_label || 'MY MONTHLY GROCERY'}</Text>
                  <Text style={styles.mmgTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                    {home?.mmg_title || 'Build your month in one tap'}
                  </Text>
                  <Text style={styles.mmgSub} numberOfLines={1}>{home?.mmg_subtitle || 'A smart basket from what your home buys'}</Text>
                </View>

                <View style={styles.mmgArrow}>
                  <HomeArrowRightIcon size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* ── AI Smart Grocery Hub Grid (4 Dedicated Engines in One Tap) ── */}
            <View style={styles.aiRowWrapper}>
              <TouchableOpacity
                style={styles.aiFeatureCard}
                onPress={() => navigation.navigate('UploadGroceryList', { initialTab: 'image' })}
                activeOpacity={0.88}
              >
                <View style={styles.aiCardTopRow}>
                  <View style={styles.aiBadgePill}>
                    <Text style={styles.aiBadgeText}>✨ VISION AI</Text>
                  </View>
                  <Camera size={18} color="#059669" />
                </View>
                <Text style={styles.aiCardTitle}>Scan Paper List</Text>
                <Text style={styles.aiCardSub} numberOfLines={2}>Photo slip to auto-build monthly cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiFeatureCard, styles.aiFeatureCardBlue]}
                onPress={() => navigation.navigate('UploadGroceryList', { initialTab: 'text' })}
                activeOpacity={0.88}
              >
                <View style={styles.aiCardTopRow}>
                  <View style={[styles.aiBadgePill, styles.aiBadgePillBlue]}>
                    <Text style={[styles.aiBadgeText, styles.aiBadgeTextBlue]}>📋 SMART NLP</Text>
                  </View>
                  <FileText size={18} color="#0284C7" />
                </View>
                <Text style={[styles.aiCardTitle, styles.aiCardTitleBlue]}>WhatsApp List</Text>
                <Text style={[styles.aiCardSub, styles.aiCardSubBlue]} numberOfLines={2}>Paste text notes to auto-match items</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.aiRowWrapper, { marginTop: 8 }]}>
              <TouchableOpacity
                style={[styles.aiFeatureCard, styles.aiFeatureCardPurple]}
                onPress={() => navigation.navigate('AIAssistantChat')}
                activeOpacity={0.88}
              >
                <View style={styles.aiCardTopRow}>
                  <View style={[styles.aiBadgePill, styles.aiBadgePillPurple]}>
                    <Text style={[styles.aiBadgeText, styles.aiBadgeTextPurple]}>🤖 CHAT</Text>
                  </View>
                  <Bot size={18} color="#7C3AED" />
                </View>
                <Text style={[styles.aiCardTitle, styles.aiCardTitlePurple]}>AI Grocery Chat</Text>
                <Text style={[styles.aiCardSub, styles.aiCardSubPurple]} numberOfLines={2}>Budget planner & recipe suggestions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiFeatureCard, styles.aiFeatureCardAmber]}
                onPress={() => navigation.navigate('FamilyProfileSetup')}
                activeOpacity={0.88}
              >
                <View style={styles.aiCardTopRow}>
                  <View style={[styles.aiBadgePill, styles.aiBadgePillAmber]}>
                    <Text style={[styles.aiBadgeText, styles.aiBadgeTextAmber]}>👨‍👩‍👧‍👦 HOUSEHOLD</Text>
                  </View>
                  <Users size={18} color="#D97706" />
                </View>
                <Text style={[styles.aiCardTitle, styles.aiCardTitleAmber]}>Family Planner</Text>
                <Text style={[styles.aiCardSub, styles.aiCardSubAmber]} numberOfLines={2}>Consumption basket by family size</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.aiRowWrapper, { marginTop: 8 }]}>
              <TouchableOpacity
                style={[styles.aiFeatureCard, styles.aiFeatureCardTeal]}
                onPress={() => navigation.navigate('Cart')}
                activeOpacity={0.88}
              >
                <View style={styles.aiCardTopRow}>
                  <View style={[styles.aiBadgePill, styles.aiBadgePillTeal]}>
                    <Text style={[styles.aiBadgeText, styles.aiBadgeTextTeal]}>💰 ARBITRAGE</Text>
                  </View>
                  <BadgePercent size={18} color="#059669" />
                </View>
                <Text style={[styles.aiCardTitle, styles.aiCardTitleTeal]}>Smart Savings</Text>
                <Text style={[styles.aiCardSub, styles.aiCardSubTeal]} numberOfLines={2}>Bulk pack upgrades & brand swaps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiFeatureCard, styles.aiFeatureCardIndigo]}
                onPress={() => navigation.navigate('OneClickCart')}
                activeOpacity={0.88}
              >
                <View style={styles.aiCardTopRow}>
                  <View style={[styles.aiBadgePill, styles.aiBadgePillIndigo]}>
                    <Text style={[styles.aiBadgeText, styles.aiBadgeTextIndigo]}>⚡ PREDICTIVE</Text>
                  </View>
                  <RotateCcw size={18} color="#4F46E5" />
                </View>
                <Text style={[styles.aiCardTitle, styles.aiCardTitleIndigo]}>Predictive Refills</Text>
                <Text style={[styles.aiCardSub, styles.aiCardSubIndigo]} numberOfLines={2}>Household replenishment schedule</Text>
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
                        {cat.image_url ? (
                          <Image
                            source={{ uri: cat.image_url }}
                            style={styles.categoryPng}
                            resizeMode="cover"
                          />
                        ) : (
                          <AppIcon name="categories" size={26} color="#1E7A46" />
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
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id, initialProduct: item })}
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
        </TouchableOpacity>
      </View>
    </View>
    )}
    </Animated.ScrollView>
  </View>
  <ShopPickerSlide
      visible={shopPickerVisible}
      areaName={area ?? ''}
      city={city ?? ''}
      onShopSelected={async (shop: NearbyShop) => {
        await setSelectedShop({
          id: shop.id,
          name: shop.shop_name,
          delivery_radius_km: shop.delivery_radius_km,
          is_open: shop.is_open !== false,
        });
        syncActiveShop(shop.id, shop.shop_name);
        setShopPickerVisible(false);
      }}
      onClose={() => setShopPickerVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  mainContent: {
    flexGrow: 1,
  },
  header: {
    position: 'relative',
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#0D4F2C',
    paddingTop: 16,
    paddingBottom: 22,
    paddingHorizontal: 16,
    gap: 14,
    flexShrink: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  topSectionGroup: {
    width: '100%',
    gap: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  locationBlock: {
    flex: 1,
    marginRight: 12,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationTextGroup: {
    flex: 1,
  },
  deliveringLabel: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: 'rgba(255, 255, 255, 0.90)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  locationText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 21,
    color: '#FFFFFF',
    maxWidth: width * 0.58,
  },
  locationChevron: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: -2,
  },
  shopBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 36, 18, 0.52)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    marginTop: 6,
    gap: 6,
    alignSelf: 'flex-start',
    maxWidth: width * 0.75,
  },
  calendarBadge: {
    width: 22,
    height: 19,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  calendarHeader: {
    height: 5.5,
    backgroundColor: '#E11D48',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  calendarRing: {
    width: 2,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  calendarBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 11,
  },
  shopNameLabel: {
    ...FONTS.muktaSemiBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  changeShopBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 2,
  },
  changeShopText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 48, 24, 0.50)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
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
    ...FONTS.muktaBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deliveryPillText: {
    ...FONTS.muktaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
  },
  bannerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  bannerScrollView: {
    width: '100%',
    borderRadius: 20,
  },
  bannerScrollContent: {
    alignItems: 'center',
  },
  bannerDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 2,
  },
  bannerDot: {
    height: 5,
    borderRadius: 3,
  },
  bannerDotActive: {
    width: 22,
    backgroundColor: '#16A34A',
  },
  bannerDotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  bannerItem: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  bannerImage: {
    borderRadius: 20,
  },
  promoCardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  promoContentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingRight: 14,
    paddingBottom: 18,
    paddingLeft: 20,
  },
  promoLeft: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center',
  },
  promoRight: {
    width: 130,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoImage: {
    width: 130,
    height: 120,
  },
  promoLabel: {
    ...FONTS.muktaBold,
    fontSize: 11.5,
    color: '#86EFAC',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  promoTitle: {
    ...FONTS.balooBold,
    fontSize: 27,
    color: '#FFFFFF',
    letterSpacing: -0.28,
    lineHeight: 33,
    marginTop: 2,
  },
  promoSub: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
    marginTop: 2,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBtnText: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#0F4D2A',
    lineHeight: 16,
  },
  mmgCardWrapper: {
    width: '100%',
    paddingHorizontal: H_PAD,
    marginTop: 12,
  },
  mmgCard: {
    position: 'relative',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#136037',
    overflow: 'hidden',
  },
  mmgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  mmgTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  mmgLabel: {
    ...FONTS.muktaBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: '#86EFAC',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  mmgTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 17.5,
    color: '#FFFFFF',
    lineHeight: 22,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  mmgSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
    marginTop: 1,
  },
  mmgArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contentSheet: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
  },
  categoryPng: {
    width: '100%',
    height: '100%',
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
  searchScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7EE',
    borderWidth: 1,
    borderColor: '#CDEBD4',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  searchScanBtnText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#156C3E',
  },
  aiRowWrapper: {
    flexDirection: 'row',
    paddingHorizontal: H_PAD,
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  aiFeatureCard: {
    flex: 1,
    backgroundColor: '#F3FAF5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D4EED8',
    shadowColor: '#1E7A46',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  aiFeatureCardPurple: {
    backgroundColor: '#FAF8FF',
    borderColor: '#E9D5FF',
    shadowColor: '#7C3AED',
  },
  aiCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiBadgePill: {
    backgroundColor: '#D1F2D9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  aiBadgePillPurple: {
    backgroundColor: '#EDE9FE',
  },
  aiBadgeText: {
    ...FONTS.muktaBold,
    fontSize: 9,
    color: '#166534',
    letterSpacing: 0.5,
  },
  aiBadgeTextPurple: {
    color: '#6B21A8',
  },
  aiCardTitle: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: '#14532D',
  },
  aiCardTitlePurple: {
    color: '#581C87',
  },
  aiCardSub: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: '#365314',
    marginTop: 2,
    lineHeight: 14,
  },
  aiCardSubPurple: {
    color: '#6B21A8',
  },
  aiFeatureCardBlue: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
  },
  aiBadgePillBlue: {
    backgroundColor: '#E0F2FE',
  },
  aiBadgeTextBlue: {
    color: '#0369A1',
  },
  aiCardTitleBlue: {
    color: '#0C4A6E',
  },
  aiCardSubBlue: {
    color: '#0369A1',
  },
  aiFeatureCardAmber: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
  },
  aiBadgePillAmber: {
    backgroundColor: '#FEF3C7',
  },
  aiBadgeTextAmber: {
    color: '#B45309',
  },
  aiCardTitleAmber: {
    color: '#78350F',
  },
  aiCardSubAmber: {
    color: '#B45309',
  },
  aiFeatureCardTeal: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
  },
  aiBadgePillTeal: {
    backgroundColor: '#DCFCE7',
  },
  aiBadgeTextTeal: {
    color: '#047857',
  },
  aiCardTitleTeal: {
    color: '#064E3B',
  },
  aiCardSubTeal: {
    color: '#047857',
  },
  aiFeatureCardIndigo: {
    backgroundColor: '#F5F7FF',
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
  },
  aiBadgePillIndigo: {
    backgroundColor: '#E0E7FF',
  },
  aiBadgeTextIndigo: {
    color: '#4338CA',
  },
  aiCardTitleIndigo: {
    color: '#312E81',
  },
  aiCardSubIndigo: {
    color: '#4338CA',
  },
});
