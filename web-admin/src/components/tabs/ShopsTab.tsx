'use client';

import React, { useState, useMemo } from 'react';
import {
  Store,
  Trash2,
  X,
  Search,
  MapPin,
  Zap,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileText,
  ShieldCheck,
  Eye,
  ExternalLink,
  Lock,
  Upload,
  Camera,
  Check,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  Building,
  FileCheck,
  Map,
} from 'lucide-react';
import { Shop, AdminState, AdminDistrict, City, Area, ServiceableLocation } from '../../types/admin.types';
import { resolvePackUnitLabel } from '../../lib/packUnits';
import { apiFetch, API_BASE } from '../../utils/api';
import { validateIndianPincode } from '../../utils/pincodeValidator';

interface ShopsTabProps {
  shops: Shop[];
  adminStates: AdminState[];
  adminDistricts: AdminDistrict[];
  regDistrictOptions: AdminDistrict[];
  regShopName: string;
  setRegShopName: (val: string) => void;
  regOwnerName: string;
  setRegOwnerName: (val: string) => void;
  regOwnerMobile: string;
  setRegOwnerMobile: (val: string) => void;
  regStateId: string;
  setRegStateId: (val: string) => void;
  regDistrictId: string;
  setRegDistrictId: (val: string) => void;
  regCity: string;
  setRegCity: (val: string) => void;
  regArea?: string;
  setRegArea?: (val: string) => void;
  regPincode?: string;
  setRegPincode?: (val: string) => void;
  regLat?: string;
  setRegLat?: (val: string) => void;
  regLng?: string;
  setRegLng?: (val: string) => void;
  regRadius?: string;
  setRegRadius?: (val: string) => void;
  cities?: City[];
  areas?: Area[];
  locations?: ServiceableLocation[];
  locCity?: string;
  setLocCity?: (val: string) => void;
  locArea?: string;
  setLocArea?: (val: string) => void;
  locPin?: string;
  setLocPin?: (val: string) => void;
  locShop?: string;
  setLocShop?: (val: string) => void;
  handleAddLocation?: (e: React.FormEvent) => void;
  handleUpdateLocationShop?: (locId: string, shopId: string) => void;
  handleBulkAssignPincode?: (pincode: string, shopId: string, city?: string) => Promise<void>;
  handleDeleteLocation?: (locId: string) => void;
  handleRegisterShop: (e: React.FormEvent) => void;
  handleUpdateShopStatus: (
    shopId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
    approvalData?: {
      area_name?: string;
      city?: string;
      pincode?: string;
      delivery_radius_km?: number;
      latitude?: number;
      longitude?: number;
      assigned_areas?: Array<{ area_name: string; city?: string; pincode?: string } | string>;
      additional_areas?: string[];
    }
  ) => void | Promise<void>;
  handleDeleteShop: (shopId: string, shopName: string) => void;
  fetchData: () => void;
  masterProductsList: any[];
  token: string | null;
  setActiveTab?: (tab: any) => void;
}

