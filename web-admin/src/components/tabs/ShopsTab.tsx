'use client';

import React, { useState, useMemo } from 'react';
import { Store, Trash2, X, Search, MapPin, Zap, Layers, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { Shop, AdminState, AdminDistrict, City, Area, ServiceableLocation } from '../../types/admin.types';
import { resolvePackUnitLabel } from '../../lib/packUnits';
import { apiFetch } from '../../utils/api';
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
  handleUpdateShopStatus: (shopId: string, status: 'approved' | 'rejected') => void;
  handleDeleteShop: (shopId: string, shopName: string) => void;
  fetchData: () => void;
  masterProductsList: any[];
  token: string | null;
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
  token
}: ShopsTabProps) {
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

  // Filtered shops list for Store Directory Table
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (shopStatusFilter !== 'all' && shop.status !== shopStatusFilter) {
        return false;
      }
      if (!shopSearchQuery.trim()) return true;
      const q = shopSearchQuery.trim().toLowerCase();
      const nameMatch = (shop.shop_name || '').toLowerCase().includes(q);
      const ownerMatch = (shop.profiles?.name || '').toLowerCase().includes(q) || (shop.profiles?.phone || '').includes(q);
      const cityMatch = (shop.city || '').toLowerCase().includes(q) || (shop.area_name || '').toLowerCase().includes(q) || (shop.pincode || '').includes(q);
      return nameMatch || ownerMatch || cityMatch;
    });
  }, [shops, shopStatusFilter, shopSearchQuery]);

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
          if (loc.city && !regCity && setRegCity) setRegCity(loc.city);
          if (loc.area && !regArea && setRegArea) setRegArea(loc.area);
          if (loc.pincode && !regPincode && setRegPincode) setRegPincode(loc.pincode);
        }
      } catch {}
    };

    const fallbackToGeocoding = async () => {
      const q = [regArea, regCity, regPincode].filter(Boolean).join(', ') || (regCity ? `${regCity}, Maharashtra` : 'Pune, Maharashtra');
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
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
      );
    } else {
      await fallbackToGeocoding();
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
        setSelectedShopForMap((prev) => prev ? { ...prev, latitude: lat, longitude: lng, delivery_radius_km: radius } : null);
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
          stock: assignProdStock ? parseInt(assignProdStock) : 100
        })
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
        method: 'DELETE'
      });
      if (selectedShopForInventory) {
        fetchShopInventory(selectedShopForInventory.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error unassigning product');
    }
  };

  const activeNetworkShop = shops.find((s) => s.id === networkSelectedShopId) || shops[0] || null;
  const activeLat = activeNetworkShop?.latitude != null ? activeNetworkShop.latitude : 18.5204;
  const activeLng = activeNetworkShop?.longitude != null ? activeNetworkShop.longitude : 73.8567;

  return (
    <div className="space-y-6">
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
            <Plus className="w-3.5 h-3.5" /> Register New Store
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
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            Active Zones: <strong className="text-teal-400 font-bold">{locations.filter(l => l.is_serviceable !== false && l.shop_id).length}</strong>
          </span>
          <button onClick={fetchData} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: NETWORK MAP (BIRD'S EYE VIEW) */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Left: Interactive Map Container */}
          <div className="lg:col-span-8 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  🗺️ City-Wide Store GPS Coverage Map
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizing active kirana stores and their 5 KM delivery radius coverage zones.
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

            {/* Embedded OpenStreetMap Preview */}
            <div className="w-full h-[460px] rounded-2xl overflow-hidden border border-slate-700/80 relative shadow-inner bg-slate-950">
              <iframe
                title="Store Network Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - 0.045}%2C${activeLat - 0.035}%2C${activeLng + 0.045}%2C${activeLat + 0.035}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
                className="w-full h-full filter saturate-150 contrast-105"
              />

              {/* Floating Overlay Badge on Map */}
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
                    👤 {activeNetworkShop.profiles?.name || 'Owner'} · 📞 +{activeNetworkShop.profiles?.phone}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    📍 {activeNetworkShop.area_name ? `${activeNetworkShop.area_name}, ` : ''}{activeNetworkShop.city || 'Pune'} (PIN: {activeNetworkShop.pincode || '—'})
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

          {/* Map Right: Store Selector Sidebar */}
          <div className="lg:col-span-4 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>🏪 Registered Stores ({shops.length})</span>
            </h3>

            <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
              {shops.map((shop) => {
                const isSelected = shop.id === networkSelectedShopId;
                const hasGps = shop.latitude != null && shop.longitude != null;

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
                            : 'bg-amber-500/15 text-amber-400'
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
                          📍 {shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-amber-400/90 font-medium">⚠️ GPS not pinned</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openShopMapModal(shop);
                        }}
                        className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                      >
                        Adjust Pin ⚙️
                      </button>
                    </div>
                  </div>
                );
              })}

              {shops.length === 0 && (
                <div className="p-6 text-center text-slate-500 italic text-xs">
                  No stores registered yet.
                </div>
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
                  Approve merchant registrations, inspect GPS territories, assign delivery zones, and manage inventory.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search store, owner, city..."
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
                  <option value="approved">Approved ({shops.filter((s) => s.status === 'approved').length})</option>
                  <option value="pending">Pending ({shops.filter((s) => s.status === 'pending').length})</option>
                  <option value="rejected">Rejected ({shops.filter((s) => s.status === 'rejected').length})</option>
                </select>

                {/* Register Store Button */}
                <button
                  onClick={() => setViewMode('register')}
                  className="h-9 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Register New Store
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
                    <th className="pb-3 pr-4">Store Name</th>
                    <th className="pb-3 pr-4">Territory & GPS</th>
                    <th className="pb-3 pr-4">Owner Contact</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-sm">
                  {filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pr-4 font-semibold text-white">
                        <p className="text-white font-bold">{shop.shop_name}</p>
                        <button
                          onClick={() => openShopMapModal(shop)}
                          className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                          title="Open interactive map modal with delivery radius"
                        >
                          🗺️ View Map & Radius
                        </button>
                      </td>
                      <td className="py-4 pr-4">
                        {shop.state_name ? (
                          <>
                            <p className="text-slate-200 text-sm">{shop.state_name}</p>
                            <p className="text-xs text-slate-400 font-medium">
                              {shop.district_name} · {shop.city || '—'} {shop.area_name ? `(${shop.area_name})` : ''}
                            </p>
                            {shop.latitude != null && shop.longitude != null ? (
                              <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                                📍 {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)} ({shop.delivery_radius_km || 5} km radius)
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                                ⚠️ No GPS Pinned
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Not assigned</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-200">{shop.profiles?.name || 'Owner'}</p>
                        <p className="text-xs text-slate-500">+{shop.profiles?.phone}</p>
                      </td>
                      <td className="py-4 pr-4">
                        {shop.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {shop.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            Rejected
                          </span>
                        )}
                        {shop.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right space-x-2 whitespace-nowrap">
                        {(() => {
                          const shopZones = locations.filter((l) => l.shop_id === shop.id && l.is_serviceable !== false);
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
                            onClick={() => handleUpdateShopStatus(shop.id, 'approved')}
                            className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {shop.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateShopStatus(shop.id, 'rejected')}
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
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredShops.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <span className="text-3xl">🏬</span>
                          <p className="text-sm font-medium text-slate-400">
                            {shopSearchQuery || shopStatusFilter !== 'all'
                              ? 'No stores match your search or filter.'
                              : 'No stores registered yet.'}
                          </p>
                          <button
                            onClick={() => setViewMode('register')}
                            className="px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/25 transition-all cursor-pointer"
                          >
                            ➕ Register First Store Now
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

      {/* VIEW MODE 2: REGISTER NEW STORE DEDICATED VIEW */}
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
                  ➕ Register New Store Partner
                </h2>
                <p className="text-xs text-slate-400">
                  Register a verified kirana merchant with automated delivery territory mapping & GPS pin.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full hidden sm:inline-block">
              ⚡ Instant Auto-Serviceable Zone
            </span>
          </div>

          {/* Registration Form in Premium Structured Cards */}
          <form
            onSubmit={async (e) => {
              await handleRegisterShop(e);
              setViewMode('table');
            }}
            className="space-y-5"
          >
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

            {/* Section 2: Territory & Cascading Pincode Selection */}
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
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    City / Town *
                  </label>
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
                {/* 1. PINCODE FIELD (Left) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Pincode *</span>
                      {regCity && cityUniquePincodes.length > 0 && !manualPincodeMode && (
                        <span className="text-[10px] text-emerald-400 font-normal">
                          ({cityUniquePincodes.length} PINs in {regCity})
                        </span>
                      )}
                    </label>
                    {regCity && cityUniquePincodes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualPincodeMode(!manualPincodeMode);
                          if (setRegPincode) setRegPincode('');
                          if (setRegArea) setRegArea('');
                        }}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 underline transition-colors cursor-pointer"
                      >
                        {manualPincodeMode ? '← Pick PIN' : '✏️ Custom PIN'}
                      </button>
                    )}
                  </div>

                  {!regCity || !regCity.trim() ? (
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        disabled
                        placeholder="🔒 Select City first"
                        className="w-full h-10 px-3.5 bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 rounded-xl text-xs outline-none cursor-not-allowed italic"
                      />
                    </div>
                  ) : cityUniquePincodes.length > 0 && !manualPincodeMode ? (
                    <div className="space-y-1.5 mt-1.5">
                      {cityUniquePincodes.length > 3 && (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder={`Search PIN / area in ${regCity}...`}
                            value={pincodeSearchQuery}
                            onChange={(e) => setPincodeSearchQuery(e.target.value)}
                            className="w-full h-8 pl-8 pr-2.5 bg-slate-900/90 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 rounded-lg text-[11px] outline-none"
                          />
                        </div>
                      )}

                      <select
                        className="w-full h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none cursor-pointer font-mono font-semibold"
                        value={regPincode}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (setRegPincode) setRegPincode(val);
                          if (setRegArea && regArea) {
                            const validInNewPin = cityFilteredAreas.some(
                              (a) => a.pincode?.trim() === val.trim() && a.name.toLowerCase() === regArea.toLowerCase()
                            );
                            if (!validInNewPin) setRegArea('');
                          }
                        }}
                        required
                      >
                        <option value="">-- Select Pincode in {regCity} ({searchedPincodes.length}) --</option>
                        {searchedPincodes.map((pin) => {
                          const subAreas = cityFilteredAreas
                            .filter((a) => a.pincode?.trim() === pin)
                            .map((a) => a.name);
                          return (
                            <option key={pin} value={pin}>
                              📮 PIN {pin} ({subAreas.length} {subAreas.length === 1 ? 'area' : 'areas'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder={`Enter 6-digit PIN for ${regCity}`}
                        className={`w-full h-10 px-3.5 bg-slate-950 border ${
                          regPinValidation && !regPinValidation.isValid && regPincode && regPincode.length === 6
                            ? 'border-rose-500/70 focus:border-rose-400'
                            : regPinValidation?.isValid
                            ? 'border-emerald-500 focus:border-emerald-400'
                            : 'border-slate-800 focus:border-emerald-500'
                        } text-slate-200 rounded-xl text-xs outline-none font-mono`}
                        value={regPincode}
                        onChange={(e) => setRegPincode && setRegPincode(e.target.value.replace(/[^\d]/g, ''))}
                        required
                      />

                      {regPincode && regPincode.length > 0 && regPincode.length < 6 && (
                        <p className="text-[10px] text-amber-400 font-medium">
                          ⚠️ 6-digit Indian Postal PIN required ({regPincode.length}/6 digits)
                        </p>
                      )}

                      {regPincode && regPincode.length === 6 && regPinValidation && !regPinValidation.isValid && (
                        <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[10px] text-rose-400 font-semibold flex items-center gap-1.5">
                          <span>❌</span>
                          <span>{regPinValidation.error}</span>
                        </div>
                      )}

                      {regPincode && regPincode.length === 6 && regPinValidation && regPinValidation.isValid && (
                        <div className="p-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span>✅</span>
                          <span>Valid Indian Postal PIN ({regPinValidation.formatted})</span>
                        </div>
                      )}

                      {cityUniquePincodes.length === 0 && !regPincode && (
                        <p className="text-[10px] text-amber-400/80">
                          (No PINs saved for &ldquo;{regCity}&rdquo; yet in Master Directory — enter genuine PIN directly)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. BASE LOCALITY / AREA FIELD (Right) */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                    <span>Base Locality *</span>
                    {regPincode && pincodeFilteredAreas.length > 0 && (
                      <span className="text-[10px] text-teal-400 font-normal">
                        ({pincodeFilteredAreas.length} in PIN)
                      </span>
                    )}
                  </label>

                  {!regPincode || regPincode.trim().length === 0 ? (
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        disabled
                        placeholder="🔒 Select Pincode first"
                        className="w-full h-10 px-3.5 bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 rounded-xl text-xs outline-none cursor-not-allowed italic"
                      />
                    </div>
                  ) : pincodeFilteredAreas.length > 0 ? (
                    <select
                      className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-emerald-500/50 text-slate-200 focus:border-emerald-400 rounded-xl text-xs outline-none cursor-pointer"
                      value={regArea}
                      onChange={(e) => {
                        if (setRegArea) setRegArea(e.target.value);
                      }}
                      required
                    >
                      <option value="">-- Select Locality ({pincodeFilteredAreas.length}) --</option>
                      {pincodeFilteredAreas.map((a) => (
                        <option key={a.id} value={a.name}>
                          📍 {a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Ravet, Kothrud"
                      className="w-full mt-1.5 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none"
                      value={regArea}
                      onChange={(e) => setRegArea && setRegArea(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: GPS Pinning & Delivery Range */}
            <div className="bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400 text-xs">📍</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">GPS Store Pin & Delivery Radius</h3>
                </div>
                <button
                  type="button"
                  onClick={handleDetectAdminGps}
                  disabled={detectingAdminGps}
                  className="text-xs font-bold px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {detectingAdminGps ? 'Detecting GPS...' : '📍 Auto-Detect GPS Pin'}
                </button>
              </div>

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

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5">
                <span className="text-lg">⚡</span>
                <span>
                  <strong>Auto-Serviceable Routing:</strong> Registering this store will automatically activate delivery routing for{' '}
                  <strong className="text-white">{regArea || 'its base area'}</strong> (PIN: {regPincode || '—'}).
                </span>
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
                className="w-2/3 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register Store & Activate Territory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW MODE 3: UNIFIED DELIVERY ZONES & ROUTING MATRIX */}
      {viewMode === 'coverage' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Banner */}
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

          {/* Bulk Pincode & Quick Add Locality Grid */}
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
                    {bulkPin.length === 6 && bulkPinValidation && !bulkPinValidation.isValid && (
                      <p className="text-[10px] text-rose-400 mt-1 font-semibold">
                        ❌ {bulkPinValidation.error}
                      </p>
                    )}
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
                              onChange={(e) => handleUpdateLocationShop && handleUpdateLocationShop(loc.id, e.target.value)}
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
                  Owner: <strong className="text-slate-200">{selectedShopForMap.profiles?.name || 'Owner'}</strong> · Mobile: <strong className="text-slate-200">+{selectedShopForMap.profiles?.phone}</strong> · City: <strong className="text-slate-200">{selectedShopForMap.city || '—'}</strong>
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
                    href={`https://www.google.com/maps/search/?api=1&query=${parseFloat(editLat) || 18.5204},${parseFloat(editLng) || 73.8567}`}
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
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(editLng) || 73.8567) - 0.035}%2C${(parseFloat(editLat) || 18.5204) - 0.025}%2C${(parseFloat(editLng) || 73.8567) + 0.035}%2C${(parseFloat(editLat) || 18.5204) + 0.025}&layer=mapnik&marker=${parseFloat(editLat) || 18.5204}%2C${parseFloat(editLng) || 73.8567}`}
                    className="w-full h-full"
                  />
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                  <span>🛵 <strong>{editRadius} KM</strong> Coverage Radius Zone</span>
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
                      onClick={() => {
                        handleUpdateShopStatus(selectedShopForMap.id, 'approved');
                        setSelectedShopForMap(null);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      ✅ Approve Store with this Location
                    </button>
                  )}

                  {selectedShopForMap.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        handleUpdateShopStatus(selectedShopForMap.id, 'rejected');
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
            {/* Modal Header */}
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Direct Assignment Form (Col 1) */}
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

              {/* Assigned Items List (Col 2-3) */}
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
                  Base: {selectedShopForZones.area_name || '—'}, {selectedShopForZones.city || '—'} (PIN: {selectedShopForZones.pincode || '—'})
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
                    No extra localities mapped to this store yet. Orders from its base area ({selectedShopForZones.area_name || '—'}) will be fulfilled automatically.
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
