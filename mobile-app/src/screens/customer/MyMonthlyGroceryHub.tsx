import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function MyMonthlyGroceryHub({ navigation }: any) {
  const { token, user } = useAuth();
  const [savedBasketsCount, setSavedBasketsCount] = useState(3);
  const [totalSavedThisMonth, setTotalSavedThisMonth] = useState(450);
  const [lastOrderItemsCount, setLastOrderItemsCount] = useState(24);

  useEffect(() => {
    const fetchLiveHubMetrics = async () => {
      try {
        // 1. Fetch saved baskets count from storage
        const saved = await AsyncStorage.getItem('@saved_baskets');
        if (saved) {
          const list = JSON.parse(saved);
          setSavedBasketsCount(list.length);
        }

        // 2. Fetch live savings & last order from database
        if (token) {
          const ordersRes = await fetch(`${API_BASE}/orders/mine`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const ordersData = await ordersRes.json();
          if (ordersData.success && ordersData.orders?.length > 0) {
            const orders = ordersData.orders;
            const savingsSum = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.discount_amount as any) || 0), 0);
            if (savingsSum > 0) setTotalSavedThisMonth(savingsSum);
            if (orders[0].order_items?.length > 0) {
              setLastOrderItemsCount(orders[0].order_items.length);
            }
          }
        }
      } catch (err) {
        console.error('Hub metrics fetch notice:', err);
      }
    };

    fetchLiveHubMetrics();
  }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Monthly Grocery</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           1. TOP GREEN HERO BANNER CARD (D1)
           ========================================================================= */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <Text style={styles.heroBadgeText}>✦ PLAN ONCE · SUPER SAVER</Text>
          </View>

          <Text style={styles.heroTitle}>
            Your whole month, sorted in one tap
          </Text>

          <Text style={styles.heroSubtitle}>
            Smart baskets built from what your home actually buys — then reorder in seconds.
          </Text>

          <View style={styles.heroSavingsPill}>
            <Text style={styles.heroSavingsText}>AVG ₹{totalSavedThisMonth} SAVED / MONTH</Text>
          </View>
        </View>

        {/* =========================================================================
           2. 4 ACTION OPTION CARDS (D1)
           ========================================================================= */}
        <View style={styles.actionCardsWrap}>
          {/* Card 1: One-click monthly cart */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('OneClickCart')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: COLORS.green700 }]}>
              <Text style={styles.iconWhiteEmoji}>✦</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>One-click monthly cart</Text>
              <Text style={styles.cardSub}>
                Auto-build this month's basket from what you usually buy
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          {/* Card 2: Copy last month's cart */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CopyLastMonth')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: COLORS.green50 }]}>
              <Text style={styles.iconGreenEmoji}>↻</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Copy last month's cart</Text>
              <Text style={styles.cardSub}>
                Reorder your last basket · {lastOrderItemsCount} items
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          {/* Card 3: Saved baskets */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SavedBaskets')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: COLORS.green50 }]}>
              <Text style={styles.iconGreenEmoji}>📑</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Saved baskets</Text>
              <Text style={styles.cardSub}>
                {savedBasketsCount} baskets ready to reorder
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          {/* Card 4: Build from your list */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: COLORS.green50 }]}>
              <Text style={styles.iconGreenEmoji}>📋</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Build from your list (paste)</Text>
              <Text style={styles.cardSub}>
                Enter a list of items to auto-match
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  /* Hero Card */
  heroCard: {
    backgroundColor: COLORS.green800, // #155A38
    borderRadius: RADIUS.lg, // 16px
    padding: 20,
    marginBottom: 20,
  },
  heroBadgeRow: {
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.marigold500, // #F5A524
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroSavingsPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.marigold500, // #F5A524
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  heroSavingsText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.ink900,
    letterSpacing: 0.5,
  },
  /* Action Cards */
  actionCardsWrap: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md, // 12px
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconWhiteEmoji: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  iconGreenEmoji: {
    fontSize: 20,
    color: COLORS.green700,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 6,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.ink500,
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 24,
    color: COLORS.ink300,
    fontWeight: '300',
  },
});
