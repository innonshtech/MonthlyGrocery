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
  Image as ImageIcon,
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

type TabType = 'shops' | 'locations' | 'analytics' | 'banners' | 'franchise' | 'bulk-loader';

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
    if (!token || !locArea || !locPin) {
      alert('Please fill out all location fields');
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
          city: locCity,
          area_name: locArea,
          pincode: locPin,
          shop_id: locShop || null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLocations(data.locations);
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
      <div className="min-h-screen bg-[#FFF8ED] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#0B1220] animate-spin" />
      </div>
    );
  }

  const stats = calculateAnalytics();

  return (
    <div className="min-h-screen bg-[#FFF8ED] text-gray-800 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#F1EAD8] flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B1220] rounded-xl text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0B1220]">MonthlyGrocery</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Super Admin Console</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('shops')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'shops' ? 'bg-[#0B1220] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" /> Store Approvals
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'locations' ? 'bg-[#0B1220] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" /> Localities Mapping
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-[#0B1220] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Platform Analytics
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'banners' ? 'bg-[#0B1220] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Festive Campaigns
            </button>

            <button
              onClick={() => setActiveTab('franchise')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'franchise' ? 'bg-[#0B1220] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Franchise Inquiries
            </button>

            <button
              onClick={() => setActiveTab('bulk-loader')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'bulk-loader' ? 'bg-[#0B1220] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulk SKU Loader
            </button>
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
          <div>
            <p className="text-sm font-bold text-[#0B1220]">{user.name}</p>
            <p className="text-xs text-gray-400">Owner Mobile: {user.mobile}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-500 bg-white border border-[#F1EAD8] px-4 py-2.5 rounded-xl w-max">
            <Loader2 className="w-4 h-4 animate-spin text-[#0B1220]" /> Fetching data...
          </div>
        )}

        {/* 1. STORE APPROVALS TAB */}
        {activeTab === 'shops' && (
          <section className="bg-white rounded-3xl p-6 border border-[#F1EAD8] max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0B1220] flex items-center gap-2">🏪 Store Registration Whitelisting</h2>
              <button onClick={fetchData} className="text-xs font-bold text-gray-500 hover:text-gray-800">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3">Store Name</th>
                    <th className="pb-3">Owner Contact</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50/50">
                      <td className="py-4 pr-3 font-semibold text-gray-900">{shop.shop_name}</td>
                      <td className="py-4 pr-3">
                        <p className="font-medium text-gray-700">{shop.profiles?.name || 'Owner'}</p>
                        <p className="text-xs text-gray-400">+{shop.profiles?.phone}</p>
                      </td>
                      <td className="py-4 pr-3">
                        {shop.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                            Approved
                          </span>
                        )}
                        {shop.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                            Rejected
                          </span>
                        )}
                        {shop.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 animate-pulse">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {shop.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateShopStatus(shop.id, 'approved')}
                            className="text-xs font-bold px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {shop.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateShopStatus(shop.id, 'rejected')}
                            className="text-xs font-bold px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
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
            <section className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#F1EAD8]">
              <h2 className="text-lg font-bold text-[#0B1220] mb-6 flex items-center gap-2">📍 Serviceable Delivery Localities</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3">City / Locality</th>
                      <th className="pb-3">PIN Code</th>
                      <th className="pb-3">Assigned Merchant</th>
                      <th className="pb-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {locations.map((loc) => {
                      const matchedShop = shops.find(s => s.id === loc.shop_id);
                      return (
                        <tr key={loc.id} className="hover:bg-gray-50/50">
                          <td className="py-4 pr-3 font-semibold">
                            <span className="text-gray-900">{loc.area_name}</span>
                            <span className="text-xs text-gray-400 block">{loc.city}</span>
                          </td>
                          <td className="py-4 pr-3 text-gray-600 font-mono font-semibold">{loc.pincode}</td>
                          <td className="py-4 pr-3">
                            {matchedShop ? (
                              <span className="text-blue-600 font-semibold">{matchedShop.shop_name}</span>
                            ) : (
                              <span className="text-gray-400 italic">No Shop Assigned</span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="text-red-500 hover:text-red-700 cursor-pointer"
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
            <section className="bg-white rounded-3xl p-6 border border-[#F1EAD8] h-max">
              <h3 className="text-base font-bold text-[#0B1220] mb-4 flex items-center gap-2">➕ Add Serviceable Zone</h3>
              
              <form onSubmit={handleAddLocation} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">City Location</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 border border-gray-200 rounded-xl text-sm"
                    value={locCity}
                    onChange={(e) => setLocCity(e.target.value)}
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Locality Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Andheri West"
                    className="w-full mt-1.5 h-11 px-4 border border-gray-200 rounded-xl text-sm"
                    value={locArea}
                    onChange={(e) => setLocArea(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">6-Digit PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 400053"
                    className="w-full mt-1.5 h-11 px-4 border border-gray-200 rounded-xl text-sm"
                    value={locPin}
                    onChange={(e) => setLocPin(e.target.value.replace(/[^\d]/g, ''))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assign Shop</label>
                  <select
                    className="w-full mt-1.5 h-11 px-3 border border-gray-200 rounded-xl text-sm"
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
                  className="w-full h-11 bg-[#0B1220] hover:bg-[#1a263e] text-white rounded-full font-bold transition-all mt-4 cursor-pointer"
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
              <div className="bg-white rounded-2xl p-6 border border-[#F1EAD8]">
                <p className="text-xs font-bold text-gray-400 uppercase">Platform GMV</p>
                <p className="text-2xl font-bold text-green-600 mt-2">₹{stats.gmv.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-400 mt-1">Delivered orders revenue</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#F1EAD8]">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalOrders}</p>
                <p className="text-[10px] text-gray-400 mt-1">Total placed platform orders</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#F1EAD8]">
                <p className="text-xs font-bold text-gray-400 uppercase">Active Orders</p>
                <p className="text-2xl font-bold text-amber-500 mt-2">{stats.activeOrders}</p>
                <p className="text-[10px] text-gray-400 mt-1">Orders in processing pipeline</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#F1EAD8]">
                <p className="text-xs font-bold text-gray-400 uppercase">Average Order Value (AOV)</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">₹{stats.aov.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-400 mt-1">Average spent per basket</p>
              </div>
            </div>

            {/* Merchant Rankings */}
            <section className="bg-white rounded-3xl p-6 border border-[#F1EAD8]">
              <h3 className="text-base font-bold text-[#0B1220] mb-4 flex items-center gap-2">📈 Merchant Sales Rankings</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3">Shop Partner</th>
                    <th className="pb-3 text-center">Orders Placed</th>
                    <th className="pb-3 text-right">Revenue (GMV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {stats.rankedShops.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-4 pr-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="py-4 pr-3 text-center text-gray-600">{item.count} orders</td>
                      <td className="py-4 text-right font-bold text-green-600">₹{item.total.toLocaleString('en-IN')}</td>
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
            <section className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#F1EAD8]">
              <h2 className="text-lg font-bold text-[#0B1220] mb-6 flex items-center gap-2">🎏 Promotional Festive Banners</h2>
              
              <div className="space-y-4">
                {banners.map((b) => (
                  <div key={b.id} className="flex gap-4 p-4 border border-[#F1EAD8] rounded-2xl items-center bg-gray-50/50">
                    <img src={b.image_url} alt={b.title} className="w-24 h-16 object-cover rounded-lg bg-gray-200 border" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800">{b.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">Deep Link: {b.action_link || 'None'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Column: Add Banner Form */}
            <section className="bg-white rounded-3xl p-6 border border-[#F1EAD8] h-max">
              <h3 className="text-base font-bold text-[#0B1220] mb-4 flex items-center gap-2">➕ Publish New Campaign</h3>
              
              <form onSubmit={handleAddBanner} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Banner Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Save 10% on Oils!"
                    className="w-full mt-1.5 h-11 px-4 border border-gray-200 rounded-xl text-sm"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Image URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    className="w-full mt-1.5 h-11 px-4 border border-gray-200 rounded-xl text-sm"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Action Deep Link</label>
                  <input
                    type="text"
                    placeholder="e.g. CategoryProducts?category=Oil"
                    className="w-full mt-1.5 h-11 px-4 border border-gray-200 rounded-xl text-sm"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-[#0B1220] hover:bg-[#1a263e] text-white rounded-full font-bold transition-all mt-4 cursor-pointer"
                >
                  Publish Campaign Banner
                </button>
              </form>
            </section>
          </div>
        )}

        {/* 5. FRANCHISE REQUESTS TAB */}
        {activeTab === 'franchise' && (
          <section className="bg-white rounded-3xl p-6 border border-[#F1EAD8] max-w-5xl">
            <h2 className="text-lg font-bold text-[#0B1220] mb-6 flex items-center gap-2">🤝 Franchise Partnership Requests</h2>
            
            <div className="space-y-4">
              {franchiseRequests.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No partnership leads received yet.</p>
              ) : (
                franchiseRequests.map((req) => (
                  <div key={req.id} className="p-5 border border-[#F1EAD8] rounded-2xl bg-gray-50/30 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-[#0B1220]">{req.name}</h4>
                        <p className="text-xs text-gray-500">📞 +91 {req.phone} | ✉️ {req.email || 'No email'}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                        {req.city} Hub request
                      </span>
                    </div>
                    {req.message && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-600">
                        {req.message}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 text-right">Received: {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* 6. BULK SKU LOADER TAB */}
        {activeTab === 'bulk-loader' && (
          <section className="bg-white rounded-3xl p-6 border border-[#F1EAD8] max-w-md">
            <div className="flex items-center gap-2.5 mb-6">
              <FileSpreadsheet className="w-5 h-5 text-[#0B1220]" />
              <h2 className="text-lg font-bold text-[#0B1220]">Bulk Inventory Loader</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700">1. Download Template Sheet</h3>
                <p className="text-xs text-gray-500">Download the layout template containing configuration keys and products schema.</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 border-2 border-dashed border-[#F1EAD8] hover:border-[#0B1220] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download template.xlsx
                </button>
              </div>

              <hr className="border-gray-100" />

              <form onSubmit={handleExcelUpload} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">2. Upload Spreadsheet</h3>
                <p className="text-xs text-gray-500">Select the updated spreadsheet file containing SKUs to upload.</p>
                
                <div className="relative border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 text-center cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">
                    {excelFile ? excelFile.name : 'Choose Excel File'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">supports .xlsx up to 5MB</p>
                </div>

                {excelError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                    {excelError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploadingExcel || !excelFile}
                  className={`w-full h-11 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    excelFile ? 'bg-[#0B1220] hover:bg-[#1a263e] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {uploadingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Bulk Import'}
                </button>
              </form>

              {excelReport && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> Bulk Import Finished
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-green-100">
                      <p className="text-gray-400">Processed</p>
                      <p className="text-base font-bold text-gray-800">{excelReport.rows_processed}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-green-100">
                      <p className="text-gray-400">Created</p>
                      <p className="text-base font-bold text-green-600">{excelReport.created}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-green-100">
                      <p className="text-gray-400">Updated</p>
                      <p className="text-base font-bold text-blue-600">{excelReport.updated}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
