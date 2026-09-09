'use client';

import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

export interface SkuRequestsTabProps {
  skuRequests: any[];
  fetchData: () => void;
  openSkuApproveModal: (req: any) => void;
  handleUpdateSkuRequestStatus: (id: string, status: 'approved' | 'rejected') => void;
  skuApproveRequest: any | null;
  skuApproveSaving: boolean;
  skuApproveImageFile: File | null;
  skuApproveImagePreview: string;
  setSkuApproveImageFile: (file: File | null) => void;
  setSkuApproveImagePreview: (url: string) => void;
  closeSkuApproveModal: () => void;
  handleConfirmSkuApprove: () => void;
}

export const SkuRequestsTab: React.FC<SkuRequestsTabProps> = ({
  skuRequests,
  fetchData,
  openSkuApproveModal,
  handleUpdateSkuRequestStatus,
  skuApproveRequest,
  skuApproveSaving,
  skuApproveImageFile,
  skuApproveImagePreview,
  setSkuApproveImageFile,
  setSkuApproveImagePreview,
  closeSkuApproveModal,
  handleConfirmSkuApprove,
}) => {
  return (
    <>
      <section className="bg-slate-900/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Merchant SKU Requests
          </h2>
          <button
            onClick={fetchData}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Upload a product PNG to approve. The SKU is added only to the requesting shop&apos;s inventory.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Merchant / Shop</th>
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Unit</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Brand</th>
                <th className="pb-3">MRP (Master)</th>
                <th className="pb-3">Highlights</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-sm">
              {skuRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 pr-3 font-semibold text-slate-200">{req.shop_name}</td>
                  <td className="py-4 pr-3 font-semibold text-white">{req.product_name}</td>
                  <td className="py-4 pr-3 text-slate-400">{req.unit || '—'}</td>
                  <td className="py-4 pr-3 text-slate-400">{req.category}</td>
                  <td className="py-4 pr-3 text-slate-400">{req.brand}</td>
                  <td className="py-4 pr-3 text-slate-300">₹{req.mrp}</td>
                  <td
                    className="py-4 pr-3 text-slate-400 max-w-[200px] truncate"
                    title={req.description || req.short_description || ''}
                  >
                    {req.description || req.short_description || '—'}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openSkuApproveModal(req)}
                      className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateSkuRequestStatus(req.id, 'rejected')}
                      className="text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-lg transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {skuRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                    No pending SKU requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sku Approve Modal */}
      {skuApproveRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Approve SKU request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Product will be added to <span className="text-emerald-300 font-semibold">{skuApproveRequest.shop_name}</span> only.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Product</span>
                <span className="text-white font-semibold text-right">{skuApproveRequest.product_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Category</span>
                <span className="text-slate-200 text-right">{skuApproveRequest.category}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Pack</span>
                <span className="text-slate-200 text-right">{skuApproveRequest.unit || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">MRP</span>
                <span className="text-slate-200 text-right">₹{skuApproveRequest.mrp}</span>
              </div>
            </div>

            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Product PNG *
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={skuApproveSaving}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSkuApproveImageFile(file);
                setSkuApproveImagePreview(file ? URL.createObjectURL(file) : '');
              }}
              className="w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:font-bold file:cursor-pointer mb-4"
            />

            {skuApproveImagePreview ? (
              <div className="w-28 h-28 rounded-xl border border-slate-800 bg-white/5 flex items-center justify-center overflow-hidden mb-5">
                <img src={skuApproveImagePreview} alt="Preview" className="w-full h-full object-contain p-1" />
              </div>
            ) : null}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeSkuApproveModal}
                disabled={skuApproveSaving}
                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={skuApproveSaving || !skuApproveImageFile}
                onClick={handleConfirmSkuApprove}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer"
              >
                {skuApproveSaving ? 'Uploading…' : 'Approve with PNG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
