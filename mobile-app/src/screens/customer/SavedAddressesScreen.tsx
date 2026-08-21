import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export interface AddressItem {
  id: string;
  tag: string;
  flat: string;
  street: string;
  landmark?: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: 'addr-1',
    tag: 'Home',
    flat: 'Flat 402, Green Acres',
    street: 'Paud Road, Kothrud, Pune',
    pincode: '411038',
    phone: '9876543210',
    isDefault: true,
  },
  {
    id: 'addr-2',
    tag: 'Work',
    flat: '4th Floor, Tech Center',
    street: 'Magarpatta Road, Pune',
    pincode: '411028',
    phone: '9876543210',
    isDefault: false,
  },
  {
    id: 'addr-3',
    tag: "Mom's House",
    flat: 'Bungalow 17',
    street: 'Samarth Nagar, Pune',
    pincode: '411004',
    phone: '9876543210',
    isDefault: false,
  }
];

export default function SavedAddressesScreen({ navigation, route }: any) {
  const [addresses, setAddresses] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [selectedId, setSelectedId] = useState<string>('addr-1');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tag, setTag] = useState('Home');
  const [flat, setFlat] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('411038');
  const [phone, setPhone] = useState('9876543210');

  useEffect(() => {
    const loadStoredAddresses = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) setAddresses(parsed);
        }
      } catch (err) {}
    };
    loadStoredAddresses();
  }, []);

  const saveToStorage = async (newList: AddressItem[]) => {
    setAddresses(newList);
    try {
      await AsyncStorage.setItem('@user_addresses', JSON.stringify(newList));
    } catch (err) {}
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTag('Home');
    setFlat('');
    setStreet('');
    setLandmark('');
    setPincode('411038');
    setPhone('9876543210');
    setModalVisible(true);
  };

  const handleOpenEdit = (addr: AddressItem) => {
    setEditingId(addr.id);
    setTag(addr.tag);
    setFlat(addr.flat);
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setPincode(addr.pincode);
    setPhone(addr.phone);
    setModalVisible(true);
  };

  const handleDelete = (addrId: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = addresses.filter((a) => a.id !== addrId);
          saveToStorage(updated);
        }
      }
    ]);
  };

  const handleSaveModal = () => {
    if (!flat.trim() || !street.trim() || !pincode.trim()) {
      Alert.alert('Incomplete Details', 'Please fill in flat/house, area/street, and pincode.');
      return;
    }

    if (editingId) {
      const updated = addresses.map((a) =>
        a.id === editingId
          ? { ...a, tag, flat: flat.trim(), street: street.trim(), landmark: landmark.trim(), pincode: pincode.trim(), phone: phone.trim() }
          : a
      );
      saveToStorage(updated);
    } else {
      const newAddr: AddressItem = {
        id: `addr-${Date.now()}`,
        tag,
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
        isDefault: addresses.length === 0,
      };
      saveToStorage([...addresses, newAddr]);
    }

    setModalVisible(false);
  };

  const handleSelectAddress = (addr: AddressItem) => {
    setSelectedId(addr.id);
    if (route.params?.onSelect) {
      route.params.onSelect(addr);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved addresses</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Addresses List */}
        {addresses.map((addr) => {
          const isHome = addr.tag.toLowerCase() === 'home';

          return (
            <View key={addr.id} style={styles.addressCard}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleSelectAddress(addr)}
                activeOpacity={0.8}
              >
                {/* Tag Badge */}
                <View style={[styles.tagBadge, isHome ? styles.homeTagBadge : styles.grayTagBadge]}>
                  <Text style={[styles.tagBadgeText, isHome ? styles.homeTagText : styles.grayTagText]}>
                    {addr.tag}
                  </Text>
                </View>

                {/* Full Address Text */}
                <Text style={styles.addressLineText}>
                  {addr.flat}, {addr.street} — {addr.pincode}
                </Text>
              </TouchableOpacity>

              {/* Action Buttons: Edit & Delete */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleOpenEdit(addr)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.editActionEmoji}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleDelete(addr.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="trash" size={16} color={COLORS.ink500} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Add New Address Dashed Button */}
        <TouchableOpacity
          style={styles.addDashedBtn}
          onPress={handleOpenAdd}
          activeOpacity={0.85}
        >
          <Text style={styles.addDashedText}>+ Add a new address</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* =========================================================================
         ADD / EDIT ADDRESS MODAL SHEET (G3 DOWN SLIDE)
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

            <Text style={styles.sheetTitle}>
              {editingId ? 'Edit Address' : 'Add New Address'}
            </Text>

            {/* Tag Selection */}
            <Text style={styles.fieldLabel}>Save as</Text>
            <View style={styles.tagOptionsRow}>
              {['Home', 'Work', 'Other'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagSelectPill, tag === t && styles.tagSelectPillActive]}
                  onPress={() => setTag(t)}
                >
                  <Text style={[styles.tagSelectText, tag === t && styles.tagSelectTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Flat / House No */}
            <Text style={styles.fieldLabel}>Flat / House No / Building</Text>
            <TextInput
              style={styles.sheetInput}
              value={flat}
              onChangeText={setFlat}
              placeholder="e.g. Flat 402, Green Acres"
              placeholderTextColor={COLORS.ink300}
            />

            {/* Street / Area */}
            <Text style={styles.fieldLabel}>Area / Street / Society</Text>
            <TextInput
              style={styles.sheetInput}
              value={street}
              onChangeText={setStreet}
              placeholder="e.g. Paud Road, Kothrud, Pune"
              placeholderTextColor={COLORS.ink300}
            />

            {/* Pincode & Landmark Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="411038"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.ink300}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.fieldLabel}>Landmark (optional)</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Near temple"
                  placeholderTextColor={COLORS.ink300}
                />
              </View>
            </View>

            {/* Save Address Button */}
            <TouchableOpacity
              style={styles.saveSheetBtn}
              onPress={handleSaveModal}
              activeOpacity={0.85}
            >
              <Text style={styles.saveSheetBtnText}>Save address</Text>
            </TouchableOpacity>
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
  },
  /* Address Card */
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    marginBottom: 8,
  },
  homeTagBadge: {
    backgroundColor: COLORS.green50,
  },
  homeTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.green700,
  },
  grayTagBadge: {
    backgroundColor: '#F3F4F6',
  },
  grayTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink700,
  },
  tagBadgeText: {
    textTransform: 'uppercase',
  },
  addressLineText: {
    fontSize: 13.5,
    color: COLORS.ink900,
    lineHeight: 18,
    paddingRight: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  iconBtn: {
    padding: 4,
  },
  editActionEmoji: {
    fontSize: 14,
  },
  addDashedBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.green700,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.surface,
  },
  addDashedText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.green700,
  },
  /* Modal Sheet */
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
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink900,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink700,
    marginBottom: 6,
  },
  tagOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tagSelectPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  tagSelectPillActive: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green50,
  },
  tagSelectText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink700,
  },
  tagSelectTextActive: {
    color: COLORS.green700,
  },
  sheetInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: COLORS.ink900,
    marginBottom: 12,
  },
  saveSheetBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveSheetBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
