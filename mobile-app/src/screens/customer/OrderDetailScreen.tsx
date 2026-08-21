import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { order = {} } = route?.params || {};
  const { addToCart } = useCart();

  const isConfirmed = ['confirmed', 'packed', 'out_for_delivery', 'delivered'].includes(order.status);
  const isPacked = ['packed', 'out_for_delivery', 'delivered'].includes(order.status);
  const isOutForDelivery = ['out_for_delivery', 'delivered'].includes(order.status);
  const isDelivered = order.status === 'delivered';

  // Dynamic items directly from real order
  const orderItems = order.order_items && Array.isArray(order.order_items) ? order.order_items : [];

  const totalPaid = parseFloat(order.total_amount as any) || 0;
  const discountAmount = parseFloat(order.discount_amount as any) || 0;
  const itemTotal = totalPaid + discountAmount;
  const deliveryOtp = order.delivery_otp || (isDelivered ? null : '----');

  // Timeline steps
  const steps = [
    { id: 1, title: 'Order Confirmed', time: 'Confirmed', completed: isConfirmed },
    { id: 2, title: 'Packed at Hub', time: isPacked ? 'Ready' : 'Pending', completed: isPacked },
    { id: 3, title: 'Out for Delivery', time: isOutForDelivery ? 'In transit' : 'Pending', completed: isOutForDelivery, active: isOutForDelivery && !isDelivered },
    { id: 4, title: 'Delivered', time: isDelivered ? 'Delivered' : 'Expected', completed: isDelivered },
  ];

  const handleReorder = () => {
    let addedCount = 0;
    for (const item of orderItems) {
      const priceVal = parseFloat((item.unit_price || item.price) as any) || 0;
      const mrpVal = parseFloat((item.mrp) as any) || Math.round(priceVal * 1.2);
      const qty = item.quantity || 1;

      for (let i = 0; i < qty; i++) {
        addToCart({
          id: item.product_id || item.id || `reorder-${addedCount}`,
          shop_id: item.shop_id || 'shop-1',
          brand: item.brand || 'Groceries',
          primary_category: item.primary_category || 'Essentials',
          name: item.product_name || item.name || 'Grocery Item',
          price: priceVal,
          mrp: mrpVal,
          unit: item.unit || '1 unit',
          image_url: item.image_url || '',
        } as any);
      }
      addedCount += qty;
    }

    Alert.alert('Reorder Successful', `Added ${addedCount} items directly to your active cart!`, [
      { text: 'Keep Browsing' },
      { text: 'View Cart ›', onPress: () => navigation.navigate('Cart') }
    ]);
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Order #{order.id || 'MG-849201'}</Text>
          <Text style={styles.headerSub}>
            Placed on {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           1. LIVE STATUS TIMELINE (F2)
           ========================================================================= */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionHeading}>ORDER STATUS</Text>

          <View style={styles.timelineList}>
            {steps.map((s, idx) => {
              const isLast = idx === steps.length - 1;

              return (
                <View key={s.id} style={styles.timelineStepRow}>
                  {/* Indicator Column */}
                  <View style={styles.indicatorCol}>
                    <View
                      style={[
                        styles.timelineCircle,
                        s.completed && styles.timelineCircleDone,
                        s.active && styles.timelineCircleActive,
                      ]}
                    >
                      {s.completed ? (
                        <Text style={styles.timelineCheckText}>✓</Text>
                      ) : s.active ? (
                        <View style={styles.innerActiveDot} />
                      ) : null}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnector,
                          s.completed && styles.timelineConnectorDone,
                        ]}
                      />
                    )}
                  </View>

                  {/* Text Column */}
                  <View style={styles.stepContentCol}>
                    <Text
                      style={[
                        styles.stepTitle,
                        (s.completed || s.active) && styles.stepTitleDone,
                      ]}
                    >
                      {s.title}
                    </Text>
                    <Text style={styles.stepTime}>{s.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* =========================================================================
           2. DELIVERY OTP BANNER (F2)
           ========================================================================= */}
        {deliveryOtp && (
          <View style={styles.otpCard}>
            <View style={styles.otpLeft}>
              <Text style={styles.otpShieldIcon}>🔐</Text>
              <View>
                <Text style={styles.otpHeading}>Delivery Verification OTP</Text>
                <Text style={styles.otpSub}>Share with delivery partner at doorstep</Text>
              </View>
            </View>
            <View style={styles.otpBadge}>
              <Text style={styles.otpCodeText}>{deliveryOtp}</Text>
            </View>
          </View>
        )}

        {/* =========================================================================
           3. DELIVERY ADDRESS & SLOT (F2)
           ========================================================================= */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoTitle}>Delivery Address</Text>
              <Text style={styles.infoSub}>
                {order.shipping_address || 'Flat 402, Green Acres, Paud Road, Kothrud, Pune 411038'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoTitle}>Scheduled Delivery Slot</Text>
              <Text style={styles.infoSub}>
                {order.delivery_slot || 'Today · Morning 7:00 AM - 10:00 AM'}
              </Text>
            </View>
          </View>
        </View>

        {/* =========================================================================
           4. ITEMIZED BASKET BREAKDOWN (F2)
           ========================================================================= */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>
            ITEMS IN THIS BASKET ({orderItems.length})
          </Text>

          {orderItems.map((item: any, idx: number) => {
            const priceVal = parseFloat((item.unit_price || item.price) as any) || 0;
            const qtyVal = item.quantity || 1;
            const lineTotal = priceVal * qtyVal;

            return (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.thumbImg} resizeMode="contain" />
                  ) : (
                    <AppIcon name="shopping-bag" size={20} color={COLORS.green700} />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product_name || item.name}
                  </Text>
                  <Text style={styles.itemQtyText}>
                    {item.unit || '1 unit'} × {qtyVal}
                  </Text>
                </View>

                <Text style={styles.itemLinePrice}>₹{lineTotal}</Text>
              </View>
            );
          })}
        </View>

        {/* =========================================================================
           5. BILL SUMMARY & PAYMENT METHOD (F2)
           ========================================================================= */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>BILL DETAILS</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total (MRP)</Text>
            <Text style={styles.billVal}>₹{itemTotal}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: COLORS.green700 }]}>Coupon Savings</Text>
              <Text style={[styles.billVal, { color: COLORS.green700 }]}>− ₹{discountAmount}</Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billVal, { color: COLORS.green700, fontWeight: '700' }]}>FREE</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total Paid</Text>
            <Text style={styles.billTotalVal}>₹{totalPaid}</Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <Text style={styles.paymentMethodLabel}>Payment Mode</Text>
            <View style={styles.paymentMethodBadge}>
              <Text style={styles.paymentMethodText}>
                {order.payment_method || 'UPI (Google Pay)'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* =========================================================================
         6. BOTTOM ACTIONS BAR (F2 & F3)
         ========================================================================= */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reorderCtaBtn}
          onPress={handleReorder}
          activeOpacity={0.85}
        >
          <Text style={styles.reorderCtaText}>↻ Reorder this basket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => navigation.navigate('HelpSupport')}
          activeOpacity={0.8}
        >
          <Text style={styles.helpBtnText}>Need help with this order?</Text>
        </TouchableOpacity>
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
  headerTitleWrap: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.ink500,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  /* Timeline Card */
  timelineCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.ink300,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCircleDone: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green700,
  },
  timelineCircleActive: {
    borderColor: COLORS.green600,
    backgroundColor: COLORS.green50,
  },
  timelineCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  innerActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green600,
  },
  timelineConnector: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.line,
    marginVertical: 2,
  },
  timelineConnectorDone: {
    backgroundColor: COLORS.green700,
  },
  stepContentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.ink500,
  },
  stepTitleDone: {
    color: COLORS.ink900,
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 11.5,
    color: COLORS.ink500,
    marginTop: 2,
  },
  /* OTP Card */
  otpCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
  },
  otpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  otpShieldIcon: {
    fontSize: 20,
  },
  otpHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.marigold700,
  },
  otpSub: {
    fontSize: 11,
    color: COLORS.ink700,
    marginTop: 1,
  },
  otpBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
  },
  otpCodeText: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.marigold700,
    letterSpacing: 2,
  },
  /* Info Card */
  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 12.5,
    color: COLORS.ink500,
    lineHeight: 17,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 12,
  },
  /* Items */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  itemThumb: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  thumbImg: {
    width: 30,
    height: 30,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  itemQtyText: {
    fontSize: 11.5,
    color: COLORS.ink500,
    marginTop: 2,
  },
  itemLinePrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  /* Bill */
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
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodLabel: {
    fontSize: 12,
    color: COLORS.ink500,
  },
  paymentMethodBadge: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  paymentMethodText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  reorderCtaBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  helpBtn: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
});
