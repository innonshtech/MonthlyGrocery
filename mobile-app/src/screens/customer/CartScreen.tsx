import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import AuthGateModal, { AuthGateType } from '../../components/AuthGateModal';

// ─── Category pastel colour for product image tile bg ────────────────────────
const PRODUCT_BG_COLORS = [
  '#FFF3D6', '#E4F3EA', '#F6E9E1', '#FDE7E7',
  '#EDE9FB', '#FBEEDD', '#EAF6D6', '#E1F0FB',
  '#FDEFD3', '#FDE4E7',
];
function getProductBg(index: number): string {
  return PRODUCT_BG_COLORS[index % PRODUCT_BG_COLORS.length];
}

// ─── Inline Stepper (Figma: green pill, 30×32 buttons) ───────────────────────
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CartScreen({ route, navigation }: any) {
  const { token } = useAuth();
  const { items, minOrderLimit = 2000, updateQuantity, addToCart } = useCart();
  const [appliedCoupon, setAppliedCoupon] = useState<any>(
    route?.params?.appliedCoupon || null
  );
  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [authGateType, setAuthGateType] = useState<AuthGateType>('checkout');

  const minLimit = minOrderLimit || 2000;

  // ── Calculations ────────────────────────────────────────────────────────────
  const itemTotalMrp = items.reduce((sum, item) => {
    const mrp =
      parseFloat(item.product.mrp as any) ||
      Math.round(Number(item.product.price) * 1.22);
    return sum + mrp * item.quantity;
  }, 0);

  const itemTotalPrice = items.reduce((sum, item) => {
    return sum + (parseFloat(item.product.price as any) || 0) * item.quantity;
  }, 0);

  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount =
      appliedCoupon.discount_type === 'percentage'
        ? Math.min(
            Math.round((itemTotalPrice * appliedCoupon.value) / 100),
            appliedCoupon.max_discount || 200
          )
        : appliedCoupon.value || 50;
  }

  const rawSavings = itemTotalMrp - itemTotalPrice;
  const totalSavings = rawSavings + couponDiscount;
  const toPay = Math.max(0, itemTotalPrice - couponDiscount);
  const isBelowMin = toPay < minLimit;
  const amountNeeded = minLimit - toPay;
  const totalItemCount = items.reduce((s, i) => s + i.quantity, 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
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

  const handleSaveBasket = () => {
    if (!token) {
      setAuthGateType('save_basket');
      setAuthGateVisible(true);
      return;
    }
    navigation.navigate('SavedBaskets');
  };

  // ── Empty State (C2 · Cart — Empty Slide #528:679) ──────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.topHeader}>
          <Text style={styles.topTitle}>Your cart</Text>
        </View>

        {/* Empty body */}
        <View style={styles.emptyWrap}>
          {/* Main Empty Circle with Floating Emojis */}
          <View style={styles.emptyIconContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="cart" size={48} color={COLORS.green700} />
            </View>
            
            {/* Top-Left Atta badge */}
            <View style={[styles.floatingBadge, styles.floatingBadgeTopLeft]}>
              <Image
                source={{ uri: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/aashirvaad_atta_10kg.png' }}
                style={styles.badgeImg}
                resizeMode="contain"
              />
            </View>

            {/* Bottom-Right Oil badge */}
            <View style={[styles.floatingBadge, styles.floatingBadgeBottomRight]}>
              <Image
                source={{ uri: 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/product-images/products/amul_pure_ghee_1l.png' }}
                style={styles.badgeImg}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Add your monthly essentials and they’ll show up here.
          </Text>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnTxt}>Start shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reorderLink}
            onPress={() => navigation.navigate('CopyLastMonth')}
            activeOpacity={0.7}
          >
            <View style={styles.reorderLinkInner}>
              <AppIcon name="trending-down" size={16} color={COLORS.green700} />
              <Text style={styles.reorderLinkTxt}>Reorder last month’s basket</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Filled Cart ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Your cart</Text>
        <Text style={styles.topCount}>
          {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Notice banner ──────────────────────────────────────────────── */}
        {isBelowMin ? (
          <View style={styles.belowMinBanner}>
            <View style={styles.belowMinHeaderRow}>
              <AppIcon name="help" size={18} color="#155A38" />
              <Text style={styles.belowMinTitle}>
                Add ₹{amountNeeded.toLocaleString('en-IN')} more to check out
              </Text>
            </View>
            
            {/* Horizontal progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.round((toPay / minLimit) * 100))}%` }]} />
            </View>

            <Text style={styles.belowMinFootnote}>
              You’re at ₹{toPay.toLocaleString('en-IN')} of the ₹{minLimit.toLocaleString('en-IN')} monthly minimum order
            </Text>
          </View>
        ) : (
          <View style={styles.savingsBanner}>
            <AppIcon name="tag" size={18} color="#8A5200" />
            <Text style={styles.savingsTxt}>
              You're saving ₹{totalSavings.toLocaleString('en-IN')} on this order 🎉
            </Text>
          </View>
        )}

        {/* ── 2. Cart items card ────────────────────────────────────────────── */}
        <View style={styles.itemsCard}>
          {items.map((cartItem, idx) => {
            const price = parseFloat(cartItem.product.price as any) || 0;
            const lineTotal = price * cartItem.quantity;

            return (
              <View
                key={cartItem.product.id}
                style={[
                  styles.itemRow,
                  idx < items.length - 1 && styles.itemRowBorder,
                ]}
              >
                {/* Product image tile */}
                <View style={[styles.imgTile, { backgroundColor: getProductBg(idx) }]}>
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

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {cartItem.product.name}
                  </Text>
                  {cartItem.product.unit ? (
                    <Text style={styles.itemUnit}>{cartItem.product.unit}</Text>
                  ) : null}
                  <Text style={styles.itemPrice}>
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Stepper */}
                <Stepper
                  quantity={cartItem.quantity}
                  onDecrement={() =>
                    updateQuantity(cartItem.product.id, cartItem.quantity - 1)
                  }
                  onIncrement={() => addToCart(cartItem.product)}
                />
              </View>
            );
          })}
        </View>

        {/* ── 3. Save cart as basket ────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.saveBasketRow}
          onPress={handleSaveBasket}
          activeOpacity={0.8}
        >
          <View style={styles.saveBasketIcon}>
            <AppIcon name="tag" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.saveBasketTxt}>Save this cart as a basket</Text>
          <AppIcon name="arrow-right" size={16} color={COLORS.green700} />
        </TouchableOpacity>

        {/* ── 4. Apply coupon ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.couponRow}
          onPress={() =>
            navigation.navigate('OffersCoupons', { currentTotal: itemTotalPrice })
          }
          activeOpacity={0.8}
        >
          <AppIcon name="tag" size={18} color={COLORS.green700} />
          <Text style={styles.couponTxt}>
            {appliedCoupon
              ? `${appliedCoupon.code} applied · ₹${couponDiscount} saved`
              : 'Apply coupon'}
          </Text>
          <AppIcon name="arrow-right" size={16} color={COLORS.ink300} />
        </TouchableOpacity>

        {/* ── 5. Bill details ───────────────────────────────────────────────── */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item total (MRP)</Text>
            <Text style={styles.billVal}>₹{itemTotalMrp.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Savings</Text>
            <Text style={[styles.billVal, { color: '#8A5200' }]}>
              − ₹{totalSavings.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery fee</Text>
            <Text style={[styles.billVal, { color: COLORS.green700 }]}>FREE</Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon discount</Text>
              <Text style={[styles.billVal, { color: '#8A5200' }]}>
                − ₹{couponDiscount}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>To pay</Text>
            <Text style={styles.billTotalVal}>
              ₹{toPay.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* spacing for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── 6. Sticky bottom checkout bar ───────────────────────────────────── */}
      <View style={styles.checkoutBar}>
        <View style={styles.checkoutBarInner}>
          {/* To pay label + amount */}
          <View style={styles.toPayCol}>
            <Text style={styles.toPayLabel}>TO PAY</Text>
            <Text style={styles.toPayAmount}>
              ₹{toPay.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* CTA button */}
          {isBelowMin ? (
            <TouchableOpacity
              style={styles.checkoutBtnDisabled}
              onPress={handleCheckout}
              activeOpacity={0.9}
            >
              <Text style={styles.checkoutBtnTxt}>
                Add ₹{amountNeeded.toLocaleString('en-IN')} more
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnTxt}>Proceed to pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Auth gate modal */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },

  // Header
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

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  // ── Empty state ──────────────────────────────────────────────────────────────
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

  // ── Notice banners ───────────────────────────────────────────────────────────
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

  // ── Cart items card ──────────────────────────────────────────────────────────
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

  // Image tile: 52×52, coloured bg, 10px radius (Figma spec)
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

  // Item info
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

  // Stepper: green pill, 30×32 hit areas (Figma spec)
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

  // ── Save basket row ──────────────────────────────────────────────────────────
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

  // ── Coupon row ───────────────────────────────────────────────────────────────
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

  // ── Bill details card ────────────────────────────────────────────────────────
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

  // ── Sticky checkout bar (Figma: frosted, TO PAY + button) ───────────────────
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 16,
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
