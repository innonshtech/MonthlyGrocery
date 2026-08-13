import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AccountScreen({ navigation }: any) {
  const { user, city, area, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out from MonthlyGrocery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => logout() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'Guest Shopper'}</Text>
            <Text style={styles.userPhone}>
              {user?.mobile ? `+91 ${user.mobile.slice(2)}` : 'Browsing as Guest'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Delivery Location</Text>
          <Text style={styles.infoValue}>📍 {area ? `${area}, ${city}` : 'No Area Selected'}</Text>
          <TouchableOpacity 
            style={styles.changeBtn}
            onPress={() => navigation.navigate('CitySelection')}
          >
            <Text style={styles.changeBtnText}>Edit Location</Text>
          </TouchableOpacity>
        </View>

        {/* Menu list */}
        <View style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              if (!user) {
                Alert.alert('Login Required', 'Please login to view order history');
              } else {
                navigation.navigate('Orders');
              }
            }}
          >
            <Text style={styles.menuEmoji}>📦</Text>
            <Text style={styles.menuText}>Order History</Text>
            <Text style={styles.menuArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>📍</Text>
            <Text style={styles.menuText}>Manage Addresses</Text>
            <Text style={styles.menuArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🏷️</Text>
            <Text style={styles.menuText}>My Offers & Coupons</Text>
            <Text style={styles.menuArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.menuEmoji}>💬</Text>
            <Text style={styles.menuText}>Help & Support</Text>
            <Text style={styles.menuArrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{user ? 'Log Out' : 'Clear Guest Session'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  header: {
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
  container: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  userPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 8,
  },
  changeBtn: {
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: '#6C3BFF',
    borderRadius: 50,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeBtnText: {
    color: '#6C3BFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 25,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuEmoji: {
    fontSize: 18,
    marginRight: 15,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1220',
    flex: 1,
  },
  menuArrow: {
    fontSize: 12,
    color: '#CCC',
  },
  logoutBtn: {
    backgroundColor: '#EF444415',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
