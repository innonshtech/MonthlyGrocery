import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BellRing, MapPin, X, Check, ArrowRight } from 'lucide-react-native';

interface TopOrderNotificationBannerProps {
  order: any | null;
  onAccept: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  onDismiss: () => void;
  accepting?: boolean;
}

export default function TopOrderNotificationBanner({
  order,
  onAccept,
  onViewDetails,
  onDismiss,
  accepting = false,
}: TopOrderNotificationBannerProps) {
  const slideAnim = useRef(new Animated.Value(-160)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<any>(null);

  useEffect(() => {
    if (order) {
      // Stop any previous running animations before resetting
      slideAnim.stopAnimation(() => {
        opacityAnim.stopAnimation(() => {
          slideAnim.setValue(-160);
          opacityAnim.setValue(0);

          // Animate in from top smoothly
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: Platform.OS === 'android' ? 12 : 44,
              useNativeDriver: true,
              bounciness: 4,
              speed: 14,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });

      // Auto-dismiss after 10 seconds if not interacted with
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        handleDismissWithAnim();
      }, 10000);

      return () => {
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        slideAnim.stopAnimation();
        opacityAnim.stopAnimation();
      };
    } else {
      slideAnim.stopAnimation(() => {
        opacityAnim.stopAnimation(() => {
          slideAnim.setValue(-160);
          opacityAnim.setValue(0);
        });
      });
    }
  }, [order]);

  const handleDismissWithAnim = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    slideAnim.stopAnimation(() => {
      opacityAnim.stopAnimation(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -160,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss?.();
        });
      });
    });
  };

  if (!order) return null;

  let orderId = '#NEW-ORDER';
  try {
    if (order.display_id) {
      orderId = String(order.display_id).startsWith('#') ? String(order.display_id) : `#${order.display_id}`;
    } else if (order.id) {
      orderId = `#MG${String(order.id).slice(-5).toUpperCase()}`;
    }
  } catch (e) {
    orderId = '#NEW-ORDER';
  }

  const customerName = order?.profiles?.name || order?.consumer_name || 'Customer';
  const itemsCount = order?.order_items?.length || (Array.isArray(order?.items) ? order.items.length : 1);
  const totalAmount = order?.total_amount != null ? `₹${Math.round(Number(order.total_amount))}` : '₹0';
  const deliveryAddress = order?.delivery_address || order?.shipping_address || 'Customer Address';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.bannerContainer}>
        {/* Top Header Row with Lucide Bell Icon & Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconBadge}
            activeOpacity={0.8}
            onPress={() => {
              if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
              onViewDetails?.(order?.id || '');
            }}
          >
            <BellRing size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerTextGroup}
            activeOpacity={0.8}
            onPress={() => {
              if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
              onViewDetails?.(order?.id || '');
            }}
          >
            <View style={styles.badgeLine}>
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>NEW ORDER</Text>
              </View>
              <Text style={styles.orderIdText}>{orderId}</Text>
              <Text style={styles.justNowText}>• Just now</Text>
            </View>
            <Text style={styles.customerSummary} numberOfLines={1}>
              {customerName} · <Text style={styles.amountText}>{totalAmount}</Text> ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
            </Text>
          </TouchableOpacity>

          {/* Close button with Lucide X */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismissWithAnim}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={15} color="#CBD5E1" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Address snippet if available with Lucide MapPin */}
        {deliveryAddress ? (
          <View style={styles.addressRow}>
            <MapPin size={12} color="#94A3B8" strokeWidth={2} style={{ marginRight: 4, marginTop: 1 }} />
            <Text style={styles.addressSnippet} numberOfLines={1}>
              {deliveryAddress}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => {
              if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
              onViewDetails?.(order?.id || '');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.viewBtnText}>View Details</Text>
            <ArrowRight size={13} color="#F1F5F9" strokeWidth={2.2} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptBtn, accepting && styles.acceptBtnDisabled]}
            onPress={() => {
              if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
              onAccept?.(order?.id || '');
            }}
            disabled={accepting}
            activeOpacity={0.85}
          >
            <Check size={15} color="#FFFFFF" strokeWidth={2.6} style={{ marginRight: 4 }} />
            <Text style={styles.acceptBtnText}>
              {accepting ? 'Accepting...' : 'Accept Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  bannerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newPill: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  newPillText: {
    color: '#0F172A',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderIdText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  justNowText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  customerSummary: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  amountText: {
    color: '#4ADE80',
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
  },
  addressSnippet: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 11.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1.4,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptBtnDisabled: {
    opacity: 0.6,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
