import React, { useState, useEffect } from 'react';
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
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';

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

export default function MyCouponsScreen({ navigation }: any) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchLiveCoupons();
  }, []);

  const handleCopyCoupon = (code: string) => {
    Alert.alert(
      'Coupon Copied!',
      `Promo code "${code}" is ready. You can paste it during checkout.`,
      [
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
        { text: 'OK' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="arrow-left" size={22} color={COLORS.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Offers & Coupons</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerEmoji}>🎉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Monthly Savings Club</Text>
            <Text style={styles.bannerSubtitle}>Use these coupons at checkout to unlock guaranteed monthly discounts on pantry staples.</Text>
          </View>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>AVAILABLE OFFERS</Text>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.green700} />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {coupons.map((coupon) => (
              <View key={coupon.id} style={styles.couponCard}>
                <View style={styles.cardTopRow}>
                  {/* Circle icon */}
                  <View style={styles.percentCircle}>
                    <AppIcon name="percent" size={16} color={COLORS.green700} />
                  </View>

                  {/* Info */}
                  <View style={styles.couponInfo}>
                    <View style={styles.codeHeaderRow}>
                      <Text style={styles.couponCode}>{coupon.code}</Text>
                      {coupon.badge && (
                        <View style={styles.badgePill}>
                          <Text style={styles.badgeTxt}>{coupon.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.couponTitle}>{coupon.title}</Text>
                  </View>

                  {/* Copy action button */}
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleCopyCoupon(coupon.code)}
                  >
                    <Text style={styles.cardActionTxt}>COPY</Text>
                  </TouchableOpacity>
                </View>

                {/* Description */}
                {coupon.description ? (
                  <Text style={styles.couponDesc}>{coupon.description}</Text>
                ) : null}

                <View style={styles.expiryRow}>
                  <View style={styles.cardDivider} />
                  <Text style={styles.expiryTxt}>Expires on {coupon.expires_at}</Text>
                </View>
              </View>
            ))}

            {coupons.length === 0 && (
              <View style={styles.emptyWrap}>
                <AppIcon name="tag" size={40} color={COLORS.ink300} />
                <Text style={styles.emptyTxt}>No offers available right now.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    backgroundColor: '#FBFAF6',
    gap: 10,
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

  // Scroll content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Banner card
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4F3EA',
    borderWidth: 1.5,
    borderColor: COLORS.green100,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  bannerEmoji: {
    fontSize: 28,
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

  // Section Label
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Loading wrapper
  centerLoading: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Coupons cards list
  listContainer: {
    gap: 14,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#E4F3EA',
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
    backgroundColor: '#E4F3EA',
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
    backgroundColor: '#E4F3EA',
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

  // Expiry
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

  // Empty view
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
