'use client';

import React from 'react';
import { MapPin, AlertTriangle, Trash2 } from 'lucide-react';
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
  handleDeleteLocation
}: LocationsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
      <div className="lg:col-span-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
        <strong className="text-amber-300">Order routing:</strong> Each locality must be mapped to exactly one approved
        merchant shop. Customer orders from that area go only to the assigned shopkeeper, and they only see products that
        shop has listed as available.
      </div>

      {/* Left Column: List of Mapped Zones */}
      <section className="lg:col-span-7 xl:col-span-8 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" /> Serviceable Delivery Localities
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">City / Locality</th>
                <th className="pb-3">PIN Code</th>
                <th className="pb-3">Assigned Merchant</th>
                <th className="pb-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-sm">
              {locations.map((loc) => {
                const matchedShop = shops.find((s) => s.id === loc.shop_id);
                const isUnassigned = !loc.shop_id || !matchedShop;
                return (
                  <tr
                    key={loc.id}
                    className={`hover:bg-slate-800/20 transition-colors ${isUnassigned ? 'bg-amber-500/5' : ''}`}
                  >
                    <td className="py-4 pr-3 font-semibold">
                      <span className="text-white">{loc.area_name}</span>
                      <span className="text-xs text-slate-500 block">{loc.city}</span>
                    </td>
                    <td className="py-4 pr-3 text-slate-300 font-mono font-bold">{loc.pincode}</td>
                    <td className="py-4 pr-3">
                      <select
                        className={`w-full max-w-xs h-9 px-2 bg-slate-950 border ${
                          isUnassigned
                            ? 'border-amber-500/70 focus:border-amber-400'
                            : 'border-slate-800 focus:border-emerald-500'
                        } text-slate-200 rounded-lg text-sm outline-none`}
                        value={loc.shop_id || ''}
                        onChange={(e) => handleUpdateLocationShop(loc.id, e.target.value)}
                      >
                        <option value="">Select shop…</option>
                        {shops
                          .filter((s) => s.status === 'approved')
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.shop_name}
                            </option>
                          ))}
                      </select>
                      {isUnassigned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md mt-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Unassigned shop — Orders cannot route
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                    No delivery zones mapped yet. Register cities and areas first, then add a zone here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right Column: Add Location form */}
      <section className="lg:col-span-5 xl:col-span-4 bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">➕ Add Serviceable Zone</h3>

        <form onSubmit={handleAddLocation} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">City Location</label>
            <select
              className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={locCity}
              onChange={(e) => {
                setLocCity(e.target.value);
                setLocArea('');
              }}
            >
              <option value="">Select registered city...</option>
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
              className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
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
              <option value="">Select registered locality...</option>
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

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">6-Digit PIN Code</label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 400053"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={locPin}
              onChange={(e) => setLocPin(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Shop *</label>
            <select
              required
              className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={locShop}
              onChange={(e) => setLocShop(e.target.value)}
            >
              <option value="">Select merchant shop…</option>
              {shops
                .filter((s) => s.status === 'approved')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shop_name}
                  </option>
                ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Required — orders from this area route to this shop.</p>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-4 cursor-pointer"
          >
            Save Local Zone
          </button>
        </form>
      </section>
    </div>
  );
}
