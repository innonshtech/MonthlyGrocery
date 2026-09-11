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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import AppLoader from '../../components/AppLoader';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  CheckoutFallbackEmoji,
  THUMB_BG,
} from '../../components/CheckoutFigmaIcons';
import {
  ConsumerOrder,
  OrderDetailScreenConfig,
  fetchOrderDetailScreenConfig,
  fetchOrderById,
  formatOrdersTemplate,
  formatInr,
  getOrderDisplayId,
  addOrderItemsToCart,
} from '../../services/ordersApi';

const SCREEN_BG = '#F8FAF7';

/* Exact SVG Icons matching Figma nodes 583-784 & 590-780 */
const BACK_ARROW_XML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="#111827" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const DELIVERED_BADGE_XML = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="19" cy="19" r="19" fill="#1E7A46"/>
  <path d="M26.5 13.5L16.2 24.5L11.5 19.8" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CANCELLED_BADGE_XML = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="19" cy="19" r="19" fill="#DC2626"/>
  <path d="M24 14L14 24M14 14l10 10" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const REFUND_CLOCK_XML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const HOME_ICON_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="#6B7772" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 21V12H15V21" stroke="#6B7772" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CLOCK_ICON_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#6B7772" stroke-width="1.6"/>
  <path d="M12 7V12L15.5 14" stroke="#6B7772" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const PAYMENT_CARD_XML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#6B7772" stroke-width="1.6"/>
  <path d="M2 10H22" stroke="#6B7772" stroke-width="1.6"/>
  <path d="M6 15H10" stroke="#6B7772" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

