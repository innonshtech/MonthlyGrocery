import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileSetupScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const redirectTarget = route.params?.redirect || 'Shop';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    setSaving(true);
    // Mimic API save delay
    setTimeout(() => {
      setSaving(false);
      navigation.replace(redirectTarget);
    }, 1000);
  };

  const handleSkip = () => {
    navigation.replace(redirectTarget);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MonthlyGrocery!</Text>
          <Text style={styles.subtitle}>Let us know how to address you.</Text>
        </View>

        {/* Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Vaibhav Thorat"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={saving}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B1220',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F1EAD8',
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  actions: {
    gap: 15,
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    height: 52,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipBtn: {
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
