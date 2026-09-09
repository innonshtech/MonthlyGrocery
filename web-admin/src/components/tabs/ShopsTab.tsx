'use client';

import React, { useState } from 'react';
import { Store, Trash2, X } from 'lucide-react';
import { Shop, AdminState, AdminDistrict } from '../../types/admin.types';
import { resolvePackUnitLabel } from '../../lib/packUnits';
import { apiFetch } from '../../utils/api';

interface ShopsTabProps {
  shops: Shop[];
  adminStates: AdminState[];
  adminDistricts: AdminDistrict[];
  regDistrictOptions: AdminDistrict[];
  regShopName: string;
  setRegShopName: (val: string) => void;
  regOwnerName: string;
  setRegOwnerName: (val: string) => void;
  regOwnerMobile: string;
  setRegOwnerMobile: (val: string) => void;
  regStateId: string;
  setRegStateId: (val: string) => void;
  regDistrictId: string;
  setRegDistrictId: (val: string) => void;
  regCity: string;
  setRegCity: (val: string) => void;
  handleRegisterShop: (e: React.FormEvent) => void;
  handleUpdateShopStatus: (shopId: string, status: 'approved' | 'rejected') => void;
  handleDeleteShop: (shopId: string, shopName: string) => void;
  fetchData: () => void;
  masterProductsList: any[];
  token: string | null;
}

