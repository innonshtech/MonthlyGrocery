'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Trash2,
  Plus,
  ImageIcon,
  Edit3,
  X,
  CheckCircle,
  Loader2,
  Upload,
  Search,
  Layers,
  Sparkles,
  Tag,
  RefreshCw,
} from 'lucide-react';
import {
  PACK_UNIT_OPTIONS,
  packUnitPayloadFromInput,
  resolvePackUnitLabel,
} from '@/lib/packUnits';
import { apiFetch, API_BASE } from '@/utils/api';

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
  handleDeleteProduct: (id: string, name?: string) => void;
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
  token?: string | null;
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
  token,
}) => {
  const [catalogViewMode, setCatalogViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Master Product Edit Modal States
  const [editMasterProduct, setEditMasterProduct] = useState<any | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdBrand, setEditProdBrand] = useState('');
  const [editProdCompany, setEditProdCompany] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdSubcategory, setEditProdSubcategory] = useState('');
  const [editProdSku, setEditProdSku] = useState('');
  const [editProdMrp, setEditProdMrp] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdPackQty, setEditProdPackQty] = useState('');
  const [editProdPackUnit, setEditProdPackUnit] = useState('kg');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [editProdImageFile, setEditProdImageFile] = useState<File | null>(null);
  const [editProdImageUploading, setEditProdImageUploading] = useState(false);
  const [editProdShortDesc, setEditProdShortDesc] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdIsVeg, setEditProdIsVeg] = useState(true);
  const [editProdAvailable, setEditProdAvailable] = useState(true);
  const [editProdSaving, setEditProdSaving] = useState(false);

  // Sibling Pack Variants in Edit Modal
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [newVariantQty, setNewVariantQty] = useState('');
  const [newVariantUnit, setNewVariantUnit] = useState('kg');
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantMrp, setNewVariantMrp] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantSaving, setNewVariantSaving] = useState(false);

  // Helper to extract base product name for grouping pack variants
  const getProductBaseName = (nameStr: string): string => {
    return String(nameStr || '')
      .replace(/\s*\d+(\.\d+)?\s*(kg|g|l|ml|pcs|pack|units|dozen|ltr|gm|litre)\b.*/i, '')
      .trim();
  };

  // Group master catalogue products by brand + primary category + base product name
  const groupedMasterProducts = useMemo(() => {
    const map = new Map<string, {
      familyKey: string;
      baseName: string;
      brand: string;
      category: string;
      subcategory: string | null;
      image_url: string;
      variants: any[];
      primaryProduct: any;
    }>();

    for (const prod of masterProductsList) {
      const baseName = getProductBaseName(prod.name) || prod.name;
      const brand = String(prod.brand || '').trim();
      const category = String(prod.primary_category || '').trim();
      const key = `${brand.toLowerCase()}___${category.toLowerCase()}___${baseName.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          familyKey: key,
          baseName,
          brand: prod.brand || '',
          category: prod.primary_category || '',
          subcategory: prod.secondary_category || null,
          image_url: prod.image_url || '',
          variants: [prod],
          primaryProduct: prod,
        });
      } else {
        const entry = map.get(key)!;
        entry.variants.push(prod);
        if (!entry.image_url && prod.image_url) {
          entry.image_url = prod.image_url;
        }
      }
    }

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      variants: entry.variants.sort((a, b) => {
        const valA = parseFloat(a.quantity_value) || parseFloat(a.mrp) || 0;
        const valB = parseFloat(b.quantity_value) || parseFloat(b.mrp) || 0;
        return valA - valB;
      }),
    }));
  }, [masterProductsList]);

  // Filtered lists based on search and category filter
  const filteredGroupedProducts = useMemo(() => {
    return groupedMasterProducts.filter((group) => {
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        (group.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        group.baseName.toLowerCase().includes(q) ||
        group.brand.toLowerCase().includes(q) ||
        group.category.toLowerCase().includes(q) ||
        group.variants.some((v) => (v.sku || '').toLowerCase().includes(q) || (v.name || '').toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [groupedMasterProducts, searchQuery, selectedCategoryFilter]);

  const filteredFlatProducts = useMemo(() => {
    return masterProductsList.filter((prod) => {
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        (prod.primary_category || '').toLowerCase() === selectedCategoryFilter.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (prod.name || '').toLowerCase().includes(q) ||
        (prod.brand || '').toLowerCase().includes(q) ||
        (prod.sku || '').toLowerCase().includes(q) ||
        (prod.primary_category || '').toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [masterProductsList, searchQuery, selectedCategoryFilter]);

  // Quick statistics
  const stats = useMemo(() => {
    const totalFamilies = groupedMasterProducts.length;
    const totalSkus = masterProductsList.length;
    const inStock = masterProductsList.filter((p) => p.available !== false).length;
    const totalCategories = categoriesList.length;
    return { totalFamilies, totalSkus, inStock, totalCategories };
  }, [groupedMasterProducts, masterProductsList, categoriesList]);

  const uploadImage = async (file: File): Promise<string> => {
    const freshToken = token || (typeof window !== 'undefined' ? localStorage.getItem('@admin_token') : null);
    const formData = new FormData();
    formData.append('image', file);
    const uploadRes = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.image_url) {
      throw new Error(uploadData.error || 'Image upload failed');
    }
    return uploadData.image_url;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const openEditMasterProductModal = (prod: any) => {
    setEditMasterProduct(prod);
    setEditProdName(prod.name || '');
    setEditProdBrand(prod.brand || '');
    setEditProdCompany(prod.company || '');
    setEditProdCategory(prod.primary_category || '');
    setEditProdSubcategory(prod.secondary_category || '');
    setEditProdSku(prod.sku || '');
    setEditProdMrp(prod.mrp != null ? String(prod.mrp) : '');
    setEditProdPrice(prod.price != null ? String(prod.price) : '');
    setEditProdImageUrl(prod.image_url || '');
    setEditProdImageFile(null);
    setEditProdShortDesc(prod.short_description || '');
    setEditProdDesc(prod.description || '');
    setEditProdIsVeg(prod.is_veg !== false);
    setEditProdAvailable(prod.available !== false);

    const qty = prod.quantity_value != null ? String(prod.quantity_value) : '';
    const unitCode = prod.quantity_unit || 'kg';
    if (qty) {
      setEditProdPackQty(qty);
      setEditProdPackUnit(unitCode);
    } else {
      const label = resolvePackUnitLabel(prod);
      const match = label.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
      if (match) {
        setEditProdPackQty(match[1]);
        setEditProdPackUnit(match[2] === 'L' ? 'L' : match[2].toLowerCase());
      } else {
        setEditProdPackQty('1');
        setEditProdPackUnit('kg');
      }
    }
    setShowAddVariantForm(false);
  };

  const handleSaveMasterProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editMasterProduct) return;

    if (!editProdName.trim()) {
      alert('Product Name is required.');
      return;
    }

    const pack = packUnitPayloadFromInput(editProdPackQty, editProdPackUnit);

    setEditProdSaving(true);
    try {
      let finalImageUrl = editProdImageUrl.trim();
      if (editProdImageFile) {
        setEditProdImageUploading(true);
        finalImageUrl = await uploadImage(editProdImageFile);
        setEditProdImageUploading(false);
      }

      const payload: any = {
        name: editProdName.trim(),
        brand: editProdBrand.trim() || null,
        company: editProdCompany.trim() || null,
        primary_category: editProdCategory || null,
        secondary_category: editProdSubcategory || null,
        sku: editProdSku.trim() || null,
        mrp: editProdMrp ? parseFloat(editProdMrp) : 0,
        price: editProdPrice ? parseFloat(editProdPrice) : 0,
        image_url: finalImageUrl || null,
        short_description: editProdShortDesc.trim() || null,
        description: editProdDesc.trim() || null,
        is_veg: editProdIsVeg,
        available: editProdAvailable,
      };

      if (pack.unit) {
        payload.quantity_value = pack.quantity_value;
        payload.quantity_unit = pack.quantity_unit;
        payload.unit = pack.unit;
      }

      await apiFetch(`/products/master/${editMasterProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditMasterProduct(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update product details');
    } finally {
      setEditProdSaving(false);
    }
  };

  const handleCreateSiblingVariant = async () => {
    if (!editMasterProduct) return;
    if (!newVariantQty || !newVariantMrp || !newVariantPrice) {
      alert('Please enter quantity value, MRP, and selling price for the new pack variant.');
      return;
    }

    const pack = packUnitPayloadFromInput(newVariantQty, newVariantUnit);
    if (!pack.unit) {
      alert('Enter a valid quantity and unit type.');
      return;
    }

    const baseName = String(editProdName || editMasterProduct.name || '')
      .replace(/\s+\d+(?:\.\d+)?\s*(kg|g|ml|l|L|pcs|pack|dozen)\s*$/i, '')
      .trim();
    const variantName = `${baseName} ${pack.unit}`.trim();
    const brandPrefix = (editProdBrand.trim() || editMasterProduct.brand || baseName)
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const sku = newVariantSku.trim() || `${brandPrefix}-${newVariantQty}${newVariantUnit}`.toUpperCase();

    setNewVariantSaving(true);
    try {
      await apiFetch('/products/create', {
        method: 'POST',
        body: JSON.stringify({
          name: variantName,
          sku,
          brand: editProdBrand.trim() || editMasterProduct.brand || '',
          company: editProdCompany.trim() || editMasterProduct.company || '',
          primary_category: editProdCategory || editMasterProduct.primary_category || '',
          secondary_category: editProdSubcategory || editMasterProduct.secondary_category || null,
          description: editProdDesc.trim() || editMasterProduct.description || '',
          short_description: editProdShortDesc.trim() || editMasterProduct.short_description || '',
          image_url: editProdImageUrl.trim() || editMasterProduct.image_url || '',
          mrp: parseFloat(newVariantMrp),
          price: parseFloat(newVariantPrice),
          quantity_value: pack.quantity_value,
          quantity_unit: pack.quantity_unit,
          unit: pack.unit,
          is_veg: editProdIsVeg,
          available: true,
        }),
      });

      setNewVariantQty('');
      setNewVariantMrp('');
      setNewVariantPrice('');
      setNewVariantSku('');
      setShowAddVariantForm(false);
      fetchData();
      alert(`Pack variant "${variantName}" created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create pack variant');
    } finally {
      setNewVariantSaving(false);
    }
  };

  const handleDeleteVariantFromModal = async (variantId: string, variantLabel: string) => {
    if (!confirm(`Are you sure you want to delete pack variant "${variantLabel}"?`)) return;
    try {
      await apiFetch(`/products/master/${variantId}`, { method: 'DELETE' });
      setEditMasterProduct(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete pack variant');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. TOP METRIC STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Families</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalFamilies}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pack SKUs</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalSkus}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalCategories}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active & In-Stock</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.inStock}</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE GRID: CATALOG TABLE (SPAN 3) + CREATE FORM (SPAN 1) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* PRODUCTS TABLE SECTION (SPAN 3) */}
        <section className="xl:col-span-3 bg-slate-900/50 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Master Catalogue Inventory</h2>
                  <p className="text-xs text-slate-400">
                    {catalogViewMode === 'grouped'
                      ? `${filteredGroupedProducts.length} product families shown`
                      : `${filteredFlatProducts.length} individual SKUs shown`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions: View Toggle + Search + Filter + Refresh */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Segmented View Mode Toggle */}
              <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCatalogViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    catalogViewMode === 'grouped'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Grouped Families
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogViewMode('flat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    catalogViewMode === 'flat'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> All SKUs (Flat)
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer h-[34px]"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {/* Live Search Input */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalogue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 h-[34px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                title="Refresh master catalogue"
                className="w-[34px] h-[34px] rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10">Product Family & Brand</th>
                  <th className="pb-3 pr-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10">
                    {catalogViewMode === 'grouped' ? 'Pack Sizes & Pricing' : 'Pack Size'}
                  </th>
                  <th className="pb-3 pr-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10">SKU Code</th>
                  <th className="pb-3 pr-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10">MRP Range</th>
                  <th className="pb-3 pr-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10">Category</th>
                  <th className="pb-3 pr-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10">Subcategory</th>
                  <th className="pb-3 sticky top-0 bg-[#0d1424] border-b border-slate-800/90 z-10 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/40 text-sm">
                {catalogViewMode === 'grouped' ? (
                  filteredGroupedProducts.map((group) => {
                    const minMrp = Math.min(...group.variants.map((v) => parseFloat(v.mrp) || 0));
                    const maxMrp = Math.max(...group.variants.map((v) => parseFloat(v.mrp) || 0));
                    const mrpDisplay = minMrp === maxMrp ? `₹${minMrp}` : `₹${minMrp} - ₹${maxMrp}`;
                    const primary = group.primaryProduct;

                    return (
                      <tr key={group.familyKey} className="hover:bg-slate-800/30 transition-colors group">
                        {/* 1. Product Info */}
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            {group.image_url ? (
                              <img
                                src={group.image_url}
                                alt={group.baseName}
                                className="w-11 h-11 object-contain rounded-xl bg-white/5 border border-slate-800 p-1 shrink-0 group-hover:border-emerald-500/40 transition-colors"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => openEditMasterProductModal(primary)}
                                className="text-left cursor-pointer block"
                                title="Click to open full product editor"
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                                    {group.baseName}
                                  </p>
                                  {group.variants.length > 1 && (
                                    <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 shrink-0">
                                      {group.variants.length} sizes
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                  {group.brand || 'Unbranded'} {primary.company ? `• ${primary.company}` : ''}
                                </p>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 2. Pack Variants Pills */}
                        <td className="py-3.5 pr-3">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                            {group.variants.map((v) => {
                              const packLabel = resolvePackUnitLabel(v) || v.unit || 'Pack';
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => openEditMasterProductModal(v)}
                                  className="px-2.5 py-1 bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group/pill"
                                  title={`Click to edit ${packLabel} (SKU: ${v.sku} • ₹${v.mrp})`}
                                >
                                  <span>{packLabel}</span>
                                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1 py-0.5 rounded">
                                    ₹{v.price || v.mrp}
                                  </span>
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => {
                                openEditMasterProductModal(primary);
                                setShowAddVariantForm(true);
                              }}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500/40 rounded-lg text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="Add another pack size variant to this product"
                            >
                              <Plus className="w-3 h-3" /> Add Size
                            </button>
                          </div>
                        </td>

                        {/* 3. SKU */}
                        <td className="py-3.5 pr-3 text-slate-300 font-mono text-xs max-w-[120px] truncate">
                          {group.variants.map((v) => v.sku).filter(Boolean).join(', ') || '-'}
                        </td>

                        {/* 4. MRP Range */}
                        <td className="py-3.5 pr-3 text-slate-200 font-semibold text-xs whitespace-nowrap">
                          {mrpDisplay}
                        </td>

                        {/* 5. Category Dropdown */}
                        <td className="py-3.5 pr-3">
                          <select
                            value={primary.primary_category || ''}
                            onChange={(e) => {
                              group.variants.forEach((v) => handleUpdateProductCategory(v.id, e.target.value));
                            }}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[140px]"
                          >
                            <option value="">-- Unassigned --</option>
                            {categoriesList.map((cat) => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 6. Subcategory Dropdown */}
                        <td className="py-3.5 pr-3">
                          <select
                            value={primary.secondary_category || ''}
                            onChange={(e) => {
                              group.variants.forEach((v) => handleUpdateProductSubcategory(v.id, e.target.value));
                            }}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[140px]"
                          >
                            <option value="">-- None --</option>
                            {getSubcategoriesForCategoryName(primary.primary_category || '').map((sub) => (
                              <option key={sub.id} value={sub.name}>{sub.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 7. Action Buttons */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditMasterProductModal(primary)}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 p-2 rounded-xl transition-all cursor-pointer"
                              title="Edit Full Product & Sizes"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete all ${group.variants.length} pack variants of "${group.baseName}"?`)) {
                                  group.variants.forEach((v) => handleDeleteProduct(v.id, v.name));
                                }
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/15 p-2 rounded-xl transition-all cursor-pointer"
                              title="Delete all variants"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  filteredFlatProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-11 h-11 object-contain rounded-xl bg-white/5 border border-slate-800 p-1 shrink-0 group-hover:border-emerald-500/40 transition-colors"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditMasterProductModal(prod)}
                            className="text-left cursor-pointer block"
                            title="Click to edit full product details"
                          >
                            <p className="font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{prod.brand || 'Unbranded'}</p>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 pr-3">
                        <button
                          type="button"
                          onClick={() => openPackEditModal(prod)}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white transition-all cursor-pointer"
                        >
                          {resolvePackUnitLabel(prod) || '—'}
                        </button>
                      </td>

                      <td className="py-3.5 pr-3 text-slate-300 font-mono text-xs">{prod.sku || '-'}</td>
                      <td className="py-3.5 pr-3 text-slate-200 font-semibold text-xs">₹{prod.mrp}</td>

                      <td className="py-3.5 pr-3">
                        <select
                          value={prod.primary_category || ''}
                          onChange={(e) => handleUpdateProductCategory(prod.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[140px]"
                        >
                          <option value="">-- Unassigned --</option>
                          {categoriesList.map((cat) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 pr-3">
                        <select
                          value={prod.secondary_category || ''}
                          onChange={(e) => handleUpdateProductSubcategory(prod.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[140px]"
                        >
                          <option value="">-- None --</option>
                          {getSubcategoriesForCategoryName(prod.primary_category || '').map((sub) => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditMasterProductModal(prod)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 p-2 rounded-xl transition-all cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/15 p-2 rounded-xl transition-all cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {((catalogViewMode === 'grouped' && filteredGroupedProducts.length === 0) ||
                  (catalogViewMode === 'flat' && filteredFlatProducts.length === 0)) && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Package className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-semibold text-sm text-slate-300">No products match your criteria</p>
                        <p className="text-xs text-slate-500">Try adjusting your search keywords or category filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. CREATE PRODUCT PANEL (SPAN 1 - STICKY) */}
        <section className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl sticky top-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Add Master Product</h2>
              <p className="text-xs text-slate-400">Create new base product & pack variants</p>
            </div>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Product Base Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fortune Soya Health Oil"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Brand
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fortune"
                  value={newProdBrand}
                  onChange={(e) => setNewProdBrand(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adani Wilmar"
                  value={newProdCompany}
                  onChange={(e) => setNewProdCompany(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  required
                  value={newProdCategory}
                  onChange={(e) => {
                    setNewProdCategory(e.target.value);
                    setNewProdSubcategory('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Choose --</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Subcategory
                </label>
                <select
                  value={newProdSubcategory}
                  onChange={(e) => setNewProdSubcategory(e.target.value)}
                  disabled={!newProdCategory}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Optional --</option>
                  {getSubcategoriesForCategoryName(newProdCategory).map((sub) => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Product Image
              </label>
              <div className="flex items-center gap-3">
                {newProdImagePreview ? (
                  <img
                    src={newProdImagePreview}
                    alt="preview"
                    className="w-12 h-12 rounded-xl object-contain border border-slate-700 bg-white/5 p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-dashed border-slate-700 flex items-center justify-center shrink-0 bg-slate-950">
                    <ImageIcon className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 hover:border-emerald-500 transition-colors text-center truncate">
                    {newProdImageUploading ? '⏳ Uploading...' : newProdImageFile ? `✅ ${newProdImageFile.name}` : '📁 Choose Image'}
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
            </div>

            {/* Pack Size Variants Editor */}
            <div className="border-t border-slate-800/80 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Pack Size Variants</h3>
                <button
                  type="button"
                  onClick={() =>
                    setNewProdVariants([
                      ...newProdVariants,
                      { sku: '', quantityValue: '', quantityUnit: 'kg', mrp: '', price: '' },
                    ])
                  }
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  + Add Size
                </button>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {newProdVariants.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/70 space-y-2 relative">
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
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Qty</label>
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Unit</label>
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {PACK_UNIT_OPTIONS.map((opt) => (
                            <option key={opt.code} value={opt.code}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Preview</label>
                        <div className="h-[26px] flex items-center px-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-bold truncate">
                          {item.quantityValue && item.quantityUnit
                            ? packUnitPayloadFromInput(item.quantityValue, item.quantityUnit).unit
                            : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">MRP (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 800"
                          value={item.mrp}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].mrp = e.target.value;
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 720"
                          value={item.price}
                          onChange={(e) => {
                            const copy = [...newProdVariants];
                            copy[idx].price = e.target.value;
                            setNewProdVariants(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Variant SKU Code (e.g. FORT-5L)"
                        value={item.sku}
                        onChange={(e) => {
                          const copy = [...newProdVariants];
                          copy[idx].sku = e.target.value;
                          setNewProdVariants(copy);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={newProdImageUploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Save Product & Variants
            </button>
          </form>
        </section>
      </div>

      {/* QUICK PACK SIZE EDIT MODAL */}
      {packEditProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Pack Size</h3>
              <button
                type="button"
                onClick={() => setPackEditProduct(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 truncate">{packEditProduct.name}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={packEditQty}
                  onChange={(e) => setPackEditQty(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Unit type</label>
                <select
                  value={packEditUnit}
                  onChange={(e) => setPackEditUnit(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {PACK_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400">Customer will see:</p>
              <p className="text-sm text-emerald-300 font-bold mt-0.5">
                {packEditQty && packEditUnit ? packUnitPayloadFromInput(packEditQty, packEditUnit).unit : '—'}
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPackEditProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={packEditSaving}
                onClick={handleSavePackSize}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-950"
              >
                {packEditSaving ? 'Saving…' : 'Save Pack Size'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER PRODUCT FULL EDIT MODAL */}
      {editMasterProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#0c1220] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Edit Master Product</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    SKU: <span className="font-mono text-emerald-400">{editMasterProduct.sku || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditMasterProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form id="editMasterProdForm" onSubmit={handleSaveMasterProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* 1. Basic Info */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  placeholder="e.g. Aashirvaad Select Sharbati Atta"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={editProdBrand}
                    onChange={(e) => setEditProdBrand(e.target.value)}
                    placeholder="e.g. Aashirvaad"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company</label>
                  <input
                    type="text"
                    value={editProdCompany}
                    onChange={(e) => setEditProdCompany(e.target.value)}
                    placeholder="e.g. ITC Limited"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 2. Category & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
                  <select
                    required
                    value={editProdCategory}
                    onChange={(e) => {
                      setEditProdCategory(e.target.value);
                      setEditProdSubcategory('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Category --</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subcategory</label>
                  <select
                    value={editProdSubcategory}
                    onChange={(e) => setEditProdSubcategory(e.target.value)}
                    disabled={!editProdCategory}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Optional --</option>
                    {getSubcategoriesForCategoryName(editProdCategory).map((sub) => (
                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Pack Size & Pricing */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pack Size & Pricing for this SKU</h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    {editProdPackQty && editProdPackUnit ? packUnitPayloadFromInput(editProdPackQty, editProdPackUnit).unit : '—'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editProdPackQty}
                      onChange={(e) => setEditProdPackQty(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Unit</label>
                    <select
                      value={editProdPackUnit}
                      onChange={(e) => setEditProdPackUnit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {PACK_UNIT_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Master MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProdMrp}
                      onChange={(e) => setEditProdMrp(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editProdPrice}
                      onChange={(e) => setEditProdPrice(e.target.value)}
                      placeholder="e.g. 399"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Sibling Variants List */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      All Pack Sizes in this Family:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddVariantForm(!showAddVariantForm)}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {showAddVariantForm ? '✕ Close' : '+ Add New Size'}
                    </button>
                  </div>

                  {(() => {
                    const baseName = getProductBaseName(editMasterProduct.name || '');
                    const brand = (editMasterProduct.brand || '').toLowerCase();
                    const siblings = masterProductsList.filter(
                      (p) =>
                        (p.brand || '').toLowerCase() === brand &&
                        getProductBaseName(p.name).toLowerCase() === baseName.toLowerCase()
                    );

                    return (
                      <div className="flex flex-wrap gap-2">
                        {siblings.map((sib) => {
                          const isCurrent = sib.id === editMasterProduct.id;
                          const packLabel = resolvePackUnitLabel(sib) || sib.unit || 'Pack';
                          return (
                            <button
                              key={sib.id}
                              type="button"
                              onClick={() => !isCurrent && openEditMasterProductModal(sib)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                              title={isCurrent ? 'Currently editing' : 'Click to edit this pack variant'}
                            >
                              <span>{packLabel}</span>
                              <span className="text-[10px] text-slate-400">₹{sib.price || sib.mrp}</span>
                              {isCurrent && <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-bold">Active</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Inline Form to Add Sibling Variant */}
                  {showAddVariantForm && (
                    <div className="mt-3 p-3.5 bg-slate-900/90 rounded-xl border border-emerald-500/30 space-y-3">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Create New Pack Size for this Product
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Quantity *</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="e.g. 10"
                            value={newVariantQty}
                            onChange={(e) => {
                              setNewVariantQty(e.target.value);
                              if (!newVariantSku) {
                                const base = (editProdBrand || editProdName).slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setNewVariantSku(`${base}-${e.target.value}${newVariantUnit}`.toUpperCase());
                              }
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Unit *</label>
                          <select
                            value={newVariantUnit}
                            onChange={(e) => {
                              setNewVariantUnit(e.target.value);
                              if (newVariantQty) {
                                const base = (editProdBrand || editProdName).slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setNewVariantSku(`${base}-${newVariantQty}${e.target.value}`.toUpperCase());
                              }
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-emerald-500 cursor-pointer outline-none"
                          >
                            {PACK_UNIT_OPTIONS.map((opt) => (
                              <option key={opt.code} value={opt.code}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">MRP (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 850"
                            value={newVariantMrp}
                            onChange={(e) => setNewVariantMrp(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 760"
                            value={newVariantPrice}
                            onChange={(e) => setNewVariantPrice(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          placeholder="Optional Custom SKU (Auto-generated if empty)"
                          value={newVariantSku}
                          onChange={(e) => setNewVariantSku(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:border-emerald-500 outline-none"
                        />
                        <button
                          type="button"
                          disabled={newVariantSaving}
                          onClick={handleCreateSiblingVariant}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold disabled:opacity-60 transition-colors cursor-pointer shrink-0"
                        >
                          {newVariantSaving ? 'Adding…' : 'Add Pack Size'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Image URL & Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Product Image (PNG / Transparent)
                </label>
                <div className="flex gap-3 items-center">
                  {editProdImageUrl ? (
                    <img
                      src={editProdImageUrl}
                      alt="Preview"
                      className="w-14 h-14 object-contain rounded-xl bg-white/5 border border-slate-800 p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={editProdImageUrl}
                      onChange={(e) => setEditProdImageUrl(e.target.value)}
                      placeholder="Image URL: https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{editProdImageFile ? `✅ ${editProdImageFile.name}` : 'Upload New PNG/JPG'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditProdImageFile(file);
                            const reader = new FileReader();
                            reader.onload = () => setEditProdImageUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 5. Short Description & Highlights */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={editProdShortDesc}
                  onChange={(e) => setEditProdShortDesc(e.target.value)}
                  placeholder="e.g. 100% whole Sharbati wheat, stone-ground"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Detailed Description / Highlights</label>
                <textarea
                  rows={3}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  placeholder="e.g. • 100% whole Sharbati wheat&#10;• High in fibre & natural protein&#10;• Chakki-fresh, no maida"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* 6. Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editProdIsVeg}
                    onChange={(e) => setEditProdIsVeg(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-300">🌱 Vegetarian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editProdAvailable}
                    onChange={(e) => setEditProdAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-300">🟢 Is Live & Available</span>
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
              <div>
                {editMasterProduct && (
                  <button
                    type="button"
                    disabled={editProdSaving || editProdImageUploading}
                    onClick={() =>
                      handleDeleteVariantFromModal(
                        editMasterProduct.id,
                        `${editMasterProduct.name || 'Product'} (${resolvePackUnitLabel(editMasterProduct) || editMasterProduct.unit || 'Pack'})`
                      )
                    }
                    className="px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete this size variant
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditMasterProduct(null)}
                  disabled={editProdSaving || editProdImageUploading}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="editMasterProdForm"
                  disabled={editProdSaving || editProdImageUploading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold disabled:opacity-60 transition-all cursor-pointer shadow-lg shadow-emerald-950 flex items-center gap-2"
                >
                  {editProdSaving || editProdImageUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{editProdImageUploading ? 'Uploading Image...' : 'Saving Changes...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