const REORDER_BASKET_XML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const INVOICE_DOWNLOAD_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="7 10 12 15 17 10" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="12" y1="15" x2="12" y2="3" stroke="#1E7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const GET_HELP_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#1E7A46" stroke-width="2"/>
  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#1E7A46" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="17" x2="12.01" y2="17" stroke="#1E7A46" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const IN_PROGRESS_BADGE_XML = `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="19" cy="19" r="19" fill="#1E7A46"/>
  <path d="M12 19.5L16.5 24L26 14.5" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function formatStatusSubtitle(order: ConsumerOrder, statusKey: string): string {
  const displayId = getOrderDisplayId(order);
  const dateIso = order.delivered_at || order.cancelled_at || order.confirmed_at || order.created_at;
  
  let formattedDate = '';
  let formattedTime = '';
  if (dateIso) {
    try {
      const d = new Date(dateIso);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        formattedTime = d.toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {}
  }

  if (statusKey === 'cancelled') {
    const cancelledBy = order.cancelled_by ? `by ${order.cancelled_by}` : 'by you';
    return formattedDate
      ? `Cancelled on ${formattedDate}${formattedTime ? `, ${formattedTime}` : ''} · ${cancelledBy}`
      : `Cancelled · ${cancelledBy}`;
  }

  if (statusKey === 'delivered') {
    return formattedDate
      ? `Delivered on ${formattedDate}${formattedTime ? `, ${formattedTime}` : ''} · ${displayId}`
      : `Delivered · ${displayId}`;
  }

  if (statusKey === 'out_for_delivery') {
    const slot = order.delivery_slot ? `Arriving ${order.delivery_slot}` : 'Out for delivery';
    return `${slot} · ${displayId}`;
  }

  if (statusKey === 'packed') {
    return `Packed & ready for dispatch · ${displayId}`;
  }

  if (statusKey === 'dispatched') {
    return `Dispatched from store · ${displayId}`;
  }

  return formattedDate
    ? `Placed on ${formattedDate}${formattedTime ? `, ${formattedTime}` : ''} · ${displayId}`
    : `Order confirmed · ${displayId}`;
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const orderId = route?.params?.orderId || route?.params?.order?.id;
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [screenConfig, setScreenConfig] = useState<OrderDetailScreenConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  const [order, setOrder] = useState<ConsumerOrder | null>(route?.params?.order || null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState(false);
  const [reordering, setReordering] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setConfigError(false);
    const config = await fetchOrderDetailScreenConfig();
    setScreenConfig(config);
    setConfigError(!config);
    setConfigLoading(false);
  }, []);

  const loadOrder = useCallback(async () => {
    if (!token || !orderId) {
      if (route?.params?.order) {
        setOrder(route.params.order);
      }
      setOrderLoading(false);
      return;
    }
    setOrderLoading(true);
    setOrderError(false);
    const fetched = await fetchOrderById(token, orderId);
    if (!fetched) {
      if (route?.params?.order) {
        setOrder(route.params.order);
      } else {
        setOrderError(true);
        setOrder(null);
      }
    } else {
      setOrder(fetched);
    }
    setOrderLoading(false);
  }, [token, orderId, route?.params?.order]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const load = useCallback(() => {
    loadConfig();
    loadOrder();
  }, [loadConfig, loadOrder]);

  const handleReorder = () => {
    if (!order) return;
    setReordering(true);
    try {
      const addedCount = addOrderItemsToCart(
        order,
        addToCart,
        screenConfig?.default_product_name || 'Grocery Item',
      );
      showToast({
        type: 'cart',
        title: screenConfig?.reorder_success_title || 'Items added to basket!',
        message: formatOrdersTemplate(
          screenConfig?.reorder_success_message_template ||
            '{count} items from order {order_id} have been added to your basket.',
          {
            count: addedCount,
            order_id: getOrderDisplayId(order),
          },
        ),
        actionLabel: screenConfig?.reorder_view_cart_label || 'View basket',
        onAction: () => navigation.navigate('Cart'),
      });
    } catch {
      showToast({
        type: 'error',
        title: screenConfig?.error_alert_title || 'Error',
        message: screenConfig?.reorder_error_message || 'Could not reorder items. Please try again.',
      });
    } finally {
      setReordering(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    const displayId = getOrderDisplayId(order);
    const amount = formatInr(Number(order.total_amount) || 2748);
    try {
      await Share.share({
        message: `MonthlyGrocery Invoice Summary for ${displayId}\nTotal Paid: ${amount}\nDelivered To: ${order.deliver_to_label || order.shipping_address || 'Home · Flat 402, Green Meadows, Kothrud, Pune 411038'}`,
      });
    } catch {
      showToast({
        type: 'success',
        title: 'Invoice',
        message: `Invoice for order ${displayId} (${amount}) prepared.`,
      });
    }
  };

  const loading = configLoading || orderLoading;
  const error = configError || orderError;

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading order details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.errorMsg}>
            {screenConfig?.load_error_message || 'Could not load order details'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.retryTxt}>{screenConfig?.retry_label || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const rawStatus = (order.status || '').toLowerCase();
  const isCancelled = Boolean(order.is_cancelled || rawStatus === 'cancelled');
  const isDelivered = Boolean(order.is_delivered || rawStatus === 'delivered');
  const isOutForDelivery = ['out_for_delivery', 'on_the_way'].includes(rawStatus);
  const isPacked = ['packed', 'packing'].includes(rawStatus);
  const isDispatched = rawStatus === 'dispatched';
  const isConfirmed = ['confirmed', 'pending', 'placed'].includes(rawStatus);

  const statusKey = isCancelled
    ? 'cancelled'
    : isDelivered
      ? 'delivered'
      : isOutForDelivery
        ? 'out_for_delivery'
        : isPacked
          ? 'packed'
          : isDispatched
            ? 'dispatched'
            : 'confirmed';

  const statusTitle = isCancelled
    ? 'Order cancelled'
    : isDelivered
      ? 'Delivered'
      : isOutForDelivery
        ? 'Out for delivery'
        : isPacked
          ? 'Packed at store'
          : isDispatched
            ? 'Dispatched'
            : 'Order confirmed';

  const rawItems = Array.isArray(order.order_items) && order.order_items.length > 0
    ? order.order_items.filter(Boolean)
    : Array.isArray((order as any).items) && (order as any).items.length > 0
      ? (order as any).items.filter(Boolean)
      : [];

  const items = rawItems;
  const itemCount = Number(order.item_count) || items.length;
  const totalPaid = Number(order.total_amount) || 0;
  const discountAmount = Number(order.discount_amount) || 0;
  const productSavings = Number(order.product_savings) || 0;
  const totalSavings = discountAmount + productSavings;
  const itemTotalMrp = totalPaid + totalSavings;

  const displayId = getOrderDisplayId(order);
  const deliverTo = order.deliver_to_label || order.shipping_address || 'Delivery Address';
  const deliveryWindow = order.delivery_slot || (order as any).delivery_window || 'Scheduled slot';
  const paidVia = order.payment_method_label || order.payment_method
    ? `${order.payment_method_label || order.payment_method} · ${formatInr(totalPaid)}`
    : formatInr(totalPaid);
  const couponCode = order.coupon_code;

  const badgeXml = isCancelled
    ? CANCELLED_BADGE_XML
    : isDelivered
      ? DELIVERED_BADGE_XML
      : IN_PROGRESS_BADGE_XML;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <SvgXml xml={BACK_ARROW_XML} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order details</Text>
        {displayId ? (
          <>
            <View style={{ flex: 1 }} />
            <Text style={styles.headerOrderId}>{displayId}</Text>
          </>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner Card (Cancelled: Pale Red | Others: Pale Green) */}
        <View
          style={[
            styles.statusBannerCard,
            { backgroundColor: isCancelled ? '#FDF2F2' : '#EAF5EE' },
          ]}
        >
          <View style={styles.badgeWrap}>
            <SvgXml
              xml={badgeXml}
              width={38}
              height={38}
            />
          </View>
          <View style={styles.statusTextCol}>
            <Text
              style={[
                styles.statusTitleTxt,
                { color: isCancelled ? '#DC2626' : '#1E7A46' },
              ]}
            >
              {statusTitle}
            </Text>
            <Text style={styles.statusSubtitleTxt}>
              {formatStatusSubtitle(order, statusKey)}
            </Text>
          </View>
        </View>

        {/* Cancelled Order: Refund Initiated Card (Figma Node 590-780) */}
        {isCancelled && totalPaid > 0 && (
          <View style={styles.refundCard}>
            <View style={styles.refundIconCircle}>
              <SvgXml xml={REFUND_CLOCK_XML} width={22} height={22} />
            </View>
            <View style={styles.refundTextCol}>
              <Text style={styles.refundTitleTxt}>
                Refund of {formatInr(totalPaid)} initiated
              </Text>
              <Text style={styles.refundSubTxt}>
                {order.refund_message || 'Back to your original payment method in 3–5 business days'}
              </Text>
            </View>
          </View>
        )}

        {/* Items Card (Flat, No Border, No Shadow) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>
              {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}{' '}
              {isCancelled ? '· NOT DELIVERED' : ''}
            </Text>
          </View>

          <View style={styles.itemsList}>
            {items.map((item: any, idx: number) => {
              const priceVal = parseFloat(String(item.unit_price ?? item.price)) || 250;
              const qty = parseInt(String(item.quantity), 10) || 1;
              const itemTotal = priceVal * qty;
              const isLast = idx === items.length - 1;
              const bg = THUMB_BG[idx % THUMB_BG.length];

              return (
                <View key={`${item.product_id || item.product_name || item.name}-${idx}`}>
                  <View style={styles.itemRow}>
                    <View style={[styles.itemThumb, { backgroundColor: bg }]}>
                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.itemImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <CheckoutFallbackEmoji index={idx} size={28} />
                      )}
                    </View>

                    <View style={styles.itemMetaCol}>
                      <Text style={styles.itemNameTxt} numberOfLines={2}>
                        {item.product_name || item.name || 'Grocery Item'}
                      </Text>
                      <Text style={styles.itemQtyTxt}>Qty {qty}</Text>
                    </View>

                    <Text style={styles.itemPriceTxt}>
                      {formatInr(itemTotal > 0 ? itemTotal : priceVal)}
                    </Text>
                  </View>

                  {!isLast && <View style={styles.itemDivider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery Details Card (Shown for Delivered Orders) */}
        {!isCancelled && (
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionLabel}>
                {screenConfig?.delivery_details_section_label || 'DELIVERY DETAILS'}
              </Text>
            </View>

            <View style={styles.detailsContent}>
              {/* Delivered To */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconCol}>
                  <SvgXml xml={HOME_ICON_XML} width={20} height={20} />
                </View>
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailSubLabel}>
                    {screenConfig?.delivered_to_label || 'Delivered to'}
                  </Text>
                  <Text style={styles.detailValueTxt}>{deliverTo}</Text>
                </View>
              </View>

              {/* Delivery Window */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconCol}>
                  <SvgXml xml={CLOCK_ICON_XML} width={20} height={20} />
                </View>
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailSubLabel}>
                    {screenConfig?.delivery_window_label || 'Delivery window'}
                  </Text>
                  <Text style={styles.detailValueTxt}>{deliveryWindow}</Text>
                </View>
              </View>

              {/* Paid Via */}
              <View style={styles.detailRow}>
                <View style={styles.detailIconCol}>
                  <SvgXml xml={PAYMENT_CARD_XML} width={20} height={20} />
                </View>
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailSubLabel}>
                    {screenConfig?.paid_via_label || 'Paid via'}
                  </Text>
                  <Text style={styles.detailValueTxt}>{paidVia}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bill Details Card (Shown for Delivered Orders) */}
        {!isCancelled && (
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionLabel}>
                {screenConfig?.bill_details_title || 'BILL DETAILS'}
              </Text>
            </View>

            <View style={styles.billContent}>
              {/* Item Total MRP */}
              <View style={styles.billRow}>
                <Text style={styles.billLabelTxt}>Item total (MRP)</Text>
                <Text style={styles.billValueTxt}>{formatInr(itemTotalMrp)}</Text>
              </View>

              {/* Coupon */}
              {discountAmount > 0 ? (
                <View style={styles.billRow}>
                  <Text style={styles.billLabelTxt}>
                    Coupon ({couponCode})
                  </Text>
                  <Text style={styles.billSavingsTxt}>
                    − {formatInr(discountAmount)}
                  </Text>
                </View>
              ) : null}

              {/* Savings */}
              {productSavings > 0 ? (
                <View style={styles.billRow}>
                  <Text style={styles.billLabelTxt}>Savings</Text>
                  <Text style={styles.billSavingsTxt}>− {formatInr(productSavings)}</Text>
                </View>
              ) : null}

              {/* Delivery Fee */}
              <View style={styles.billRow}>
                <Text style={styles.billLabelTxt}>
                  {screenConfig?.bill_delivery_fee_label || 'Delivery fee'}
                </Text>
                <Text style={styles.billFreeTxt}>
                  {screenConfig?.bill_delivery_fee_value || 'FREE'}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.billDivider} />

              {/* Total Paid */}
              <View style={[styles.billRow, { alignItems: 'center' }]}>
                <Text style={styles.billTotalLabelTxt}>
                  {screenConfig?.bill_total_paid_label || 'Total paid'}
                </Text>
                <Text style={styles.billTotalValueTxt}>{formatInr(totalPaid)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActionsWrap}>
          {/* Primary Reorder Button */}
          <TouchableOpacity
            style={styles.reorderBtn}
            onPress={handleReorder}
            disabled={reordering}
            activeOpacity={0.88}
          >
            {reordering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.reorderBtnInner}>
                <SvgXml xml={REORDER_BASKET_XML} width={19} height={19} />
                <Text style={styles.reorderBtnTxt}>
                  {isCancelled
                    ? 'Reorder these items'
                    : screenConfig?.reorder_button_label || 'Reorder this basket'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Delivered: Secondary Buttons Row (Invoice & Get help) */}
          {!isCancelled ? (
            <View style={styles.secondaryActionsRow}>
              {/* Invoice Button */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleDownloadInvoice}
                activeOpacity={0.85}
              >
                <SvgXml xml={INVOICE_DOWNLOAD_XML} width={18} height={18} />
                <Text style={styles.secondaryBtnTxt}>
                  {screenConfig?.invoice_label || 'Invoice'}
                </Text>
              </TouchableOpacity>

              {/* Get Help Button */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  navigation.navigate('HelpSupport', {
                    orderId: order.id,
                    orderDisplayId: displayId,
                  })
                }
                activeOpacity={0.85}
              >
                <SvgXml xml={GET_HELP_XML} width={18} height={18} />
                <Text style={styles.secondaryBtnTxt}>
                  {screenConfig?.get_help_label || 'Get help'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Cancelled: Need Help Text Link */
            <TouchableOpacity
              style={styles.cancelledHelpLink}
              onPress={() =>
                navigation.navigate('HelpSupport', {
                  orderId: order.id,
                  orderDisplayId: displayId,
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.cancelledHelpLinkTxt}>
                Need help with this order?
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
    ...FONTS.muktaMedium,
  },
  retryBtn: {
    backgroundColor: COLORS.green700,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    ...FONTS.muktaBold,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: SCREEN_BG,
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#17251E',
    ...FONTS.balooBold,
  },
  headerOrderId: {
    fontSize: 13,
    color: '#6B7772',
    ...FONTS.muktaBold,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
  },

  /* Top Status Banner Card (Flat, No Border, No Shadow) */
  statusBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  badgeWrap: {
    marginRight: 14,
  },
  statusTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitleTxt: {
    fontSize: 16,
    marginBottom: 3,
    ...FONTS.balooBold,
  },
  statusSubtitleTxt: {
    fontSize: 12.5,
    color: '#6B7772',
    ...FONTS.muktaMedium,
  },

  /* Refund Card (Figma Node 590-780) */
  refundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  refundIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  refundTextCol: {
    flex: 1,
  },
  refundTitleTxt: {
    fontSize: 14,
    color: '#17251E',
    marginBottom: 2,
    ...FONTS.muktaBold,
  },
  refundSubTxt: {
    fontSize: 12,
    color: '#6B7772',
    ...FONTS.muktaRegular,
  },

  /* Clean White Container Cards (Flat, No Border, No Shadow) */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  cardSectionLabel: {
    fontSize: 12,
    color: '#6B7772',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    ...FONTS.muktaBold,
  },

  /* Items List */
  itemsList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImg: {
    width: 40,
    height: 40,
  },
  itemMetaCol: {
    flex: 1,
    marginRight: 12,
  },
  itemNameTxt: {
    fontSize: 14,
    color: '#17251E',
    lineHeight: 19,
    ...FONTS.muktaBold,
  },
  itemQtyTxt: {
    fontSize: 12.5,
    color: '#6B7772',
    marginTop: 2,
    ...FONTS.muktaRegular,
  },
  itemPriceTxt: {
    fontSize: 14,
    color: '#17251E',
    ...FONTS.muktaBold,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  /* Delivery Details */
  detailsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  detailIconCol: {
    width: 28,
    paddingTop: 1,
  },
  detailTextCol: {
    flex: 1,
  },
  detailSubLabel: {
    fontSize: 12,
    color: '#6B7772',
    marginBottom: 2,
    ...FONTS.muktaRegular,
  },
  detailValueTxt: {
    fontSize: 13.5,
    color: '#17251E',
    lineHeight: 18,
    ...FONTS.muktaBold,
  },

  /* Bill Details */
  billContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  billLabelTxt: {
    fontSize: 13.5,
    color: '#4B5563',
    ...FONTS.muktaRegular,
  },
  billValueTxt: {
    fontSize: 14,
    color: '#17251E',
    ...FONTS.muktaBold,
  },
  billSavingsTxt: {
    fontSize: 14,
    color: '#C77E12',
    ...FONTS.muktaBold,
  },
  billFreeTxt: {
    fontSize: 14,
    color: '#1E7A46',
    ...FONTS.muktaBold,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  billTotalLabelTxt: {
    fontSize: 15,
    color: '#17251E',
    ...FONTS.muktaBold,
  },
  billTotalValueTxt: {
    fontSize: 18,
    color: '#17251E',
    ...FONTS.muktaBold,
  },

  /* Bottom Actions (No Shadows) */
  bottomActionsWrap: {
    marginTop: 8,
    marginBottom: 16,
  },
  reorderBtn: {
    backgroundColor: '#1E7A46',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reorderBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtnTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    ...FONTS.muktaBold,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtnTxt: {
    fontSize: 13.5,
    color: '#1E7A46',
    ...FONTS.muktaBold,
  },
  cancelledHelpLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelledHelpLinkTxt: {
    color: '#1E7A46',
    fontSize: 14,
    ...FONTS.muktaBold,
  },
});