export default function ShopsTab({
  shops,
  adminStates,
  adminDistricts,
  regDistrictOptions,
  regShopName,
  setRegShopName,
  regOwnerName,
  setRegOwnerName,
  regOwnerMobile,
  setRegOwnerMobile,
  regStateId,
  setRegStateId,
  regDistrictId,
  setRegDistrictId,
  regCity,
  setRegCity,
  handleRegisterShop,
  handleUpdateShopStatus,
  handleDeleteShop,
  fetchData,
  masterProductsList,
  token
}: ShopsTabProps) {
  // Shop Inventory Modal States
  const [selectedShopForInventory, setSelectedShopForInventory] = useState<Shop | null>(null);
  const [shopInventoryList, setShopInventoryList] = useState<any[]>([]);
  const [assignProdId, setAssignProdId] = useState('');
  const [assignProdPrice, setAssignProdPrice] = useState('');
  const [assignProdDiscount, setAssignProdDiscount] = useState('');
  const [assignProdStock, setAssignProdStock] = useState('');

  const fetchShopInventory = async (shopId: string) => {
    if (!token) return;
    try {
      const data = await apiFetch(`/admin/shop-inventory/${shopId}`);
      setShopInventoryList(data.shop_products || []);
    } catch (err: any) {
      console.error('Error fetching shop inventory:', err);
    }
  };

  const handleDirectAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedShopForInventory || !assignProdId || !assignProdPrice) {
      alert('Please select product and enter selling price');
      return;
    }
    try {
      const data = await apiFetch(`/admin/shop-inventory/${selectedShopForInventory.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: assignProdId,
          selling_price: parseFloat(assignProdPrice),
          discount_percentage: assignProdDiscount ? parseFloat(assignProdDiscount) : 0,
          stock: assignProdStock ? parseInt(assignProdStock) : 100
        })
      });
      if (data.success) {
        alert('Product assigned to shop successfully!');
        setAssignProdId('');
        setAssignProdPrice('');
        setAssignProdDiscount('');
        setAssignProdStock('');
        fetchShopInventory(selectedShopForInventory.id);
      } else {
        alert(data.error || 'Failed to assign product');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning product to shop');
    }
  };

  const handleUnassignShopProduct = async (invId: string) => {
    if (!confirm('Are you sure you want to remove this product from shop inventory?')) return;
    try {
      await apiFetch(`/admin/shop-inventory/${invId}`, {
        method: 'DELETE'
      });
      if (selectedShopForInventory) {
        fetchShopInventory(selectedShopForInventory.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error unassigning product');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
      {/* Left: Store Whitelisting table */}
      <section className="lg:col-span-7 xl:col-span-8 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" /> Store Registration Whitelisting
          </h2>
          <button onClick={fetchData} className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Store Name</th>
                <th className="pb-3">Territory</th>
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
                    {shop.state_name ? (
                      <>
                        <p className="text-slate-200 text-sm">{shop.state_name}</p>
                        <p className="text-xs text-slate-500">
                          {shop.district_name} · {shop.city || '—'}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-500 italic text-xs">Not assigned</span>
                    )}
                  </td>
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
                    {shop.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedShopForInventory(shop);
                          fetchShopInventory(shop.id);
                        }}
                        className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg transition-all cursor-pointer"
                      >
                        Manage Inventory
                      </button>
                    )}
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
                    <button
                      onClick={() => handleDeleteShop(shop.id, shop.shop_name)}
                      className="text-xs font-bold px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg transition-all cursor-pointer"
                      title="Delete store"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No stores registered yet. Use the form on the right to add a merchant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right: Register New Store form */}
      <section className="lg:col-span-5 xl:col-span-4 bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-max">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">➕ Register New Store</h3>

        <form onSubmit={handleRegisterShop} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Store / Shop Name</label>
            <input
              type="text"
              placeholder="e.g. Thorat Wholesalers"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={regShopName}
              onChange={(e) => setRegShopName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Full Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={regOwnerName}
              onChange={(e) => setRegOwnerName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">State</label>
            <select
              className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={regStateId}
              onChange={(e) => setRegStateId(e.target.value)}
            >
              <option value="">Select state...</option>
              {adminStates.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">District</label>
            <select
              className="w-full mt-1.5 h-11 px-3 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none disabled:opacity-50"
              value={regDistrictId}
              onChange={(e) => setRegDistrictId(e.target.value)}
              disabled={!regStateId}
            >
              <option value="">{regStateId ? 'Select district...' : 'Choose state first'}</option>
              {regDistrictOptions.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">City (type manually)</label>
            <input
              type="text"
              placeholder="e.g. Pimpri, Wakad, Ranchi City"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={regCity}
              onChange={(e) => setRegCity(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              You decide which city this merchant serves inside the selected district.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Owner Mobile Number</label>
            <input
              type="text"
              maxLength={10}
              placeholder="e.g. 9876543210"
              className="w-full mt-1.5 h-11 px-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-xl text-sm outline-none"
              value={regOwnerMobile}
              onChange={(e) => setRegOwnerMobile(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all mt-4 cursor-pointer"
          >
            Register Store
          </button>
        </form>
      </section>

      {/* Shop Inventory Management Modal */}
      {selectedShopForInventory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" /> Manage Store Inventory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign products from Master Catalogue to <strong className="text-emerald-400">{selectedShopForInventory.shop_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedShopForInventory(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Direct Assignment Form (Col 1) */}
              <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50 h-fit space-y-4">
                <h4 className="font-bold text-white text-sm mb-2">➕ Assign Product to Store</h4>
                <form onSubmit={handleDirectAssignProduct} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Product SKU *
                    </label>
                    <select
                      required
                      value={assignProdId}
                      onChange={(e) => setAssignProdId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Choose Product --</option>
                      {masterProductsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {resolvePackUnitLabel(p)} (MRP: ₹{p.mrp})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="165"
                      value={assignProdPrice}
                      onChange={(e) => setAssignProdPrice(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        value={assignProdDiscount}
                        onChange={(e) => setAssignProdDiscount(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        value={assignProdStock}
                        onChange={(e) => setAssignProdStock(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Assign SKU to Shop
                  </button>
                </form>
              </div>

              {/* Assigned Items List (Col 2-3) */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-white text-sm">Assigned Products ({shopInventoryList.length})</h4>
                <div className="overflow-x-auto border border-slate-800/80 rounded-2xl max-h-[480px] overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse bg-[#0c1220]/40 text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Product</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Master MRP</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Shop Price</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Stock</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10">Status</th>
                        <th className="p-3 sticky top-0 bg-[#0d1425] border-b border-slate-800/85 z-10 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {shopInventoryList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/10 text-slate-200">
                          <td className="p-3">
                            <p className="font-bold text-white">{item.product_name}</p>
                            <p className="text-[9px] text-slate-500">SKU: {item.sku}</p>
                          </td>
                          <td className="p-3 text-slate-400">₹{item.mrp}</td>
                          <td className="p-3 font-semibold text-emerald-400">₹{item.selling_price}</td>
                          <td className="p-3">{item.stock}</td>
                          <td className="p-3">
                            {item.status === 'approved' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/10 text-[9px]">
                                Approved
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/10 text-[9px]">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleUnassignShopProduct(item.id)}
                              className="text-red-400 hover:text-red-500 hover:bg-red-500/15 p-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {shopInventoryList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                            No products assigned to this shop yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
