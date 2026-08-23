import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart, CartItem } from '../../context/CartContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';
import AuthGateModal, { AuthGateType } from '../../components/AuthGateModal';

export default function CartScreen({ route, navigation }: any) {
  const { token } = useAuth();
  const { items, minOrderLimit = 2000, updateQuantity, addToCart } = useCart();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(route?.params?.appliedCoupon || null);
  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [authGateType, setAuthGateType] = useState<AuthGateType>('checkout');

  const minLimit = minOrderLimit || 2000;

  // Real Dynamic Calculations
  const itemTotalMrp = items.reduce((sum, item) => {
    const mrp = parseFloat(item.product.mrp as any) || Math.round(Number(item.product.price) * 1.22);
    return sum + mrp * item.quantity;
  }, 0);

  const itemTotalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.product.price as any) || 0;
    return sum + price * item.quantity;
  }, 0);

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscount = Math.min(
        Math.round((itemTotalPrice * appliedCoupon.value) / 100),
        appliedCoupon.max_discount || 200
      );
    } else {
      couponDiscount = appliedCoupon.value || 50;
    }
  }

  const rawSavings = itemTotalMrp - itemTotalPrice;
  const totalSavings = rawSavings + couponDiscount;
  const toPay = Math.max(0, itemTotalPrice - couponDiscount);
  const isBelowMin = toPay < minLimit;
  const amountNeeded = minLimit - toPay;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (isBelowMin) {
      Alert.alert(
        'Minimum order value',
        `Please add ₹${amountNeeded} more to reach the ₹${minLimit} minimum order value.`
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

  const handleSaveAsBasket = () => {
    if (!token) {
      setAuthGateType('save_basket');
      setAuthGateVisible(true);
      return;
    }

    navigation.navigate('SavedBaskets');
  };

  // =========================================================================
  // 1. C2 SUB-STATE: CART EMPTY
  // =========================================================================
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topHeader}>
          <Text style={styles.topTitle}>Your cart</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <AppIcon name="cart" size={48} color={COLORS.green700} />
          </View>

          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items to build this month's grocery — or bring back your last basket in one tap.
          </Text>

          <TouchableOpacity
            style={styles.startShoppingBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.startShoppingBtnText}>Start shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reorderLink}
            onPress={() => navigation.navigate('CopyLastMonth')}
            activeOpacity={0.7}
          >
            <Text style={styles.reorderLinkText}>↻ Reorder last basket</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>
          Your cart <Text style={styles.itemCountHeader}>({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           2. NOTICES: SAVINGS ALERT OR BELOW MINIMUM ALERT (C2)
           ========================================================================= */}
        {isBelowMin ? (
          <View style={styles.belowMinNotice}>
            <Text style={styles.belowMinIcon}>⚠️</Text>
            <Text style={styles.belowMinText}>
              Add ₹{amountNeeded} more to reach the ₹{minLimit} minimum
            </Text>
          </View>
        ) : (
          <View style={styles.savingsNotice}>
            <Text style={styles.savingsNoticeIcon}>🎉</Text>
            <Text style={styles.savingsNoticeText}>
              You're saving ₹{totalSavings} on this order
            </Text>
          </View>
        )}

        {/* =========================================================================
           3. BASKET ITEMS LIST WITH STEPPERS (C2)
           ========================================================================= */}
        <View style={styles.itemsListContainer}>
          {items.map((cartItem) => {
            const itemPrice = parseFloat(cartItem.product.price as any) || 0;
            const itemMrp = parseFloat(cartItem.product.mrp as any) || Math.round(itemPrice * 1.22);
            const lineTotal = itemPrice * cartItem.quantity;
            const lineMrp = itemMrp * cartItem.quantity;

            return (
              <View key={cartItem.product.id} style={styles.itemRow}>
                {/* Thumb */}
                <View style={styles.itemThumb}>
                  {cartItem.product.image_url ? (
                    <Image source={{ uri: cartItem.product.image_url }} style={styles.thumbImg} resizeMode="contain" />
                  ) : (
                    <AppIcon name="shopping-bag" size={24} color={COLORS.green700} />
                  )}
                </View>

                {/* Details */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {cartItem.product.name}
                  </Text>
                  <Text style={styles.itemUnit}>
                    {cartItem.product.unit || '1 unit'}
                  </Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceText}>₹{lineTotal}</Text>
                    <Text style={styles.itemMrpText}>₹{lineMrp}</Text>
                  </View>
                </View>

                {/* Stepper (− count +) */}
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateQuantity(cartItem.product.id, cartItem.quantity - 1)}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepCountText}>{cartItem.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => addToCart(cartItem.product)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* =========================================================================
           4. SMART ACTIONS (Save Basket & Apply Coupon)
           ========================================================================= */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleSaveAsBasket}
          activeOpacity={0.8}
        >
          <View style={styles.actionLeft}>
            <Text style={styles.actionIcon}>🔖</Text>
            <Text style={styles.actionTitle}>Save this cart as a basket</Text>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('OffersCoupons', { currentTotal: itemTotalPrice })}
          activeOpacity={0.8}
        >
          <View style={styles.actionLeft}>
            <Text style={styles.actionIcon}>🏷️</Text>
            <Text style={styles.actionTitle}>
              {appliedCoupon ? `Coupon: ${appliedCoupon.code} applied (₹${couponDiscount} saved)` : 'Apply coupon'}
            </Text>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        {/* =========================================================================
           5. BILL DETAILS SUMMARY (C2)
           ========================================================================= */}
        <View style={styles.billSection}>
          <Text style={styles.billTitle}>Bill details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total (MRP)</Text>
            <Text style={styles.billVal}>₹{itemTotalMrp}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: COLORS.green700 }]}>Savings</Text>
            <Text style={[styles.billVal, { color: COLORS.green700 }]}>− ₹{totalSavings}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={[styles.billVal, { color: COLORS.green700, fontWeight: '700' }]}>FREE</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>To pay</Text>
            <Text style={styles.billTotalVal}>₹{toPay}</Text>
          </View>
        </View>
      </ScrollView>

      {/* =========================================================================
         6. STICKY BOTTOM CHECKOUT BUTTON (C2 Active vs Below-Min Gate)
         ========================================================================= */}
      <View style={styles.checkoutBar}>
        {isBelowMin ? (
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={handleCheckout}
            activeOpacity={0.9}
          >
            <Text style={styles.gateBtnText}>Add ₹{amountNeeded} to checkout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Proceed to checkout ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Auth Gate Modal Sheet (Flow 8) */}
      <AuthGateModal
        visible={authGateVisible}
        type={authGateType}
        onClose={() => setAuthGateVisible(false)}
        onContinue={() => {
          setAuthGateVisible(false);
          navigation.navigate('Login', { redirect: authGateType === 'checkout' ? 'Checkout' : 'SavedBaskets' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  topTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  itemCountHeader: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink500,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.green50,
    borderWidth: 1.5,
    borderColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 28,
  },
  startShoppingBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  startShoppingBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reorderLink: {
    paddingVertical: 8,
  },
  reorderLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green700,
  },
  /* Notices */
  savingsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50, // #F2F9F5
    borderWidth: 1,
    borderColor: COLORS.green100, // #E4F3EA
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  savingsNoticeIcon: {
    fontSize: 16,
  },
  savingsNoticeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  belowMinNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Warm Amber
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  belowMinIcon: {
    fontSize: 16,
  },
  belowMinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  /* Items List */
  itemsListContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbImg: {
    width: 38,
    height: 38,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 11.5,
    color: COLORS.ink500,
    marginBottom: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  itemMrpText: {
    fontSize: 11,
    color: COLORS.ink300,
    textDecorationLine: 'line-through',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green700,
    borderRadius: RADIUS.sm,
    height: 30,
    paddingHorizontal: 4,
  },
  stepBtn: {
    width: 22,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepCountText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  /* Action Cards */
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  actionChevron: {
    fontSize: 18,
    color: COLORS.ink300,
    fontWeight: 'bold',
  },
  /* Bill Summary */
  billSection: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.ink500,
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink900,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 10,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  billTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  /* Bottom Checkout Bar */
  checkoutBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  checkoutBtn: {
    backgroundColor: COLORS.green700, // #1E7A46
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  gateBtn: {
    backgroundColor: COLORS.muted, // #F4F3EE
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateBtnText: {
    color: COLORS.ink500, // #6B7772
    fontSize: 14,
    fontWeight: '700',
  },
});
