import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import AuthGateModal, { AuthGateType } from '../../components/AuthGateModal';
import { CheckoutFallbackEmoji } from '../../components/CheckoutFigmaIcons';
import { homeDealBg } from '../../utils/productDiscount';
import { getProductPackLabel } from '../../utils/packUnit';
import {
  fetchCartScreenConfigWithStatus,
  formatCartTemplate,
  getEmptyPreviewImages,
  CartScreenConfig,
} from '../../services/cartApi';
import { calculateCouponDiscount } from '../../utils/couponDiscount';

function Stepper({
  quantity,
  onDecrement,
  onIncrement,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={onDecrement} activeOpacity={0.7}>
        <Text style={styles.stepBtnTxt}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepQty}>{quantity}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={onIncrement} activeOpacity={0.7}>
        <Text style={styles.stepBtnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen({
  route,
  navigation,
  setActiveTab,
}: {
  route?: any;
  navigation: any;
  setActiveTab?: (tab: 'Home' | 'Categories' | 'Cart' | 'Orders' | 'Account') => void;
}) {
  const { token, city, area } = useAuth();
  const insets = useSafeAreaInsets();
  const { items, minOrderLimit, updateQuantity, addToCart, appliedCoupon, setAppliedCoupon } = useCart();

  const [screenConfig, setScreenConfig] = useState<CartScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [authGateType, setAuthGateType] = useState<AuthGateType>('checkout');

  useEffect(() => {
    if (route?.params?.appliedCoupon) {
      setAppliedCoupon(route.params.appliedCoupon);
    }
  }, [route?.params?.appliedCoupon, setAppliedCoupon]);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const result = await fetchCartScreenConfigWithStatus();
    setScreenConfig(result.config);
    setConfigError(result.error);
    setConfigLoading(false);
    return result;
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const minLimit = minOrderLimit || 0;

  const itemTotalMrp = items.reduce((sum, item) => {
    const mrp = parseFloat(String(item.product.mrp)) || parseFloat(String(item.product.price)) || 0;
    return sum + mrp * item.quantity;
  }, 0);

  const itemTotalPrice = items.reduce((sum, item) => {
    return sum + (parseFloat(String(item.product.price)) || 0) * item.quantity;
  }, 0);

  const couponDiscount = useMemo(
    () => calculateCouponDiscount(appliedCoupon, itemTotalPrice),
    [appliedCoupon, itemTotalPrice],
  );

  const rawSavings = Math.max(0, itemTotalMrp - itemTotalPrice);
  const totalSavings = rawSavings + couponDiscount;
  const toPay = Math.max(0, itemTotalPrice - couponDiscount);
  const isBelowMin = minLimit > 0 && toPay < minLimit;
  const amountNeeded = Math.max(0, minLimit - toPay);
  const totalItemCount = items.reduce((s, i) => s + i.quantity, 0);
  const progressPct = minLimit > 0 ? Math.min(100, Math.round((toPay / minLimit) * 100)) : 100;

  const headerCountLabel =
    totalItemCount === 1
      ? screenConfig?.cart_item_label ?? ''
      : screenConfig
        ? formatCartTemplate(screenConfig.cart_items_template, { count: totalItemCount })
        : '';

  const emptyPreviewImages = getEmptyPreviewImages(screenConfig);

  const handleCheckout = () => {
    if (!city?.trim() || !area?.trim()) {
      Alert.alert(
        'Delivery Location Required',
        'Please select your delivery city and area before proceeding to checkout.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Location', onPress: () => navigation.navigate('CitySelection') },
        ],
      );
      return;
    }
    if (isBelowMin && screenConfig) {
      Alert.alert(
        'Minimum order value',
        formatCartTemplate(screenConfig.min_order_alert_template, {
          amount: amountNeeded.toLocaleString('en-IN'),
          minimum: minLimit.toLocaleString('en-IN'),
        }),
      );
      return;
    }
    if (!token) {
      setAuthGateType('checkout');
      setAuthGateVisible(true);
      return;
    }
    navigation.navigate('Checkout', { appliedCoupon, discountAmount: couponDiscount });
  };

  const handleSaveBasket = () => {
    if (!token) {
      setAuthGateType('save_basket');
      setAuthGateVisible(true);
      return;
    }
    navigation.navigate('SavedBaskets', { openSave: true });
  };

  const safeEdges: ('top' | 'left' | 'right')[] = setActiveTab ? ['left', 'right'] : ['top', 'left', 'right'];

  if (configError && !screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <TouchableOpacity style={styles.retryBtn} onPress={loadConfig} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (configLoading && !screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <AppLoader message="Loading cart..." />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={safeEdges}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else if (setActiveTab) {
                setActiveTab('Home');
              } else {
                navigation.navigate('Shop', { initialTab: 'Home' });
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="chevron-left" size={24} color={COLORS.ink900} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{screenConfig?.title || 'Your cart'}</Text>
        </View>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="cart" size={48} color={COLORS.green700} />
            </View>

            <View style={[styles.floatingBadge, styles.floatingBadgeTopLeft]}>
              <CheckoutFallbackEmoji index={0} size={24} />
            </View>

            <View style={[styles.floatingBadge, styles.floatingBadgeBottomRight]}>
              <CheckoutFallbackEmoji index={2} size={24} />
            </View>
          </View>

          <Text style={styles.emptyTitle}>{screenConfig?.empty_title}</Text>
          <Text style={styles.emptySub}>{screenConfig?.empty_message}</Text>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => {
              if (setActiveTab) {
                setActiveTab('Home');
              }
              navigation.navigate('Shop', { initialTab: 'Home' });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnTxt}>{screenConfig?.start_shopping_label}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reorderLink}
            onPress={() => navigation.navigate('CopyLastMonth')}
            activeOpacity={0.7}
          >
            <View style={styles.reorderLinkInner}>
              <AppIcon name="repeat" size={18} color={COLORS.green700} />
              <Text style={styles.reorderLinkTxt}>{screenConfig?.reorder_last_month_label}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const belowMinTitle = screenConfig
    ? formatCartTemplate(screenConfig.below_min_title_template, {
        amount: amountNeeded.toLocaleString('en-IN'),
      })
    : '';
  const belowMinFootnote = screenConfig
    ? formatCartTemplate(screenConfig.below_min_footnote_template, {
        current: toPay.toLocaleString('en-IN'),
        minimum: minLimit.toLocaleString('en-IN'),
      })
    : '';
  const savingsBannerText = screenConfig
    ? formatCartTemplate(screenConfig.savings_banner_template, {
        savings: totalSavings.toLocaleString('en-IN'),
      })
    : '';
  const addMoreCheckoutLabel = screenConfig
    ? formatCartTemplate(screenConfig.add_more_checkout_template, {
        amount: amountNeeded.toLocaleString('en-IN'),
      })
    : '';
  const couponAppliedLabel =
    appliedCoupon && screenConfig
      ? formatCartTemplate(screenConfig.coupon_applied_template, {
          code: appliedCoupon.code,
          discount: couponDiscount.toLocaleString('en-IN'),
        })
      : '';

  return (
    <SafeAreaView style={styles.safe} edges={safeEdges}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else if (setActiveTab) {
              setActiveTab('Home');
            } else {
              navigation.navigate('Shop', { initialTab: 'Home' });
            }
          }}
          activeOpacity={0.7}
        >
          <AppIcon name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{screenConfig?.title || 'Your cart'}</Text>
        <View style={styles.topHeaderRight}>
          {headerCountLabel ? <Text style={styles.topCount}>{headerCountLabel}</Text> : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isBelowMin ? (
          <View style={styles.belowMinBanner}>
            <View style={styles.belowMinHeaderRow}>
              <AppIcon name="help" size={18} color="#155A38" />
              <Text style={styles.belowMinTitle}>{belowMinTitle}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.belowMinFootnote}>{belowMinFootnote}</Text>
          </View>
        ) : (
          <View style={styles.savingsBanner}>
            <AppIcon name="sparkles" size={16} color="#D97706" />
            <Text style={styles.savingsTxt}>{savingsBannerText}</Text>
          </View>
        )}

        <View style={styles.itemsCard}>
          {items.map((cartItem, idx) => {
            const price = parseFloat(String(cartItem.product.price)) || 0;
            const lineTotal = price * cartItem.quantity;
            const packLabel = getProductPackLabel(cartItem.product);

            return (
              <View
                key={cartItem.product.id}
                style={[styles.itemRow, idx < items.length - 1 && styles.itemRowBorder]}
              >
                <View style={[styles.imgTile, { backgroundColor: homeDealBg(idx) }]}>
                  {cartItem.product.image_url ? (
                    <Image
                      source={{ uri: cartItem.product.image_url }}
                      style={styles.imgTileImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <AppIcon name="shopping-bag" size={24} color={COLORS.green700} />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{cartItem.product.name}</Text>
                  {packLabel ? <Text style={styles.itemUnit}>{packLabel}</Text> : null}
                  <Text style={styles.itemPrice}>₹{lineTotal.toLocaleString('en-IN')}</Text>
                </View>

                <Stepper
                  quantity={cartItem.quantity}
                  onDecrement={() => updateQuantity(cartItem.product.id, cartItem.quantity - 1)}
                  onIncrement={() => addToCart(cartItem.product)}
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBasketRow} onPress={handleSaveBasket} activeOpacity={0.8}>
          <View style={styles.saveBasketIcon}>
            <AppIcon name="bookmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.saveBasketTxt}>{screenConfig?.save_basket_label || 'Save this cart as a basket'}</Text>
          <AppIcon name="chevron-right" size={16} color="#15803D" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.couponRow}
          onPress={() => navigation.navigate('OffersCoupons', { currentTotal: itemTotalPrice })}
          activeOpacity={0.8}
        >
          <AppIcon name="percent" size={18} color="#15803D" />
          <Text style={styles.couponTxt}>
            {appliedCoupon ? couponAppliedLabel : (screenConfig?.apply_coupon_label || 'Apply coupon')}
          </Text>
          <AppIcon name="chevron-right" size={16} color="#15803D" />
        </TouchableOpacity>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>{screenConfig?.bill_details_title || 'Bill details'}</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{screenConfig?.bill_item_total_label || 'Item total (MRP)'}</Text>
            <Text style={styles.billVal}>₹{itemTotalMrp.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{screenConfig?.bill_savings_label || 'Savings'}</Text>
            <Text style={[styles.billVal, styles.savingsVal]}>
              − ₹{totalSavings.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{screenConfig?.bill_delivery_fee_label || 'Delivery fee'}</Text>
            <Text style={[styles.billVal, styles.freeDeliveryVal]}>
              {screenConfig?.bill_delivery_fee_value || 'FREE'}
            </Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{screenConfig?.bill_coupon_discount_label || 'Coupon discount'}</Text>
              <Text style={[styles.billVal, styles.savingsVal]}>
                − ₹{couponDiscount.toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>{screenConfig?.bill_to_pay_label || 'To pay'}</Text>
            <Text style={styles.billTotalVal}>₹{toPay.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.checkoutBarInner}>
          <View style={styles.toPayCol}>
            <Text style={styles.toPayLabel}>{screenConfig?.sticky_to_pay_label || 'TO PAY'}</Text>
            <Text style={styles.toPayAmount}>₹{toPay.toLocaleString('en-IN')}</Text>
          </View>

          {isBelowMin ? (
            <TouchableOpacity
              style={styles.checkoutBtnDisabled}
              onPress={handleCheckout}
              activeOpacity={0.9}
            >
              <Text style={styles.checkoutBtnTxt}>{addMoreCheckoutLabel}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
              <Text style={styles.checkoutBtnTxt}>{screenConfig?.proceed_to_pay_label || 'Proceed to checkout'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <AuthGateModal
        visible={authGateVisible}
        type={authGateType}
        onClose={() => setAuthGateVisible(false)}
        onContinue={() => {
          setAuthGateVisible(false);
          navigation.navigate('Login', {
            redirect: authGateType === 'checkout' ? 'Checkout' : 'SavedBaskets',
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9F9F7',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  topTitle: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  topHeaderRight: {
    marginLeft: 'auto',
  },
  topCount: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink500,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  emptyIconContainer: {
    width: 116,
    height: 116,
    position: 'relative',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#E4F3EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeImg: {
    width: 20,
    height: 20,
  },
  floatingBadgeTopLeft: {
    top: 2,
    left: 2,
  },
  floatingBadgeBottomRight: {
    bottom: 4,
    right: 4,
  },
  emptyTitle: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#17251E',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: '#6B7772',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: 20,
  },
  startBtn: {
    height: 42,
    paddingHorizontal: 26,
    borderRadius: 10,
    backgroundColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  startBtnTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  reorderLink: {
    paddingVertical: 6,
  },
  reorderLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderLinkTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: '#1E7A46',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  savingsTxt: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.marigold700,
  },
  belowMinBanner: {
    padding: 13,
    backgroundColor: '#E4F3EA',
    borderWidth: 1,
    borderColor: '#CDE9D6',
    borderRadius: 14,
    marginBottom: 14,
    gap: 10,
  },
  belowMinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  belowMinTitle: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: '#155A38',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.green700,
    borderRadius: 999,
  },
  belowMinFootnote: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink700,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  imgTile: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  imgTileImg: {
    width: 38,
    height: 38,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    ...FONTS.muktaSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.ink900,
    marginBottom: 2,
  },
  itemUnit: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    marginBottom: 2,
  },
  itemPrice: {
    ...FONTS.muktaBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.ink900,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 8,
    height: 30,
    paddingHorizontal: 2,
    flexShrink: 0,
  },
  stepBtn: {
    width: 26,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    minWidth: 16,
    textAlign: 'center',
  },
  saveBasketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#C2E7CB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  saveBasketIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  saveBasketTxt: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.green700,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  couponTxt: {
    flex: 1,
    ...FONTS.muktaSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.green700,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  billTitle: {
    ...FONTS.muktaBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.ink700,
    marginBottom: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    ...FONTS.muktaRegular,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.ink500,
  },
  billVal: {
    ...FONTS.muktaMedium,
    fontSize: 13.5,
    lineHeight: 18,
    color: COLORS.ink900,
  },
  savingsVal: {
    color: COLORS.marigold700,
  },
  freeDeliveryVal: {
    ...FONTS.muktaBold,
    color: COLORS.green700,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    ...FONTS.muktaBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.ink900,
  },
  billTotalVal: {
    ...FONTS.balooBold,
    fontSize: 17,
    lineHeight: 22,
    color: COLORS.ink900,
  },
  checkoutBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  checkoutBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toPayCol: {
    justifyContent: 'center',
  },
  toPayLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.ink500,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toPayAmount: {
    ...FONTS.muktaBold,
    fontSize: 22,
    lineHeight: 26,
    color: COLORS.ink900,
  },
  checkoutBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 180,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
