import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar
} from 'react-native';
import OrdersDashboard from './OrdersDashboard';
import MerchantInventoryScreen from './MerchantInventoryScreen';
import MerchantCatalogScreen from './MerchantCatalogScreen';
import MerchantAnalyticsScreen from './MerchantAnalyticsScreen';
import StoreSettingsScreen from './StoreSettingsScreen';

const { width } = Dimensions.get('window');

export default function MerchantTabScreen() {
  const [activeTab, setActiveTab] = useState<'Orders' | 'Inventory' | 'Catalog' | 'Analytics' | 'Settings'>('Orders');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Orders':
        return <OrdersDashboard />;
      case 'Inventory':
        return <MerchantInventoryScreen />;
      case 'Catalog':
        return <MerchantCatalogScreen />;
      case 'Analytics':
        return <MerchantAnalyticsScreen />;
      case 'Settings':
        return <StoreSettingsScreen />;
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

      {/* Merchant Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {/* Tab 1: Orders */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Orders')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Orders' && styles.tabIconActive]}>📥</Text>
          <Text style={[styles.tabLabel, activeTab === 'Orders' && styles.tabLabelActive]}>Orders</Text>
        </TouchableOpacity>

        {/* Tab 2: Inventory */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Inventory')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Inventory' && styles.tabIconActive]}>📦</Text>
          <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
        </TouchableOpacity>

        {/* Tab 3: Catalog */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Catalog')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Catalog' && styles.tabIconActive]}>🏪</Text>
          <Text style={[styles.tabLabel, activeTab === 'Catalog' && styles.tabLabelActive]}>Catalog</Text>
        </TouchableOpacity>

        {/* Tab 4: Analytics */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Analytics')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Analytics' && styles.tabIconActive]}>📊</Text>
          <Text style={[styles.tabLabel, activeTab === 'Analytics' && styles.tabLabelActive]}>Analytics</Text>
        </TouchableOpacity>

        {/* Tab 5: Settings */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Settings')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Settings' && styles.tabIconActive]}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'Settings' && styles.tabLabelActive]}>Store</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.18,
    height: '100%',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.45,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
});
