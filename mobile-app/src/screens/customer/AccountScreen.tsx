import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function AccountScreen({ navigation }: any) {
  const { user, token, logout, city, area } = useAuth();
  const [totalSaved, setTotalSaved] = useState(4820);
  const [orderCount, setOrderCount] = useState(6);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Dynamic user data
  const userName = user?.name || 'Aarav Sharma';
  const userMobile = user?.mobile ? (user.mobile.startsWith('+91') ? user.mobile : `+91 ${user.mobile}`) : '+91 98765 43210';
  const initialLetter = userName.charAt(0).toUpperCase() || 'A';

  // Fetch dynamic orders & savings from backend database
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/orders/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.orders) {
          const orders = data.orders;
          setOrderCount(orders.length);
          const savedSum = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.discount_amount as any) || 0), 0);
          if (savedSum > 0) setTotalSaved(savedSum);
        }
      } catch (err) {
        console.error('Failed to load user savings:', err);
      }
    };

    fetchUserStats();
  }, [token]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Splash' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
           STATE A: LOGGED IN MEMBER STATE (G1 TOP LEFT IN FIGMA)
           ========================================================================= */}
        {token ? (
          <View>
            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userNameText}>{userName}</Text>
                <Text style={styles.userPhoneText}>{userMobile}</Text>
              </View>

              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.85}
              >
                <Text style={styles.editProfileBtnText}>Edit ›</Text>
              </TouchableOpacity>
            </View>

            {/* Forest Green Savings Card */}
            <View style={styles.savingsCard}>
              <View style={styles.savingsTopRow}>
                <View>
                  <Text style={styles.savingsSubHeader}>SAVED WITH US THIS YEAR</Text>
                  <Text style={styles.savingsTotalAmount}>₹{totalSaved.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.goldCoinCircle}>
                  <Text style={styles.goldCoinSymbol}>₹</Text>
                </View>
              </View>

              <Text style={styles.savingsOrderCountText}>
                Across {orderCount} monthly orders
              </Text>
            </View>

            {/* Menu List */}
            <View style={styles.menuCard}>
              {/* Item 1: Saved addresses */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => navigation.navigate('SavedAddresses')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <AppIcon name="map-pin" size={18} color={COLORS.green700} />
                </View>
                <Text style={styles.menuItemText}>Saved addresses</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item 2: My coupons */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => navigation.navigate('OffersCoupons')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <Text style={styles.percentIcon}>%</Text>
                </View>
                <Text style={styles.menuItemText}>My coupons</Text>
                <View style={styles.couponBadgePill}>
                  <Text style={styles.couponBadgeText}>3</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item 3: Help & support */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => navigation.navigate('HelpSupport')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <AppIcon name="help" size={18} color={COLORS.green700} />
                </View>
                <Text style={styles.menuItemText}>Help & support</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Item 4: About & terms */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => Alert.alert('MonthlyGrocery', 'Version 1.0.0 · Planned bulk grocery savings platform.')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <AppIcon name="tag" size={18} color={COLORS.green700} />
                </View>
                <Text style={styles.menuItemText}>About & terms</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Red Outlined Logout Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.logoutBtnText}>⎋ Log out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* =========================================================================
             STATE B: GUEST BROWSING STATE (G1 BOTTOM LEFT IN FIGMA)
             ========================================================================= */
          <View>
            {/* Guest Banner Card */}
            <View style={styles.guestCard}>
              <View style={styles.guestAvatarCircle}>
                <AppIcon name="user" size={28} color={COLORS.green700} />
              </View>

              <Text style={styles.guestHeading}>You're browsing as a guest</Text>
              <Text style={styles.guestSub}>
                Log in to track orders, save your monthly baskets and check out faster.
              </Text>

              <TouchableOpacity
                style={styles.loginSignupBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={styles.loginSignupBtnText}>Login or Sign up</Text>
              </TouchableOpacity>
            </View>

            {/* Menu List for Guest */}
            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => navigation.navigate('CitySelection')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <AppIcon name="map-pin" size={18} color={COLORS.green700} />
                </View>
                <Text style={styles.menuItemText}>
                  Delivery area · {area ? `${area}, ${city}` : 'Kothrud, Pune'}
                </Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => navigation.navigate('HelpSupport')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <AppIcon name="help" size={18} color={COLORS.green700} />
                </View>
                <Text style={styles.menuItemText}>Help & support</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => Alert.alert('MonthlyGrocery', 'Version 1.0.0 · Planned bulk grocery savings platform.')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <AppIcon name="tag" size={18} color={COLORS.green700} />
                </View>
                <Text style={styles.menuItemText}>About & terms</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* =========================================================================
         LOGOUT CONFIRMATION MODAL SHEET (G1 DOWN SLIDE)
         ========================================================================= */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowLogoutModal(false)}
            activeOpacity={1}
          />

          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Log out of MonthlyGrocery?</Text>
            <Text style={styles.sheetSub}>
              You can log back in anytime with your phone number to access your saved monthly baskets and order history.
            </Text>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.cancelLogoutBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelLogoutText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmLogoutText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.green700,
  },
  profileInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 2,
  },
  userPhoneText: {
    fontSize: 13,
    color: COLORS.ink500,
  },
  editProfileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    borderColor: COLORS.green700,
  },
  editProfileBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.green700,
  },
  /* Savings Card */
  savingsCard: {
    backgroundColor: COLORS.green800, // #155A38
    borderRadius: RADIUS.md,
    padding: 18,
    marginBottom: 16,
  },
  savingsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  savingsSubHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.marigold500,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  savingsTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  goldCoinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.marigold500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldCoinSymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  savingsOrderCountText: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  /* Menu Card */
  menuCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  percentIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.green700,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink900,
  },
  couponBadgePill: {
    backgroundColor: COLORS.marigold500,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  couponBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.ink900,
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.ink300,
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.line,
  },
  /* Logout Button */
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.pill,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  /* Guest State */
  guestCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  guestAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  guestHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 6,
  },
  guestSub: {
    fontSize: 13,
    color: COLORS.ink500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  loginSignupBtn: {
    backgroundColor: COLORS.green700,
    height: 46,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginSignupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  /* Modal Sheets */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 6,
  },
  sheetSub: {
    fontSize: 13,
    color: COLORS.ink500,
    lineHeight: 18,
    marginBottom: 20,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelLogoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink700,
  },
  confirmLogoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
