import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppIcon from '../components/AppIcon';
import {
  OnboardingBackButton,
  OnboardingPrimaryButton,
} from '../components/onboarding/OnboardingUI';
import { COLORS, RADIUS } from '../constants/theme';

export default function ProfileSetupScreen({ route, navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const redirectTarget = route.params?.redirect || 'Shop';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Name required',
        'Please enter your name to personalize your monthly grocery.'
      );
      return;
    }
    setSaving(true);
    try {
      await AsyncStorage.setItem('@user_display_name', name.trim());
      if (email.trim()) {
        await AsyncStorage.setItem('@user_email', email.trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      navigation.replace(redirectTarget);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.main}>
          <OnboardingBackButton
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
          />

          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <AppIcon name="user" size={44} color={COLORS.green700} />
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.mainTitle}>What should we call you?</Text>
              <Text style={styles.subtitle}>
                We'll use this to personalise your monthly grocery.
              </Text>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>YOUR NAME</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="Aarti Sharma"
                placeholderTextColor={COLORS.ink300}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>EMAIL (OPTIONAL)</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="aarti.sharma@email.com"
                placeholderTextColor={COLORS.ink300}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <OnboardingPrimaryButton
            label="Start shopping"
            onPress={handleSave}
            disabled={!name.trim()}
            loading={saving}
            showArrow
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  flex: { flex: 1 },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.green50,
    borderWidth: 2,
    borderColor: COLORS.green100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: { fontSize: 13 },
  headerBlock: {
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink900,
    letterSpacing: -0.26,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.ink500,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink500,
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: COLORS.ink900,
    padding: 0,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
});
