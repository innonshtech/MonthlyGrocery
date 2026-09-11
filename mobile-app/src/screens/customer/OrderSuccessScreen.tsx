import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import AppLoader from '../../components/AppLoader';
import { API_BASE } from '../../config/api';
import { COLORS, FONTS } from '../../constants/theme';
import { getOrderDisplayId } from '../../services/ordersApi';
import {
  basketFromOrderItems,
  loadSavedBaskets,
  persistSavedBaskets,
} from '../../utils/savedBasketsStorage';
import {
  SuccessCheckIcon,
  SavingsCoinIcon,
  BasketSaveIcon,
  TrackTruckIcon,
} from '../../components/CheckoutFigmaIcons';

const SCREEN_BG = '#F8FAF8';

const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

type OrderSummary = {
  orderId: string;
  total: number;
  savings: number;
  arriving: string;
  deliverTo: string;
  paymentMethod: string;
  deliveryOtp?: string | null;
  orderItems: any[];
};

function mapApiOrder(order: any): OrderSummary {
  if (!order) {
    return {
      orderId: '',
      total: 0,
      savings: 0,
      arriving: '',
      deliverTo: '',
      paymentMethod: 'Cash on Delivery',
      deliveryOtp: null,
      orderItems: [],
    };
  }
  const items = Array.isArray(order.order_items) ? order.order_items.filter(Boolean) : [];
  return {
    orderId: getOrderDisplayId({ display_id: order.display_id, id: order.id } as any),
    total: Number(order.total_amount) || 0,
    savings: Number(order.total_savings) ||
      Number(order.product_savings || 0) + Number(order.discount_amount || 0),
    arriving: typeof order.delivery_slot === 'string' ? order.delivery_slot : '',
    deliverTo: order.deliver_to_label || order.shipping_address || '',
    paymentMethod: order.payment_method_label || order.payment_method || 'Cash on Delivery',
    deliveryOtp: order.delivery_otp || null,
    orderItems: items.map((oi: any) => {
      const name = (oi?.product_name || oi?.name || '').trim();
      return {
        id: oi?.product_id || oi?.id || '',
        name,
        price: Number(oi?.unit_price ?? oi?.price) || 0,
        qty: Number(oi?.quantity ?? oi?.qty) || 1,
        unit: oi?.unit || '1 unit',
      };
    }),
  };
}

