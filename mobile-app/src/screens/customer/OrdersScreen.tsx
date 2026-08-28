import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { COLORS, FONTS } from '../../constants/theme';
import AppLoader from '../../components/AppLoader';
import { CheckoutFallbackEmoji, THUMB_BG } from '../../components/CheckoutFigmaIcons';
import {
  ConsumerOrder,
  OrdersScreenConfig,
  fetchOrdersScreenConfig,
  fetchMyOrders,
  formatOrdersTemplate,
  formatInr,
  getOrderDisplayId,
  isActiveOrderStatus,
  addOrderItemsToCart,
} from '../../services/ordersApi';

const SCREEN_BG = '#FBFAF6';

export default function OrdersScreen({ navigation }: any) {
  const { token } = useAuth();
  const { addToCart } = useCart();

  const [screenConfig, setScreenConfig] = useState<OrdersScreenConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [orders, setOrders] = useState<ConsumerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    const config = await fetchOrdersScreenConfig();
    setScreenConfig(config);
    setConfigError(!config);
    return config;
  }, []);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOrdersError(false);
    const { orders: list, error } = await fetchMyOrders(token);
    if (error) {
      setOrdersError(true);
      setOrders([]);
    } else {
      setOrders(list);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (screenConfig) loadOrders();
  }, [screenConfig, loadOrders]);

  const handleReorder = (order: ConsumerOrder) => {
    if (!screenConfig) return;
    setReorderingId(order.id);
    try {
      const addedCount = addOrderItemsToCart(
        order,
        addToCart,
        screenConfig.default_product_name,
      );
      Alert.alert(
        screenConfig.reorder_success_title,
        formatOrdersTemplate(screenConfig.reorder_success_message_template, {
          count: addedCount,
          order_id: getOrderDisplayId(order),
        }),
        [
          { text: screenConfig.reorder_keep_browsing_label, style: 'cancel' },
          {
            text: screenConfig.reorder_view_cart_label,
            onPress: () => navigation.navigate('Cart'),
          },
        ],
      );
    } catch {
      Alert.alert(screenConfig.error_alert_title, screenConfig.reorder_error_message);
    } finally {
      setReorderingId(null);
    }
  };

  if (!screenConfig && configError) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.retryBtn} onPress={loadConfig} activeOpacity={0.85}>
            <ActivityIndicator color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!screenConfig) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading orders..." />
        </View>
      </SafeAreaView>
    );
  }

  const activeOrders = orders.filter((o) => isActiveOrderStatus(o.status));
  const pastOrders = orders.filter((o) => !isActiveOrderStatus(o.status));

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
      </View>

      {!token ? (
        <View style={styles.guestWrap}>
          <View style={styles.guestCircle}>
            <CheckoutFallbackEmoji index={0} size={40} />
          </View>
          <Text style={styles.guestTitle}>{screenConfig.guest_title}</Text>
          <Text style={styles.guestSub}>{screenConfig.guest_subtitle}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login', { redirect: 'Orders' })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>{screenConfig.guest_cta_label}</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <AppLoader message="Loading orders..." />
        </View>
      ) : ordersError ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptySub}>{screenConfig.load_error_message}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={loadOrders} activeOpacity={0.85}>
            <Text style={styles.primaryBtnTxt}>{screenConfig.retry_label}</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <CheckoutFallbackEmoji index={1} size={48} />
          </View>
          <Text style={styles.emptyTitle}>{screenConfig.empty_title}</Text>
          <Text style={styles.emptySub}>{screenConfig.empty_message}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>{screenConfig.empty_cta_label}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeOrders.map((order) => {
            const slotText = order.delivery_slot
              ? formatOrdersTemplate(screenConfig.active_arriving_template, {
                  slot: order.delivery_slot,
                })
              : screenConfig.status_confirmed;
            const isPacked = ['packed', 'packing', 'dispatched', 'out_for_delivery'].includes(
              (order.status || '').toLowerCase(),
            );
            const statusLabel = isPacked
              ? screenConfig.status_packed
              : screenConfig.status_confirmed;

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.activeCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                activeOpacity={0.9}
              >
                <View style={styles.activeTop}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillTxt}>{statusLabel}</Text>
                  </View>
                  <Text style={styles.orderId}>{getOrderDisplayId(order)}</Text>
                </View>

                <Text style={styles.arrivingTxt}>{slotText}</Text>

                {order.delivery_otp ? (
                  <View style={styles.otpRow}>
                    <Text style={styles.otpLabel}>{screenConfig.delivery_otp_label}</Text>
                    <Text style={styles.otpCode}>{order.delivery_otp}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.activeBottom}>
                  <View style={styles.thumbsRow}>
                    {(order.order_items || []).slice(0, 3).map((it, idx) => (
                      <View
                        key={`${order.id}-${idx}`}
                        style={[styles.thumb, { backgroundColor: THUMB_BG[idx % THUMB_BG.length] }]}
                      >
                        {it.image_url ? (
                          <Image source={{ uri: it.image_url }} style={styles.thumbImg} />
                        ) : (
                          <CheckoutFallbackEmoji index={idx} size={22} />
                        )}
                      </View>
                    ))}
                  </View>
                  <View style={styles.activeMeta}>
                    <Text style={styles.itemsTxt}>
                      {formatOrdersTemplate(screenConfig.items_count_template, {
                        count: order.item_count || order.order_items?.length || 0,
                      })}
                    </Text>
                    <Text style={styles.amountTxt}>{formatInr(Number(order.total_amount) || 0)}</Text>
                  </View>
                  <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnTxt}>{screenConfig.track_button_label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {pastOrders.length > 0 ? (
            <View style={styles.pastSection}>
              <Text style={styles.sectionLabel}>{screenConfig.past_orders_section_label}</Text>
              {pastOrders.map((order) => {
                const isDelivered = order.status === 'delivered';
                const dateLabel = isDelivered
                  ? formatOrdersTemplate(screenConfig.delivered_status_template, {
                      date: new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    })
                  : order.status;

                return (
                  <View key={order.id} style={styles.pastCard}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('OrderDetail', { orderId: order.id })
                      }
                      activeOpacity={0.85}
                    >
                      <View style={styles.pastTop}>
                        <Text style={styles.pastStatus}>{dateLabel}</Text>
                        <Text style={styles.pastAmount}>
                          {formatInr(Number(order.total_amount) || 0)}
                        </Text>
                      </View>
                      <View style={styles.pastBottom}>
                        <View style={styles.thumbsRow}>
                          {(order.order_items || []).slice(0, 3).map((it, idx) => (
                            <View
                              key={`${order.id}-p-${idx}`}
                              style={[
                                styles.pastThumb,
                                { backgroundColor: THUMB_BG[idx % THUMB_BG.length] },
                              ]}
                            >
                              {it.image_url ? (
                                <Image source={{ uri: it.image_url }} style={styles.thumbImg} />
                              ) : (
                                <CheckoutFallbackEmoji index={idx} size={22} />
                              )}
                            </View>
                          ))}
                        </View>
                        <View style={styles.pastSpacer} />
                        <Text style={styles.pastItems}>
                          {formatOrdersTemplate(screenConfig.items_count_template, {
                            count: order.item_count || order.order_items?.length || 0,
                          })}
                        </Text>
                        <TouchableOpacity
                          style={styles.reorderBtn}
                          onPress={() => handleReorder(order)}
                          disabled={reorderingId === order.id}
                          activeOpacity={0.85}
                        >
                          {reorderingId === order.id ? (
                            <ActivityIndicator size="small" color={COLORS.green700} />
                          ) : (
                            <Text style={styles.reorderBtnTxt}>
                              {screenConfig.reorder_button_label}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  errorMsg: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryTxt: { ...FONTS.balooBold, color: '#FFFFFF', fontSize: 15 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: COLORS.green700,
  },
  orderId: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink500,
  },
  arrivingTxt: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.ink900,
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.marigold100,
    borderWidth: 1,
    borderColor: COLORS.marigold200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  otpLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.marigold700,
  },
  otpCode: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.marigold700,
    letterSpacing: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    marginVertical: 12,
  },
  activeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbsRow: { flexDirection: 'row', gap: 6 },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImg: { width: 28, height: 28 },
  activeMeta: { flex: 1 },
  itemsTxt: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  amountTxt: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink500,
  },
  detailsBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
  },
  detailsBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  pastSection: { marginTop: 8 },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  pastCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  pastTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pastStatus: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink700,
  },
  pastAmount: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.ink900,
  },
  pastBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastSpacer: { flex: 1 },
  pastItems: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: COLORS.ink500,
  },
  reorderBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    minWidth: 77,
    alignItems: 'center',
  },
  reorderBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 13,
    color: COLORS.green700,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  guestWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  guestCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    ...FONTS.balooBold,
    fontSize: 22,
    color: COLORS.ink900,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSub: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 230,
    alignItems: 'center',
  },
  primaryBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
