import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useCart, Product } from '../../context/CartContext';
import { API_BASE } from '../../config/api';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { items, addToCart, updateQuantity } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProductDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/products/all?limit=200`);
      const data = await res.json();
      if (res.ok && data.success) {
        const found = data.products.find((p: any) => p.id === productId);
        if (found) {
          setProduct(found);
        } else {
          setError('Product not found in this delivery area');
        }
      } else {
        setError(data.error || 'Failed to load details');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const getCartQuantity = () => {
    if (!product) return 0;
    const item = items.find((it) => it.product.id === product.id);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load product'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const qty = getCartQuantity();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHeaderBtn}>
          <Text style={styles.backHeaderText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageCard}>
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
        </View>

        {/* Product Meta */}
        <View style={styles.detailsCard}>
          <Text style={styles.brandText}>{product.brand}</Text>
          <Text style={styles.nameText}>{product.name}</Text>
          <Text style={styles.unitText}>Pack Size: {product.unit}</Text>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceText}>₹{product.price}</Text>
              {product.mrp > product.price && (
                <Text style={styles.mrpText}>MRP ₹{product.mrp}</Text>
              )}
            </View>
            
            {product.mrp > product.price && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  Save ₹{(product.mrp - product.price).toFixed(0)} ({Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF)
                </Text>
              </View>
            )}
          </View>

          {/* Location status info */}
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>⚡ Available in your area · Delivering in 4 Hours</Text>
          </View>
        </View>

        {/* Product Details Section */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{product.primary_category}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Brand</Text>
            <Text style={styles.detailValue}>{product.brand}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Origin</Text>
            <Text style={styles.detailValue}>{product.place || 'India'}</Text>
          </View>

          {/* Placeholder for standard descriptions */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>
            This premium quality grocery staple is sourced from the finest farms. Rigorously tested under stringent quality control procedures to ensure compliance with global freshness guidelines. Packed under hygienic conditions to maintain natural aroma and long shelf life. Keep stored in a cool, dry place.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Add to Cart Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarPriceInfo}>
          <Text style={styles.bottomBarPriceLabel}>Item Total</Text>
          <Text style={styles.bottomBarPrice}>₹{product.price * (qty || 1)}</Text>
        </View>

        {qty > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateQuantity(product.id, qty - 1)}
            >
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepQty}>{qty}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateQuantity(product.id, qty + 1)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addCartBtn}
            onPress={() => addToCart(product)}
          >
            <Text style={styles.addCartBtnText}>Add to Monthly Cart</Text>
          </TouchableOpacity>
        )}
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  backHeaderBtn: {
    marginRight: 15,
  },
  backHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 50,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageCard: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  image: {
    width: '100%',
    height: 250,
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EAD8',
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22C55E',
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 5,
    lineHeight: 28,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  mrpText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  discountBadge: {
    marginLeft: 20,
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  discountText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationBadge: {
    backgroundColor: '#FFF8ED',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 15,
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    fontWeight: '600',
    color: '#0B1220',
    fontSize: 14,
  },
  descText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1EAD8',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomBarPriceInfo: {
    justifyContent: 'center',
  },
  bottomBarPriceLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: 'bold',
  },
  bottomBarPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
    marginTop: 2,
  },
  addCartBtn: {
    backgroundColor: '#22C55E',
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCartBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 50,
    height: 48,
    paddingHorizontal: 15,
  },
  stepBtn: {
    paddingHorizontal: 12,
  },
  stepBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  stepQty: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 8,
  },
});
