'use client';

import React from 'react';
import {
  Shield,
  Store,
  FileSpreadsheet,
  LogOut,
  MapPin,
  BarChart3,
  ImageIcon,
  MessageSquare,
  Tag,
  Package,
  Ticket,
  ShoppingBag,
  Home,
  Upload,
  X
} from 'lucide-react';
import { TabType, Shop, FranchiseRequest } from '../../types/admin.types';

interface AdminSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: { name?: string; mobile?: string } | null;
  shops: Shop[];
  allOrdersList: any[];
  skuRequests: any[];
  masterProductsList: any[];
  franchiseRequests: FranchiseRequest[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  user,
  shops,
  allOrdersList,
  skuRequests,
  masterProductsList,
  franchiseRequests,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout
}: AdminSidebarProps) {
  const navSections = [
    {
      title: 'Core Operations',
      items: [
        {
          id: 'shops' as TabType,
          label: 'Store Approvals',
          icon: Store,
          badge: shops.filter((s) => s.status === 'pending').length || undefined,
          badgeColor: 'bg-amber-500'
        },
        {
          id: 'orders-admin' as TabType,
          label: 'Live Orders Tracker',
          icon: ShoppingBag,
          badge: allOrdersList.filter((o) => o.status === 'pending').length || undefined,
          badgeColor: 'bg-emerald-500'
        },
        {
          id: 'sku-requests' as TabType,
          label: 'SKU Requests',
          icon: FileSpreadsheet,
          badge: skuRequests.filter((r) => r.status === 'pending').length || undefined,
          badgeColor: 'bg-amber-500'
        },
        {
          id: 'master-catalog' as TabType,
          label: 'Master Catalogue',
          icon: Package,
          badge: masterProductsList.length || undefined,
          badgeColor: 'bg-slate-700'
        },
        { id: 'categories-admin' as TabType, label: 'Manage Categories', icon: Tag }
      ]
    },
    {
      title: 'Territories & Delivery',
      items: [
        { id: 'cities-areas' as TabType, label: 'Cities & Localities', icon: MapPin },
        { id: 'locations' as TabType, label: 'Localities Mapping', icon: MapPin }
      ]
    },
    {
      title: 'Growth & Campaigns',
      items: [
        { id: 'coupons-admin' as TabType, label: 'Manage Coupons', icon: Ticket },
        { id: 'banners' as TabType, label: 'Festive Campaigns', icon: ImageIcon },
        { id: 'home-screen' as TabType, label: 'App Screen Copy', icon: Home },
        { id: 'analytics' as TabType, label: 'Platform Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'Tools & Inquiries',
      items: [
        {
          id: 'franchise' as TabType,
          label: 'Franchise Inquiries',
          icon: MessageSquare,
          badge: franchiseRequests.length || undefined,
          badgeColor: 'bg-blue-500'
        },
        { id: 'bulk-loader' as TabType, label: 'Bulk SKU Loader', icon: Upload }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay / Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Navigation Menu</h2>
                <p className="text-[10px] text-emerald-400 font-bold uppercase">Super Admin Portal</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <div className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-5 pr-1">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">{sec.title}</p>
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-l-4 border-emerald-500 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                              item.badgeColor || 'bg-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User profile / Logout in mobile drawer */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <p className="text-sm font-bold text-slate-100">{user?.name || 'Super Admin'}</p>
                <p className="text-[11px] text-slate-500">Super Admin • +91 {user?.mobile || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Laptop Sidebar Navigation */}
      <aside className="hidden md:flex md:w-60 lg:w-64 bg-[#090D16]/80 border-r border-slate-800/80 backdrop-blur-2xl flex-col justify-between p-4 lg:p-5 sticky top-0 h-screen z-30 flex-shrink-0 shadow-2xl">
        <div className="flex flex-col h-full min-h-0">
          {/* Logo Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80 flex-shrink-0">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Shield className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-bold text-white tracking-tight">MonthlyGrocery</h1>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Super Admin Console</p>
            </div>
          </div>

          {/* Scrollable Navigation Sections */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-4 pr-1">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">{sec.title}</p>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 lg:gap-3 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User profile / Logout */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3 flex-shrink-0">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">+91 {user?.mobile || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs lg:text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
