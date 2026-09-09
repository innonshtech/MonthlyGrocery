'use client';

import React from 'react';
import {
  Shield,
  Menu,
  X,
  Store,
  FileSpreadsheet,
  MapPin,
  BarChart3,
  ImageIcon,
  MessageSquare,
  Tag,
  Package,
  Ticket,
  ShoppingBag,
  Home,
  Upload
} from 'lucide-react';
import { TabType, Shop, FranchiseRequest } from '../../types/admin.types';

interface AdminHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  shops: Shop[];
  allOrdersList: any[];
  skuRequests: any[];
  masterProductsList: any[];
  franchiseRequests: FranchiseRequest[];
}

export default function AdminHeader({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  shops,
  allOrdersList,
  skuRequests,
  masterProductsList,
  franchiseRequests
}: AdminHeaderProps) {
  const allNavItems = [
    {
      id: 'shops' as TabType,
      label: 'Store Approvals',
      icon: Store,
      badge: shops.filter((s) => s.status === 'pending').length || undefined
    },
    {
      id: 'orders-admin' as TabType,
      label: 'Live Orders Tracker',
      icon: ShoppingBag,
      badge: allOrdersList.filter((o) => o.status === 'pending').length || undefined
    },
    {
      id: 'sku-requests' as TabType,
      label: 'SKU Requests',
      icon: FileSpreadsheet,
      badge: skuRequests.filter((r) => r.status === 'pending').length || undefined
    },
    {
      id: 'master-catalog' as TabType,
      label: 'Master Catalogue',
      icon: Package,
      badge: masterProductsList.length || undefined
    },
    { id: 'categories-admin' as TabType, label: 'Manage Categories', icon: Tag },
    { id: 'cities-areas' as TabType, label: 'Cities & Localities', icon: MapPin },
    { id: 'locations' as TabType, label: 'Localities Mapping', icon: MapPin },
    { id: 'coupons-admin' as TabType, label: 'Manage Coupons', icon: Ticket },
    { id: 'banners' as TabType, label: 'Festive Campaigns', icon: ImageIcon },
    { id: 'home-screen' as TabType, label: 'App Screen Copy', icon: Home },
    { id: 'analytics' as TabType, label: 'Platform Analytics', icon: BarChart3 },
    {
      id: 'franchise' as TabType,
      label: 'Franchise Inquiries',
      icon: MessageSquare,
      badge: franchiseRequests.length || undefined
    },
    { id: 'bulk-loader' as TabType, label: 'Bulk SKU Loader', icon: Upload }
  ];

  const currentNav = allNavItems.find((n) => n.id === activeTab) || allNavItems[0];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">MonthlyGrocery</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Super Admin</span>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-[10px] text-slate-300 font-semibold truncate max-w-[120px]">
                {currentNav.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5 text-emerald-400" />}
        </button>
      </header>

      {/* Mobile Quick-Swipe Tab Bar */}
      <div className="md:hidden sticky top-[57px] z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge ? (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
