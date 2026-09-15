'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, AlertTriangle, Trash2, Zap, Search, Store, Layers, CheckCircle2 } from 'lucide-react';
import { ServiceableLocation, Shop, City, Area } from '../../types/admin.types';

interface LocationsTabProps {
  locations: ServiceableLocation[];
  shops: Shop[];
  cities: City[];
  areas: Area[];
  locCity: string;
  setLocCity: (val: string) => void;
  locArea: string;
  setLocArea: (val: string) => void;
  locPin: string;
  setLocPin: (val: string) => void;
  locShop: string;
  setLocShop: (val: string) => void;
  handleAddLocation: (e: React.FormEvent) => void;
  handleUpdateLocationShop: (locId: string, shopId: string) => void;
  handleBulkAssignPincode: (pincode: string, shopId: string, city?: string) => Promise<void>;
  handleDeleteLocation: (locId: string) => void;
}

export default function LocationsTab({
  locations,
  shops,
  cities,
  areas,
  locCity,
  setLocCity,
  locArea,
  setLocArea,
  locPin,
  setLocPin,
  locShop,
  setLocShop,
  handleAddLocation,
  handleUpdateLocationShop,
  handleBulkAssignPincode,
  handleDeleteLocation,
}: LocationsTabProps) {
  // Bulk Pincode Assignment Form State
  const [bulkCity, setBulkCity] = useState('');
  const [bulkPin, setBulkPin] = useState('');
  const [bulkShop, setBulkShop] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Table Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPin, setFilterPin] = useState('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  // Extract all unique PIN codes
  const uniquePincodes = useMemo(() => {
    const pinSet = new Set<string>();
    locations.forEach((loc) => {
      if (loc.pincode && loc.pincode.trim().length === 6) pinSet.add(loc.pincode.trim());
    });
    areas.forEach((a) => {
      if (a.pincode && a.pincode.trim().length === 6) pinSet.add(a.pincode.trim());
    });
    return Array.from(pinSet).sort();
  }, [locations, areas]);

  // Approved shops
  const approvedShops = useMemo(() => shops.filter((s) => s.status === 'approved'), [shops]);

  // Count areas under currently selected bulk PIN
  const bulkPinAreaCount = useMemo(() => {
    if (!bulkPin || bulkPin.length !== 6) return 0;
    return locations.filter((loc) => String(loc.pincode || '').trim() === bulkPin).length;
  }, [locations, bulkPin]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchedShop = shops.find((s) => s.id === loc.shop_id);
      const isUnassigned = !loc.shop_id || !matchedShop;

      if (showUnassignedOnly && !isUnassigned) return false;
      if (filterPin && String(loc.pincode || '').trim() !== filterPin) return false;

      if (q) {
        const matchArea = loc.area_name.toLowerCase().includes(q);
        const matchCity = loc.city.toLowerCase().includes(q);
        const matchPin = String(loc.pincode || '').includes(q);
        const matchShop = matchedShop ? matchedShop.shop_name.toLowerCase().includes(q) : false;
        return matchArea || matchCity || matchPin || matchShop;
      }

      return true;
    });
  }, [locations, shops, searchQuery, filterPin, showUnassignedOnly]);

  // Statistics
  const totalLocalities = locations.length;
  const totalPins = uniquePincodes.length;
  const unassignedCount = locations.filter((loc) => !loc.shop_id || !shops.some((s) => s.id === loc.shop_id)).length;

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPin || bulkPin.length !== 6) {
      alert('Please select or enter a valid 6-digit PIN code');
      return;
    }
    if (!bulkShop) {
      alert('Please select a merchant shop to assign to this PIN code');
      return;
    }
    setBulkSubmitting(true);
    try {
      await handleBulkAssignPincode(bulkPin, bulkShop, bulkCity || undefined);
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Routing Explanation & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 font-bold text-emerald-300 text-base mb-1">
            <Layers className="w-5 h-5 text-emerald-400" />
            Hierarchical PIN Code & Area Shop Routing
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Bulk Mode:</strong> Assign an entire PIN code hub to one merchant in 1 click.
            <br />
            <strong className="text-white">Area Override:</strong> Sub-areas under the same PIN code can be customized to different Kirana shopkeepers. Customers can also choose between all stores delivering to their PIN code.
          </p>
        </div>

        <div className="lg:col-span-4 grid grid-cols-3 gap-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 text-center">
            <span className="text-xl font-extrabold text-white">{totalLocalities}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Localities</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 text-center">
            <span className="text-xl font-extrabold text-teal-400">{totalPins}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">PIN Codes</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-2 rounded-xl text-center ${unassignedCount > 0 ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-slate-800/40'}`}>
            <span className={`text-xl font-extrabold ${unassignedCount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>{unassignedCount}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Unassigned</span>
          </div>
        </div>
      </div>

      {/* 2. Top Action Row: Bulk Assign by PIN Code + Add Locality Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Bulk Assign by PIN Code Card */}
        <section className="lg:col-span-6 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 rounded-3xl p-5 sm:p-6 border border-indigo-500/30 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" /> Bulk Assign by PIN Code
            </h3>
            <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              1-Click Hub Mapping
            </span>
          </div>

          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Target PIN Code *</label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 411038"
                    className="w-full h-11 px-3 bg-slate-950 border border-indigo-500/40 focus:border-indigo-400 text-white rounded-xl text-sm outline-none font-mono font-bold"
                    value={bulkPin}
                    onChange={(e) => setBulkPin(e.target.value.replace(/[^\d]/g, ''))}
                  />
                  {bulkPinAreaCount > 0 && (
                    <span className="absolute right-2 top-2.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {bulkPinAreaCount} area{bulkPinAreaCount > 1 ? 's' : ''} mapped
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Quick Select PIN</label>
                <select
                  className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-400 rounded-xl text-sm outline-none font-mono"
                  value={bulkPin}
                  onChange={(e) => setBulkPin(e.target.value)}
                >
                  <option value="">Choose existing PIN...</option>
                  {uniquePincodes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Kirana Store *</label>
              <select
                required
                className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-indigo-500/40 text-white focus:border-indigo-400 rounded-xl text-sm outline-none"
                value={bulkShop}
                onChange={(e) => setBulkShop(e.target.value)}
              >
                <option value="">Select merchant store to assign...</option>
                {approvedShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shop_name} {s.city ? `(${s.city})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                All existing and registered sub-areas under this PIN code will immediately route to this store.
              </p>
            </div>

            <button
              type="submit"
              disabled={bulkSubmitting || !bulkPin || !bulkShop}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {bulkSubmitting ? 'Assigning...' : `Assign Store to All Areas in PIN ${bulkPin || '...'}`}
            </button>
          </form>
        </section>

        {/* Add Single Serviceable Zone Form */}
        <section className="lg:col-span-6 bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" /> ➕ Add Serviceable Zone
          </h3>

          <form onSubmit={handleAddLocation} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">City</label>
                <select
                  className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={locCity}
                  onChange={(e) => {
                    setLocCity(e.target.value);
                    setLocArea('');
                  }}
                >
                  <option value="">Select city...</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Locality Name</label>
                <select
                  className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  disabled={!locCity}
                  value={locArea}
                  onChange={(e) => {
                    const selectedAreaName = e.target.value;
                    setLocArea(selectedAreaName);
                    const cityObj = cities.find((c) => c.name === locCity);
                    const matchedArea = areas.find(
                      (a) => a.name === selectedAreaName && (cityObj ? a.city_id === cityObj.id : true)
                    );
                    if (matchedArea?.pincode) {
                      setLocPin(matchedArea.pincode);
                    }
                  }}
                >
                  <option value="">Select locality...</option>
                  {areas
                    .filter((area) => {
                      const cityObj = cities.find((c) => c.name === locCity);
                      return cityObj ? area.city_id === cityObj.id : false;
                    })
                    .map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">6-Digit PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 411038"
                  className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none font-mono"
                  value={locPin}
                  onChange={(e) => setLocPin(e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Store *</label>
                <select
                  required
                  className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={locShop}
                  onChange={(e) => setLocShop(e.target.value)}
                >
                  <option value="">Select store…</option>
                  {approvedShops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shop_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-2 cursor-pointer text-sm"
            >
              Save Serviceable Zone
            </button>
          </form>
        </section>
      </div>

      {/* 3. Mapped Localities & Granular Override Table */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-400" /> Delivery Localities & Store Assignments
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Change the assigned shop dropdown for any specific row to override that locality.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search area, PIN, store..."
                className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="h-9 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-lg text-xs outline-none font-mono"
              value={filterPin}
              onChange={(e) => setFilterPin(e.target.value)}
            >
              <option value="">All PIN Codes</option>
              {uniquePincodes.map((pin) => (
                <option key={pin} value={pin}>
                  PIN: {pin}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showUnassignedOnly
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⚠️ Unassigned Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">City / Locality</th>
                <th className="pb-3">PIN Code</th>
                <th className="pb-3">Assigned Merchant Store (Area Override)</th>
                <th className="pb-3">Routing Status</th>
                <th className="pb-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-sm">
              {filteredLocations.map((loc) => {
                const matchedShop = shops.find((s) => s.id === loc.shop_id);
                const isUnassigned = !loc.shop_id || !matchedShop;
                return (
                  <tr
                    key={loc.id}
                    className={`hover:bg-slate-800/20 transition-colors ${isUnassigned ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="py-4 pr-3 font-semibold">
                      <span className="text-white block font-medium">{loc.area_name}</span>
                      <span className="text-xs text-slate-500 block">{loc.city}</span>
                    </td>
                    <td className="py-4 pr-3">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-teal-300 font-mono font-bold text-xs">
                        {loc.pincode}
                      </span>
                    </td>
                    <td className="py-4 pr-3">
                      <select
                        className={`w-full max-w-sm h-9 px-2 bg-slate-950 border ${
                          isUnassigned
                            ? 'border-amber-500/70 focus:border-amber-400'
                            : 'border-slate-800 focus:border-emerald-500'
                        } text-slate-200 rounded-lg text-sm outline-none`}
                        value={loc.shop_id || ''}
                        onChange={(e) => handleUpdateLocationShop(loc.id, e.target.value)}
                      >
                        <option value="">Select shop to assign…</option>
                        {approvedShops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shop_name} {s.area_name ? `· ${s.area_name}` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 pr-3">
                      {isUnassigned ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-md">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Unassigned — Orders Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Active Routing
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete zone"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    {searchQuery || filterPin || showUnassignedOnly
                      ? 'No localities match your current search / filter.'
                      : 'No delivery zones mapped yet. Use the Bulk PIN or Add Zone form above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
