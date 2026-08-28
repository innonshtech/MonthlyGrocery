import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart, Product } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS } from '../../constants/theme';
import { getProductDiscountPercent, homeDealBg } from '../../utils/productDiscount';
import { getProductPackLabel } from '../../utils/packUnit';
import {
  fetchProductDetailConfigWithStatus,
  fetchProductDetail,
  parseProductHighlights,
  formatProductDetailTemplate,
  ProductDetailScreenConfig,
} from '../../services/productDetailApi';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  const { items, addToCart, updateQuantity } = useCart();
  const { city, area } = useAuth();
  const insets = useSafeAreaInsets();

  const [screenConfig, setScreenConfig] = useState<ProductDetailScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const hasDeliveryArea = Boolean(city?.trim() && area?.trim());
  const totalCartCount = items.reduce((s, i) => s + i.quantity, 0);

  const loadConfig = useCallback(async () => {
    const result = await fetchProductDetailConfigWithStatus();
    setScreenConfig(result.config);
    setConfigError(result.error);
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
    }
    setLoading(false);
  }, [productId, hasDeliveryArea, city, area]);

  const loadAll = useCallback(async () => {
    await loadConfig();
    await loadProduct();
  }, [loadConfig, loadProduct]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (configError && !screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <TouchableOpacity style={styles.retryBtn} onPress={loadConfig} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
    const activePackUnit = getProductPackLabel(product);
    const highlightsList = parseProductHighlights(product);
    const unitSuffix = screenConfig
      ? formatProductDetailTemplate(screenConfig.unit_price_suffix_template, { unit: activePackUnit })
      : activePackUnit;

    const cartItem = items.find((i) => i.product?.id === product.id);
    const qty = cartItem ? cartItem.quantity : 0;

    return (
      <>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroBox, { backgroundColor: homeDealBg(0) }]}>
            {pctOff > 0 && (
              <View style={styles.offBadge}>
                <Text style={styles.offBadgeTxt}>{pctOff}% OFF</Text>
              </View>
            )}

            {product.image_url ? (
              <Image source={{ uri: product.image_url }} style={styles.heroImg} resizeMode="contain" />
            ) : (
              <AppIcon name="shopping-bag" size={72} color={COLORS.green700} />
            )}
          </View>

          <View style={styles.infoArea}>
            <Text style={styles.prodName}>{product.name}</Text>

            {variants.length > 1 && (
              <View style={styles.variantsRow}>
                {variants.map((v) => {
                  const isSelected = v.id === product.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.variantPill, isSelected && styles.variantPillOn]}
                      onPress={() => setProduct(v)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.variantPillTxt, isSelected && styles.variantPillTxtOn]}>
                        {getProductPackLabel(v)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.priceVal}>₹{price}</Text>
              {mrp > price && (
                <>
                  <Text style={styles.mrpVal}>₹{mrp}</Text>
                  {pctOff > 0 && (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeTxt}>{pctOff}% OFF</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.deliveredBanner}>
              <AppIcon name="help" size={16} color={COLORS.green700} />
              <Text style={styles.deliveredTxt}>{screenConfig?.delivery_window_label}</Text>
            </View>
          </View>

          {highlightsList.length > 0 && (
            <View style={styles.highlightsCard}>
              <Text style={styles.highlightsTitle}>{screenConfig?.highlights_section_label}</Text>
              {highlightsList.map((hl, index) => (
                <View key={index} style={styles.hlRow}>
                  <View style={styles.hlIconCircle}>
                    <AppIcon name="search" size={12} color={COLORS.green700} />
                  </View>
                  <Text style={styles.hlTxt}>{hl}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomPrice}>₹{price}</Text>
            <Text style={styles.bottomUnit}>{unitSuffix}</Text>
          </View>

          {qty > 0 ? (
            <View style={styles.bottomStepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateQuantity(product.id, qty - 1)}
              >
                <Text style={styles.stepTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepQty}>{qty}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => addToCart(product)}>
                <Text style={styles.stepTxt}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addCartBtn}
              onPress={() => addToCart(product)}
              activeOpacity={0.85}
            >
              <AppIcon name="cart" size={16} color="#FFFFFF" />
              <Text style={styles.addCartTxt}>{screenConfig?.add_to_cart_label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Cart')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon
            name="cart"
            size={22}
            color={COLORS.ink900}
            badge={totalCartCount > 0 ? totalCartCount : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bodyFlex}>{renderBody()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
  bodyFlex: {
    flex: 1,
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
    borderRadius: 12,
  },
  retryBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  heroBox: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  offBadge: {
    position: 'absolute',
    top: 16,
    left: 20,
    backgroundColor: '#E4F3EA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 2,
  },
  offBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.green700,
  },
  heroImg: {
    width: 150,
    height: 150,
  },

  infoArea: {
    marginBottom: 20,
    gap: 12,
  },
  prodName: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceVal: {
    ...FONTS.balooBold,
    fontSize: 26,
    color: COLORS.ink900,
    lineHeight: 32,
  },
  mrpVal: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: '#E4F3EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBadgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.green700,
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F9F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  deliveredTxt: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink900,
    flex: 1,
  },

  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantPill: {
    flex: 1,
    minWidth: 80,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantPillOn: {
    backgroundColor: '#E4F3EA',
    borderColor: COLORS.green700,
  },
  variantPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  variantPillTxtOn: {
    color: COLORS.green700,
  },

  highlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  highlightsTitle: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.44,
  },
  hlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hlIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E4F3EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hlTxt: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink900,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
    minHeight: 80,
  },
  bottomLeft: {
    gap: 2,
  },
  bottomPrice: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    lineHeight: 26,
  },
  bottomUnit: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addCartTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  bottomStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 48,
  },
  stepBtn: {
    width: 32,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTxt: {
    ...FONTS.muktaBold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
    minWidth: 20,
    textAlign: 'center',
  },
});
