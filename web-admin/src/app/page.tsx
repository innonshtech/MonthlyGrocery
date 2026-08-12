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
  AlertTriangle
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [error, setError] = useState('');
  
  // Excel states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelReport, setExcelReport] = useState<any>(null);
  const [excelError, setExcelError] = useState('');

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

  // 2. Fetch shops once token is available
  const fetchShops = async () => {
    if (!token) return;
    setLoadingShops(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8001/api/shops/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch shops');
      }
      setShops(data.shops);
    } catch (err: any) {
      setError(err.message || 'Failed to load shops catalog');
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShops();
    }
  }, [token]);

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
        throw new Error(data.error || 'Failed to update shop status');
      }
      fetchShops(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleDownloadTemplate = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8001/api/products/excel-template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monthlygrocery-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Could not download Excel template.');
    }
  };

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

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#FFF8ED] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#0B1220] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8ED] text-gray-800">
      {/* Top Navigation */}
      <header className="bg-white border-b border-[#F1EAD8] sticky top-0 z-30 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0B1220] rounded-xl text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B1220]">MonthlyGrocery</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase">Super Admin Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#0B1220]">{user.name}</p>
            <p className="text-xs text-gray-500">{user.mobile}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Merchant Approvals Whitelist */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#F1EAD8]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-[#0B1220]" />
                <h2 className="text-lg font-bold text-[#0B1220]">Store Registration & Whitelisting</h2>
              </div>
              <button
                onClick={fetchShops}
                className="text-xs font-semibold text-[#0B1220] bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {loadingShops ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#0B1220] animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 font-medium">{error}</div>
            ) : shops.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-medium">No store registrations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3">Store Name</th>
                      <th className="pb-3">Owner Info</th>
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
                          <p className="text-xs text-gray-400">{shop.profiles?.phone}</p>
                        </td>
                        <td className="py-4 pr-3">
                          {shop.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                          {shop.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                          {shop.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                              <Clock className="w-3.5 h-3.5" /> Pending
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
            )}
          </div>
        </section>

        {/* Right Col: Excel Catalog Loader */}
        <section className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#F1EAD8]">
            <div className="flex items-center gap-2.5 mb-6">
              <FileSpreadsheet className="w-5 h-5 text-[#0B1220]" />
              <h2 className="text-lg font-bold text-[#0B1220]">Bulk Inventory Loader</h2>
            </div>

            <div className="space-y-6">
              {/* Step 1: Download Template */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700">1. Download Excel Template</h3>
                <p className="text-xs text-gray-500">Download the standard layout sheet containing standard column codes and sample grocery mock data.</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 border-2 border-dashed border-[#F1EAD8] hover:border-[#0B1220] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>

              <hr className="border-gray-100" />

              {/* Step 2: Upload Excel */}
              <form onSubmit={handleExcelUpload} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">2. Upload Spreadsheet</h3>
                <p className="text-xs text-gray-500">Select the compiled xlsx file with updated products and prices to load to the database.</p>
                
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

              {/* Import Results Report */}
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

                  {excelReport.errors && excelReport.errors.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Errors encountered in rows:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-red-100 text-[11px]">
                        {excelReport.errors.map((err: any, i: number) => (
                          <div key={i} className="text-red-600">
                            <strong>Row {err.row}:</strong> {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