export default function ShopsTab({
  shops,
  adminStates,
  adminDistricts,
  regDistrictOptions,
  regShopName,
  setRegShopName,
  regOwnerName,
  setRegOwnerName,
  regOwnerMobile,
  setRegOwnerMobile,
  regStateId,
  setRegStateId,
  regDistrictId,
  setRegDistrictId,
  regCity,
  setRegCity,
  regArea = '',
  setRegArea,
  regPincode = '',
  setRegPincode,
  regLat = '',
  setRegLat,
  regLng = '',
  setRegLng,
  regRadius = '5.0',
  setRegRadius,
  cities = [],
  areas = [],
  locations = [],
  locCity = '',
  setLocCity,
  locArea = '',
  setLocArea,
  locPin = '',
  setLocPin,
  locShop = '',
  setLocShop,
  handleAddLocation,
  handleUpdateLocationShop,
  handleBulkAssignPincode,
  handleDeleteLocation,
  handleRegisterShop,
  handleUpdateShopStatus,
  handleDeleteShop,
  fetchData,
  masterProductsList,
  token,
  setActiveTab,
}: ShopsTabProps) {
  // Helper to safely resolve document URLs (rewriting S3 403 URLs to backend media stream proxy)
  const getSafeDocUrl = (url?: string | null): string => {
    if (!url) return '';
    const s = String(url).trim();
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    const s3Match = s.match(/amazonaws\.com\/(.+)$/);
    if (s3Match) {
      return `/backend-api/shops/doc-file/${s3Match[1]}`;
    }
    if (s.startsWith('/api/shops/doc-file/')) {
      return `/backend-api${s.replace(/^\/api/, '')}`;
    }
    if (s.startsWith('http://localhost:8001/api/shops/doc-file/')) {
      return s.replace('http://localhost:8001/api', '/backend-api');
    }
    return s;
  };

  // Tab View Mode: 'table' vs 'register' vs 'coverage' vs 'map'
  const [viewMode, setViewMode] = useState<'table' | 'register' | 'coverage' | 'map'>('table');
  const [selectedShopForZones, setSelectedShopForZones] = useState<Shop | null>(null);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopStatusFilter, setShopStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [coverageSearchQuery, setCoverageSearchQuery] = useState('');
  const [coverageFilterPin, setCoverageFilterPin] = useState('');
  const [coverageShopFilter, setCoverageShopFilter] = useState('');
  const [bulkPin, setBulkPin] = useState('');
  const [bulkShop, setBulkShop] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [detectingAdminGps, setDetectingAdminGps] = useState(false);
  const [pincodeSearchQuery, setPincodeSearchQuery] = useState('');
  const [manualPincodeMode, setManualPincodeMode] = useState(false);
  const [manualCityMode, setManualCityMode] = useState(false);

  // Review Application Modal State (tracked by ID for clean React state without re-render loops)
  const [selectedReviewShopId, setSelectedReviewShopId] = useState<string | null>(null);
  const selectedShopForReview = useMemo(() => {
    if (!selectedReviewShopId) return null;
    return shops.find((s) => s.id === selectedReviewShopId) || null;
  }, [shops, selectedReviewShopId]);
  const setSelectedShopForReview = (shop: Shop | null) => {
    setSelectedReviewShopId(shop ? shop.id : null);
  };

  // Approval & Area Assignment Modal State
  const [approveModalShop, setApproveModalShop] = useState<Shop | null>(null);
  const [approveSelectedCity, setApproveSelectedCity] = useState('');
  const [approveSelectedArea, setApproveSelectedArea] = useState('');
  const [approvePincode, setApprovePincode] = useState('');
  const [approveRadius, setApproveRadius] = useState('5.0');
  const [approveAdditionalAreas, setApproveAdditionalAreas] = useState<string[]>([]);
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  // Open Approval with Area Assignment Dialog
  const openApproveModal = (shop: Shop) => {
    setApproveModalShop(shop);
    const shopCity = (shop.city || '').trim();
    const matchedCity = (cities || []).find(
      (c) => c.name.toLowerCase() === shopCity.toLowerCase() || c.id === shopCity
    );

    const selectedCityName = matchedCity ? matchedCity.name : (cities && cities.length > 0 ? cities[0].name : '');
    setApproveSelectedCity(selectedCityName);

    // Compute areas for this city to find matched registered area
    const matchedCityObj = matchedCity || (cities || []).find((c) => c.name.toLowerCase() === selectedCityName.toLowerCase());
    const validAreasForCity = (areas || []).filter((a) => {
      if (matchedCityObj && a.city_id === matchedCityObj.id) return true;
      if (a.city_id === selectedCityName) return true;
      if ((a as any).city_name && (a as any).city_name.trim().toLowerCase() === selectedCityName.toLowerCase()) return true;
      return false;
    });

    const shopArea = (shop.area_name || '').trim().toLowerCase();
    const matchedArea = validAreasForCity.find((a) => a.name.trim().toLowerCase() === shopArea);

    if (matchedArea) {
      setApproveSelectedArea(matchedArea.name);
      setApprovePincode(matchedArea.pincode || shop.pincode || '');
      setApproveAdditionalAreas([matchedArea.name]);
    } else if (validAreasForCity.length > 0) {
      setApproveSelectedArea(validAreasForCity[0].name);
      setApprovePincode(validAreasForCity[0].pincode || shop.pincode || '');
      setApproveAdditionalAreas([validAreasForCity[0].name]);
    } else {
      setApproveSelectedArea('');
      setApprovePincode(shop.pincode || '');
      setApproveAdditionalAreas([]);
    }

    setApproveRadius(String(shop.delivery_radius_km || '5.0'));
  };

  // Rejection Reason Modal State
  const [rejectModalShop, setRejectModalShop] = useState<Shop | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Lightbox Image / Document Preview Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  // Extended Direct Register Form States
  const [regStreetAddress, setRegStreetAddress] = useState('');
  const [regDetailedAddress, setRegDetailedAddress] = useState('');
  const [regAadhaarNumber, setRegAadhaarNumber] = useState('');
  const [regAadhaarDocUrl, setRegAadhaarDocUrl] = useState('');
  const [regAadhaarUploading, setRegAadhaarUploading] = useState(false);
  const [regFssaiNumber, setRegFssaiNumber] = useState('');
  const [regFssaiDocUrl, setRegFssaiDocUrl] = useState('');
  const [regFssaiUploading, setRegFssaiUploading] = useState(false);
  const [regPanNumber, setRegPanNumber] = useState('');
  const [regPanDocUrl, setRegPanDocUrl] = useState('');
  const [regPanUploading, setRegPanUploading] = useState(false);
  const [regGstin, setRegGstin] = useState('');
  const [regShopPhotoUrl, setRegShopPhotoUrl] = useState('');
  const [regShopPhotoUploading, setRegShopPhotoUploading] = useState(false);
  const [directRegisterSubmitting, setDirectRegisterSubmitting] = useState(false);

  // Filtered shops list for Store Directory Table
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (shopStatusFilter !== 'all' && shop.status !== shopStatusFilter) {
        return false;
      }
      if (!shopSearchQuery.trim()) return true;
      const q = shopSearchQuery.trim().toLowerCase();
      const nameMatch = (shop.shop_name || '').toLowerCase().includes(q);
      const ownerMatch =
        (shop.profiles?.name || shop.owner_name || '').toLowerCase().includes(q) ||
        (shop.profiles?.phone || '').includes(q);
      const cityMatch =
        (shop.city || '').toLowerCase().includes(q) ||
        (shop.area_name || '').toLowerCase().includes(q) ||
        (shop.pincode || '').includes(q) ||
        (shop.street_address || '').toLowerCase().includes(q);
      return nameMatch || ownerMatch || cityMatch;
    });
  }, [shops, shopStatusFilter, shopSearchQuery]);

  const pendingShops = useMemo(() => shops.filter((s) => s.status === 'pending'), [shops]);

  // Cascading City -> Pincode -> Area computations for Store Registration
  const activeCityObj = useMemo(() => {
    if (!regCity || !regCity.trim()) return undefined;
    const cleanCity = regCity.trim().toLowerCase();
    return (cities || []).find(
      (c) => c.name.trim().toLowerCase() === cleanCity || c.id === regCity.trim()
    );
  }, [cities, regCity]);

  const cityFilteredAreas = useMemo(() => {
    if (!regCity || !regCity.trim()) return [];
    const cleanCity = regCity.trim().toLowerCase();

    // 1. Get from master areas table
    const fromAreas = (areas || []).filter((a) => {
      if (activeCityObj && a.city_id === activeCityObj.id) return true;
      if (a.city_id === regCity.trim()) return true;
      if ((a as any).city_name && (a as any).city_name.trim().toLowerCase() === cleanCity) return true;
      return false;
    });

    // 2. Also check locations table under this city
    const fromLocations = (locations || [])
      .filter((loc) => loc.city.trim().toLowerCase() === cleanCity)
      .map((loc) => ({
        id: loc.id,
        city_id: activeCityObj?.id || regCity,
        name: loc.area_name,
        pincode: loc.pincode,
      }));

    const merged: Area[] = [...fromAreas];
    for (const locArea of fromLocations) {
      const exists = merged.some(
        (a) =>
          a.name.trim().toLowerCase() === locArea.name.trim().toLowerCase() &&
          String(a.pincode || '').trim() === String(locArea.pincode || '').trim()
      );
      if (!exists) {
        merged.push(locArea as Area);
      }
    }

    return merged;
  }, [areas, locations, activeCityObj, regCity]);

  const cityUniquePincodes = useMemo(() => {
    if (!regCity || !regCity.trim()) return [];
    const pinSet = new Set<string>();
    cityFilteredAreas.forEach((a) => {
      const pin = a.pincode ? String(a.pincode).replace(/\D/g, '').slice(0, 6) : '';
      if (pin.length === 6) pinSet.add(pin);
    });
    return Array.from(pinSet).sort();
  }, [cityFilteredAreas, regCity]);

  const searchedPincodes = useMemo(() => {
    if (!pincodeSearchQuery.trim()) return cityUniquePincodes;
    const q = pincodeSearchQuery.trim().toLowerCase();
    return cityUniquePincodes.filter((pin) => {
      if (pin.includes(q)) return true;
      const matchingArea = cityFilteredAreas.some(
        (a) => a.pincode?.trim() === pin && a.name.toLowerCase().includes(q)
      );
      return matchingArea;
    });
  }, [cityUniquePincodes, pincodeSearchQuery, cityFilteredAreas]);

  const pincodeFilteredAreas = useMemo(() => {
    if (!regPincode || !regPincode.trim()) return [];
    return cityFilteredAreas.filter(
      (a) => String(a.pincode || '').trim() === regPincode.trim()
    );
  }, [cityFilteredAreas, regPincode]);

  const regPinValidation = useMemo(() => {
    if (!regPincode || !regPincode.trim()) return null;
    return validateIndianPincode(regPincode.trim());
  }, [regPincode]);

  const bulkPinValidation = useMemo(() => {
    if (!bulkPin || !bulkPin.trim()) return null;
    return validateIndianPincode(bulkPin.trim());
  }, [bulkPin]);

  // Cascading City -> Area computations for Store Approval Territory Mapping
  const approveEffectiveCity = useMemo(() => {
    return approveSelectedCity.trim();
  }, [approveSelectedCity]);

  const approveModalCityObj = useMemo(() => {
    if (!approveEffectiveCity) return undefined;
    const cleanCity = approveEffectiveCity.toLowerCase();
    return (cities || []).find(
      (c) => c.name.trim().toLowerCase() === cleanCity || c.id === approveEffectiveCity
    );
  }, [cities, approveEffectiveCity]);

  const approveModalAreas = useMemo(() => {
    if (!approveEffectiveCity) return [];
    const cleanCity = approveEffectiveCity.toLowerCase();

    // 1. Get from master areas table
    const fromAreas = (areas || []).filter((a) => {
      if (approveModalCityObj && a.city_id === approveModalCityObj.id) return true;
      if (a.city_id === approveEffectiveCity) return true;
      if ((a as any).city_name && (a as any).city_name.trim().toLowerCase() === cleanCity) return true;
      return false;
    });

    // 2. Also check locations table under this city
    const fromLocations = (locations || [])
      .filter((loc) => (loc.city || '').trim().toLowerCase() === cleanCity)
      .map((loc) => ({
        id: loc.id,
        city_id: approveModalCityObj?.id || approveEffectiveCity,
        name: loc.area_name,
        pincode: loc.pincode,
      }));

    const merged: Area[] = [...fromAreas];
    for (const locArea of fromLocations) {
      const exists = merged.some(
        (a) =>
          a.name.trim().toLowerCase() === locArea.name.trim().toLowerCase() &&
          String(a.pincode || '').trim() === String(locArea.pincode || '').trim()
      );
      if (!exists) {
        merged.push(locArea as Area);
      }
    }

    return merged;
  }, [areas, locations, approveModalCityObj, approveEffectiveCity]);

  const approveModalPincodes = useMemo(() => {
    if (!approveEffectiveCity) return [];
    const pinSet = new Set<string>();
    approveModalAreas.forEach((a) => {
      const pin = a.pincode ? String(a.pincode).replace(/\D/g, '').slice(0, 6) : '';
      if (pin.length === 6) pinSet.add(pin);
    });
    return Array.from(pinSet).sort();
  }, [approveModalAreas, approveEffectiveCity]);

  const approvePinValidation = useMemo(() => {
    if (!approvePincode || !approvePincode.trim()) return null;
    return validateIndianPincode(approvePincode.trim());
  }, [approvePincode]);

  // Upload document helper for Direct Onboarding form
  const handleUploadDocument = async (file: File, type: 'aadhaar' | 'fssai' | 'pan' | 'shop_photo') => {
    if (!file) return;

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Maximum photo size is 5MB. Please choose an image under 5MB.');
      return;
    }

    if (type === 'aadhaar') setRegAadhaarUploading(true);
    if (type === 'fssai') setRegFssaiUploading(true);
    if (type === 'pan') setRegPanUploading(true);
    if (type === 'shop_photo') setRegShopPhotoUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document', file);
      formData.append('doc_type', type);

      const freshToken = token || localStorage.getItem('@admin_token');
      const res = await fetch(`${API_BASE}/shops/upload-doc`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      const uploadedUrl = data.document_url || data.file_url || data.url;
      if (!res.ok || !uploadedUrl) {
        throw new Error(data.error || 'Document upload failed. Maximum size is 5MB.');
      }

      if (type === 'aadhaar') setRegAadhaarDocUrl(uploadedUrl);
      if (type === 'fssai') setRegFssaiDocUrl(uploadedUrl);
      if (type === 'pan') setRegPanDocUrl(uploadedUrl);
      if (type === 'shop_photo') setRegShopPhotoUrl(uploadedUrl);
    } catch (err: any) {
      alert(`Error uploading document: ${err.message || 'Network error'}`);
    } finally {
      if (type === 'aadhaar') setRegAadhaarUploading(false);
      if (type === 'fssai') setRegFssaiUploading(false);
      if (type === 'pan') setRegPanUploading(false);
      if (type === 'shop_photo') setRegShopPhotoUploading(false);
    }
  };

  // Google Maps GPS Auto-Detect with locked street address
  const handleDetectAdminGps = async () => {
    setDetectingAdminGps(true);

    const tryReverseGeocode = async (lat: number, lng: number) => {
      try {
        const res = await apiFetch('/addresses/reverse-geocode', {
          method: 'POST',
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
        if (res.success && res.location) {
          const loc = res.location;
          if (loc.formatted_address) {
            setRegStreetAddress(loc.formatted_address);
          } else if (loc.street) {
            setRegStreetAddress(loc.street);
          }
          if (loc.city && setRegCity) setRegCity(loc.city);
          if (loc.area && setRegArea) setRegArea(loc.area);
          if (loc.pincode && setRegPincode) setRegPincode(loc.pincode);
        }
      } catch (err) {
        console.error('Reverse geocode error:', err);
      }
    };

    const fallbackToGeocoding = async () => {
      const q =
        [regArea, regCity, regPincode].filter(Boolean).join(', ') ||
        (regCity ? `${regCity}, Maharashtra` : 'Pune, Maharashtra');
      try {
        const res = await apiFetch('/addresses/forward-geocode', {
          method: 'POST',
          body: JSON.stringify({ query: q }),
        });
        if (res.success && res.location?.latitude && res.location?.longitude) {
          const lat = parseFloat(res.location.latitude.toFixed(6));
          const lng = parseFloat(res.location.longitude.toFixed(6));
          if (setRegLat) setRegLat(String(lat));
          if (setRegLng) setRegLng(String(lng));
          if (res.location.formatted_address) {
            setRegStreetAddress(res.location.formatted_address);
          }
        } else {
          if (setRegLat) setRegLat('18.5204');
          if (setRegLng) setRegLng('73.8567');
        }
      } catch {
        if (setRegLat) setRegLat('18.5204');
        if (setRegLng) setRegLng('73.8567');
      } finally {
        setDetectingAdminGps(false);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          if (setRegLat) setRegLat(String(lat));
          if (setRegLng) setRegLng(String(lng));
          await tryReverseGeocode(lat, lng);
          setDetectingAdminGps(false);
        },
        async (err) => {
          console.warn('Browser GPS error, falling back to address geocoding:', err?.message);
          await fallbackToGeocoding();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      await fallbackToGeocoding();
    }
  };

  // Direct Admin Onboarding Submission
  const handleAdminDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !regShopName.trim() || !regOwnerName.trim() || !regOwnerMobile.trim()) {
      alert('Please fill out all store and owner fields');
      return;
    }
    if (!regStateId || !regDistrictId || !regCity.trim()) {
      alert('Please select state, district, and city for merchant access');
      return;
    }

    let validatedPin: string | undefined = undefined;
    if (regPincode && regPincode.trim()) {
      const pinVal = validateIndianPincode(regPincode.trim());
      if (!pinVal.isValid) {
        alert(`Invalid PIN Code: ${pinVal.error}`);
        return;
      }
      validatedPin = pinVal.formatted;
    }

    setDirectRegisterSubmitting(true);
    try {
      const res = await apiFetch('/shops/register', {
        method: 'POST',
        body: JSON.stringify({
          shop_name: regShopName.trim(),
          owner_name: regOwnerName.trim(),
          owner_mobile: regOwnerMobile.trim(),
          state_id: regStateId,
          district_id: regDistrictId,
          city: regCity.trim(),
          area_name: regArea.trim() || undefined,
          pincode: validatedPin || undefined,
          street_address: regStreetAddress.trim() || undefined,
          detailed_address: regDetailedAddress.trim() || undefined,
          latitude: regLat ? parseFloat(regLat) : undefined,
          longitude: regLng ? parseFloat(regLng) : undefined,
          delivery_radius_km: regRadius ? parseFloat(regRadius) : 5.0,
          aadhaar_number: regAadhaarNumber.trim() || undefined,
          aadhaar_doc_url: regAadhaarDocUrl || undefined,
          fssai_number: regFssaiNumber.trim() || undefined,
          fssai_doc_url: regFssaiDocUrl || undefined,
          pan_number: regPanNumber.trim() || undefined,
          pan_doc_url: regPanDocUrl || undefined,
          gstin: regGstin.trim() || undefined,
          shop_photo_url: regShopPhotoUrl || undefined,
        }),
      });

      if (res.success) {
        alert('🎉 Merchant store successfully registered & approved with all documents!');
        // Reset form
        setRegShopName('');
        setRegOwnerName('');
        setRegOwnerMobile('');
        setRegStateId('');
        setRegDistrictId('');
        setRegCity('');
        if (setRegArea) setRegArea('');
        if (setRegPincode) setRegPincode('');
        if (setRegLat) setRegLat('');
        if (setRegLng) setRegLng('');
        if (setRegRadius) setRegRadius('5.0');
        setRegStreetAddress('');
        setRegDetailedAddress('');
        setRegAadhaarNumber('');
        setRegAadhaarDocUrl('');
        setRegFssaiNumber('');
        setRegFssaiDocUrl('');
        setRegPanNumber('');
        setRegPanDocUrl('');
        setRegGstin('');
        setRegShopPhotoUrl('');
        setViewMode('table');
        fetchData();
      } else {
        alert(res.error || 'Failed to register store');
      }
    } catch (err: any) {
      alert(err.message || 'Error registering store');
    } finally {
      setDirectRegisterSubmitting(false);
    }
  };

  // Submit Rejection with Reason
  const handleConfirmRejection = async () => {
    if (!rejectModalShop || !token) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please enter a rejection reason to inform the merchant.');
      return;
    }

    setRejectSubmitting(true);
    try {
      await handleUpdateShopStatus(rejectModalShop.id, 'rejected', rejectionReasonInput.trim());
      setRejectModalShop(null);
      setRejectionReasonInput('');
      if (selectedShopForReview && selectedShopForReview.id === rejectModalShop.id) {
        setSelectedShopForReview(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject shop');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Submit Approval with Assigned Delivery Area & Coordinates
  const handleConfirmApproval = async () => {
    if (!approveModalShop || !token) return;
    const finalCity = approveSelectedCity.trim();
    const finalArea = approveSelectedArea.trim();
    if (!finalCity) {
      alert('Please select a registered Master City for this store.');
      return;
    }
    if (!finalArea) {
      alert('Please select a registered Primary Locality to assign to this merchant store.');
      return;
    }

    // Verify area belongs to master registered areas
    const isAreaRegistered = approveModalAreas.some(
      (a) => a.name.trim().toLowerCase() === finalArea.toLowerCase()
    );
    if (!isAreaRegistered && approveModalAreas.length > 0) {
      alert(`The locality "${finalArea}" is not in the registered list for ${finalCity}. Please select from the registered dropdown or add it in the Master Cities & Localities tab first.`);
      return;
    }

    // Build complete list of assigned areas including primary and all selected delivery zones
    const allAssignedSet = new Set<string>();
    allAssignedSet.add(finalArea);
    approveAdditionalAreas.forEach((a) => {
      if (a && a.trim() && approveModalAreas.some((ma) => ma.name.toLowerCase() === a.trim().toLowerCase())) {
        allAssignedSet.add(a.trim());
      }
    });

    const assignedAreasList = Array.from(allAssignedSet).map((areaName) => {
      const matchedAreaObj = approveModalAreas.find(
        (a) => a.name.trim().toLowerCase() === areaName.toLowerCase()
      );
      return {
        area_name: areaName,
        city: finalCity,
        pincode: matchedAreaObj?.pincode || approvePincode.trim() || approveModalShop.pincode || '',
      };
    });

    setApproveSubmitting(true);
    try {
      await handleUpdateShopStatus(
        approveModalShop.id,
        'approved',
        undefined,
        {
          area_name: finalArea,
          city: finalCity,
          pincode: approvePincode.trim() || approveModalShop.pincode || '',
          delivery_radius_km: parseFloat(approveRadius) || 5.0,
          latitude: approveModalShop.latitude != null && !isNaN(parseFloat(String(approveModalShop.latitude))) ? parseFloat(String(approveModalShop.latitude)) : undefined,
          longitude: approveModalShop.longitude != null && !isNaN(parseFloat(String(approveModalShop.longitude))) ? parseFloat(String(approveModalShop.longitude)) : undefined,
          assigned_areas: assignedAreasList,
          additional_areas: Array.from(allAssignedSet),
        }
      );
      setApproveModalShop(null);
      if (selectedShopForReview && selectedShopForReview.id === approveModalShop.id) {
        setSelectedShopForReview(null);
      }
      if (selectedShopForMap && selectedShopForMap.id === approveModalShop.id) {
        setSelectedShopForMap(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve shop');
    } finally {
      setApproveSubmitting(false);
    }
  };

  // Shop Map & Location Modal State
  const [selectedShopForMap, setSelectedShopForMap] = useState<Shop | null>(null);
  const [editLat, setEditLat] = useState<string>('');
  const [editLng, setEditLng] = useState<string>('');
  const [editRadius, setEditRadius] = useState<string>('5.0');
  const [savingLocation, setSavingLocation] = useState(false);

  // Network Map Selected Store
  const [networkSelectedShopId, setNetworkSelectedShopId] = useState<string>(shops[0]?.id || '');

  // Shop Inventory Modal States
  const [selectedShopForInventory, setSelectedShopForInventory] = useState<Shop | null>(null);
  const [shopInventoryList, setShopInventoryList] = useState<any[]>([]);
  const [assignProdId, setAssignProdId] = useState('');
  const [assignProdPrice, setAssignProdPrice] = useState('');
  const [assignProdDiscount, setAssignProdDiscount] = useState('');
  const [assignProdStock, setAssignProdStock] = useState('');

  const openShopMapModal = (shop: Shop) => {
    setSelectedShopForMap(shop);
    setEditLat(shop.latitude != null ? String(shop.latitude) : '18.5204');
    setEditLng(shop.longitude != null ? String(shop.longitude) : '73.8567');
    setEditRadius(String(shop.delivery_radius_km || 5.0));
  };

  const handleSaveShopLocation = async () => {
    if (!token || !selectedShopForMap) return;
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    const radius = parseFloat(editRadius) || 5.0;

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    setSavingLocation(true);
    try {
      const data = await apiFetch(`/shops/${selectedShopForMap.id}/location`, {
        method: 'PUT',
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          delivery_radius_km: radius,
        }),
      });

      if (data.success) {
        alert('Store GPS location and delivery radius updated successfully!');
        setSelectedShopForMap((prev) =>
          prev ? { ...prev, latitude: lat, longitude: lng, delivery_radius_km: radius } : null
        );
        fetchData();
      } else {
        alert(data.error || 'Failed to update store location');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating location');
    } finally {
      setSavingLocation(false);
    }
  };

  const fetchShopInventory = async (shopId: string) => {
    if (!token) return;
    try {
      const data = await apiFetch(`/admin/shop-inventory/${shopId}`);
      setShopInventoryList(data.shop_products || []);
    } catch (err: any) {
      console.error('Error fetching shop inventory:', err);
    }
  };

  const handleDirectAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedShopForInventory || !assignProdId || !assignProdPrice) {
      alert('Please select product and enter selling price');
      return;
    }
    try {
      const data = await apiFetch(`/admin/shop-inventory/${selectedShopForInventory.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: assignProdId,
          selling_price: parseFloat(assignProdPrice),
          discount_percentage: assignProdDiscount ? parseFloat(assignProdDiscount) : 0,
          stock: assignProdStock ? parseInt(assignProdStock) : 100,
        }),
      });
      if (data.success) {
        alert('Product assigned to shop successfully!');
        setAssignProdId('');
        setAssignProdPrice('');
        setAssignProdDiscount('');
        setAssignProdStock('');
        fetchShopInventory(selectedShopForInventory.id);
      } else {
        alert(data.error || 'Failed to assign product');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning product to shop');
    }
  };

  const handleUnassignShopProduct = async (invId: string) => {
    if (!confirm('Are you sure you want to remove this product from shop inventory?')) return;
    try {
      await apiFetch(`/admin/shop-inventory/${invId}`, {
        method: 'DELETE',
      });
      if (selectedShopForInventory) {
        fetchShopInventory(selectedShopForInventory.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error unassigning product');
    }
  };

  const activeNetworkShop = shops.find((s) => s.id === networkSelectedShopId) || shops[0] || null;
  const activeLat =
    activeNetworkShop?.latitude != null && !isNaN(Number(activeNetworkShop.latitude))
      ? Number(activeNetworkShop.latitude)
      : 18.5204;
  const activeLng =
    activeNetworkShop?.longitude != null && !isNaN(Number(activeNetworkShop.longitude))
      ? Number(activeNetworkShop.longitude)
      : 73.8567;

  return (
    <div className="space-y-6">
      {/* Pending Applications Alert Banner */}
      {pendingShops.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-900/20 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {pendingShops.length} Merchant Application{pendingShops.length > 1 ? 's' : ''} Pending Verification
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Inspect uploaded Aadhaar, FSSAI certificates, and Google Maps street pins to approve or reject merchant access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode('table');
                setShopStatusFilter('pending');
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              📋 Review Pending ({pendingShops.length})
            </button>
          </div>
        </div>
      )}

      {/* Top Controls Bar: View Switcher & Quick Stats */}
      <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏬 Stores & Approvals ({shops.length})
          </button>

          <button
            onClick={() => setViewMode('register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'register'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Direct Onboard Store
          </button>

          <button
            onClick={() => setViewMode('coverage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'coverage'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🗺️ Delivery Zones & Routing ({locations.length})
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📡 GPS Coverage Radar
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Approved: <strong className="text-white font-bold">{shops.filter((s) => s.status === 'approved').length}</strong>
          </span>
          {pendingShops.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Pending: <strong className="text-amber-400 font-bold">{pendingShops.length}</strong>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            Active Zones:{' '}
            <strong className="text-teal-400 font-bold">
              {locations.filter((l) => l.is_serviceable !== false && l.shop_id).length}
            </strong>
          </span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: NETWORK MAP */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  🗺️ City-Wide Store GPS Coverage Map
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizing active kirana stores and their delivery radius coverage zones.
                </p>
              </div>

              {activeNetworkShop && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  🌐 Open in Google Maps ↗
                </a>
              )}
            </div>

            <div className="w-full h-[460px] rounded-2xl overflow-hidden border border-slate-700/80 relative shadow-inner bg-slate-950">
              <iframe
                title="Store Network Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - 0.045}%2C${
                  activeLat - 0.035
                }%2C${activeLng + 0.045}%2C${activeLat + 0.035}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
                className="w-full h-full filter saturate-150 contrast-105"
              />

              {activeNetworkShop && (
                <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-700 rounded-2xl p-4 backdrop-blur-md shadow-2xl max-w-sm pointer-events-auto">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-white text-sm truncate">{activeNetworkShop.shop_name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeNetworkShop.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {activeNetworkShop.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">
                    👤 {activeNetworkShop.owner_name || activeNetworkShop.profiles?.name || 'Owner'} · 📞 +
                    {activeNetworkShop.profiles?.phone}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    📍 {activeNetworkShop.street_address || activeNetworkShop.area_name || activeNetworkShop.city || 'Pune'}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold">
                      🛵 Radius: {activeNetworkShop.delivery_radius_km || 5} KM (Free)
                    </span>
                    <button
                      onClick={() => openShopMapModal(activeNetworkShop)}
                      className="text-sky-400 hover:text-sky-300 font-bold text-xs cursor-pointer underline"
                    >
                      Edit Pin & Radius ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>🏪 Registered Stores ({shops.length})</span>
            </h3>

            <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
              {shops.map((shop) => {
                const isSelected = shop.id === networkSelectedShopId;
                const hasGps =
                  shop.latitude != null &&
                  shop.longitude != null &&
                  !isNaN(Number(shop.latitude)) &&
                  !isNaN(Number(shop.longitude));

                return (
                  <div
                    key={shop.id}
                    onClick={() => setNetworkSelectedShopId(shop.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm truncate">{shop.shop_name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          shop.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : shop.status === 'rejected'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-amber-500/15 text-amber-400 animate-pulse'
                        }`}
                      >
                        {shop.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {shop.city ? `${shop.city}` : 'No City'} {shop.area_name ? `· ${shop.area_name}` : ''}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                      {hasGps ? (
                        <span className="text-emerald-400 font-mono font-semibold">
                          📍 {Number(shop.latitude).toFixed(4)}, {Number(shop.longitude).toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-amber-400/90 font-medium">⚠️ GPS not pinned</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedShopForReview(shop);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                      >
                        📋 Docs & Review
                      </button>
                    </div>
                  </div>
                );
              })}

              {shops.length === 0 && (
                <div className="p-6 text-center text-slate-500 italic text-xs">No stores registered yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: STORES DIRECTORY & APPROVALS TABLE */}
      {viewMode === 'table' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <section className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            {/* Table Header & Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" /> Store Directory & Approvals
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review legal KYC documents (Aadhaar, FSSAI, PAN), inspect Google Maps street pins, and manage delivery territories.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search store, owner, street, city..."
                    value={shopSearchQuery}
                    onChange={(e) => setShopSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500 w-44 sm:w-56"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={shopStatusFilter}
                  onChange={(e: any) => setShopStatusFilter(e.target.value)}
                  className="h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value="all">All Statuses ({shops.length})</option>
                  <option value="pending">Pending Approvals ({shops.filter((s) => s.status === 'pending').length})</option>
                  <option value="approved">Approved Stores ({shops.filter((s) => s.status === 'approved').length})</option>
                  <option value="rejected">Rejected Stores ({shops.filter((s) => s.status === 'rejected').length})</option>
                </select>

                {/* Direct Onboard Store Button */}
                <button
                  onClick={() => setViewMode('register')}
                  className="h-9 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Direct Onboard Store
                </button>

                {/* Refresh */}
                <button
                  onClick={fetchData}
                  className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Refresh store list"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Store Name & Source</th>
                    <th className="pb-3 pr-4">Street Address & GPS</th>
                    <th className="pb-3 pr-4">Owner & KYC Docs</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-sm">
                  {filteredShops.map((shop) => (
                    <tr
                      key={shop.id}
                      className={`hover:bg-slate-800/20 transition-colors ${
                        shop.status === 'pending' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-4 pr-4 font-semibold text-white">
                        <p className="text-white font-bold">{shop.shop_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
                            {shop.onboarding_source === 'app_self_registration'
                              ? '📱 App Self-Register'
                              : '💻 Admin Direct'}
                          </span>
                          <button
                            onClick={() => setSelectedShopForReview(shop)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                          >
                            📋 Review Full App & Docs
                          </button>
                        </div>
                      </td>

                      <td className="py-4 pr-4 max-w-xs">
                        {shop.street_address ? (
                          <p className="text-xs text-emerald-300/90 font-medium line-clamp-2">
                            📍 {shop.street_address}
                          </p>
                        ) : shop.state_name ? (
                          <p className="text-xs text-slate-300">
                            {shop.area_name ? `${shop.area_name}, ` : ''}{shop.city || shop.district_name} (PIN: {shop.pincode || '—'})
                          </p>
                        ) : (
                          <span className="text-slate-500 italic text-xs">No address assigned</span>
                        )}

                        {(() => {
                          const sLat =
                            shop.latitude != null && !isNaN(Number(shop.latitude))
                              ? Number(shop.latitude)
                              : (shop as any).lat != null && !isNaN(Number((shop as any).lat))
                              ? Number((shop as any).lat)
                              : null;
                          const sLng =
                            shop.longitude != null && !isNaN(Number(shop.longitude))
                              ? Number(shop.longitude)
                              : (shop as any).lng != null && !isNaN(Number((shop as any).lng))
                              ? Number((shop as any).lng)
                              : null;
                          return sLat != null && sLng != null ? (
                            <p className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                              📍 Coords: {sLat.toFixed(5)}, {sLng.toFixed(5)} ({shop.delivery_radius_km || 5} km radius)
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">⚠️ No GPS Pinned</p>
                          );
                        })()}
                      </td>

                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-200">
                          {shop.owner_name || shop.profiles?.name || 'Owner'}
                        </p>
                        <p className="text-xs text-slate-400">+{shop.phone || shop.profiles?.phone || 'No phone'}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <span
                            className={shop.aadhaar_doc_url ? 'text-emerald-400 font-bold' : 'text-slate-500'}
                          >
                            Aadhaar {shop.aadhaar_doc_url ? '✓' : '—'}
                          </span>
                          <span>·</span>
                          <span
                            className={shop.fssai_doc_url ? 'text-emerald-400 font-bold' : 'text-slate-500'}
                          >
                            FSSAI {shop.fssai_doc_url ? '✓' : '—'}
                          </span>
                          <span>·</span>
                          <span className={shop.pan_doc_url ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            PAN {shop.pan_doc_url ? '✓' : '—'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        {shop.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {shop.status === 'rejected' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              Rejected
                            </span>
                            {shop.rejection_reason && (
                              <p className="text-[10px] text-red-400 mt-1 max-w-xs line-clamp-1 italic">
                                &quot;{shop.rejection_reason}&quot;
                              </p>
                            )}
                          </div>
                        )}
                        {shop.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            Pending Approval
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedShopForReview(shop)}
                          className="text-xs font-bold px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Inspect KYC documents and location pin"
                        >
                          📋 Review App
                        </button>

                        {(() => {
                          const shopZones = locations.filter(
                            (l) => l.shop_id === shop.id && l.is_serviceable !== false
                          );
                          return (
                            <button
                              onClick={() => setSelectedShopForZones(shop)}
                              className="text-xs font-bold px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Manage Delivery Coverage Zones"
                            >
                              🗺️ Zones ({shopZones.length})
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => openShopMapModal(shop)}
                          className="text-xs font-bold px-3 py-1.5 bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-800/40 rounded-lg transition-all cursor-pointer"
                        >
                          📍 Map
                        </button>

                        {shop.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedShopForInventory(shop);
                              fetchShopInventory(shop.id);
                            }}
                            className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg transition-all cursor-pointer"
                          >
                            Inventory
                          </button>
                        )}

                        {shop.status !== 'approved' && (
                          <button
                            onClick={() => openApproveModal(shop)}
                            className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {shop.status !== 'rejected' && (
                          <button
                            onClick={() => {
                              setRejectModalShop(shop);
                              setRejectionReasonInput('');
                            }}
                            className="text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-lg transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteShop(shop.id, shop.shop_name)}
                          className="text-xs font-bold px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg transition-all cursor-pointer"
                          title="Delete store"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredShops.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Store className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                        <p className="font-semibold text-sm">No stores found matching your filters.</p>
                        <div className="mt-3">
                          <button
                            onClick={() => setViewMode('register')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-400 transition-all"
                          >
                            ➕ Onboard First Store Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* VIEW MODE 2: DIRECT ONBOARD STORE (WITH FULL KYC & LOCKED STREET ADDRESS) */}
      {viewMode === 'register' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
          {/* Top Back Header */}
          <div className="flex items-center justify-between bg-slate-900/40 rounded-2xl p-4 sm:p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                ← Back to Stores
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  ➕ Direct Onboard Store Partner
                </h2>
                <p className="text-xs text-slate-400">
                  Register and immediately approve a merchant store with Aadhaar, FSSAI, PAN docs, and Google Maps street pinning.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full hidden sm:inline-block">
              ⚡ Instant Approval & Zone Setup
            </span>
          </div>

          {/* Registration Form in Premium Structured Cards */}
          <form onSubmit={handleAdminDirectRegister} className="space-y-5">
            {/* Section 1: Store & Owner Identity */}
            <div className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 text-xs">🏬</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Store & Owner Credentials</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Store / Shop Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Thorat Super Market"
                    className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none"
                    value={regShopName}
                    onChange={(e) => setRegShopName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sanjay Thorat"
                    className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Mobile (+91) *</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none font-mono"
                    value={regOwnerMobile}
                    onChange={(e) => setRegOwnerMobile(e.target.value.replace(/[^\d]/g, ''))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: GPS Location & Google Maps Street Address (Locked) */}
            <div className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400 text-xs">📍</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Google Maps GPS & Street Address
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleDetectAdminGps}
                  disabled={detectingAdminGps}
                  className="text-xs font-bold px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {detectingAdminGps ? 'Detecting GPS...' : '📍 Auto-Detect Live GPS & Street'}
                </button>
              </div>

              {/* Locked Google Maps Street Address Field */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Maps Street Address (Locked / Read-Only)</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    readOnly
                    placeholder="Click 'Auto-Detect Live GPS & Street' or select location to resolve street"
                    className="w-full h-10 px-3.5 bg-slate-950/80 border border-emerald-500/40 text-emerald-300 font-medium rounded-xl text-xs outline-none cursor-not-allowed"
                    value={regStreetAddress}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      GPS Locked
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Street address is resolved via Google Maps Geocoding API to prevent fake store locations.
                </p>
              </div>

              {/* Deep / Detailed Address */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Detailed Store Address (Shop No, Floor, Building, Landmark)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Shop No 4, Ground Floor, Sai Plaza, Opp. Ravet Bus Stop"
                  className="w-full mt-1.5 p-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none resize-none"
                  value={regDetailedAddress}
                  onChange={(e) => setRegDetailedAddress(e.target.value)}
                />
              </div>

              {/* Coordinates & Delivery Radius */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 18.6432"
                    className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none font-mono"
                    value={regLat}
                    onChange={(e) => setRegLat && setRegLat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 73.7450"
                    className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none font-mono"
                    value={regLng}
                    onChange={(e) => setRegLng && setRegLng(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Delivery Radius (KM)</label>
                  <select
                    className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none cursor-pointer"
                    value={regRadius}
                    onChange={(e) => setRegRadius && setRegRadius(e.target.value)}
                  >
                    <option value="2.0">2.0 KM (Local Area Only)</option>
                    <option value="3.0">3.0 KM (Compact Zone)</option>
                    <option value="5.0">5.0 KM (Standard Free Delivery)</option>
                    <option value="7.0">7.0 KM (Extended Area)</option>
                    <option value="10.0">10.0 KM (Large Territory)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Territory & Cascading Pincode Selection */}
            <div className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 text-xs">🗺️</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Territory & Pincode Routing</h3>
              </div>

              {/* State & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">State *</label>
                  <select
                    className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none cursor-pointer"
                    value={regStateId}
                    onChange={(e) => setRegStateId(e.target.value)}
                    required
                  >
                    <option value="">-- Select State --</option>
                    {adminStates.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">District *</label>
                  <select
                    className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none cursor-pointer"
                    value={regDistrictId}
                    onChange={(e) => setRegDistrictId(e.target.value)}
                    required
                    disabled={!regStateId}
                  >
                    <option value="">{regStateId ? '-- Select District --' : '-- Choose State first --'}</option>
                    {regDistrictOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City Selection */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">City / Town *</label>
                  {(cities || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualCityMode(!manualCityMode);
                        setRegCity('');
                        if (setRegPincode) setRegPincode('');
                        if (setRegArea) setRegArea('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 underline transition-colors cursor-pointer"
                    >
                      {manualCityMode ? '← Pick City from list' : '✏️ Custom City'}
                    </button>
                  )}
                </div>

                {(cities || []).length > 0 && !manualCityMode ? (
                  <select
                    className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none cursor-pointer"
                    value={regCity}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setRegCity(newCity);
                      if (setRegPincode) setRegPincode('');
                      if (setRegArea) setRegArea('');
                      setPincodeSearchQuery('');
                    }}
                    required
                  >
                    <option value="">-- Select Registered City --</option>
                    {(cities || []).map((c) => (
                      <option key={c.id} value={c.name}>
                        🏙️ {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Pincode & Base Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Pincode *</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 412101"
                    className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none font-mono"
                    value={regPincode}
                    onChange={(e) => setRegPincode && setRegPincode(e.target.value.replace(/[^\d]/g, ''))}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Base Locality / Area *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ravet, Kothrud"
                    className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none"
                    value={regArea}
                    onChange={(e) => setRegArea && setRegArea(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Legal & Compliance Documents Uploads */}
            <div className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 text-xs">📄</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Legal Documents & KYC (Direct S3 Upload)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Aadhaar Card */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aadhaar Card
                    </label>
                    {regAadhaarDocUrl && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        Uploaded ✓
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="12-digit Aadhaar Number (Optional)"
                    maxLength={12}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none font-mono"
                    value={regAadhaarNumber}
                    onChange={(e) => setRegAadhaarNumber(e.target.value.replace(/[^\d]/g, ''))}
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-9 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{regAadhaarUploading ? 'Uploading to S3...' : 'Upload Aadhaar Photo / PDF'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(file, 'aadhaar');
                        }}
                      />
                    </label>

                    {regAadhaarDocUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(regAadhaarDocUrl);
                          setPreviewDocTitle('Aadhaar Document Preview');
                        }}
                        className="px-2.5 h-9 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. FSSAI License */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-amber-400" /> FSSAI Food License
                    </label>
                    {regFssaiDocUrl && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        Uploaded ✓
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="14-digit FSSAI License Number (Optional)"
                    maxLength={14}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none font-mono"
                    value={regFssaiNumber}
                    onChange={(e) => setRegFssaiNumber(e.target.value.replace(/[^\d]/g, ''))}
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-9 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{regFssaiUploading ? 'Uploading to S3...' : 'Upload FSSAI Certificate'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(file, 'fssai');
                        }}
                      />
                    </label>

                    {regFssaiDocUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(regFssaiDocUrl);
                          setPreviewDocTitle('FSSAI Certificate Preview');
                        }}
                        className="px-2.5 h-9 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. PAN Card */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" /> PAN Card
                    </label>
                    {regPanDocUrl && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        Uploaded ✓
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="10-character PAN Number (Optional)"
                    maxLength={10}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none font-mono uppercase"
                    value={regPanNumber}
                    onChange={(e) => setRegPanNumber(e.target.value.toUpperCase())}
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-9 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{regPanUploading ? 'Uploading to S3...' : 'Upload PAN Card Photo'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(file, 'pan');
                        }}
                      />
                    </label>

                    {regPanDocUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(regPanDocUrl);
                          setPreviewDocTitle('PAN Card Preview');
                        }}
                        className="px-2.5 h-9 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Storefront Photo & GSTIN */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-purple-400" /> Storefront Photo & GSTIN
                    </label>
                    {regShopPhotoUrl && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        Uploaded ✓
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="GSTIN (15 chars, Optional)"
                    maxLength={15}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none font-mono uppercase"
                    value={regGstin}
                    onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="h-9 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{regShopPhotoUploading ? 'Uploading to S3...' : 'Upload Shop Board Photo'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(file, 'shop_photo');
                        }}
                      />
                    </label>

                    {regShopPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(regShopPhotoUrl);
                          setPreviewDocTitle('Storefront Photo Preview');
                        }}
                        className="px-2.5 h-9 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="w-1/3 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={directRegisterSubmitting}
                className="w-2/3 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {directRegisterSubmitting ? 'Registering & Uploading...' : 'Direct Onboard & Approve Store'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW MODE 3: UNIFIED DELIVERY ZONES & ROUTING MATRIX */}
      {viewMode === 'coverage' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-indigo-950/30 rounded-2xl p-4 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Delivery Coverage & Order Routing Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Every store is automatically active for its base area. Assign additional neighboring localities or whole PIN codes to any merchant in 1 click.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold">
                {locations.length} Total Localities Mapped
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bulk Assign by Pincode Card */}
            <section className="lg:col-span-6 bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-indigo-500/30 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" /> Bulk Assign Entire PIN Code Hub
                </h4>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                  1-Click Hub
                </span>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!bulkPin || bulkPin.length !== 6) {
                    alert('Please enter a valid 6-digit PIN code');
                    return;
                  }
                  if (!bulkShop) {
                    alert('Please select a merchant shop to assign to this PIN code');
                    return;
                  }
                  if (handleBulkAssignPincode) {
                    setBulkSubmitting(true);
                    try {
                      await handleBulkAssignPincode(bulkPin, bulkShop);
                      setBulkPin('');
                      setBulkShop('');
                    } finally {
                      setBulkSubmitting(false);
                    }
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">PIN Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 412101"
                      className={`w-full mt-1 h-10 px-3 bg-slate-950 border ${
                        bulkPinValidation && !bulkPinValidation.isValid && bulkPin.length === 6
                          ? 'border-rose-500 focus:border-rose-400'
                          : bulkPinValidation?.isValid
                          ? 'border-indigo-500 focus:border-indigo-400'
                          : 'border-slate-800 focus:border-indigo-500'
                      } text-white rounded-xl text-xs font-mono font-bold outline-none`}
                      value={bulkPin}
                      onChange={(e) => setBulkPin(e.target.value.replace(/[^\d]/g, ''))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Assign To Store *</label>
                    <select
                      className="w-full mt-1 h-10 px-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 cursor-pointer"
                      value={bulkShop}
                      onChange={(e) => setBulkShop(e.target.value)}
                      required
                    >
                      <option value="">Select store...</option>
                      {shops
                        .filter((s) => s.status === 'approved')
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shop_name} ({s.city || '—'})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="w-full h-10 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {bulkSubmitting ? 'Assigning...' : '⚡ Bulk Assign All Areas in PIN Code'}
                </button>
              </form>
            </section>

            {/* Quick Add Single Locality Zone */}
            {handleAddLocation && (
              <section className="lg:col-span-6 bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" /> Add Custom Locality Zone
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Single Zone
                  </span>
                </div>

                <form onSubmit={handleAddLocation} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">City *</label>
                      <input
                        type="text"
                        placeholder="e.g. Pune"
                        className="w-full mt-1 h-9 px-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none"
                        value={locCity}
                        onChange={(e) => setLocCity && setLocCity(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Area *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ravet"
                        className="w-full mt-1 h-9 px-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none"
                        value={locArea}
                        onChange={(e) => setLocArea && setLocArea(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">PIN *</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="412101"
                        className="w-full mt-1 h-9 px-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs font-mono outline-none"
                        value={locPin}
                        onChange={(e) => setLocPin && setLocPin(e.target.value.replace(/[^\d]/g, ''))}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="flex-1 h-9 px-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none cursor-pointer"
                      value={locShop}
                      onChange={(e) => setLocShop && setLocShop(e.target.value)}
                      required
                    >
                      <option value="">Assign merchant store...</option>
                      {shops
                        .filter((s) => s.status === 'approved')
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shop_name} ({s.city || '—'})
                          </option>
                        ))}
                    </select>

                    <button
                      type="submit"
                      className="px-4 h-9 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Save Zone
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>

          {/* Filterable Localities Table */}
          <section className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by locality, city, PIN, or store name..."
                  value={coverageSearchQuery}
                  onChange={(e) => setCoverageSearchQuery(e.target.value)}
                  className="w-72 h-9 px-3 bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={coverageShopFilter}
                  onChange={(e) => setCoverageShopFilter(e.target.value)}
                  className="h-9 px-2.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                >
                  <option value="">All Stores ({shops.length})</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shop_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Locality / Area</th>
                    <th className="pb-3">City</th>
                    <th className="pb-3">PIN Code</th>
                    <th className="pb-3">Assigned Merchant Store</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {locations
                    .filter((loc) => {
                      if (coverageShopFilter && loc.shop_id !== coverageShopFilter) return false;
                      if (coverageSearchQuery.trim()) {
                        const q = coverageSearchQuery.toLowerCase().trim();
                        const shopName = shops.find((s) => s.id === loc.shop_id)?.shop_name.toLowerCase() || '';
                        return (
                          loc.area_name.toLowerCase().includes(q) ||
                          loc.city.toLowerCase().includes(q) ||
                          loc.pincode.includes(q) ||
                          shopName.includes(q)
                        );
                      }
                      return true;
                    })
                    .map((loc) => {
                      return (
                        <tr key={loc.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 font-semibold text-white">📍 {loc.area_name}</td>
                          <td className="py-3 text-slate-300">{loc.city}</td>
                          <td className="py-3 font-mono text-emerald-400 font-bold">{loc.pincode}</td>
                          <td className="py-3">
                            <select
                              value={loc.shop_id || ''}
                              onChange={(e) =>
                                handleUpdateLocationShop && handleUpdateLocationShop(loc.id, e.target.value)
                              }
                              className="h-8 px-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                            >
                              <option value="">-- Unassigned --</option>
                              {shops.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.shop_name} {s.status === 'approved' ? '✓' : '(Pending)'}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 text-right">
                            {handleDeleteLocation && (
                              <button
                                onClick={() => handleDeleteLocation(loc.id)}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                                title="Remove locality zone"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {locations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        No delivery zones mapped yet. Use Store Registration to auto-create zones or Bulk Assign by PIN above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* COMPREHENSIVE ONBOARDING APPLICATION REVIEW MODAL */}
      {selectedShopForReview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{selectedShopForReview.shop_name}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedShopForReview.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : selectedShopForReview.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {selectedShopForReview.status.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px]">
                      {['app_self_registration', 'merchant_app'].includes(selectedShopForReview.onboarding_source || '')
                        ? '📱 App Self-Registration'
                        : '💻 Admin Direct Onboard'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Store ID: <span className="font-mono text-slate-300">{selectedShopForReview.id}</span> · Created:{' '}
                    {new Date(selectedShopForReview.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedShopForReview(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Previous Rejection Reason Callout (if any) */}
              {selectedShopForReview.status === 'rejected' && selectedShopForReview.rejection_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">Previous Rejection Reason</h4>
                    <p className="text-xs text-slate-200 mt-1">&quot;{selectedShopForReview.rejection_reason}&quot;</p>
                  </div>
                </div>
              )}

              {/* Robust Coordinate Extraction */}
              {(() => {
                const revLat =
                  selectedShopForReview.latitude != null && !isNaN(Number(selectedShopForReview.latitude))
                    ? Number(selectedShopForReview.latitude)
                    : (selectedShopForReview as any).lat != null && !isNaN(Number((selectedShopForReview as any).lat))
                    ? Number((selectedShopForReview as any).lat)
                    : null;

                const revLng =
                  selectedShopForReview.longitude != null && !isNaN(Number(selectedShopForReview.longitude))
                    ? Number(selectedShopForReview.longitude)
                    : (selectedShopForReview as any).lng != null && !isNaN(Number((selectedShopForReview as any).lng))
                    ? Number((selectedShopForReview as any).lng)
                    : null;

                return (
                  /* Grid: Left Col = Location & Map / Right Col = Owner & Documents */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: GPS & Street Address Verification (6 cols) */}
                    <div className="lg:col-span-6 space-y-4">
                      {/* Google Maps Pin & Coordinates */}
                      <div className="bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Map className="w-4 h-4 text-emerald-400" /> GPS Store Pin & Radius
                          </h4>
                          {revLat != null && revLng != null && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${revLat},${revLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                            >
                              Google Maps Full View ↗
                            </a>
                          )}
                        </div>

                        <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                          {revLat != null && revLng != null ? (
                            <iframe
                              title="Shop Location Preview"
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              scrolling="no"
                              marginHeight={0}
                              marginWidth={0}
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                                revLng - 0.02
                              }%2C${revLat - 0.015}%2C${
                                revLng + 0.02
                              }%2C${
                                revLat + 0.015
                              }&layer=mapnik&marker=${revLat}%2C${revLng}`}
                              className="w-full h-full filter saturate-125"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 text-xs">
                              <MapPin className="w-6 h-6 text-slate-600" />
                              <span>No GPS coordinates pinned</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-mono text-emerald-400 font-bold">
                            📍 Lat: {revLat != null ? revLat.toFixed(5) : '—'} · Lng:{' '}
                            {revLng != null ? revLng.toFixed(5) : '—'}
                          </span>
                          <span className="text-slate-400">
                            🛵 {selectedShopForReview.delivery_radius_km || 5.0} KM Radius
                          </span>
                        </div>
                      </div>

                  {/* Google Maps Street Address (LOCKED) */}
                  <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" /> Google Maps Street Address (Locked)
                      </h4>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                        GPS Verified
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium">
                      {selectedShopForReview.street_address || 'No street address captured during GPS sync'}
                    </p>
                  </div>

                  {/* Deep / Detailed Address */}
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detailed / Deep Address (Manual Input)
                    </h4>
                    <p className="text-xs text-slate-200">
                      {selectedShopForReview.detailed_address || 'Not specified'}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 grid grid-cols-2 gap-2">
                      <div>
                        Base Locality: <strong className="text-white">{selectedShopForReview.area_name || '—'}</strong>
                      </div>
                      <div>
                        City: <strong className="text-white">{selectedShopForReview.city || '—'}</strong>
                      </div>
                      <div>
                        Pincode: <strong className="text-white">{selectedShopForReview.pincode || '—'}</strong>
                      </div>
                      <div>
                        District: <strong className="text-white">{selectedShopForReview.district_name || '—'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Owner Profile & Legal Documents (6 cols) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Owner Credentials */}
                  <div className="bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" /> Owner Information
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Owner Full Name</span>
                        <p className="text-sm font-bold text-white">
                          {selectedShopForReview.owner_name || selectedShopForReview.profiles?.name || 'Owner'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Mobile</span>
                        <p className="text-sm font-bold text-emerald-400 font-mono">
                          +{selectedShopForReview.phone || selectedShopForReview.profiles?.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Legal Documents Cards */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-amber-400" /> Legal Compliance & KYC Documents
                    </h4>

                    {/* Aadhaar Card Card */}
                    <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Aadhaar Card</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {selectedShopForReview.aadhaar_number
                              ? `UID: ${selectedShopForReview.aadhaar_number.replace(/(\d{4})/g, '$1 ').trim()}`
                              : 'Number not entered'}
                          </p>
                        </div>
                      </div>

                      {selectedShopForReview.aadhaar_doc_url ? (
                        <button
                          onClick={() => {
                            setPreviewDocUrl(selectedShopForReview.aadhaar_doc_url!);
                            setPreviewDocTitle(`${selectedShopForReview.shop_name} — Aadhaar Card`);
                          }}
                          className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Doc
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No doc attached</span>
                      )}
                    </div>

                    {/* FSSAI Certificate Card */}
                    <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">FSSAI License Certificate</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {selectedShopForReview.fssai_number
                              ? `Lic: ${selectedShopForReview.fssai_number}`
                              : 'Number not entered'}
                          </p>
                        </div>
                      </div>

                      {selectedShopForReview.fssai_doc_url ? (
                        <button
                          onClick={() => {
                            setPreviewDocUrl(selectedShopForReview.fssai_doc_url!);
                            setPreviewDocTitle(`${selectedShopForReview.shop_name} — FSSAI Certificate`);
                          }}
                          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Doc
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No doc attached</span>
                      )}
                    </div>

                    {/* PAN Card Card */}
                    <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">PAN Card</p>
                          <p className="text-[11px] font-mono text-slate-400 uppercase">
                            {selectedShopForReview.pan_number ? `PAN: ${selectedShopForReview.pan_number}` : 'Number not entered'}
                          </p>
                        </div>
                      </div>

                      {selectedShopForReview.pan_doc_url ? (
                        <button
                          onClick={() => {
                            setPreviewDocUrl(selectedShopForReview.pan_doc_url!);
                            setPreviewDocTitle(`${selectedShopForReview.shop_name} — PAN Card`);
                          }}
                          className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Doc
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No doc attached</span>
                      )}
                    </div>

                    {/* Storefront Photo & GSTIN Card */}
                    <div className="bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Storefront Photo & GST</p>
                          <p className="text-[11px] font-mono text-slate-400 uppercase">
                            {selectedShopForReview.gstin ? `GST: ${selectedShopForReview.gstin}` : 'Shop Board Photo'}
                          </p>
                        </div>
                      </div>

                      {selectedShopForReview.shop_photo_url ? (
                        <button
                          onClick={() => {
                            setPreviewDocUrl(selectedShopForReview.shop_photo_url!);
                            setPreviewDocTitle(`${selectedShopForReview.shop_name} — Storefront Photo`);
                          }}
                          className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Photo
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No photo attached</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

            {/* Modal Action Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setSelectedShopForReview(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Review
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {selectedShopForReview.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectModalShop(selectedShopForReview);
                      setRejectionReasonInput('');
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    ❌ Reject Application
                  </button>
                )}

                {selectedShopForReview.status !== 'approved' && (
                  <button
                    onClick={() => openApproveModal(selectedShopForReview)}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    ✅ Approve & Assign Delivery Area ➔
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectModalShop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-red-500/40 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Reject Store Application
              </h3>
              <button
                onClick={() => setRejectModalShop(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-300">
                You are rejecting the application for <strong className="text-white">{rejectModalShop.shop_name}</strong>.
                Please provide a clear reason so the merchant can correct their documents or location in their app:
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Rejection Remarks / Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. FSSAI certificate is blurry. Please upload clear original document. GPS street address does not match shop."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-red-500 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalShop(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rejectSubmitting}
                  onClick={handleConfirmRejection}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                >
                  {rejectSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE STORE & ASSIGN AREA MODAL */}
      {approveModalShop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0b101d] border border-emerald-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Approve Store & Assign Delivery Area
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select the fulfillment locality area zone and confirm GPS coordinates for{' '}
                    <strong className="text-white">{approveModalShop.shop_name}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setApproveModalShop(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Store & Owner Summary Card */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Store & Owner</span>
                  <p className="font-bold text-white text-sm">{approveModalShop.shop_name}</p>
                  <p className="text-slate-300 mt-0.5">
                    👤 {approveModalShop.owner_name || approveModalShop.profiles?.name || 'Owner'} · 📞 +
                    {approveModalShop.profiles?.phone || approveModalShop.phone || 'No phone'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Source & Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                      {approveModalShop.onboarding_source === 'app_self_registration'
                        ? '📱 App Self-Register'
                        : '💻 Admin Direct'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                      PENDING APPROVAL
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS Coordinates & Google Maps Street Address */}
              <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" /> GPS Coordinates & Street Pin
                  </h4>
                  {approveModalShop.latitude != null && approveModalShop.longitude != null && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${parseFloat(String(approveModalShop.latitude))},${parseFloat(String(approveModalShop.longitude))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                    >
                      Google Maps ↗
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs flex-wrap font-mono">
                  <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg font-bold">
                    📍 Latitude: {approveModalShop.latitude != null && !isNaN(Number(approveModalShop.latitude)) ? Number(approveModalShop.latitude).toFixed(6) : 'Not Pinned'}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg font-bold">
                    📍 Longitude: {approveModalShop.longitude != null && !isNaN(Number(approveModalShop.longitude)) ? Number(approveModalShop.longitude).toFixed(6) : 'Not Pinned'}
                  </span>
                </div>

                {approveModalShop.street_address && (
                  <p className="text-xs text-slate-200 mt-1">
                    <strong className="text-emerald-400">Street:</strong> {approveModalShop.street_address}
                  </p>
                )}
                {approveModalShop.detailed_address && (
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Shop details:</strong> {approveModalShop.detailed_address}
                  </p>
                )}
              </div>

              {/* KYC Document Verification Strip */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Verified Legal KYC Documents
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Aadhaar */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Aadhaar Card</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          approveModalShop.aadhaar_doc_url
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {approveModalShop.aadhaar_doc_url ? 'Uploaded ✓' : 'Missing'}
                      </span>
                    </div>
                    {approveModalShop.aadhaar_doc_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(approveModalShop.aadhaar_doc_url!);
                          setPreviewDocTitle(`${approveModalShop.shop_name} — Aadhaar Card`);
                        }}
                        className="w-full py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Doc
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic text-center">—</span>
                    )}
                  </div>

                  {/* FSSAI */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">FSSAI Food</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          approveModalShop.fssai_doc_url
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {approveModalShop.fssai_doc_url ? 'Uploaded ✓' : 'Optional'}
                      </span>
                    </div>
                    {approveModalShop.fssai_doc_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(approveModalShop.fssai_doc_url!);
                          setPreviewDocTitle(`${approveModalShop.shop_name} — FSSAI License`);
                        }}
                        className="w-full py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Doc
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic text-center">—</span>
                    )}
                  </div>

                  {/* PAN */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">PAN Card</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          approveModalShop.pan_doc_url
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {approveModalShop.pan_doc_url ? 'Uploaded ✓' : 'Optional'}
                      </span>
                    </div>
                    {approveModalShop.pan_doc_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(approveModalShop.pan_doc_url!);
                          setPreviewDocTitle(`${approveModalShop.shop_name} — PAN Card`);
                        }}
                        className="w-full py-1 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Doc
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic text-center">—</span>
                    )}
                  </div>

                  {/* Shop Photo */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Shop Board</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          approveModalShop.shop_photo_url
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {approveModalShop.shop_photo_url ? 'Uploaded ✓' : 'Optional'}
                      </span>
                    </div>
                    {approveModalShop.shop_photo_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDocUrl(approveModalShop.shop_photo_url!);
                          setPreviewDocTitle(`${approveModalShop.shop_name} — Storefront Photo`);
                        }}
                        className="w-full py-1 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Photo
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic text-center">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Territory & Area Assignment Section (DIRECT REFERENCE TO CITIES & LOCALITIES AND DELIVERY ZONES) */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-indigo-500/30 shadow-xl space-y-5">
                {/* Header with Quick Navigation to Master Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-500/20">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" /> Assign Delivery Territory & Serviceable Zones *
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Directly referenced from Master Cities & Localities hierarchy and Delivery Zones & Routing.
                    </p>
                  </div>
                  {setActiveTab && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setApproveModalShop(null);
                          setActiveTab('cities-areas');
                        }}
                        className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Manage Cities, Districts & Localities"
                      >
                        <MapPin className="w-3 h-3" /> Master Cities
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApproveModalShop(null);
                          setActiveTab('locations');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Manage Delivery Zones & Routing"
                      >
                        <Zap className="w-3 h-3" /> Delivery Zones
                      </button>
                    </div>
                  )}
                </div>

                {/* 1. City Selection & Primary Locality Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-indigo-400" /> Registered Master City *
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {cities?.length || 0} Cities Available
                      </span>
                    </div>

                    <select
                      value={approveSelectedCity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApproveSelectedCity(val);
                        // Reset area selection when city changes
                        const matchedCityObj = (cities || []).find((c) => c.name.toLowerCase() === val.toLowerCase());
                        const validAreas = (areas || []).filter((a) => {
                          if (matchedCityObj && a.city_id === matchedCityObj.id) return true;
                          if (a.city_id === val) return true;
                          if ((a as any).city_name && (a as any).city_name.trim().toLowerCase() === val.toLowerCase()) return true;
                          return false;
                        });
                        if (validAreas.length > 0) {
                          setApproveSelectedArea(validAreas[0].name);
                          setApprovePincode(validAreas[0].pincode || '');
                          setApproveAdditionalAreas([validAreas[0].name]);
                        } else {
                          setApproveSelectedArea('');
                          setApprovePincode('');
                          setApproveAdditionalAreas([]);
                        }
                      }}
                      className="w-full h-10 px-3 bg-slate-950 border border-indigo-500/50 text-white rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-400 font-medium"
                      required
                    >
                      <option value="">-- Choose Registered Master City --</option>
                      {(cities || []).map((c) => {
                        const count = (areas || []).filter((a) => a.city_id === c.id).length;
                        return (
                          <option key={c.id} value={c.name}>
                            🏙️ {c.name} {count > 0 ? `(${count} localities)` : '(0 localities)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Primary Area Locality Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Primary Registered Locality / Hub *
                      </label>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {approveModalAreas.length} Localities in {approveEffectiveCity || 'City'}
                      </span>
                    </div>

                    <select
                      value={approveSelectedArea}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApproveSelectedArea(val);
                        // Auto fill pincode from master locality
                        const matchedAreaObj = approveModalAreas.find((a) => a.name === val);
                        if (matchedAreaObj && matchedAreaObj.pincode) {
                          setApprovePincode(matchedAreaObj.pincode);
                        }
                        if (val && !approveAdditionalAreas.includes(val)) {
                          setApproveAdditionalAreas((prev) => [...prev, val]);
                        }
                      }}
                      className="w-full h-10 px-3 bg-slate-950 border border-emerald-500/50 text-white rounded-xl text-xs outline-none cursor-pointer focus:border-emerald-400 font-medium"
                      required
                    >
                      <option value="">-- Select Master Locality from {approveEffectiveCity || 'City'} --</option>
                      {approveModalAreas.map((a) => (
                        <option key={a.id || `${a.name}-${a.pincode}`} value={a.name}>
                          📍 {a.name} (PIN: {a.pincode || '—'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notice if no registered localities found for selected city */}
                {approveEffectiveCity && approveModalAreas.length === 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                    <span>
                      ⚠️ No registered master localities found for <strong>{approveEffectiveCity}</strong>.
                    </span>
                    {setActiveTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setApproveModalShop(null);
                          setActiveTab('cities');
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        + Add Localities in Master Tab ➔
                      </button>
                    )}
                  </div>
                )}

                {/* 2. Pincode & Delivery Radius Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between mb-1">
                      <span>Primary PIN Code *</span>
                      {approvePinValidation && (
                        <span
                          className={`text-[10px] font-semibold ${
                            approvePinValidation.isValid ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {approvePinValidation.isValid ? '✓ Valid Indian PIN' : approvePinValidation.error}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 411033"
                      value={approvePincode}
                      onChange={(e) => setApprovePincode(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                      Delivery Radius
                    </label>
                    <select
                      value={approveRadius}
                      onChange={(e) => setApproveRadius(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-400"
                    >
                      <option value="2.0">2.0 KM (Ultra Local)</option>
                      <option value="3.0">3.0 KM (Neighborhood)</option>
                      <option value="5.0">5.0 KM (Standard Area)</option>
                      <option value="7.0">7.0 KM (Extended Hub)</option>
                      <option value="10.0">10.0 KM (Sub-District)</option>
                      <option value="15.0">15.0 KM (Wide Metro)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Multi-Zone Serviceable Coverage Area Multi-Select Chips */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-400" /> Registered Serviceable Coverage Localities ({approveAdditionalAreas.length} Selected)
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Select which registered localities in {approveEffectiveCity || 'this city'} this merchant store will deliver to.
                      </p>
                    </div>

                    {approveModalAreas.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const all = approveModalAreas.map((a) => a.name);
                            setApproveAdditionalAreas(all);
                          }}
                          className="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Select All ({approveModalAreas.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const primary = approveSelectedArea.trim();
                            setApproveAdditionalAreas(primary ? [primary] : []);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Reset to Primary
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Areas Chips Grid - ONLY registered master areas */}
                  <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-wrap gap-2">
                    {approveModalAreas.length === 0 ? (
                      <div className="w-full py-4 text-center text-xs text-slate-500 italic">
                        No registered master localities for &quot;{approveEffectiveCity || 'selected city'}&quot;. Please add them in the Master Cities & Localities tab.
                      </div>
                    ) : (
                      approveModalAreas.map((area) => {
                        const isSelected = approveAdditionalAreas.some(
                          (a) => a.toLowerCase() === area.name.toLowerCase()
                        );
                        const isPrimary =
                          approveSelectedArea.trim().toLowerCase() === area.name.toLowerCase();

                        return (
                          <button
                            key={area.id || `${area.name}-${area.pincode}`}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                // Do not unselect if it is the primary area
                                if (isPrimary) {
                                  alert('The primary locality must remain in the serviceable coverage list.');
                                  return;
                                }
                                setApproveAdditionalAreas(
                                  approveAdditionalAreas.filter(
                                    (a) => a.toLowerCase() !== area.name.toLowerCase()
                                  )
                                );
                              } else {
                                setApproveAdditionalAreas([...approveAdditionalAreas, area.name]);
                                if (!approveSelectedArea) {
                                  setApproveSelectedArea(area.name);
                                  if (area.pincode) setApprovePincode(area.pincode);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                isSelected ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{area.name}</span>
                            {area.pincode && (
                              <span className="text-[10px] opacity-60 font-mono">({area.pincode})</span>
                            )}
                            {isPrimary && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 text-[9px] font-bold rounded border border-emerald-500/40">
                                Primary Hub
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Strict Territory Rule Badge */}
                  <div className="p-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Strict Location Rule: Shops can only be assigned to pre-registered Master Localities.
                    </span>
                    {setActiveTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setApproveModalShop(null);
                          setActiveTab('cities');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                      >
                        Manage Cities & Areas ➔
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setApproveModalShop(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={approveSubmitting}
                onClick={handleConfirmApproval}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {approveSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Approving & Setting Territory...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Confirm Area & Approve Merchant Store
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX PREVIEW MODAL */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> {previewDocTitle || 'Document Viewer'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!previewDocUrl) return;
                    const safeUrl = getSafeDocUrl(previewDocUrl);
                    if (safeUrl.startsWith('data:')) {
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <meta charset="utf-8" />
                              <meta name="viewport" content="width=device-width, initial-scale=1" />
                              <title>${previewDocTitle || 'KYC Document Preview'}</title>
                              <style>
                                body { margin: 0; background: #070a14; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; color: #fff; padding: 20px; box-sizing: border-box; }
                                img { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
                              </style>
                            </head>
                            <body>
                              <img src="${safeUrl}" alt="Document Preview" />
                            </body>
                          </html>
                        `);
                        win.document.close();
                        return;
                      }
                    }
                    window.open(safeUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Tab ↗
                </button>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[350px]">
              {previewDocUrl.toLowerCase().includes('.pdf') ? (
                <iframe title="Document PDF Preview" src={getSafeDocUrl(previewDocUrl)} className="w-full h-[500px] rounded-xl border border-slate-800" />
              ) : (
                <img
                  src={getSafeDocUrl(previewDocUrl)}
                  alt={previewDocTitle}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl border border-slate-800"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.doc-fallback-msg')) {
                      const div = document.createElement('div');
                      div.className = 'doc-fallback-msg flex flex-col items-center justify-center text-center p-6 space-y-3';
                      div.innerHTML = `
                        <p class="text-xs text-amber-400 font-semibold">⚠️ Document preview could not be loaded inline.</p>
                        <a href="${getSafeDocUrl(previewDocUrl)}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all">
                          Open in External Window ↗
                        </a>
                      `;
                      parent.appendChild(div);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE STORE MAP & LOCATION VERIFICATION MODAL */}
      {selectedShopForMap && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-400" /> {selectedShopForMap.shop_name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedShopForMap.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedShopForMap.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {selectedShopForMap.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Owner:{' '}
                  <strong className="text-slate-200">
                    {selectedShopForMap.owner_name || selectedShopForMap.profiles?.name || 'Owner'}
                  </strong>{' '}
                  · Mobile: <strong className="text-slate-200">+{selectedShopForMap.profiles?.phone}</strong> · City:{' '}
                  <strong className="text-slate-200">{selectedShopForMap.city || '—'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedShopForMap(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Col: Interactive Map */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">📍 Live OpenStreetMap Pinpoint</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${parseFloat(editLat) || 18.5204},${
                      parseFloat(editLng) || 73.8567
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                  >
                    Open Google Maps Full View ↗
                  </a>
                </div>

                <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
                  <iframe
                    title="Store Location Pin"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      (parseFloat(editLng) || 73.8567) - 0.035
                    }%2C${(parseFloat(editLat) || 18.5204) - 0.025}%2C${
                      (parseFloat(editLng) || 73.8567) + 0.035
                    }%2C${
                      (parseFloat(editLat) || 18.5204) + 0.025
                    }&layer=mapnik&marker=${parseFloat(editLat) || 18.5204}%2C${parseFloat(editLng) || 73.8567}`}
                    className="w-full h-full"
                  />
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <span>
                    🛵 <strong>{editRadius} KM</strong> Coverage Radius Zone
                  </span>
                  <span className="text-slate-400 text-[11px]">Customers within {editRadius} km get Free Delivery</span>
                </div>
              </div>

              {/* Right Col: Location Coordinate Settings & Action Buttons */}
              <div className="lg:col-span-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h4 className="font-bold text-white text-sm">📍 Verified Store GPS Coordinates</h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Latitude (DD)
                    </label>
                    <input
                      type="text"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      placeholder="e.g. 18.6521"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Longitude (DD)
                    </label>
                    <input
                      type="text"
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value)}
                      placeholder="e.g. 73.7431"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Operational Delivery Radius (KM)
                    </label>
                    <select
                      value={editRadius}
                      onChange={(e) => setEditRadius(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="2.0">2.0 KM (Local Area Only)</option>
                      <option value="3.0">3.0 KM (Compact Zone)</option>
                      <option value="5.0">5.0 KM (Standard Free Radius)</option>
                      <option value="7.0">7.0 KM (Extended Area)</option>
                      <option value="10.0">10.0 KM (Large Territory)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveShopLocation}
                    disabled={savingLocation}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {savingLocation ? 'Saving Coordinates...' : '💾 Save Coordinates & Radius'}
                  </button>
                </div>

                {/* Approval Actions inside Map Modal */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  {selectedShopForMap.status !== 'approved' && (
                    <button
                      onClick={() => openApproveModal(selectedShopForMap)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      ✅ Approve & Assign Delivery Area ➔
                    </button>
                  )}

                  {selectedShopForMap.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        setRejectModalShop(selectedShopForMap);
                        setRejectionReasonInput('');
                        setSelectedShopForMap(null);
                      }}
                      className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      ❌ Reject Store
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Inventory Management Modal */}
      {selectedShopForInventory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" /> Manage Store Inventory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign products from Master Catalogue to <strong className="text-emerald-400">{selectedShopForInventory.shop_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedShopForInventory(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Direct Assignment Form */}
              <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50 h-fit space-y-4">
                <h4 className="font-bold text-white text-sm mb-2">➕ Assign Product to Store</h4>
                <form onSubmit={handleDirectAssignProduct} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Product SKU *
                    </label>
                    <select
                      required
                      value={assignProdId}
                      onChange={(e) => setAssignProdId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Choose Product --</option>
                      {masterProductsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {resolvePackUnitLabel(p)} (MRP: ₹{p.mrp})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="165"
                      value={assignProdPrice}
                      onChange={(e) => setAssignProdPrice(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        value={assignProdDiscount}
                        onChange={(e) => setAssignProdDiscount(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        value={assignProdStock}
                        onChange={(e) => setAssignProdStock(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Assign SKU to Shop
                  </button>
                </form>
              </div>

              {/* Assigned Items List */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-white text-sm">Assigned Products ({shopInventoryList.length})</h4>
                <div className="overflow-x-auto border border-slate-800/80 rounded-2xl max-h-[480px] overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse bg-[#0c1220]/40 text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Product</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Master MRP</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Shop Price</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Stock</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Status</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {shopInventoryList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/10 text-slate-200">
                          <td className="p-3">
                            <p className="font-bold text-white">{item.product_name}</p>
                            <p className="text-[9px] text-slate-500">SKU: {item.sku}</p>
                          </td>
                          <td className="p-3 text-slate-400">₹{item.mrp}</td>
                          <td className="p-3 font-semibold text-emerald-400">₹{item.selling_price}</td>
                          <td className="p-3">{item.stock}</td>
                          <td className="p-3">
                            {item.status === 'approved' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/10 text-[9px]">
                                Approved
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/10 text-[9px]">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleUnassignShopProduct(item.id)}
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {shopInventoryList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                            No products assigned to this shop yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORE-LEVEL DELIVERY COVERAGE MODAL */}
      {selectedShopForZones && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" /> {selectedShopForZones.shop_name} — Coverage Zones
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Base: {selectedShopForZones.area_name || '—'}, {selectedShopForZones.city || '—'} (PIN:{' '}
                  {selectedShopForZones.pincode || '—'})
                </p>
              </div>
              <button
                onClick={() => setSelectedShopForZones(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Assigned Delivery Localities ({locations.filter((l) => l.shop_id === selectedShopForZones.id).length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShopForZones(null);
                    setViewMode('coverage');
                    setCoverageShopFilter(selectedShopForZones.id);
                  }}
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  Open in Matrix →
                </button>
              </div>

              <div className="divide-y divide-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden">
                {locations
                  .filter((l) => l.shop_id === selectedShopForZones.id)
                  .map((loc) => (
                    <div key={loc.id} className="p-3 bg-slate-900/40 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">📍 {loc.area_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {loc.city} · PIN: <span className="font-mono text-emerald-400 font-bold">{loc.pincode}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          Active Zone
                        </span>
                        {handleDeleteLocation && (
                          <button
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Unassign this area"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                {locations.filter((l) => l.shop_id === selectedShopForZones.id).length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs italic">
                    No extra localities mapped to this store yet. Orders from its base area (
                    {selectedShopForZones.area_name || '—'}) will be fulfilled automatically.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedShopForZones(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
