'use client';

import React from 'react';
import { Tag, Trash2, Plus } from 'lucide-react';

export interface CategoriesAdminTabProps {
  categoriesList: any[];
  fetchData: () => void;
  expandedCategoryId: string | null;
  setExpandedCategoryId: (id: string | null) => void;
  getSubcategoriesForCategory: (catId: string) => any[];
  categoryImageUploadingId: string | null;
  subcategoryImageUploadingId: string | null;
  handleCategoryImageChange: (catId: string, file: File) => void;
  handleSubcategoryImageChange: (subId: string, file: File) => void;
  handleDeleteCategory: (id: string) => void;
  handleDeleteSubcategory: (id: string) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  newCategoryImageUploading: boolean;
  setNewCategoryImageFile: (file: File | null) => void;
  handleCreateCategory: (e: React.FormEvent) => void;
  newSubcategoryCategoryId: string;
  setNewSubcategoryCategoryId: (id: string) => void;
  newSubcategoryName: string;
  setNewSubcategoryName: (name: string) => void;
  setNewSubcategoryImageFile: (file: File | null) => void;
  newSubcategorySaving: boolean;
  handleCreateSubcategory: (e: React.FormEvent) => void;
}

export const CategoriesAdminTab: React.FC<CategoriesAdminTabProps> = ({
  categoriesList,
  fetchData,
  expandedCategoryId,
  setExpandedCategoryId,
  getSubcategoriesForCategory,
  categoryImageUploadingId,
  subcategoryImageUploadingId,
  handleCategoryImageChange,
  handleSubcategoryImageChange,
  handleDeleteCategory,
  handleDeleteSubcategory,
  newCategoryName,
  setNewCategoryName,
  newCategoryImageUploading,
  setNewCategoryImageFile,
  handleCreateCategory,
  newSubcategoryCategoryId,
  setNewSubcategoryCategoryId,
  newSubcategoryName,
  setNewSubcategoryName,
  setNewSubcategoryImageFile,
  newSubcategorySaving,
  handleCreateSubcategory,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
      <section className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" /> Platform Categories & Subcategories
          </h2>
          <button
            onClick={fetchData}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Primary category tiles appear on Home and Categories tab. Subcategories power the left sidebar when customers browse a category.
        </p>
        <div className="space-y-4">
          {categoriesList.map((cat) => {
            const catSubs = getSubcategoriesForCategory(cat.id);
            const expanded = expandedCategoryId === cat.id;
            return (
              <div key={cat.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/30 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold uppercase">No PNG</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white">{cat.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{catSubs.length} subcategories</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCategoryId(expanded ? null : cat.id)}
                      className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
                    >
                      {expanded ? 'Hide' : 'Manage'}
                    </button>
                    <label
                      className={`text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer ${
                        categoryImageUploadingId === cat.id ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {categoryImageUploadingId === cat.id ? 'Uploading…' : 'PNG'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCategoryImageChange(cat.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-800/80 bg-slate-900/40 p-4">
                    {catSubs.length === 0 ? (
                      <p className="text-sm text-slate-500 italic mb-3">No subcategories yet. Add one using the form on the right.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {catSubs.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {sub.image_url ? (
                                <img src={sub.image_url} alt={sub.name} className="w-full h-full object-contain p-0.5" />
                              ) : (
                                <span className="text-[9px] text-slate-500 font-bold">ICON</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{sub.name}</div>
                            </div>
                            <label
                              className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-700 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer ${
                                subcategoryImageUploadingId === sub.id ? 'opacity-60 pointer-events-none' : ''
                              }`}
                            >
                              {subcategoryImageUploadingId === sub.id ? '…' : 'PNG'}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleSubcategoryImageChange(sub.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              onClick={() => handleDeleteSubcategory(sub.id)}
                              className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewSubcategoryCategoryId(cat.id)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      + Add subcategory to {cat.name}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {categoriesList.length === 0 && (
            <p className="py-6 text-center text-slate-500 italic">No categories found in database.</p>
          )}
        </div>
      </section>

      <div className="space-y-6">
        <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white mb-2">Create New Category</h2>
          <p className="text-sm text-slate-500 mb-6">Optional tile PNG — same flow as master catalog image upload.</p>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dry Fruits, Gourmet Oils"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tile PNG (optional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setNewCategoryImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:font-bold file:cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={newCategoryImageUploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {newCategoryImageUploading ? 'Uploading…' : 'Add Category'}
            </button>
          </form>
        </section>

        <section className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white mb-2">Add Subcategory</h2>
          <p className="text-sm text-slate-500 mb-6">
            Shown in the customer app left sidebar when browsing that category.
          </p>
          <form onSubmit={handleCreateSubcategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parent Category *</label>
              <select
                required
                value={newSubcategoryCategoryId}
                onChange={(e) => setNewSubcategoryCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- Choose Category --</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subcategory Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Atta, Rice, Mustard Oil"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sidebar Icon PNG (optional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setNewSubcategoryImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:font-bold file:cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={newSubcategorySaving}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {newSubcategorySaving ? 'Saving…' : 'Add Subcategory'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
