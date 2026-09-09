'use client';

import React from 'react';
import { Package, Trash2, Plus, ImageIcon } from 'lucide-react';
import {
  PACK_UNIT_OPTIONS,
  packUnitPayloadFromInput,
  resolvePackUnitLabel,
} from '@/lib/packUnits';

export interface VariantItem {
  sku: string;
  quantityValue: string;
  quantityUnit: string;
  mrp: string;
  price: string;
}

export interface MasterCatalogTabProps {
  masterProductsList: any[];
  categoriesList: any[];
  getSubcategoriesForCategoryName: (catName: string) => any[];
  fetchData: () => void;
  openPackEditModal: (prod: any) => void;
  handleUpdateProductCategory: (id: string, cat: string) => void;
  handleUpdateProductSubcategory: (id: string, subcat: string) => void;
  handleDeleteProduct: (id: string) => void;
  newProdName: string;
  setNewProdName: (val: string) => void;
  newProdBrand: string;
  setNewProdBrand: (val: string) => void;
  newProdCompany: string;
  setNewProdCompany: (val: string) => void;
  newProdCategory: string;
  setNewProdCategory: (val: string) => void;
  newProdSubcategory: string;
  setNewProdSubcategory: (val: string) => void;
  newProdShortDescription: string;
  setNewProdShortDescription: (val: string) => void;
  newProdDescription: string;
  setNewProdDescription: (val: string) => void;
  newProdImageFile: File | null;
  setNewProdImageFile: (file: File | null) => void;
  newProdImagePreview: string;
  setNewProdImagePreview: (url: string) => void;
  newProdImageUploading: boolean;
  newProdVariants: VariantItem[];
  setNewProdVariants: React.Dispatch<React.SetStateAction<VariantItem[]>>;
  handleCreateProduct: (e: React.FormEvent) => void;
  packEditProduct: any | null;
  packEditQty: string;
  setPackEditQty: (val: string) => void;
  packEditUnit: string;
  setPackEditUnit: (val: string) => void;
  packEditSaving: boolean;
  setPackEditProduct: (p: any | null) => void;
  handleSavePackSize: () => void;
}

