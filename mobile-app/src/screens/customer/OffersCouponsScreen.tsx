import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

interface CouponItem {
  id: string;
  code: string;
  discount_type: 'flat' | 'percentage';
  value: number;
  min_order: number;
  max_discount?: number;
  description: string;
}

const DEFAULT_COUPONS: CouponItem[] = [
  {
    id: 'c-1',
    code: 'MONTHLY100',
    discount_type: 'flat',
    value: 100,
    min_order: 2000,
    description: '₹100 off on orders above ₹2,000\nValid once per calendar month',
  },
  {
    id: 'c-2',
    code: 'FIRSTSAVE',
    discount_type: 'percentage',
    value: 15,
    min_order: 1500,
    max_discount: 200,
    description: '15% off up to ₹200 on your first order\nNew users only · min ₹1,500',
  },
  {
    id: 'c-3',
    code: 'BASKET50',
    discount_type: 'flat',
    value: 50,
    min_order: 1000,
    description: '₹50 off your monthly basket\nApplied to this order',
  },
];

export default function OffersCouponsScreen({ route, navigation }: any) {
  const { currentTotal = 2500 } = route.params || {};
  const [couponCode, setCouponCode] = useState('');
  const [coupons, setCoupons] = useState<CouponItem[]>(DEFAULT_COUPONS);
  const [appliedCode, setAppliedCode] = useState<string>('BASKET50');

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/coupons/all`);
        const data = await res.json();
        if (res.ok && data.success && data.coupons && data.coupons.length > 0) {
          setCoupons(data.coupons);
        }
      } catch (err) {
        setCoupons(DEFAULT_COUPONS);
      }
    };
    fetchCoupons();
  }, []);

  const handleApplyCoupon = (coupon: CouponItem) => {
    if (currentTotal < coupon.min_order) {
      Alert.alert(
        'Minimum order not met',
        `This coupon requires a minimum order of ₹${coupon.min_order}. Current total: ₹${currentTotal}`
      );
      return;
    }

    setAppliedCode(coupon.code);
    Alert.alert('Coupon Applied', `Code "${coupon.code}" has been applied to your cart!`, [
      {
        text: 'View Cart',
        onPress: () => navigation.navigate('Cart', { appliedCoupon: coupon })
      }
    ]);
  };

  const handleManualApply = () => {
    if (!couponCode.trim()) return;
    const match = coupons.find(
      (c) => c.code.toLowerCase() === couponCode.trim().toLowerCase()
    );

    if (match) {
      handleApplyCoupon(match);
    } else {
      Alert.alert('Invalid Code', `Coupon code "${couponCode}" is not valid or expired.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP HEADER ROW (C3)
         ========================================================================= */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & coupons</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* =========================================================================
           2. ENTER COUPON INPUT CARD (C3)
           ========================================================================= */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.couponInput}
            placeholder="Enter coupon code"
            placeholderTextColor={COLORS.ink300}
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              styles.applyInputBtn,
              couponCode.trim().length > 0 ? styles.applyInputBtnActive : null
            ]}
            onPress={handleManualApply}
            disabled={!couponCode.trim()}
          >
            <Text style={styles.applyInputBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* =========================================================================
           3. AVAILABLE COUPONS LIST (C3)
           ========================================================================= */}
        <Text style={styles.sectionHeading}>AVAILABLE COUPONS</Text>

        <FlatList
          data={coupons}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.couponsList}
          renderItem={({ item }) => {
            const isApplied = appliedCode.toUpperCase() === item.code.toUpperCase();

            return (
              <View style={styles.couponCard}>
                {/* Left % Badge */}
                <View style={styles.percentBadge}>
                  <Text style={styles.percentSymbol}>%</Text>
                </View>

                {/* Info */}
                <View style={styles.couponInfo}>
                  <Text style={styles.couponCodeText}>{item.code}</Text>
                  <Text style={styles.couponDescText}>{item.description}</Text>
                </View>

                {/* Action Button */}
                {isApplied ? (
                  <View style={styles.appliedPill}>
                    <Text style={styles.appliedPillText}>✓ APPLIED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => handleApplyCoupon(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyBtnText}>APPLY</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            <Text style={styles.footnoteText}>
              Only one coupon can be applied per order. Savings show in your bill at checkout.
            </Text>
          }
        />
      </View>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md, // 12px
    height: 50,
    paddingLeft: 16,
    paddingRight: 6,
    marginBottom: 24,
  },
  couponInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink900,
    padding: 0,
  },
  applyInputBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    opacity: 0.6,
  },
  applyInputBtnActive: {
    opacity: 1,
  },
  applyInputBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  couponsList: {
    paddingBottom: 28,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  percentBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.marigold100, // #FDEFD3
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  percentSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.marigold700, // #8A5200
  },
  couponInfo: {
    flex: 1,
    paddingRight: 8,
  },
  couponCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  couponDescText: {
    fontSize: 11.5,
    color: COLORS.ink500,
    lineHeight: 16,
  },
  applyBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  applyBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.green700,
  },
  appliedPill: {
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green500,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  appliedPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.green700,
  },
  separator: {
    height: 12,
  },
  footnoteText: {
    fontSize: 11.5,
    color: COLORS.ink500,
    marginTop: 18,
    lineHeight: 16,
    textAlign: 'center',
  },
});
