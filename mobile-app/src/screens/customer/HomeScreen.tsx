import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, setActiveTab }: any) {
  const { user, city, area } = useAuth();
  const { addToCart, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock states for Monthly Grocery Plan
  const lastMonthSpent = 4860;
  const estimatedThisMonth = 4520;
  const potentialSavings = 340;

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/all?limit=6`);
        const data = await res.json();
        if (res.ok && data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Error fetching home featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const renderProductCard = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="contain" />
        <View style={styles.productInfo}>
          <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.unitText}>{item.unit}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.price}</Text>
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Location Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>DELIVERING TO</Text>
          <Text style={styles.locationValue} numberOfLines={1}>
            📍 {area ? `${area}, ${city}` : 'Select Delivery Location'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.changeLocBtn}
          onPress={() => navigation.navigate('CitySelection')}
        >
          <Text style={styles.changeLocText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Planning Tracker Card */}
      <View style={styles.planCard}>
        <Text style={styles.planTitle}>Your Monthly Grocery Plan</Text>
        
        <View style={styles.planStats}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₹{lastMonthSpent}</Text>
            <Text style={styles.statLbl}>Last Month</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={[styles.statVal, { color: '#22C55E' }]}>₹{estimatedThisMonth}</Text>
            <Text style={styles.statLbl}>This Month (Est.)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#6C3BFF' }]}>₹{potentialSavings}</Text>
            <Text style={styles.statLbl}>Savings Achieved</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.planCta}
          onPress={() => navigation.navigate('MyMonthlyGroceryHub')}
        >
          <Text style={styles.planCtaText}>Recreate Last Month's Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Category Horizontal Quick Links */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity onPress={() => setActiveTab('Categories')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
        {[
          { name: 'Atta & Rice', emoji: '🌾' },
          { name: 'Cooking Essentials', emoji: '🧂' },
          { name: 'Dairy Staples', emoji: '🥛' },
          { name: 'Beverages', emoji: '☕' },
          { name: 'Snacks', emoji: '🍪' }
        ].map((cat, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.catPill}
            onPress={() => navigation.navigate('CategoryProducts', { categoryName: cat.name })}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={styles.catName}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommended Catalog Products */}
      <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 25 }]}>Recommended for You</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#22C55E" style={{ marginVertical: 30 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productListContent}
        />
      )}

      {/* Savings Info Banner */}
      <View style={styles.savingsBanner}>
        <View style={styles.bannerIconContainer}>
          <Text style={{ fontSize: 24 }}>💡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Smart Savings Tip</Text>
          <Text style={styles.bannerDesc}>Buy 5kg packs instead of individual 1kg packets to unlock wholesale rates.</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#999',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 3,
    maxWidth: width * 0.65,
  },
  changeLocBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  changeLocText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C3BFF',
  },
  planCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
    textAlign: 'center',
    marginBottom: 15,
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F3F4F6',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  statLbl: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  planCta: {
    backgroundColor: '#22C55E',
    height: 46,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  seeAll: {
    fontSize: 13,
    color: '#6C3BFF',
    fontWeight: '600',
  },
  catScroll: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1EAD8',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
  },
  catEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  productListContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 150,
    marginHorizontal: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  productImage: {
    width: '100%',
    height: 90,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  brandText: {
    fontSize: 9,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B1220',
    height: 34,
    marginTop: 2,
  },
  unitText: {
    fontSize: 11,
    color: '#666',
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  addBtnText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 11,
  },
  savingsBanner: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1EAD8',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  bannerDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
});
