'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PlatformOrder } from '../../types/admin.types';

interface AnalyticsTabProps {
  orders: PlatformOrder[];
}

export default function AnalyticsTab({ orders }: AnalyticsTabProps) {
  // Math metrics for Analytics
  const calculateAnalytics = () => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const totalSalesSum = delivered.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
    const activePipeline = orders.filter((o) =>
      ['pending', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status)
    );

    // Total revenue sum including pending for calculations
    const allSum = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
    const aov = orders.length > 0 ? Math.round(allSum / orders.length) : 0;

    // Rankings of shops by revenue
    const shopSales: { [key: string]: { name: string; total: number; count: number } } = {};
    for (const o of orders) {
      const name = o.shops?.shop_name || 'Unassigned Merchant';
      if (!shopSales[o.shop_id]) {
        shopSales[o.shop_id] = { name, total: 0, count: 0 };
      }
      shopSales[o.shop_id].count += 1;
      if (o.status === 'delivered') {
        shopSales[o.shop_id].total += parseFloat(o.total_amount || '0');
      }
    }

    const rankedShops = Object.values(shopSales).sort((a, b) => b.total - a.total);

    return {
      gmv: totalSalesSum,
      totalOrders: orders.length,
      activeOrders: activePipeline.length,
      completedOrders: delivered.length,
      aov,
      rankedShops
    };
  };

  const stats = calculateAnalytics();

  return (
    <div className="space-y-6">
      {/* Sales Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform GMV</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">₹{stats.gmv.toLocaleString('en-IN')}</p>
          <p className="text-[9px] text-slate-500 mt-1">Delivered orders revenue</p>
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
          <p className="text-2xl font-bold text-slate-200 mt-2">{stats.totalOrders}</p>
          <p className="text-[9px] text-slate-500 mt-1">Total placed orders</p>
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Orders</p>
          <p className="text-2xl font-bold text-amber-400 mt-2">{stats.activeOrders}</p>
          <p className="text-[9px] text-slate-500 mt-1">In processing pipeline</p>
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-md">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Order (AOV)</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">₹{stats.aov.toLocaleString('en-IN')}</p>
          <p className="text-[9px] text-slate-500 mt-1">Average spent per basket</p>
        </div>
      </div>

      {/* Merchant Rankings */}
      <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" /> Merchant Sales Rankings
        </h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Shop Partner</th>
              <th className="pb-3 text-center">Orders Placed</th>
              <th className="pb-3 text-right">Revenue (GMV)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 text-sm">
            {stats.rankedShops.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                <td className="py-4 pr-3 font-semibold text-white">{item.name}</td>
                <td className="py-4 pr-3 text-center text-slate-400">{item.count} orders</td>
                <td className="py-4 text-right font-bold text-emerald-400">₹{item.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {stats.rankedShops.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500 italic">
                  No sales data recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