export const MasterCatalogTab: React.FC<MasterCatalogTabProps> = ({
  masterProductsList,
  categoriesList,
  getSubcategoriesForCategoryName,
  fetchData,
  openPackEditModal,
  handleUpdateProductCategory,
  handleUpdateProductSubcategory,
  handleDeleteProduct,
  newProdName,
  setNewProdName,
  newProdBrand,
  setNewProdBrand,
  newProdCompany,
  setNewProdCompany,
  newProdCategory,
  setNewProdCategory,
  newProdSubcategory,
  setNewProdSubcategory,
  newProdShortDescription,
  setNewProdShortDescription,
  newProdDescription,
  setNewProdDescription,
  newProdImageFile,
  setNewProdImageFile,
  newProdImagePreview,
  setNewProdImagePreview,
  newProdImageUploading,
  newProdVariants,
  setNewProdVariants,
  handleCreateProduct,
  packEditProduct,
  packEditQty,
  setPackEditQty,
  packEditUnit,
  setPackEditUnit,
  packEditSaving,
  setPackEditProduct,
  handleSavePackSize,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl">
        {/* Products Table (Span 3) */}
        <section className="xl:col-span-3 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl font-sans">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" /> Master Catalogue Products
            </h2>
            <button
              onClick={fetchData}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Product Info</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Pack Size</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">SKU</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Brand</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">MRP (Master)</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Category</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10">Subcategory</th>
                  <th className="pb-3 sticky top-0 bg-[#131c2e] border-b border-slate-800/85 z-10 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-sm">
                {masterProductsList.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-3">
                        {prod.image_url && (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-10 h-10 object-contain rounded-lg bg-white/5 border border-slate-800"
                          />
                        )}
                        <div>
                          <p className="font-bold text-white leading-tight">{prod.name}</p>
                          <p className="text-[10px] text-slate-500">{prod.brand || 'Unbranded'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-3">
                      <button
                        type="button"
                        onClick={() => openPackEditModal(prod)}
                        className="text-left group cursor-pointer"
                      >
                        <span className="font-semibold text-emerald-300 group-hover:text-emerald-200">
                          {resolvePackUnitLabel(prod) || '—'}
                        </span>
                        <span className="block text-[10px] text-slate-500 group-hover:text-slate-400">Edit pack</span>
                      </button>
                    </td>
                    <td className="py-4 pr-3 text-slate-300 font-semibold">{prod.sku}</td>
                    <td className="py-4 pr-3 text-slate-400">{prod.brand || '-'}</td>
                    <td className="py-4 pr-3 text-slate-200">₹{prod.mrp}</td>
                    <td className="py-4 pr-3">
                      <select
                        value={prod.primary_category || ''}
                        onChange={(e) => handleUpdateProductCategory(prod.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Unassigned --</option>
                        {categoriesList.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 pr-3">
                      <select
                        value={prod.secondary_category || ''}
                        onChange={(e) => handleUpdateProductSubcategory(prod.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[140px]"
                      >
                        <option value="">-- None --</option>
                        {getSubcategoriesForCategoryName(prod.primary_category || '').map((sub) => (
                          <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {masterProductsList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                      No products found in catalogue. Use Bulk Excel Loader or create one on the right.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create Product Panel */}
        <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white mb-6 font-sans">Add New Product</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name (Base Name) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fortune Soya Health Oil"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Fortune"
                  value={newProdBrand}
                  onChange={(e) => setNewProdBrand(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Company</label>
                <input
                  type="text"
                  placeholder="e.g. Adani Wilmar"
                  value={newProdCompany}
                  onChange={(e) => setNewProdCompany(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category Assignment *</label>
              <select
                required
                value={newProdCategory}
                onChange={(e) => {
                  setNewProdCategory(e.target.value);
                  setNewProdSubcategory('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- Choose Category --</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subcategory</label>
              <select
                value={newProdSubcategory}
                onChange={(e) => setNewProdSubcategory(e.target.value)}
                disabled={!newProdCategory}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Optional --</option>
                {getSubcategoriesForCategoryName(newProdCategory).map((sub) => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Short Description</label>
              <input
                type="text"
                placeholder="e.g. Chakki-fresh whole wheat, no maida"
                value={newProdShortDescription}
                onChange={(e) => setNewProdShortDescription(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Highlights (Semicolon-separated ;)</label>
              <textarea
                rows={3}
                placeholder="e.g. Stone ground Chakki fresh; 100% whole wheat with zero maida; Milled in small batches for softness"
                value={newProdDescription}
                onChange={(e) => setNewProdDescription(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Image</label>
              <div className="flex items-center gap-3">
                {newProdImagePreview ? (
                  <img src={newProdImagePreview} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 flex items-center justify-center flex-shrink-0 bg-slate-900">
                    <ImageIcon className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 hover:border-emerald-500 transition-colors text-center">
                    {newProdImageUploading ? '⏳ Uploading to bucket...' : newProdImageFile ? `✅ ${newProdImageFile.name}` : '📁 Click to choose image (PNG/JPG)'}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewProdImageFile(file);
                        setNewProdImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">Image will be shared across all configured pack unit variants below.</p>
            </div>

            {/* Variants Editor Block */}
            <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pack Unit Variants</h3>
                <button
                  type="button"
                  onClick={() => setNewProdVariants([...newProdVariants, { sku: '', quantityValue: '', quantityUnit: 'kg', mrp: '', price: '' }])}
                  className="text-xs font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  + Add Pack Size
                </button>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {newProdVariants.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 space-y-2 relative">
                    {newProdVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewProdVariants(newProdVariants.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          placeholder="e.g. 5"
                          value={item.quantityValue}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].quantityValue = e.target.value;
                            if (newProdName.trim() && !copy[idx].sku) {
                              const baseCode = newProdName.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
                              const unitCode = `${e.target.value}${copy[idx].quantityUnit}`.toUpperCase();
                              copy[idx].sku = `${baseCode}-${unitCode}`;
                            }
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1">Unit type</label>
                        <select
                          required
                          value={item.quantityUnit}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].quantityUnit = e.target.value;
                            if (newProdName.trim() && copy[idx].quantityValue) {
                              const baseCode = newProdName.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
                              const unitCode = `${copy[idx].quantityValue}${e.target.value}`.toUpperCase();
                              copy[idx].sku = `${baseCode}-${unitCode}`;
                            }
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {PACK_UNIT_OPTIONS.map((opt) => (
                            <option key={opt.code} value={opt.code}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1">Preview</label>
                        <div className="h-[30px] flex items-center px-2.5 rounded-lg bg-slate-900/60 border border-slate-850 text-xs text-emerald-300 font-semibold">
                          {item.quantityValue && item.quantityUnit
                            ? packUnitPayloadFromInput(item.quantityValue, item.quantityUnit).unit
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1">Variant SKU *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. FORT-SOYA-5L"
                          value={item.sku}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].sku = e.target.value;
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1">Master MRP (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 800.00"
                          value={item.mrp}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].mrp = e.target.value;
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1">Default Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 720.00"
                          value={item.price}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].price = e.target.value;
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={newProdImageUploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> Create Product & Variants
            </button>
          </form>
        </section>
      </div>

      {/* Pack Size Edit Modal */}
      {packEditProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Edit pack size</h3>
            <p className="text-xs text-slate-400 mb-4 truncate">{packEditProduct.name}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={packEditQty}
                  onChange={(e) => setPackEditQty(e.target.value)}
                  className="w-full mt-1 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Unit type</label>
                <select
                  value={packEditUnit}
                  onChange={(e) => setPackEditUnit(e.target.value)}
                  className="w-full mt-1 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {PACK_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-emerald-300 font-semibold mb-5">
              Customer will see: {packEditQty && packEditUnit ? packUnitPayloadFromInput(packEditQty, packEditUnit).unit : '—'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPackEditProduct(null)}
                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={packEditSaving}
                onClick={handleSavePackSize}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer"
              >
                {packEditSaving ? 'Saving…' : 'Save pack size'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
