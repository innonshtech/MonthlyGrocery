import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import HomeScreen from './HomeScreen';
import CategoriesScreen from './CategoriesScreen';
import CartScreen from './CartScreen';
import AccountScreen from './AccountScreen';

const { width } = Dimensions.get('window');

export default function MainTabScreen({ route, navigation }: any) {
  const initialTab = route.params?.initialTab || 'Home';
  const [activeTab, setActiveTab] = useState<'Home' | 'Categories' | 'Cart' | 'Account'>(initialTab);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen navigation={navigation} setActiveTab={setActiveTab} />;
      case 'Categories':
        return <CategoriesScreen navigation={navigation} />;
      case 'Cart':
        return <CartScreen navigation={navigation} />;
      case 'Account':
        return <AccountScreen navigation={navigation} />;
      default:
        return <HomeScreen navigation={navigation} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Screen Area */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        
        {/* Tab 1: Home */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Home')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Home' && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Tab 2: Categories */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Categories')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Categories' && styles.tabIconActive]}>🗂️</Text>
          <Text style={[styles.tabLabel, activeTab === 'Categories' && styles.tabLabelActive]}>Categories</Text>
        </TouchableOpacity>

        {/* STANDOUT CTA: My Monthly Grocery */}
        <TouchableOpacity 
          style={styles.standoutCta}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
        >
          <View style={styles.standoutCircle}>
            <Text style={styles.standoutIcon}>💡</Text>
          </View>
          <Text style={styles.standoutLabel}>MG Plan</Text>
        </TouchableOpacity>

        {/* Tab 3: Cart */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Cart')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Cart' && styles.tabIconActive]}>🛒</Text>
          <Text style={[styles.tabLabel, activeTab === 'Cart' && styles.tabLabelActive]}>Cart</Text>
        </TouchableOpacity>

        {/* Tab 4: Account */}
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setActiveTab('Account')}
        >
          <Text style={[styles.tabIcon, activeTab === 'Account' && styles.tabIconActive]}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'Account' && styles.tabLabelActive]}>Profile</Text>
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
    width: width * 0.18,
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
  standoutCta: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.2,
    height: '100%',
    position: 'relative',
    top: -15,
  },
  standoutCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  standoutIcon: {
    fontSize: 24,
  },
  standoutLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#22C55E',
    marginTop: 6,
    textTransform: 'uppercase',
  },
});
