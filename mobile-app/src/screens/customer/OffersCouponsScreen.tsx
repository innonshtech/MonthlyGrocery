import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../../config/api';
import { COLORS, RADIUS } from '../../constants/theme';

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_order_amount: number;
  max_discount: number;
  expires_at: string;
  badge?: string;
  description?: string;
}

export default function OffersCouponsScreen({ navigation, route }: any) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const cartAmount = route.params?.cartAmount || 0;

  useEffect(() => {
    const fetchLiveCoupons = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/coupons`);
        const data = await res.json();
        if (res.ok && data.success && data.coupons) {
          setCoupons(data.coupons);
        }
      } catch (err) {
        console.error('Coupons fetch notice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveCoupons();
  }, []);

  const handleApplyCoupon = (coupon: CouponItem) => {
    if (cartAmount > 0 && cartAmount < coupon.min_order_amount) {
      Alert.alert(
        'Minimum Order Not Met',
        `Add ₹${coupon.min_order_amount - cartAmount} more to your basket to apply code ${coupon.code}.`
      );
      return;
    }

    setCopiedCode(coupon.code);

    if (route.params?.onSelectCoupon) {
      route.params.onSelectCoupon(coupon);
      navigation.goBack();
    } else {
      Alert.alert(
        'Coupon Copied!',
        `Code "${coupon.code}" copied to clipboard! It will be auto-applied when your cart reaches ₹${coupon.min_order_amount}.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My coupons</Text>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Coupon Cards */}
          {coupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            const isEligible = cartAmount === 0 || cartAmount >= coupon.min_order_amount;

            return (
              <View key={coupon.code} style={styles.couponCard}>
                {/* Left Orange Percentage Box */}
                <View style={styles.percentBox}>
                  <Text style={styles.percentText}>%</Text>
                </View>

                {/* Middle Details */}
                <View style={styles.couponInfo}>
                  <View style={styles.codeRow}>
                    <Text style={styles.couponCodeText}>{coupon.code}</Text>
                    {coupon.badge && (
                      <View style={styles.badgePill}>
                        <Text style={styles.badgeText}>{coupon.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.couponTitleText}>{coupon.title}</Text>
                  <Text style={styles.couponExpiryText}>Expires {coupon.expires_at}</Text>
                </View>

                {/* Right Action Button */}
                <TouchableOpacity
                  style={[styles.copyBtn, !isEligible && styles.copyBtnDisabled]}
                  onPress={() => handleApplyCoupon(coupon)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyBtnText}>
                    {isCopied ? 'APPLIED' : route.params?.onSelectCoupon ? 'APPLY' : 'COPY'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Bottom Helper Note */}
          <Text style={styles.footerNoteText}>
            Coupons apply automatically on checkout based on eligibility.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginLeft: 8,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  percentBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.xs,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.marigold500,
  },
  couponInfo: {
    flex: 1,
    paddingRight: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  couponCodeText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: COLORS.ink900,
    letterSpacing: 0.5,
  },
  badgePill: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.green700,
  },
  couponTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink700,
    lineHeight: 16,
    marginBottom: 3,
  },
  couponExpiryText: {
    fontSize: 11,
    color: COLORS.ink500,
  },
  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green50,
  },
  copyBtnDisabled: {
    opacity: 0.5,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green700,
    letterSpacing: 0.5,
  },
  footerNoteText: {
    fontSize: 12,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
