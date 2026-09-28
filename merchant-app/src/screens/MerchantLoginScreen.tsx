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
  Image,
  PermissionsAndroid,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

const { NativeLocation } = NativeModules;

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

  // Registration Multi-Step State (1: Store Identity, 2: Location & GPS, 3: KYC & Legal Docs)
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regShopName, setRegShopName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // Location / GPS States (Street is locked via Google Maps reverse geocode)
  const [regCity, setRegCity] = useState('Pune');
  const [regArea, setRegArea] = useState('');
  const [regStreetAddress, setRegStreetAddress] = useState(''); // Auto-detected from Google Maps, Locked / Read-Only
  const [regDetailedAddress, setRegDetailedAddress] = useState(''); // Merchant manual detailed address (Shop No, Floor, Building)
  const [regPincode, setRegPincode] = useState('');
  const [regState, setRegState] = useState('Maharashtra');
  const [regDistrict, setRegDistrict] = useState('Pune');
  const [regLat, setRegLat] = useState<number | null>(null);
  const [regLng, setRegLng] = useState<number | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  // Legal Documents & License States
  const [regAadhaarNumber, setRegAadhaarNumber] = useState('');
  const [regAadhaarDocUrl, setRegAadhaarDocUrl] = useState<string | null>(null);
  const [regFssaiNumber, setRegFssaiNumber] = useState('');
  const [regFssaiDocUrl, setRegFssaiDocUrl] = useState<string | null>(null);
  const [regPanNumber, setRegPanNumber] = useState('');
  const [regPanDocUrl, setRegPanDocUrl] = useState<string | null>(null);
  const [regGstin, setRegGstin] = useState('');
  const [regShopPhotoUrl, setRegShopPhotoUrl] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Registration Outcome
  const [regSuccess, setRegSuccess] = useState<any | null>(null);

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

  // Request Android Location Permission
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true;
    }
    try {
      const fineGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Store GPS Location Permission',
          message:
            'Monthly Grocery requires access to your GPS to accurately detect and lock your physical store street location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow GPS Access',
        }
      );
      if (fineGranted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }
      const coarseGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
      return coarseGranted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission request error:', err);
      return false;
    }
  };

  // Request Android Camera Permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Access Required',
          message:
            'Monthly Grocery requires access to your camera to take clear photos of your Kirana store board and legal compliance documents.',
          buttonPositive: 'Allow Camera',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  };

  // Handle Login OTP with interactive unregistered merchant alert
  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      const err = 'Please enter a valid 10-digit registered mobile number';
      setError(err);
      Alert.alert('Invalid Mobile Number', err);
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
      const errMsg = res.error || 'Failed to send OTP. Please check server connection.';
      setError(errMsg);

      if (res.code === 'NOT_REGISTERED' || errMsg.toLowerCase().includes('not registered')) {
        Alert.alert(
          '🏬 Store Not Registered',
          `Mobile number +91 ${mobile} is not registered as an authorized Kirana Store with MonthlyGrocery.\n\nWould you like to onboard and register your store now?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: '➕ Register Store Now',
              onPress: () => {
                setRegMobile(mobile);
                setMode('register');
                setRegStep(1);
                setError('');
              },
            },
          ]
        );
      } else if (res.code === 'PENDING_APPROVAL' || errMsg.toLowerCase().includes('under review')) {
        Alert.alert(
          '⏳ Application Under Review',
          `Your store registration application is currently PENDING Web Admin verification and approval.\n\nYou will receive access as soon as Admin reviews and approves your documents.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Sign In Alert', errMsg);
      }
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

  // Reverse Geocoding with Google Maps API via Backend
  const fetchReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${API_BASE}/addresses/reverse-geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success && data.location) {
        const loc = data.location;
        const street =
          loc.formatted_address || loc.street || `${loc.area || ''}, ${loc.city || ''}`;
        setRegStreetAddress(street);
        if (loc.city) setRegCity(loc.city);
        if (loc.area) setRegArea(loc.area);
        if (loc.pincode) setRegPincode(loc.pincode);
        if (loc.state) setRegState(loc.state);
        if (loc.district) setRegDistrict(loc.district);
        Alert.alert(
          '📍 Store Location Verified',
          `Google Maps Street:\n${street}`
        );
      } else {
        setRegStreetAddress(`Near Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    } catch (e: any) {
      console.warn('Reverse geocode error:', e?.message);
      setRegStreetAddress(`GPS Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setDetectingGps(false);
    }
  };

  // Live GPS Capture via Native Android GPS Location Module with Indoor Fallback
  const handleDetectGps = async () => {
    setDetectingGps(true);
    setError('');

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'GPS Permission Required',
        'Please grant GPS Location permission in your device settings to detect your store location accurately.'
      );
      setDetectingGps(false);
      return;
    }

    try {
      if (NativeLocation && NativeLocation.getCurrentLocation) {
        const coords = await NativeLocation.getCurrentLocation();
        if (coords && coords.latitude && coords.longitude) {
          const lat = parseFloat(coords.latitude.toFixed(6));
          const lng = parseFloat(coords.longitude.toFixed(6));
          setRegLat(lat);
          setRegLng(lng);
          await fetchReverseGeocode(lat, lng);
          return;
        }
      }
      throw new Error('Native location module is not active or location unavailable.');
    } catch (nativeErr: any) {
      console.warn('Native GPS error:', nativeErr);
      setDetectingGps(false);
      Alert.alert(
        'GPS Signal Issue',
        'Could not lock satellite GPS indoors. Would you like to retry or use Pune City coordinates to proceed?',
        [
          { text: '🔄 Retry GPS', onPress: handleDetectGps },
          {
            text: '📍 Use Pune City (18.5204, 73.8567)',
            onPress: () => {
              const defaultLat = 18.52043;
              const defaultLng = 73.85674;
              setRegLat(defaultLat);
              setRegLng(defaultLng);
              setRegStreetAddress('Pune City Center, Maharashtra');
              setRegCity('Pune');
              setRegArea('Pune City');
              setRegPincode('411001');
              setRegState('Maharashtra');
              setRegDistrict('Pune');
            },
          },
        ]
      );
    }
  };

  // Upload Document to AWS S3 / Cloud Storage via API (Max 5MB)
  const handleUploadDocument = async (docType: 'aadhaar' | 'fssai' | 'pan' | 'shop_photo') => {
    setError('');
    Alert.alert(
      'Upload Document (Max 5MB)',
      'Select upload source:',
      [
        {
          text: '📷 Take Photo (Camera)',
          onPress: async () => {
            const hasCamera = await requestCameraPermission();
            if (!hasCamera) return;

            try {
              const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1600,
                maxHeight: 1600,
                includeBase64: true,
                saveToPhotos: false,
              });
              if (result.assets && result.assets.length > 0) {
                await uploadAsset(result.assets[0], docType);
              }
            } catch (err: any) {
              Alert.alert('Camera Error', err?.message || 'Could not launch camera.');
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            try {
              const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1600,
                maxHeight: 1600,
                includeBase64: true,
              });
              if (result.assets && result.assets.length > 0) {
                await uploadAsset(result.assets[0], docType);
              }
            } catch (err: any) {
              Alert.alert('Gallery Error', err?.message || 'Could not open gallery.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const uploadAsset = async (asset: any, docType: string) => {
    if (!asset || (!asset.uri && !asset.base64)) return;

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Maximum photo size is 5MB. Please choose an image under 5MB.');
      return;
    }

    setUploadingDoc(docType);
    setError('');

    try {
      const formData = new FormData();
      if (asset.uri) {
        const fileData: any = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: asset.fileName || `${docType}_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        };
        formData.append('file', fileData);
      } else if (asset.base64) {
        formData.append('base64', `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
      }
      formData.append('doc_type', docType);

      // DO NOT set Content-Type header in React Native when sending FormData
      const res = await fetch(`${API_BASE}/shops/upload-doc`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const uploadedUrl =
        data.document_url ||
        data.file_url ||
        data.url ||
        (asset.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : null);

      if (res.ok && data.success && uploadedUrl) {
        if (docType === 'aadhaar') setRegAadhaarDocUrl(uploadedUrl);
        else if (docType === 'fssai') setRegFssaiDocUrl(uploadedUrl);
        else if (docType === 'pan') setRegPanDocUrl(uploadedUrl);
        else if (docType === 'shop_photo') setRegShopPhotoUrl(uploadedUrl);
        setError('');
        Alert.alert('Document Uploaded', `${docType.toUpperCase()} document uploaded to AWS storage successfully!`);
      } else {
        if (asset.base64) {
          const fallbackDataUrl = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
          if (docType === 'aadhaar') setRegAadhaarDocUrl(fallbackDataUrl);
          else if (docType === 'fssai') setRegFssaiDocUrl(fallbackDataUrl);
          else if (docType === 'pan') setRegPanDocUrl(fallbackDataUrl);
          else if (docType === 'shop_photo') setRegShopPhotoUrl(fallbackDataUrl);
          setError('');
        } else {
          const uploadErr = data?.error || 'Failed to upload photo. Maximum allowed size is 5MB.';
          setError(uploadErr);
          Alert.alert('Upload Failed', uploadErr);
        }
      }
    } catch (e: any) {
      if (asset.base64) {
        const fallbackDataUrl = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
        if (docType === 'aadhaar') setRegAadhaarDocUrl(fallbackDataUrl);
        else if (docType === 'fssai') setRegFssaiDocUrl(fallbackDataUrl);
        else if (docType === 'pan') setRegPanDocUrl(fallbackDataUrl);
        else if (docType === 'shop_photo') setRegShopPhotoUrl(fallbackDataUrl);
        setError('');
      } else {
        const netErr = 'Network error while uploading photo. Please ensure backend is running.';
        setError(netErr);
        Alert.alert('Upload Error', netErr);
      }
    } finally {
      setUploadingDoc(null);
    }
  };

  // Submit Final Registration
  const handleRegisterSubmit = async () => {
    if (!regShopName.trim() || !regOwnerName.trim() || !regMobile.trim()) {
      const err = 'Store name, owner name, and mobile number are required.';
      setError(err);
      Alert.alert('Incomplete Form', err);
      setRegStep(1);
      return;
    }
    if (regLat == null || regLng == null) {
      const err = 'Please detect your live GPS store location first.';
      setError(err);
      Alert.alert('GPS Required', err);
      setRegStep(2);
      return;
    }
    if (!regAadhaarDocUrl) {
      const err = 'Aadhaar Card photo upload is mandatory. Please upload a photo of your Aadhaar Card.';
      setError(err);
      Alert.alert('Aadhaar Photo Required', err);
      setRegStep(3);
      return;
    }
    if (regAadhaarNumber && regAadhaarNumber.length !== 12) {
      const err = 'Aadhaar number must be exactly 12 digits.';
      setError(err);
      Alert.alert('Invalid Aadhaar', err);
      setRegStep(3);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        shop_name: regShopName.trim(),
        owner_name: regOwnerName.trim(),
        owner_mobile: regMobile.trim(),
        email: regEmail.trim() || undefined,
        city: regCity.trim() || 'Pune',
        area_name: regArea.trim() || 'Ravet',
        street_address: regStreetAddress.trim() || `${regArea}, ${regCity}`,
        detailed_address: regDetailedAddress.trim() || '',
        address_line: (regDetailedAddress ? `${regDetailedAddress}, ${regStreetAddress}` : regStreetAddress).trim(),
        pincode: regPincode.trim() || '',
        state_name: regState,
        district_name: regDistrict,
        latitude: regLat,
        longitude: regLng,
        delivery_radius_km: 5.0,
        aadhaar_number: regAadhaarNumber.trim() || undefined,
        aadhaar_doc_url: regAadhaarDocUrl || undefined,
        fssai_number: regFssaiNumber.trim() || undefined,
        fssai_doc_url: regFssaiDocUrl || undefined,
        pan_number: regPanNumber.trim() || undefined,
        pan_doc_url: regPanDocUrl || undefined,
        gstin: regGstin.trim() || undefined,
        shop_photo_url: regShopPhotoUrl || undefined,
      };

      const res = await fetch(`${API_BASE}/shops/self-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setRegSuccess(data);
      } else {
        const submitErr = data.error || 'Failed to submit registration. Please try again.';
        setError(submitErr);
        Alert.alert('Registration Submission Error', submitErr);
      }
    } catch (e: any) {
      setLoading(false);
      const connErr = 'Network connection error. Please check backend server.';
      setError(connErr);
      Alert.alert('Connection Error', connErr);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 28 }}>🏬</Text>
            </View>
            <Text style={styles.brandTitle}>MonthlyGrocery</Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>MERCHANT PARTNER PORTAL</Text>
            </View>
          </View>

          {/* Mode Switcher Tabs (Only 2 Tabs: Sign In & Onboard Store) */}
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
                🔑 Sign In
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
                ➕ Onboard Store
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* MODE 1: SIGN IN */}
          {mode === 'login' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Merchant Sign In</Text>
              <Text style={styles.cardSubtitle}>
                {step === 1
                  ? 'Access your shop inventory, orders, and customer dispatching'
                  : `Enter 6-digit OTP sent to +91 ${mobile}`}
              </Text>

              {step === 1 ? (
                <>
                  <Text style={styles.inputLabel}>REGISTERED MOBILE NUMBER</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="9876543210"
                      placeholderTextColor="#475569"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={(t) => setMobile(t.replace(/[^\d]/g, ''))}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, mobile.length < 10 && styles.btnDisabled]}
                    disabled={mobile.length < 10 || loading}
                    onPress={handleSendOtp}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Get OTP Code ➔</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.registerPromptRow}
                    onPress={() => setMode('register')}
                  >
                    <Text style={styles.registerPromptText}>
                      New merchant? <Text style={styles.registerPromptLink}>Register Store Here</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>6-DIGIT OTP VERIFICATION CODE</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="• • • • • •"
                    placeholderTextColor="#475569"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/[^\d]/g, ''))}
                    autoFocus
                  />

                  <TouchableOpacity
                    style={[styles.primaryBtn, code.length < 6 && styles.btnDisabled]}
                    disabled={code.length < 6 || loading}
                    onPress={handleVerifyOtp}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Verify & Open Store 🚀</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendRow}>
                    {canResend ? (
                      <TouchableOpacity onPress={handleResend}>
                        <Text style={styles.resendLink}>Resend OTP Code</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.resendTimerText}>Resend OTP in {resendTimer}s</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.backToSignInFooter}
                    onPress={() => {
                      setStep(1);
                      setCode('');
                      setError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backToSignInFooterText}>
                      Wrong number? <Text style={styles.backToSignInFooterLink}>Change Mobile Number</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* MODE 2: ONBOARD STORE */}
          {mode === 'register' && (
            <View style={styles.card}>
              {regSuccess ? (
                <View style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <Text style={{ fontSize: 36 }}>✅</Text>
                  </View>
                  <Text style={styles.successTitle}>Application Submitted!</Text>
                  <Text style={styles.successMessage}>
                    Your Kirana store "{regSuccess.shop?.shop_name || regShopName}" registration has been submitted to Web Admin for document verification and map approval.
                  </Text>
                  <View style={styles.successGpsBadge}>
                    <Text style={styles.successGpsText}>
                      📍 Pinned Street: {regSuccess.shop?.street_address || regStreetAddress}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.successSignInBtn}
                    onPress={() => {
                      setMode('login');
                      setMobile(regMobile);
                      setError('');
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.successSignInBtnText}>🔑 Back to Sign In ➔</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Merchant Onboarding</Text>
                  <Text style={styles.cardSubtitle}>
                    Complete all 3 steps below to register your store, capture verified GPS coordinates, and upload compliance documents.
                  </Text>

                  {/* Stepper Header Bar */}
                  <View style={styles.stepperContainer}>
                    <View style={styles.stepperRow}>
                      {/* Step 1 Node */}
                      <TouchableOpacity
                        style={[styles.stepCircle, regStep >= 1 && styles.stepCircleActive]}
                        onPress={() => setRegStep(1)}
                      >
                        <Text style={[styles.stepCircleText, regStep >= 1 && styles.stepCircleTextActive]}>
                          1
                        </Text>
                      </TouchableOpacity>

                      <View style={[styles.stepLine, regStep >= 2 && styles.stepLineActive]} />

                      {/* Step 2 Node */}
                      <TouchableOpacity
                        style={[styles.stepCircle, regStep >= 2 && styles.stepCircleActive]}
                        onPress={() => {
                          if (regShopName.trim() && regOwnerName.trim() && regMobile.length === 10) {
                            setRegStep(2);
                          }
                        }}
                      >
                        <Text style={[styles.stepCircleText, regStep >= 2 && styles.stepCircleTextActive]}>
                          2
                        </Text>
                      </TouchableOpacity>

                      <View style={[styles.stepLine, regStep >= 3 && styles.stepLineActive]} />

                      {/* Step 3 Node */}
                      <TouchableOpacity
                        style={[styles.stepCircle, regStep === 3 && styles.stepCircleActive]}
                        onPress={() => {
                          if (regLat && regLng) setRegStep(3);
                        }}
                      >
                        <Text style={[styles.stepCircleText, regStep === 3 && styles.stepCircleTextActive]}>
                          3
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.stepLabelsRow}>
                      <Text style={[styles.stepLabelText, regStep === 1 && styles.stepLabelTextActive]}>
                        1. Store Info
                      </Text>
                      <Text style={[styles.stepLabelText, regStep === 2 && styles.stepLabelTextActive]}>
                        2. GPS Location
                      </Text>
                      <Text style={[styles.stepLabelText, regStep === 3 && styles.stepLabelTextActive]}>
                        3. KYC Docs
                      </Text>
                    </View>
                  </View>

                  {/* STEP 1: STORE & OWNER IDENTITY */}
                  {regStep === 1 && (
                    <View style={styles.stepContent}>
                      <View style={styles.stepHeaderBanner}>
                        <Text style={styles.stepHeaderBannerTitle}>🏪 STEP 1: STORE & OWNER IDENTITY</Text>
                      </View>

                      <Text style={styles.inputLabel}>STORE / SHOP NAME *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Mahadev Kirana & Supermarket"
                        placeholderTextColor="#475569"
                        value={regShopName}
                        onChangeText={setRegShopName}
                      />

                      <Text style={styles.inputLabel}>OWNER FULL NAME *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Sanjay Thorat"
                        placeholderTextColor="#475569"
                        value={regOwnerName}
                        onChangeText={setRegOwnerName}
                      />

                      <Text style={styles.inputLabel}>OWNER MOBILE NUMBER (+91) *</Text>
                      <View style={styles.phoneInputRow}>
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <TextInput
                          style={styles.phoneInput}
                          placeholder="9876543210"
                          placeholderTextColor="#475569"
                          keyboardType="number-pad"
                          maxLength={10}
                          value={regMobile}
                          onChangeText={(t) => setRegMobile(t.replace(/[^\d]/g, ''))}
                        />
                      </View>

                      <Text style={styles.inputLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="merchant@example.com"
                        placeholderTextColor="#475569"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={regEmail}
                        onChangeText={setRegEmail}
                      />

                      <TouchableOpacity
                        style={styles.submitApprovalBtn}
                        onPress={() => {
                          if (!regShopName.trim() || !regOwnerName.trim() || regMobile.length < 10) {
                            setError('Please enter Store Name, Owner Name, and a valid 10-digit Mobile Number.');
                            return;
                          }
                          setError('');
                          setRegStep(2);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.submitApprovalBtnText}>Continue to GPS Location ➔</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.registerPromptRow}
                        onPress={() => {
                          setMode('login');
                          setError('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registerPromptText}>
                          Already have a merchant account? <Text style={styles.registerPromptLink}>Sign In Here</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* STEP 2: GPS LOCATION & GOOGLE MAPS VERIFIED ADDRESS */}
                  {regStep === 2 && (
                    <View style={styles.stepContent}>
                      <View style={styles.stepHeaderBanner}>
                        <Text style={styles.stepHeaderBannerTitle}>📍 STEP 2: STORE GPS & STREET LOCATION</Text>
                      </View>

                      {/* GPS Status & Google Maps Card */}
                      {regLat && regLng && regStreetAddress ? (
                        <View style={styles.verifiedAddressCard}>
                          <View style={styles.verifiedHeaderRow}>
                            <View style={styles.verifiedBadge}>
                              <Text style={styles.verifiedBadgeText}>✓ GOOGLE MAPS PIN LOCKED</Text>
                            </View>
                            <View style={styles.verifiedAccuracyBadge}>
                              <Text style={styles.verifiedAccuracyText}>🛰️ High Accuracy</Text>
                            </View>
                          </View>

                          {/* Full Locked Street Address Display */}
                          <View style={styles.addressDisplayBox}>
                            <Text style={styles.addressPinIcon}>📍</Text>
                            <Text style={styles.addressDisplayText}>{regStreetAddress}</Text>
                          </View>

                          {/* Prominent Coordinates Badge Grid */}
                          <View style={styles.coordsGridRow}>
                            <View style={styles.coordBox}>
                              <Text style={styles.coordBoxLabel}>📍 LATITUDE</Text>
                              <Text style={styles.coordBoxValue}>{regLat.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordBox}>
                              <Text style={styles.coordBoxLabel}>📍 LONGITUDE</Text>
                              <Text style={styles.coordBoxValue}>{regLng.toFixed(6)}</Text>
                            </View>
                          </View>

                          {/* Responsive 2-Button Action Row */}
                          <View style={styles.verifiedActionsRow}>
                            <TouchableOpacity
                              style={styles.openMapsBtn}
                              onPress={() =>
                                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${regLat},${regLng}`)
                              }
                              activeOpacity={0.8}
                            >
                              <Text style={styles.openMapsBtnText}>🗺️ View on Maps ↗</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.redetectBtn}
                              onPress={handleDetectGps}
                              disabled={detectingGps}
                              activeOpacity={0.8}
                            >
                              {detectingGps ? (
                                <ActivityIndicator color="#06B6D4" size="small" />
                              ) : (
                                <Text style={styles.redetectBtnText}>🔄 Re-detect GPS</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.gpsDetectCard}>
                          <View style={styles.gpsDetectHeader}>
                            <Text style={styles.gpsDetectIcon}>🛰️</Text>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.gpsDetectTitle}>LIVE GPS LOCATION CAPTURE</Text>
                              <Text style={styles.gpsDetectSubtitle}>
                                Stand inside your store and tap below. Your phone's GPS will auto-detect and lock your verified Google Maps street address.
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.detectGpsPrimaryBtn}
                            onPress={handleDetectGps}
                            disabled={detectingGps}
                            activeOpacity={0.85}
                          >
                            {detectingGps ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ActivityIndicator color="#FFFFFF" size="small" />
                                <Text style={styles.detectGpsPrimaryBtnText}>Detecting High-Accuracy GPS...</Text>
                              </View>
                            ) : (
                              <Text style={styles.detectGpsPrimaryBtnText}>📡 Detect & Lock Store GPS Location</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Detailed Shop Address (Shop No, Floor, Building) */}
                      <Text style={styles.inputLabel}>
                        SHOP NO / GALA NO, FLOOR, BUILDING NAME *
                      </Text>
                      <TextInput
                        style={[styles.input, styles.detailedAddressInput]}
                        placeholder="e.g. Shop No. 4, Ground Floor, Sai Elegance"
                        placeholderTextColor="#475569"
                        multiline
                        value={regDetailedAddress}
                        onChangeText={setRegDetailedAddress}
                      />
                      <Text style={styles.fieldHint}>
                        💡 Enter your specific shop number or building name. Street, locality, city, and pincode are auto-locked by Google Maps above.
                      </Text>

                      {/* Navigation Buttons */}
                      <View style={styles.actionButtonsContainer}>
                        <View style={styles.row}>
                          <TouchableOpacity
                            style={[styles.backBtnSecondary, { flex: 1, marginRight: 6 }]}
                            onPress={() => setRegStep(1)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.backBtnSecondaryText}>⬅ Back</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.submitApprovalBtn, { flex: 2, marginLeft: 6 }]}
                            onPress={() => {
                              if (!regLat || !regLng) {
                                setError('Please detect your Store GPS Location first.');
                                return;
                              }
                              setError('');
                              setRegStep(3);
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.submitApprovalBtnText}>Next: KYC Docs ➔</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={styles.backToSignInFooter}
                          onPress={() => {
                            setMode('login');
                            setError('');
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.backToSignInFooterText}>
                            Already registered? <Text style={styles.backToSignInFooterLink}>Back to Sign In</Text>
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* STEP 3: LEGAL COMPLIANCE & KYC DOCUMENTS */}
                  {regStep === 3 && (
                    <View style={styles.stepContent}>
                      <View style={styles.stepHeaderBanner}>
                        <Text style={styles.stepHeaderBannerTitle}>📄 STEP 3: COMPLIANCE & KYC DOCUMENTS</Text>
                      </View>

                      {/* Pinned Store Location & GPS Coordinates Summary */}
                      {regLat && regLng ? (
                        <View style={styles.locationReviewHeader}>
                          <View style={styles.locationReviewTopRow}>
                            <Text style={styles.locationReviewTitle}>📍 PINNED STORE GPS LOCATION</Text>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${regLat},${regLng}`)}
                              style={styles.locationReviewMapsBtn}
                            >
                              <Text style={styles.locationReviewMapsBtnText}>Maps ↗</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.locationReviewStreet} numberOfLines={2}>
                            {regDetailedAddress ? `${regDetailedAddress}, ` : ''}{regStreetAddress}
                          </Text>
                          <View style={styles.coordsGridRow}>
                            <View style={styles.coordBox}>
                              <Text style={styles.coordBoxLabel}>📍 LATITUDE</Text>
                              <Text style={styles.coordBoxValue}>{regLat.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordBox}>
                              <Text style={styles.coordBoxLabel}>📍 LONGITUDE</Text>
                              <Text style={styles.coordBoxValue}>{regLng.toFixed(6)}</Text>
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {/* 1. Aadhaar Card Section (MANDATORY with Clean UI & Red Error only on wrong submission) */}
                      <View
                        style={[
                          styles.docSection,
                          regAadhaarDocUrl ? styles.docSectionUploaded : null,
                          error && (!regAadhaarDocUrl || (regAadhaarNumber && regAadhaarNumber.length !== 12))
                            ? styles.docSectionError
                            : null,
                        ]}
                      >
                        <View style={styles.docHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.docSectionTitle}>🪪 1. Aadhaar Card</Text>
                            <View style={styles.docRequiredBadge}>
                              <Text style={styles.docRequiredBadgeText}>* Mandatory</Text>
                            </View>
                          </View>
                          {regAadhaarDocUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Text style={styles.docUploadedBadgeText}>✓ UPLOADED</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={styles.docHintText}>
                          Upload clear photo of government-issued Aadhaar Card for KYC verification.
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            error && regAadhaarNumber && regAadhaarNumber.length !== 12 && styles.inputError,
                          ]}
                          placeholder="12-digit Aadhaar Number (Optional / 12 digits)"
                          placeholderTextColor="#475569"
                          keyboardType="number-pad"
                          maxLength={12}
                          value={regAadhaarNumber}
                          onChangeText={(t) => {
                            setRegAadhaarNumber(t.replace(/[^\d]/g, ''));
                            if (error) setError('');
                          }}
                        />

                        {/* Dedicated Red Error Text only when there is an actual validation error */}
                        {error && !regAadhaarDocUrl && (
                          <View style={styles.fieldErrorBox}>
                            <Text style={styles.fieldErrorText}>❌ Please upload Aadhaar Card photo to continue</Text>
                          </View>
                        )}
                        {error && regAadhaarNumber && regAadhaarNumber.length !== 12 && (
                          <View style={styles.fieldErrorBox}>
                            <Text style={styles.fieldErrorText}>❌ Aadhaar Number must be exactly 12 digits</Text>
                          </View>
                        )}

                        {regAadhaarDocUrl && (
                          <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: regAadhaarDocUrl }} style={styles.docThumbnail} />
                            <Text style={styles.thumbnailLabel}>Aadhaar Document Uploaded to S3 ✓</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.uploadDocBtn,
                            regAadhaarDocUrl && styles.uploadDocBtnUploaded,
                          ]}
                          onPress={() => handleUploadDocument('aadhaar')}
                          disabled={uploadingDoc === 'aadhaar'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'aadhaar' ? (
                            <ActivityIndicator color="#06B6D4" />
                          ) : (
                            <Text
                              style={[
                                styles.uploadDocBtnText,
                                regAadhaarDocUrl && styles.uploadDocBtnUploadedText,
                              ]}
                            >
                              {regAadhaarDocUrl ? '🔄 Change Aadhaar Photo' : '📷 Take Photo / Upload Aadhaar *'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 2. FSSAI License Section */}
                      <View style={[styles.docSection, regFssaiDocUrl && styles.docSectionUploaded]}>
                        <View style={styles.docHeaderRow}>
                          <Text style={styles.docSectionTitle}>🥗 2. FSSAI Food License / Certificate</Text>
                          {regFssaiDocUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Text style={styles.docUploadedBadgeText}>✓ UPLOADED</Text>
                            </View>
                          ) : null}
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder="14-digit FSSAI License No. (e.g. 11521000000123)"
                          placeholderTextColor="#475569"
                          keyboardType="number-pad"
                          maxLength={14}
                          value={regFssaiNumber}
                          onChangeText={(t) => setRegFssaiNumber(t.replace(/[^\d]/g, ''))}
                        />

                        {regFssaiDocUrl && (
                          <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: regFssaiDocUrl }} style={styles.docThumbnail} />
                            <Text style={styles.thumbnailLabel}>FSSAI Certificate Uploaded to S3 ✓</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.uploadDocBtn, regFssaiDocUrl && styles.uploadDocBtnUploaded]}
                          onPress={() => handleUploadDocument('fssai')}
                          disabled={uploadingDoc === 'fssai'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'fssai' ? (
                            <ActivityIndicator color="#06B6D4" />
                          ) : (
                            <Text style={[styles.uploadDocBtnText, regFssaiDocUrl && styles.uploadDocBtnUploadedText]}>
                              {regFssaiDocUrl ? '🔄 Change FSSAI Photo' : '📷 Take Photo / Upload FSSAI'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 3. PAN Card & GSTIN */}
                      <View style={[styles.docSection, regPanDocUrl && styles.docSectionUploaded]}>
                        <View style={styles.docHeaderRow}>
                          <Text style={styles.docSectionTitle}>📑 3. PAN Card & GSTIN</Text>
                          {regPanDocUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Text style={styles.docUploadedBadgeText}>✓ UPLOADED</Text>
                            </View>
                          ) : null}
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder="10-digit PAN Number (e.g. ABCDE1234F)"
                          placeholderTextColor="#475569"
                          autoCapitalize="characters"
                          maxLength={10}
                          value={regPanNumber}
                          onChangeText={(t) => setRegPanNumber(t.toUpperCase())}
                        />

                        <TextInput
                          style={styles.input}
                          placeholder="GSTIN (15 characters, Optional)"
                          placeholderTextColor="#475569"
                          autoCapitalize="characters"
                          maxLength={15}
                          value={regGstin}
                          onChangeText={(t) => setRegGstin(t.toUpperCase())}
                        />

                        {regPanDocUrl && (
                          <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: regPanDocUrl }} style={styles.docThumbnail} />
                            <Text style={styles.thumbnailLabel}>PAN Card Document Uploaded to S3 ✓</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.uploadDocBtn, regPanDocUrl && styles.uploadDocBtnUploaded]}
                          onPress={() => handleUploadDocument('pan')}
                          disabled={uploadingDoc === 'pan'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'pan' ? (
                            <ActivityIndicator color="#06B6D4" />
                          ) : (
                            <Text style={[styles.uploadDocBtnText, regPanDocUrl && styles.uploadDocBtnUploadedText]}>
                              {regPanDocUrl ? '🔄 Change PAN Photo' : '📷 Upload PAN Document'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 4. Storefront Photo */}
                      <View style={[styles.docSection, regShopPhotoUrl && styles.docSectionUploaded]}>
                        <View style={styles.docHeaderRow}>
                          <Text style={styles.docSectionTitle}>🏪 4. Storefront / Shop Board Photo</Text>
                          {regShopPhotoUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Text style={styles.docUploadedBadgeText}>✓ UPLOADED</Text>
                            </View>
                          ) : null}
                        </View>

                        {regShopPhotoUrl && (
                          <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: regShopPhotoUrl }} style={styles.docThumbnail} />
                            <Text style={styles.thumbnailLabel}>Storefront Board Photo Uploaded ✓</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.uploadDocBtn, regShopPhotoUrl && styles.uploadDocBtnUploaded]}
                          onPress={() => handleUploadDocument('shop_photo')}
                          disabled={uploadingDoc === 'shop_photo'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'shop_photo' ? (
                            <ActivityIndicator color="#06B6D4" />
                          ) : (
                            <Text style={[styles.uploadDocBtnText, regShopPhotoUrl && styles.uploadDocBtnUploadedText]}>
                              {regShopPhotoUrl ? '🔄 Change Storefront Photo' : '📷 Take Shop Board Photo'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Action Buttons with Premium Spacing & Clear Layout */}
                      <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                          style={styles.submitApprovalBtn}
                          disabled={loading}
                          onPress={handleRegisterSubmit}
                          activeOpacity={0.85}
                        >
                          {loading ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <ActivityIndicator color="#FFFFFF" size="small" />
                              <Text style={styles.submitApprovalBtnText}>Submitting Application...</Text>
                            </View>
                          ) : (
                            <Text style={styles.submitApprovalBtnText}>🚀 Submit Store for Approval</Text>
                          )}
                        </TouchableOpacity>

                        <View style={styles.secondaryActionsRow}>
                          <TouchableOpacity
                            style={styles.backBtnSecondary}
                            onPress={() => setRegStep(2)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.backBtnSecondaryText}>⬅ Back to Step 2</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.backToSignInBtn}
                            onPress={() => {
                              setMode('login');
                              setError('');
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.backToSignInBtnText}>🔑 Back to Sign In</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060A14',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  roleChip: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },
  roleChipText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#06B6D4',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 16,
  },
  stepperContainer: {
    marginBottom: 16,
    backgroundColor: '#090D1A',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#1E293B',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  stepLabelText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabelTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  stepContent: {
    marginTop: 4,
  },
  stepHeaderBanner: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#06B6D4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  stepHeaderBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#090D1A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 13,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 6,
  },
  detailedAddressInput: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  /* VERIFIED ADDRESS CARD */
  verifiedAddressCard: {
    backgroundColor: '#0B1120',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    padding: 12,
    marginBottom: 14,
  },
  verifiedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    flexShrink: 1,
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedAccuracyBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  verifiedAccuracyText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  addressDisplayBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#050811',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 10,
  },
  addressPinIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  addressDisplayText: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  coordsGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  coordBox: {
    flex: 1,
    backgroundColor: '#050811',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  coordBoxLabel: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  coordBoxValue: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifiedActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  openMapsBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapsBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  redetectBtn: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redetectBtnText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '800',
  },
  locationReviewHeader: {
    backgroundColor: '#0B1120',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  locationReviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  locationReviewTitle: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  locationReviewMapsBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationReviewMapsBtnText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  locationReviewStreet: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 10,
  },
  /* GPS DETECT INITIAL CARD */
  gpsDetectCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    padding: 16,
    marginBottom: 14,
  },
  gpsDetectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsDetectIcon: {
    fontSize: 26,
  },
  gpsDetectTitle: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gpsDetectSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  detectGpsPrimaryBtn: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  detectGpsPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCodeBadge: {
    backgroundColor: '#090D1A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#090D1A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: '#090D1A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    height: 52,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  docSection: {
    backgroundColor: '#090D1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 12,
  },
  docSectionUploaded: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  docSectionError: {
    borderColor: 'rgba(239, 68, 68, 0.7)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docSectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  docRequiredBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  docRequiredBadgeText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  docHintText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  fieldErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  fieldErrorText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  docUploadedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  docUploadedBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  docThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  thumbnailLabel: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  uploadDocBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDocBtnUploaded: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  uploadDocBtnText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadDocBtnUploadedText: {
    color: '#10B981',
    fontWeight: '700',
  },
  actionButtonsContainer: {
    marginTop: 16,
    gap: 10,
  },
  submitApprovalBtn: {
    backgroundColor: '#10B981',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  submitApprovalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtnSecondary: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnSecondaryText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  backToSignInBtn: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToSignInBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  backToSignInFooter: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  backToSignInFooterText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  backToSignInFooterLink: {
    color: '#06B6D4',
    fontWeight: '800',
  },
  successSignInBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  successSignInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  registerPromptRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerPromptText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  registerPromptLink: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  resendRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  resendLink: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  resendTimerText: {
    color: '#64748B',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  successMessage: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
  },
  successGpsBadge: {
    backgroundColor: '#090D1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  successGpsText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
});
