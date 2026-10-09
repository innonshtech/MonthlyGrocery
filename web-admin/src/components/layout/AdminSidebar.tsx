'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  X,
  ChevronUp
} from 'lucide-react';
import { TabType, Shop, FranchiseRequest } from '../../types/admin.types';
import { ThemeToggle } from '../../context/ThemeContext';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navSections = [
    {
      title: 'Core Operations',
      items: [
        {
          id: 'shops' as TabType,
          label: 'Stores & Delivery Network',
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
      title: 'Territories & Master Data',
      items: [
        { id: 'cities-areas' as TabType, label: 'Cities & Localities Directory', icon: MapPin }
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

  const userInitials = (user?.name || 'Super Admin')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Drawer Overlay / Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/30 shadow-md shadow-emerald-500/15 flex-shrink-0 bg-white p-0.5 flex items-center justify-center">
                <img src="/ever-logo.png" alt="EVER Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">EVER</h2>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Super Admin Portal</p>
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
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            {mobileProfileOpen && (
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Appearance</p>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
              className="w-full flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {userInitials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-100">{user?.name || 'Super Admin'}</p>
                  <p className="text-[10px] text-slate-500">+91 {user?.mobile || ''}</p>
                </div>
              </div>
              <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${mobileProfileOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop & Laptop Sidebar Navigation */}
      <aside className="hidden md:flex md:w-60 lg:w-64 bg-[#090D16]/80 border-r border-slate-800/80 backdrop-blur-2xl flex-col justify-between p-4 lg:p-5 sticky top-0 h-screen z-30 flex-shrink-0 shadow-2xl">
        <div className="flex flex-col h-full min-h-0">
          {/* Logo Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80 flex-shrink-0">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg shadow-emerald-500/15 flex-shrink-0 bg-white p-1 flex items-center justify-center">
              <img src="/ever-logo.png" alt="EVER Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-bold text-white tracking-tight">EVER</h1>
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

          {/* User Profile Popover & Trigger */}
          <div className="pt-3 border-t border-slate-800/80 relative flex-shrink-0" ref={profileRef}>
            {/* Floating Popover Panel */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-700/80 shadow-2xl space-y-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {/* Super Admin Info */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex-shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Admin'}</p>
                    <p className="text-[10px] text-slate-400 truncate">+91 {user?.mobile || ''}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-500/20">
                      🛡️ Verified Super Admin
                    </span>
                  </div>
                </div>

                {/* Theme Switcher Banner */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appearance</p>
                  <ThemeToggle />
                </div>

                {/* Logout Action */}
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Single Sleek Trigger Pill */}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                profileOpen
                  ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                  {userInitials}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Super Admin'}</p>
                  <p className="text-[10px] text-emerald-400 font-medium leading-none mt-0.5">Super Admin</p>
                </div>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                  profileOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
