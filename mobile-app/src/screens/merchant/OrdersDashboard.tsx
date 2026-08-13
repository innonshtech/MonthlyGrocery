import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

export default function OrdersDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/orders/merchant/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch incoming orders');
      }
    } catch (err) {
      setError('Connection error. Is the Express server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    const statuses = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];
    
    Alert.alert(
      'Update Order Status',
      `Current: ${currentStatus.toUpperCase()}`,
      statuses.map(st => ({
        text: st.toUpperCase().replace(/_/g, ' '),
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ status: st })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              Alert.alert('Success', `Order status updated to ${st.toUpperCase()}`);
              fetchOrders(); // reload
            } else {
              Alert.alert('Error', data.error || 'Failed to update status');
            }
          } catch (err) {
            Alert.alert('Error', 'Connection error during update');
          }
        }
      })),
      { cancelable: true }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'packing': return '#8B5CF6';
      case 'out_for_delivery': return '#EC4899';
      case 'delivered': return '#22C55E';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIndex = (status: string) => {
    const sequence = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered'];
    return sequence.indexOf(status);
  };

  const renderTimelineHeader = (currentStatus: string) => {
    if (currentStatus === 'cancelled') {
      return <Text style={styles.cancelledText}>🔴 Cancelled</Text>;
    }
    const sequence = ['Placed', 'Confirm', 'Pack', 'Ship', 'Done'];
    const activeIndex = getStatusIndex(currentStatus);

    return (
      <View style={styles.miniTimeline}>
        {sequence.map((step, idx) => {
          const isDone = activeIndex >= idx;
          return (
            <View key={step} style={styles.miniStep}>
              <View style={[styles.miniDot, isDone && styles.miniDotActive]} />
              <Text style={[styles.miniLabel, isDone && styles.miniLabelActive]}>{step}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: any }) => {
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
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.orderIdText}>Order #{item.id.slice(0, 8)}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}
            onPress={() => handleUpdateStatus(item.id, item.status)}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase().replace(/_/g, ' ')} ✏️
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Mini status visual line */}
        <TouchableOpacity 
          style={styles.timelineRow}
          onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
        >
          {renderTimelineHeader(item.status)}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cardBodySummary}
          onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
        >
          <Text style={styles.customerSummary}>
            👤 {item.profiles?.name || 'Customer'} · 📞 +91 {item.profiles?.phone ? item.profiles.phone.slice(2) : ''}
          </Text>
          <Text style={styles.itemsSummaryText} numberOfLines={isExpanded ? undefined : 1}>
            {itemsSummary}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.sectionTitle}>Full Delivery Address</Text>
            <Text style={styles.addressValue}>📍 {item.delivery_address}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Order Items List</Text>
            {item.order_items.map((oi: any) => (
              <View key={oi.id} style={styles.productRow}>
                <Image source={{ uri: oi.products?.image_url }} style={styles.productThumb} resizeMode="contain" />
                <View style={styles.productMeta}>
                  <Text style={styles.productName} numberOfLines={1}>{oi.products?.name || 'Product'}</Text>
                  <Text style={styles.productQty}>Qty: {oi.quantity} · Unit Price: ₹{oi.unit_price}</Text>
                </View>
                <Text style={styles.productTotal}>₹{oi.unit_price * oi.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total Payout:</Text>
          <Text style={styles.totalValue}>₹{item.total_amount}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Incoming Orders</Text>
          <Text style={styles.headerSubtitle}>Delivery Pipeline Management</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <Text style={styles.refreshBtnText}>Reload</Text>
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
          <Text style={styles.emptyText}>No incoming orders for your shop yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  refreshBtnText: {
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
  card: {
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
    color: '#9CA3AF',
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
  timelineRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cancelledText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  miniTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  miniDotActive: {
    backgroundColor: '#22C55E',
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  miniLabelActive: {
    color: '#0B1220',
  },
  cardBodySummary: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customerSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  itemsSummaryText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  expandedContent: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  addressValue: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productThumb: {
    width: 36,
    height: 36,
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
    marginTop: 1,
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
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
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
