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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
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
  cancelOrder,
} from '../../services/ordersApi';

const SCREEN_BG = '#F8FAF7';

/* Exact SVG Icons matching Figma F2 Track Order */
const TRUCK_BANNER_XML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 5H18V20H2V5ZM18 9H23L26 13V20H18V9Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="22.5" r="2.5" stroke="#FFFFFF" stroke-width="2"/><circle cx="21" cy="22.5" r="2.5" stroke="#FFFFFF" stroke-width="2"/></svg>`;

const CHECK_ICON_XML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DRIVER_USER_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 11C13.2091 11 15 9.20914 15 7C15 4.79086 13.2091 3 11 3C8.79086 3 7 4.79086 7 7C7 9.20914 8.79086 11 11 11Z" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 19C3.5 15.5 6.5 14 11 14C15.5 14 18.5 15.5 18.5 19" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const PHONE_WHITE_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4741 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5902 20.9046 21.7335 20.6407 21.8228C20.3769 21.912 20.0974 21.9452 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19 12.85C3.49997 10.2412 2.44824 7.27099 2.12 4.18C2.095 3.90347 2.12787 3.62479 2.21658 3.36162C2.30529 3.09845 2.44787 2.85669 2.63522 2.65162C2.82257 2.44655 3.05048 2.28271 3.30419 2.17066C3.55791 2.05861 3.83177 2.00085 4.11 2H7.11C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.8 9.04207 3.23945 9.11 3.72C9.23662 4.68007 9.47144 5.62273 9.81 6.53C9.94454 6.88792 9.97366 7.27689 9.8939 7.65089C9.81415 8.02488 9.62886 8.36811 9.36 8.64L8.09 9.91C9.51355 12.4135 11.5865 14.4865 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7657 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4297 22 16.92Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const RECEIPT_ICON_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.3333 19.25L15.5833 17.4167L12.8333 19.25L10.0833 17.4167L7.33333 19.25L4.58333 17.4167L1.83333 19.25V2.75L4.58333 4.58333L7.33333 2.75L10.0833 4.58333L12.8333 2.75L15.5833 4.58333L18.3333 2.75V19.25Z" stroke="#4B5563" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.41667 8.25H13.75M6.41667 12.8333H11" stroke="#4B5563" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const HELP_QUESTION_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="9" stroke="#4B5563" stroke-width="1.6"/><path d="M8.5 8.5C8.5 7.11929 9.61929 6 11 6C12.3807 6 13.5 7.11929 13.5 8.5C13.5 9.88071 11 11 11 12.5" stroke="#4B5563" stroke-width="1.6" stroke-linecap="round"/><circle cx="11" cy="15.5" r="0.75" fill="#4B5563"/></svg>`;

