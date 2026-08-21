import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import CategoriesScreen from './CategoriesScreen';
import CartScreen from './CartScreen';
import OrdersScreen from './OrdersScreen';
import AccountScreen from './AccountScreen';
import AppIcon from '../../components/AppIcon';
import { useCart } from '../../context/CartContext';

const ACTIVE_COLOR = '#15803D'; // Rich Vibrant Forest Green
const INACTIVE_COLOR = '#3D5A4B'; // Muted Pine/Sage Green from Figma

export default function MainTabScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const initialTab = route?.params?.initialTab || 'Home';
  const [activeTab, setActiveTab] = useState<'Home' | 'Categories' | 'Cart' | 'Orders' | 'Account'>(initialTab);
  const { items } = useCart();

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen navigation={navigation} setActiveTab={setActiveTab} />;
      case 'Categories':
        return <CategoriesScreen navigation={navigation} />;
      case 'Cart':
        return <CartScreen navigation={navigation} />;
      case 'Orders':
        return <OrdersScreen navigation={navigation} />;
      case 'Account':
        return <AccountScreen navigation={navigation} />;
      default:
        return <HomeScreen navigation={navigation} setActiveTab={setActiveTab} />;
    }
  };

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Active Screen Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* =========================================================================
         EXACT FIGMA 5-TAB BOTTOM NAVIGATION
         ========================================================================= */}
      <View style={[styles.tabBar, { paddingBottom: bottomInset, height: 56 + bottomInset }]}>
        
        {/* Tab 1: Home */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Home')}
          activeOpacity={0.7}
        >
          <AppIcon 
            name="home" 
            size={22} 
            color={activeTab === 'Home' ? ACTIVE_COLOR : INACTIVE_COLOR} 
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'Home' ? ACTIVE_COLOR : INACTIVE_COLOR }, activeTab === 'Home' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Categories */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Categories')}
          activeOpacity={0.7}
        >
          <AppIcon 
            name="categories" 
            size={20} 
            color={activeTab === 'Categories' ? ACTIVE_COLOR : INACTIVE_COLOR} 
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'Categories' ? ACTIVE_COLOR : INACTIVE_COLOR }, activeTab === 'Categories' && styles.tabLabelActive]}>
            Categories
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Cart with Dynamic Badge */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Cart')}
          activeOpacity={0.7}
        >
          <AppIcon 
            name="cart" 
            size={22} 
            color={activeTab === 'Cart' ? ACTIVE_COLOR : INACTIVE_COLOR} 
            badge={totalCartCount > 0 ? totalCartCount : undefined}
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'Cart' ? ACTIVE_COLOR : INACTIVE_COLOR }, activeTab === 'Cart' && styles.tabLabelActive]}>
            Cart
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Orders */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Orders')}
          activeOpacity={0.7}
        >
          <AppIcon 
            name="orders" 
            size={20} 
            color={activeTab === 'Orders' ? ACTIVE_COLOR : INACTIVE_COLOR} 
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'Orders' ? ACTIVE_COLOR : INACTIVE_COLOR }, activeTab === 'Orders' && styles.tabLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Account */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Account')}
          activeOpacity={0.7}
        >
          <AppIcon 
            name="account" 
            size={22} 
            color={activeTab === 'Account' ? ACTIVE_COLOR : INACTIVE_COLOR} 
          />
          <Text style={[styles.tabLabel, { color: activeTab === 'Account' ? ACTIVE_COLOR : INACTIVE_COLOR }, activeTab === 'Account' && styles.tabLabelActive]}>
            Account
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 48,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 4,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
