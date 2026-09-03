import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Linking,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packing' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function normalizeOrderStatus(status?: string): string {
  const value = (status || 'pending').toLowerCase();
  if (value === 'packing' || value === 'dispatched') return 'packed';
  return value;
}

function matchesStatusFilter(orderStatus: string | undefined, filterKey: string): boolean {
  if (filterKey === 'all') return true;
  return normalizeOrderStatus(orderStatus) === filterKey;
}

function getStatusBadgeStyle(status: string) {
  switch (normalizeOrderStatus(status)) {
    case 'pending': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', label: 'Pending Approval' };
    case 'confirmed': return { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE', label: 'Order Confirmed' };
    case 'packed': return { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE', label: 'Packing Items' };
    case 'out_for_delivery': return { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8', label: 'Out for Delivery' };
    case 'delivered': return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', label: 'Delivered' };
    case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', label: 'Cancelled' };
    default: return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', label: status };
  }
}

function resolveCustomerName(order: any): string {
  return order.profiles?.name || order.consumer_name || 'Customer';
}

function resolveCustomerPhone(order: any): string | null {
  const phone = order.profiles?.phone || order.profiles?.mobile || order.consumer_name;
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d]/g, '');
  return digits.length >= 10 ? digits : null;
}

function resolveDeliveryAddress(order: any): string {
  return order.delivery_address || order.shipping_address || order.deliver_to_label || 'Address not provided';
}

function resolveItemName(item: any): string {
  return item.products?.name || item.product_name || item.name || 'Item';
}

function resolveItemUnit(item: any): string {
  return item.products?.unit || item.unit || 'unit';
}

function resolveItemImage(item: any): string {
  return item.products?.image_url || item.image_url || '';
}

export default function OrdersDashboard() {
  const { token } = useMerchantAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const res = await fetch(`${API_BASE}/orders/merchant/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setShopName(data.shop_name || '');
      } else {
        setError(data.error || 'Failed to fetch incoming orders');
      }
    } catch (err) {
      setError('Connection error. Is the Express server running on port 8001?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedStatus = normalizeOrderStatus(data.order?.status || nextStatus);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: updatedStatus } : o)),
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to update order status');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection error during status update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePromptCancel = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to reject/cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel Order', style: 'destructive', onPress: () => handleUpdateStatus(orderId, 'cancelled') }
      ]
    );
  };

  const handleCallCustomer = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'Customer contact phone number is not available.');
      return;
    }
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call on this device.');
    });
  };

  const filteredOrders = orders.filter((o) => matchesStatusFilter(o.status, selectedStatusFilter));

  const renderOrderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedOrderId === item.id;
    const badge = getStatusBadgeStyle(item.status);
    const isUpdating = updatingId === item.id;
    const orderStatus = normalizeOrderStatus(item.status);
    const customerName = resolveCustomerName(item);
    const customerPhone = resolveCustomerPhone(item);
    const deliveryAddress = resolveDeliveryAddress(item);
    const formattedDate = new Date(item.created_at).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    return (
      <View style={styles.orderCard}>
        {/* Top summary row */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderIdText}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={[styles.badgePill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Customer info card */}
        <View style={styles.customerBox}>
          <View style={styles.customerLeft}>
            <Text style={styles.customerName}>👤 {customerName}</Text>
            <Text style={styles.customerPhone}>
              📞 {customerPhone ? `+91 ${customerPhone.slice(-10)}` : 'N/A'}
            </Text>
          </View>
          {customerPhone && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCallCustomer(customerPhone)}
            >
              <Text style={styles.callBtnText}>Call Customer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Address */}
        <View style={styles.addressBox}>
          <Text style={styles.addressLabel}>DELIVERY DESTINATION:</Text>
          <Text style={styles.addressText}>📍 {deliveryAddress}</Text>
        </View>

        {/* Order Items List preview / toggle */}
        <TouchableOpacity 
          style={styles.itemsToggleRow}
          onPress={() => setExpandedOrderId(isExpanded ? null : item.id)}
        >
          <Text style={styles.itemsCountText}>
            📦 {item.order_items?.length || 0} Grocery Items (₹{item.total_amount})
          </Text>
          <Text style={styles.toggleArrow}>{isExpanded ? '▲ Hide' : '▼ View Details'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedItemsList}>
            {item.order_items?.map((it: any, idx: number) => {
              const itemName = resolveItemName(it);
              const itemUnit = resolveItemUnit(it);
              const itemImage = resolveItemImage(it);
              return (
              <View key={idx} style={styles.itemRow}>
                {itemImage ? (
                  <Image source={{ uri: itemImage }} style={styles.itemThumb} resizeMode="contain" />
                ) : (
                  <View style={styles.itemThumbPlaceholder}><Text>🛒</Text></View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{itemName}</Text>
                  <Text style={styles.itemUnitQty}>{itemUnit} × {it.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(it.unit_price * it.quantity).toFixed(2)}</Text>
              </View>
            );})}
          </View>
        )}

        {/* Next Status Action Buttons */}
        <View style={styles.actionsFooter}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#22C55E" style={{ padding: 10 }} />
          ) : (
            <View style={styles.actionBtnRow}>
              {orderStatus === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={[styles.btnAction, styles.btnCancel]} 
                    onPress={() => handlePromptCancel(item.id)}
                  >
                    <Text style={styles.btnCancelText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btnAction, styles.btnConfirm]} 
                    onPress={() => handleUpdateStatus(item.id, 'confirmed')}
                  >
                    <Text style={styles.btnConfirmText}>Confirm Order ✓</Text>
                  </TouchableOpacity>
                </>
              )}

              {orderStatus === 'confirmed' && (
                <TouchableOpacity 
                  style={[styles.btnAction, styles.btnPacking]} 
                  onPress={() => handleUpdateStatus(item.id, 'packed')}
                >
                  <Text style={styles.btnPackingText}>Start Packing ➔</Text>
                </TouchableOpacity>
              )}

              {orderStatus === 'packed' && (
                <TouchableOpacity 
                  style={[styles.btnAction, styles.btnDispatch]} 
                  onPress={() => handleUpdateStatus(item.id, 'out_for_delivery')}
                >
                  <Text style={styles.btnDispatchText}>Dispatch: Out for Delivery 🛵</Text>
                </TouchableOpacity>
              )}

              {orderStatus === 'out_for_delivery' && (
                <TouchableOpacity 
                  style={[styles.btnAction, styles.btnDelivered]} 
                  onPress={() => handleUpdateStatus(item.id, 'delivered')}
                >
                  <Text style={styles.btnDeliveredText}>Mark as Delivered 🎉</Text>
                </TouchableOpacity>
              )}

              {orderStatus === 'delivered' && (
                <Text style={styles.completedNotice}>✓ Order Fulfilled & Closed</Text>
              )}

              {orderStatus === 'cancelled' && (
                <Text style={styles.cancelledNotice}>✕ Order Cancelled</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Top Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Live Store Orders</Text>
          <Text style={styles.headerSubtitle}>
            {shopName ? `${shopName} · ` : ''}Manage incoming customer orders & status updates
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrders(true)}>
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Status Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {STATUS_FILTERS.map(f => {
            const count = f.key === 'all'
              ? orders.length
              : orders.filter((o) => matchesStatusFilter(o.status, f.key)).length;
            const isSelected = selectedStatusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedStatusFilter(f.key)}
              >
                <Text style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}>
                  {f.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Fetching incoming orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySub}>
            {selectedStatusFilter === 'all'
              ? 'New orders placed by customers in your serviceable area will appear here live.'
              : `No orders currently matching "${STATUS_FILTERS.find((f) => f.key === selectedStatusFilter)?.label || selectedStatusFilter}" status.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={['#22C55E']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  filtersWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filtersScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterLabelSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  customerLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  customerPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  callBtnText: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 11,
  },
  addressBox: {
    marginTop: 10,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
    lineHeight: 16,
  },
  itemsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleArrow: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  expandedItemsList: {
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
  },
  itemThumbPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemUnitQty: {
    fontSize: 10,
    color: '#64748B',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  actionsFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnAction: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#FEE2E2',
    maxWidth: 90,
  },
  btnCancelText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnConfirm: {
    backgroundColor: '#22C55E',
  },
  btnConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnPacking: {
    backgroundColor: '#4F46E5',
  },
  btnPackingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnDispatch: {
    backgroundColor: '#DB2777',
  },
  btnDispatchText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnDelivered: {
    backgroundColor: '#16A34A',
  },
  btnDeliveredText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  completedNotice: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 6,
  },
  cancelledNotice: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 6,
  },
});