export default function OrderSuccessScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = route?.params || {};

  const [loading, setLoading] = useState(Boolean(params.backendOrderId || params.orderId));
  const [summary, setSummary] = useState<OrderSummary | null>(
    params.orderId || params.backendOrderId
      ? {
          orderId: getOrderDisplayId({
            display_id: params.orderId,
            id: params.backendOrderId || params.orderId,
          } as any),
          total: params.total ?? 0,
          savings: params.savings ?? 0,
          arriving:
            params.arriving ||
            (params.deliveryDay && params.deliveryTime
              ? `${params.deliveryDay}, ${params.deliveryTime}`
              : ''),
          deliverTo: params.deliverTo || '',
          paymentMethod: params.paymentMethod || 'Cash on Delivery',
          deliveryOtp: params.deliveryOtp || null,
          orderItems: params.orderItems || [],
        }
      : null,
  );

  const [saving, setSaving] = useState(false);
  const [basketSaved, setBasketSaved] = useState(false);

  const loadOrderFromApi = useCallback(async () => {
    const lookupId = params.backendOrderId || params.orderId;
    if (!lookupId || !token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/${lookupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setSummary(mapApiOrder(data.order));
      }
    } catch {
      /* keep navigation params if fetch fails */
    } finally {
      setLoading(false);
    }
  }, [params.backendOrderId, params.orderId, token]);

  useEffect(() => {
    loadOrderFromApi();
  }, [loadOrderFromApi]);

  const handleSaveBasket = async () => {
    if (basketSaved || !summary) return;
    if (!summary.orderItems?.length) {
      Alert.alert('Cannot save', 'Order items are not available to save.');
      return;
    }

    setSaving(true);
    try {
      const month = new Date().toLocaleDateString('en-IN', { month: 'long' });
      const newBasket = basketFromOrderItems(
        `Monthly basket · ${month}`,
        summary.orderItems,
      );
      if (!newBasket) {
        Alert.alert('Cannot save', 'Order items are not available to save.');
        return;
      }
      const list = await loadSavedBaskets();
      await persistSavedBaskets([newBasket, ...list]);
      setBasketSaved(true);
      Alert.alert('Saved', 'This order is saved as your monthly basket.');
    } catch {
      Alert.alert('Error', 'Could not save basket. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <AppLoader message="Loading order details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Order details not found.</Text>
          <TouchableOpacity onPress={() => navigation.replace('Shop')}>
            <Text style={styles.continueBtnText}>Continue shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const paidViaLabel = `${summary.paymentMethod} · ${formatInr(summary.total)}`;
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeWrapper}>
          <View style={styles.successIconCircle}>
            <SuccessCheckIcon size={44} />
          </View>
          <View style={[styles.confettiDot, styles.dotOrange, { top: 12, left: 4 }]} />
          <View style={[styles.confettiDot, styles.dotGreen, { top: 20, right: 4 }]} />
          <View style={[styles.confettiDot, styles.dotYellow, { bottom: 18, left: 10 }]} />
          <View style={[styles.confettiDot, styles.dotTeal, { bottom: 14, right: 8 }]} />
          <View style={[styles.confettiDot, styles.dotOrange, { top: 0, left: 52 }]} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.successTitle}>Order placed!</Text>
          <Text style={styles.successSubtitle}>
            Your monthly grocery is confirmed and on its way.
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailVal}>{summary.orderId}</Text>
          </View>
          {summary.arriving ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Arriving</Text>
              <Text style={styles.detailVal}>{summary.arriving}</Text>
            </View>
          ) : null}
          {summary.deliverTo ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deliver to</Text>
              <Text style={styles.detailVal} numberOfLines={2}>{summary.deliverTo}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid via</Text>
            <Text style={styles.detailVal}>{paidViaLabel}</Text>
          </View>
          {summary.deliveryOtp ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery OTP</Text>
              <Text style={styles.detailValOtp}>{summary.deliveryOtp}</Text>
            </View>
          ) : null}
        </View>

        {summary.savings > 0 && (
          <View style={styles.savingsPill}>
            <SavingsCoinIcon size={16} />
            <Text style={styles.savingsPillTxt} numberOfLines={1}>
              You saved {formatInr(summary.savings)} on this order
            </Text>
          </View>
        )}

        <View style={styles.basketCard}>
          <View style={styles.basketIconBox}>
            <BasketSaveIcon size={20} />
          </View>
          <View style={styles.basketTextCol}>
            <Text style={styles.basketTitle}>Make this your monthly basket</Text>
            <Text style={styles.basketSub}>Reorder everything in one tap next month</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, basketSaved && styles.saveBtnDone]}
            onPress={handleSaveBasket}
            disabled={saving || basketSaved}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnTxt, basketSaved && styles.saveBtnTxtDone]}>
              {basketSaved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.replace('Orders')}
          activeOpacity={0.85}
        >
          <TrackTruckIcon size={18} />
          <Text style={styles.trackBtnText}>Track order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.replace('Shop')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Continue shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink700,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  badgeWrapper: {
    width: 114,
    height: 114,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E7A46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  dotOrange: {
    width: 9,
    height: 9,
    backgroundColor: '#F59E0B',
  },
  dotGreen: {
    width: 8,
    height: 8,
    backgroundColor: '#22C55E',
  },
  dotTeal: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
  },
  dotYellow: {
    width: 8,
    height: 8,
    backgroundColor: '#FBBF24',
  },
  titleBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    ...FONTS.muktaBold,
    fontSize: 24,
    lineHeight: 30,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    ...FONTS.muktaRegular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  detailVal: {
    ...FONTS.muktaBold,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#111827',
    textAlign: 'right',
    flexShrink: 1,
  },
  detailValOtp: {
    ...FONTS.balooBold,
    fontSize: 16,
    color: '#925700',
    backgroundColor: '#FEF3DD',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 1.5,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FDF0DC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 2,
    marginBottom: 16,
    alignSelf: 'center',
  },
  savingsPillTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#8A5200',
    flexShrink: 0,
  },
  basketCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EAF5EE',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D4ECD9',
  },
  basketIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E7A46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketTextCol: {
    flex: 1,
    gap: 2,
  },
  basketTitle: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#111827',
  },
  basketSub: {
    ...FONTS.muktaRegular,
    fontSize: 12.5,
    lineHeight: 16,
    color: '#475569',
    marginTop: 2,
  },
  saveBtn: {
    borderWidth: 1.5,
    borderColor: '#1E7A46',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  saveBtnDone: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F2',
  },
  saveBtnTxt: {
    ...FONTS.muktaBold,
    fontSize: 13,
    color: '#1E7A46',
  },
  saveBtnTxtDone: {
    color: '#64748B',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E7A46',
    borderRadius: 16,
    height: 52,
    width: '100%',
  },
  trackBtnText: {
    ...FONTS.muktaBold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  continueBtnText: {
    ...FONTS.muktaBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#1E7A46',
  },
});
