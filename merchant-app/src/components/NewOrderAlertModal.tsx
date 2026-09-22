import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';

interface NewOrderAlertModalProps {
  visible: boolean;
  order: any | null;
  onAccept: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  onMuteOrDismiss: () => void;
  accepting?: boolean;
}

export default function NewOrderAlertModal({
  visible,
  order,
  onAccept,
  onViewDetails,
  onMuteOrDismiss,
  accepting = false,
}: NewOrderAlertModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Shake animation for bell
      const shakeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.delay(1000),
        ])
      );
      shakeLoop.start();

      return () => {
        pulseLoop.stop();
        shakeLoop.stop();
      };
    }
  }, [visible, pulseAnim, shakeAnim]);

  if (!visible || !order) return null;

  const orderId = order.display_id
    ? (String(order.display_id).startsWith('#') ? order.display_id : `#${order.display_id}`)
    : (order.id ? `#MG${String(order.id).slice(-5).toUpperCase()}` : '#NEW-ORDER');

  const customerName = order.profiles?.name || order.consumer_name || 'Customer';
  const customerPhone = order.profiles?.phone || order.profiles?.mobile || order.consumer_name;
  const itemsCount = order.order_items?.length || (Array.isArray(order.items) ? order.items.length : 1);
  const totalAmount = order.total_amount ? `₹${Math.round(Number(order.total_amount))}` : '₹0';
  const deliverySlot = order.delivery_slot || 'Today (Scheduled)';
  const distanceKm = order.distance_km != null ? `${Number(order.distance_km).toFixed(1)} km away` : 'Local Area';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onMuteOrDismiss}>
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Glowing Top Banner */}
          <View style={styles.headerBanner}>
            <Animated.View
              style={[
                styles.bellCircle,
                {
                  transform: [
                    { scale: pulseAnim },
                    {
                      rotate: shakeAnim.interpolate({
                        inputRange: [-10, 10],
                        outputRange: ['-12deg', '12deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.bellIcon}>🔔</Text>
            </Animated.View>
            <View style={styles.headerTextCol}>
              <Text style={styles.alertTitle}>NEW ORDER RECEIVED!</Text>
              <Text style={styles.alertSubtitle}>Incoming grocery request · Ringing 🔊</Text>
            </View>
            <TouchableOpacity style={styles.mutePill} onPress={onMuteOrDismiss} activeOpacity={0.8}>
              <Text style={styles.mutePillText}>🔕 Mute</Text>
            </TouchableOpacity>
          </View>

          {/* Order Details Body */}
          <View style={styles.body}>
            {/* Order ID & Price Row */}
            <View style={styles.idPriceRow}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeLabel}>ORDER</Text>
                <Text style={styles.idBadgeValue}>{orderId}</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeLabel}>TOTAL BILL</Text>
                <Text style={styles.priceBadgeValue}>{totalAmount}</Text>
              </View>
            </View>

            {/* Customer & Location Box */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👤</Text>
                <Text style={styles.infoTextBold}>{customerName}</Text>
                {customerPhone ? (
                  <Text style={styles.infoSub}>({String(customerPhone).slice(-10)})</Text>
                ) : null}
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>
                  {order.delivery_address || order.shipping_address || 'Customer Delivery Address'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🛵</Text>
                <Text style={styles.infoText}>
                  Slot: <Text style={styles.slotBold}>{deliverySlot}</Text> · {distanceKm}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📦</Text>
                <Text style={styles.infoText}>
                  <Text style={styles.slotBold}>{itemsCount} Grocery Items</Text> (Cash on Delivery)
                </Text>
              </View>
            </View>

            {/* CTAs */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => onAccept(order.id)}
                disabled={accepting}
                activeOpacity={0.85}
              >
                <Text style={styles.acceptBtnText}>
                  {accepting ? 'Accepting...' : 'Accept Order ✓'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => onViewDetails(order.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailsBtnText}>View Details ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBanner: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bellIcon: {
    fontSize: 22,
  },
  headerTextCol: {
    flex: 1,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mutePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mutePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 18,
  },
  idPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  idBadge: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  idBadgeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  priceBadge: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'flex-end',
  },
  priceBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  priceBadgeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoSub: {
    fontSize: 12,
    color: '#64748B',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
  },
  slotBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1.5,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  detailsBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});
