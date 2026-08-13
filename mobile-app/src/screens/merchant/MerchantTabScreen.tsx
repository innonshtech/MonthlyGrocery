import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, Alert } from 'react-native';
import OrdersDashboard from './OrdersDashboard';
import MerchantInventoryScreen from './MerchantInventoryScreen';
import MerchantAnalyticsScreen from './MerchantAnalyticsScreen';
import { useAuth } from '../../context/AuthContext';

// Placeholders for subsequent steps
function InventoryPlaceholder() {
  return (
    <View style={styles.center}>
      <Text style={styles.placeholderText}>📦 Inventory Management Screen</Text>
      <Text style={styles.placeholderSub}>Loading catalogue items in Phase 8...</Text>
    </View>
  );
}

function AnalyticsPlaceholder() {
  return (
    <View style={styles.center}>
      <Text style={styles.placeholderText}>📊 Sales Analytics Dashboard</Text>
      <Text style={styles.placeholderSub}>Loading sales summaries in Phase 9...</Text>
    </View>
  );
}

const { width } = Dimensions.get('window');

export default function MerchantTabScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'Orders' | 'Inventory' | 'Analytics' | 'Settings'>('Orders');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out from the Merchant console?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => logout() }
    ]);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Orders':
        return <OrdersDashboard />;
      case 'Inventory':
        return <MerchantInventoryScreen />;
      case 'Analytics':
        return <MerchantAnalyticsScreen />;
      case 'Settings':
        return (
          <SafeAreaView style={styles.settingsContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Merchant Settings</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.shopCard}>
                <Text style={styles.shopCardLabel}>STORE PROFILE</Text>
                <Text style={styles.shopName}>{user?.name || 'Area Merchant Office'}</Text>
                <Text style={styles.shopPhone}>📞 +91 {user?.mobile ? user.mobile.slice(2) : 'Store Mobile'}</Text>
                <Text style={styles.shopRole}>Role: Local Admin Partner</Text>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out from Dashboard</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      default:
        return <OrdersDashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Screen Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Custom Merchant Bottom Tab Bar */}
      <View style={styles.tabBar}>
        
        {/* Tab 1: Orders */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Orders')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Orders' && styles.tabIconActive]}>📥</Text>
          <Text style={[styles.tabLabel, activeTab === 'Orders' && styles.tabLabelActive]}>Orders</Text>
        </TouchableOpacity>

        {/* Tab 2: Inventory */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Inventory')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Inventory' && styles.tabIconActive]}>📦</Text>
          <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
        </TouchableOpacity>

        {/* Tab 3: Analytics */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Analytics')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Analytics' && styles.tabIconActive]}>📊</Text>
          <Text style={[styles.tabLabel, activeTab === 'Analytics' && styles.tabLabelActive]}>Analytics</Text>
        </TouchableOpacity>

        {/* Tab 4: Settings */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Settings')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Settings' && styles.tabIconActive]}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'Settings' && styles.tabLabelActive]}>Settings</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8ED',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  placeholderSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  settingsContainer: {
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
  content: {
    padding: 20,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    marginBottom: 25,
  },
  shopCardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    letterSpacing: 0.5,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 8,
  },
  shopPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  shopRole: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: 'bold',
    marginTop: 8,
  },
  logoutBtn: {
    backgroundColor: '#EF444415',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1EAD8',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.22,
    height: '100%',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#22C55E',
  },
});
