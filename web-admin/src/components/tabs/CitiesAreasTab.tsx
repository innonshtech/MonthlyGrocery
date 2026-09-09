'use client';

import React from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { AdminState, AdminDistrict, City, Area, TabType } from '../../types/admin.types';

interface CitiesAreasTabProps {
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
  return (
    <div className="space-y-6 w-full">
      {/* Top Overview Banner & Hierarchy Flow */}
      <div className="bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-emerald-950/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" /> Territory & Delivery Hierarchy
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Structure states, districts, cities, and pincode-level delivery localities for order routing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('locations')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-bold transition-all w-fit cursor-pointer"
          >
            Map to Merchant Shops →
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. States</p>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">{adminStates.length}</p>
            </div>
            <span className="text-xl">🇮🇳</span>
          </div>
          <div className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Districts</p>
              <p className="text-base sm:text-lg font-bold text-teal-400 mt-0.5">{adminDistricts.length}</p>
            </div>
            <span className="text-xl">📍</span>
          </div>
          <div className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Cities</p>
              <p className="text-base sm:text-lg font-bold text-cyan-400 mt-0.5">{cities.length}</p>
            </div>
            <span className="text-xl">🏙️</span>
          </div>
          <div className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Localities (PINs)</p>
              <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">{areas.length}</p>
            </div>
            <span className="text-xl">🚚</span>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* LEFT COLUMN: Administrative Hierarchy (States & Districts) */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. STATES CARD */}
          <section className="bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 text-xs">🏛️</span>
                <h3 className="text-sm sm:text-base font-bold text-white">Registered States</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
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

            {/* Search Filter if > 3 */}
            {adminStates.length > 3 && (
              <input
                type="text"
                placeholder="Filter states..."
                className="w-full h-8 px-3 bg-slate-950/60 border border-slate-855 text-slate-300 focus:border-emerald-500/50 rounded-lg text-xs outline-none"
                value={searchStateQuery}
                onChange={(e) => setSearchStateQuery(e.target.value)}
              />
            )}

            {/* States List */}
            <div className="divide-y divide-slate-800/40 max-h-56 overflow-y-auto custom-scrollbar pr-1">
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
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
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
              {adminStates.length === 0 && (
                <p className="text-xs text-slate-500 py-6 italic text-center">No states registered yet.</p>
              )}
            </div>
          </section>

          {/* 2. DISTRICTS CARD */}
          <section className="bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400 text-xs">📍</span>
                <h3 className="text-sm sm:text-base font-bold text-white">Registered Districts</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
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

            {/* Search Filter if > 3 */}
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
            <div className="divide-y divide-slate-800/40 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {adminDistricts
                .filter((d) => {
                  const matchedState = adminStates.find((s) => s.id === d.state_id);
                  const q = searchDistrictQuery.toLowerCase();
                  return d.name.toLowerCase().includes(q) || (matchedState?.name || '').toLowerCase().includes(q);
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
              {adminDistricts.length === 0 && (
                <p className="text-xs text-slate-500 py-6 italic text-center">No districts registered yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Operating Delivery Locations (Cities & Localities) */}
        <div className="lg:col-span-6 space-y-5">
          {/* 3. CITIES CARD */}
          <section className="bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 text-xs">🏙️</span>
                <h3 className="text-sm sm:text-base font-bold text-white">Registered Operating Cities</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                {cities.length} Total
              </span>
            </div>

            {/* Add City Form */}
            <form onSubmit={handleAddCity} className="flex gap-2">
              <input
                type="text"
                placeholder="City name (e.g. Pune, Nashik, Ranchi)"
                className="flex-1 h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
              />
              <button
                type="submit"
                className="h-10 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/15 flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* Search Filter if > 3 */}
            {cities.length > 3 && (
              <input
                type="text"
                placeholder="Filter cities..."
                className="w-full h-8 px-3 bg-slate-950/60 border border-slate-850 text-slate-300 focus:border-cyan-500/50 rounded-lg text-xs outline-none"
                value={searchCityQuery}
                onChange={(e) => setSearchCityQuery(e.target.value)}
              />
            )}

            {/* Cities List */}
            <div className="divide-y divide-slate-800/40 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {cities
                .filter((c) => c.name.toLowerCase().includes(searchCityQuery.toLowerCase()))
                .map((city) => {
                  const areaCount = areas.filter((a) => a.city_id === city.id).length;
                  return (
                    <div
                      key={city.id}
                      className="flex justify-between items-center py-2.5 px-2 hover:bg-slate-800/20 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0"></span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-200">{city.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          {areaCount} {areaCount === 1 ? 'area' : 'areas'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCity(city.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                        title={`Delete ${city.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              {cities.length === 0 && (
                <p className="text-xs text-slate-500 py-6 italic text-center">No cities registered yet.</p>
              )}
            </div>
          </section>

          {/* 4. LOCALITIES & PIN CODES CARD */}
          <section className="bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 text-xs">🚚</span>
                <h3 className="text-sm sm:text-base font-bold text-white">Delivery Localities & PINs</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
                {areas.length} Total
              </span>
            </div>

            {/* Add Area Form */}
            <form onSubmit={handleAddArea} className="space-y-2.5">
              <select
                className="w-full h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors cursor-pointer"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
              >
                <option value="">-- Select Registered City --</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-8">
                  <input
                    type="text"
                    placeholder="Locality name (e.g. College Road, Wakad)"
                    className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN (411045)"
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none font-mono text-center transition-colors"
                    value={newAreaPincode}
                    onChange={(e) => setNewAreaPincode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Locality & PIN Code
              </button>
            </form>

            {/* Search Filter if > 3 */}
            {areas.length > 3 && (
              <input
                type="text"
                placeholder="Filter by locality, city, or PIN code..."
                className="w-full h-8 px-3 bg-slate-950/60 border border-slate-850 text-slate-300 focus:border-emerald-500/50 rounded-lg text-xs outline-none"
                value={searchAreaQuery}
                onChange={(e) => setSearchAreaQuery(e.target.value)}
              />
            )}

            {/* Areas List */}
            <div className="divide-y divide-slate-800/40 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {areas
                .filter((area) => {
                  const matchedCity = cities.find((c) => c.id === area.city_id);
                  const pin = (area as any).pincode || '';
                  const q = searchAreaQuery.toLowerCase();
                  return (
                    area.name.toLowerCase().includes(q) ||
                    (matchedCity?.name || '').toLowerCase().includes(q) ||
                    pin.includes(q)
                  );
                })
                .map((area) => {
                  const matchedCity = cities.find((c) => c.id === area.city_id);
                  const pin = (area as any).pincode as string | null | undefined;
                  return (
                    <div
                      key={area.id}
                      className="flex justify-between items-center py-2.5 px-2 hover:bg-slate-800/20 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-semibold text-slate-200">{area.name}</p>
                          {pin ? (
                            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                              {pin}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {matchedCity?.name || 'Unknown City'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                        title={`Delete ${area.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              {areas.length === 0 && (
                <p className="text-xs text-slate-500 py-6 italic text-center">No localities registered yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
