import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

interface MerchantOrder {
  id: string;
  status?: string;
  total_amount?: number | string;
  created_at?: string;
  order_items?: Array<{
    product_id?: string;
    product_name?: string;
    name?: string;
    quantity?: number;
  }>;
}

const STATUS_ROWS = [
  { keys: ['delivered'], label: 'Delivered & Completed', color: '#16A34A' },
  { keys: ['out_for_delivery'], label: 'Out for Delivery', color: '#DB2777' },
  { keys: ['packed', 'packing', 'dispatched'], label: 'Packed & Preparing', color: '#4F46E5' },
  { keys: ['confirmed'], label: 'Confirmed', color: '#2563EB' },
  { keys: ['pending'], label: 'Pending Approval', color: '#D97706' },
  { keys: ['cancelled'], label: 'Cancelled', color: '#DC2626' },
];

function normalizeStatus(status?: string): string {
  return (status || '').toLowerCase();
}

function countOrdersByKeys(orders: MerchantOrder[], keys: string[]): number {
  return orders.filter((o) => keys.includes(normalizeStatus(o.status))).length;
}

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function buildTopSellerInsight(orders: MerchantOrder[]): string | null {
  const totals = new Map<string, { name: string; qty: number }>();

  for (const order of orders) {
    if (normalizeStatus(order.status) === 'cancelled') continue;
    for (const item of order.order_items || []) {
      const name = (item.product_name || item.name || '').trim();
      if (!name) continue;
      const key = item.product_id || name;
      const existing = totals.get(key) || { name, qty: 0 };
      existing.qty += Number(item.quantity) || 0;
      totals.set(key, existing);
    }
  }

  if (totals.size === 0) return null;

  const top = Array.from(totals.values()).sort((a, b) => b.qty - a.qty)[0];
  return `Top seller: ${top.name} (${top.qty} units ordered)`;
}

export default function MerchantAnalyticsScreen() {
  const { token } = useMerchantAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [shopName, setShopName] = useState('');
  const [orders, setOrders] = useState<MerchantOrder[]>([]);

  const fetchOrderStats = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const res = await fetch(`${API_BASE}/orders/merchant/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setShopName(data.shop_name || '');
      } else {
        setOrders([]);
        setError(data.error || 'Failed to load store analytics');
      }
    } catch (err) {
      setOrders([]);
      setError('Connection error. Is the backend running on port 8001?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrderStats();
  }, [fetchOrderStats]);

  const stats = useMemo(() => {
    const nonCancelled = orders.filter((o) => normalizeStatus(o.status) !== 'cancelled');
    const totalSales = nonCancelled.reduce(
      (sum, o) => sum + (parseFloat(String(o.total_amount)) || 0),
      0,
    );
    const completedOrdersCount = orders.filter((o) => normalizeStatus(o.status) === 'delivered').length;
    const cancelledOrdersCount = orders.filter((o) => normalizeStatus(o.status) === 'cancelled').length;
    const activeOrdersCount = orders.filter((o) => {
      const status = normalizeStatus(o.status);
      return status !== 'delivered' && status !== 'cancelled';
    }).length;
    const avgOrderValue = nonCancelled.length > 0 ? totalSales / nonCancelled.length : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthOrders = nonCancelled.filter((o) => {
      if (!o.created_at) return false;
      return new Date(o.created_at) >= monthStart;
    });
    const thisMonthRevenue = thisMonthOrders.reduce(
      (sum, o) => sum + (parseFloat(String(o.total_amount)) || 0),
      0,
    );

    const fulfillmentRate =
      nonCancelled.length > 0
        ? Math.round((completedOrdersCount / nonCancelled.length) * 100)
        : 0;

    return {
      totalSales,
      completedOrdersCount,
      cancelledOrdersCount,
      activeOrdersCount,
      avgOrderValue,
      thisMonthRevenue,
      thisMonthOrderCount: thisMonthOrders.length,
      fulfillmentRate,
      topSellerInsight: buildTopSellerInsight(orders),
    };
  }, [orders]);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Store Analytics</Text>
          <Text style={styles.headerSubtitle}>
            {shopName
              ? `${shopName} · ${orders.length} order${orders.length === 1 ? '' : 's'}`
              : 'Live sales & fulfillment metrics'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchOrderStats(true)}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading store analytics...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrderStats()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>📊</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>
            Analytics will appear here once customers place orders at your store.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrderStats(true)}
              colors={['#22C55E']}
            />
          }
        >
          <View style={styles.mainRevenueCard}>
            <Text style={styles.revenueLabel}>TOTAL STORE REVENUE</Text>
            <Text style={styles.revenueValue}>{formatInr(stats.totalSales)}</Text>
            <View style={styles.revenueFooter}>
              <Text style={styles.revenueSub}>
                {formatInr(stats.thisMonthRevenue)} this month · {stats.thisMonthOrderCount} order
                {stats.thisMonthOrderCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>📦</Text>
              <Text style={styles.kpiValue}>{stats.activeOrdersCount}</Text>
              <Text style={styles.kpiLabel}>Active Orders</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>✓</Text>
              <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{stats.completedOrdersCount}</Text>
              <Text style={styles.kpiLabel}>Fulfilled Orders</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>💰</Text>
              <Text style={styles.kpiValue}>{formatInr(stats.avgOrderValue)}</Text>
              <Text style={styles.kpiLabel}>Avg Order Value</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>✕</Text>
              <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{stats.cancelledOrdersCount}</Text>
              <Text style={styles.kpiLabel}>Cancelled</Text>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>ORDER FULFILLMENT BREAKDOWN</Text>
            {STATUS_ROWS.map((row) => {
              const count = countOrdersByKeys(orders, row.keys);
              if (count === 0) return null;
              return (
                <View key={row.label} style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{row.label}</Text>
                  <Text style={[styles.statusCount, { color: row.color }]}>{count}</Text>
                </View>
              );
            })}
            <View style={[styles.statusRow, { borderBottomWidth: 0, marginTop: 4 }]}>
              <Text style={styles.statusLabel}>Fulfillment rate</Text>
              <Text style={[styles.statusCount, { color: '#16A34A' }]}>{stats.fulfillmentRate}%</Text>
            </View>
          </View>

          {stats.topSellerInsight ? (
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Store insight</Text>
              <Text style={styles.insightText}>{stats.topSellerInsight}</Text>
            </View>
          ) : null}
        </ScrollView>
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
    padding: 8,
    borderRadius: 20,
  },
  refreshText: {
    fontSize: 14,
  },
  content: {
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
  mainRevenueCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  revenueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#22C55E',
    marginTop: 8,
  },
  revenueFooter: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  revenueSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 13,
    color: '#334155',
  },
  statusCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  insightCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  insightText: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 4,
    lineHeight: 17,
  },
});
