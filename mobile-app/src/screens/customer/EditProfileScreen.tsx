import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileScreen({ navigation }: any) {
  const { user, city, area } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      // Save profile updates locally
      const updatedUser = {
        ...user,
        name: name.trim(),
        email: email.trim(),
        altPhone: altPhone.trim(),
      };
      await AsyncStorage.setItem('@auth_user', JSON.stringify(updatedUser));
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'G'}
            </Text>
          </View>
          <Text style={styles.avatarName}>{name || 'Guest User'}</Text>
          <Text style={styles.avatarRole}>Customer Account</Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. John Doe"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Registered Mobile Number</Text>
          <View style={styles.readOnlyRow}>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={user?.mobile ? `+91 ${user.mobile.slice(2)}` : '+91 (Not Registered)'}
              editable={false}
            />
            <Text style={styles.verifiedBadge}>✓ Verified</Text>
          </View>

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. john@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Alternate Phone Number</Text>
          <TextInput
            style={styles.input}
            value={altPhone}
            onChangeText={setAltPhone}
            placeholder="e.g. 9876543210"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.inputLabel}>Active Delivery Location</Text>
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>📍 {area ? `${area}, ${city}` : 'No Area Configured'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CitySelection')}>
              <Text style={styles.changeLocText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile Details'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  container: {
    flex: 1,
    padding: 16,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  avatarRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
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
  readOnlyRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 12,
    fontSize: 11,
    color: '#16A34A',
    fontWeight: 'bold',
  },
  locationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  changeLocText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
