'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Store,
  FileSpreadsheet,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  MapPin,
  BarChart3,
  ImageIcon,
  MessageSquare,
  Plus,
  Trash2
} from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    name: string;
    phone: string;
  };
}

interface ServiceableLocation {
  id: string;
  city: string;
  area_name: string;
  pincode: string;
  is_serviceable: boolean;
  shop_id: string | null;
}

interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  action_link: string;
  active: boolean;
}

interface FranchiseRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  created_at: string;
}

interface PlatformOrder {
  id: string;
  total_amount: string;
  status: string;
  created_at: string;
  shop_id: string;
  shops: {
    shop_name: string;
  };
  profiles: {
    name: string;
    phone: string;
  };
}

interface City {
  id: string;
  name: string;
}

interface Area {
  id: string;
  city_id: string;
  name: string;
}

type TabType = 'shops' | 'locations' | 'analytics' | 'banners' | 'franchise' | 'bulk-loader' | 'cities-areas';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('shops');

  // Lists & data states
  const [shops, setShops] = useState<Shop[]>([]);
  const [locations, setLocations] = useState<ServiceableLocation[]>([]);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [franchiseRequests, setFranchiseRequests] = useState<FranchiseRequest[]>([]);
  const [orders, setOrders] = useState<PlatformOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // Forms for City / Area registration
  const [newCityName, setNewCityName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bulk Excel Upload states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelReport, setExcelReport] = useState<any>(null);
  const [excelError, setExcelError] = useState('');

  // Forms states
  const [locCity, setLocCity] = useState('Mumbai');
  const [locArea, setLocArea] = useState('');
  const [locPin, setLocPin] = useState('');
  const [locShop, setLocShop] = useState('');

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('');

  // 1. Guard check on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('@admin_token');
    const savedUserStr = localStorage.getItem('@admin_user');
    if (!savedToken || !savedUserStr) {
      router.replace('/login');
      return;
    }
    setToken(savedToken);
    setUser(JSON.parse(savedUserStr));
  }, [router]);

  // Fetch data depending on active tab
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'shops' || activeTab === 'locations') {
        const res = await fetch('http://localhost:8001/api/shops/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setShops(data.shops);
        }
      }

      if (activeTab === 'locations' || activeTab === 'cities-areas') {
        const resCities = await fetch('http://localhost:8001/api/admin/cities');
        const dataCities = await resCities.json();
        if (resCities.ok && dataCities.success) {
          setCities(dataCities.cities);
        }

        const resAreas = await fetch('http://localhost:8001/api/admin/areas');
        const dataAreas = await resAreas.json();
        if (resAreas.ok && dataAreas.success) {
          setAreas(dataAreas.areas);
        }
      }

      if (activeTab === 'locations') {
        const res = await fetch('http://localhost:8001/api/admin/locations');
        const data = await res.json();
        if (res.ok && data.success) {
          setLocations(data.locations);
        }
      }

      if (activeTab === 'banners') {
        const res = await fetch('http://localhost:8001/api/admin/banners/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setBanners(data.banners);
        }
      }

      if (activeTab === 'franchise') {
        const res = await fetch('http://localhost:8001/api/admin/franchise', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFranchiseRequests(data.requests);
        }
      }

      if (activeTab === 'analytics') {
        const res = await fetch('http://localhost:8001/api/orders/platform/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, activeTab]);

  // Shop Status approvals
  const handleUpdateShopStatus = async (shopId: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8001/api/shops/${shopId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Add serviceable locations PIN mapping
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !locCity.trim() || !locArea.trim() || !locPin.trim()) {
      alert('Please fill out all location fields (including City name)');
      return;
    }
    try {
      const res = await fetch('http://localhost:8001/api/admin/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city: locCity.trim(),
          area_name: locArea.trim(),
          pincode: locPin.trim(),
          shop_id: locShop || null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLocations(data.locations);
        setLocCity('');
        setLocArea('');
        setLocPin('');
        setLocShop('');
        alert('Location zone saved successfully!');
      } else {
        alert(data.error || 'Failed to save location');
      }
    } catch (err) {
      alert('Error creating location');
    }
  };

  // Delete serviceable location zone
  const handleDeleteLocation = async (locId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      const res = await fetch(`http://localhost:8001/api/admin/locations/${locId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLocations(data.locations);
      }
    } catch (err) {
      alert('Failed to delete locality');
    }
  };

  // City operations
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCityName.trim()) {
      alert('Please enter a city name');
      return;
    }
    try {
      const res = await fetch('http://localhost:8001/api/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCityName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCities(data.cities);
        setNewCityName('');
        alert('City registered successfully!');
      } else {
        alert(data.error || 'Failed to register city');
      }
    } catch (err) {
      alert('Error creating city');
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this city? This will also delete all registered areas under it.')) return;
    try {
      const res = await fetch(`http://localhost:8001/api/admin/cities/${cityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCities(data.cities);
        const resAreas = await fetch('http://localhost:8001/api/admin/areas');
        const dataAreas = await resAreas.json();
        if (resAreas.ok && dataAreas.success) {
          setAreas(dataAreas.areas);
        }
      }
    } catch (err) {
      alert('Failed to delete city');
    }
  };

  // Area operations
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCityId || !newAreaName.trim()) {
      alert('Please select a city and enter area name');
      return;
    }
    try {
      const res = await fetch('http://localhost:8001/api/admin/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city_id: selectedCityId, name: newAreaName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAreas(data.areas);
        setNewAreaName('');
        alert('Area/locality registered successfully!');
      } else {
        alert(data.error || 'Failed to register area');
      }
    } catch (err) {
      alert('Error creating area');
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this area?')) return;
    try {
      const res = await fetch(`http://localhost:8001/api/admin/areas/${areaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAreas(data.areas);
      }
    } catch (err) {
      alert('Failed to delete area');
    }
  };

  // Add festive promotional banner
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !bannerTitle || !bannerImage) {
      alert('Please enter banner title and image URL');
      return;
    }
    try {
      const res = await fetch('http://localhost:8001/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: bannerTitle,
          image_url: bannerImage,
          action_link: bannerLink
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanners(data.banners);
        setBannerTitle('');
        setBannerImage('');
        setBannerLink('');
        alert('Campaign banner added successfully!');
      } else {
        alert(data.error || 'Failed to add campaign banner');
      }
    } catch (err) {
      alert('Error saving campaign banner');
    }
  };

  // Delete promotional banner
  const handleDeleteBanner = async (bannerId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove this promo campaign banner?')) return;
    try {
      const res = await fetch(`http://localhost:8001/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanners(data.banners);
      }
    } catch (err) {
      alert('Failed to delete campaign banner');
    }
  };

  // Download excel product templates
  const handleDownloadTemplate = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8001/api/products/excel-template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download template failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monthlygrocery-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Could not download spreadsheet layout template.');
    }
  };

  // Upload spreadsheet SKU loader
  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !excelFile) return;

    setUploadingExcel(true);
    setExcelReport(null);
    setExcelError('');

    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      const res = await fetch('http://localhost:8001/api/products/import-excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process spreadsheet');
      }
      setExcelReport(data);
      setExcelFile(null);
      alert('Spreadsheet processing completed successfully!');
    } catch (err: any) {
      setExcelError(err.message || 'Excel processing failed');
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@admin_token');
    localStorage.removeItem('@admin_user');
    router.replace('/login');
  };

  // Math metrics for Analytics
  const calculateAnalytics = () => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalSalesSum = delivered.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
    const activePipeline = orders.filter(o => ['pending', 'confirmed', 'packing', 'out_for_delivery'].includes(o.status));
    
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

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#10B981] animate-spin" />
      </div>
    );
  }

  const stats = calculateAnalytics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090D16] via-[#0F172A] to-[#1E1B4B] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#090D16]/65 border-b md:border-b-0 md:border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">MonthlyGrocery</h1>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Super Admin Console</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('shops')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'shops' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Store className="w-4 h-4" /> Store Approvals
            </button>

            <button
              onClick={() => setActiveTab('cities-areas')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'cities-areas' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MapPin className="w-4 h-4" /> Cities & Localities
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'locations' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MapPin className="w-4 h-4" /> Localities Mapping
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Platform Analytics
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'banners' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Festive Campaigns
            </button>

            <button
              onClick={() => setActiveTab('franchise')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'franchise' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Franchise Inquiries
            </button>

            <button
              onClick={() => setActiveTab('bulk-loader')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'bulk-loader' 
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.04)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulk SKU Loader
            </button>
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-100">{user.name}</p>
            <p className="text-[11px] text-slate-500">Super Admin Mobile: {user.mobile}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 rounded-xl w-max shadow-sm backdrop-blur-md">
            <Loader2 className="w-4 h-4 animate-spin" /> Querying API Database...
          </div>
        )}

        {/* 1. STORE APPROVALS TAB */}
        {activeTab === 'shops' && (
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-5xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" /> Store Registration Whitelisting
              </h2>
              <button onClick={fetchData} className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Store Name</th>
                    <th className="pb-3">Owner Contact</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-sm">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 pr-3 font-semibold text-white">{shop.shop_name}</td>
                      <td className="py-4 pr-3">
                        <p className="font-semibold text-slate-200">{shop.profiles?.name || 'Owner'}</p>
                        <p className="text-xs text-slate-500">+{shop.profiles?.phone}</p>
                      </td>
                      <td className="py-4 pr-3">
                        {shop.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {shop.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            Rejected
                          </span>
                        )}
                        {shop.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {shop.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateShopStatus(shop.id, 'approved')}
                            className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {shop.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateShopStatus(shop.id, 'rejected')}
                            className="text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-lg transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 2. LOCALITIES MAPPING TAB */}
        {activeTab === 'locations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
            {/* Left Column: List of Mapped Zones */}
            <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
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
                      const matchedShop = shops.find(s => s.id === loc.shop_id);
                      return (
                        <tr key={loc.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 pr-3 font-semibold">
                            <span className="text-white">{loc.area_name}</span>
                            <span className="text-xs text-slate-500 block">{loc.city}</span>
                          </td>
                          <td className="py-4 pr-3 text-slate-300 font-mono font-bold">{loc.pincode}</td>
                          <td className="py-4 pr-3">
                            {matchedShop ? (
                              <span className="text-emerald-400 font-semibold">{matchedShop.shop_name}</span>
                            ) : (
                              <span className="text-slate-500 italic">No Shop Assigned</span>
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
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Column: Add Location form */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
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
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Locality Name</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    disabled={!locCity}
                    value={locArea}
                    onChange={(e) => setLocArea(e.target.value)}
                  >
                    <option value="">Select registered locality...</option>
                    {areas
                      .filter((area) => {
                        const cityObj = cities.find(c => c.name === locCity);
                        return cityObj ? area.city_id === cityObj.id : false;
                      })
                      .map((area) => (
                        <option key={area.id} value={area.name}>{area.name}</option>
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
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Shop</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={locShop}
                    onChange={(e) => setLocShop(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {shops.filter(s => s.status === 'approved').map(s => (
                      <option key={s.id} value={s.id}>{s.shop_name}</option>
                    ))}
                  </select>
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
        )}

        {/* 3. PLATFORM ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 max-w-6xl">
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
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* 4. FESTIVE CAMPAIGNS TAB */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
            {/* Left Column: Banners List */}
            <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" /> Promotional Festive Banners
              </h2>
              
              <div className="space-y-4">
                {banners.map((b) => (
                  <div key={b.id} className="flex gap-4 p-4 border border-slate-800/80 rounded-2xl items-center bg-slate-950/40">
                    <img src={b.image_url} alt={b.title} className="w-24 h-16 object-cover rounded-lg bg-slate-900 border border-slate-800" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-200">{b.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Deep Link: {b.action_link || 'None'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Column: Add Banner Form */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">➕ Publish New Campaign</h3>
              
              <form onSubmit={handleAddBanner} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Banner Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Save 10% on Oils!"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Image URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Action Deep Link</label>
                  <input
                    type="text"
                    placeholder="e.g. CategoryProducts?category=Oil"
                    className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-4 cursor-pointer"
                >
                  Publish Campaign Banner
                </button>
              </form>
            </section>
          </div>
        )}

        {/* 5. FRANCHISE REQUESTS TAB */}
        {activeTab === 'franchise' && (
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-5xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Franchise Partnership Requests
            </h2>
            
            <div className="space-y-4">
              {franchiseRequests.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No partnership leads received yet.</p>
              ) : (
                franchiseRequests.map((req) => (
                  <div key={req.id} className="p-5 border border-slate-800/80 rounded-2xl bg-slate-950/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-slate-100">{req.name}</h4>
                        <p className="text-xs text-slate-500">📞 +91 {req.phone} | ✉️ {req.email || 'No email'}</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {req.city} Hub request
                      </span>
                    </div>
                    {req.message && (
                      <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-900 text-sm text-slate-400">
                        {req.message}
                      </div>
                    )}
                    <p className="text-[9px] text-slate-600 text-right">Received: {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* 6. BULK SKU LOADER TAB */}
        {activeTab === 'bulk-loader' && (
          <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl max-w-md shadow-xl">
            <div className="flex items-center gap-2.5 mb-6">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Bulk Inventory Loader</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200">1. Download Template Sheet</h3>
                <p className="text-xs text-slate-500">Download the standard layout template containing configurations schema.</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 border-2 border-dashed border-slate-800 hover:border-emerald-500 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download template.xlsx
                </button>
              </div>

              <hr className="border-slate-850" />

              <form onSubmit={handleExcelUpload} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">2. Upload Spreadsheet</h3>
                <p className="text-xs text-slate-500">Select the updated spreadsheet file containing SKUs to upload.</p>
                
                <div className="relative border-2 border-dashed border-slate-850 hover:border-slate-700 rounded-2xl p-6 text-center cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">
                    {excelFile ? excelFile.name : 'Choose Excel File'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">supports .xlsx up to 5MB</p>
                </div>

                {excelError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/15 text-xs text-red-400 rounded-xl">
                    {excelError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingExcel || !excelFile}
                  className={`w-full h-11 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    excelFile ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/10' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {uploadingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Bulk Import'}
                </button>
              </form>

              {excelReport && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> Bulk Import Finished
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/10">
                      <p className="text-slate-500">Processed</p>
                      <p className="text-base font-bold text-slate-200">{excelReport.rows_processed}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/10">
                      <p className="text-slate-500">Created</p>
                      <p className="text-base font-bold text-emerald-400">{excelReport.created}</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/10">
                      <p className="text-slate-500">Updated</p>
                      <p className="text-base font-bold text-blue-400">{excelReport.updated}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. CITIES & LOCALITIES TAB */}
        {activeTab === 'cities-areas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
            {/* Left: Manage Cities */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" /> Register City
              </h2>
              
              <form onSubmit={handleAddCity} className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  className="flex-1 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                />
                <button
                  type="submit"
                  className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>

              <div className="border-t border-slate-850 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Registered Cities</h3>
                <div className="divide-y divide-slate-800/30 max-h-96 overflow-y-auto pr-1">
                  {cities.map((city) => (
                    <div key={city.id} className="flex justify-between items-center py-3">
                      <span className="text-sm font-semibold text-slate-200">{city.name}</span>
                      <button
                        onClick={() => handleDeleteCity(city.id)}
                        className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {cities.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 italic text-center">No cities registered yet.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Right: Manage Areas/Localities */}
            <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Register Locality / Area
              </h2>

              <form onSubmit={handleAddArea} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select City</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                  >
                    <option value="">Choose registered city...</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Area / Locality Name</label>
                    <input
                      type="text"
                      placeholder="e.g. College Road"
                      className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-850 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Registered Localities</h3>
                <div className="divide-y divide-slate-800/30 max-h-80 overflow-y-auto pr-1">
                  {areas.map((area) => {
                    const matchedCity = cities.find(c => c.id === area.city_id);
                    return (
                      <div key={area.id} className="flex justify-between items-center py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{area.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{matchedCity?.name || 'Unknown City'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          className="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {areas.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 italic text-center">No areas registered yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
}
