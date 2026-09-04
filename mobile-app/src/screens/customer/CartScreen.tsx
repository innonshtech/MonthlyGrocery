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

  if (configLoading && !screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <AppLoader message="Loading cart..." />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.topHeader}>
          <Text style={styles.topTitle}>{screenConfig?.title}</Text>
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>{screenConfig?.title}</Text>
        {headerCountLabel ? <Text style={styles.topCount}>{headerCountLabel}</Text> : null}
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
            <AppIcon name="tag" size={18} color="#8A5200" />
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
                    <AppIcon name="shopping-bag" size={22} color={COLORS.green700} />
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
            <AppIcon name="tag" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.saveBasketTxt}>{screenConfig?.save_basket_label}</Text>
          <AppIcon name="arrow-right" size={16} color={COLORS.green700} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.couponRow}
          onPress={() => navigation.navigate('OffersCoupons', { currentTotal: itemTotalPrice })}
          activeOpacity={0.8}
        >
          <AppIcon name="tag" size={18} color={COLORS.green700} />
          <Text style={styles.couponTxt}>
            {appliedCoupon ? couponAppliedLabel : screenConfig?.apply_coupon_label}
          </Text>
          <AppIcon name="arrow-right" size={16} color={COLORS.ink300} />
        </TouchableOpacity>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>{screenConfig?.bill_details_title}</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{screenConfig?.bill_item_total_label}</Text>
            <Text style={styles.billVal}>₹{itemTotalMrp.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{screenConfig?.bill_savings_label}</Text>
            <Text style={[styles.billVal, styles.savingsVal]}>
              − ₹{totalSavings.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{screenConfig?.bill_delivery_fee_label}</Text>
            <Text style={[styles.billVal, styles.freeDeliveryVal]}>
              {screenConfig?.bill_delivery_fee_value}
            </Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{screenConfig?.bill_coupon_discount_label}</Text>
              <Text style={[styles.billVal, styles.savingsVal]}>
                − ₹{couponDiscount.toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>{screenConfig?.bill_to_pay_label}</Text>
            <Text style={styles.billTotalVal}>₹{toPay.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.checkoutBarInner}>
          <View style={styles.toPayCol}>
            <Text style={styles.toPayLabel}>{screenConfig?.sticky_to_pay_label}</Text>
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
              <Text style={styles.checkoutBtnTxt}>{screenConfig?.proceed_to_pay_label}</Text>
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
    backgroundColor: '#FBFAF6',
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
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.line,
  },
  topTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  topCount: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 30,
  },
  emptyIconContainer: {
    width: 128,
    height: 128,
    position: 'relative',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#E4F3EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FBFAF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeImg: {
    width: 25,
    height: 25,
  },
  floatingBadgeTopLeft: {
    top: -6,
    left: -6,
  },
  floatingBadgeBottomRight: {
    bottom: 8,
    right: 8,
  },
  emptyTitle: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.ink900,
    marginBottom: 8,
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  startBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  startBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  reorderLink: { paddingVertical: 8 },
  reorderLinkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderLinkTxt: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.green700,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FDEFD3',
    borderWidth: 1.5,
    borderColor: '#FBE0AE',
    borderRadius: RADIUS.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 14,
  },
  savingsTxt: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: '#8A5200',
  },
  belowMinBanner: {
    padding: 13,
    backgroundColor: '#E4F3EA',
    borderWidth: 1.5,
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
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.line,
  },
  imgTile: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  imgTileImg: {
    width: 36,
    height: 36,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  itemUnit: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
  },
  itemPrice: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: 9,
    height: 32,
    flexShrink: 0,
  },
  stepBtn: {
    width: 30,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  stepQty: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#FFFFFF',
    minWidth: 18,
    textAlign: 'center',
  },
  saveBasketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#E4F3EA',
    borderWidth: 1.5,
    borderColor: '#CDE9D6',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  saveBasketIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  saveBasketTxt: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.green700,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  couponTxt: {
    flex: 1,
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.green700,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 16,
    gap: 11,
    marginBottom: 16,
  },
  billTitle: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink500,
  },
  billVal: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    color: COLORS.ink900,
  },
  savingsVal: {
    color: '#8A5200',
  },
  freeDeliveryVal: {
    color: COLORS.green700,
  },
  billDivider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    marginVertical: 2,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  billTotalVal: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  checkoutBar: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  checkoutBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  toPayCol: {
    flex: 1,
  },
  toPayLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toPayAmount: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    lineHeight: 28,
  },
  checkoutBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
