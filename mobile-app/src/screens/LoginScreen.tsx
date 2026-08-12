import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [role, setRole] = useState<'consumer' | 'admin'>('consumer');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Enter mobile, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOtp, verifyOtp } = useAuth();

  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    const res = await sendOtp(mobile, role);
    setLoading(false);
    if (res.success) {
      setStep(2);
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (code.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setError('');
    setLoading(true);
    const res = await verifyOtp(mobile, code, name, role);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid OTP code');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>MonthlyGrocery</Text>
            <Text style={styles.subtitleText}>Ghar ka poora kirana, delivered.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.titleText}>Sign in / Sign up</Text>
            <Text style={styles.descText}>Enter your mobile number to continue.</Text>

            {step === 1 ? (
              <>
                {/* Role Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, role === 'consumer' && styles.tabActive]}
                    onPress={() => setRole('consumer')}
                  >
                    <Text style={[styles.tabText, role === 'consumer' && styles.tabTextActive]}>Consumer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, role === 'admin' && styles.tabActiveAdmin]}
                    onPress={() => setRole('admin')}
                  >
                    <Text style={[styles.tabText, role === 'admin' && styles.tabTextActive]}>Admin</Text>
                  </TouchableOpacity>
                </View>

                {role === 'admin' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      <Text style={{ fontWeight: 'bold' }}>Invite-only: </Text>
                      Admin portal is only accessible to whitelisted numbers.
                    </Text>
                  </View>
                )}

                {/* Mobile Input */}
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="9833833498"
                    keyboardType="numeric"
                    maxLength={10}
                    value={mobile}
                    onChangeText={(val) => setMobile(val.replace(/[^\d]/g, ''))}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* OTP input */}
                <Text style={styles.label}>OTP Verification Code</Text>
                <TextInput
                  style={[styles.inputSingle, styles.otpInput]}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  value={code}
                  onChangeText={(val) => setCode(val.replace(/[^\d]/g, ''))}
                />

                <Text style={styles.label}>Your Name (First time only)</Text>
                <TextInput
                  style={styles.inputSingle}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setStep(1);
                    setCode('');
                    setError('');
                  }}
                >
                  <Text style={styles.backButtonText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1220',
  },
  descText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1EAD8',
    borderRadius: 50,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 50,
  },
  tabActive: {
    backgroundColor: '#22C55E',
  },
  tabActiveAdmin: {
    backgroundColor: '#0B1220',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#0B1220',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    color: '#FCD34D',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1EAD8',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  prefix: {
    paddingLeft: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 10,
  },
  inputSingle: {
    borderWidth: 2,
    borderColor: '#F1EAD8',
    borderRadius: 12,
    height: 48,
    fontSize: 16,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 15,
  },
  otpInput: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#22C55E',
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 10,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
