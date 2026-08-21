import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

export interface SavedAddress {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  name: string;
  flat: string;
  street: string;
  landmark: string;
  city: string;
  area: string;
  pin: string;
  isDefault?: boolean;
}

export default function SavedAddressesScreen({ route, navigation }: any) {
  const { user, city: authCity, area: authArea } = useAuth();
  const selectMode = route.params?.selectMode || false;

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [tag, setTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [name, setName] = useState(user?.name || '');
  const [flat, setFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pin, setPin] = useState('');

  const loadAddresses = async () => {
    try {
      const saved = await AsyncStorage.getItem('@saved_user_addresses');
      if (saved) {
        setAddresses(JSON.parse(saved));
      } else {
        // Seed initial default if none exist
        const initialList: SavedAddress[] = [
          {
            id: 'addr_1',
            tag: 'Home',
            name: user?.name || 'My Household',
            flat: 'Flat 402, Royal Palms',
            street: 'Main High Street Road',
            landmark: 'Opposite Central Park',
            city: authCity || 'Pune',
            area: authArea || 'Kothrud',
            pin: '411038',
            isDefault: true,
          }
        ];
        setAddresses(initialList);
        await AsyncStorage.setItem('@saved_user_addresses', JSON.stringify(initialList));
      }
    } catch (err) {
      console.error('Failed to load saved addresses:', err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setTag('Home');
    setName(user?.name || '');
    setFlat('');
    setStreet('');
    setLandmark('');
    setPin('');
    setModalVisible(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setTag(addr.tag);
    setName(addr.name);
    setFlat(addr.flat);
    setStreet(addr.street);
    setLandmark(addr.landmark);
    setPin(addr.pin);
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!flat.trim() || !street.trim() || !landmark.trim() || !pin.trim()) {
      Alert.alert('Validation Error', 'Please fill in all address details.');
      return;
    }
    if (pin.trim().length !== 6 || isNaN(Number(pin.trim()))) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit PIN code.');
      return;
    }

    try {
      let updated: SavedAddress[];
      if (editingId) {
        updated = addresses.map((addr) =>
          addr.id === editingId
            ? {
                ...addr,
                tag,
                name: name.trim() || 'My Household',
                flat: flat.trim(),
                street: street.trim(),
                landmark: landmark.trim(),
                city: authCity || 'Pune',
                area: authArea || 'Local Area',
                pin: pin.trim(),
              }
            : addr
        );
      } else {
        const newAddr: SavedAddress = {
          id: `addr_${Date.now()}`,
          tag,
          name: name.trim() || 'My Household',
          flat: flat.trim(),
          street: street.trim(),
          landmark: landmark.trim(),
          city: authCity || 'Pune',
          area: authArea || 'Local Area',
          pin: pin.trim(),
          isDefault: addresses.length === 0,
        };
        updated = [...addresses, newAddr];
      }

      setAddresses(updated);
      await AsyncStorage.setItem('@saved_user_addresses', JSON.stringify(updated));
      setModalVisible(false);
      Alert.alert('Success', editingId ? 'Address updated successfully.' : 'New address saved.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save address.');
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = addresses.filter((a) => a.id !== id);
          setAddresses(updated);
          await AsyncStorage.setItem('@saved_user_addresses', JSON.stringify(updated));
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    await AsyncStorage.setItem('@saved_user_addresses', JSON.stringify(updated));
  };

  const getTagEmoji = (t: string) => {
    switch (t) {
      case 'Home': return '🏠';
      case 'Work': return '🏢';
      default: return '📍';
    }
  };

  const renderAddressCard = ({ item }: { item: SavedAddress }) => (
    <View style={[styles.card, item.isDefault && styles.cardDefault]}>
      <View style={styles.cardHeader}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagEmoji}>{getTagEmoji(item.tag)}</Text>
          <Text style={styles.tagText}>{item.tag.toUpperCase()}</Text>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      <Text style={styles.recipientName}>{item.name}</Text>
      <Text style={styles.addressLine}>{item.flat}, {item.street}</Text>
      <Text style={styles.landmarkLine}>Landmark: {item.landmark}</Text>
      <Text style={styles.cityPinLine}>{item.area}, {item.city} - {item.pin}</Text>

      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item.id)}>
            <Text style={styles.actionBtnText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteAddress(item.id)}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.headerAddBtn}>
          <Text style={styles.headerAddText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptyDesc}>Save your home or office address for fast, 1-click checkout.</Text>
          <TouchableOpacity style={styles.addAddressBtn} onPress={openAddModal}>
            <Text style={styles.addAddressBtnText}>+ Add New Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddressCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity style={styles.footerAddBtn} onPress={openAddModal}>
              <Text style={styles.footerAddBtnText}>+ Add Another Address</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add Delivery Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Address Tag Selector */}
              <Text style={styles.inputLabel}>Address Tag</Text>
              <View style={styles.tagRow}>
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagPill, tag === t && styles.tagPillActive]}
                    onPress={() => setTag(t)}
                  >
                    <Text style={[styles.tagPillText, tag === t && styles.tagPillTextActive]}>
                      {getTagEmoji(t)} {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Recipient / Household Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe / Family Pantry"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>House / Flat / Building No *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Flat 402, Building B"
                value={flat}
                onChangeText={setFlat}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Apartment / Street / Society *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Green Valley Society, MG Road"
                value={street}
                onChangeText={setStreet}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Landmark *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Near City Hospital"
                value={landmark}
                onChangeText={setLandmark}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>PIN Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit PIN code (e.g. 411038)"
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#94A3B8"
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAddress}>
                <Text style={styles.modalSaveText}>Save Address</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerAddBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerAddText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardDefault: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#334155',
  },
  defaultBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  landmarkLine: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cityPinLine: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  deleteBtn: {
    marginLeft: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  footerAddBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  footerAddBtnText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  addAddressBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  addAddressBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  tagPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagPillActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tagPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
