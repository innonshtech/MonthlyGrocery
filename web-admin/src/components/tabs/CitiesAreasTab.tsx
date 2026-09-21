'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Plus,
  Trash2,
  Search,
  Layers,
  Globe,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Tag,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Map as MapIcon,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AdminState, AdminDistrict, City, Area, TabType } from '../../types/admin.types';
import { validateIndianPincode } from '../../utils/pincodeValidator';

export interface CitiesAreasTabProps {
  adminStates: AdminState[];
  adminDistricts: AdminDistrict[];
  cities: City[];
  areas: Area[];
  newStateName: string;
  setNewStateName: (val: string) => void;
  selectedStateForDistrict: string;
  setSelectedStateForDistrict: (val: string) => void;
  newDistrictName: string;
  setNewDistrictName: (val: string) => void;
  newCityName: string;
  setNewCityName: (val: string) => void;
  selectedCityId: string;
  setSelectedCityId: (val: string) => void;
  newAreaName: string;
  setNewAreaName: (val: string) => void;
  newAreaPincode: string;
  setNewAreaPincode: (val: string) => void;
  searchStateQuery: string;
  setSearchStateQuery: (val: string) => void;
  searchDistrictQuery: string;
  setSearchDistrictQuery: (val: string) => void;
  searchCityQuery: string;
  setSearchCityQuery: (val: string) => void;
  searchAreaQuery: string;
  setSearchAreaQuery: (val: string) => void;
  handleAddState: (e: React.FormEvent) => void;
  handleDeleteState: (id: string) => void;
  handleAddDistrict: (e: React.FormEvent) => void;
  handleDeleteDistrict: (id: string) => void;
  handleAddCity: (e: React.FormEvent) => void;
  handleDeleteCity: (id: string) => void;
  handleAddArea: (e: React.FormEvent) => void;
  handleDeleteArea: (id: string) => void;
  setActiveTab: (tab: TabType) => void;
}

