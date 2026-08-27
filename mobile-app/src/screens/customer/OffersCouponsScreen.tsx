import React, { useState, useEffect } from 'react';
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
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

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
  target_audience?: 'all' | 'new' | 'loyal';
  usage_limit_per_user?: number;
}

export default function OffersCouponsScreen({ navigation, route }: any) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [applyingManual, setApplyingManual] = useState(false);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);

  const { token } = useAuth();
  const cartAmount = route.params?.currentTotal || route.params?.cartAmount || 0;

  useEffect(() => {
    const fetchLiveCoupons = async () => {
      setLoading(true);
      try {
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}/coupons`, { headers });
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

    if (route.params?.onSelectCoupon) {
      route.params.onSelectCoupon(coupon);
      navigation.goBack();
    } else {
      Alert.alert(
        'Coupon Applied!',
        `Code "${coupon.code}" will be applied at checkout!`
      );
    }
  };

  const handleApplyManualCode = async () => {
    if (!manualCode.trim()) return;
    setApplyingManual(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/coupons/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: manualCode.trim(), cart_amount: cartAmount })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (route.params?.onSelectCoupon) {
          route.params.onSelectCoupon(data.coupon);
          navigation.goBack();
        } else {
          Alert.alert('Coupon Applied', `Code "${data.coupon.code}" applied successfully!`);
        }
      } else {
        Alert.alert('Invalid Coupon', data.error || 'Failed to apply coupon.');
      }
    } catch {
      Alert.alert('Error', 'Connection error while applying coupon.');
    } finally {
      setApplyingManual(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCouponId(expandedCouponId === id ? null : id);
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
        <Text style={styles.headerTitle}>Offers & coupons</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Manual Apply Coupon Bar */}
        <View style={styles.applyInputBar}>
          <View style={styles.inputIcon}>
            <AppIcon name="percent" size={15} color={COLORS.ink500} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter coupon code"
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
          >
            {applyingManual ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyBtnTxt}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionLabel}>AVAILABLE FOR YOU</Text>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.green700} />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {coupons.map((coupon) => {
              const isEligible = cartAmount === 0 || cartAmount >= coupon.min_order_amount;
              const remainingAmount = coupon.min_order_amount - cartAmount;
              const isExpanded = expandedCouponId === coupon.id;

              return (
                <View key={coupon.id} style={styles.couponCard}>
                  {/* Stable Main Row View (replaces outer touchable to fix layout width/events) */}
                  <View style={styles.cardMainRow}>
                    {/* Left Column (Figma width: 52px) */}
                    <View style={styles.leftColorPill}>
                      <AppIcon name="percent" size={15} color="#C77E12" />
                    </View>

                    {/* Middle Column: Clickable Details to toggle accordion (Figma width: 243px) */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleExpand(coupon.id)}
                      style={styles.couponInfo}
                    >
                      <View style={styles.codeHeaderRow}>
                        <Text style={styles.couponCode}>{coupon.code}</Text>
                        {coupon.badge && (
                          <View style={styles.badgePill}>
                            <Text style={styles.badgeTxt}>{coupon.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.couponTitle} numberOfLines={2}>
                        {coupon.title}
                      </Text>
                      <Text style={styles.expiryTxt}>Expires on {coupon.expires_at}</Text>
                    </TouchableOpacity>

                    {/* Right Column: Centered text-only APPLY button (Figma width: 55px) */}
                    <TouchableOpacity
                      onPress={() => handleApplyCoupon(coupon)}
                      disabled={!isEligible}
                      style={styles.cardActionArea}
                    >
                      <Text
                        style={[
                          styles.cardActionTxt,
                          !isEligible && styles.cardActionTxtDisabled,
                        ]}
                      >
                        APPLY
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Collapsible Area */}
                  {isExpanded && (
                    <View style={styles.collapsibleArea}>
                      {coupon.description ? (
                        <Text style={styles.couponDesc}>{coupon.description}</Text>
                      ) : null}

                      {/* Dynamic Guidelines / Limits Banner */}
                      <View style={styles.limitInfoRow}>
                        <AppIcon name="help" size={11} color={COLORS.ink500} />
                        <Text style={styles.limitInfoTxt}>
                          {coupon.target_audience === 'new' ? 'Welcome Offer: Valid on first order only. ' :
                           coupon.target_audience === 'loyal' ? 'Loyalty Offer: Valid for returning customers. ' : 'Valid for all customers. '}
                          {coupon.usage_limit_per_user ? `Limit: Max ${coupon.usage_limit_per_user} uses per account.` : ''}
                        </Text>
                      </View>

                      {!isEligible && (
                        <View style={styles.warningContainer}>
                          <View style={styles.cardDivider} />
                          <View style={styles.warningRow}>
                            <AppIcon name="help" size={12} color={COLORS.marigold700} />
                            <Text style={styles.warningTxt}>
                              Add items worth ₹{remainingAmount} more to unlock this offer
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

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
    paddingBottom: 12,
    borderBottomWidth: 1.5,
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
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Apply Coupon Bar
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
    marginRight: 2,
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
    backgroundColor: '#1E7A46',
    width: 69,
    height: 36,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 1,
  },
  applyBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Section Label
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 14,
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
    overflow: 'hidden',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 84,
  },

  // Left Column (Figma width: 52px)
  leftColorPill: {
    width: 52,
    height: 84,
    backgroundColor: '#FDEFD3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Middle Column (Figma width: 243px equivalent, using flex: 1 for fluid stretching between fixed boundaries)
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

  // Right Column (Figma width: 55px)
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

  // Collapsible content
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

  // Expiry / Warning details
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 4,
  },
  warningContainer: {
    gap: 4,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  warningTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.marigold700,
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
  limitInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  limitInfoTxt: {
    ...FONTS.muktaMedium,
    fontSize: 11,
    color: COLORS.ink500,
  },
});
