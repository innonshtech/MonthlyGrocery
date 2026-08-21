import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { API_BASE } from '../../config/api';

export default function OrdersScreen({ navigation }: any) {
  const { token, city, area } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const handleReorder = async (order: any) => {
    setReorderingId(order.id);
    try {
      let url = `${API_BASE}/products/all?limit=300`;
      if (city) url += `&city=${encodeURIComponent(city)}`;
      if (area) url += `&area_name=${encodeURIComponent(area)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert('Error', 'Failed to verify active catalog prices.');
        return;
      }

      const activeProducts = data.products || [];
      const prodMap = new Map<string, any>();
      activeProducts.forEach((p: any) => prodMap.set(p.id, p));

      let addedCount = 0;
      let outOfStockCount = 0;
      let repricedCount = 0;

      for (const item of order.order_items) {
        const activeProd = prodMap.get(item.product_id);
        if (activeProd) {
          if (activeProd.price !== item.unit_price) {
            repricedCount++;
          }
          const qty = parseInt(item.quantity) || 1;
          for (let i = 0; i < qty; i++) {
            addToCart(activeProd);
          }
          addedCount++;
        } else {
          outOfStockCount++;
        }
      }

      if (addedCount === 0) {
        Alert.alert('Unavailable', 'The items in this past order are currently not available in your selected area.');
        return;
      }

      let notice = `Added ${addedCount} item(s) to your cart!`;
      if (outOfStockCount > 0) {
        notice += `\n(${outOfStockCount} item(s) are out of stock and were skipped).`;
      }
      if (repricedCount > 0) {
        notice += `\n(${repricedCount} item(s) had price updates according to today's active store rates).`;
      }

      Alert.alert('Reorder Successful', notice, [
        { text: 'Continue Shopping' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Connection failed while reordering.');
    } finally {
      setReorderingId(null);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/orders/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'; // Amber
      case 'confirmed': return '#3B82F6'; // Blue
      case 'packing': return '#8B5CF6'; // Purple
      case 'out_for_delivery': return '#EC4899'; // Pink
      case 'delivered': return '#22C55E'; // Green
      case 'cancelled': return '#EF4444'; // Red
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.toUpperCase().replace(/_/g, ' ');
  };

  const getStatusIndex = (status: string) => {
    const sequence = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered'];
    return sequence.indexOf(status);
  };

  const renderTimelineStep = (title: string, desc: string, currentStatus: string, stepIndex: number) => {
    const currentIndex = getStatusIndex(currentStatus);
    const isCompleted = currentIndex >= stepIndex;
    const isActive = currentIndex === stepIndex;

    return (
      <View style={styles.timelineStep} key={title}>
        <View style={styles.timelineIndicators}>
          <View style={[
            styles.timelineCircle, 
            isCompleted && styles.timelineCircleCompleted, 
            isActive && styles.timelineCircleActive
          ]}>
            {isCompleted ? <Text style={styles.circleText}>✓</Text> : <Text style={styles.circleTextDot}>•</Text>}
          </View>
          {stepIndex < 4 && (
            <View style={[styles.timelineLine, currentIndex > stepIndex && styles.timelineLineCompleted]} />
          )}
        </View>
        <View style={styles.stepTextContainer}>
          <Text style={[styles.stepTitle, isCompleted && styles.stepTitleCompleted, isActive && styles.stepTitleActive]}>
            {title}
          </Text>
          <Text style={styles.stepDesc}>{desc}</Text>
        </View>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const date = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isExpanded = expandedOrderId === item.id;
    const itemsSummary = item.order_items.map((oi: any) => 
      `${oi.products?.name || 'Product'} (x${oi.quantity})`
    ).join(', ');

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.orderIdText}>Order #{item.id.slice(0, 8)}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cardBody}
          onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
        >
          <Text style={styles.itemsTitle}>Items Summary</Text>
          <Text style={styles.itemsText} numberOfLines={isExpanded ? undefined : 1}>{itemsSummary}</Text>
          <Text style={styles.addressText} numberOfLines={1}>📍 {item.delivery_address}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Delivery Timeline Tracking */}
            <Text style={styles.expandedSectionTitle}>Visual Tracking Status</Text>
            {item.status === 'cancelled' ? (
              <View style={styles.cancelledBox}>
                <Text style={styles.cancelledTitle}>🔴 Order Cancelled</Text>
                <Text style={styles.cancelledText}>This order template has been cancelled. Price values have been refunded or cleared.</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {renderTimelineStep('Order Placed', 'We have received your pantry list.', item.status, 0)}
                {renderTimelineStep('Confirmed', 'Store partner verified stock availability.', item.status, 1)}
                {renderTimelineStep('Packing', 'Items are being packed sanitarily.', item.status, 2)}
                {renderTimelineStep('Out for Delivery', 'Driver has left the local shop.', item.status, 3)}
                {renderTimelineStep('Delivered', 'Enjoy your monthly groceries!', item.status, 4)}
              </View>
            )}

            {/* Detailed Items List */}
            <Text style={styles.expandedSectionTitle}>Product List Details</Text>
            {item.order_items.map((oi: any) => (
              <View key={oi.id} style={styles.productRow}>
                <Image source={{ uri: oi.products?.image_url }} style={styles.productThumb} resizeMode="contain" />
                <View style={styles.productMeta}>
                  <Text style={styles.productName} numberOfLines={1}>{oi.products?.name || 'Product'}</Text>
                  <Text style={styles.productQty}>Qty: {oi.quantity} · Price: ₹{oi.unit_price}</Text>
                </View>
                <Text style={styles.productTotal}>₹{oi.unit_price * oi.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{item.total_amount}</Text>
          </View>
          <TouchableOpacity
            style={styles.reorderBtn}
            onPress={() => handleReorder(item)}
            disabled={reorderingId === item.id}
          >
            {reorderingId === item.id ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              <Text style={styles.reorderBtnText}>🔄 Reorder Basket</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  backBtn: {
    marginRight: 15,
  },
  backBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
    flex: 1,
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  refreshText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  expandedContent: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expandedSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 12,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineContainer: {
    paddingLeft: 10,
    marginBottom: 15,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timelineIndicators: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineCircleCompleted: {
    backgroundColor: '#22C55E',
  },
  timelineCircleActive: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  circleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  circleTextDot: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineLineCompleted: {
    backgroundColor: '#22C55E',
  },
  stepTextContainer: {
    flex: 1,
    paddingBottom: 15,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepTitleCompleted: {
    color: '#0B1220',
  },
  stepTitleActive: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  stepDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  cancelledBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  cancelledText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 4,
    lineHeight: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productThumb: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  productMeta: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B1220',
  },
  productQty: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  productTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  reorderBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderBtnText: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 15,
    backgroundColor: '#22C55E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
});
