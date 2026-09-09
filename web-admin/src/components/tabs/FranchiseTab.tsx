'use client';

import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { FranchiseRequest } from '../../types/admin.types';

interface FranchiseTabProps {
  franchiseRequests: FranchiseRequest[];
  franchiseStatusFilter: string;
  setFranchiseStatusFilter: (val: string) => void;
  searchFranchiseQuery: string;
  setSearchFranchiseQuery: (val: string) => void;
  newLeadName: string;
  setNewLeadName: (val: string) => void;
  newLeadPhone: string;
  setNewLeadPhone: (val: string) => void;
  newLeadEmail: string;
  setNewLeadEmail: (val: string) => void;
  newLeadCity: string;
  setNewLeadCity: (val: string) => void;
  newLeadBudget: string;
  setNewLeadBudget: (val: string) => void;
  newLeadMessage: string;
  setNewLeadMessage: (val: string) => void;
  newLeadStatus: 'new' | 'contacted' | 'converted' | 'rejected';
  setNewLeadStatus: (val: 'new' | 'contacted' | 'converted' | 'rejected') => void;
  newLeadSaving: boolean;
  handleCreateFranchiseLead: (e: React.FormEvent) => void;
  handleUpdateFranchiseStatus: (id: string, status: string) => void;
  handleDeleteFranchiseLead: (id: string) => void;
  fetchData: () => void;
}

export default function FranchiseTab({
  franchiseRequests,
  franchiseStatusFilter,
  setFranchiseStatusFilter,
  searchFranchiseQuery,
  setSearchFranchiseQuery,
  newLeadName,
  setNewLeadName,
  newLeadPhone,
  setNewLeadPhone,
  newLeadEmail,
  setNewLeadEmail,
  newLeadCity,
  setNewLeadCity,
  newLeadBudget,
  setNewLeadBudget,
  newLeadMessage,
  setNewLeadMessage,
  newLeadStatus,
  setNewLeadStatus,
  newLeadSaving,
  handleCreateFranchiseLead,
  handleUpdateFranchiseStatus,
  handleDeleteFranchiseLead,
  fetchData
}: FranchiseTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 w-full">
      {/* Left Column: Leads Tracker & List */}
      <section className="lg:col-span-7 xl:col-span-8 bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Franchise & Partnership Leads (
              {franchiseRequests.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track prospective dark store partners, regional distributors & hub inquiries.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 w-fit cursor-pointer"
          >
            Refresh Leads
          </button>
        </div>

        {/* Status Filter Pills & Search */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-850">
            {['all', 'new', 'contacted', 'converted', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setFranchiseStatusFilter(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize ${
                  franchiseStatusFilter === st
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? `All (${franchiseRequests.length})` : st}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search leads by partner name, phone, city, or notes..."
            className="w-full h-9 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none transition-colors"
            value={searchFranchiseQuery}
            onChange={(e) => setSearchFranchiseQuery(e.target.value)}
          />
        </div>

        {/* Leads List */}
        <div className="space-y-3.5">
          {franchiseRequests
            .filter((req) => {
              const st = req.status || 'new';
              if (franchiseStatusFilter !== 'all' && st !== franchiseStatusFilter) return false;
              const q = searchFranchiseQuery.toLowerCase();
              return (
                req.name.toLowerCase().includes(q) ||
                req.phone.includes(q) ||
                req.city.toLowerCase().includes(q) ||
                (req.email || '').toLowerCase().includes(q) ||
                (req.message || '').toLowerCase().includes(q)
              );
            })
            .map((req) => {
              const st = req.status || 'new';
              return (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 border border-slate-800/80 rounded-2xl bg-slate-950/40 hover:border-slate-700/80 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-white">{req.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            st === 'converted'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : st === 'contacted'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : st === 'rejected'
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          }`}
                        >
                          {st === 'converted'
                            ? '✓ Partner Converted'
                            : st === 'contacted'
                            ? '⏳ Under Discussion'
                            : st === 'rejected'
                            ? '✕ Closed / Not Eligible'
                            : '✨ New Lead'}
                        </span>
                        {req.investment_budget ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300">
                            Budget: {req.investment_budget}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                        <a
                          href={`tel:${req.phone}`}
                          className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                          📞 +91 {req.phone}
                        </a>
                        {req.email ? (
                          <a
                            href={`mailto:${req.email}`}
                            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                          >
                            ✉️ {req.email}
                          </a>
                        ) : null}
                        <span className="flex items-center gap-1 text-slate-300">🏙️ {req.city} Hub</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {req.created_at
                        ? new Date(req.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : ''}
                    </span>
                  </div>

                  {req.message && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Notes / Discussion
                      </span>
                      {req.message}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Stage:</label>
                      <select
                        value={st}
                        onChange={(e) => handleUpdateFranchiseStatus(req.id, e.target.value)}
                        className="h-7 px-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="new">New Lead</option>
                        <option value="contacted">Contacted / In Discussion</option>
                        <option value="converted">Approved & Converted</option>
                        <option value="rejected">Rejected / Dropped</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFranchiseLead(req.id)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}

          {franchiseRequests.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <p className="text-sm">No partnership leads in the system yet.</p>
              <p className="text-xs text-slate-600">
                Use the form on the right to manually generate and record franchise leads.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Lead Generator Form */}
      <section className="lg:col-span-5 xl:col-span-4 bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            ➕ Generate Partnership Lead
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manually record prospective franchise partners and hub discussions.
          </p>
        </div>

        <form onSubmit={handleCreateFranchiseLead} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Partner Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kulkarni"
              className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
              value={newLeadName}
              onChange={(e) => setNewLeadName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Mobile Number *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="e.g. 9876543210"
              className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
              value={newLeadPhone}
              onChange={(e) => setNewLeadPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Email ID (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. ramesh@example.com"
              className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
              value={newLeadEmail}
              onChange={(e) => setNewLeadEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Target City / Territory *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nashik, Pune (Wakad), Ranchi"
              className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
              value={newLeadCity}
              onChange={(e) => setNewLeadCity(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Investment Capacity (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ₹5 - 10 Lakhs, Owns 1500 sq ft warehouse"
              className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors"
              value={newLeadBudget}
              onChange={(e) => setNewLeadBudget(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Initial Lead Stage
            </label>
            <select
              className="w-full h-10 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors cursor-pointer"
              value={newLeadStatus}
              onChange={(e) => setNewLeadStatus(e.target.value as any)}
            >
              <option value="new">New Lead (Not Contacted)</option>
              <option value="contacted">In Discussion / Contacted</option>
              <option value="converted">Approved / Partner Converted</option>
              <option value="rejected">Rejected / Dropped</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Meeting Notes & Discussion
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Discussed dark store model in College Road. Has 3 delivery vans."
              className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm outline-none transition-colors resize-none"
              value={newLeadMessage}
              onChange={(e) => setNewLeadMessage(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={newLeadSaving}
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" /> {newLeadSaving ? 'Saving Lead…' : 'Record & Save Lead'}
          </button>
        </form>
      </section>
    </div>
  );
}
