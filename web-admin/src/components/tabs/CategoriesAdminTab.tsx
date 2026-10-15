'use client';

import React, { useState } from 'react';
import { Tag, Trash2, Plus, Pencil, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { resolveImageUrl } from '@/utils/api';

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
  handleUpdateCategoryName?: (id: string, name: string) => Promise<void>;
  handleReorderCategories?: (orderedIds: string[]) => Promise<void>;
  handleUpdateSubcategoryName?: (id: string, name: string) => Promise<void>;
  handleReorderSubcategories?: (orderedIds: string[]) => Promise<void>;
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
  handleUpdateCategoryName,
  handleReorderCategories,
  handleUpdateSubcategoryName,
  handleReorderSubcategories,
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
  // Inline edit state for Category
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categorySavingId, setCategorySavingId] = useState<string | null>(null);

  // Inline edit state for Subcategory
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('');
  const [subcategorySavingId, setSubcategorySavingId] = useState<string | null>(null);

  // Start editing category
  const startEditCategory = (cat: { id: string; name: string }) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const saveCategoryName = async (catId: string) => {
    const trimmed = editingCategoryName.trim();
    if (!trimmed) {
      alert('Category name cannot be empty');
      return;
    }
    if (!handleUpdateCategoryName) return;
    setCategorySavingId(catId);
    try {
      await handleUpdateCategoryName(catId, trimmed);
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } catch {
      // Error handled in parent
    } finally {
      setCategorySavingId(null);
    }
  };

  // Reorder Category
  const handleMoveCategory = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categoriesList.length) return;
    if (!handleReorderCategories) return;

    const list = [...categoriesList];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    const orderedIds = list.map((c) => c.id);
    handleReorderCategories(orderedIds);
  };

  // Start editing subcategory
  const startEditSubcategory = (sub: { id: string; name: string }) => {
    setEditingSubcategoryId(sub.id);
    setEditingSubcategoryName(sub.name);
  };

  const cancelEditSubcategory = () => {
    setEditingSubcategoryId(null);
    setEditingSubcategoryName('');
  };

  const saveSubcategoryName = async (subId: string) => {
    const trimmed = editingSubcategoryName.trim();
    if (!trimmed) {
      alert('Subcategory name cannot be empty');
      return;
    }
    if (!handleUpdateSubcategoryName) return;
    setSubcategorySavingId(subId);
    try {
      await handleUpdateSubcategoryName(subId, trimmed);
      setEditingSubcategoryId(null);
      setEditingSubcategoryName('');
    } catch {
      // Error handled in parent
    } finally {
      setSubcategorySavingId(null);
    }
  };

  // Reorder Subcategory
  const handleMoveSubcategory = (catSubs: any[], index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= catSubs.length) return;
    if (!handleReorderSubcategories) return;

    const list = [...catSubs];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    const orderedIds = list.map((s) => s.id);
    handleReorderSubcategories(orderedIds);
  };

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
          Primary category tiles appear on Home and Categories tab. Use the arrow buttons to reorder categories and subcategories, or the edit button to rename them.
        </p>
        <div className="space-y-4">
          {categoriesList.map((cat, catIndex) => {
            const catSubs = getSubcategoriesForCategory(cat.id);
            const expanded = expandedCategoryId === cat.id;
            return (
              <div key={cat.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/30 overflow-hidden">
                <div className="flex items-center gap-3 sm:gap-4 p-4">
                  {/* Reorder Buttons (Category) */}
                  <div className="flex flex-col border border-slate-700/80 rounded-xl overflow-hidden shrink-0 bg-slate-800/20">
                    <button
                      type="button"
                      title="Move category up"
                      disabled={catIndex === 0}
                      onClick={() => handleMoveCategory(catIndex, -1)}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-[1px] w-full bg-slate-700/50" />
                    <button
                      type="button"
                      title="Move category down"
                      disabled={catIndex === categoriesList.length - 1}
                      onClick={() => handleMoveCategory(catIndex, 1)}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Image */}
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {cat.image_url ? (
                      <img src={resolveImageUrl(cat.image_url)} alt={cat.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold uppercase">No PNG</span>
                    )}
                  </div>

                  {/* Category Name or Inline Edit */}
                  <div className="flex-1 min-w-0">
                    {editingCategoryId === cat.id ? (
                      <div className="flex items-center gap-1.5 max-w-sm mb-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCategoryName(cat.id);
                            if (e.key === 'Escape') cancelEditCategory();
                          }}
                          className="w-full bg-slate-950/80 border border-emerald-500 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                          autoFocus
                          placeholder="Category name"
                        />
                        <button
                          type="button"
                          onClick={() => saveCategoryName(cat.id)}
                          disabled={categorySavingId === cat.id}
                          className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer shrink-0"
                          title="Save category name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCategory}
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="font-bold text-white truncate text-base">{cat.name}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5">{catSubs.length} subcategories</div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Edit Name Button */}
                    <button
                      type="button"
                      onClick={() => (editingCategoryId === cat.id ? cancelEditCategory() : startEditCategory(cat))}
                      title="Edit Category Name"
                      className="text-xs font-bold px-2.5 py-2 rounded-xl border border-slate-700 text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

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
                      title="Delete category"
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
                        {catSubs.map((sub, subIdx) => (
                          <div key={sub.id} className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 sm:p-3">
                            {/* Reorder Buttons (Subcategory) */}
                            <div className="flex flex-col border border-slate-700/80 rounded-lg overflow-hidden shrink-0 bg-slate-800/20">
                              <button
                                type="button"
                                title="Move subcategory up"
                                disabled={subIdx === 0}
                                onClick={() => handleMoveSubcategory(catSubs, subIdx, -1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <div className="h-[1px] w-full bg-slate-700/50" />
                              <button
                                type="button"
                                title="Move subcategory down"
                                disabled={subIdx === catSubs.length - 1}
                                onClick={() => handleMoveSubcategory(catSubs, subIdx, 1)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Subcategory Icon */}
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {sub.image_url ? (
                                <img src={resolveImageUrl(sub.image_url)} alt={sub.name} className="w-full h-full object-contain p-0.5" />
                              ) : (
                                <span className="text-[9px] text-slate-500 font-bold">ICON</span>
                              )}
                            </div>

                            {/* Subcategory Name or Inline Edit */}
                            <div className="flex-1 min-w-0">
                              {editingSubcategoryId === sub.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingSubcategoryName}
                                    onChange={(e) => setEditingSubcategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveSubcategoryName(sub.id);
                                      if (e.key === 'Escape') cancelEditSubcategory();
                                    }}
                                    className="w-full bg-slate-950/80 border border-emerald-500 rounded-lg px-2 py-1 text-xs font-semibold text-white focus:outline-none"
                                    autoFocus
                                    placeholder="Subcategory name"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => saveSubcategoryName(sub.id)}
                                    disabled={subcategorySavingId === sub.id}
                                    className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer shrink-0"
                                    title="Save subcategory name"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditSubcategory}
                                    className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-sm font-semibold text-white truncate">{sub.name}</div>
                              )}
                            </div>

                            {/* Subcategory Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Edit Subcategory Button */}
                              <button
                                type="button"
                                onClick={() => (editingSubcategoryId === sub.id ? cancelEditSubcategory() : startEditSubcategory(sub))}
                                title="Edit Subcategory Name"
                                className="p-1.5 rounded-lg border border-slate-700 text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

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
                                title="Delete subcategory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
