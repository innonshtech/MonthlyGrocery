import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart, Product } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

const { width } = Dimensions.get('window');

export default function MyMonthlyGroceryHub({ navigation }: any) {
  const { token, city, area } = useAuth();
  const { items, addToCart, clearCart } = useCart();

  const [savedBaskets, setSavedBaskets] = useState<any[]>([]);
  const [basketName, setBasketName] = useState('');
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // Preference and Breakdown States
  const [familySize, setFamilySize] = useState<number>(4);
  const [dietPreference, setDietPreference] = useState<string>('Veg');
  const [lastBasketCategories, setLastBasketCategories] = useState<any[]>([]);
  const [lastBasketTotal, setLastBasketTotal] = useState<number>(0);

  const loadSavedBaskets = async () => {
    try {
      const saved = await AsyncStorage.getItem('@saved_baskets');
      if (saved) {
        setSavedBaskets(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load saved baskets:', err);
    }
  };

  const fetchLastOrderBreakdown = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.orders.length > 0) {
        const latest = data.orders[0];
        
        // Fetch all products to know their categories
        const catRes = await fetch(`${API_BASE}/products/all?limit=300`);
        const catData = await catRes.json();
        const activeProds: Product[] = catData.success ? catData.products : [];
        const prodMap = new Map<string, Product>();
        activeProds.forEach(p => prodMap.set(p.id, p));

        const categorySum: { [key: string]: number } = {};
        let calculatedTotal = 0;

        latest.order_items.forEach((item: any) => {
          const matchedProd = prodMap.get(item.product_id);
          const category = matchedProd?.primary_category || 'Other Pantry';
          const lineTotal = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 1);
          
          categorySum[category] = (categorySum[category] || 0) + lineTotal;
          calculatedTotal += lineTotal;
        });

        const breakdownList = Object.keys(categorySum).map(catName => ({
          category: catName,
          amount: categorySum[catName]
        }));

        setLastBasketCategories(breakdownList);
        setLastBasketTotal(calculatedTotal);
      }
    } catch (err) {
      console.error('Failed to load last order breakdown:', err);
    }
  };

  useEffect(() => {
    loadSavedBaskets();
    fetchLastOrderBreakdown();
  }, [token]);

  // 1. Copy Last Month's Cart with catalog status check (Step 4.1)
  const handleCopyLastMonth = async () => {
    if (!token) {
      Alert.alert('Login Required', 'You need to sign in to copy your previous month\'s basket.', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login', { redirect: 'MyMonthlyGroceryHub' }) }
      ]);
      return;
    }

    try {
      // Fetch latest order
      const orderRes = await fetch(`${API_BASE}/orders/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success || orderData.orders.length === 0) {
        Alert.alert('No History', 'We couldn\'t find any previous orders for your profile. Try One-Click Monthly Cart instead!');
        return;
      }
      const latestOrder = orderData.orders[0];

      // Fetch active catalog to check stock and prices
      let url = `${API_BASE}/products/all?limit=300`;
      if (city) {
        url += `&city=${encodeURIComponent(city)}`;
      }
      if (area) {
        url += `&area_name=${encodeURIComponent(area)}`;
      }
      const catalogRes = await fetch(url);
      const catalogData = await catalogRes.json();
      if (!catalogRes.ok || !catalogData.success) {
        Alert.alert('Error', 'Failed to verify active catalog pricing.');
        return;
      }
      const activeProducts: Product[] = catalogData.products;
      const activeMap = new Map<string, Product>();
      activeProducts.forEach((p) => activeMap.set(p.id, p));

      const toAdd: { product: Product; qty: number }[] = [];
      const unavailableNames: string[] = [];
      let priceChangesCount = 0;

      for (const ordItem of latestOrder.order_items) {
        const activeProd = activeMap.get(ordItem.product_id);
        if (activeProd) {
          if (activeProd.price !== ordItem.unit_price) {
            priceChangesCount++;
          }
          toAdd.push({ product: activeProd, qty: ordItem.quantity });
        } else {
          unavailableNames.push(ordItem.products?.name || 'Unknown Item');
        }
      }

      // Populate cart
      clearCart();
      toAdd.forEach(({ product, qty }) => {
        for (let i = 0; i < qty; i++) {
          addToCart(product);
        }
      });

      if (unavailableNames.length > 0 || priceChangesCount > 0) {
        let msg = '';
        if (unavailableNames.length > 0) {
          msg += `⚠️ ${unavailableNames.length} item(s) are out of stock and were skipped:\n${unavailableNames.join(', ')}\n\n`;
        }
        if (priceChangesCount > 0) {
          msg += `🏷️ ${priceChangesCount} item(s) had price adjustments since last month. Cart has been updated with active catalog prices.`;
        }
        Alert.alert('Recreated with Adjustments', msg, [
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
        ]);
      } else {
        Alert.alert('Success', 'Recreated last month\'s basket in your active cart!', [
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve previous order details.');
    }
  };

  // 2. One-Click Monthly Cart with dynamic staples fallbacks (Step 4.2)
  const handleOneClickGenerate = async () => {
    try {
      let url = `${API_BASE}/products/all?limit=300`;
      if (city) {
        url += `&city=${encodeURIComponent(city)}`;
      }
      if (area) {
        url += `&area_name=${encodeURIComponent(area)}`;
      }
      const catalogRes = await fetch(url);
      const catalogData = await catalogRes.json();
      if (!catalogRes.ok || !catalogData.success) {
        Alert.alert('Error', 'Failed to load active catalog.');
        return;
      }
      const activeProducts: Product[] = catalogData.products;

      let historyItems: { product: Product; qty: number }[] = [];
      if (token) {
        const orderRes = await fetch(`${API_BASE}/orders/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const orderData = await orderRes.json();
        if (orderRes.ok && orderData.success && orderData.orders.length > 0) {
          const freqMap = new Map<string, { product: Product; qty: number }>();
          const activeMap = new Map<string, Product>();
          activeProducts.forEach((p) => activeMap.set(p.id, p));

          orderData.orders.forEach((ord: any) => {
            ord.order_items.forEach((item: any) => {
              const activeProd = activeMap.get(item.product_id);
              if (activeProd) {
                const existing = freqMap.get(item.product_id);
                if (existing) {
                  existing.qty += item.quantity;
                } else {
                  freqMap.set(item.product_id, { product: activeProd, qty: item.quantity });
                }
              }
            });
          });

          const sorted = Array.from(freqMap.values()).sort((a, b) => b.qty - a.qty);
          historyItems = sorted.slice(0, 8);
        }
      }

      clearCart();

      if (historyItems.length > 0) {
        historyItems.forEach(({ product, qty }) => {
          let scaleFactor = 1;
          if (familySize <= 2) scaleFactor = 1;
          else if (familySize <= 4) scaleFactor = 2;
          else scaleFactor = 3;

          const defaultQty = Math.min(qty, scaleFactor);
          for (let i = 0; i < defaultQty; i++) {
            addToCart(product);
          }
        });
        Alert.alert('Success', 'Generated dynamic basket based on your order history and family size!', [
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
        ]);
      } else {
        const keywords = ['atta', 'rice', 'oil', 'salt', 'sugar', 'ghee', 'tea', 'dal'];
        const staples: Product[] = [];
        for (const kw of keywords) {
          const found = activeProducts.find(
            (p) => p.name.toLowerCase().includes(kw) || p.primary_category.toLowerCase().includes(kw)
          );
          if (found && !staples.some((s) => s.id === found.id)) {
            staples.push(found);
          }
        }

        staples.slice(0, 6).forEach((p) => {
          let qty = 1;
          if (p.name.toLowerCase().includes('atta') || p.name.toLowerCase().includes('rice') || p.name.toLowerCase().includes('oil')) {
            if (familySize <= 2) qty = 1;
            else if (familySize <= 4) qty = 2;
            else qty = 3;
          }
          for (let i = 0; i < qty; i++) {
            addToCart(p);
          }
        });
        Alert.alert('Success', `Curated staples basket generated for a family of ${familySize}!`, [
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate monthly plan basket.');
    }
  };

  // 3. Saved Baskets template operations (Step 4.3)
  const handleSaveCurrentCart = () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your active cart is empty.');
      return;
    }
    setBasketName('');
    setSaveModalVisible(true);
  };

  const submitSaveBasket = async () => {
    const trimmed = basketName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a basket name.');
      return;
    }

    try {
      const newBasket = {
        id: Date.now().toString(),
        name: trimmed,
        items: items,
        date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      };

      const updated = [...savedBaskets, newBasket];
      await AsyncStorage.setItem('@saved_baskets', JSON.stringify(updated));
      setSavedBaskets(updated);
      setSaveModalVisible(false);
      Alert.alert('Success', `Saved basket "${trimmed}"!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to save basket.');
    }
  };

  const handleBasketAction = (basket: any) => {
    Alert.alert(
      basket.name,
      `Choose an action for this saved basket (${basket.items.reduce((sum: number, it: any) => sum + it.quantity, 0)} items):`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Merge with Active Cart', 
          onPress: () => {
            basket.items.forEach((it: any) => {
              for (let i = 0; i < it.quantity; i++) {
                addToCart(it.product);
              }
            });
            Alert.alert('Merged', 'Merged items into your active cart!', [
              { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
            ]);
          }
        },
        { 
          text: 'Replace Active Cart', 
          onPress: () => {
            clearCart();
            basket.items.forEach((it: any) => {
              for (let i = 0; i < it.quantity; i++) {
                addToCart(it.product);
              }
            });
            Alert.alert('Replaced', 'Active cart replaced with saved basket!', [
              { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
            ]);
          }
        },
        {
          text: 'Delete Basket',
          style: 'destructive',
          onPress: async () => {
            const updated = savedBaskets.filter((b) => b.id !== basket.id);
            await AsyncStorage.setItem('@saved_baskets', JSON.stringify(updated));
            setSavedBaskets(updated);
          }
        }
      ]
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
        <Text style={styles.headerTitle}>My Monthly Grocery</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>💡</Text>
          <Text style={styles.introTitle}>Digital Monthly Assistant</Text>
          <Text style={styles.introDesc}>
            Plan your pantry staples once, save on packaging and delivery fees, and enjoy peace-of-mind monthly restocking.
          </Text>
        </View>

        {/* Action 1: Copy Last Month's Cart */}
        <View style={styles.actionCard}>
          <Text style={styles.cardEmoji}>📋</Text>
          <Text style={styles.cardTitle}>Copy Last Month's Cart</Text>
          <Text style={styles.cardDesc}>
            Recreate your exact purchase list from your latest order with a single click. Adjust items or checkout instantly.
          </Text>

          {lastBasketCategories.length > 0 && (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Last Month Basket Breakdown</Text>
              {lastBasketCategories.map((item, idx) => (
                <View key={idx} style={styles.breakdownLine}>
                  <Text style={styles.breakdownLabel}>{item.category}</Text>
                  <Text style={styles.breakdownVal}>₹{item.amount}</Text>
                </View>
              ))}
              <View style={[styles.breakdownLine, { borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 6, paddingTop: 6 }]}>
                <Text style={[styles.breakdownLabel, { fontWeight: 'bold', color: '#1E293B' }]}>Total</Text>
                <Text style={[styles.breakdownVal, { fontWeight: 'bold', color: '#22C55E' }]}>₹{lastBasketTotal}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleCopyLastMonth}>
            <Text style={styles.btnText}>COPY LAST MONTH ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Action 2: One-Click Monthly Cart */}
        <View style={styles.actionCard}>
          <Text style={styles.cardEmoji}>⚡</Text>
          <Text style={styles.cardTitle}>One-Click Monthly Cart</Text>
          <Text style={styles.cardDesc}>
            Uses your order history, consumption pattern, and family settings to automatically recommend a curated staples basket.
          </Text>

          <View style={styles.prefContainer}>
            <Text style={styles.prefSectionTitle}>⚙️ Customize Cart Generator Settings</Text>
            
            <Text style={styles.prefLabel}>Family Size (Restock scale): <Text style={styles.prefHighlight}>{familySize} People</Text></Text>
            <View style={styles.prefRow}>
              {[2, 4, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.prefPill, familySize === num && styles.prefPillActive]}
                  onPress={() => setFamilySize(num)}
                >
                  <Text style={[styles.prefPillText, familySize === num && styles.prefPillTextActive]}>
                    {num === 2 ? 'Small (2)' : num === 4 ? 'Medium (4)' : 'Large (6+)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.prefLabel, { marginTop: 10 }]}>Diet Preference:</Text>
            <View style={styles.prefRow}>
              {['Veg', 'Non-Veg', 'All'].map((diet) => (
                <TouchableOpacity
                  key={diet}
                  style={[styles.prefPill, dietPreference === diet && styles.prefPillActive]}
                  onPress={() => setDietPreference(diet)}
                >
                  <Text style={[styles.prefPillText, dietPreference === diet && styles.prefPillTextActive]}>{diet}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleOneClickGenerate}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>CREATE MY MONTHLY CART</Text>
          </TouchableOpacity>
        </View>

        {/* Action 3: Saved Baskets List */}
        <View style={styles.savedBasketsCard}>
          <Text style={styles.sectionTitle}>Your Saved Baskets</Text>
          {savedBaskets.length === 0 ? (
            <Text style={styles.emptySavedText}>No saved baskets found. Save your current cart to reload it instantly later.</Text>
          ) : (
            savedBaskets.map((basket) => (
              <TouchableOpacity 
                key={basket.id}
                style={styles.basketItem}
                onPress={() => handleBasketAction(basket)}
              >
                <View style={styles.basketMeta}>
                  <Text style={styles.basketNameText}>{basket.name}</Text>
                  <Text style={styles.basketDateText}>{basket.items.reduce((sum: number, it: any) => sum + it.quantity, 0)} items · Saved {basket.date}</Text>
                </View>
                <Text style={styles.basketActionText}>Manage ➔</Text>
              </TouchableOpacity>
            ))
          )}

          {items.length > 0 && (
            <TouchableOpacity style={styles.saveCurrentBtn} onPress={handleSaveCurrentCart}>
              <Text style={styles.saveCurrentBtnText}>💾 Save Active Cart as Basket</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Save Basket Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={saveModalVisible}
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Current Basket</Text>
            <Text style={styles.modalSubtitle}>Give this monthly grocery template a name:</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Grandma's Kitchen Staples"
              value={basketName}
              onChangeText={setBasketName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]} 
                onPress={submitSaveBasket}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
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
  backBtn: {
    marginRight: 15,
  },
  backText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  container: {
    padding: 20,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  introEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  introDesc: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#22C55E',
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  btnTextSecondary: {
    color: '#22C55E',
  },
  savedBasketsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 15,
  },
  emptySavedText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    marginBottom: 15,
  },
  basketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  basketMeta: {
    flex: 1,
  },
  basketNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  basketDateText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  basketActionText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: 'bold',
  },
  saveCurrentBtn: {
    marginTop: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveCurrentBtnText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0B1220',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginLeft: 10,
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalBtnCancelText: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalBtnSave: {
    backgroundColor: '#22C55E',
  },
  modalBtnSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  breakdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  breakdownLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  prefContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  prefSectionTitle: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  prefLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  prefHighlight: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
  prefRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prefPill: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  prefPillActive: {
    backgroundColor: '#22C55E',
  },
  prefPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  prefPillTextActive: {
    color: '#fff',
  },
});
