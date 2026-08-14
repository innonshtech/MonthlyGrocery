import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, TextInput, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

export default function AreaSelectionScreen({ route, navigation }: any) {
  const { setCityAndArea } = useAuth();
  const { cityName } = route.params || { cityName: 'Mumbai' };
  const [searchQuery, setSearchQuery] = useState('');
  const [notServiceableMode, setNotServiceableMode] = useState(false);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  const [areas, setAreas] = useState<{ id: string; name: string; serviceable: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/locations`);
        const data = await res.json();
        if (res.ok && data.success) {
          const matched = data.locations.filter((loc: any) => loc.city.toLowerCase() === cityName.toLowerCase());
          const mapped = matched.map((loc: any) => ({
            id: loc.id,
            name: loc.area_name,
            serviceable: loc.is_serviceable
          }));
          // Add default fallback other areas
          mapped.push({
            id: `other-${Date.now()}`,
            name: `Other ${cityName} Areas (Not Serviceable)`,
            serviceable: false
          });
          setAreas(mapped);
        } else {
          // Fallback
          setAreas([
            { id: 'fall-1', name: 'Main Sector', serviceable: true },
            { id: 'fall-2', name: 'Other Sector (Not Serviceable)', serviceable: false }
          ]);
        }
      } catch (err) {
        setAreas([
          { id: 'fall-1', name: 'Main Sector', serviceable: true },
          { id: 'fall-2', name: 'Other Sector (Not Serviceable)', serviceable: false }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, [cityName]);

  const handleAreaSelect = async (area: { name: string; serviceable: boolean }) => {
    setSelectedAreaName(area.name);
    if (area.serviceable) {
      await setCityAndArea(cityName, area.name);
      navigation.navigate('Shop');
    } else {
      setNotServiceableMode(true);
    }
  };

  const handleNotifyMe = () => {
    Alert.alert('Subscribed', `We will notify you as soon as MonthlyGrocery goes live in ${selectedAreaName}!`);
    setNotServiceableMode(false);
    navigation.navigate('CitySelection');
  };

  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (notServiceableMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.notServiceableContainer}>
          <Text style={styles.sadEmoji}>📍❌</Text>
          <Text style={styles.notServiceableTitle}>Area Not Serviceable</Text>
          <Text style={styles.notServiceableDesc}>
            MonthlyGrocery is not active in <Text style={{ fontWeight: 'bold', color: '#0B1220' }}>{selectedAreaName}, {cityName}</Text> yet.
          </Text>
          <Text style={styles.notServiceableSubdesc}>
            We require high cluster density to optimize wholesale pricing and 4-hour delivery runs.
          </Text>

          <TouchableOpacity style={styles.notifyBtn} onPress={handleNotifyMe}>
            <Text style={styles.notifyBtnText}>Notify Me When Launching</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.changeBtn} 
            onPress={() => {
              setNotServiceableMode(false);
              navigation.navigate('CitySelection');
            }}
          >
            <Text style={styles.changeBtnText}>Change City / Area</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Select City</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Area</Text>
          <Text style={styles.subtitle}>Select your locality in {cityName} for precise delivery rates.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for locality/sector..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Area list */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#22C55E" />
          </View>
        ) : (
          <FlatList
            data={filteredAreas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.areaCard}
                onPress={() => handleAreaSelect(item)}
              >
                <Text style={styles.areaName}>{item.name}</Text>
                {!item.serviceable && (
                  <Text style={styles.badgeUnserviceable}>Not Serviceable</Text>
                )}
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
    paddingTop: 15,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    marginBottom: 15,
  },
  backText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1EAD8',
  },
  areaName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1220',
    flex: 1,
  },
  badgeUnserviceable: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
    backgroundColor: '#EF444415',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 10,
  },
  arrow: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: 'bold',
  },
  notServiceableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  sadEmoji: {
    fontSize: 50,
    marginBottom: 20,
  },
  notServiceableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1220',
    letterSpacing: -0.5,
  },
  notServiceableDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  notServiceableSubdesc: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 15,
    marginBottom: 40,
  },
  notifyBtn: {
    backgroundColor: '#22C55E',
    height: 52,
    width: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  notifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeBtn: {
    borderWidth: 2,
    borderColor: '#0B1220',
    height: 48,
    width: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBtnText: {
    color: '#0B1220',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