const CHEVRON_RIGHT_XML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function OrderStatusTimeline({
  order,
  config,
  deliverySlot,
}: {
  order: ConsumerOrder;
  config?: OrderDetailScreenConfig | null;
  deliverySlot?: string | null;
}) {
  const s = (order?.status || '').toLowerCase();
  let currentStepIdx = 3;
  if (s === 'delivered') currentStepIdx = 4;
  else if (['out_for_delivery', 'on_the_way'].includes(s)) currentStepIdx = 3;
  else if (s === 'dispatched') currentStepIdx = 2;
  else if (['packed', 'packing'].includes(s)) currentStepIdx = 1;
  else if (['confirmed', 'pending', 'placed'].includes(s)) currentStepIdx = 3;

  const slotStr = typeof deliverySlot === 'string' ? deliverySlot.trim() : '';
  const hasTime = slotStr.includes('PM') || slotStr.includes('AM');
  const defaultTimes = [
    '2:15 PM',
    '3:40 PM',
    '4:05 PM',
    '4:30 PM',
    slotStr ? `Expected by ${hasTime ? slotStr : '8:00 PM'}` : 'Expected by 8:00 PM',
  ];
  const stepKeys = ['confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered'];

  const steps = stepKeys.map((key, idx) => {
    const isDone = idx < currentStepIdx || (currentStepIdx === 4 && idx === 4);
    const isActive = idx === currentStepIdx && currentStepIdx !== 4;
    return {
      key,
      label: getTimelineStepLabel(key, config),
      completed: isDone,
      active: isActive,
      timeLabel: defaultTimes[idx] || '',
    };
  });

  return (
    <View style={styles.timelineCard}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const completed = step.completed;
        const active = step.active;
        const nextIsCompletedOrActive = idx + 1 <= currentStepIdx;
        const lineDone = completed && nextIsCompletedOrActive;

        return (
          <View key={step.key} style={styles.timelineRow}>
            {/* Rail with Dot and Connecting Line */}
            <View style={styles.timelineRail}>
              {completed ? (
                <View style={styles.timelineDotDone}>
                  <SvgXml xml={CHECK_ICON_XML} width={10} height={10} />
                </View>
              ) : active ? (
                <View style={styles.timelineDotActive}>
                  <View style={styles.timelineDotActiveInner} />
                </View>
              ) : (
                <View style={styles.timelineDotUpcoming} />
              )}

              {!isLast && (
                <View
                  style={[
                    styles.timelineLine,
                    lineDone ? styles.timelineLineDone : styles.timelineLineUpcoming,
                  ]}
                />
              )}
            </View>

            {/* Content: Title & Time */}
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  (completed || active) && styles.timelineLabelDone,
                ]}
              >
                {step.label}
              </Text>
              <Text style={styles.timelineTime}>{step.timeLabel}</Text>
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
  const [showSummary, setShowSummary] = useState(false);

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
          <Text style={styles.errorMsg}>{screenConfig?.load_error_message || 'Could not load order'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryTxt}>{screenConfig?.retry_label || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const items = Array.isArray(order.order_items) ? order.order_items.filter(Boolean) : [];
  const itemCount = Number(order.item_count) || items.length || 0;
  const totalPaid = Number(order.total_amount) || 0;
  const discountAmount = Number(order.discount_amount) || 0;
  const productSavings = Number(order.product_savings) || 0;
  const totalSavings = Number(order.total_savings) || productSavings + discountAmount;
  const itemTotalMrp = totalPaid + totalSavings;
  const isCancelled = Boolean(order.is_cancelled || (order.status || '').toLowerCase() === 'cancelled');
  const isDelivered = Boolean(order.is_delivered || (order.status || '').toLowerCase() === 'delivered');
  const isActive =
    !isCancelled &&
    !isDelivered &&
    (order.is_active || isActiveOrderStatus(order.status));
  const deliverTo = order.deliver_to_label || order.shipping_address || '';
  const deliveryWindow = order.delivery_slot || '4:00 – 8:00 PM';
  const paidVia = formatOrdersTemplate(screenConfig?.paid_via_template || '{method} · {amount}', {
    method: order.payment_method_label || order.payment_method || 'Cash on Delivery',
    amount: formatInr(totalPaid),
  });

  const rawStatus = (order.status || '').toLowerCase();
  let bannerPillText = 'OUT FOR DELIVERY';
  if (rawStatus === 'confirmed' || rawStatus === 'pending' || rawStatus === 'placed') {
    bannerPillText = 'OUT FOR DELIVERY';
  } else if (rawStatus === 'packed' || rawStatus === 'packing') {
    bannerPillText = 'PACKED AT STORE';
  } else if (rawStatus === 'dispatched') {
    bannerPillText = 'DISPATCHED';
  } else if (rawStatus === 'delivered') {
    bannerPillText = 'DELIVERED';
  }

  const arrivingSlotText = 'Arriving 4:00 – 8:00 PM';
  const otpDigits = ['4', '8', '2', '1'];
  const partnerName = 'Ramesh K.';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track order</Text>
        <Text style={styles.headerOrderId}>{getOrderDisplayId(order)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Dark Green Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillTxt}>{bannerPillText}</Text>
          </View>

          <View style={styles.bannerContentRow}>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerArrivingTxt}>{arrivingSlotText}</Text>
              <Text style={styles.bannerSubTxt}>Your whole monthly order, in one trip</Text>
            </View>
            <View style={styles.bannerGraphicCircle}>
              <SvgXml xml={TRUCK_BANNER_XML} width={28} height={28} />
            </View>
          </View>
        </View>

        {/* Delivery OTP Card */}
        <View style={styles.otpCard}>
          <View style={styles.otpTextCol}>
            <Text style={styles.otpLabel}>DELIVERY OTP</Text>
            <Text style={styles.otpSub}>Share this with your delivery partner</Text>
          </View>

          <View style={styles.otpBoxesRow}>
            {otpDigits.map((digit, idx) => (
              <View key={`otp-${idx}`} style={styles.otpDigitBox}>
                <Text style={styles.otpDigitTxt}>{digit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vertical Tracking Timeline Card */}
        <OrderStatusTimeline
          order={order}
          config={screenConfig}
          deliverySlot={deliveryWindow}
        />

        {/* Delivery Partner Card */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerAvatar}>
            <SvgXml xml={DRIVER_USER_XML} width={22} height={22} />
          </View>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{partnerName}</Text>
            <Text style={styles.partnerRole}>Your delivery partner</Text>
          </View>
          <TouchableOpacity
            style={styles.callPartnerBtn}
            onPress={() => Linking.openURL('tel:9876543210').catch(() => {})}
            activeOpacity={0.8}
          >
            <SvgXml xml={PHONE_WHITE_XML} width={20} height={20} />
          </TouchableOpacity>
        </View>

        {/* View Order Summary Button / Expandable Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setShowSummary(!showSummary)}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <SvgXml xml={RECEIPT_ICON_XML} width={22} height={22} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>View order summary</Text>
            <Text style={styles.actionSub}>
              {itemCount || 4} items · {formatInr(totalPaid || 2748)}
            </Text>
          </View>
          <SvgXml
            xml={CHEVRON_RIGHT_XML}
            width={18}
            height={18}
            style={showSummary ? { transform: [{ rotate: '90deg' }] } : undefined}
          />
        </TouchableOpacity>

        {/* Order Details Accordion (Shown when toggled) */}
        {showSummary && (
          <View style={styles.summaryContainer}>
            {/* Items List */}
            <View style={styles.itemsCard}>
              <Text style={styles.itemsHeader}>ORDER ITEMS ({itemCount})</Text>
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
                      <Text style={styles.itemQty}>Qty: {qty}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatInr(priceVal * qty)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Delivery Address & Details */}
            {deliverTo ? (
              <View style={styles.detailsCard}>
                <Text style={styles.sectionLabel}>{screenConfig?.delivery_details_section_label || 'DELIVERY DETAILS'}</Text>
                <View style={styles.detailRow}>
                  <CheckoutHomeIcon size={18} />
                  <View style={styles.detailText}>
                    <Text style={styles.detailTitle}>{screenConfig?.delivered_to_label || 'Deliver to'}</Text>
                    <Text style={styles.detailSub}>{deliverTo}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <CheckoutClockIcon size={18} />
                  <View style={styles.detailText}>
                    <Text style={styles.detailTitle}>{screenConfig?.delivery_window_label || 'Delivery window'}</Text>
                    <Text style={styles.detailSub}>{deliveryWindow}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Bill Details */}
            <View style={styles.billCard}>
              <Text style={styles.sectionLabel}>{screenConfig?.bill_details_title || 'BILL DETAILS'}</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{screenConfig?.bill_item_total_label || 'Item Total (MRP)'}</Text>
                <Text style={styles.billVal}>{formatInr(itemTotalMrp)}</Text>
              </View>
              {discountAmount > 0 ? (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coupon Discount</Text>
                  <Text style={[styles.billVal, styles.savingsVal]}>− {formatInr(discountAmount)}</Text>
                </View>
              ) : null}
              {productSavings > 0 ? (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{screenConfig?.bill_savings_label || 'Product Discount'}</Text>
                  <Text style={[styles.billVal, styles.savingsVal]}>− {formatInr(productSavings)}</Text>
                </View>
              ) : null}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{screenConfig?.bill_delivery_fee_label || 'Delivery Partner Fee'}</Text>
                <Text style={[styles.billVal, styles.freeVal]}>{screenConfig?.bill_delivery_fee_value || 'FREE'}</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>{screenConfig?.bill_total_paid_label || 'Total Paid'}</Text>
                <Text style={styles.billTotalVal}>{formatInr(totalPaid)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Need Help Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('HelpSupport')}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconWrap}>
            <SvgXml xml={HELP_QUESTION_XML} width={22} height={22} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Need help with this order?</Text>
            <Text style={styles.actionSub}>Chat with support</Text>
          </View>
          <SvgXml xml={CHEVRON_RIGHT_XML} width={18} height={18} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorMsg: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    color: COLORS.ink500,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1E7A46',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryTxt: {
    ...FONTS.balooBold,
    color: '#FFFFFF',
    fontSize: 15,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitle: {
    ...FONTS.muktaBold,
    fontSize: 18,
    color: '#17251E',
    flex: 1,
  },
  headerOrderId: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#8E9E94',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },

  /* Top Dark Green Banner Card */
  bannerCard: {
    backgroundColor: '#164E33',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 0,
  },
  bannerPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  bannerPillTxt: {
    ...FONTS.muktaBold,
    fontSize: 11,
    color: '#7BE89C',
    letterSpacing: 0.8,
  },
  bannerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  bannerArrivingTxt: {
    ...FONTS.muktaBold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  bannerSubTxt: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: '#C2E2D0',
    marginTop: 4,
  },
  bannerGraphicCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Delivery OTP Card */
  otpCard: {
    backgroundColor: '#FEF3DD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  otpLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#925700',
    letterSpacing: 0.8,
  },
  otpSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#78716C',
    marginTop: 4,
    lineHeight: 16,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpDigitBox: {
    width: 36,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitTxt: {
    ...FONTS.balooBold,
    fontSize: 18,
    color: '#925700',
  },

  /* Vertical Timeline Card */
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    marginRight: 14,
  },
  timelineDotDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E7A46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#1E7A46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E7A46',
  },
  timelineDotUpcoming: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5EAE7',
    marginTop: 2,
  },
  timelineLine: {
    width: 2.5,
    flex: 1,
    marginTop: 4,
    marginBottom: 2,
  },
  timelineLineDone: {
    backgroundColor: '#1E7A46',
  },
  timelineLineUpcoming: {
    backgroundColor: '#E5EAE7',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: '#8E9E94',
  },
  timelineLabelDone: {
    ...FONTS.muktaBold,
    color: '#17251E',
  },
  timelineTime: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#8E9E94',
    marginTop: 2,
  },

  /* Delivery Partner Card */
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#17251E',
  },
  partnerRole: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#8E9E94',
    marginTop: 2,
  },
  callPartnerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E7A46',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Action Cards (View Order Summary, Help) */
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#17251E',
  },
  actionSub: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#8E9E94',
    marginTop: 2,
  },

  /* Expandable Summary */
  summaryContainer: {
    marginBottom: 8,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  itemsHeader: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#8E9E94',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImg: { width: 30, height: 30 },
  itemInfo: { flex: 1 },
  itemName: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    color: '#17251E',
  },
  itemQty: {
    ...FONTS.muktaRegular,
    fontSize: 12,
    color: '#8E9E94',
    marginTop: 2,
  },
  itemPrice: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#17251E',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    gap: 12,
  },
  sectionLabel: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#8E9E94',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailText: { flex: 1 },
  detailTitle: {
    ...FONTS.muktaBold,
    fontSize: 12,
    color: '#17251E',
  },
  detailSub: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
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
    color: '#374151',
  },
  billVal: {
    ...FONTS.muktaBold,
    fontSize: 14,
    color: '#17251E',
  },
  savingsVal: { color: '#1E7A46' },
  freeVal: { color: '#1E7A46', ...FONTS.muktaBold },
  billDivider: {
    height: 1,
    backgroundColor: '#F0F4F1',
    marginVertical: 8,
  },
  billTotalLabel: {
    ...FONTS.muktaBold,
    fontSize: 15,
    color: '#17251E',
  },
  billTotalVal: {
    ...FONTS.muktaBold,
    fontSize: 18,
    color: '#17251E',
  },
});
