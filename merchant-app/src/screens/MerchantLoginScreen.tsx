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
import {
  Store,
  LogIn,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  ClipboardList,
  MapPin,
  Navigation,
  Camera,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react-native';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { API_BASE } from '../config/api';

const { NativeLocation } = NativeModules;

const getDocTitle = (type: string) => {
  switch (type) {
    case 'aadhaar':
      return 'Aadhaar Card';
    case 'fssai':
      return 'FSSAI License';
    case 'pan':
      return 'PAN Card';
    case 'shop_photo':
      return 'Storefront Photo';
    default:
      return 'Document';
  }
};

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
  const [regCity, setRegCity] = useState('');
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
  const [regApplicationStatus, setRegApplicationStatus] = useState<string | null>(null);
  const [regStatusLoading, setRegStatusLoading] = useState(false);
  const [regStatusMessage, setRegStatusMessage] = useState('');
  const [regRejectionReason, setRegRejectionReason] = useState<string | null>(null);
  const [statusCheckMobile, setStatusCheckMobile] = useState('');
  const [showStatusSection, setShowStatusSection] = useState(false);

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
          'Store Not Registered',
          `Mobile number +91 ${mobile} is not registered as an authorized Kirana Store with MonthlyGrocery.\n\nWould you like to onboard and register your store now?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Register Store Now',
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
          'Application Under Review',
          `Your store registration application is currently PENDING Web Admin verification and approval.\n\nApplication Under Review by Admin. Approval expected within 24–48 hours.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else if (res.code === 'REJECTED' || errMsg.toLowerCase().includes('rejected')) {
        const rejectionReason =
          res.rejection_reason ||
          (errMsg.includes('Reason:') ? errMsg.split('Reason:')[1]?.replace(/Please contact.*/i, '')?.trim() : '');
        const alertMsg = rejectionReason
          ? `Your store application was rejected by Web Admin.\n\nReason: "${rejectionReason}"\n\nPlease re-apply from the Onboard Store tab with corrected documents/details.`
          : (errMsg || 'Your previous store application was rejected. Open the Onboard Store tab and submit again with the same mobile number.');

        Alert.alert(
          'Application Rejected',
          alertMsg,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Re-onboard Store',
              onPress: () => {
                setRegMobile(mobile);
                setMode('register');
                setRegStep(1);
                setError('');
                setRegSuccess(null);
              },
            },
          ]
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
      const errMsg = res.error || 'Invalid OTP code. Please enter 123456 in dev mode.';
      setError(errMsg);
      if (res.code === 'PENDING_APPROVAL') {
        Alert.alert('Approval Pending', errMsg);
      } else if (res.code === 'REJECTED') {
        const rejectionReason =
          res.rejection_reason ||
          (errMsg.includes('Reason:') ? errMsg.split('Reason:')[1]?.replace(/Please submit.*/i, '')?.trim() : '');
        const alertMsg = rejectionReason
          ? `Your store application was rejected by Web Admin.\n\nReason: "${rejectionReason}"\n\nPlease submit a fresh onboarding application.`
          : errMsg;

        Alert.alert(
          'Application Rejected',
          alertMsg,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Re-onboard Store',
              onPress: () => {
                setRegMobile(mobile);
                setMode('register');
                setRegStep(1);
              },
            },
          ]
        );
      }
    }
  };

  const fetchRegistrationStatus = async (mobileInput: string) => {
    const digits = mobileInput.replace(/[^\d]/g, '').slice(-10);
    if (digits.length !== 10) {
      const err = 'Enter a valid 10-digit mobile number to check application status.';
      setError(err);
      Alert.alert('Invalid Mobile', err);
      return;
    }
    setRegStatusLoading(true);
    setRegStatusMessage('');
    setRegApplicationStatus(null);
    setRegRejectionReason(null);
    try {
      const res = await fetch(`${API_BASE}/shops/registration-status/${digits}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRegStatusMessage(data.error || 'Could not fetch application status.');
        return;
      }
      const status = String(data.status || 'not_found');
      setRegApplicationStatus(status);
      if (status === 'not_found') {
        setRegStatusMessage('No onboarding application found for this mobile. Please use Onboard Store to apply.');
      } else if (status === 'pending') {
        setRegStatusMessage(
          `Application for "${data.shop?.shop_name || 'your store'}" is pending Super Admin approval.`,
        );
      } else if (status === 'approved') {
        setRegStatusMessage(
          `Store "${data.shop?.shop_name || 'your store'}" is approved. You can sign in with OTP now.`,
        );
      } else if (status === 'rejected') {
        setRegRejectionReason(data.shop?.rejection_reason || null);
        setRegStatusMessage(
          `Application was rejected.${data.shop?.rejection_reason ? ` Reason: ${data.shop.rejection_reason}` : ' Please re-onboard from the Onboard Store tab.'}`,
        );
      } else {
        setRegStatusMessage(`Application status: ${status}`);
      }
    } catch {
      setRegStatusMessage('Network error while checking status. Please check your internet connection.');
    } finally {
      setRegStatusLoading(false);
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
          'Store Location Verified',
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
        'Could not lock your store GPS. Please move near a window/outdoor area and retry. You must enter correct city, area, and pincode manually below before continuing.',
        [{ text: 'Retry GPS', onPress: handleDetectGps }]
      );
    }
  };

  // Upload Document via Cloud API (Max 5MB - Binary PNG/JPG)
  const handleUploadDocument = async (docType: 'aadhaar' | 'fssai' | 'pan' | 'shop_photo') => {
    setError('');
    const docLabel = getDocTitle(docType);
    Alert.alert(
      `Upload ${docLabel} (Max 5MB)`,
      'Select upload source:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            const hasCamera = await requestCameraPermission();
            if (!hasCamera) return;

            try {
              const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1600,
                maxHeight: 1600,
                includeBase64: false,
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
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1600,
                maxHeight: 1600,
                includeBase64: false,
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
    if (!asset || !asset.uri) return;

    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Maximum photo size is 5MB. Please choose an image under 5MB.');
      return;
    }

    setUploadingDoc(docType);
    setError('');

    try {
      const formData = new FormData();
      const fileData: any = {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        name: asset.fileName || `${docType}_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      };
      formData.append('file', fileData);
      formData.append('document', fileData);
      formData.append('doc_type', docType);

      const res = await fetch(`${API_BASE}/shops/upload-doc`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      const uploadedUrl = data.document_url || data.file_url || data.url;

      if (res.ok && data.success && uploadedUrl) {
        if (docType === 'aadhaar') setRegAadhaarDocUrl(uploadedUrl);
        else if (docType === 'fssai') setRegFssaiDocUrl(uploadedUrl);
        else if (docType === 'pan') setRegPanDocUrl(uploadedUrl);
        else if (docType === 'shop_photo') setRegShopPhotoUrl(uploadedUrl);
        setError('');
        const title = getDocTitle(docType);
        Alert.alert('Upload Successful', `${title} uploaded and attached successfully.`);
      } else {
        const uploadErr = data?.error || 'Failed to upload photo to server. Please try again.';
        setError(uploadErr);
        Alert.alert('Upload Failed', uploadErr);
      }
    } catch (e: any) {
      const netErr = 'Network error while uploading photo. Please ensure your internet connection is active.';
      setError(netErr);
      Alert.alert('Upload Network Error', netErr);
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
    if (!regCity.trim() || !regArea.trim()) {
      const err = 'City and locality/area are required. Fill them in Step 2 after GPS detect.';
      setError(err);
      Alert.alert('Location Required', err);
      setRegStep(2);
      return;
    }
    if (!/^\d{6}$/.test(regPincode.trim())) {
      const err = 'Enter a valid 6-digit pincode in Step 2.';
      setError(err);
      Alert.alert('Pincode Required', err);
      setRegStep(2);
      return;
    }
    if (!regAadhaarDocUrl) {
      const err = 'Aadhaar Card photo upload is mandatory. Please upload a clear photo of your Aadhaar Card.';
      setError(err);
      Alert.alert('Aadhaar Photo Required', err);
      setRegStep(3);
      return;
    }
    if (regAadhaarDocUrl.startsWith('data:')) {
      const err = 'Please upload a clear photo of your Aadhaar Card.';
      setError(err);
      Alert.alert('Upload Error', err);
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
        city: regCity.trim(),
        area_name: regArea.trim(),
        street_address: regStreetAddress.trim() || `${regArea}, ${regCity}`,
        detailed_address: regDetailedAddress.trim() || '',
        address_line: (regDetailedAddress ? `${regDetailedAddress}, ${regStreetAddress}` : regStreetAddress).trim(),
        pincode: regPincode.trim(),
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
        setRegApplicationStatus('pending');
        setRegStatusMessage('Application submitted. Status: pending Super Admin approval.');
        void fetchRegistrationStatus(regMobile);
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
      <StatusBar barStyle="dark-content" />
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
              <Store size={26} color="#059669" strokeWidth={2.2} />
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
              <View style={styles.tabContentRow}>
                <LogIn size={15} color={mode === 'login' ? '#059669' : '#64748B'} strokeWidth={2.2} />
                <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                  Sign In
                </Text>
              </View>
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
              <View style={styles.tabContentRow}>
                <UserPlus size={15} color={mode === 'register' ? '#059669' : '#64748B'} strokeWidth={2.2} />
                <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                  Onboard Store
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={15} color="#DC2626" style={{ marginTop: 1 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* MODE 1: SIGN IN (100% CLEAN & MINIMAL) */}
          {mode === 'login' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Merchant Sign In</Text>
              <Text style={styles.cardSubtitle}>
                {step === 1
                  ? 'Access your store dashboard, inventory & live orders'
                  : `Enter the 6-digit OTP code sent to +91 ${mobile}`}
              </Text>

              {step === 1 ? (
                <>
                  <Text style={styles.inputLabel}>REGISTERED MOBILE NUMBER</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="9876543210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={(t) => {
                        const clean = t.replace(/[^\d]/g, '');
                        let sanitized = clean;
                        if (sanitized.startsWith('91') && sanitized.length > 10) {
                          sanitized = sanitized.slice(2);
                        } else if (sanitized.startsWith('0') && sanitized.length > 10) {
                          sanitized = sanitized.slice(1);
                        }
                        setMobile(sanitized.slice(0, 10));
                        if (error) setError('');
                      }}
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
                      <View style={styles.btnIconRow}>
                        <Text style={styles.primaryBtnText}>Get OTP Code</Text>
                        <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
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
                    placeholderTextColor="#94A3B8"
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
                      <View style={styles.btnIconRow}>
                        <Text style={styles.primaryBtnText}>Verify & Open Store</Text>
                        <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
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
              {/* Top Sleek Track Application Status Banner */}
              <TouchableOpacity
                style={styles.trackStatusBanner}
                onPress={() => setShowStatusSection((prev) => !prev)}
                activeOpacity={0.85}
              >
                <View style={styles.trackStatusLeft}>
                  <View style={styles.trackStatusIconBadge}>
                    <ClipboardList size={16} color="#0284C7" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackStatusTitle}>Already submitted application?</Text>
                    <Text style={styles.trackStatusSubtitle}>Check store onboarding & approval status</Text>
                  </View>
                </View>
                <View style={styles.trackStatusActionRow}>
                  <Text style={styles.trackStatusAction}>{showStatusSection ? 'Hide' : 'Track Status'}</Text>
                  {showStatusSection ? (
                    <ChevronUp size={14} color="#0284C7" strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={14} color="#0284C7" strokeWidth={2.5} />
                  )}
                </View>
              </TouchableOpacity>

              {showStatusSection && (
                <View style={styles.statusCheckDrawer}>
                  <Text style={styles.inputLabel}>ENTER REGISTERED MOBILE NUMBER</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={statusCheckMobile}
                      onChangeText={(t) => setStatusCheckMobile(t.replace(/[^\d]/g, '').slice(0, 10))}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.trackStatusSubmitBtn, statusCheckMobile.length < 10 && styles.btnDisabled]}
                    disabled={statusCheckMobile.length < 10 || regStatusLoading}
                    onPress={() => fetchRegistrationStatus(statusCheckMobile)}
                    activeOpacity={0.85}
                  >
                    {regStatusLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={styles.btnIconRow}>
                        <Text style={styles.trackStatusSubmitBtnText}>Check Live Status</Text>
                        <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                  {regStatusMessage ? (
                    <View style={styles.statusResultBox}>
                      {regApplicationStatus === 'pending' ? (
                        <Clock size={15} color="#D97706" style={{ marginTop: 2 }} />
                      ) : regApplicationStatus === 'approved' ? (
                        <CheckCircle2 size={15} color="#16A34A" style={{ marginTop: 2 }} />
                      ) : regApplicationStatus === 'rejected' ? (
                        <AlertCircle size={15} color="#DC2626" style={{ marginTop: 2 }} />
                      ) : (
                        <Info size={15} color="#0284C7" style={{ marginTop: 2 }} />
                      )}
                      <Text style={styles.statusResultText}>{regStatusMessage}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {regSuccess ? (
                <View style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <CheckCircle2 size={36} color="#16A34A" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.successTitle}>Application Submitted!</Text>
                  <Text style={styles.successMessage}>
                    Your Kirana store "{regSuccess.shop?.shop_name || regShopName}" registration has been submitted to Web Admin for document verification and map approval.
                  </Text>
                  <View style={styles.successGpsBadge}>
                    <MapPin size={15} color="#15803D" style={{ marginTop: 1 }} />
                    <Text style={styles.successGpsText}>
                      Pinned Street: {regSuccess.shop?.street_address || regStreetAddress}
                    </Text>
                  </View>
                  {regStatusMessage ? (
                    <View style={styles.successGpsBadge}>
                      {regApplicationStatus === 'pending' ? (
                        <Clock size={15} color="#D97706" style={{ marginTop: 1 }} />
                      ) : regApplicationStatus === 'approved' ? (
                        <CheckCircle2 size={15} color="#16A34A" style={{ marginTop: 1 }} />
                      ) : regApplicationStatus === 'rejected' ? (
                        <AlertCircle size={15} color="#DC2626" style={{ marginTop: 1 }} />
                      ) : (
                        <Info size={15} color="#0284C7" style={{ marginTop: 1 }} />
                      )}
                      <Text style={styles.successGpsText}>{regStatusMessage}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.successSignInBtn, { marginBottom: 10 }]}
                    onPress={() => fetchRegistrationStatus(regMobile)}
                    disabled={regStatusLoading}
                    activeOpacity={0.85}
                  >
                    {regStatusLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={styles.btnIconRow}>
                        <RefreshCw size={16} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.successSignInBtnText}>Refresh Application Status</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.successSignInBtn}
                    onPress={() => {
                      setMode('login');
                      setMobile(regMobile);
                      setStatusCheckMobile(regMobile);
                      setError('');
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.btnIconRow}>
                      <LogIn size={16} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.successSignInBtnText}>Back to Sign In</Text>
                      <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
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
                        <Store size={14} color="#0284C7" strokeWidth={2.2} />
                        <Text style={styles.stepHeaderBannerTitle}>STEP 1: STORE & OWNER IDENTITY</Text>
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
                          <Text style={styles.countryCodeText}>+91</Text>
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
                        <View style={styles.btnIconRow}>
                          <Text style={styles.submitApprovalBtnText}>Continue to GPS Location</Text>
                          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
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
                        <MapPin size={14} color="#0284C7" strokeWidth={2.2} />
                        <Text style={styles.stepHeaderBannerTitle}>STEP 2: STORE GPS & STREET LOCATION</Text>
                      </View>

                      {/* GPS Status & Google Maps Card */}
                      {regLat && regLng && regStreetAddress ? (
                        <View style={styles.verifiedAddressCard}>
                          <View style={styles.verifiedHeaderRow}>
                            <View style={styles.verifiedBadge}>
                              <Check size={11} color="#059669" strokeWidth={3} />
                              <Text style={styles.verifiedBadgeText}>GOOGLE MAPS PIN LOCKED</Text>
                            </View>
                            <View style={styles.verifiedAccuracyBadge}>
                              <Navigation size={11} color="#0284C7" strokeWidth={2.2} />
                              <Text style={styles.verifiedAccuracyText}>High Accuracy</Text>
                            </View>
                          </View>

                          {/* Full Locked Street Address Display */}
                          <View style={styles.addressDisplayBox}>
                            <MapPin size={16} color="#059669" style={{ marginRight: 8, marginTop: 2 }} />
                            <Text style={styles.addressDisplayText}>{regStreetAddress}</Text>
                          </View>

                          {/* Prominent Coordinates Badge Grid */}
                          <View style={styles.coordsGridRow}>
                            <View style={styles.coordBox}>
                              <View style={styles.coordBoxHeader}>
                                <MapPin size={10} color="#0284C7" />
                                <Text style={styles.coordBoxLabel}>LATITUDE</Text>
                              </View>
                              <Text style={styles.coordBoxValue}>{regLat.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordBox}>
                              <View style={styles.coordBoxHeader}>
                                <MapPin size={10} color="#0284C7" />
                                <Text style={styles.coordBoxLabel}>LONGITUDE</Text>
                              </View>
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
                              <View style={styles.btnIconRow}>
                                <ExternalLink size={12} color="#0284C7" strokeWidth={2.2} />
                                <Text style={styles.openMapsBtnText}>View on Maps</Text>
                              </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.redetectBtn}
                              onPress={handleDetectGps}
                              disabled={detectingGps}
                              activeOpacity={0.8}
                            >
                              {detectingGps ? (
                                <ActivityIndicator color="#0284C7" size="small" />
                              ) : (
                                <View style={styles.btnIconRow}>
                                  <RefreshCw size={12} color="#0284C7" strokeWidth={2.2} />
                                  <Text style={styles.redetectBtnText}>Re-detect GPS</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.gpsDetectCard}>
                          <View style={styles.gpsDetectHeader}>
                            <View style={styles.gpsIconCircle}>
                              <Navigation size={22} color="#0284C7" strokeWidth={2.2} />
                            </View>
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
                              <View style={styles.btnIconRow}>
                                <Navigation size={15} color="#FFFFFF" strokeWidth={2.2} />
                                <Text style={styles.detectGpsPrimaryBtnText}>Detect & Lock Store GPS Location</Text>
                              </View>
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
                      <View style={styles.hintRow}>
                        <Info size={12} color="#64748B" style={{ marginTop: 2 }} />
                        <Text style={styles.fieldHint}>
                          Enter shop number/building name. Confirm city, area, and pincode below (auto-filled from GPS when available).
                        </Text>
                      </View>

                      <Text style={styles.inputLabel}>CITY *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Pune"
                        placeholderTextColor="#475569"
                        value={regCity}
                        onChangeText={setRegCity}
                      />

                      <Text style={styles.inputLabel}>LOCALITY / AREA *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Ravet, Baner"
                        placeholderTextColor="#475569"
                        value={regArea}
                        onChangeText={setRegArea}
                      />

                      <Text style={styles.inputLabel}>6-DIGIT PINCODE *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="411057"
                        placeholderTextColor="#475569"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={regPincode}
                        onChangeText={(t) => setRegPincode(t.replace(/[^\d]/g, '').slice(0, 6))}
                      />

                      {/* Navigation Buttons */}
                      <View style={styles.actionButtonsContainer}>
                        <View style={styles.row}>
                          <TouchableOpacity
                            style={[styles.backBtnSecondary, { flex: 1, marginRight: 6 }]}
                            onPress={() => setRegStep(1)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.btnIconRow}>
                              <ArrowLeft size={14} color="#475569" strokeWidth={2.2} />
                              <Text style={styles.backBtnSecondaryText}>Back</Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.submitApprovalBtn, { flex: 2, marginLeft: 6 }]}
                            onPress={() => {
                              if (!regLat || !regLng) {
                                setError('Please detect your Store GPS Location first.');
                                return;
                              }
                              if (!regCity.trim() || !regArea.trim()) {
                                setError('City and locality/area are required.');
                                return;
                              }
                              if (!/^\d{6}$/.test(regPincode.trim())) {
                                setError('Enter a valid 6-digit pincode.');
                                return;
                              }
                              setError('');
                              setRegStep(3);
                            }}
                            activeOpacity={0.85}
                          >
                            <View style={styles.btnIconRow}>
                              <Text style={styles.submitApprovalBtnText}>Next: KYC Docs</Text>
                              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
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
                        <FileText size={14} color="#0284C7" strokeWidth={2.2} />
                        <Text style={styles.stepHeaderBannerTitle}>STEP 3: COMPLIANCE & KYC DOCUMENTS</Text>
                      </View>

                      {/* Pinned Store Location & GPS Coordinates Summary */}
                      {regLat && regLng ? (
                        <View style={styles.locationReviewHeader}>
                          <View style={styles.locationReviewTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <MapPin size={13} color="#0369A1" strokeWidth={2.2} />
                              <Text style={styles.locationReviewTitle}>PINNED STORE GPS LOCATION</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${regLat},${regLng}`)}
                              style={styles.locationReviewMapsBtn}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <ExternalLink size={10} color="#0284C7" strokeWidth={2.2} />
                                <Text style={styles.locationReviewMapsBtnText}>Maps</Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.locationReviewStreet} numberOfLines={2}>
                            {regDetailedAddress ? `${regDetailedAddress}, ` : ''}{regStreetAddress}
                          </Text>
                          <View style={styles.coordsGridRow}>
                            <View style={styles.coordBox}>
                              <View style={styles.coordBoxHeader}>
                                <MapPin size={10} color="#0284C7" />
                                <Text style={styles.coordBoxLabel}>LATITUDE</Text>
                              </View>
                              <Text style={styles.coordBoxValue}>{regLat.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordBox}>
                              <View style={styles.coordBoxHeader}>
                                <MapPin size={10} color="#0284C7" />
                                <Text style={styles.coordBoxLabel}>LONGITUDE</Text>
                              </View>
                              <Text style={styles.coordBoxValue}>{regLng.toFixed(6)}</Text>
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {/* 1. Aadhaar Card Section (MANDATORY) */}
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
                            <CreditCard size={15} color="#0F172A" strokeWidth={2.2} />
                            <Text style={styles.docSectionTitle}>1. Aadhaar Card</Text>
                            <View style={styles.docRequiredBadge}>
                              <Text style={styles.docRequiredBadgeText}>* Mandatory</Text>
                            </View>
                          </View>
                          {regAadhaarDocUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Check size={10} color="#15803D" strokeWidth={3} />
                              <Text style={styles.docUploadedBadgeText}>ATTACHED</Text>
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

                        {/* Error Text only when validation fails */}
                        {error && !regAadhaarDocUrl && (
                          <View style={styles.fieldErrorBox}>
                            <AlertCircle size={13} color="#DC2626" />
                            <Text style={styles.fieldErrorText}>Please upload Aadhaar Card photo to continue</Text>
                          </View>
                        )}
                        {error && regAadhaarNumber && regAadhaarNumber.length !== 12 && (
                          <View style={styles.fieldErrorBox}>
                            <AlertCircle size={13} color="#DC2626" />
                            <Text style={styles.fieldErrorText}>Aadhaar Number must be exactly 12 digits</Text>
                          </View>
                        )}

                        {regAadhaarDocUrl && (
                          <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: regAadhaarDocUrl }} style={styles.docThumbnail} />
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 size={14} color="#16A34A" />
                              <Text style={styles.thumbnailLabel}>Aadhaar Card Attached</Text>
                            </View>
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
                            <ActivityIndicator color="#0284C7" />
                          ) : (
                            <View style={styles.btnIconRow}>
                              {regAadhaarDocUrl ? (
                                <RefreshCw size={13} color="#16A34A" strokeWidth={2.2} />
                              ) : (
                                <Camera size={14} color="#0284C7" strokeWidth={2.2} />
                              )}
                              <Text
                                style={[
                                  styles.uploadDocBtnText,
                                  regAadhaarDocUrl && styles.uploadDocBtnUploadedText,
                                ]}
                              >
                                {regAadhaarDocUrl ? 'Change Aadhaar Photo' : 'Take Photo / Upload Aadhaar *'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 2. FSSAI License Section */}
                      <View style={[styles.docSection, regFssaiDocUrl && styles.docSectionUploaded]}>
                        <View style={styles.docHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={15} color="#0F172A" strokeWidth={2.2} />
                            <Text style={styles.docSectionTitle}>2. FSSAI Food License / Certificate</Text>
                          </View>
                          {regFssaiDocUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Check size={10} color="#15803D" strokeWidth={3} />
                              <Text style={styles.docUploadedBadgeText}>ATTACHED</Text>
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
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 size={14} color="#16A34A" />
                              <Text style={styles.thumbnailLabel}>FSSAI License Attached</Text>
                            </View>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.uploadDocBtn, regFssaiDocUrl && styles.uploadDocBtnUploaded]}
                          onPress={() => handleUploadDocument('fssai')}
                          disabled={uploadingDoc === 'fssai'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'fssai' ? (
                            <ActivityIndicator color="#0284C7" />
                          ) : (
                            <View style={styles.btnIconRow}>
                              {regFssaiDocUrl ? (
                                <RefreshCw size={13} color="#16A34A" strokeWidth={2.2} />
                              ) : (
                                <Camera size={14} color="#0284C7" strokeWidth={2.2} />
                              )}
                              <Text style={[styles.uploadDocBtnText, regFssaiDocUrl && styles.uploadDocBtnUploadedText]}>
                                {regFssaiDocUrl ? 'Change FSSAI Photo' : 'Take Photo / Upload FSSAI'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 3. PAN Card & GSTIN */}
                      <View style={[styles.docSection, regPanDocUrl && styles.docSectionUploaded]}>
                        <View style={styles.docHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <FileText size={15} color="#0F172A" strokeWidth={2.2} />
                            <Text style={styles.docSectionTitle}>3. PAN Card & GSTIN</Text>
                          </View>
                          {regPanDocUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Check size={10} color="#15803D" strokeWidth={3} />
                              <Text style={styles.docUploadedBadgeText}>ATTACHED</Text>
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
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 size={14} color="#16A34A" />
                              <Text style={styles.thumbnailLabel}>PAN Card Attached</Text>
                            </View>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.uploadDocBtn, regPanDocUrl && styles.uploadDocBtnUploaded]}
                          onPress={() => handleUploadDocument('pan')}
                          disabled={uploadingDoc === 'pan'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'pan' ? (
                            <ActivityIndicator color="#0284C7" />
                          ) : (
                            <View style={styles.btnIconRow}>
                              {regPanDocUrl ? (
                                <RefreshCw size={13} color="#16A34A" strokeWidth={2.2} />
                              ) : (
                                <Camera size={14} color="#0284C7" strokeWidth={2.2} />
                              )}
                              <Text style={[styles.uploadDocBtnText, regPanDocUrl && styles.uploadDocBtnUploadedText]}>
                                {regPanDocUrl ? 'Change PAN Photo' : 'Upload PAN Document'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 4. Storefront Photo */}
                      <View style={[styles.docSection, regShopPhotoUrl && styles.docSectionUploaded]}>
                        <View style={styles.docHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Store size={15} color="#0F172A" strokeWidth={2.2} />
                            <Text style={styles.docSectionTitle}>4. Storefront / Shop Board Photo</Text>
                          </View>
                          {regShopPhotoUrl ? (
                            <View style={styles.docUploadedBadge}>
                              <Check size={10} color="#15803D" strokeWidth={3} />
                              <Text style={styles.docUploadedBadgeText}>ATTACHED</Text>
                            </View>
                          ) : null}
                        </View>

                        {regShopPhotoUrl && (
                          <View style={styles.thumbnailContainer}>
                            <Image source={{ uri: regShopPhotoUrl }} style={styles.docThumbnail} />
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 size={14} color="#16A34A" />
                              <Text style={styles.thumbnailLabel}>Storefront Board Photo Attached</Text>
                            </View>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.uploadDocBtn, regShopPhotoUrl && styles.uploadDocBtnUploaded]}
                          onPress={() => handleUploadDocument('shop_photo')}
                          disabled={uploadingDoc === 'shop_photo'}
                          activeOpacity={0.8}
                        >
                          {uploadingDoc === 'shop_photo' ? (
                            <ActivityIndicator color="#0284C7" />
                          ) : (
                            <View style={styles.btnIconRow}>
                              {regShopPhotoUrl ? (
                                <RefreshCw size={13} color="#16A34A" strokeWidth={2.2} />
                              ) : (
                                <Camera size={14} color="#0284C7" strokeWidth={2.2} />
                              )}
                              <Text style={[styles.uploadDocBtnText, regShopPhotoUrl && styles.uploadDocBtnUploadedText]}>
                                {regShopPhotoUrl ? 'Change Storefront Photo' : 'Take Shop Board Photo'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Action Buttons with Spacing & Layout */}
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
                            <View style={styles.btnIconRow}>
                              <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.2} />
                              <Text style={styles.submitApprovalBtnText}>Submit Store for Approval</Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        <View style={styles.secondaryActionsRow}>
                          <TouchableOpacity
                            style={styles.backBtnSecondary}
                            onPress={() => setRegStep(2)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.btnIconRow}>
                              <ArrowLeft size={14} color="#475569" strokeWidth={2.2} />
                              <Text style={styles.backBtnSecondaryText}>Back to Step 2</Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.backToSignInBtn}
                            onPress={() => {
                              setMode('login');
                              setError('');
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.btnIconRow}>
                              <LogIn size={14} color="#0284C7" strokeWidth={2.2} />
                              <Text style={styles.backToSignInBtnText}>Back to Sign In</Text>
                            </View>
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
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    backgroundColor: '#F8FAFC',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  roleChip: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },
  roleChipText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 16,
  },
  trackStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
  },
  trackStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trackStatusIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  trackStatusSubtitle: {
    fontSize: 10,
    color: '#0284C7',
    marginTop: 1,
  },
  trackStatusActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
  },
  trackStatusAction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
  },
  statusCheckDrawer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  trackStatusSubmitBtn: {
    backgroundColor: '#0284C7',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  trackStatusSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statusResultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  statusResultText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  stepperContainer: {
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
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
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#16A34A',
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
    color: '#16A34A',
    fontWeight: '800',
  },
  stepContent: {
    marginTop: 4,
  },
  stepHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  stepHeaderBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    color: '#0F172A',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 13,
    marginBottom: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 2,
    marginBottom: 6,
  },
  fieldHint: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  detailedAddressInput: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  /* VERIFIED ADDRESS CARD */
  verifiedAddressCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    flexShrink: 1,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedAccuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  verifiedAccuracyText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  addressDisplayBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  addressDisplayText: {
    flex: 1,
    color: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  coordBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  coordBoxLabel: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coordBoxValue: {
    color: '#0369A1',
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapsBtnText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
  },
  redetectBtn: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redetectBtnText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
  },
  locationReviewHeader: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
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
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  locationReviewMapsBtn: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationReviewMapsBtnText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
  },
  locationReviewStreet: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 10,
  },
  /* GPS DETECT INITIAL CARD */
  gpsDetectCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 16,
    marginBottom: 14,
  },
  gpsDetectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsDetectTitle: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gpsDetectSubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  detectGpsPrimaryBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 52,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  docSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  docSectionUploaded: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  docSectionError: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
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
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  docRequiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  docRequiredBadgeText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  docHintText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  fieldErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  fieldErrorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  docUploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  docUploadedBadgeText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  docThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  thumbnailLabel: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadDocBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDocBtnUploaded: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  uploadDocBtnText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadDocBtnUploadedText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  actionButtonsContainer: {
    marginTop: 16,
    gap: 10,
  },
  submitApprovalBtn: {
    backgroundColor: '#16A34A',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnSecondaryText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  backToSignInBtn: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToSignInBtnText: {
    color: '#0284C7',
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
    color: '#64748B',
    fontSize: 12,
  },
  backToSignInFooterLink: {
    color: '#16A34A',
    fontWeight: '800',
  },
  successSignInBtn: {
    backgroundColor: '#16A34A',
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  successSignInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  registerPromptRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerPromptText: {
    color: '#64748B',
    fontSize: 13,
  },
  registerPromptLink: {
    color: '#16A34A',
    fontWeight: '800',
  },
  resendRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  resendLink: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  resendTimerText: {
    color: '#64748B',
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
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
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  successMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  successGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  successGpsText: {
    flex: 1,
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
});
