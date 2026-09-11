import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import {
  CheckoutBackIcon,
  CheckoutPercentIcon,
} from '../../components/CheckoutFigmaIcons';
import {
  CouponItem,
  OffersCouponsScreenConfig,
  fetchOffersCouponsScreenConfigWithStatus,
  fetchLiveCoupons,
  applyCouponCode,
  formatOffersTemplate,
} from '../../services/offersCouponsApi';

/** Figma C3 canvas background */
const SCREEN_BG = '#FBFAF6';

export type { CouponItem };

export default function OffersCouponsScreen({ navigation, route }: any) {
  const { showToast } = useToast();
  const [screenConfig, setScreenConfig] = useState<OffersCouponsScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [applyingManual, setApplyingManual] = useState(false);

  const { token } = useAuth();
  const { appliedCoupon, setAppliedCoupon, totalAmount: cartAmount } = useCart();

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(false);
    const { config, error } = await fetchOffersCouponsScreenConfigWithStatus();
    setScreenConfig(config);
    setConfigError(error);
    setConfigLoading(false);
  }, []);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    const list = await fetchLiveCoupons(token);
    setCoupons(list);
    setCouponsLoading(false);
  }, [token]);

  useEffect(() => {
    loadConfig();
    loadCoupons();
  }, [loadConfig, loadCoupons]);

  const applyCouponAndReturn = (coupon: CouponItem) => {
    const calculatedDiscount =
      coupon.discount_type === 'fixed'
        ? coupon.discount_value
        : (cartAmount * (coupon.discount_value / 100));
    const finalDiscount = coupon.max_discount
      ? Math.min(calculatedDiscount, coupon.max_discount)
      : calculatedDiscount;

    setAppliedCoupon({
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: finalDiscount,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount: coupon.max_discount,
    });

    showToast({
      type: 'success',
      title: 'Coupon Applied',
      message: `${coupon.code} applied successfully!`,
    });

    navigation.goBack();
  };

  const handleApplyCoupon = (coupon: CouponItem) => {
    if (!screenConfig) return;

    if (cartAmount > 0 && cartAmount < (coupon.min_order_amount || 0)) {
      showToast({
        type: 'info',
        title: screenConfig.min_order_alert_title || 'Minimum Order Required',
        message: formatOffersTemplate(screenConfig.min_order_alert_template, {
          amount: ((coupon.min_order_amount || 0) - cartAmount).toLocaleString('en-IN'),
          code: coupon.code,
        }),
      });
      return;
    }

    applyCouponAndReturn(coupon);
  };

  const handleApplyManualCode = async () => {
    if (!manualCode.trim() || !screenConfig) return;
    setApplyingManual(true);
    const result = await applyCouponCode(manualCode, cartAmount, token);
    if (result.success && result.coupon) {
      applyCouponAndReturn(result.coupon);
    } else {
      showToast({
        type: 'error',
        title: screenConfig.invalid_coupon_alert_title || 'Invalid Coupon',
        message: result.error || screenConfig.apply_failed_fallback,
      });
    }
    setApplyingManual(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedCouponId(expandedCouponId === id ? null : id);
  };

  const getFormattedCouponTitle = (coupon: CouponItem): string => {
    if (coupon.title && !coupon.title.includes('undefined')) {
      return coupon.title;
    }
    const val = coupon.discount_value || 0;
    const minOrder = coupon.min_order_amount || 0;
    if (coupon.discount_type === 'percentage') {
      return `${val}% off on orders above ₹${minOrder.toLocaleString('en-IN')}`;
    }
    return `₹${val} off on orders above ₹${minOrder.toLocaleString('en-IN')}`;
  };

  const buildGuidelineText = (coupon: CouponItem) => {
    if (!screenConfig) return '';
    const audience = coupon.target_audience || 'all';
    let text =
      audience === 'new'
        ? screenConfig.audience_new_guideline
        : audience === 'loyal'
          ? screenConfig.audience_loyal_guideline
          : screenConfig.audience_all_guideline;

    if (coupon.usage_limit_per_user) {
      const limitText = formatOffersTemplate(screenConfig.usage_limit_template, {
        limit: coupon.usage_limit_per_user,
      });
      text = `${text} ${limitText}`;
    }
    return text.trim();
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centeredState}>
          <AppLoader message="Loading offers..." />
        </View>
      </SafeAreaView>
    );
  }

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

  if (!screenConfig) return null;

  const isManualActive = Boolean(manualCode.trim());

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header section matching Figma */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="chevron-left" size={24} color={COLORS.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title || 'Offers & coupons'}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Manual Coupon Input Bar */}
        <View style={styles.applyInputBar}>
          <View style={styles.inputIcon}>
            <CheckoutPercentIcon size={19} color={COLORS.green700} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={screenConfig.manual_code_placeholder || 'Enter coupon code'}
            placeholderTextColor={COLORS.ink300}
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.applyBtn, !isManualActive && styles.applyBtnDisabled]}
            onPress={handleApplyManualCode}
            disabled={applyingManual || !isManualActive}
            activeOpacity={0.85}
          >
            {applyingManual ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyBtnTxt}>{screenConfig.manual_apply_label || 'Apply'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionLabel}>
          {screenConfig.available_section_label || 'AVAILABLE FOR YOU'}
        </Text>

        {couponsLoading ? (
          <View style={styles.centerLoading}>
            <AppLoader message="Loading coupons..." />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {coupons.map((coupon) => {
              const minAmount = coupon.min_order_amount || 0;
              const isEligible = cartAmount === 0 || cartAmount >= minAmount;
              const remainingAmount = minAmount - cartAmount;
              const isExpanded = expandedCouponId === coupon.id;
              const expiryLabel = coupon.expires_at
                ? formatOffersTemplate(screenConfig.expires_template || 'Expires {date}', {
                    date: coupon.expires_at,
                  })
                : 'Expires 31 Aug 2026';
              const displayTitle = getFormattedCouponTitle(coupon);

              return (
                <View key={coupon.id} style={styles.couponCard}>
                  <View style={styles.cardMainRow}>
                    {/* Left Pastel Amber Tile with % Icon */}
                    <View style={styles.leftColorPill}>
                      <CheckoutPercentIcon size={24} color={COLORS.marigold600} />
                    </View>

                    {/* Middle Info Area */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleExpand(coupon.id)}
                      style={styles.couponInfo}
                    >
                      <View style={styles.codeHeaderRow}>
                        <Text style={styles.couponCode}>{coupon.code}</Text>
                        {coupon.badge ? (
                          <View style={styles.badgePill}>
                            <Text style={styles.badgeTxt}>{coupon.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.couponTitle} numberOfLines={2}>
                        {displayTitle}
                      </Text>
                      <Text style={styles.expiryTxt}>{expiryLabel}</Text>
                    </TouchableOpacity>

                    {/* Right Apply Button */}
                    <TouchableOpacity
                      onPress={() => handleApplyCoupon(coupon)}
                      disabled={!isEligible}
                      style={styles.cardActionArea}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.cardActionTxt,
                          !isEligible && styles.cardActionTxtDisabled,
                        ]}
                      >
                        {screenConfig.list_apply_label || 'APPLY'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Collapsible details for terms/conditions */}
                  {isExpanded ? (
                    <View style={styles.collapsibleArea}>
                      {coupon.description ? (
                        <Text style={styles.couponDesc}>{coupon.description}</Text>
                      ) : null}

                      <View style={styles.limitInfoRow}>
                        <Text style={styles.limitInfoTxt}>{buildGuidelineText(coupon)}</Text>
                      </View>

                      {!isEligible ? (
                        <View style={styles.warningContainer}>
                          <View style={styles.cardDivider} />
                          <View style={styles.warningRow}>
                            <Text style={styles.warningTxt}>
                              {formatOffersTemplate(
                                screenConfig.unlock_offer_template || 'Add ₹{amount} more to unlock this offer',
                                {
                                  amount: remainingAmount.toLocaleString('en-IN'),
                                },
                              )}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}

            {coupons.length === 0 ? (
              <View style={styles.emptyWrap}>
                <CheckoutPercentIcon size={28} color={COLORS.ink300} />
                <Text style={styles.emptyTxt}>{screenConfig.empty_message || 'No coupons available'}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryBtnText: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  applyInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    height: 48,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 10,
    marginBottom: 14,
  },
  inputIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    ...FONTS.muktaRegular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
    padding: 0,
  },
  applyBtn: {
    backgroundColor: COLORS.green700,
    width: 69,
    height: 36,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#8FBCA3',
  },
  applyBtnTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  centerLoading: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 14,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
  },
  leftColorPill: {
    width: 52,
    alignSelf: 'stretch',
    backgroundColor: '#FDEFD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponInfo: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 13,
    paddingRight: 6,
    paddingLeft: 14,
    justifyContent: 'center',
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponCode: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.ink900,
  },
  badgePill: {
    backgroundColor: '#E4F3EA',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 9,
    color: COLORS.green700,
  },
  couponTitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink700,
    lineHeight: 20,
    marginTop: 3,
  },
  expiryTxt: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
    marginTop: 3,
  },
  cardActionArea: {
    width: 55,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActionTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.green700,
  },
  cardActionTxtDisabled: {
    color: COLORS.ink300,
  },
  collapsibleArea: {
    backgroundColor: '#FAF9F6',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingVertical: 10,
  },
  couponDesc: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    color: COLORS.ink500,
    lineHeight: 17,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 4,
  },
  warningContainer: {
    gap: 4,
  },
  warningRow: {
    paddingHorizontal: 16,
  },
  warningTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.marigold700,
  },
  emptyWrap: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyTxt: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink500,
  },
  limitInfoRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  limitInfoTxt: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.ink500,
    lineHeight: 16,
  },
});
