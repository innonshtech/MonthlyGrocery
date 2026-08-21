import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

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
  phone?: string;
  isDefault?: boolean;
}

export default function SavedAddressesScreen({ route, navigation }: any) {
  const { user, city: authCity, area: authArea } = useAuth();
  const selectMode = route?.params?.selectMode !== false; // default true for checkout flow
  const currentSelectedId = route?.params?.selectedAddress?.id || 'addr_1';

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string>(currentSelectedId);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states (E3)
  const [tag, setTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flat, setFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pin, setPin] = useState('411038');
  const [phone, setPhone] = useState('');

  const loadAddresses = async () => {
    try {
      const saved = await AsyncStorage.getItem('@saved_user_addresses');
      if (saved) {
        setAddresses(JSON.parse(saved));
      } else {
        const initialList: SavedAddress[] = [
          {
            id: 'addr_1',
            tag: 'Home',
            name: user?.name || 'Aarav Sharma',
            flat: 'Flat 402, Green Acres',
            street: 'Paud Road, Kothrud',
            landmark: 'Near Gandhi Bhavan',
            city: authCity || 'Pune',
            area: authArea || 'Kothrud',
            pin: '411038',
            phone: '98765 43210',
            isDefault: true,
          },
          {
            id: 'addr_2',
            tag: 'Work',
            name: user?.name || 'Aarav Sharma',
            flat: 'Tower B, 6th Floor, Tech Park',
            street: 'Hinjewadi Phase 1',
            landmark: 'Opposite Wipro Circle',
            city: authCity || 'Pune',
            area: 'Hinjewadi',
            pin: '411057',
            phone: '98765 43210',
            isDefault: false,
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

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedId(addr.id);
    if (selectMode) {
      navigation.navigate('Checkout', { selectedAddress: addr });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setTag('Home');
    setFlat('');
    setStreet('');
    setLandmark('');
    setPin('411038');
    setPhone(user?.mobile || (user as any)?.phone || '98765 43210');
    setModalVisible(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setTag(addr.tag);
    setFlat(addr.flat);
    setStreet(addr.street);
    setLandmark(addr.landmark);
    setPin(addr.pin);
    setPhone(addr.phone || '98765 43210');
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!flat.trim() || !street.trim() || !pin.trim()) {
      Alert.alert('Required Fields', 'Please fill in house/flat number, street name, and pincode.');
      return;
    }

    let updated: SavedAddress[];
    if (editingId) {
      updated = addresses.map((a) =>
        a.id === editingId
          ? {
              ...a,
              tag,
              flat: flat.trim(),
              street: street.trim(),
              landmark: landmark.trim(),
              pin: pin.trim(),
              phone: phone.trim(),
            }
          : a
      );
    } else {
      const newAddr: SavedAddress = {
        id: `addr_${Date.now()}`,
        tag,
        name: user?.name || 'Aarav Sharma',
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        city: authCity || 'Pune',
        area: authArea || 'Kothrud',
        pin: pin.trim(),
        phone: phone.trim(),
        isDefault: addresses.length === 0,
      };
      updated = [newAddr, ...addresses];
      setSelectedId(newAddr.id);
    }

    setAddresses(updated);
    await AsyncStorage.setItem('@saved_user_addresses', JSON.stringify(updated));
    setModalVisible(false);

    if (selectMode && updated.length > 0) {
      const selected = updated.find((a) => a.id === (editingId || updated[0].id)) || updated[0];
      navigation.navigate('Checkout', { selectedAddress: selected });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =========================================================================
         1. TOP HEADER (E2)
         ========================================================================= */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery address</Text>
      </View>

      <View style={styles.content}>
        {/* =========================================================================
           2. ADD NEW ADDRESS BUTTON CARD (E2)
           ========================================================================= */}
        <TouchableOpacity
          style={styles.addNewCard}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <View style={styles.addIconCircle}>
            <Text style={styles.addPlusIcon}>+</Text>
          </View>
          <Text style={styles.addNewText}>Add new address</Text>
        </TouchableOpacity>

        {/* =========================================================================
           3. SAVED ADDRESSES LIST (E2)
           ========================================================================= */}
        <Text style={styles.sectionHeading}>SAVED ADDRESSES</Text>

        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isSelected = selectedId === item.id;

            return (
              <TouchableOpacity
                style={[
                  styles.addressCard,
                  isSelected && styles.addressCardSelected
                ]}
                onPress={() => handleSelectAddress(item)}
                activeOpacity={0.85}
              >
                {/* Radio Circle */}
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                {/* Info */}
                <View style={styles.addressInfo}>
                  <View style={styles.tagRow}>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{item.tag}</Text>
                    </View>
                    {item.isDefault && (
                      <Text style={styles.defaultLabel}>Default</Text>
                    )}
                  </View>

                  <Text style={styles.addressLine} numberOfLines={2}>
                    {item.flat}, {item.street}
                  </Text>
                  {item.landmark ? (
                    <Text style={styles.landmarkLine}>{item.landmark}</Text>
                  ) : null}
                  <Text style={styles.cityPinLine}>
                    {item.city}, Maharashtra {item.pin}
                  </Text>
                  {item.phone ? (
                    <Text style={styles.phoneLine}>Phone: {item.phone}</Text>
                  ) : null}
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      {/* =========================================================================
         4. ADD / EDIT ADDRESS MODAL SHEET (E3)
         ========================================================================= */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />

          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingId ? 'Edit address' : 'Add new address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              {/* Tag Selector */}
              <Text style={styles.fieldLabel}>Save address as</Text>
              <View style={styles.tagSelectorRow}>
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagPill, tag === t && styles.tagPillActive]}
                    onPress={() => setTag(t)}
                  >
                    <Text style={[styles.tagPillText, tag === t && styles.tagPillTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Flat / Building */}
              <Text style={styles.fieldLabel}>Flat, House No., Building Name *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Flat 402, Green Acres"
                placeholderTextColor={COLORS.ink300}
                value={flat}
                onChangeText={setFlat}
              />

              {/* Street / Area */}
              <Text style={styles.fieldLabel}>Street, Society or Area *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Paud Road, Kothrud"
                placeholderTextColor={COLORS.ink300}
                value={street}
                onChangeText={setStreet}
              />

              {/* Landmark */}
              <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Near Gandhi Bhavan"
                placeholderTextColor={COLORS.ink300}
                value={landmark}
                onChangeText={setLandmark}
              />

              {/* Pin & Phone Row */}
              <View style={styles.dualFieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Pincode *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="411038"
                    placeholderTextColor={COLORS.ink300}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={pin}
                    onChangeText={setPin}
                  />
                </View>

                <View style={{ flex: 1.2 }}>
                  <Text style={styles.fieldLabel}>Contact Phone</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="98765 43210"
                    placeholderTextColor={COLORS.ink300}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Save CTA */}
              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={handleSaveAddress}
                activeOpacity={0.85}
              >
                <Text style={styles.saveAddressBtnText}>
                  {editingId ? 'Save changes' : 'Save address & proceed'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnText: {
    fontSize: 30,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink900,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.green600,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlusIcon: {
    fontSize: 18,
    color: COLORS.green700,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green700,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 28,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  addressCardSelected: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.surface,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: COLORS.ink300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: COLORS.green700,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green700,
  },
  addressInfo: {
    flex: 1,
    paddingRight: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tagBadge: {
    backgroundColor: COLORS.green50,
    borderWidth: 1,
    borderColor: COLORS.green100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green700,
  },
  defaultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink500,
  },
  addressLine: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink900,
    lineHeight: 18,
    marginBottom: 2,
  },
  landmarkLine: {
    fontSize: 12,
    color: COLORS.ink500,
    marginBottom: 2,
  },
  cityPinLine: {
    fontSize: 12.5,
    color: COLORS.ink700,
    marginBottom: 4,
  },
  phoneLine: {
    fontSize: 11.5,
    color: COLORS.ink500,
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  separator: {
    height: 12,
  },
  /* Modal Sheet (E3) */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
  },
  closeBtnText: {
    fontSize: 16,
    color: COLORS.ink500,
    fontWeight: 'bold',
    padding: 4,
  },
  sheetScroll: {
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink700,
    marginBottom: 6,
    marginTop: 8,
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  tagPill: {
    flex: 1,
    height: 38,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagPillActive: {
    backgroundColor: COLORS.green700,
    borderColor: COLORS.green700,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  tagPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputField: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.ink900,
    marginBottom: 8,
  },
  dualFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveAddressBtn: {
    backgroundColor: COLORS.green700,
    height: 52,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  saveAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
