import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import AppIcon from '../../components/AppIcon';
import { COLORS, RADIUS } from '../../constants/theme';

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || 'Aarav Sharma');
  const [phone, setPhone] = useState(user?.mobile || '9876543210');
  const [email, setEmail] = useState('aarav.sharma@email.com');
  const [saving, setSaving] = useState(false);

  const initialLetter = name.trim().charAt(0).toUpperCase() || 'A';
  const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone}`;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    await updateUser({ name: name.trim() });
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 400);
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
        <Text style={styles.headerTitle}>Edit profile</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Center Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{initialLetter}</Text>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Photo', 'Camera / Gallery picker')}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Full Name */}
        <Text style={styles.fieldLabel}>Full name</Text>
        <TextInput
          style={styles.inputField}
          value={name}
          onChangeText={setName}
          placeholder="Enter full name"
          placeholderTextColor={COLORS.ink300}
        />

        {/* 2. Phone Number with Verified Badge */}
        <Text style={styles.fieldLabel}>Phone number</Text>
        <View style={styles.phoneInputWrap}>
          <TextInput
            style={styles.phoneInput}
            value={formattedPhone}
            editable={false}
          />
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
          </View>
        </View>

        {/* 3. Email (optional) */}
        <Text style={styles.fieldLabel}>Email (optional)</Text>
        <TextInput
          style={styles.inputField}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          placeholderTextColor={COLORS.ink300}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Delete Account Link */}
        <TouchableOpacity
          style={styles.deleteLinkRow}
          onPress={() => navigation.navigate('DeleteAccount')}
          activeOpacity={0.8}
        >
          <AppIcon name="trash" size={16} color="#DC2626" />
          <Text style={styles.deleteLinkText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.green700,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green700,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink700,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink900,
    marginBottom: 18,
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink700,
  },
  verifiedBadge: {
    backgroundColor: COLORS.green50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.green700,
  },
  deleteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  saveBtn: {
    backgroundColor: COLORS.green700,
    height: 50,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
