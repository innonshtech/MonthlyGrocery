import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../constants/theme';

export default function ProfileSetupScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const redirectTarget = route.params?.redirect || 'Shop';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name to personalize your grocery plan.');
      return;
    }
    setSaving(true);
    try {
      await AsyncStorage.setItem('@user_display_name', name.trim());
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      navigation.replace(redirectTarget);
    }
  };

  const handleSkip = () => {
    navigation.replace(redirectTarget);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Top Bar with Back Arrow */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            style={styles.backArrowBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.mainTitle}>What should we call you?</Text>
          <Text style={styles.subtitle}>
            This helps us personalise your monthly grocery.
          </Text>
        </View>

        {/* Input Form Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your name</Text>
          <View style={styles.nameInputCard}>
            <TextInput
              style={styles.nameInput}
              placeholder="Aarav Sharma"
              placeholderTextColor={COLORS.ink300}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[
              styles.startShoppingBtn,
              name.trim().length > 0 ? styles.btnActive : styles.btnDisabled
            ]}
            onPress={handleSave}
            disabled={saving || !name.trim()}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startShoppingBtnText}>Start shopping</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtnWrap} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper, // Warm Paper #FAF9F5
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: 16,
  },
  backArrowBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.ink900,
    lineHeight: 34,
  },
  headerBlock: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.ink900, // #17251E
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.ink500, // #6B7772
    lineHeight: 20,
  },
  inputSection: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink700, // #3D4A44
    marginBottom: 8,
  },
  nameInputCard: {
    backgroundColor: COLORS.surface, // #FFFFFF
    borderWidth: 1.5,
    borderColor: COLORS.line, // #EAE9E2
    borderRadius: RADIUS.md, // 12px
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink900,
    padding: 0,
  },
  bottomArea: {
    gap: 16,
    alignItems: 'center',
  },
  startShoppingBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.pill, // 999px
    backgroundColor: COLORS.green700, // #1E7A46
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: {
    opacity: 1,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  startShoppingBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipBtnWrap: {
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13,
    color: COLORS.ink500,
    fontWeight: '500',
  },
});
