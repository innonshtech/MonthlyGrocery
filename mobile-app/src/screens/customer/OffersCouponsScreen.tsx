import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
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
  const [screenConfig, setScreenConfig] = useState<OffersCouponsScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [applyingManual, setApplyingManual] = useState(false);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);

  const { token } = useAuth();
  const { setAppliedCoupon } = useCart();
  const cartAmount = route.params?.currentTotal || route.params?.cartAmount || 0;

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const result = await fetchOffersCouponsScreenConfigWithStatus();
    setScreenConfig(result.config);
    setConfigError(result.error);
    setConfigLoading(false);
    return result;
  }, []);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    const list = await fetchLiveCoupons(token);
    setCoupons(list);
    setCouponsLoading(false);
  }, [token]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!configError && screenConfig) {
      loadCoupons();
    }
  }, [configError, screenConfig, loadCoupons]);

  const applyCouponAndReturn = (coupon: CouponItem & { discount_amount?: number }) => {
    if (route.params?.onSelectCoupon) {
      route.params.onSelectCoupon(coupon);
      navigation.goBack();
      return;
    }

    setAppliedCoupon(coupon);

    if (route.params?.fromCheckout) {
      navigation.navigate({
        name: 'Checkout',
        params: { appliedCoupon: coupon },
        merge: true,
      });
      return;
    }

    navigation.goBack();
  };

  const handleApplyCoupon = (coupon: CouponItem) => {
    if (!screenConfig) return;

    if (cartAmount > 0 && cartAmount < coupon.min_order_amount) {
      Alert.alert(
        screenConfig.min_order_alert_title,
        formatOffersTemplate(screenConfig.min_order_alert_template, {
          amount: (coupon.min_order_amount - cartAmount).toLocaleString('en-IN'),
          code: coupon.code,
        }),
      );
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
      Alert.alert(
        screenConfig.invalid_coupon_alert_title,
        result.error || screenConfig.apply_failed_fallback,
      );
    }
    setApplyingManual(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedCouponId(expandedCouponId === id ? null : id);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.applyInputBar}>
          <View style={styles.inputIcon}>
            <CheckoutPercentIcon size={15} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={screenConfig.manual_code_placeholder}
            placeholderTextColor={COLORS.ink300}
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.applyBtn, !manualCode.trim() && styles.applyBtnDisabled]}
            onPress={handleApplyManualCode}
            disabled={applyingManual || !manualCode.trim()}
            activeOpacity={0.85}
          >
            {applyingManual ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyBtnTxt}>{screenConfig.manual_apply_label}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{screenConfig.available_section_label}</Text>

        {couponsLoading ? (
          <View style={styles.centerLoading}>
            <AppLoader message="Loading coupons..." />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {coupons.map((coupon) => {
              const isEligible = cartAmount === 0 || cartAmount >= coupon.min_order_amount;
              const remainingAmount = coupon.min_order_amount - cartAmount;
              const isExpanded = expandedCouponId === coupon.id;
              const expiryLabel = formatOffersTemplate(screenConfig.expires_template, {
                date: coupon.expires_at,
              });

              return (
                <View key={coupon.id} style={styles.couponCard}>
                  <View style={styles.cardMainRow}>
                    <View style={styles.leftColorPill}>
                      <CheckoutPercentIcon size={15} />
                    </View>

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
                        {coupon.title}
                      </Text>
                      <Text style={styles.expiryTxt}>{expiryLabel}</Text>
                    </TouchableOpacity>

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
                        {screenConfig.list_apply_label}
                      </Text>
                    </TouchableOpacity>
                  </View>

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
                              {formatOffersTemplate(screenConfig.unlock_offer_template, {
                                amount: remainingAmount.toLocaleString('en-IN'),
                              })}
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
                <CheckoutPercentIcon size={28} />
                <Text style={styles.emptyTxt}>{screenConfig.empty_message}</Text>
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
    gap: 10,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  applyInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    height: 48,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 10,
    marginBottom: 20,
  },
  inputIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    ...FONTS.muktaBold,
    fontSize: 14,
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
    opacity: 0.45,
  },
  applyBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.4,
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
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 84,
  },
  leftColorPill: {
    width: 52,
    height: 84,
    backgroundColor: '#FDEFD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponInfo: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 13,
    paddingRight: 10,
    paddingLeft: 14,
    gap: 3,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponCode: {
    ...FONTS.balooBold,
    fontSize: 13,
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
    fontSize: 8.5,
    color: COLORS.green700,
  },
  couponTitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink700,
    lineHeight: 20,
  },
  expiryTxt: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    color: COLORS.ink500,
  },
  cardActionArea: {
    width: 55,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActionTxt: {
    ...FONTS.balooBold,
    fontSize: 13,
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
