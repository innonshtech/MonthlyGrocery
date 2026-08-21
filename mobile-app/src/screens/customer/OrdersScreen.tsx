import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function OrdersScreen({ navigation }: any) {
  const { token, city, area } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // 1-Tap Reorder Action (F3)
  const handleReorder = async (order: any) => {
    setReorderingId(order.id);
    try {
      let addedCount = 0;
      for (const item of order.order_items || []) {
        const prodObj = {
          id: item.product_id,
          name: item.product_name,
          price: item.unit_price,
          mrp: item.mrp || Math.round(item.unit_price * 1.2),
          unit: item.unit || '1 unit',
          image_url: item.image_url || '',
        };
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
          addToCart({
          id: item.product_id,
          shop_id: item.shop_id || 'shop-1',
          brand: item.brand || 'Groceries',
          primary_category: item.primary_category || 'Essentials',
          name: item.product_name,
          price: item.unit_price,
          mrp: item.mrp || Math.round(item.unit_price * 1.2),
          unit: item.unit || '1 unit',
          image_url: item.image_url || '',
        } as any);
        }
        addedCount += qty;
      }

      Alert.alert(
        'Basket Reordered!',
        `Added ${addedCount} items from Order #${order.id} directly into your cart.`,
        [
          { text: 'Keep Browsing', style: 'cancel' },
          { text: 'View Cart ›', onPress: () => navigation.navigate('Cart') }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Could not reorder items at this moment.');
    } finally {
      setReorderingId(null);
    }
  };

  const activeOrders = orders.filter((o) => ['pending', 'confirmed', 'packed', 'dispatched', 'out_for_delivery'].includes(o.status?.toLowerCase()));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status?.toLowerCase()));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>{token ? 'Orders & Tracking' : 'Your orders'}</Text>
      </View>

      {!token ? (
        /* =========================================================================
           STATE: GUEST ORDERS SIGN IN GATE (F1 GUEST IN FIGMA)
           ========================================================================= */
        <View style={styles.guestOrdersWrap}>
          <View style={styles.guestOrdersMintCircle}>
            <AppIcon name="shopping-bag" size={32} color={COLORS.green700} />
          </View>

          <Text style={styles.guestOrdersHeadline}>Sign in to see your orders</Text>
          <Text style={styles.guestOrdersSubtitle}>
            Track deliveries and reorder your monthly baskets once you sign in.
          </Text>

          <TouchableOpacity
            style={styles.guestOrdersBtn}
            onPress={() => navigation.navigate('Login', { redirect: 'Orders' })}
            activeOpacity={0.85}
          >
            <Text style={styles.guestOrdersBtnText}>Continue with phone number</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.green700} />
        </View>
      ) : orders.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <AppIcon name="shopping-bag" size={48} color={COLORS.green700} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            When you place your monthly grocery orders, you can track live deliveries and reorder in 1 tap here.
          </Text>
          <TouchableOpacity
            style={styles.startShopBtn}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.85}
          >
            <Text style={styles.startShopBtnText}>Start monthly shopping ›</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* =========================================================================
             1. ACTIVE ORDERS SECTION (F1)
             ========================================================================= */}
          {activeOrders.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>ACTIVE DELIVERY</Text>

              {activeOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.activeOrderCard}
                  onPress={() => navigation.navigate('OrderDetail', { order })}
                  activeOpacity={0.9}
                >
                  <View style={styles.activeCardTop}>
                    <View style={styles.activeStatusPill}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.activeStatusText}>
                        {order.status === 'out_for_delivery' ? 'Out for Delivery' : 'Order Confirmed'}
                      </Text>
                    </View>
                    <Text style={styles.orderIdText}>#{order.id}</Text>
                  </View>

                  <Text style={styles.activeSlotText}>
                    Arriving {order.delivery_slot || 'Today, 7:00 AM - 10:00 AM'}
                  </Text>

                  {/* OTP Snippet */}
                  {order.delivery_otp && (
                    <View style={styles.otpBanner}>
                      <Text style={styles.otpLabel}>Delivery OTP</Text>
                      <Text style={styles.otpCode}>{order.delivery_otp}</Text>
                    </View>
                  )}

                  {/* Item thumbs */}
                  <View style={styles.thumbsRow}>
                    {(order.order_items || []).slice(0, 4).map((it: any, idx: number) => (
                      <View key={idx} style={styles.miniThumb}>
                        {it.image_url ? (
                          <Image source={{ uri: it.image_url }} style={styles.thumbImg} resizeMode="contain" />
                        ) : (
                          <AppIcon name="shopping-bag" size={16} color={COLORS.green700} />
                        )}
                      </View>
                    ))}
                    {(order.order_items?.length || 0) > 4 && (
                      <View style={styles.moreThumbsBadge}>
                        <Text style={styles.moreThumbsText}>+{order.order_items.length - 4}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.activeCardBottom}>
                    <Text style={styles.activeTotalText}>
                      {order.order_items?.length || 0} items · ₹{order.total_amount}
                    </Text>
                    <View style={styles.trackActionBtn}>
                      <Text style={styles.trackActionText}>Track live ›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* =========================================================================
             2. PAST ORDERS SECTION (F1)
             ========================================================================= */}
          {pastOrders.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>PAST MONTHLY BASKETS</Text>

              {pastOrders.map((order) => {
                const isReordering = reorderingId === order.id;

                return (
                  <View key={order.id} style={styles.pastOrderCard}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('OrderDetail', { order })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.pastCardTop}>
                        <View>
                          <Text style={styles.pastOrderId}>#{order.id}</Text>
                          <Text style={styles.pastDateText}>
                            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={styles.deliveredPill}>
                          <Text style={styles.deliveredText}>✓ Delivered</Text>
                        </View>
                      </View>

                      {/* Items row */}
                      <Text style={styles.pastItemsSummary} numberOfLines={1}>
                        {(order.order_items || []).map((i: any) => i.product_name).join(', ')}
                      </Text>

                      <View style={styles.pastCardPriceRow}>
                        <Text style={styles.pastAmountText}>
                          {order.order_items?.length || 0} items · ₹{order.total_amount}
                        </Text>
                        {order.discount_amount > 0 && (
                          <View style={styles.savedPill}>
                            <Text style={styles.savedPillText}>Saved ₹{order.discount_amount}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Action buttons row */}
                    <View style={styles.pastActionsRow}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => navigation.navigate('OrderDetail', { order })}
                      >
                        <Text style={styles.detailsBtnText}>View details ›</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                        disabled={isReordering}
                        activeOpacity={0.85}
                      >
                        {isReordering ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.reorderBtnText}>↻ Reorder basket</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink900,
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
    paddingBottom: 32,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  /* Active Order Card */
  activeOrderCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.green700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green600,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green700,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink500,
  },
  activeSlotText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 12,
  },
  otpBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.marigold700,
  },
  otpCode: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.marigold700,
    letterSpacing: 2,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  miniThumb: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  thumbImg: {
    width: 32,
    height: 32,
  },
  moreThumbsBadge: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreThumbsText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink700,
  },
  activeCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12,
  },
  activeTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  trackActionBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  trackActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  /* Past Order Card */
  pastOrderCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  pastCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  pastOrderId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  pastDateText: {
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 2,
  },
  deliveredPill: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  deliveredText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green700,
  },
  pastItemsSummary: {
    fontSize: 12.5,
    color: COLORS.ink700,
    marginBottom: 8,
  },
  pastCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pastAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  savedPill: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  savedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green700,
  },
  pastActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12,
  },
  detailsBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink700,
  },
  reorderBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  /* Empty State */
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
  },
  startShopBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startShopBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  /* Guest State Styles */
  guestOrdersWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  guestOrdersMintCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestOrdersHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestOrdersSubtitle: {
    fontSize: 13.5,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  guestOrdersBtn: {
    width: '100%',
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestOrdersBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
