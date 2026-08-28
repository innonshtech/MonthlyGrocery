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
import AppIcon from '../../components/AppIcon';
import AppLoader from '../../components/AppLoader';
import { useCart } from '../../context/CartContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  CheckoutBackIcon,
  CheckoutHomeIcon,
  CheckoutClockIcon,
  CheckoutFallbackEmoji,
  THUMB_BG,
} from '../../components/CheckoutFigmaIcons';
import {
  ConsumerOrder,
  OrderDetailScreenConfig,
  OrderStatusStep,
  fetchOrderDetailScreenConfig,
  fetchOrderById,
  formatOrdersTemplate,
  formatInr,
  getOrderDisplayId,
  addOrderItemsToCart,
  isActiveOrderStatus,
  isPackedStageStatus,
  canConsumerCancelOrder,
  getTimelineStepLabel,
  getTimelineStepTimeLabel,
  cancelOrder,
} from '../../services/ordersApi';

const SCREEN_BG = '#FBFAF6';

function OrderStatusTimeline({
  steps,
  config,
  deliverySlot,
}: {
  steps: OrderStatusStep[];
  config: OrderDetailScreenConfig;
  deliverySlot?: string | null;
}) {
  return (
    <View style={styles.timelineCard}>
      <Text style={styles.sectionLabel}>{config.status_timeline_section_label}</Text>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const completed = step.completed;
        const active = step.active;
        const timeLabel = getTimelineStepTimeLabel(step, config, deliverySlot);
        return (
          <View key={step.key} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View
                style={[
                  styles.timelineDot,
                  completed && styles.timelineDotDone,
                  active && styles.timelineDotActive,
                ]}
              />
              {!isLast ? (
                <View
                  style={[
                    styles.timelineLine,
                    completed && styles.timelineLineDone,
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  completed && styles.timelineLabelDone,
                  active && styles.timelineLabelActive,
                ]}
              >
                {getTimelineStepLabel(step.key, config)}
              </Text>
              <Text style={styles.timelineTime}>{timeLabel}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const orderId = route?.params?.orderId || route?.params?.order?.id;

  const [screenConfig, setScreenConfig] = useState<OrderDetailScreenConfig | null>(null);
  const [order, setOrder] = useState<ConsumerOrder | null>(route?.params?.order || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const config = await fetchOrderDetailScreenConfig();
    setScreenConfig(config);
    if (!config || !token || !orderId) {
      setError(true);
      setLoading(false);
      return;
    }
    const fetched = await fetchOrderById(token, orderId);
    if (!fetched) {
      setError(true);
    } else {
      setOrder(fetched);
    }
    setLoading(false);
  }, [token, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReorder = () => {
    if (!screenConfig || !order) return;
    const addedCount = addOrderItemsToCart(
      order,
      addToCart,
      screenConfig.default_product_name,
    );
    Alert.alert(
      screenConfig.reorder_success_title,
      formatOrdersTemplate(screenConfig.reorder_success_message_template, {
        count: addedCount,
      }),
      [
        { text: screenConfig.reorder_keep_browsing_label, style: 'cancel' },
        {
          text: screenConfig.reorder_view_cart_label,
          onPress: () => navigation.navigate('Cart'),
        },
      ],
    );
  };

  const handleCancel = () => {
    if (!screenConfig || !order || !token) return;
    Alert.alert(
      screenConfig.cancel_order_confirm_title,
      screenConfig.cancel_order_confirm_message,
      [
        { text: screenConfig.cancel_order_confirm_no, style: 'cancel' },
        {
          text: screenConfig.cancel_order_confirm_yes,
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { order: updated, error: cancelError } = await cancelOrder(token, order.id);
            setCancelling(false);
            if (updated) {
              setOrder(updated);
            } else {
              Alert.alert(
                screenConfig.error_alert_title,
                cancelError || screenConfig.cancel_order_error_message,
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading order details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !screenConfig || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.errorMsg}>{screenConfig?.load_error_message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryTxt}>{screenConfig?.retry_label}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const items = order.order_items || [];
  const itemCount = order.item_count || items.length;
  const totalPaid = Number(order.total_amount) || 0;
  const discountAmount = Number(order.discount_amount) || 0;
  const productSavings = Number(order.product_savings) || 0;
  const totalSavings = Number(order.total_savings) || productSavings + discountAmount;
  const itemTotalMrp = totalPaid + totalSavings;
  const isCancelled = order.is_cancelled || order.status === 'cancelled';
  const isDelivered = order.is_delivered || order.status === 'delivered';
  const isActive =
    !isCancelled &&
    !isDelivered &&
    (order.is_active || isActiveOrderStatus(order.status));
  const deliverTo =
    order.deliver_to_label || order.shipping_address || '';
  const deliveryWindow = order.delivery_slot || '';
  const paidVia = formatOrdersTemplate(screenConfig.paid_via_template, {
    method: order.payment_method_label || order.payment_method || '',
    amount: formatInr(totalPaid),
  });

  const statusTitle = isCancelled
    ? screenConfig.cancelled_status_label
    : isDelivered
      ? screenConfig.delivered_status_label
      : isActive && isPackedStageStatus(order.status)
        ? screenConfig.status_packed
        : isActive
          ? screenConfig.status_confirmed
          : order.status;

  const cancelledByLabel =
    order.cancelled_by === 'consumer'
      ? screenConfig.cancelled_by_you_label
      : screenConfig.cancelled_by_support_label;

  const statusSub = isCancelled
    ? formatOrdersTemplate(screenConfig.cancelled_on_template, {
        datetime: new Date(order.cancelled_at || order.created_at).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        cancelled_by: cancelledByLabel,
      })
    : isDelivered
      ? formatOrdersTemplate(screenConfig.delivered_on_template, {
          datetime: new Date(order.created_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          order_id: getOrderDisplayId(order),
        })
      : isActive && deliveryWindow
        ? formatOrdersTemplate(screenConfig.active_arriving_template, { slot: deliveryWindow })
        : `${getOrderDisplayId(order)} · ${new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}`;

  const timelineSteps = order.status_timeline || [];

  const itemsHeader = isCancelled
    ? formatOrdersTemplate(screenConfig.items_not_delivered_template, { count: itemCount })
    : formatOrdersTemplate(screenConfig.items_section_template, { count: itemCount });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenConfig.title}</Text>
        {isCancelled ? (
          <>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerOrderId}>{getOrderDisplayId(order)}</Text>
          </>
        ) : (
          <Text style={styles.headerOrderId}>{getOrderDisplayId(order)}</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIconWrap,
              isCancelled && styles.statusIconCancelled,
              isActive && styles.statusIconActive,
            ]}
          >
            {isCancelled ? (
              <Text style={styles.statusEmojiCancelled}>✕</Text>
            ) : isActive ? (
              <Text style={styles.statusEmojiActive}>◎</Text>
            ) : (
              <Text style={styles.statusEmoji}>✓</Text>
            )}
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>{statusTitle}</Text>
            <Text style={styles.statusSub}>{statusSub}</Text>
          </View>
        </View>

        {isActive && timelineSteps.length > 0 ? (
          <OrderStatusTimeline
            steps={timelineSteps}
            config={screenConfig}
            deliverySlot={deliveryWindow}
          />
        ) : null}

        {isActive && order.delivery_otp ? (
          <View style={styles.otpCard}>
            <View style={styles.otpTextWrap}>
              <Text style={styles.otpLabel}>{screenConfig.delivery_otp_label}</Text>
              <Text style={styles.otpSub}>{screenConfig.delivery_otp_subtitle}</Text>
            </View>
            <Text style={styles.otpCode}>{order.delivery_otp}</Text>
          </View>
        ) : null}

        {isActive && order.delivery_partner_name ? (
          <View style={styles.partnerCard}>
            <Text style={styles.partnerLabel}>{screenConfig.delivery_partner_label}</Text>
            <Text style={styles.partnerName}>{order.delivery_partner_name}</Text>
          </View>
        ) : null}

        {isCancelled ? (
          <View style={styles.refundCard}>
            <View style={styles.refundIconWrap}>
              <Text style={styles.refundIcon}>↩</Text>
            </View>
            <View style={styles.refundTextWrap}>
              <Text style={styles.refundTitle}>
                {formatOrdersTemplate(screenConfig.refund_initiated_template, {
                  amount: formatInr(totalPaid),
                })}
              </Text>
              <Text style={styles.refundSub}>
                {order.refund_message || screenConfig.refund_eta_message}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.itemsCard}>
          <Text style={styles.itemsHeader}>{itemsHeader}</Text>
          {items.map((item, idx) => {
            const priceVal = parseFloat(String(item.unit_price ?? item.price)) || 0;
            const qty = parseInt(String(item.quantity), 10) || 1;
            return (
              <View key={`${item.product_id}-${idx}`} style={styles.itemRow}>
                <View style={[styles.itemThumb, { backgroundColor: THUMB_BG[idx % THUMB_BG.length] }]}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImg} />
                  ) : (
                    <CheckoutFallbackEmoji index={idx} size={26} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product_name || item.name}
                  </Text>
                  <Text style={styles.itemQty}>
                    {formatOrdersTemplate(screenConfig.qty_template, { qty })}
                  </Text>
                </View>
                {!isCancelled ? (
                  <Text style={styles.itemPrice}>{formatInr(priceVal * qty)}</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {!isCancelled && (deliverTo || deliveryWindow || paidVia) ? (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>{screenConfig.delivery_details_section_label}</Text>
            {deliverTo ? (
              <View style={styles.detailRow}>
                <CheckoutHomeIcon size={18} />
                <View style={styles.detailText}>
                  <Text style={styles.detailTitle}>{screenConfig.delivered_to_label}</Text>
                  <Text style={styles.detailSub}>{deliverTo}</Text>
                </View>
              </View>
            ) : null}
            {deliveryWindow ? (
              <View style={styles.detailRow}>
                <CheckoutClockIcon size={18} />
                <View style={styles.detailText}>
                  <Text style={styles.detailTitle}>{screenConfig.delivery_window_label}</Text>
                  <Text style={styles.detailSub}>{deliveryWindow}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={styles.paidIcon}>₹</Text>
              <View style={styles.detailText}>
                <Text style={styles.detailTitle}>{screenConfig.paid_via_label}</Text>
                <Text style={styles.detailSub}>{paidVia}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {!isCancelled ? (
          <View style={styles.billCard}>
            <Text style={styles.sectionLabel}>{screenConfig.bill_details_title}</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{screenConfig.bill_item_total_label}</Text>
              <Text style={styles.billVal}>{formatInr(itemTotalMrp)}</Text>
            </View>
            {order.coupon_code && discountAmount > 0 ? (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>
                  {formatOrdersTemplate(screenConfig.bill_coupon_template, {
                    code: order.coupon_code,
                  })}
                </Text>
                <Text style={[styles.billVal, styles.savingsVal]}>
                  − {formatInr(discountAmount)}
                </Text>
              </View>
            ) : null}
            {productSavings > 0 ? (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{screenConfig.bill_savings_label}</Text>
                <Text style={[styles.billVal, styles.savingsVal]}>
                  − {formatInr(productSavings)}
                </Text>
              </View>
            ) : null}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{screenConfig.bill_delivery_fee_label}</Text>
              <Text style={[styles.billVal, styles.freeVal]}>
                {screenConfig.bill_delivery_fee_value}
              </Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>{screenConfig.bill_total_paid_label}</Text>
              <Text style={styles.billTotalVal}>{formatInr(totalPaid)}</Text>
            </View>
          </View>
        ) : null}

        {isCancelled ? (
          <>
            <TouchableOpacity
              style={styles.reorderOutlineBtn}
              onPress={handleReorder}
              activeOpacity={0.85}
            >
              <Text style={styles.reorderOutlineTxt}>
                {screenConfig.reorder_cancelled_button_label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('HelpSupport')}
              activeOpacity={0.85}
              style={styles.cancelledHelpWrap}
            >
              <Text style={styles.cancelledHelpTxt}>{screenConfig.cancelled_help_label}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {canConsumerCancelOrder(order) ? (
              <TouchableOpacity
                style={styles.cancelOrderBtn}
                onPress={handleCancel}
                disabled={cancelling}
                activeOpacity={0.85}
              >
                {cancelling ? (
                  <ActivityIndicator color={COLORS.ink700} />
                ) : (
                  <Text style={styles.cancelOrderTxt}>{screenConfig.cancel_order_label}</Text>
                )}
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder} activeOpacity={0.85}>
              <Text style={styles.reorderBtnTxt}>{screenConfig.reorder_button_label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('HelpSupport')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnTxt}>{screenConfig.get_help_label}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
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
  retryTxt: { ...FONTS.balooBold, color: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
    flex: 1,
  },
  headerOrderId: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: COLORS.ink500,
  },
  headerSpacer: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconActive: {
    backgroundColor: COLORS.marigold100,
    borderWidth: 1.5,
    borderColor: COLORS.marigold200,
  },
  statusIconCancelled: { backgroundColor: '#FEE2E2' },
  statusEmoji: { fontSize: 18, color: COLORS.green700, fontWeight: '700' },
  statusEmojiActive: { fontSize: 16, color: COLORS.marigold700, fontWeight: '700' },
  statusEmojiCancelled: { fontSize: 18, color: '#DC2626', fontWeight: '700' },
  statusTextWrap: { flex: 1, marginLeft: 14 },
  statusTitle: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  statusSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 2,
  },
  refundCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refundIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  refundIcon: {
    fontSize: 18,
    color: COLORS.green700,
    fontWeight: '700',
  },
  refundTextWrap: { flex: 1 },
  refundTitle: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  refundSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 4,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.ink300,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  timelineDotDone: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green700,
  },
  timelineDotActive: {
    borderColor: COLORS.green700,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.line,
    marginTop: 4,
    marginBottom: 2,
  },
  timelineLineDone: {
    backgroundColor: COLORS.green600,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineLabel: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink500,
  },
  timelineLabelDone: {
    ...FONTS.balooBold,
    color: COLORS.ink900,
  },
  timelineLabelActive: {
    ...FONTS.balooBold,
    color: COLORS.green700,
  },
  timelineTime: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 2,
  },
  otpCard: {
    backgroundColor: COLORS.marigold100,
    borderWidth: 1.5,
    borderColor: COLORS.marigold200,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpTextWrap: { flex: 1, paddingRight: 12 },
  otpLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.marigold700,
  },
  otpSub: {
    ...FONTS.muktaRegular,
    fontSize: 11,
    color: COLORS.marigold700,
    marginTop: 2,
  },
  otpCode: {
    ...FONTS.balooBold,
    fontSize: 20,
    color: COLORS.marigold700,
    letterSpacing: 2,
  },
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  partnerLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    marginBottom: 4,
  },
  partnerName: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemsHeader: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.line,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  itemThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImg: { width: 32, height: 32 },
  itemInfo: { flex: 1 },
  itemName: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  itemQty: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: COLORS.ink500,
    marginTop: 2,
  },
  itemPrice: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink500,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailText: { flex: 1 },
  detailTitle: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: COLORS.ink700,
  },
  detailSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: COLORS.ink500,
    marginTop: 2,
    lineHeight: 18,
  },
  paidIcon: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: COLORS.green700,
    width: 18,
    textAlign: 'center',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink700,
  },
  billVal: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  savingsVal: { color: COLORS.green700 },
  freeVal: { color: COLORS.green700, ...FONTS.muktaBold },
  billDivider: {
    height: 1.5,
    backgroundColor: COLORS.line,
    marginVertical: 8,
  },
  billTotalLabel: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  billTotalVal: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  reorderBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reorderBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  reorderOutlineBtn: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reorderOutlineTxt: {
    ...FONTS.balooBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  cancelledHelpWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  cancelledHelpTxt: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink700,
  },
  cancelOrderBtn: {
    height: 45,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelOrderTxt: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: '#DC2626',
  },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  secondaryBtn: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtnTxt: {
    ...FONTS.balooBold,
    fontSize: 14,
    color: COLORS.ink700,
  },
});
