'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { PlatformOrder } from '@/types/admin.types';

export interface OrdersAdminTabProps {
  allOrdersList: PlatformOrder[];
  orderStatusFilter: string;
  setOrderStatusFilter: (status: string) => void;
  handleUpdateOrderStatus: (orderId: string, status: string) => void;
}

function getOrderDisplayId(order: { id?: string; display_id?: string }): string {
  if (order.display_id) {
    const d = String(order.display_id).replace(/^#/, '');
    return d.startsWith('MG') ? `#${d}` : `#MG${d}`;
  }
  const raw = String(order.id || '');
  if (!raw) return '';
  if (raw.startsWith('MG')) return `#${raw}`;
  const compact = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!compact) return '';
  return `#MG${compact.slice(-5)}`;
}

export const OrdersAdminTab: React.FC<OrdersAdminTabProps> = ({
  allOrdersList,
  orderStatusFilter,
  setOrderStatusFilter,
  handleUpdateOrderStatus,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" /> Platform Orders ({allOrdersList.length})
          </h3>
          <p className="text-xs text-slate-400">Monitor and update customer orders across all stores in real-time.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          {['all', 'pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setOrderStatusFilter(st)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer capitalize ${
                orderStatusFilter === st ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-[#0c1220]/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-3">Order ID & Date</th>
              <th className="p-3">Customer & Location</th>
              <th className="p-3">Items Summary</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Live Status</th>
              <th className="p-3 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 text-slate-200">
            {allOrdersList
              .filter((ord) => orderStatusFilter === 'all' || ord.status === orderStatusFilter)
              .map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/10">
                  <td className="p-3">
                    <p className="font-bold text-white font-mono">{getOrderDisplayId(ord)}</p>
                    <p className="text-[10px] text-slate-500">{new Date(ord.created_at).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-200">{ord.profiles?.name || 'Customer'}</p>
                    <p className="text-[10px] text-slate-400">{ord.delivery_address || 'Address on file'}</p>
                  </td>
                  <td className="p-3 text-slate-300">
                    {ord.order_items?.map((oi: any) => `${oi.products?.name || 'Item'} (x${oi.quantity})`).join(', ') || 'Grocery items'}
                  </td>
                  <td className="p-3 font-bold text-emerald-400">
                    ₹{ord.total_amount}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      ord.status === 'delivered' ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' :
                      ord.status === 'cancelled' ? 'bg-red-500/15 border-red-500/20 text-red-400' :
                      ord.status === 'out_for_delivery' ? 'bg-purple-500/15 border-purple-500/20 text-purple-400' :
                      'bg-amber-500/15 border-amber-500/20 text-amber-400'
                    }`}>
                      {ord.status?.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={ord.status}
                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="packing">Packing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            {allOrdersList.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 italic">No customer orders placed yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
