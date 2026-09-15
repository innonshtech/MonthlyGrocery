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
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

export default function MerchantLoginScreen({ navigation: _navigation }: any) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login States
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Mobile, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Registration States
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regCity, setRegCity] = useState('Pune');
  const [regArea, setRegArea] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regLat, setRegLat] = useState<number | null>(null);
  const [regLng, setRegLng] = useState<number | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

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
    if (!res.success) {
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

  // Live GPS Capture for Registration
  const handleDetectGps = async () => {
    setDetectingGps(true);
    setError('');
    try {
      const nav = (globalThis as any)?.navigator;
      if (nav && nav.geolocation && typeof nav.geolocation.getCurrentPosition === 'function') {
        nav.geolocation.getCurrentPosition(
          (pos: any) => {
            const lat = parseFloat(pos.coords.latitude.toFixed(6));
            const lng = parseFloat(pos.coords.longitude.toFixed(6));
            setRegLat(lat);
            setRegLng(lng);
            setDetectingGps(false);
          },
          async (err: any) => {
            console.warn('GPS error, falling back to geocode:', err?.message);
            await fallbackGeocode();
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        await fallbackGeocode();
      }
    } catch {
      await fallbackGeocode();
    }
  };

  const fallbackGeocode = async () => {
    const query = regArea
      ? `${regArea}, ${regCity || 'Pune'}, India`
      : (regCity || 'Pune, Maharashtra, India');

    try {
      const res = await fetch(`${API_BASE}/addresses/forward-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success && data.location?.latitude && data.location?.longitude) {
        setRegLat(parseFloat(data.location.latitude.toFixed(6)));
        setRegLng(parseFloat(data.location.longitude.toFixed(6)));
      } else {
        // Fallback default Pune center if unresolvable
        setRegLat(18.5204);
        setRegLng(73.8567);
      }
    } catch {
      setRegLat(18.5204);
      setRegLng(73.8567);
    } finally {
      setDetectingGps(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regShopName.trim()) {
      setError('Please enter your Store / Shop Name');
      return;
    }
    if (!regOwnerName.trim()) {
      setError('Please enter Owner Full Name');
      return;
    }
    if (regMobile.replace(/[^\d]/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!regCity.trim() || !regArea.trim()) {
      setError('Please enter City and Locality / Area');
      return;
    }
    if (regLat == null || regLng == null) {
      setError('Please detect your Store GPS Location before submitting');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shops/self-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: regShopName.trim(),
          owner_name: regOwnerName.trim(),
          owner_mobile: regMobile.trim(),
          city: regCity.trim(),
          area_name: regArea.trim(),
          address_line: regAddress.trim(),
          pincode: regPincode.trim(),
          latitude: regLat,
          longitude: regLng,
          delivery_radius_km: 5.0,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setRegSuccess(data.message || 'Store registration submitted successfully! Admin will review and approve your store.');
      } else {
        setError(data.error || 'Failed to submit registration. Please try again.');
      }
    } catch {
      setLoading(false);
      setError('Network connection error. Please check backend server.');
    }
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

          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => {
                setMode('login');
                setError('');
                setRegSuccess(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                🔑 Merchant Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              onPress={() => {
                setMode('register');
                setError('');
                setRegSuccess(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                ➕ Register Store
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {mode === 'login' ? (
              step === 1 ? (
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

                  <TouchableOpacity
                    style={styles.registerPromptRow}
                    onPress={() => {
                      setMode('register');
                      setError('');
                    }}
                  >
                    <Text style={styles.registerPromptText}>
                      New Kirana store? <Text style={styles.registerPromptLink}>Register with GPS ➔</Text>
                    </Text>
                  </TouchableOpacity>
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
              )
            ) : (
              /* REGISTRATION MODE */
              regSuccess ? (
                <View style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <Text style={{ fontSize: 36 }}>🎉</Text>
                  </View>
                  <Text style={styles.successTitle}>Registration Submitted!</Text>
                  <Text style={styles.successMessage}>{regSuccess}</Text>
                  
                  <View style={styles.successGpsBadge}>
                    <Text style={styles.successGpsText}>
                      📍 Pinned GPS: {regLat?.toFixed(4)}°, {regLng?.toFixed(4)}°
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => {
                      setMode('login');
                      setRegSuccess(null);
                      setMobile(regMobile);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Back to Sign In ➔</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Register New Store</Text>
                  <Text style={styles.cardSubtitle}>
                    Fill in your Kirana store details and pin your live GPS location for Admin approval and customer order routing.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>STORE / SHOP NAME *</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="e.g. Thorat Super Market"
                      placeholderTextColor="#64748B"
                      value={regShopName}
                      onChangeText={setRegShopName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>OWNER FULL NAME *</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="e.g. Nilesh Thorat"
                      placeholderTextColor="#64748B"
                      value={regOwnerName}
                      onChangeText={setRegOwnerName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>OWNER MOBILE NUMBER *</Text>
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
                        value={regMobile}
                        onChangeText={(val) => setRegMobile(val.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>CITY *</Text>
                      <TextInput
                        style={styles.textInputFull}
                        placeholder="e.g. Pune"
                        placeholderTextColor="#64748B"
                        value={regCity}
                        onChangeText={setRegCity}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>LOCALITY / AREA *</Text>
                      <TextInput
                        style={styles.textInputFull}
                        placeholder="e.g. Ravet"
                        placeholderTextColor="#64748B"
                        value={regArea}
                        onChangeText={setRegArea}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FULL SHOP ADDRESS</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="Shop 4, Lotus Plaza, Shinde Vasti"
                      placeholderTextColor="#64748B"
                      value={regAddress}
                      onChangeText={setRegAddress}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PINCODE</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="e.g. 412101"
                      placeholderTextColor="#64748B"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={regPincode}
                      onChangeText={setRegPincode}
                    />
                  </View>

                  {/* LIVE GPS PINNING CARD */}
                  <View style={styles.gpsCaptureCard}>
                    <View style={styles.gpsHeaderRow}>
                      <Text style={styles.gpsCardTitle}>📍 STORE GPS PINNING (MANDATORY)</Text>
                      {regLat != null && regLng != null ? (
                        <View style={styles.gpsStatusBadgeSuccess}>
                          <Text style={styles.gpsStatusBadgeSuccessText}>PINNED</Text>
                        </View>
                      ) : (
                        <View style={styles.gpsStatusBadgeWarning}>
                          <Text style={styles.gpsStatusBadgeWarningText}>NOT PINNED</Text>
                        </View>
                      )}
                    </View>

                    {regLat != null && regLng != null ? (
                      <View style={styles.pinnedCoordsBox}>
                        <Text style={styles.pinnedCoordsText}>
                          📍 {regLat.toFixed(5)}°, {regLng.toFixed(5)}°
                        </Text>
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${regLat},${regLng}`)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.previewMapLink}>View on Map ↗</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.gpsCardDesc}>
                        Please sit inside your store and tap below so customers and Admin can locate your store accurately.
                      </Text>
                    )}

                    <TouchableOpacity
                      style={styles.detectGpsBtn}
                      onPress={handleDetectGps}
                      disabled={detectingGps}
                      activeOpacity={0.8}
                    >
                      {detectingGps ? (
                        <ActivityIndicator color="#0284C7" size="small" />
                      ) : (
                        <Text style={styles.detectGpsBtnText}>
                          {regLat != null ? '🔄 Re-Pin Store GPS Location' : '📍 Detect Live Store GPS Location'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.btnDisabled]}
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Submit Store for Approval ➔</Text>
                    )}
                  </TouchableOpacity>
                </>
              )
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
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  rowInputs: {
    flexDirection: 'row',
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
  gpsCaptureCard: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  gpsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  gpsStatusBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gpsStatusBadgeSuccessText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '800',
  },
  gpsStatusBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gpsStatusBadgeWarningText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
  },
  pinnedCoordsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  pinnedCoordsText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  previewMapLink: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  gpsCardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 10,
  },
  detectGpsBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectGpsBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
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
  registerPromptRow: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 6,
  },
  registerPromptText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  registerPromptLink: {
    color: '#38BDF8',
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
  successCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  successGpsBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  successGpsText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
