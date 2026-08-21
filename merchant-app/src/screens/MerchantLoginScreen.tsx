import React, { useState, useEffect } from 'react';
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
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import AppIcon from '../components/AppIcon';

export default function MerchantLoginScreen({ navigation }: any) {
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Mobile, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const { sendOtp, verifyOtp } = useMerchantAuth();

  useEffect(() => {
    let interval: any;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number');
      return;
    }
    setError('');
    setLoading(true);
    const res = await sendOtp(mobile);
    setLoading(false);
    if (res.success) {
      setStep(2);
      setResendTimer(30);
      setCanResend(false);
    } else {
      setError(res.error || 'Failed to send OTP. Please check server connection.');
    }
  };

  const handleVerifyOtp = async () => {
    if (code.length < 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setError('');
    setLoading(true);
    const res = await verifyOtp(mobile, code, name);
    setLoading(false);
    if (res.success) {
      navigation.replace('MerchantDashboard');
    } else {
      setError(res.error || 'Invalid OTP code. Please enter 123456 in dev mode.');
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setError('');
    setCode('');
    setResendTimer(30);
    setCanResend(false);
    handleSendOtp();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Top Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 32 }}>🏪</Text>
            </View>
            <Text style={styles.brandTitle}>MonthlyGrocery</Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>STORE PARTNER PORTAL</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.cardTitle}>Merchant Sign In</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your registered Kirana partner mobile number to access incoming orders and store inventory.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STORE MOBILE NUMBER</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryCode}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="9876543210"
                      placeholderTextColor="#64748B"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={(val) => {
                        setMobile(val.replace(/[^0-9]/g, ''));
                        if (error) setError('');
                      }}
                    />
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send Verification OTP ➔</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.helpBox}>
                  <Text style={styles.helpTitle}>Need store onboarding?</Text>
                  <Text style={styles.helpText}>
                    If your store is not yet whitelisted by Super Admin, please reach out to admin support for registration.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    setStep(1);
                    setCode('');
                    setError('');
                  }}
                >
                  <Text style={styles.backBtnText}>← Change Number (+91 {mobile})</Text>
                </TouchableOpacity>

                <Text style={styles.cardTitle}>Verify OTP</Text>
                <Text style={styles.cardSubtitle}>
                  Enter the 6-digit code sent to +91 {mobile}. (Dev code: <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>123456</Text>)
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ENTER 6-DIGIT OTP</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="••••••"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(val) => {
                      setCode(val.replace(/[^0-9]/g, ''));
                      if (error) setError('');
                    }}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STORE / OWNER NAME (OPTIONAL)</Text>
                  <TextInput
                    style={styles.textInputFull}
                    placeholder="e.g. Mahavir Grocery Store"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Access Dashboard ➔</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResend}>
                      <Text style={styles.resendLink}>Resend OTP Code</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.resendTimerText}>Resend available in {resendTimer}s</Text>
                  )}
                </View>
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
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  roleChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  roleChipText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  countryCodeBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  countryCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#CBD5E1',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textInputFull: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  otpInput: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 10,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: '#22C55E',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendLink: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  resendTimerText: {
    color: '#64748B',
    fontSize: 12,
  },
  helpBox: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  helpText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
});
