import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { API_BASE } from '../../config/api';

export default function MyCouponsScreen({ navigation }: any) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/products/coupons/all`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons || []);
      } else {
        setError('Failed to load active coupons.');
      }
    } catch (err) {
      setError('Connection error. Is the backend server online?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Code Copied!', `Promo code "${code}" is ready. You can paste it during checkout.`, [
      { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
      { text: 'OK' }
    ]);
    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  const renderCouponCard = ({ item }: { item: any }) => {
    const isCopied = copiedCode === item.code;

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.badgeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {item.discount_type === 'percentage' ? `${item.discount_value}% OFF` : `FLAT ₹${item.discount_value} OFF`}
              </Text>
            </View>
          </View>

          <Text style={styles.couponDesc}>{item.description}</Text>
          <Text style={styles.minOrderText}>
            Min order value: <Text style={styles.highlightText}>₹{item.min_order_value}</Text>
            {item.max_discount ? ` · Max saving ₹${item.max_discount}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.copyBtn, isCopied && styles.copyBtnCopied]}
          onPress={() => handleCopyCode(item.code)}
        >
          <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextCopied]}>
            {isCopied ? '✓ COPIED' : 'COPY CODE'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Offers & Coupons</Text>
        <TouchableOpacity onPress={fetchCoupons} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Fetching available discounts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCoupons}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : coupons.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🏷️</Text>
          <Text style={styles.emptyTitle}>No active coupons</Text>
          <Text style={styles.emptySubtitle}>Check back soon for festive discounts and monthly savings offers.</Text>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => item.id || item.code}
          renderItem={renderCouponCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.bannerCard}>
              <Text style={styles.bannerEmoji}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Monthly Savings Club</Text>
                <Text style={styles.bannerSubtitle}>Apply these codes at checkout to unlock guaranteed monthly discounts on pantry staples.</Text>
              </View>
            </View>
          }
        />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  refreshBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listContainer: {
    padding: 16,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  codeBadge: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  typeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#D97706',
  },
  couponDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  minOrderText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  copyBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnCopied: {
    backgroundColor: '#0F172A',
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  copyBtnTextCopied: {
    color: '#86EFAC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
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
});
