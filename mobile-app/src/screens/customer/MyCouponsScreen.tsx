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
import { SvgXml } from 'react-native-svg';
import AppLoader from '../../components/AppLoader';
import { FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { CheckoutBackIcon } from '../../components/CheckoutFigmaIcons';
import {
  CouponItem,
  MyCouponsScreenConfig,
  fetchLiveCoupons,
  fetchMyCouponsScreenConfig,
  formatOffersTemplate,
} from '../../services/myCouponsApi';

const SCREEN_BG = '#F8FAF8';

const COUPON_PERCENT_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="5" x2="5" y2="19" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="2.5" stroke="#D97706" stroke-width="2"/><circle cx="17" cy="17" r="2.5" stroke="#D97706" stroke-width="2"/></svg>`;

const INFO_ICON_XML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5" stroke="#94A3B8" stroke-width="1.8"/><circle cx="12" cy="7.5" r="0.75" fill="#94A3B8"/><line x1="12" y1="11" x2="12" y2="16.5" stroke="#94A3B8" stroke-width="1.8" stroke-linecap="round"/></svg>`;

export default function MyCouponsScreen({ navigation }: any) {
  const { token } = useAuth();
  const { setAppliedCoupon } = useCart();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<MyCouponsScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      loadConfig();
      loadCoupons();
    }, [loadConfig, loadCoupons]),
  );

  const handleCopyCoupon = (coupon: CouponItem) => {
    if (!screenConfig) return;

    setAppliedCoupon(coupon);

    const message = formatOffersTemplate(screenConfig.copy_alert_message_template, {
      code: coupon.code,
    });

    showToast({
      type: 'success',
      title: screenConfig.copy_alert_title || 'Coupon Applied',
      message: message,
      actionLabel: screenConfig.copy_alert_go_cart_label || 'Go to Cart',
      onAction: () => navigation.navigate('Cart'),
    });
  };

  if (configLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centeredState}>
          <AppLoader message="Loading coupons..." />
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

  const availableHeader = `AVAILABLE · ${coupons.length}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CheckoutBackIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title || 'My coupons'}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{availableHeader}</Text>

        {couponsLoading ? (
          <View style={styles.centerLoading}>
            <AppLoader message="Loading coupons..." />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {coupons.map((coupon) => {
              const expiryLabel = formatOffersTemplate(screenConfig.expires_template, {
                date: coupon.expires_at,
              });

              return (
                <View key={coupon.id} style={styles.couponCard}>
                  <View style={styles.stubContainer}>
                    <SvgXml xml={COUPON_PERCENT_XML} width={22} height={22} />
                  </View>

                  <View style={styles.couponContent}>
                    <Text style={styles.couponCode}>{coupon.code}</Text>
                    <Text style={styles.couponTitle} numberOfLines={2}>
                      {coupon.title}
                    </Text>
                    <Text style={styles.expiryTxt}>{expiryLabel}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => handleCopyCoupon(coupon)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyBtnTxt}>
                      {screenConfig.list_copy_label || 'COPY'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {coupons.length === 0 ? (
              <View style={styles.emptyWrap}>
                <SvgXml xml={COUPON_PERCENT_XML} width={28} height={28} />
                <Text style={styles.emptyTxt}>{screenConfig.empty_message}</Text>
              </View>
            ) : (
              <View style={styles.footerNoteRow}>
                <SvgXml xml={INFO_ICON_XML} width={14} height={14} />
                <Text style={styles.footerNoteText}>
                  Coupons apply automatically at checkout when eligible.
                </Text>
              </View>
            )}
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
    backgroundColor: '#1E7A46',
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
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 20,
    lineHeight: 26,
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  centerLoading: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 12,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stubContainer: {
    width: 68,
    alignSelf: 'stretch',
    backgroundColor: '#FDEFD8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponContent: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 14,
  },
  couponCode: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 18,
    color: '#111827',
  },
  couponTitle: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    marginTop: 3,
  },
  expiryTxt: {
    ...FONTS.muktaRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    marginTop: 3,
  },
  copyBtn: {
    paddingRight: 18,
    paddingLeft: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#1E7A46',
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  footerNoteText: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#64748B',
    flex: 1,
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
    color: '#64748B',
  },
});
