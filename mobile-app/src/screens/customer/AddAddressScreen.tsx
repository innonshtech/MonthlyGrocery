import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS } from '../../constants/theme';
import {
  CheckoutBackIcon,
  MapPinLargeIcon,
  TagHomeIcon,
  TagWorkIcon,
  TagOtherIcon,
} from '../../components/CheckoutFigmaIcons';
import {
  type AddressItem,
  saveUserAddress,
  cacheAddressesLocally,
} from '../../services/addressApi';

const SCREEN_BG = '#FBFAF6';
const MAP_BG = '#E8F0EA';

const TAG_OPTIONS = [
  { key: 'Home', Icon: TagHomeIcon },
  { key: 'Work', Icon: TagWorkIcon },
  { key: 'Other', Icon: TagOtherIcon },
] as const;

function defaultPhoneFromUser(mobile?: string): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export default function AddAddressScreen({ navigation, route }: any) {
  const { token, user } = useAuth();
  const editingAddress = route?.params?.editingAddress as AddressItem | undefined;
  const fromCheckout = route?.params?.fromCheckout;

  const [tag, setTag] = useState(editingAddress?.tag || 'Home');
  const [flat, setFlat] = useState(editingAddress?.flat || '');
  const [street, setStreet] = useState(editingAddress?.street || '');
  const [landmark, setLandmark] = useState(editingAddress?.landmark || '');
  const [pincode, setPincode] = useState(editingAddress?.pincode || '');
  const [phone, setPhone] = useState(
    editingAddress?.phone || defaultPhoneFromUser(user?.mobile),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) {
      Alert.alert('Login required', 'Please log in to save your delivery address.');
      return;
    }

    if (!flat.trim() || !street.trim() || !pincode.trim()) {
      Alert.alert('Incomplete details', 'Please fill flat/house, area/locality, and pincode.');
      return;
    }

    setSaving(true);
    try {
      const { address: savedAddr, addresses } = await saveUserAddress(token, {
        id: editingAddress?.id,
        tag,
        flat: flat.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
        isDefault: editingAddress?.isDefault,
      });

      await cacheAddressesLocally(addresses);

      if (fromCheckout) {
        navigation.navigate({
          name: 'Checkout',
          params: { selectedAddress: savedAddr },
          merge: true,
        });
        return;
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <CheckoutBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editingAddress ? 'Edit address' : 'Add address'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mapPreview}>
          <MapPinLargeIcon size={34} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>FLAT / HOUSE NO.</Text>
          <TextInput
            style={styles.input}
            value={flat}
            onChangeText={setFlat}
            placeholder="e.g. Flat 402, Green Meadows"
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>AREA / LOCALITY</Text>
          <TextInput
            style={styles.input}
            value={street}
            onChangeText={setStreet}
            placeholder="e.g. Paud Road, Kothrud, Pune"
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>LANDMARK (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Near hospital, school, etc."
            placeholderTextColor={COLORS.ink300}
          />
        </View>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>PINCODE</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="411038"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={COLORS.ink300}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>PHONE</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={COLORS.ink300}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>SAVE AS</Text>
          <View style={styles.tagRow}>
            {TAG_OPTIONS.map(({ key, Icon }) => {
              const selected = tag === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  onPress={() => setTag(key)}
                  activeOpacity={0.85}
                >
                  <Icon size={16} />
                  <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving…' : 'Save address'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.balooSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.ink900,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 14,
  },
  mapPreview: {
    height: 120,
    borderRadius: 14,
    backgroundColor: MAP_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...FONTS.muktaBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: COLORS.ink500,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...FONTS.muktaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  tagChipSelected: {
    borderColor: COLORS.green700,
    backgroundColor: COLORS.green50,
  },
  tagChipText: {
    ...FONTS.muktaSemiBold,
    fontSize: 13,
    color: COLORS.ink700,
  },
  tagChipTextSelected: {
    color: COLORS.green700,
  },
  bottomSafe: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.green700,
    borderRadius: 14,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...FONTS.balooSemiBold,
    fontSize: 15,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
