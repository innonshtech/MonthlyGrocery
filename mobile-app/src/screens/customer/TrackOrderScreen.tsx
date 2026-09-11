import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import AppLoader from '../../components/AppLoader';
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
  getTimelineStepLabel,
  cancelOrder,
  canConsumerCancelOrder,
} from '../../services/ordersApi';

const SCREEN_BG = '#F8FAF7';

/* Exact SVG Icons matching Figma node 578-779 */
const BACK_ARROW_XML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 19l-7-7 7-7" stroke="#17251E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const TRUCK_GRAPHIC_XML = `<svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 5H18V20H2V5ZM18 9H23L26 13V20H18V9Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="7" cy="22.5" r="2.5" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="21" cy="22.5" r="2.5" stroke="#FFFFFF" stroke-width="2"/>
</svg>`;

const TIMELINE_CHECK_XML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 3L4.5 8.5L2 6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const DRIVER_USER_XML = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11 11C13.2091 11 15 9.20914 15 7C15 4.79086 13.2091 3 11 3C8.79086 3 7 4.79086 7 7C7 9.20914 8.79086 11 11 11Z" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3.5 19C3.5 15.5 6.5 14 11 14C15.5 14 18.5 15.5 18.5 19" stroke="#1E7A46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const PHONE_WHITE_XML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4741 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5902 20.9046 21.7335 20.6407 21.8228C20.3769 21.912 20.0974 21.9452 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19 12.85C3.49997 10.2412 2.44824 7.27099 2.12 4.18C2.095 3.90347 2.12787 3.62479 2.21658 3.36162C2.30529 3.09845 2.44787 2.85669 2.63522 2.65162C2.82257 2.44655 3.05048 2.28271 3.30419 2.17066C3.55791 2.05861 3.83177 2.00085 4.11 2H7.11C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.8 9.04207 3.23945 9.11 3.72C9.23662 4.68007 9.47144 5.62273 9.81 6.53C9.94454 6.88792 9.97366 7.27689 9.8939 7.65089C9.81415 8.02488 9.62886 8.36811 9.36 8.64L8.09 9.91C9.51355 12.4135 11.5865 14.4865 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7657 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4297 22 16.92Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const RECEIPT_ICON_XML = `<svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18.3333 19.25L15.5833 17.4167L12.8333 19.25L10.0833 17.4167L7.33333 19.25L4.58333 17.4167L1.83333 19.25V2.75L4.58333 4.58333L7.33333 2.75L10.0833 4.58333L12.8333 2.75L15.5833 4.58333L18.3333 2.75V19.25Z" stroke="#1E7A46" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6.41667 8.25H13.75M6.41667 12.8333H11" stroke="#1E7A46" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const HELP_QUESTION_XML = `<svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="11" r="9" stroke="#1E7A46" stroke-width="1.6"/>
  <path d="M8.5 8.5C8.5 7.11929 9.61929 6 11 6C12.3807 6 13.5 7.11929 13.5 8.5C13.5 9.88071 11 11 11 12.5" stroke="#1E7A46" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="11" cy="15.5" r="0.75" fill="#1E7A46"/>
