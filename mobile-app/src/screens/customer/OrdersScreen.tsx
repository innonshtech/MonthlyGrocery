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
import { SvgXml } from 'react-native-svg';
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

const SCREEN_BG = '#F8FAF7';

/* Exact SVG Icons matching Figma */
const TRUCK_ICON_XML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 2.5H10.5V11H1V2.5ZM10.5 5.5H13.5L15 7.5V11H10.5V5.5Z" stroke="#1E7A46" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="12.5" r="1.5" stroke="#1E7A46" stroke-width="1.3"/><circle cx="12.5" cy="12.5" r="1.5" stroke="#1E7A46" stroke-width="1.3"/></svg>`;

const CHECK_ICON_XML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DELIVERED_CHECK_XML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="9" fill="#EAF5EE"/><path d="M12.5 6.5L7.5 11.5L5.5 9.5" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function OrderProgressBar({ status }: { status?: string }) {
  const s = (status || '').toLowerCase();
  let activeIndex = 0;
  if (['packing', 'packed'].includes(s)) activeIndex = 1;
  else if (['dispatched', 'out_for_delivery', 'on_the_way'].includes(s)) activeIndex = 2;
  else if (['delivered'].includes(s)) activeIndex = 3;

  const steps = [
    { label: 'Confirmed' },
    { label: 'Packed' },
    { label: 'On the way' },
    { label: 'Delivered' },
  ];

  const fillWidth =
    activeIndex === 0 ? '0%' : activeIndex === 1 ? '33.33%' : activeIndex === 2 ? '66.66%' : '100%';

  return (
    <View style={styles.stepperContainer}>
      <View style={styles.stepperTrackRow}>
        {/* Background Grey Line */}
        <View style={styles.stepperTrackLine}>
          {/* Active Green Progress Line */}
          <View style={[styles.stepperFillLine, { width: fillWidth }]} />
        </View>

        {/* 4 Step Nodes */}
        {steps.map((step, idx) => {
          const isDone = idx < activeIndex || (activeIndex === 3 && idx === 3);
          const isActive = idx === activeIndex && activeIndex !== 3;

          return (
            <View key={step.label} style={styles.nodeCol}>
              {isDone ? (
                <View style={styles.nodeDone}>
                  <SvgXml xml={CHECK_ICON_XML} width={10} height={10} />
                </View>
              ) : isActive ? (
                <View style={styles.nodeActive}>
                  <View style={styles.nodeActiveInner} />
                </View>
              ) : (
                <View style={styles.nodeUpcoming} />
              )}
            </View>
          );
        })}
      </View>

      {/* Step Labels */}
      <View style={styles.stepperLabelsRow}>
        {steps.map((step, idx) => {
          const isDoneOrActive = idx <= activeIndex;
          return (
            <View key={`lbl-${step.label}`} style={styles.labelCol}>
              <Text
                style={[
                  styles.stepperLabelTxt,
                  isDoneOrActive ? styles.stepperLabelActive : styles.stepperLabelUpcoming,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function OrdersScreen({
  navigation,
  setActiveTab,
}: {
  navigation: any;
  setActiveTab?: (tab: 'Home' | 'Categories' | 'Cart' | 'Orders' | 'Account') => void;
}) {
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

  const safeOrders = Array.isArray(orders) ? orders.filter(Boolean) : [];
  const activeOrders = safeOrders.filter((o) => isActiveOrderStatus(o.status));
  const pastOrders = safeOrders.filter((o) => !isActiveOrderStatus(o.status));

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{screenConfig?.title || 'My orders'}</Text>
      </View>

      {!token ? (
        <View style={styles.guestWrap}>
          <View style={styles.guestCircle}>
            <CheckoutFallbackEmoji index={0} size={40} />
          </View>
          <Text style={styles.guestTitle}>{screenConfig.guest_title || 'Sign in to view orders'}</Text>
          <Text style={styles.guestSub}>{screenConfig.guest_subtitle || 'Track your monthly grocery deliveries'}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login', { redirect: 'Orders' })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>{screenConfig.guest_cta_label || 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <AppLoader message="Loading orders..." />
        </View>
      ) : ordersError ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptySub}>{screenConfig.load_error_message || 'Could not load your orders'}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={loadOrders} activeOpacity={0.85}>
            <Text style={styles.primaryBtnTxt}>{screenConfig.retry_label || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      ) : safeOrders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <CheckoutFallbackEmoji index={1} size={48} />
          </View>
          <Text style={styles.emptyTitle}>{screenConfig.empty_title || 'No orders yet'}</Text>
          <Text style={styles.emptySub}>{screenConfig.empty_message || 'Your placed orders will appear here'}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (setActiveTab) {
                setActiveTab('Home');
              }
              navigation.navigate('Shop', { initialTab: 'Home' });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>{screenConfig.empty_cta_label || 'Start shopping'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeOrders.map((order) => {
            if (!order) return null;
            const rawSlot = typeof order.delivery_slot === 'string' ? order.delivery_slot.trim() : '';
            const slotText = rawSlot
              ? (rawSlot.toLowerCase().startsWith('arriving')
                  ? rawSlot
                  : formatOrdersTemplate(screenConfig?.active_arriving_template || 'Arriving {slot}', { slot: rawSlot }))
              : 'Arriving today, 4:00 – 8:00 PM';

            const s = (order.status || '').toLowerCase();
            let statusLabel = screenConfig?.status_confirmed || 'Confirmed';
            if (['out_for_delivery', 'on_the_way'].includes(s)) {
              statusLabel = screenConfig?.status_out_for_delivery || 'Out for delivery';
            } else if (['packed', 'packing'].includes(s)) {
              statusLabel = screenConfig?.status_packed || 'Packed';
            } else if (s === 'dispatched') {
              statusLabel = 'Dispatched';
            }

            const itemsList = Array.isArray(order.order_items) ? order.order_items.filter(Boolean) : [];
            const itemCount = Number(order.item_count) || itemsList.length || 0;

            return (
              <View key={order.id} style={styles.activeCard}>
                {/* Top status & ID */}
                <View style={styles.activeTop}>
                  <View style={styles.statusPill}>
                    <SvgXml xml={TRUCK_ICON_XML} width={15} height={15} />
                    <Text style={styles.statusPillTxt}>{statusLabel}</Text>
                  </View>
                  <Text style={styles.orderId}>{getOrderDisplayId(order)}</Text>
                </View>

                {/* Arriving slot title */}
                <Text style={styles.arrivingTxt}>{slotText}</Text>

                {/* 4-Step Progress Tracker */}
                <OrderProgressBar status={order.status} />

                {/* Hairline Divider */}
                <View style={styles.divider} />

                {/* Bottom Row: Thumbs + Info + Track Button */}
                <View style={styles.activeBottom}>
                  <View style={styles.thumbsRow}>
                    {itemsList.slice(0, 3).map((it, idx) => (
                      <View
                        key={`${order.id}-${idx}`}
                        style={[styles.thumb, { backgroundColor: THUMB_BG[idx % THUMB_BG.length] }]}
                      >
                        {it.image_url ? (
                          <Image source={{ uri: it.image_url }} style={styles.thumbImg} />
                        ) : (
                          <CheckoutFallbackEmoji index={idx} size={24} />
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={styles.activeMeta}>
                    <Text style={styles.itemsTxt}>
                      {formatOrdersTemplate(screenConfig?.items_count_template || '{count} items', {
                        count: itemCount,
                      })}
                    </Text>
                    <Text style={styles.amountTxt}>{formatInr(Number(order.total_amount) || 0)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.trackBtnTxt}>{screenConfig?.track_button_label || 'Track'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {pastOrders.length > 0 ? (
            <View style={styles.pastSection}>
              <Text style={styles.sectionLabel}>{screenConfig?.past_orders_section_label || 'PAST ORDERS'}</Text>
              {pastOrders.map((order) => {
                if (!order) return null;
                const isDelivered = (order.status || '').toLowerCase() === 'delivered';
                let dateLabel = order.status || '';
                if (isDelivered) {
                  let formattedDate = '';
                  try {
                    formattedDate = order.created_at
                      ? new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '';
                  } catch {
                    formattedDate = '';
                  }
                  dateLabel = formatOrdersTemplate(
                    screenConfig?.delivered_status_template || 'Delivered on {date}',
                    { date: formattedDate },
                  );
                }

                const itemsList = Array.isArray(order.order_items) ? order.order_items.filter(Boolean) : [];
                const itemCount = Number(order.item_count) || itemsList.length || 0;

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.pastCard}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.pastTop}>
                      <View style={styles.pastStatusWrap}>
                        <SvgXml xml={DELIVERED_CHECK_XML} width={18} height={18} />
                        <Text style={styles.pastStatus}>{dateLabel}</Text>
                      </View>
                      <Text style={styles.pastAmount}>
                        {formatInr(Number(order.total_amount) || 0)}
                      </Text>
                    </View>

                    <View style={styles.pastBottom}>
                      <View style={styles.thumbsRow}>
                        {itemsList.slice(0, 3).map((it, idx) => (
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
                        {formatOrdersTemplate(screenConfig?.items_count_template || '{count} items', {
                          count: itemCount,
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
                            {screenConfig?.reorder_button_label || 'Reorder'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
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
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 24,
    color: '#17251E',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },

  /* Active Order Card */
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#1E7A46',
  },
  orderId: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#8E9E94',
  },
  arrivingTxt: {
    ...FONTS.muktaBold,
    fontSize: 18,
    color: '#17251E',
    marginBottom: 16,
  },

  /* Stepper Progress Bar */
  stepperContainer: {
    width: '100%',
    marginBottom: 4,
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    height: 24,
  },
  stepperTrackLine: {
    position: 'absolute',
    top: 10,
    left: '12.5%',
    right: '12.5%',
    height: 3,
    backgroundColor: '#E5EAE7',
    zIndex: 0,
  },
  stepperFillLine: {
    height: 3,
    backgroundColor: '#1E7A46',
  },
  nodeCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E7A46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1E7A46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E7A46',
  },
  nodeUpcoming: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5EAE7',
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  labelCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepperLabelTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    textAlign: 'center',
  },
  stepperLabelActive: {
    color: '#1E7A46',
  },
  stepperLabelUpcoming: {
    color: '#8E9E94',
    ...FONTS.muktaMedium,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#F0F4F1',
    marginVertical: 14,
  },

  /* Active Card Bottom */
  activeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImg: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  activeMeta: {
    marginLeft: 10,
    flex: 1,
  },
  itemsTxt: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#17251E',
  },
  amountTxt: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  trackBtn: {
    backgroundColor: '#1E7A46',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* Past Orders Section */
  pastSection: {
    marginTop: 12,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#8E9E94',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  pastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
  },
  pastTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pastStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastStatus: {
    ...FONTS.muktaMedium,
    fontSize: 13.5,
    color: '#374151',
    marginLeft: 8,
  },
  pastAmount: {
    ...FONTS.muktaBold,
    fontSize: 16,
    color: '#17251E',
  },
  pastBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastSpacer: {
    flex: 1,
  },
  pastItems: {
    ...FONTS.muktaMedium,
    fontSize: 13,
    color: '#6B7280',
    marginRight: 12,
  },
  reorderBtn: {
    borderWidth: 1.5,
    borderColor: '#1E7A46',
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#1E7A46',
  },

  /* Empty & Guest States */
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
    backgroundColor: '#1E7A46',
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
  retryBtn: {
    backgroundColor: '#1E7A46',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
});

