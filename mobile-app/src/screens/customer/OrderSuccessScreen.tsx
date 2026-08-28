import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
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

const SCREEN_BG = '#FBFAF6';

const formatInr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

type OrderSummary = {
  orderId: string;
  total: number;
  savings: number;
  arriving: string;
  deliverTo: string;
  paymentMethod: string;
  orderItems: any[];
};

function mapApiOrder(order: any): OrderSummary {
  return {
    orderId: getOrderDisplayId({ display_id: order.display_id, id: order.id }),
    total: Number(order.total_amount) || 0,
    savings: Number(order.total_savings) ||
      Number(order.product_savings || 0) + Number(order.discount_amount || 0),
    arriving: order.delivery_slot || '',
    deliverTo: order.deliver_to_label || order.shipping_address || '',
    paymentMethod: order.payment_method_label || order.payment_method || 'Cash on Delivery',
    orderItems: (order.order_items || []).map((oi: any) => {
      const name = (oi.product_name || oi.name || '').trim();
      return {
        id: oi.product_id || oi.id,
        name,
        price: oi.unit_price || oi.price || 0,
        qty: oi.quantity || oi.qty || 1,
        unit: oi.unit || '1 unit',
      };
    }),
  };
}

export default function OrderSuccessScreen({ route, navigation }: any) {
  const { token } = useAuth();
  const params = route?.params || {};

  const [loading, setLoading] = useState(Boolean(params.backendOrderId || params.orderId));
  const [summary, setSummary] = useState<OrderSummary | null>(
    params.orderId || params.backendOrderId
      ? {
          orderId: getOrderDisplayId({
            display_id: params.orderId,
            id: params.backendOrderId || params.orderId,
          }),
          total: params.total ?? 0,
          savings: params.savings ?? 0,
          arriving:
            params.arriving ||
            (params.deliveryDay && params.deliveryTime
              ? `${params.deliveryDay}, ${params.deliveryTime}`
              : ''),
          deliverTo: params.deliverTo || '',
          paymentMethod: params.paymentMethod || 'Cash on Delivery',
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
          <ActivityIndicator size="large" color={COLORS.green700} />
          <Text style={styles.loadingText}>Loading order details…</Text>
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
            <SuccessCheckIcon size={52} />
          </View>
          <View style={[styles.confettiDot, styles.dotOrange, { top: 20, left: 6 }]} />
          <View style={[styles.confettiDot, styles.dotGreen, { top: 30, right: 6 }]} />
          <View style={[styles.confettiDot, styles.dotTeal, { bottom: 24, left: 16 }]} />
          <View style={[styles.confettiDot, styles.dotGrey, { bottom: 20, right: 8 }]} />
          <View style={[styles.confettiDot, styles.dotTeal, { top: 2, left: 60 }]} />
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
        </View>

        {summary.savings > 0 && (
          <View style={styles.savingsPill}>
            <SavingsCoinIcon size={16} />
            <Text style={styles.savingsPillTxt}>
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

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
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
  loadingText: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink500,
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
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 16,
  },
  badgeWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  successIconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.green700,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.green900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  confettiDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  dotOrange: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.marigold500,
  },
  dotGreen: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.green600,
  },
  dotTeal: {
    width: 7,
    height: 7,
    backgroundColor: COLORS.green500,
  },
  dotGrey: {
    width: 9,
    height: 9,
    backgroundColor: COLORS.ink300,
  },
  titleBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  successTitle: {
    ...FONTS.balooBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.26,
    color: COLORS.ink900,
    textAlign: 'center',
  },
  successSubtitle: {
    ...FONTS.muktaRegular,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.ink500,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink500,
  },
  detailVal: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
    textAlign: 'right',
    flexShrink: 1,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.marigold100,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  savingsPillTxt: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.marigold700,
  },
  basketCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.green100,
    borderWidth: 1.5,
    borderColor: '#CDE9D6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  basketIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: COLORS.green700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketTextCol: {
    flex: 1,
    gap: 2,
  },
  basketTitle: {
    ...FONTS.muktaMedium,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink900,
  },
  basketSub: {
    ...FONTS.muktaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.ink700,
  },
  saveBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: COLORS.surface,
  },
  saveBtnDone: {
    borderColor: COLORS.ink300,
    backgroundColor: COLORS.muted,
  },
  saveBtnTxt: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.green700,
  },
  saveBtnTxtDone: {
    color: COLORS.ink500,
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 4,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 49,
  },
  trackBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  continueBtn: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  continueBtnText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.green700,
  },
});
