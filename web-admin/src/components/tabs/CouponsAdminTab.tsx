'use client';

import React from 'react';
import { Ticket, Trash2 } from 'lucide-react';

export interface CouponsAdminTabProps {
  couponsList: any[];
  newCouponCode: string;
  setNewCouponCode: (val: string) => void;
  newCouponType: 'flat' | 'percentage';
  setNewCouponType: (val: 'flat' | 'percentage') => void;
  newCouponVal: string;
  setNewCouponVal: (val: string) => void;
  newCouponMinOrder: string;
  setNewCouponMinOrder: (val: string) => void;
  newCouponMaxDiscount: string;
  setNewCouponMaxDiscount: (val: string) => void;
  newCouponDesc: string;
  setNewCouponDesc: (val: string) => void;
  newCouponTarget: 'all' | 'new' | 'loyal';
  setNewCouponTarget: (val: 'all' | 'new' | 'loyal') => void;
  newCouponUserLimit: string;
  setNewCouponUserLimit: (val: string) => void;
  newCouponGlobalLimit: string;
  setNewCouponGlobalLimit: (val: string) => void;
  handleCreateCoupon: (e: React.FormEvent) => void;
  handleDeleteCoupon: (id: string) => void;
}

export const CouponsAdminTab: React.FC<CouponsAdminTabProps> = ({
  couponsList,
  newCouponCode,
  setNewCouponCode,
  newCouponType,
  setNewCouponType,
  newCouponVal,
  setNewCouponVal,
  newCouponMinOrder,
  setNewCouponMinOrder,
  newCouponMaxDiscount,
  setNewCouponMaxDiscount,
  newCouponDesc,
  setNewCouponDesc,
  newCouponTarget,
  setNewCouponTarget,
  newCouponUserLimit,
  setNewCouponUserLimit,
  newCouponGlobalLimit,
  setNewCouponGlobalLimit,
  handleCreateCoupon,
  handleDeleteCoupon,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
      {/* Create Coupon Form (Col 1) */}
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 h-fit space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-emerald-400" /> Create Promo Coupon
        </h3>
        <form onSubmit={handleCreateCoupon} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. FESTIVE20"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type *</label>
              <select
                value={newCouponType}
                onChange={(e) => setNewCouponType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="percentage">% Percentage</option>
                <option value="flat">₹ Flat Off</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Discount Value *</label>
              <input
                type="number"
                required
                placeholder="10"
                value={newCouponVal}
                onChange={(e) => setNewCouponVal(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min Order (₹)</label>
              <input
                type="number"
                placeholder="2500"
                value={newCouponMinOrder}
                onChange={(e) => setNewCouponMinOrder(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Discount (₹)</label>
              <input
                type="number"
                placeholder="300"
                value={newCouponMaxDiscount}
                onChange={(e) => setNewCouponMaxDiscount(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Save 10% on your monthly groceries"
              value={newCouponDesc}
              onChange={(e) => setNewCouponDesc(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</label>
            <select
              value={newCouponTarget}
              onChange={(e) => setNewCouponTarget(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Customers</option>
              <option value="new">New Customers Only (0 orders)</option>
              <option value="loyal">Loyal Customers Only (1+ orders)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Limit</label>
              <select
                value={newCouponUserLimit}
                onChange={(e) => setNewCouponUserLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="1">Once Per User</option>
                <option value="2">Twice Per User</option>
                <option value="3">3 Times Per User</option>
                <option value="999">Unlimited</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Global Cap</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={newCouponGlobalLimit}
                onChange={(e) => setNewCouponGlobalLimit(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer mt-2"
          >
            Create Coupon Campaign
          </button>
        </form>
      </div>

      {/* Coupons List (Col 2-3) */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-base font-bold text-white">Active Promo Campaigns ({couponsList.length})</h3>
        <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-[#0c1220]/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Target</th>
                <th className="p-3">Limits</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-slate-200">
              {couponsList.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-slate-800/10">
                  <td className="p-3">
                    <span className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/20 rounded-lg text-emerald-400 font-mono font-bold">
                      {cpn.code}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-white">
                    {cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} FLAT`}
                  </td>
                  <td className="p-3 text-slate-400">₹{cpn.min_order_value}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      cpn.target_audience === 'new' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                      cpn.target_audience === 'loyal' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                      'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                    }`}>
                      {cpn.target_audience === 'new' ? 'New Users' :
                       cpn.target_audience === 'loyal' ? 'Loyal' : 'All'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    U: {cpn.usage_limit_per_user || 1} | G: {cpn.max_global_uses || '∞'}
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs truncate">{cpn.description}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(cpn.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {couponsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">No coupons created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
