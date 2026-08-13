import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, TextInput, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';

const CITIES = [
  { id: 'pan-india', name: 'Pan India', desc: 'Deliver anywhere in India', icon: '🇮🇳' },
  { id: 'mumbai', name: 'Mumbai', desc: 'Active local hub & 4-hour delivery', icon: '🏙️' },
  { id: 'pune', name: 'Pune', desc: 'Active local hub & 4-hour delivery', icon: '🌆' },
  { id: 'bengaluru', name: 'Bengaluru', desc: 'Coming soon - Order preview active', icon: '🌳' },
  { id: 'delhi', name: 'Delhi NCR', desc: 'Coming soon - Order preview active', icon: '🏛️' }
];

export default function CitySelectionScreen({ navigation }: any) {
  const { setCityAndArea } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCitySelect = async (city: string) => {
    if (city === 'Pan India') {
      await setCityAndArea('Pan India', 'All Areas');
      navigation.navigate('Landing');
    } else {
      // Set city, and reset area first, then go to AreaSelection
      await setCityAndArea(city, null);
      navigation.navigate('AreaSelection', { cityName: city });
    }
  };

  const filteredCities = CITIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select City</Text>
          <Text style={styles.subtitle}>Prices and item availability vary by city.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for your city..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* City list */}
        <FlatList
          data={filteredCities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.cityCard}
              onPress={() => handleCitySelect(item.name)}
            >
              <View style={styles.cityIconBg}>
                <Text style={styles.cityIcon}>{item.icon}</Text>
              </View>
              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>{item.name}</Text>
                <Text style={styles.cityDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.arrow}>➔</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8ED',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B1220',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  searchBar: {
    marginBottom: 20,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F1EAD8',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1EAD8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  cityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cityIcon: {
    fontSize: 22,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  cityDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  arrow: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
