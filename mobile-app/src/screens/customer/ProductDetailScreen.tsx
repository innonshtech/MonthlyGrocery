import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { useCart, Product } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS } from '../../constants/theme';
import { getProductDiscountPercent } from '../../utils/productDiscount';
import { getProductPackLabel } from '../../utils/packUnit';
import {
  fetchProductDetailConfigWithStatus,
  fetchProductDetail,
  parseProductHighlights,
  formatProductDetailTemplate,
  ProductDetailScreenConfig,
  DEFAULT_PRODUCT_DETAIL_CONFIG,
} from '../../services/productDetailApi';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  const { items, addToCart, updateQuantity } = useCart();
  const { city, area, pincode } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const carouselRef = useRef<any>(null);

  const [screenConfig, setScreenConfig] = useState<ProductDetailScreenConfig>(DEFAULT_PRODUCT_DETAIL_CONFIG);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Product[]>([]);
  const [selectedPackSize, setSelectedPackSize] = useState<string>('5 kg');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Build multi-media items list (All angle Images + SVG + Demo Video) with smart family gallery fallback
  const mediaList = useMemo(() => {
    if (!product) return [];
    const list: Array<{ id: string; type: 'image' | 'video'; url: string; isSvg?: boolean }> = [];

    // 1. Collect the most complete gallery (all angles) and video across all family variants
    let familyGalleryImages: string[] = [];
    let familyVideo: string | null = null;

    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (Array.isArray(v.images) && v.images.length > familyGalleryImages.length) {
          familyGalleryImages = v.images;
        } else if (familyGalleryImages.length === 0 && v.image_url) {
          familyGalleryImages = [v.image_url];
        }
        if (!familyVideo && v.video_url) {
          familyVideo = v.video_url;
        }
      }
    }

    // 2. Determine which image set to display:
    // If current variant has a dedicated multi-image gallery (>1), use it;
    // Otherwise inherit the full family multi-angle gallery!
    let rawImages: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 1) {
      rawImages = product.images;
    } else if (familyGalleryImages.length > 0) {
      rawImages = familyGalleryImages;
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      rawImages = product.images;
    } else if (product.image_url) {
      rawImages = [product.image_url];
    }

    rawImages.forEach((img, idx) => {
      if (typeof img === 'string' && img.trim()) {
        const clean = img.trim();
        const isSvg = clean.toLowerCase().endsWith('.svg') || clean.toLowerCase().split('?')[0].endsWith('.svg');
        list.push({ id: `img-${idx}`, type: 'image', url: clean, isSvg });
      }
    });

    // 3. Video URL (current variant override or family video)
    const videoUrl = product.video_url || familyVideo;
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
      list.push({ id: 'video-0', type: 'video', url: videoUrl.trim() });
    }

    return list;
  }, [product, variants]);

  // Reset active media slide on product change
  useEffect(() => {
    setActiveMediaIndex(0);
    carouselRef.current?.scrollTo({ x: 0, animated: false });
  }, [product?.id]);

  const hasDeliveryArea = Boolean(city?.trim() && area?.trim());
  const totalCartCount = items.reduce((s, i) => s + i.quantity, 0);

  const loadConfig = useCallback(async () => {
    const result = await fetchProductDetailConfigWithStatus();
    setScreenConfig(result.config);
    return result;
  }, []);

  const loadProduct = useCallback(async () => {
    if (!productId || !hasDeliveryArea) {
      setProduct(null);
      setVariants([]);
      setFetchError(false);
      setNotFound(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(false);
    setNotFound(false);

    const result = await fetchProductDetail({
      productId,
      city: city ?? undefined,
      area: area ?? undefined,
      pincode: pincode ?? undefined,
    });

    if (result.error) {
      setFetchError(true);
      setProduct(null);
      setVariants([]);
    } else if (result.notFound) {
      setNotFound(true);
      setProduct(null);
      setVariants([]);
    } else {
      setProduct(result.product);
      setVariants(result.variants);
      if (result.product) {
        setSelectedPackSize(getProductPackLabel(result.product));
      }
    }
    setLoading(false);
  }, [productId, hasDeliveryArea, city, area, pincode]);

  const loadAll = useCallback(async () => {
    await loadConfig();
    await loadProduct();
  }, [loadConfig, loadProduct]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} on Monthly Grocery!`,
        title: product.name,
      });
    } catch {
      // Ignored
    }
  };

  const renderBody = () => {
    if (!hasDeliveryArea) {
      return (
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
      );
    }

    if (loading) {
      return (
        <View style={styles.centerLoading}>
          <AppLoader message="Loading product..." />
        </View>
      );
    }

    if (fetchError) {
      return (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{screenConfig?.load_error_message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadProduct} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>{screenConfig?.retry_label}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (notFound || !product) {
      return (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{screenConfig?.not_found_message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadProduct} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>{screenConfig?.retry_label}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const price = parseFloat(String(product.price)) || 0;
    const mrp = parseFloat(String(product.mrp)) || price;
    const pctOff = getProductDiscountPercent(product);
    const activePackUnit = getProductPackLabel(product) || selectedPackSize;
    const highlightsList = parseProductHighlights(product);
    const unitSuffix = screenConfig
      ? formatProductDetailTemplate(screenConfig.unit_price_suffix_template, { unit: activePackUnit })
      : `${activePackUnit} · incl. taxes`;

    const cartItem = items.find((i) => i.product?.id === product.id);
    const qty = cartItem ? cartItem.quantity : 0;

    // Weight variant options: dynamically from backend product family variants
    const weightOptions =
      variants.length > 1
        ? variants.map((v) => ({
            id: v.id,
            label: getProductPackLabel(v) || v.unit || 'Pack',
            productObj: v,
          }))
        : [
            {
              id: product.id,
              label: getProductPackLabel(product) || product.unit || 'Pack',
              productObj: product,
            },
          ];

    return (
      <>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Amazon / Flipkart Multi-Media Hero Section */}
          <View style={styles.heroContainer}>
            {/* Discount Badge */}
            {pctOff > 0 && (
              <View style={styles.discountBadgeTop}>
                <Text style={styles.discountBadgeTopText}>{pctOff}% OFF</Text>
              </View>
            )}

            {/* Media Counter Badge */}
            {mediaList.length > 1 && (
              <View style={styles.mediaCounterBadge}>
                <Text style={styles.mediaCounterText}>
                  {mediaList[activeMediaIndex]?.type === 'video'
                    ? '🎥 Video'
                    : `${activeMediaIndex + 1} / ${mediaList.length}`}
                </Text>
              </View>
            )}

            {/* Swipeable Media Carousel */}
            {mediaList.length > 0 ? (
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  setActiveMediaIndex(Math.max(0, Math.min(idx, mediaList.length - 1)));
                }}
                style={{ width: screenWidth, height: 260 }}
              >
                {mediaList.map((item) => (
                  <View key={item.id} style={[styles.carouselSlide, { width: screenWidth }]}>
                    {item.type === 'video' ? (
                      <TouchableOpacity
                        style={styles.videoSlideContainer}
                        activeOpacity={0.9}
                        onPress={() => {
                          if (item.url) {
                            Linking.openURL(item.url).catch(() => {});
                          }
                        }}
                      >
                        <View style={styles.videoPlayCircle}>
                          <AppIcon name="play" size={26} color="#FFFFFF" />
                        </View>
                        <Text style={styles.videoSlideTitle}>Product Video Demonstration</Text>
                        <Text style={styles.videoSlideSubtitle}>Tap to watch video demo</Text>
                      </TouchableOpacity>
                    ) : item.isSvg ? (
                      <View style={styles.svgWrapper}>
                        <SvgUri
                          uri={item.url}
                          width={screenWidth * 0.75}
                          height={220}
                          onError={() => {}}
                        />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: item.url }}
                        style={styles.heroImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.imageWrapper}>
                <AppIcon name="shopping-bag" size={90} color={COLORS.green700} />
              </View>
            )}

            {/* Pagination Dots */}
            {mediaList.length > 1 && (
              <View style={styles.paginationDots}>
                {mediaList.map((_, idx) => (
                  <View
                    key={idx}
                    style={idx === activeMediaIndex ? styles.activeDot : styles.inactiveDot}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Interactive Thumbnail Navigation Strip */}
          {mediaList.length > 1 && (
            <View style={styles.thumbnailStripContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailStripContent}
              >
                {mediaList.map((item, idx) => {
                  const isActive = idx === activeMediaIndex;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.thumbnailItem,
                        isActive && styles.thumbnailItemActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setActiveMediaIndex(idx);
                        carouselRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
                      }}
                    >
                      {item.type === 'video' ? (
                        <View style={styles.videoThumbBadge}>
                          <AppIcon name="play" size={16} color={isActive ? '#1E7A46' : '#64748B'} />
                        </View>
                      ) : item.isSvg ? (
                        <SvgUri uri={item.url} width={34} height={34} onError={() => {}} />
                      ) : (
                        <Image
                          source={{ uri: item.url }}
                          style={styles.thumbnailImage}
                          resizeMode="contain"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 2. Product Information Area (Figma Node 459-703) */}
          <View style={styles.detailsContainer}>
            {/* Title */}
            <Text style={styles.productTitle}>{product.name}</Text>

            {/* 3. Weight / Variant Selector Boxes (Figma Node 459-710) */}
            {weightOptions.length > 0 && (
              <View style={styles.weightSelectorRow}>
                {weightOptions.map((opt) => {
                  const isSelected =
                    variants.length > 1
                      ? opt.productObj.id === product.id
                      : opt.label === selectedPackSize;

                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.weightBox, isSelected && styles.weightBoxSelected]}
                      onPress={() => {
                        if (variants.length > 1 && opt.productObj) {
                          setProduct(opt.productObj);
                        }
                        setSelectedPackSize(opt.label);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.weightText, isSelected && styles.weightTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 4. Price & Discount Row */}
            <View style={styles.priceRow}>
              <Text style={styles.sellingPrice}>₹{price}</Text>
              {mrp > price && (
                <Text style={styles.mrpPrice}>₹{mrp}</Text>
              )}
              {pctOff > 0 && (
                <View style={styles.greenDiscountBadge}>
                  <Text style={styles.greenDiscountText}>{pctOff}% OFF</Text>
                </View>
              )}
            </View>

            {/* 5. Planned 4-Hour Delivery Banner (Figma Node 459-717) */}
            <View style={styles.deliveryBanner}>
              <AppIcon name="zap" size={15} color="#F59E0B" />
              <Text style={styles.deliveryText}>
                {screenConfig?.delivery_window_label || 'Delivered in your planned 4-hour window'}
              </Text>
            </View>

            {/* 6. Dynamic Highlights Section (from product description / short description) */}
            {highlightsList.length > 0 && (
              <View style={styles.highlightsCard}>
                <Text style={styles.highlightsHeader}>
                  {screenConfig?.highlights_section_label || 'HIGHLIGHTS'}
                </Text>
                {highlightsList.map((item, index) => (
                  <View key={index} style={styles.highlightRow}>
                    <View style={styles.checkCircle}>
                      <AppIcon name="check" size={10} color="#1E7A46" />
                    </View>
                    <Text style={styles.highlightText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 7. Bottom Sticky Checkout / Add to Cart Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomPriceText}>₹{(qty > 0 ? qty : 1) * price}</Text>
            <Text style={styles.bottomUnitText}>
              {qty > 1 ? `${qty} × ₹${price} (${activePackUnit})` : unitSuffix}
            </Text>
          </View>

          {qty > 0 ? (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(product.id, qty - 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperCountText}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => addToCart(product)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={() => addToCart(product)}
              activeOpacity={0.88}
            >
              <AppIcon name="cart" size={16} color="#FFFFFF" />
              <Text style={styles.addToCartBtnText}>
                {screenConfig?.add_to_cart_label || 'Add to cart'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Reworked Top Navigation Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circularBtn}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="chevron-left" size={18} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Right Actions: Share & Cart */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.circularBtn}
            onPress={handleShare}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="share" size={18} color="#1A1A1A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circularBtn}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon
              name="cart"
              size={18}
              color="#1A1A1A"
              badge={totalCartCount > 0 ? totalCartCount : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bodyFlex}>{renderBody()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bodyFlex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 10,
  },
  retryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* 1. Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circularBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2.5,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* 2. Hero Image Section (Figma Node 459-696) */
  heroContainer: {
    width: '100%',
    height: 290,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  discountBadgeTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  discountBadgeTopText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mediaCounterBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(23, 37, 30, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  mediaCounterText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  carouselSlide: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  svgWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSlideContainer: {
    width: '85%',
    height: 190,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  videoPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#1E7A46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  videoSlideTitle: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  videoSlideSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  thumbnailStripContainer: {
    backgroundColor: '#FAF9F5',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  thumbnailStripContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  thumbnailItem: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  thumbnailItemActive: {
    borderColor: '#1E7A46',
    backgroundColor: '#E4F3EA',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbBadge: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  imageWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1E7A46',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },

  /* 3. Details Container (Figma Node 459-712) */
  detailsContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
  },
  productTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: '#17251E', // var(--ink-900, #17251E)
    alignSelf: 'stretch',
  },

  /* Weight Selector (Figma Node 459-710) */
  weightSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  weightBox: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE9E2', // surface/line
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightBoxSelected: {
    backgroundColor: '#E4F3EA', // green/100
    borderWidth: 1.5,
    borderColor: '#1E7A46', // green/700
  },
  weightText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: '#3D4A44', // ink/700
  },
  weightTextSelected: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#1E7A46', // green/700
  },

  /* Price & Discount */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellingPrice: {
    ...FONTS.balooBold,
    fontSize: 24,
    color: '#17251E', // ink/900
    lineHeight: 28,
  },
  mrpPrice: {
    ...FONTS.muktaRegular,
    fontSize: 15,
    color: '#A7B0AB', // ink/300
    textDecorationLine: 'line-through',
  },
  greenDiscountBadge: {
    backgroundColor: '#E4F3EA', // green/100
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  greenDiscountText: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#1E7A46', // green/700
  },

  /* Delivery Banner (Figma Node 459-717) */
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F9F5', // green/50
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignSelf: 'stretch',
  },
  deliveryText: {
    ...FONTS.muktaMedium,
    fontSize: 12.5,
    color: '#3D4A44', // ink/700
    flex: 1,
    lineHeight: 18,
  },

  /* Highlights Card (Figma Node 460-674) */
  highlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAE9E2', // surface/line
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  highlightsHeader: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#6B7772', // ink/500
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E4F3EA', // green/100
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightText: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    color: '#3D4A44', // ink/700
    lineHeight: 19,
  },

  /* 7. Bottom Sticky Bar (Figma Node 460-696) */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    minHeight: 84,
  },
  bottomPriceCol: {
    gap: 2,
  },
  bottomPriceText: {
    ...FONTS.balooBold,
    fontSize: 24,
    color: '#17251E', // ink/900
    lineHeight: 28,
  },
  bottomUnitText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E7A46',
    minWidth: 165,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addToCartBtnText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E7A46',
    borderRadius: 12,
    height: 48,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    ...FONTS.muktaBold,
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  stepperCountText: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#FFFFFF',
    minWidth: 26,
    textAlign: 'center',
  },
});