</svg>`;

const CHEVRON_RIGHT_XML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.75 13.5L11.25 9L6.75 4.5" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function formatTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export default function TrackOrderScreen({ route, navigation }: any) {
  const { token } = useAuth();
  const orderId = route?.params?.orderId || route?.params?.order?.id;

  const [screenConfig, setScreenConfig] = useState<OrderDetailScreenConfig | null>(null);
  const [order, setOrder] = useState<ConsumerOrder | null>(route?.params?.order || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const config = await fetchOrderDetailScreenConfig();
    setScreenConfig(config);
    if (!token || !orderId) {
      if (route?.params?.order) {
        setOrder(route.params.order);
        setLoading(false);
        return;
      }
      setError(true);
      setLoading(false);
      return;
    }
    const fetched = await fetchOrderById(token, orderId);
    if (!fetched) {
      if (route?.params?.order) {
        setOrder(route.params.order);
      } else {
        setError(true);
      }
    } else {
      setOrder(fetched);
    }
    setLoading(false);
  }, [token, orderId, route?.params?.order]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppLoader message="Loading tracking status..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.errorMsg}>
            {screenConfig?.load_error_message || 'Could not load tracking details'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.retryTxt}>{screenConfig?.retry_label || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const s = (order.status || '').toLowerCase();
  let currentStepIdx = 0;
  if (s === 'delivered') currentStepIdx = 4;
  else if (['out_for_delivery', 'on_the_way'].includes(s)) currentStepIdx = 3;
  else if (s === 'dispatched') currentStepIdx = 2;
  else if (['packed', 'packing'].includes(s)) currentStepIdx = 1;
  else if (['confirmed', 'pending', 'placed'].includes(s)) currentStepIdx = 0;

  const displayId = getOrderDisplayId(order);
  const arrivingSlot = order.delivery_slot || 'Today';

  const heroPill =
    s === 'delivered'
      ? 'DELIVERED'
      : ['out_for_delivery', 'on_the_way'].includes(s)
        ? 'OUT FOR DELIVERY'
        : s === 'dispatched'
          ? 'DISPATCHED'
          : ['packed', 'packing'].includes(s)
            ? 'ORDER PACKED'
            : 'ORDER CONFIRMED';

  const heroTitle =
    s === 'delivered'
      ? 'Delivered to you'
      : order.delivery_slot
        ? `Arriving ${order.delivery_slot}`
        : 'Arriving soon';

  const heroSub =
    s === 'delivered'
      ? 'Your order was successfully delivered'
      : ['out_for_delivery', 'on_the_way'].includes(s)
        ? 'Your whole monthly order, in one trip'
        : s === 'dispatched'
          ? 'On the way to your delivery area'
          : ['packed', 'packing'].includes(s)
            ? 'Packed & ready for dispatch'
            : 'Your whole monthly order is confirmed with the store';

  const rawOtp = String(order.delivery_otp || '').trim();
  const otpDigits = rawOtp.length === 4 ? rawOtp.split('') : null;

  const partnerName =
    order.delivery_partner_name ||
    (order as any).partner_name ||
    'Store Delivery Partner';
  const partnerPhone =
    order.delivery_partner_phone ||
    (order as any).partner_phone ||
    null;

  const items = Array.isArray(order.order_items) ? order.order_items.filter(Boolean) : [];
  const itemCount = Number(order.item_count) || items.length;
  const totalPaid = Number(order.total_amount) || 0;

  const confirmedTime = formatTime(order.confirmed_at || order.created_at);
  const packedTime = formatTime((order as any).packed_at);
  const dispatchedTime = formatTime((order as any).dispatched_at);
  const outTime = formatTime((order as any).out_for_delivery_at);
  const deliveredTime = formatTime((order as any).delivered_at);

  const timelineSteps = [
    {
      title: 'Order confirmed',
      time: confirmedTime || 'Confirmed',
    },
    {
      title: 'Packed at your store',
      time: packedTime || (currentStepIdx >= 1 ? 'Packed' : 'Pending'),
    },
    {
      title: 'Dispatched',
      time: dispatchedTime || (currentStepIdx >= 2 ? 'Dispatched' : 'Pending'),
    },
    {
      title: 'Out for delivery',
      time: outTime || (currentStepIdx >= 3 ? 'On the way' : 'Pending'),
    },
    {
      title: 'Delivered',
      time:
        deliveredTime ||
        (order.delivery_slot
          ? `Expected by ${order.delivery_slot}`
          : 'Pending'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <SvgXml xml={BACK_ARROW_XML} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track order</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerOrderId}>{displayId}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Green Hero Banner (Figma Node 578-779) */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeftCol}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillTxt}>{heroPill}</Text>
            </View>
            <Text style={styles.heroTitleTxt}>{heroTitle}</Text>
            <Text style={styles.heroSubTxt}>{heroSub}</Text>
          </View>
          <View style={styles.heroGraphicCircle}>
            <SvgXml xml={TRUCK_GRAPHIC_XML} width={32} height={32} />
          </View>
        </View>

        {/* Delivery OTP Card (Peach BG, White Digit Boxes) */}
        {otpDigits && (
          <View style={styles.otpCard}>
            <View style={styles.otpTextCol}>
              <Text style={styles.otpLabel}>DELIVERY OTP</Text>
              <Text style={styles.otpSub}>
                Share this with your delivery partner
              </Text>
            </View>
            <View style={styles.otpDigitsRow}>
              {otpDigits.map((digit, idx) => (
                <View key={`otp-${idx}`} style={styles.otpDigitBox}>
                  <Text style={styles.otpDigitTxt}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Vertical Tracking Timeline Card */}
        <View style={styles.timelineCard}>
          {timelineSteps.map((step, idx) => {
            const isDone = idx < currentStepIdx || (currentStepIdx === 4 && idx === 4);
            const isActive = idx === currentStepIdx && currentStepIdx !== 4;
            const isLast = idx === timelineSteps.length - 1;

            return (
              <View key={step.title} style={styles.timelineRow}>
                {/* Node Rail */}
                <View style={styles.railCol}>
                  {isDone ? (
                    <View style={styles.nodeDone}>
                      <SvgXml xml={TIMELINE_CHECK_XML} width={10} height={10} />
                    </View>
                  ) : isActive ? (
                    <View style={styles.nodeActive}>
                      <View style={styles.nodeActiveInner} />
                    </View>
                  ) : (
                    <View style={styles.nodeUpcoming} />
                  )}
                  {!isLast && (
                    <View
                      style={[
                        styles.railLine,
                        isDone ? styles.railLineDone : styles.railLineUpcoming,
                      ]}
                    />
                  )}
                </View>

                {/* Step Info */}
                <View style={styles.stepInfoCol}>
                  <Text
                    style={[
                      styles.stepTitleTxt,
                      (isDone || isActive) && styles.stepTitleDone,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepTimeTxt}>{step.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Partner Card */}
        {(currentStepIdx >= 2 || partnerPhone) && (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatarCircle}>
              <SvgXml xml={DRIVER_USER_XML} width={22} height={22} />
            </View>
            <View style={styles.partnerInfoCol}>
              <Text style={styles.partnerNameTxt}>{partnerName}</Text>
              <Text style={styles.partnerRoleTxt}>Your delivery partner</Text>
            </View>
            {partnerPhone ? (
              <TouchableOpacity
                style={styles.callPartnerBtn}
                onPress={() => {
                  Linking.openURL(`tel:${partnerPhone}`).catch(() => {});
                }}
                activeOpacity={0.85}
              >
                <SvgXml xml={PHONE_WHITE_XML} width={18} height={18} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Action Card 1: View Order Summary */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            navigation.navigate('OrderDetail', { orderId: order.id, order })
          }
          activeOpacity={0.88}
        >
          <View style={styles.actionIconWrap}>
            <SvgXml xml={RECEIPT_ICON_XML} width={20} height={20} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitleTxt}>View order summary</Text>
            <Text style={styles.actionSubTxt}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatInr(totalPaid)}
            </Text>
          </View>
          <SvgXml xml={CHEVRON_RIGHT_XML} width={18} height={18} />
        </TouchableOpacity>

        {/* Action Card 2: Need Help With This Order */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            navigation.navigate('HelpSupport', {
              orderId: order.id,
              orderDisplayId: displayId,
            })
          }
          activeOpacity={0.88}
        >
          <View style={styles.actionIconWrap}>
            <SvgXml xml={HELP_QUESTION_XML} width={20} height={20} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitleTxt}>Need help with this order?</Text>
            <Text style={styles.actionSubTxt}>Chat with support</Text>
          </View>
          <SvgXml xml={CHEVRON_RIGHT_XML} width={18} height={18} />
        </TouchableOpacity>
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

  /* Hero Dark Green Banner */
  heroBanner: {
    backgroundColor: '#155A38',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroLeftCol: {
    flex: 1,
    paddingRight: 12,
  },
  heroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroPillTxt: {
    color: '#FFFFFF',
    fontSize: 10.5,
    letterSpacing: 0.6,
    ...FONTS.muktaBold,
  },
  heroTitleTxt: {
    color: '#FFFFFF',
    fontSize: 19,
    marginBottom: 4,
    ...FONTS.balooBold,
  },
  heroSubTxt: {
    color: '#E4F3EA',
    fontSize: 12.5,
    ...FONTS.muktaRegular,
  },
  heroGraphicCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Delivery OTP Card */
  otpCard: {
    backgroundColor: '#FEF3DD',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  otpTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  otpLabel: {
    fontSize: 11,
    color: '#925700',
    letterSpacing: 0.8,
    marginBottom: 2,
    ...FONTS.muktaBold,
  },
  otpSub: {
    fontSize: 12,
    color: '#78350F',
    ...FONTS.muktaRegular,
  },
  otpDigitsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  otpDigitBox: {
    width: 34,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigitTxt: {
    fontSize: 16,
    color: '#925700',
    ...FONTS.balooBold,
  },

  /* Vertical Tracking Timeline Card */
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  railCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 14,
  },
  nodeDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeActiveInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1E7A46',
  },
  nodeUpcoming: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5EAE7',
    zIndex: 2,
    marginTop: 2,
  },
  railLine: {
    position: 'absolute',
    top: 20,
    bottom: -6,
    width: 2,
    zIndex: 1,
  },
  railLineDone: {
    backgroundColor: '#1E7A46',
  },
  railLineUpcoming: {
    backgroundColor: '#E5EAE7',
  },
  stepInfoCol: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitleTxt: {
    fontSize: 14,
    color: '#8E9E94',
    marginBottom: 2,
    ...FONTS.muktaBold,
  },
  stepTitleDone: {
    color: '#17251E',
  },
  stepTimeTxt: {
    fontSize: 12,
    color: '#6B7772',
    ...FONTS.muktaRegular,
  },

  /* Delivery Partner Card */
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  partnerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerInfoCol: {
    flex: 1,
  },
  partnerNameTxt: {
    fontSize: 14.5,
    color: '#17251E',
    marginBottom: 2,
    ...FONTS.muktaBold,
  },
  partnerRoleTxt: {
    fontSize: 12,
    color: '#6B7772',
    ...FONTS.muktaRegular,
  },
  callPartnerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Action Cards */
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F4F5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitleTxt: {
    fontSize: 14,
    color: '#17251E',
    marginBottom: 2,
    ...FONTS.muktaBold,
  },
  actionSubTxt: {
    fontSize: 12,
    color: '#6B7772',
    ...FONTS.muktaRegular,
  },
});