export default function CitiesAreasTab({
  adminStates,
  adminDistricts,
  cities,
  areas,
  newStateName,
  setNewStateName,
  selectedStateForDistrict,
  setSelectedStateForDistrict,
  newDistrictName,
  setNewDistrictName,
  newCityName,
  setNewCityName,
  selectedCityId,
  setSelectedCityId,
  newAreaName,
  setNewAreaName,
  newAreaPincode,
  setNewAreaPincode,
  searchStateQuery,
  setSearchStateQuery,
  searchDistrictQuery,
  setSearchDistrictQuery,
  searchCityQuery,
  setSearchCityQuery,
  searchAreaQuery,
  setSearchAreaQuery,
  handleAddState,
  handleDeleteState,
  handleAddDistrict,
  handleDeleteDistrict,
  handleAddCity,
  handleDeleteCity,
  handleAddArea,
  handleDeleteArea,
  setActiveTab
}: CitiesAreasTabProps) {
  // Top Navigation Tabs (Master Catalog Style)
  // 'directory' | 'add-locality' | 'cities-master' | 'states-districts'
  const [activeMainTab, setActiveMainTab] = useState<'directory' | 'add-locality' | 'cities-master' | 'states-districts'>('directory');

  // Sub-view mode within Directory: 'table' (dense table with pagination) | 'city-explorer' (by city tabs) | 'grouped-cards'
  const [viewMode, setViewMode] = useState<'table' | 'city-explorer' | 'grouped-cards'>('table');

  // Active City filter for Directory: 'all' or city.id
  const [filterCityId, setFilterCityId] = useState<string>('all');

  // Quick live search input
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state for handling hundreds/thousands of areas without lag
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal / Form state for inline creation
  const [showAddCityModal, setShowAddCityModal] = useState(false);

  // Validate pincode for new area form
  const areaPinValidation = useMemo(() => {
    if (!newAreaPincode || !newAreaPincode.trim()) return null;
    return validateIndianPincode(newAreaPincode.trim());
  }, [newAreaPincode]);

  // Extract all unique PIN codes
  const uniquePincodes = useMemo(() => {
    const pinSet = new Set<string>();
    areas.forEach((a) => {
      const pin = (a as any).pincode;
      if (pin && String(pin).trim().length === 6) {
        pinSet.add(String(pin).trim());
      }
    });
    return Array.from(pinSet).sort();
  }, [areas]);

  // Map: cityId -> Array of Areas
  const cityAreaMap = useMemo(() => {
    const map = new Map<string, Area[]>();
    cities.forEach((c) => map.set(c.id, []));
    areas.forEach((a) => {
      const list = map.get(a.city_id);
      if (list) {
        list.push(a);
      } else {
        map.set(a.city_id, [a]);
      }
    });
    return map;
  }, [cities, areas]);

  // Active selected City object (if not 'all')
  const activeSelectedCity = useMemo(() => {
    if (filterCityId === 'all') return null;
    return cities.find((c) => c.id === filterCityId) || null;
  }, [filterCityId, cities]);

  // Filtered list of areas based on City Filter and Live Search Query
  const filteredAreas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return areas.filter((area) => {
      // City filter
      if (filterCityId !== 'all' && area.city_id !== filterCityId) {
        return false;
      }
      // Search query filter (Area Name, City Name, PIN Code)
      if (q) {
        const matchedCity = cities.find((c) => c.id === area.city_id);
        const pin = String((area as any).pincode || '').toLowerCase();
        const matchName = area.name.toLowerCase().includes(q);
        const matchCity = (matchedCity?.name || '').toLowerCase().includes(q);
        const matchPin = pin.includes(q);
        return matchName || matchCity || matchPin;
      }
      return true;
    });
  }, [areas, filterCityId, searchQuery, cities]);

  // Paginated areas for the table view
  const totalPages = Math.max(1, Math.ceil(filteredAreas.length / pageSize));
  const paginatedAreas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAreas.slice(start, start + pageSize);
  }, [filteredAreas, currentPage, pageSize]);

  // Reset page when filter or search changes
  const handleFilterCityChange = (cityId: string) => {
    setFilterCityId(cityId);
    if (cityId !== 'all') {
      setSelectedCityId(cityId);
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans w-full">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR / VIEW SWITCHER (MASTER CATALOG STYLE)                      */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl">
        {/* Left Side: Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Localities Directory */}
          <button
            type="button"
            onClick={() => setActiveMainTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'directory'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Localities Directory ({areas.length})</span>
          </button>

          {/* Tab 2: Add Locality / PIN */}
          <button
            type="button"
            onClick={() => setActiveMainTab('add-locality')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'add-locality'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>➕ Add Locality & PIN</span>
          </button>

          {/* Tab 3: Operating Cities */}
          <button
            type="button"
            onClick={() => setActiveMainTab('cities-master')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'cities-master'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Cities Master ({cities.length})</span>
          </button>

          {/* Tab 4: States & Districts */}
          <button
            type="button"
            onClick={() => setActiveMainTab('states-districts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'states-districts'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>States & Districts ({adminStates.length})</span>
          </button>
        </div>

        {/* Right Side: Quick Stats & Store Jump */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Cities: <strong className="text-white font-bold">{cities.length}</strong>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Areas: <strong className="text-emerald-400 font-bold">{areas.length}</strong>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            PIN Codes: <strong className="text-amber-400 font-bold">{uniquePincodes.length}</strong>
          </span>

          <button
            type="button"
            onClick={() => setActiveTab('shops')}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Shops & Routing →</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 4 METRIC STATS CARDS (MASTER CATALOG STYLE)                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Operating Cities */}
        <div
          onClick={() => {
            setActiveMainTab('cities-master');
          }}
          className="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg cursor-pointer transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 text-xl transition-colors">
            🏙️
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operating Cities</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{cities.length}</p>
          </div>
        </div>

        {/* Card 2: Total Localities */}
        <div
          onClick={() => {
            setActiveMainTab('directory');
            setFilterCityId('all');
          }}
          className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg cursor-pointer transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-xl transition-colors">
            🚚
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Localities</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{areas.length}</p>
          </div>
        </div>

        {/* Card 3: Unique PIN Codes */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 text-xl">
            📮
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Postal PIN Codes</p>
            <p className="text-xl font-extrabold text-amber-400 mt-0.5">{uniquePincodes.length}</p>
          </div>
        </div>

        {/* Card 4: Administrative Hierarchy */}
        <div
          onClick={() => setActiveMainTab('states-districts')}
          className="bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg cursor-pointer transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 group-hover:bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 text-xl transition-colors">
            🇮🇳
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">States & Districts</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{adminStates.length} / {adminDistricts.length}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE VIEW: LOCALITIES DIRECTORY                              */}
      {/* ========================================================================= */}
      {activeMainTab === 'directory' && (
        <section className="bg-slate-900/50 rounded-3xl p-4 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
          {/* TOOLBAR: Filter by City, View Mode Toggle, Live Search, Add Shortcut */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-800/80">
            {/* Left Toolbar: City Dropdown Filter & Counts */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* City Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">City:</span>
                <select
                  value={filterCityId}
                  onChange={(e) => handleFilterCityChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer h-[36px]"
                >
                  <option value="all">🌐 All Operating Cities ({areas.length} total areas)</option>
                  {cities.map((c) => {
                    const count = (cityAreaMap.get(c.id) || []).length;
                    return (
                      <option key={c.id} value={c.id}>
                        🏙️ {c.name} ({count} {count === 1 ? 'area' : 'areas'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* View Mode Segmented Controls */}
              <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dense Table View (Best for managing 100+ areas)"
                >
                  <TableIcon className="w-3.5 h-3.5" /> Table View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('city-explorer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'city-explorer'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="City-wise Explorer (Navbar tabs for each city)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> City Explorer
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped-cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'grouped-cards'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grouped Breakdown by City"
                >
                  <MapIcon className="w-3.5 h-3.5" /> Grouped Cards
                </button>
              </div>
            </div>

            {/* Right Toolbar: Live Search & Quick Add Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative min-w-[200px] sm:min-w-[260px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search locality, city, or PIN..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 h-[36px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Add Locality Button */}
              <button
                type="button"
                onClick={() => {
                  if (filterCityId !== 'all') {
                    setSelectedCityId(filterCityId);
                  }
                  setActiveMainTab('add-locality');
                }}
                className="h-[36px] px-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add Locality
              </button>
            </div>
          </div>

          {/* HORIZONTAL CITY PILLS NAVBAR (Quick 1-click filter bar across all cities) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar pt-1">
            <button
              type="button"
              onClick={() => handleFilterCityChange('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 border ${
                filterCityId === 'all'
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white border-slate-600 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-800/80'
              }`}
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>All Cities</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
                {areas.length}
              </span>
            </button>

            {cities.map((city) => {
              const cityAreas = cityAreaMap.get(city.id) || [];
              const isActive = filterCityId === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleFilterCityChange(city.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 border ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40'
                      : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 border-slate-800/80'
                  }`}
                >
                  <span>🏙️</span>
                  <span>{city.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {cityAreas.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* SUB-VIEW A: DENSE PAGINATED TABLE (Scales cleanly to thousands of items)  */}
          {/* ========================================================================= */}
          {viewMode === 'table' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Locality / Area Name</th>
                      <th className="py-3 px-4">Operating City</th>
                      <th className="py-3 px-4">Postal PIN Code</th>
                      <th className="py-3 px-4">Customer App Status</th>
                      <th className="py-3 px-4 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {paginatedAreas.map((area, idx) => {
                      const matchedCity = cities.find((c) => c.id === area.city_id);
                      const pin = (area as any).pincode;
                      const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={area.id}
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {globalIdx}
                          </td>
                          <td className="py-3 px-4 font-bold text-white text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                              <span>{area.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-300 rounded-lg font-semibold border border-cyan-500/20 text-xs">
                              <span>🏙️</span>
                              <span>{matchedCity?.name || 'Unknown City'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {pin ? (
                              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                <span>📮</span> {pin}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Not configured</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                              <CheckCircle2 className="w-3 h-3" /> Active for Routing
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete locality "${area.name}"?`)) {
                                  handleDeleteArea(area.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                              title={`Delete ${area.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredAreas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                          <p className="text-sm font-semibold">No localities match your filter or search.</p>
                          <p className="text-xs text-slate-500">
                            Try searching for another locality or click &quot;Add Locality &amp; PIN&quot; above.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredAreas.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>
                      Showing{' '}
                      <strong className="text-white">
                        {(currentPage - 1) * pageSize + 1}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-white">
                        {Math.min(currentPage * pageSize, filteredAreas.length)}
                      </strong>{' '}
                      of <strong className="text-white">{filteredAreas.length}</strong> localities
                    </span>

                    <span className="text-slate-600">|</span>

                    <span className="flex items-center gap-1.5">
                      <span>Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </span>
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 disabled:opacity-40 hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>

                    <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold font-mono">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 disabled:opacity-40 hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW B: CITY-WISE EXPLORER (Selected City Card Grid)                  */}
          {/* ========================================================================= */}
          {viewMode === 'city-explorer' && (
            <div className="space-y-4">
              {activeSelectedCity ? (
                <div className="space-y-4">
                  {/* City Hero */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl">
                        🏙️
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          {activeSelectedCity.name}
                          <span className="text-[11px] font-normal px-2 py-0.2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                            Operating Hub
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          {filteredAreas.length} {filteredAreas.length === 1 ? 'Locality' : 'Localities'} configured
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCityId(activeSelectedCity.id);
                        setActiveMainTab('add-locality');
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md w-fit"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Locality to {activeSelectedCity.name}
                    </button>
                  </div>

                  {/* Areas Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredAreas.map((area) => {
                      const pin = (area as any).pincode;
                      return (
                        <div
                          key={area.id}
                          className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-emerald-500/40 rounded-xl p-3 flex items-center justify-between transition-all group"
                        >
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                              <p className="text-xs font-bold text-slate-100 truncate">{area.name}</p>
                            </div>
                            <div>
                              {pin ? (
                                <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                  📮 {pin}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">No PIN</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteArea(area.id)}
                            className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                            title={`Delete ${area.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredAreas.map((area) => {
                    const matchedCity = cities.find((c) => c.id === area.city_id);
                    const pin = (area as any).pincode;
                    return (
                      <div
                        key={area.id}
                        className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between transition-all group"
                      >
                        <div className="space-y-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                            <p className="text-xs font-bold text-slate-100 truncate">{area.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyan-400 font-semibold">
                              🏙️ {matchedCity?.name || 'City'}
                            </span>
                            {pin && (
                              <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                📮 {pin}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteArea(area.id)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                          title={`Delete ${area.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW C: GROUPED BREAKDOWN BY CITY                                     */}
          {/* ========================================================================= */}
          {viewMode === 'grouped-cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city) => {
                const cityAreas = (cityAreaMap.get(city.id) || []).filter((a) => {
                  const q = searchQuery.toLowerCase().trim();
                  if (!q) return true;
                  const pin = String((a as any).pincode || '');
                  return a.name.toLowerCase().includes(q) || pin.includes(q);
                });

                return (
                  <div
                    key={city.id}
                    className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏙️</span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">{city.name}</h4>
                            <p className="text-[10px] text-slate-400">
                              {cityAreas.length} {cityAreas.length === 1 ? 'Locality' : 'Localities'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleFilterCityChange(city.id);
                            setViewMode('table');
                          }}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>View in Table</span> <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Locality Chips */}
                      <div className="pt-2.5 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                        {cityAreas.map((area) => (
                          <span
                            key={area.id}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-800 font-medium"
                          >
                            <span>{area.name}</span>
                            {(area as any).pincode && (
                              <span className="text-[9px] font-mono font-bold text-emerald-400">
                                ({(area as any).pincode})
                              </span>
                            )}
                          </span>
                        ))}
                        {cityAreas.length === 0 && (
                          <p className="text-[11px] text-slate-500 italic py-2">
                            No localities registered in {city.name}.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCityId(city.id);
                        setActiveMainTab('add-locality');
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Locality to {city.name}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: ADD LOCALITY & PIN CODE FORM (CLEAN DEDICATED WORKSPACE)          */}
      {/* ========================================================================= */}
      {activeMainTab === 'add-locality' && (
        <section className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl shadow-xl max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add Delivery Locality & PIN Code</h3>
                <p className="text-xs text-slate-400">
                  Register a customer-selectable area under any operating city.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMainTab('directory')}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              handleAddArea(e);
              setActiveMainTab('directory');
            }}
            className="space-y-4"
          >
            {/* 1. Operating City Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Operating City *
              </label>
              <select
                className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors cursor-pointer"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                required
              >
                <option value="">-- Choose City (e.g. Pune, Mumbai, Nashik) --</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏙️ {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Locality Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Locality / Area Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Wakad, Ravet, Hinjewadi, College Road, Indiranagar"
                className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                required
              />
            </div>

            {/* 3. Postal PIN Code */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Indian Postal PIN Code (6 Digits)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 411057"
                className={`w-full h-11 px-3.5 bg-slate-950 border ${
                  areaPinValidation && !areaPinValidation.isValid && newAreaPincode.length === 6
                    ? 'border-rose-500 focus:border-rose-400'
                    : areaPinValidation?.isValid
                    ? 'border-emerald-500 focus:border-emerald-400'
                    : 'border-slate-800 focus:border-emerald-500'
                } text-slate-200 rounded-xl text-xs sm:text-sm outline-none font-mono transition-colors`}
                value={newAreaPincode}
                onChange={(e) => setNewAreaPincode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              />

              {newAreaPincode && newAreaPincode.length === 6 && areaPinValidation && !areaPinValidation.isValid && (
                <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="w-4 h-4" /> <span>{areaPinValidation.error}</span>
                </p>
              )}
              {newAreaPincode && newAreaPincode.length === 6 && areaPinValidation && areaPinValidation.isValid && (
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-1.5">
                  <CheckCircle2 className="w-4 h-4" />{' '}
                  <span>Valid Indian Postal PIN ({areaPinValidation.formatted})</span>
                </p>
              )}
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
              💡 <strong>Customer Experience:</strong> In the customer app, when a user selects this city, this locality will immediately show in the area list and slide open to show all assigned shops.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveMainTab('directory')}
                className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Locality &amp; PIN
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: CITIES MASTER (OPERATING CITIES MANAGEMENT)                       */}
      {/* ========================================================================= */}
      {activeMainTab === 'cities-master' && (
        <section className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Operating Cities Master</h3>
                <p className="text-xs text-slate-400">
                  Manage the official operating cities where Monthly Grocery services customers.
                </p>
              </div>
            </div>

            {/* Inline Add City Form */}
            <form onSubmit={handleAddCity} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="City name (e.g. Pune, Mumbai, Nashik)"
                className="h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 rounded-xl text-xs sm:text-sm outline-none transition-colors w-full sm:w-64"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="h-10 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/15 flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" /> Add City
              </button>
            </form>
          </div>

          {/* Search Filter for Cities */}
          {cities.length > 4 && (
            <div className="relative max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter cities..."
                className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 rounded-xl text-xs outline-none"
                value={searchCityQuery}
                onChange={(e) => setSearchCityQuery(e.target.value)}
              />
            </div>
          )}

          {/* Cities Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cities
              .filter((c) => c.name.toLowerCase().includes(searchCityQuery.toLowerCase()))
              .map((city) => {
                const count = (cityAreaMap.get(city.id) || []).length;
                return (
                  <div
                    key={city.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-lg">
                        🏙️
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{city.name}</h4>
                        <p className="text-xs text-slate-400">
                          {count} {count === 1 ? 'Locality' : 'Localities'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterCityChange(city.id);
                          setActiveMainTab('directory');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="View localities"
                      >
                        Explore
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete city "${city.name}" and its associated localities?`)) {
                            handleDeleteCity(city.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                        title={`Delete ${city.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {cities.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No operating cities created yet.</p>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: STATES & DISTRICTS HIERARCHY                                      */}
      {/* ========================================================================= */}
      {activeMainTab === 'states-districts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 animate-in fade-in duration-200">
          {/* 1. STATES CARD */}
          <div className="lg:col-span-6 space-y-4">
            <section className="bg-slate-900/50 rounded-3xl p-5 md:p-6 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 text-xs">🏛️</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">Registered States</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                  {adminStates.length} Total
                </span>
              </div>

              {/* Add State Form */}
              <form onSubmit={handleAddState} className="flex gap-2">
                <input
                  type="text"
                  placeholder="State name (e.g. Maharashtra, Jharkhand)"
                  className="flex-1 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/15 flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>

              {/* Search Filter */}
              {adminStates.length > 3 && (
                <input
                  type="text"
                  placeholder="Filter states..."
                  className="w-full h-8 px-3 bg-slate-950/60 border border-slate-850 text-slate-300 focus:border-emerald-500/50 rounded-lg text-xs outline-none"
                  value={searchStateQuery}
                  onChange={(e) => setSearchStateQuery(e.target.value)}
                />
              )}

              {/* States List */}
              <div className="divide-y divide-slate-800/40 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {adminStates
                  .filter((s) => s.name.toLowerCase().includes(searchStateQuery.toLowerCase()))
                  .map((state) => {
                    const districtCount = adminDistricts.filter((d) => d.state_id === state.id).length;
                    return (
                      <div
                        key={state.id}
                        className="flex justify-between items-center py-2.5 px-2 hover:bg-slate-800/20 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-200">{state.name}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                            {districtCount} {districtCount === 1 ? 'district' : 'districts'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteState(state.id)}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                          title={`Delete ${state.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>

          {/* 2. DISTRICTS CARD */}
          <div className="lg:col-span-6 space-y-4">
            <section className="bg-slate-900/50 rounded-3xl p-5 md:p-6 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400 text-xs">📍</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">Registered Districts</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                  {adminDistricts.length} Total
                </span>
              </div>

              {/* Add District Form */}
              <form onSubmit={handleAddDistrict} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    className="h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors cursor-pointer"
                    value={selectedStateForDistrict}
                    onChange={(e) => setSelectedStateForDistrict(e.target.value)}
                  >
                    <option value="">-- Choose State --</option>
                    {adminStates.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="District name (e.g. Pune)"
                    className="h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-10 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add District to State
                </button>
              </form>

              {/* Search Filter */}
              {adminDistricts.length > 3 && (
                <input
                  type="text"
                  placeholder="Filter districts or states..."
                  className="w-full h-8 px-3 bg-slate-950/60 border border-slate-850 text-slate-300 focus:border-emerald-500/50 rounded-lg text-xs outline-none"
                  value={searchDistrictQuery}
                  onChange={(e) => setSearchDistrictQuery(e.target.value)}
                />
              )}

              {/* Districts List */}
              <div className="divide-y divide-slate-800/40 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {adminDistricts
                  .filter((d) => {
                    const matchedState = adminStates.find((s) => s.id === d.state_id);
                    const q = searchDistrictQuery.toLowerCase();
                    return (
                      d.name.toLowerCase().includes(q) || (matchedState?.name || '').toLowerCase().includes(q)
                    );
                  })
                  .map((district) => {
                    const matchedState = adminStates.find((s) => s.id === district.state_id);
                    return (
                      <div
                        key={district.id}
                        className="flex justify-between items-center py-2.5 px-2 hover:bg-slate-800/20 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-200">{district.name}</p>
                          <span className="inline-block text-[10px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20 mt-0.5">
                            {matchedState?.name || 'Unknown State'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDistrict(district.id)}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                          title={`Delete ${district.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
