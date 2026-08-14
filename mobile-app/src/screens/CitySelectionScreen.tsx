import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, TextInput, StatusBar, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

interface CityItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

const KNOWN_CITIES: { [key: string]: { desc: string; icon: string } } = {
  'Mumbai': { desc: 'Active local hub & 4-hour delivery', icon: '🏙️' },
  'Pune': { desc: 'Active local hub & 4-hour delivery', icon: '🌆' },
  'Bengaluru': { desc: 'Coming soon - Order preview active', icon: '🌳' },
  'Delhi NCR': { desc: 'Coming soon - Order preview active', icon: '🏛️' },
  'Pan India': { desc: 'Deliver anywhere in India', icon: '🇮🇳' }
};

export default function CitySelectionScreen({ navigation }: any) {
  const { setCityAndArea } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/locations`);
        const data = await res.json();
        if (res.ok && data.success) {
          const uniqueCities = Array.from(new Set(data.locations.map((loc: any) => loc.city))) as string[];
          const citiesList: CityItem[] = [
            { id: 'pan-india', name: 'Pan India', desc: 'Deliver anywhere in India', icon: '🇮🇳' },
            ...uniqueCities.map(cName => ({
              id: cName.toLowerCase().replace(/\s+/g, '-'),
              name: cName,
              desc: KNOWN_CITIES[cName]?.desc || 'Active local hub & delivery active',
              icon: KNOWN_CITIES[cName]?.icon || '📍'
            }))
          ];
          setCities(citiesList);
        } else {
          // Fallback
          setCities([
            { id: 'pan-india', name: 'Pan India', desc: 'Deliver anywhere in India', icon: '🇮🇳' },
            { id: 'mumbai', name: 'Mumbai', desc: 'Active local hub & 4-hour delivery', icon: '🏙️' },
            { id: 'pune', name: 'Pune', desc: 'Active local hub & 4-hour delivery', icon: '🌆' }
          ]);
        }
      } catch (err) {
        setCities([
          { id: 'pan-india', name: 'Pan India', desc: 'Deliver anywhere in India', icon: '🇮🇳' },
          { id: 'mumbai', name: 'Mumbai', desc: 'Active local hub & 4-hour delivery', icon: '🏙️' },
          { id: 'pune', name: 'Pune', desc: 'Active local hub & 4-hour delivery', icon: '🌆' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  const handleCitySelect = async (city: string) => {
    if (city === 'Pan India') {
      await setCityAndArea('Pan India', 'All Areas');
      navigation.navigate('Shop');
    } else {
      await setCityAndArea(city, null);
      navigation.navigate('AreaSelection', { cityName: city });
    }
  };

  const filteredCities = cities.filter(c => 
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
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#22C55E" />
          </View>
        ) : (
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
