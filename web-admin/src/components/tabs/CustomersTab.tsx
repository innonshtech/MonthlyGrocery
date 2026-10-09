'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Store,
  UserCheck,
  UserX,
  ShoppingBag,
  IndianRupee,
  Search,
  RefreshCw,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
  Clock,
  CheckCircle2,
  Package,
  ShieldCheck,
  ArrowUpDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { AdminCustomer, AdminMerchant } from '../../types/admin.types';
import { apiFetch } from '../../utils/api';

interface CustomersStats {
  total_customers: number;
  total_merchants: number;
  active_customers: number;
  active_merchants: number;
  deleted_customers: number;
  total_orders: number;
  total_revenue: number;
}

interface CustomerDetailAddress {
  id: string;
  label?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_default?: boolean;
  created_at?: string;
}

interface CustomerDetailOrder {
  id: string;
  order_number?: string;
  status: string;
  total_amount: number;
  final_amount: number;
  delivery_fee?: number;
  discount_amount?: number;
  total_savings?: number;
  created_at: string;
  delivery_address?: string;
  items?: any[];
}

interface CustomerDetailData extends AdminCustomer {
  addresses?: CustomerDetailAddress[];
  orders?: CustomerDetailOrder[];
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [stats, setStats] = useState<CustomersStats>({
    total_customers: 0,
    total_merchants: 0,
    active_customers: 0,
    active_merchants: 0,
    deleted_customers: 0,
    total_orders: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // View Mode: 'customers' | 'merchants' | 'all'
  const [viewMode, setViewMode] = useState<'customers' | 'merchants' | 'all'>('customers');

  // Filtering and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'orders' | 'spent' | 'name'>('newest');

  // Customer Detail Drawer / Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetailData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchDirectoryData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/admin/customers');
      if (res.success) {
        setCustomers(res.customers || []);
        setMerchants(res.merchants || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err: any) {
      console.error('Failed to load user directory:', err);
      setError(err.message || 'Failed to load directory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const handleViewCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetails(true);
    setCustomerDetail(null);
    try {
      const res = await apiFetch(`/admin/customers/${id}`);
      if (res.success && res.customer) {
        setCustomerDetail(res.customer);
      }
    } catch (err: any) {
      console.error('Failed to fetch customer detail:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '—';
    if (phone.startsWith('del_') || phone.startsWith('deleted_')) {
      return '(Deleted Account)';
    }
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 12 && clean.startsWith('91')) {
      return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return phone;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filtered Customer List
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (c.name || '').toLowerCase().includes(q) || (c.full_name || '').toLowerCase().includes(q);
        const phoneMatch = (c.phone || '').toLowerCase().includes(q);
        const emailMatch = (c.email || '').toLowerCase().includes(q);
        const cityMatch = (c.city || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || cityMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'orders') {
          return (b.orders_count || 0) - (a.orders_count || 0);
        }
        if (sortBy === 'spent') {
          return (b.total_spent || 0) - (a.total_spent || 0);
        }
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0;
      });
  }, [customers, statusFilter, searchQuery, sortBy]);

  // Filtered Merchants List
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const shopMatch = (m.shop_name || '').toLowerCase().includes(q);
      const ownerMatch = (m.owner_name || '').toLowerCase().includes(q);
      const phoneMatch = (m.phone || '').toLowerCase().includes(q);
      const cityMatch = (m.city || '').toLowerCase().includes(q);
      return shopMatch || ownerMatch || phoneMatch || cityMatch;
    });
  }, [merchants, searchQuery]);

  return (
    <div className="space-y-6 w-full">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Users & Directory</h2>
              <p className="text-xs text-slate-400">
                Complete directory of registered Customers, Store Merchants, and platform accounts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchDirectoryData(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-800 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Directory'}
        </button>
      </div>

      {/* 4 Summary Stat Cards: Simple, Clear & Distinct */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div
          onClick={() => setViewMode('customers')}
          className={`p-4 rounded-2xl bg-slate-900/60 border transition-all cursor-pointer backdrop-blur-xl shadow-lg relative overflow-hidden ${
            viewMode === 'customers' ? 'border-emerald-500/60 ring-1 ring-emerald-500/40 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Total Customers</p>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats.total_customers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Consumer app shoppers</p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Total Merchants */}
        <div
          onClick={() => setViewMode('merchants')}
          className={`p-4 rounded-2xl bg-slate-900/60 border transition-all cursor-pointer backdrop-blur-xl shadow-lg relative overflow-hidden ${
            viewMode === 'merchants' ? 'border-blue-500/60 ring-1 ring-blue-500/40 bg-blue-950/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Total Merchants</p>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-400 mt-2">{stats.total_merchants}</p>
          <p className="text-[11px] text-slate-500 mt-1">Store / Kirana partners</p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Total Orders */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Total Orders Placed</p>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{stats.total_orders}</p>
          <p className="text-[11px] text-slate-500 mt-1">Across all stores</p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Deleted / Inactive Accounts */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Deleted Accounts</p>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{stats.deleted_customers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Soft-deleted users</p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Directory Category Tabs (Customers vs Merchants vs All) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setViewMode('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'customers'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Customers ({stats.total_customers})
        </button>

        <button
          onClick={() => setViewMode('merchants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'merchants'
              ? 'bg-blue-500 text-white font-black shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          Merchants / Stores ({stats.total_merchants})
        </button>

        <button
          onClick={() => setViewMode('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'all'
              ? 'bg-slate-700 text-white font-black shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
          }`}
        >
          All Directory ({customers.length})
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewMode === 'merchants'
                ? 'Search by store name, owner name, mobile number, or city...'
                : 'Search by customer name, mobile number, email, or city...'
            }
            className="w-full pl-9 pr-8 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Pills (For Customers) */}
        {viewMode !== 'merchants' && (
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({stats.active_customers})
            </button>
            <button
              onClick={() => setStatusFilter('deleted')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'deleted'
                  ? 'bg-rose-500 text-white font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deleted ({stats.deleted_customers})
            </button>
          </div>
        )}

        {/* Sort Dropdown */}
        {viewMode !== 'merchants' && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="orders">Most Orders</option>
              <option value="spent">Highest Spend</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: CUSTOMERS TABLE */}
      {viewMode !== 'merchants' && (
        <div className="bg-slate-900/40 rounded-2xl sm:rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Loading customer records from database...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-bold text-rose-400">{error}</p>
              <button
                onClick={() => fetchDirectoryData(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">No customers found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No customers matched "${searchQuery}". Try a different search keyword.`
                  : 'No customers found in this filter view.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-emerald-400 hover:underline pt-1"
                >
                  Clear Search Query
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Mobile & Contact</th>
                    <th className="p-4">Account Type</th>
                    <th className="p-4">Orders & Activity</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-200">
                  {filteredCustomers.map((cust) => {
                    const isDeleted = cust.status === 'deleted';
                    return (
                      <tr
                        key={cust.id}
                        className={`hover:bg-slate-800/20 transition-colors ${
                          isDeleted ? 'opacity-70 bg-rose-950/5' : ''
                        }`}
                      >
                        {/* Customer Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isDeleted
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {getInitials(cust.name)}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">
                                {cust.name || cust.full_name || 'Customer'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                ID: {cust.id.length > 16 ? `${cust.id.slice(0, 8)}...${cust.id.slice(-6)}` : cust.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone & Contact */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <span className="font-mono">{formatPhoneNumber(cust.phone)}</span>
                            </div>
                            {cust.email && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                <span>{cust.email}</span>
                              </div>
                            )}
                            {cust.city && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                <span>
                                  {cust.city} {cust.pincode ? `(${cust.pincode})` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Account Type & Status */}
                        <td className="p-4">
                          <div className="space-y-1">
                            {isDeleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <UserX className="w-3 h-3" /> Deleted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <UserCheck className="w-3 h-3" /> Customer
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Activity & Orders */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-white">
                                {cust.orders_count || 0} orders
                              </span>
                              <span className="text-emerald-400 font-bold font-mono">
                                ₹{(cust.total_spent || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {cust.addresses_count || 0} saved address{cust.addresses_count === 1 ? '' : 'es'}
                            </p>
                          </div>
                        </td>

                        {/* Registered Date */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-300 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                {cust.created_at
                                  ? new Date(cust.created_at).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {cust.created_at
                                ? new Date(cust.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </p>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleViewCustomer(cust.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MERCHANTS / STORES TABLE */}
      {viewMode === 'merchants' && (
        <div className="bg-slate-900/40 rounded-2xl sm:rounded-3xl border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
          {filteredMerchants.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                <Store className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">No merchants registered</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No store partners matched "${searchQuery}".`
                  : 'No dark stores or kirana partners registered yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Store / Kirana Name</th>
                    <th className="p-4">Owner Name</th>
                    <th className="p-4">Mobile & Contact</th>
                    <th className="p-4">Location / Address</th>
                    <th className="p-4">Store Status</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-200">
                  {filteredMerchants.map((merch) => (
                    <tr key={merch.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 flex-shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{merch.shop_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {merch.id.slice(0, 8)}...{merch.id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-200">{merch.owner_name || 'Store Partner'}</p>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-200 font-mono font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatPhoneNumber(merch.phone)}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-xs text-slate-300 truncate max-w-xs">{merch.address || 'Address on file'}</p>
                        <p className="text-[10px] text-slate-400">
                          {merch.city} {merch.pincode ? `(${merch.pincode})` : ''}
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            merch.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : merch.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {merch.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {merch.created_at
                              ? new Date(merch.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-sm text-emerald-400">
                  {customerDetail ? getInitials(customerDetail.name) : 'CU'}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    {customerDetail?.name || customerDetail?.full_name || 'Customer Details'}
                    {customerDetail?.status === 'deleted' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Deleted
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    User ID: {selectedCustomerId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
              {loadingDetails ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                  <p className="text-xs text-slate-400">Fetching customer addresses and order history...</p>
                </div>
              ) : !customerDetail ? (
                <p className="text-xs text-rose-400 text-center py-10">Failed to load customer profile details.</p>
              ) : (
                <>
                  {/* Quick Profile Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone / Mobile</p>
                      <p className="text-xs font-bold text-white font-mono mt-1">
                        {formatPhoneNumber(customerDetail.phone)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-xs font-bold text-white mt-1 truncate">
                        {customerDetail.email || 'None Provided'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Since</p>
                      <p className="text-xs font-bold text-white mt-1">
                        {customerDetail.created_at
                          ? new Date(customerDetail.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Saved Delivery Addresses */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-400" /> Saved Delivery Addresses (
                        {customerDetail.addresses?.length || 0})
                      </h4>
                    </div>

                    {(!customerDetail.addresses || customerDetail.addresses.length === 0) ? (
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
                        <p className="text-xs text-slate-500">No saved addresses on file for this user.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customerDetail.addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 capitalize">
                                {addr.label || 'Home'}
                              </span>
                              {addr.is_default && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200 font-medium leading-relaxed">
                              {addr.address_line1}
                              {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {addr.city}
                              {addr.state ? `, ${addr.state}` : ''} {addr.pincode ? `- ${addr.pincode}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Order History */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-purple-400" /> Order History (
                        {customerDetail.orders?.length || 0})
                      </h4>
                    </div>

                    {(!customerDetail.orders || customerDetail.orders.length === 0) ? (
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
                        <p className="text-xs text-slate-500">No orders placed yet by this customer.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {customerDetail.orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-white">
                                  #{ord.order_number || ord.id.slice(0, 8)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    ord.status === 'delivered'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : ord.status === 'cancelled'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {ord.delivery_address && (
                                <p className="text-[11px] text-slate-400 truncate max-w-md">
                                  📍 {ord.delivery_address}
                                </p>
                              )}
                            </div>

                            <div className="text-right sm:flex-shrink-0">
                              <p className="text-sm font-black text-emerald-400 font-mono">
                                ₹{Number(ord.final_amount || ord.total_amount || 0).toLocaleString('en-IN')}
                              </p>
                              {ord.total_savings ? (
                                <p className="text-[10px] text-emerald-400/80">
                                  Saved ₹{ord.total_savings}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
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
