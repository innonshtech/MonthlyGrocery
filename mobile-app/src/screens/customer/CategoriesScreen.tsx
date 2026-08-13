import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Dimensions, StatusBar } from 'react-native';

const CATEGORIES = [
  { id: 'cat1', name: 'Atta & Flour', emoji: '🌾', count: '12 items' },
  { id: 'cat2', name: 'Rice', emoji: '🍚', count: '8 items' },
  { id: 'cat3', name: 'Dal & Pulses', emoji: '🥜', count: '15 items' },
  { id: 'cat4', name: 'Oil & Ghee', emoji: '🧴', count: '10 items' },
  { id: 'cat5', name: 'Sugar & Salt', emoji: '🍬', count: '6 items' },
  { id: 'cat6', name: 'Spices & Masala', emoji: '🌶️', count: '24 items' },
  { id: 'cat7', name: 'Dry Fruits', emoji: '🌰', count: '14 items' },
  { id: 'cat8', name: 'Tea & Coffee', emoji: '☕', count: '18 items' },
  { id: 'cat9', name: 'Breakfast Products', emoji: '🥣', count: '11 items' },
  { id: 'cat10', name: 'Biscuits & Snacks', emoji: '🍪', count: '20 items' },
  { id: 'cat11', name: 'Beverages', emoji: '🥤', count: '15 items' },
  { id: 'cat12', name: 'Cleaning Products', emoji: '🧼', count: '16 items' },
  { id: 'cat13', name: 'Laundry', emoji: '🧺', count: '9 items' },
  { id: 'cat14', name: 'Kitchen Essentials', emoji: '🍽️', count: '12 items' },
  { id: 'cat15', name: 'Home Care', emoji: '🏠', count: '7 items' },
  { id: 'cat16', name: 'Personal Care', emoji: '🧴', count: '22 items' },
  { id: 'cat17', name: 'Baby Care', emoji: '🍼', count: '8 items' },
  { id: 'cat18', name: 'Health & Wellness', emoji: '💊', count: '13 items' },
  { id: 'cat19', name: 'Fruits & Vegetables', emoji: '🍎', count: '30 items' },
  { id: 'cat20', name: 'Dairy & Bakery', emoji: '🧀', count: '12 items' }
];

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 3;

export default function CategoriesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Categories</Text>
        <Text style={styles.headerSubtitle}>Select a category to browse products</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('CategoryProducts', { categoryName: item.name })}
          >
            <View style={styles.emojiBg}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.catCount}>{item.count}</Text>
          </TouchableOpacity>
        )}
      />
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
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gridContent: {
    padding: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    width: cardWidth,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1EAD8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  emojiBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFF8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 22,
  },
  catName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B1220',
    textAlign: 'center',
    height: 32,
    lineHeight: 15,
  },
  catCount: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
    fontWeight: '500',
  },
});
