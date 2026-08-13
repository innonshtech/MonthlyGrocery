import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

export default function MerchantAnalyticsScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics calculated state
  const [stats, setStats] = useState({
    gmv: 0,
    totalOrdersCount: 0,
    activeOrdersCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    aov: 0,
    estimatedMargins: 0
  });

  const fetchOrderAnalytics = async () => {
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
        const orderList = data.orders || [];
        setOrders(orderList);
        calculateStats(orderList);
      } else {
        setError(data.error || 'Failed to load analytics data');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderList: any[]) => {
    const totalOrdersCount = orderList.length;
    const deliveredOrders = orderList.filter(o => o.status === 'delivered');
    const cancelledOrders = orderList.filter(o => o.status === 'cancelled');
    const activeOrders = orderList.filter(o => ['pending', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status));

    const gmv = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const totalActiveSum = orderList.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const aov = totalOrdersCount > 0 ? Math.round(totalActiveSum / totalOrdersCount) : 0;
    
    // Wholesaler margin estimate (average 16% markup)
    const estimatedMargins = Math.round(gmv * 0.16);

    setStats({
      gmv,
      totalOrdersCount,
      activeOrdersCount: activeOrders.length,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      aov,
      estimatedMargins
    });
  };

  useEffect(() => {
    fetchOrderAnalytics();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sales Analytics</Text>
          <Text style={styles.headerSubtitle}>Revenue, Margins & Order Insights</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrderAnalytics}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrderAnalytics}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Main Revenue Card */}
          <View style={styles.mainGmvCard}>
            <Text style={styles.cardLabel}>TOTAL DELIVERED REVENUE (GMV)</Text>
            <Text style={styles.cardValue}>₹{stats.gmv.toLocaleString('en-IN')}</Text>
            <Text style={styles.cardSubText}>Includes final completed delivery payments</Text>
          </View>

          {/* Sub Grid Cards */}
          <View style={styles.gridContainer}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Total Margins</Text>
              <Text style={[styles.gridValue, { color: '#8B5CF6' }]}>₹{stats.estimatedMargins.toLocaleString('en-IN')}</Text>
              <Text style={styles.gridSub}>~16% Wholesaler Margin</Text>
            </View>

            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Average Order (AOV)</Text>
              <Text style={[styles.gridValue, { color: '#3B82F6' }]}>₹{stats.aov.toLocaleString('en-IN')}</Text>
              <Text style={styles.gridSub}>Basket value estimate</Text>
            </View>
          </View>

          {/* Order Metrics Section */}
          <Text style={styles.sectionTitle}>Pipeline Order Statistics</Text>
          <View style={styles.statsList}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>📥 Total Incoming Orders</Text>
              <Text style={styles.statVal}>{stats.totalOrdersCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>⚡ Active Pipeline Orders</Text>
              <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stats.activeOrdersCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>✅ Successfully Delivered</Text>
              <Text style={[styles.statVal, { color: '#22C55E' }]}>{stats.deliveredCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>❌ Cancelled / Returned</Text>
              <Text style={[styles.statVal, { color: '#EF4444' }]}>{stats.cancelledCount}</Text>
            </View>
          </View>

          {/* Wholesale business note */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Business Insight</Text>
            <Text style={styles.infoText}>
              Encourage customers to hit their monthly plan limit targets (₹3,000+). Larger cart sizes improve dispatch shipping logistics economics compared to smaller quick-commerce drop routes.
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
  scrollContent: {
    padding: 20,
  },
  mainGmvCard: {
    backgroundColor: '#0B1220',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22C55E',
    marginTop: 8,
  },
  cardSubText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  gridLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  gridSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsList: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 25,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  infoBox: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  infoText: {
    fontSize: 12,
    color: '#075985',
    lineHeight: 18,
    marginTop: 6,
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
});
