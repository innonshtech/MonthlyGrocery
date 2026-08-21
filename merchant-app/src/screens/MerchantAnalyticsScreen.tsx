import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

export default function MerchantAnalyticsScreen() {
  const { token } = useMerchantAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrderStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/merchant/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, []);

  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const cancelledOrdersCount = orders.filter(o => o.status === 'cancelled').length;

  const avgOrderValue = orders.length > 0 ? (totalSales / (orders.length - cancelledOrdersCount || 1)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Store Analytics</Text>
          <Text style={styles.headerSubtitle}>Sales performance, fulfillment rates & revenue insights</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrderStats}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Computing store KPIs...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Revenue Card */}
          <View style={styles.mainRevenueCard}>
            <Text style={styles.revenueLabel}>TOTAL STORE REVENUE</Text>
            <Text style={styles.revenueValue}>₹{totalSales.toLocaleString('en-IN')}</Text>
            <View style={styles.revenueFooter}>
              <Text style={styles.revenueSub}>Across {orders.length} total customer orders</Text>
            </View>
          </View>

          {/* KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>📦</Text>
              <Text style={styles.kpiValue}>{activeOrdersCount}</Text>
              <Text style={styles.kpiLabel}>Active Orders</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>✓</Text>
              <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{completedOrdersCount}</Text>
              <Text style={styles.kpiLabel}>Fulfilled Orders</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>💰</Text>
              <Text style={styles.kpiValue}>₹{Math.round(avgOrderValue)}</Text>
              <Text style={styles.kpiLabel}>Avg Order Value</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>✕</Text>
              <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{cancelledOrdersCount}</Text>
              <Text style={styles.kpiLabel}>Cancelled</Text>
            </View>
          </View>

          {/* Fulfillment Status Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>ORDER FULFILLMENT BREAKDOWN</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Delivered & Completed</Text>
              <Text style={[styles.statusCount, { color: '#16A34A' }]}>{completedOrdersCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Out for Delivery / In Transit</Text>
              <Text style={[styles.statusCount, { color: '#DB2777' }]}>
                {orders.filter(o => o.status === 'out_for_delivery').length}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Packing & Preparing</Text>
              <Text style={[styles.statusCount, { color: '#4F46E5' }]}>
                {orders.filter(o => o.status === 'packing').length}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Pending Approval</Text>
              <Text style={[styles.statusCount, { color: '#D97706' }]}>
                {orders.filter(o => o.status === 'pending').length}
              </Text>
            </View>
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Merchant Pro-Tip</Text>
            <Text style={styles.tipsText}>
              Keep popular monthly staples (Atta 10kg, Cooking Oil 5L, Rice 10kg, Sugar & Pulses) in-stock at competitive prices to boost repeat customer orders.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  tipsText: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 4,
    lineHeight: 17,
  },
});
