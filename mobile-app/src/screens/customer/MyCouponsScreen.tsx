import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  CheckoutBackIcon,
  CheckoutPercentIcon,
} from '../../components/CheckoutFigmaIcons';
import {
  CouponItem,
  MyCouponsScreenConfig,
  buildMyCouponGuideline,
  fetchLiveCoupons,
  fetchMyCouponsScreenConfig,
  formatOffersTemplate,
} from '../../services/myCouponsApi';

const SCREEN_BG = '#FBFAF6';

export default function MyCouponsScreen({ navigation }: any) {
  const { token } = useAuth();
  const { setAppliedCoupon } = useCart();

  const [screenConfig, setScreenConfig] = useState<MyCouponsScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await fetchMyCouponsScreenConfig();
    setScreenConfig(config);
    setConfigLoading(false);
    return config;
  }, []);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    const list = await fetchLiveCoupons(token);
    setCoupons(list);
    setCouponsLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadConfig().then((config) => {
        if (config) loadCoupons();
      });
    }, [loadConfig, loadCoupons]),
  );

  const handleCopyCoupon = (coupon: CouponItem) => {
    if (!screenConfig) return;

    setAppliedCoupon(coupon);

    const message = formatOffersTemplate(screenConfig.copy_alert_message_template, {
      code: coupon.code,
    });

    Alert.alert(screenConfig.copy_alert_title, message, [
      {
        text: screenConfig.copy_alert_go_cart_label,
        onPress: () => navigation.navigate('Cart'),
      },
      { text: screenConfig.copy_alert_ok_label },
    ]);
  };

  const toggleExpand = (id: string) => {
    setExpandedCouponId(expandedCouponId === id ? null : id);
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centeredState}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadConfig()} activeOpacity={0.85}>
            <ActivityIndicator color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <CheckoutPercentIcon size={18} />
          </View>
          <View style={styles.bannerTextBlock}>
            <Text style={styles.bannerTitle}>{screenConfig.banner_title}</Text>
            <Text style={styles.bannerSubtitle}>{screenConfig.banner_subtitle}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{screenConfig.section_label}</Text>

        {couponsLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.green700} />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {coupons.map((coupon) => {
              const isExpanded = expandedCouponId === coupon.id;
              const expiryLabel = formatOffersTemplate(screenConfig.expires_template, {
                date: coupon.expires_at,
              });

              return (
                <View key={coupon.id} style={styles.couponCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.percentCircle}>
                      <CheckoutPercentIcon size={16} />
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
                      <Text style={styles.couponTitle}>{coupon.title}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleCopyCoupon(coupon)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardActionTxt}>{screenConfig.list_copy_label}</Text>
                    </TouchableOpacity>
                  </View>

                  {coupon.description ? (
                    <Text style={styles.couponDesc}>{coupon.description}</Text>
                  ) : null}

                  <View style={styles.expiryRow}>
                    <View style={styles.cardDivider} />
                    <Text style={styles.expiryTxt}>{expiryLabel}</Text>
                  </View>

                  {isExpanded ? (
                    <View style={styles.guidelineRow}>
                      <Text style={styles.guidelineTxt}>
                        {buildMyCouponGuideline(screenConfig, coupon)}
                      </Text>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green100,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextBlock: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.green700,
  },
  bannerSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink700,
    lineHeight: 16,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percentCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponInfo: {
    flex: 1,
    gap: 2,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponCode: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.ink900,
    lineHeight: 20,
  },
  badgePill: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTxt: {
    ...FONTS.muktaBold,
    fontSize: 9,
    color: COLORS.green700,
  },
  couponTitle: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
  },
  cardActionBtn: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cardActionTxt: {
    ...FONTS.balooBold,
    fontSize: 12,
    color: COLORS.green700,
  },
  couponDesc: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink700,
    lineHeight: 18,
    paddingLeft: 48,
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    marginVertical: 4,
  },
  expiryRow: {
    gap: 6,
  },
  expiryTxt: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.ink300,
    paddingLeft: 48,
  },
  guidelineRow: {
    paddingLeft: 48,
    paddingTop: 4,
  },
  guidelineTxt: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.ink500,
    lineHeight: 16,
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
});
