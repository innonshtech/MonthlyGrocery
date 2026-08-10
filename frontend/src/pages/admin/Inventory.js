import { useEffect, useRef, useState } from "react";
import { Plus, Edit3, Trash2, Sparkles, Loader2, X, Image as ImageIcon, Upload, Video as VideoIcon, MapPin, FileSpreadsheet, Download, FileUp, Lock, ShieldAlert, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const EMPTY = {
  name:"", sku:"", primary_category:"Atta & Rice", secondary_category:"", brand:"", company:"", place:"",
  description:"", short_description:"",
  image_url:"", images:[], video_url:"",
  gst:5, stock:0, unit:"1 Kg", quantity_value: 0, quantity_unit: "",
  is_veg:true, featured:false, todays_deal:false, best_seller:false, available:true,
  search_keywords:[],
  city_prices: {}, // { "Mumbai": { mrp, wholesaler_price, price, is_live } }
};

const PRIMARY_CATEGORIES = [
  "Atta & Rice", "Pulses & Grains", "Cooking Essentials", "Dairy Staples",
  "Snacks", "Beverages", "Household", "Personal Care", "Instant Food",
];

const SECONDARY_SUGGEST = {
  "Atta & Rice": ["Atta", "Basmati Rice", "Regular Rice", "Suji & Maida"],
  "Pulses & Grains": ["Dal", "Rajma & Chole", "Millets"],
  "Cooking Essentials": ["Oil", "Ghee", "Salt & Sugar", "Spices", "Masalas"],
  "Dairy Staples": ["Ghee", "Butter", "Milk Powder", "Paneer"],
  "Snacks": ["Namkeen", "Biscuits", "Chocolates"],
  "Beverages": ["Tea", "Coffee", "Juices", "Health Drinks"],
  "Household": ["Detergent", "Dishwash", "Floor Cleaner", "Toilet Cleaner"],
  "Personal Care": ["Soap", "Shampoo", "Toothpaste", "Hair Oil"],
  "Instant Food": ["Noodles", "Pasta", "Ready-to-Eat"],
};

const UNITS = ["1 Kg","2 Kg","5 Kg","10 Kg","500 gm","250 gm","1 Litre","2 Litre","5 Litre","500 ml","Packet","Bottle","Piece","Dozen"];

const DEFAULT_CITIES = ["Mumbai", "Pune", "Bengaluru", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];

export default function AdminInventory() {
  const { user } = useAuth();
  const isPending = user?.status === "pending";

  const [products, setProducts] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [q, setQ] = useState("");
  const [photoInput, setPhotoInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Bulk-select state
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [visibility, setVisibility] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const photoFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const excelFileRef = useRef(null);

  const load = () => api.get("/products/mine").then(r=>setProducts(r.data.products||[])).catch(()=>setProducts([]));
  const loadVisibility = () => api.get("/products/mine/visibility").then(r=>setVisibility(r.data)).catch(()=>setVisibility(null));

  const publishAll = async () => {
    if (!window.confirm("Publish every SKU to the consumer shop? This flips 'available' to true for hidden SKUs, unpauses every city, and backfills missing legacy prices from the first live city.")) return;
    setPublishing(true);
    try {
      const { data } = await api.post("/products/mine/publish-all");
      toast.success(`Published · ${data.made_available} unhidden · ${data.unpaused_cities} cities unpaused · ${data.backfilled_prices} prices filled`);
      await load();
      await loadVisibility();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Publish failed");
    } finally { setPublishing(false); }
  };
  useEffect(()=>{ if (!isPending) load(); else setProducts([]); }, [isPending]);
  useEffect(()=>{ if (!isPending) loadVisibility(); }, [isPending]);

  const openNew = () => {
    setEditing(null);
    setForm({...EMPTY, images:[], search_keywords:[], city_prices: {"Mumbai": {mrp:0, wholesaler_price:0, price:0, is_live:true}}});
    setPhotoInput(""); setKeywordInput(""); setOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...EMPTY, ...p,
      images: Array.isArray(p.images) ? p.images : [],
      search_keywords: Array.isArray(p.search_keywords) ? p.search_keywords : [],
      city_prices: p.city_prices && Object.keys(p.city_prices).length > 0
        ? p.city_prices
        : {"Mumbai": {mrp: p.mrp||0, wholesaler_price: p.wholesaler_price||0, price: p.price||0, is_live: true}},
    });
    setPhotoInput(""); setKeywordInput(""); setOpen(true);
  };

  const upd = (k) => (e) => setForm({...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value});

  // ---------- City pricing manipulation ----------
  const setCityField = (cityName, field, value) => {
    setForm(prev => ({
      ...prev,
      city_prices: {
        ...prev.city_prices,
        [cityName]: { ...(prev.city_prices[cityName] || {}), [field]: value }
      }
    }));
  };

  const addCity = (cityName) => {
    const c = (cityName || "").trim();
    if (!c) return;
    if (form.city_prices[c]) { toast.error(`${c} already added`); return; }
    setForm(prev => ({
      ...prev,
      city_prices: {...prev.city_prices, [c]: {mrp:0, wholesaler_price:0, price:0, is_live:true}}
    }));
  };

  const removeCity = (cityName) => {
    const {[cityName]: _removed, ...rest} = form.city_prices;
    setForm({...form, city_prices: rest});
  };

  const cityDiscount = (c) => {
    const cp = form.city_prices[c] || {};
    const mrp = Number(cp.mrp||0), price = Number(cp.price||0);
    if (mrp > 0 && price > 0 && mrp > price) return Math.round((1 - price/mrp) * 100);
    return 0;
  };
  const cityMargin = (c) => {
    const cp = form.city_prices[c] || {};
    const purchase = Number(cp.wholesaler_price||0), price = Number(cp.price||0);
    if (purchase > 0 && price > 0) return Math.round(((price - purchase)/price) * 100);
    return 0;
  };

  const addPhoto = () => {
    const url = photoInput.trim();
    if (!url) return;
    setForm({...form, images: [...(form.images||[]), url], image_url: form.image_url || url});
    setPhotoInput("");
  };
  const removePhoto = (i) => {
    const next = [...form.images];
    next.splice(i, 1);
    setForm({...form, images: next, image_url: next[0] || ""});
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (!form.search_keywords.includes(kw)) setForm({...form, search_keywords: [...form.search_keywords, kw]});
    setKeywordInput("");
  };
  const removeKeyword = (kw) => setForm({...form, search_keywords: form.search_keywords.filter(k=>k!==kw)});

  const uploadFile = async (file, type) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(type === "video" ? "/upload/video" : "/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" }});
      return data.url;
    } finally { setUploading(false); }
  };

  const onPhotoFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      for (const f of files) {
        const url = await uploadFile(f, "image");
        setForm(prev => ({...prev, images: [...(prev.images||[]), url], image_url: prev.image_url || url}));
      }
      toast.success(`${files.length} photo${files.length>1?"s":""} uploaded`);
    } catch (e) { toast.error(e.response?.data?.detail || "Upload failed"); }
    finally { if (photoFileRef.current) photoFileRef.current.value = ""; }
  };

  const onVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "video");
      setForm(prev => ({...prev, video_url: url}));
      toast.success("Video uploaded");
    } catch (e) { toast.error(e.response?.data?.detail || "Upload failed"); }
    finally { if (videoFileRef.current) videoFileRef.current.value = ""; }
  };

  const save = async () => {
    if (!form.name) { toast.error("SKU name is required"); return; }
    const cities = Object.keys(form.city_prices || {});
    if (cities.length === 0) { toast.error("Add at least one city with pricing"); return; }
    const liveCities = cities.filter(c => form.city_prices[c].is_live && form.city_prices[c].price > 0);
    if (liveCities.length === 0) { toast.error("Add a Selling Price and toggle 'Live' for at least one city"); return; }

    setSaving(true);
    try {
      // Sanitize city_prices as pure numbers/bools
      const cp = {};
      for (const c of cities) {
        const e = form.city_prices[c] || {};
        cp[c] = {
          mrp: Number(e.mrp || 0),
          wholesaler_price: Number(e.wholesaler_price || 0),
          price: Number(e.price || 0),
          is_live: !!e.is_live,
        };
      }
      // Use first live city's pricing as the legacy default (for compat)
      const anchor = cp[liveCities[0]];
      const payload = {
        ...form,
        city_prices: cp,
        mrp: anchor.mrp,
        wholesaler_price: anchor.wholesaler_price,
        price: anchor.price,
        stock: Number(form.stock || 0),
        gst: Number(form.gst || 5),
        quantity_value: Number(form.quantity_value || 0),
        image_url: form.image_url || form.images?.[0] || "",
        images: form.images || [],
        search_keywords: form.search_keywords || [],
      };
      if (editing) {
        await api.put(`/products/mine/${editing.id}`, payload);
        toast.success("SKU updated");
      } else {
        await api.post("/products/mine", payload);
        toast.success("SKU added");
      }
      setOpen(false); load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try { await api.delete(`/products/mine/${p.id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Delete failed"); }
  };

  // ---------- Bulk selection & delete ----------
  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const { data } = await api.post("/products/mine/bulk-delete", { ids: Array.from(selectedIds) });
      toast.success(`${data.deleted} SKU${data.deleted === 1 ? "" : "s"} deleted`);
      clearSelection();
      setBulkDeleteOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Bulk delete failed");
    } finally { setBulkDeleting(false); }
  };

  const wipeCatalog = async () => {
    if (wipeConfirm.trim().toUpperCase() !== "DELETE ALL") {
      toast.error('Type "DELETE ALL" to confirm');
      return;
    }
    setBulkDeleting(true);
    try {
      const { data } = await api.post("/products/mine/bulk-delete", { all: true, confirm: "DELETE ALL" });
      toast.success(`Catalog wiped · ${data.deleted} SKU${data.deleted === 1 ? "" : "s"} deleted`);
      clearSelection();
      setWipeOpen(false);
      setWipeConfirm("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Wipe failed");
    } finally { setBulkDeleting(false); }
  };

  const aiDescribe = async () => {
    if (!form.name) { toast.error("Enter SKU name first"); return; }
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/product-description", { product_name: form.name, category: form.primary_category, brand: form.brand });
      setForm(f => ({...f, description: data.description}));
      toast.success("AI description generated");
    } catch (e) { toast.error(e.response?.data?.detail || "AI failed"); }
    finally { setAiLoading(false); }
  };

  // ---------- Excel export / import ----------
  const download = async (endpoint, filename) => {
    setExporting(true);
    try {
      const r = await api.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed");
    } finally { setExporting(false); }
  };
  const doExport = () => download("/products/export-excel", `monthlygrocery-catalog.xlsx`);
  const doTemplate = () => download("/products/excel-template", `monthlygrocery-template.xlsx`);

  const doImport = async () => {
    if (!importFile) { toast.error("Choose a .xlsx file first"); return; }
    setImporting(true); setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const { data } = await api.post("/products/import-excel", fd, { headers: {"Content-Type": "multipart/form-data"} });
      setImportResult(data);
      toast.success(`Imported: ${data.created} new, ${data.updated} updated`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Import failed");
    } finally { setImporting(false); }
  };

  const filtered = (products || []).filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand||"").toLowerCase().includes(q.toLowerCase()));
  const secondarySuggestions = SECONDARY_SUGGEST[form.primary_category] || [];
  const filteredIds = filtered.map(p => p.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some(id => selectedIds.has(id));
  const toggleAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredIds.forEach(id => next.delete(id));
      else filteredIds.forEach(id => next.add(id));
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">SKUs & Inventory</div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Product catalog</h1>
          <div className="text-gray-500 mt-1">City-scoped pricing. Consumers only see SKUs live in their selected city.</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input data-testid="inv-search" placeholder="Search SKUs…" value={q} onChange={(e)=>setQ(e.target.value)} className="rounded-full h-11 w-56"/>
          <Button data-testid="inv-export" onClick={doExport} disabled={exporting || isPending} variant="outline" className="rounded-full h-11 border-[#22C55E] text-[#166534] hover:bg-[#DCFCE7]">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Download className="w-4 h-4 mr-1"/>Export Excel</>}
          </Button>
          <Button data-testid="inv-import" onClick={()=>{setImportOpen(true); setImportFile(null); setImportResult(null);}} disabled={isPending} variant="outline" className="rounded-full h-11 border-[#6C3BFF] text-[#6C3BFF] hover:bg-[#F3EEFF]">
            <FileUp className="w-4 h-4 mr-1"/>Import Excel
          </Button>
          <Button data-testid="inv-add" disabled={isPending} onClick={openNew} className="rounded-full h-11 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 mg-shadow-brand" title={isPending ? "Awaiting Super Admin approval" : ""}><Plus className="w-4 h-4 mr-1"/>Add SKU</Button>
        </div>
      </div>

      {/* Purchase price privacy chip + bulk actions */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#0B1220] text-[#FCD34D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">
          <Lock className="w-3 h-3"/> Purchase price shown here is admin-only. Consumers only see MRP, Our Price and Discount.
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="inv-wipe-all" onClick={()=>{setWipeConfirm(""); setWipeOpen(true);}} disabled={isPending || (products?.length ?? 0) === 0} variant="outline" className="rounded-full h-9 border-red-200 text-red-600 hover:bg-red-50 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 mr-1"/>Delete ALL SKUs
          </Button>
        </div>
      </div>

      {/* Visibility diagnostic — surfaces hidden SKUs and a 1-click fix */}
      {visibility && (visibility.hidden.explicitly_unavailable + visibility.hidden.no_price_set > 0) && (
        <div data-testid="visibility-banner" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><EyeOff className="w-4 h-4"/></div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                {visibility.hidden.explicitly_unavailable + visibility.hidden.no_price_set} SKU{(visibility.hidden.explicitly_unavailable + visibility.hidden.no_price_set) === 1 ? "" : "s"} not visible to customers
              </div>
              <div className="text-[11px] text-amber-800/80 mt-0.5">
                <span data-testid="vis-unavailable">{visibility.hidden.explicitly_unavailable}</span> marked unavailable ·
                <span data-testid="vis-noprice"> {visibility.hidden.no_price_set}</span> have no price set ·
                <span data-testid="vis-visible"> {visibility.visible_to_consumers}</span>/{visibility.total} currently visible
              </div>
            </div>
          </div>
          <Button data-testid="inv-publish-all" onClick={publishAll} disabled={publishing || isPending} className="rounded-full h-9 bg-[#22C55E] hover:bg-[#16A34A] text-xs">
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <><Eye className="w-3.5 h-3.5 mr-1"/>Publish all to shop</>}
          </Button>
        </div>
      )}

      {/* Sticky bulk-action toolbar when selection > 0 */}
      {selectedIds.size > 0 && (
        <div data-testid="bulk-toolbar" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold">{selectedIds.size}</span>
            <span className="font-semibold text-red-900">{selectedIds.size === 1 ? "SKU selected" : "SKUs selected"}</span>
            <span className="text-xs text-red-600 hidden sm:inline">· Bulk actions are permanent</span>
          </div>
          <div className="flex items-center gap-2">
            <Button data-testid="bulk-clear" variant="ghost" onClick={clearSelection} className="rounded-full text-xs">Clear</Button>
            <Button data-testid="bulk-delete-selected" onClick={()=>setBulkDeleteOpen(true)} className="rounded-full h-9 bg-red-500 hover:bg-red-600 text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-1"/>Delete {selectedIds.size} selected
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500 text-xs uppercase tracking-widest">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  data-testid="select-all"
                  checked={allFilteredSelected}
                  ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                  onChange={toggleAllFiltered}
                  disabled={isPending || filtered.length === 0}
                  className="w-4 h-4 accent-[#22C55E] cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Select all"
                />
              </th>
              <th className="p-4">SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4">Cities live</th>
              <th className="p-4">Best MRP</th>
              <th className="p-4"><Lock className="w-3 h-3 inline mr-1"/>Best Purchase</th>
              <th className="p-4">Best Selling</th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products === null ? Array.from({length:4}).map((_,i)=>(<tr key={i}><td colSpan={9} className="p-4"><Skeleton className="h-10 rounded-xl"/></td></tr>)) :
            filtered.length === 0 ? (
              <tr><td colSpan={9} className="p-10 text-center text-gray-500">
                {products.length === 0 ? "No SKUs yet. Click 'Add SKU' or 'Import Excel' to add your first product." : "No matches for your search."}
              </td></tr>
            ) : filtered.map(p => {
              const cp = p.city_prices || {};
              const cities = Object.entries(cp);
              const live = cities.filter(([_, v]) => v.is_live);
              const bestMrp = Math.max(0, ...live.map(([_, v]) => v.mrp || 0));
              const bestPrice = Math.min(...(live.map(([_, v]) => v.price || 0).filter(x => x > 0)), Infinity);
              const bestPurchase = Math.min(...(live.map(([_, v]) => v.wholesaler_price || 0).filter(x => x > 0)), Infinity);
              const rowSelected = selectedIds.has(p.id);
              return (
                <tr key={p.id} data-testid={`prod-row-${p.id}`} className={`border-t border-gray-100 ${rowSelected ? "bg-[#DCFCE7]/40" : ""}`}>
                  <td className="p-4">
                    <input
                      type="checkbox"
                      data-testid={`prod-select-${p.id}`}
                      checked={rowSelected}
                      onChange={()=>toggleOne(p.id)}
                      disabled={isPending}
                      className="w-4 h-4 accent-[#22C55E] cursor-pointer disabled:cursor-not-allowed"
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover"/> : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon className="w-4 h-4"/></div>}
                      <div>
                        <div className="font-semibold line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.unit} · {p.brand || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="text-xs">{p.primary_category}</div><div className="text-xs text-gray-400">{p.secondary_category || "—"}</div></td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {live.length === 0 ? <span className="text-xs text-red-500 font-semibold">None live</span> :
                        live.map(([c, v]) => (
                          <span key={c} data-testid={`chip-${p.id}-${c}`} className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] text-[#166534] px-2 py-0.5 text-[10px] font-bold">
                            <MapPin className="w-2.5 h-2.5"/>{c} ₹{v.price}
                          </span>
                        ))
                      }
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 line-through">₹{bestMrp || "—"}</td>
                  <td className="p-4 text-xs text-gray-500 font-mono">₹{isFinite(bestPurchase) ? bestPurchase : "—"}</td>
                  <td className="p-4 font-semibold">₹{isFinite(bestPrice) ? bestPrice : "—"}</td>
                  <td className="p-4"><span className={`font-semibold ${p.stock<=5 ? "text-amber-600" : "text-gray-700"}`}>{p.stock}</span></td>
                  <td className="p-4 text-right">
                    <button data-testid={`prod-edit-${p.id}`} disabled={isPending} onClick={()=>openEdit(p)} className="p-2 hover:text-[#22C55E] disabled:opacity-40"><Edit3 className="w-4 h-4"/></button>
                    <button data-testid={`prod-del-${p.id}`} disabled={isPending} onClick={()=>remove(p)} className="p-2 hover:text-red-500 disabled:opacity-40"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- ADD/EDIT SKU DIALOG ---------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">{editing ? "Edit SKU" : "Add new SKU"}</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Consumers see MRP, Our Selling Price & Discount only. Purchase Price is admin-only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Basic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="SKU name" required><Input data-testid="pf-name" value={form.name} onChange={upd("name")}/></Field>
              <Field label="Brand"><Input data-testid="pf-brand" value={form.brand} onChange={upd("brand")}/></Field>
              <Field label="Company"><Input data-testid="pf-company" value={form.company} onChange={upd("company")}/></Field>
              <Field label="Place / origin"><Input data-testid="pf-place" value={form.place} onChange={upd("place")} placeholder="e.g. Bhopal, MP"/></Field>
              <Field label="Primary category" required>
                <select data-testid="pf-primary-cat" className="h-10 w-full rounded-xl border border-gray-200 px-3" value={form.primary_category} onChange={(e)=>setForm({...form, primary_category: e.target.value, secondary_category: ""})}>
                  {PRIMARY_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Secondary category">
                <Input data-testid="pf-secondary-cat" list="secondary-suggest" value={form.secondary_category} onChange={upd("secondary_category")} placeholder="e.g. Oil, Soap, Dal"/>
                <datalist id="secondary-suggest">
                  {secondarySuggestions.map(s=><option key={s} value={s}/>)}
                </datalist>
              </Field>
              <Field label="Unit label">
                <select data-testid="pf-unit" className="h-10 w-full rounded-xl border border-gray-200 px-3" value={form.unit} onChange={upd("unit")}>
                  {UNITS.map(u=><option key={u}>{u}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Quantity value"><Input data-testid="pf-qty-value" type="number" step="0.01" value={form.quantity_value} onChange={upd("quantity_value")} placeholder="e.g. 500"/></Field>
                <Field label="Quantity unit"><Input data-testid="pf-qty-unit" value={form.quantity_unit} onChange={upd("quantity_unit")} placeholder="g / kg / ml / L"/></Field>
              </div>
              <Field label="Stock"><Input data-testid="pf-stock" type="number" value={form.stock} onChange={upd("stock")}/></Field>
              <Field label="GST %"><Input data-testid="pf-gst" type="number" value={form.gst} onChange={upd("gst")}/></Field>
            </div>

            {/* City Pricing Matrix */}
            <div className="rounded-2xl border-2 border-[#22C55E]/20 bg-[#F0FDF4] p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Label className="text-base font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-[#22C55E]"/>Pricing per city</Label>
                  <div className="text-xs text-gray-600 mt-0.5">Toggle &quot;Live&quot; to make this SKU visible to consumers of that city.</div>
                </div>
                <CityAdder existing={Object.keys(form.city_prices)} onAdd={addCity}/>
              </div>

              {Object.keys(form.city_prices).length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[#22C55E]/40 p-6 text-center text-sm text-gray-500">
                  No city added. Pick a city to start setting prices.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {Object.entries(form.city_prices).map(([c, cp]) => (
                    <div key={c} data-testid={`city-row-${c}`} className="rounded-2xl bg-white border border-gray-100 p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center"><MapPin className="w-4 h-4 text-[#22C55E]"/></div>
                          <div>
                            <div className="font-bold font-display text-lg">{c}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pricing</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">Live to consumers</div>
                          <Switch data-testid={`city-live-${c}`} checked={!!cp.is_live} onCheckedChange={(v)=>setCityField(c, "is_live", v)}/>
                          <button data-testid={`city-remove-${c}`} onClick={()=>removeCity(c)} className="text-gray-400 hover:text-red-500 p-1" title="Remove city"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Field label="MRP (₹)">
                          <Input data-testid={`city-mrp-${c}`} type="number" step="0.01" value={cp.mrp || 0} onChange={(e)=>setCityField(c, "mrp", Number(e.target.value))}/>
                        </Field>
                        <Field label={<span className="flex items-center gap-1 text-xs"><Lock className="w-3 h-3"/>Purchase price 🔒</span>}>
                          <Input data-testid={`city-purchase-${c}`} type="number" step="0.01" value={cp.wholesaler_price || 0} onChange={(e)=>setCityField(c, "wholesaler_price", Number(e.target.value))} className="bg-[#FFF8ED]" placeholder="Admin only"/>
                        </Field>
                        <Field label="Our selling price (₹)">
                          <Input data-testid={`city-price-${c}`} type="number" step="0.01" value={cp.price || 0} onChange={(e)=>setCityField(c, "price", Number(e.target.value))}/>
                        </Field>
                        <Field label="Discount / Margin">
                          <div className="h-10 flex items-center justify-between gap-2 px-3 rounded-xl bg-[#DCFCE7]">
                            <div className="text-sm font-bold text-[#166534]">{cityDiscount(c)}% <span className="text-[10px] uppercase tracking-widest ml-1">off MRP</span></div>
                            <div className="text-xs text-gray-600 font-mono">M: {cityMargin(c)}%</div>
                          </div>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Photos <span className="text-xs text-gray-400 font-normal">(first is cover)</span></Label>
                <input ref={photoFileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoFile} data-testid="pf-photo-file-input"/>
                <Button type="button" data-testid="pf-photo-upload" onClick={()=>photoFileRef.current?.click()} disabled={uploading} className="rounded-full h-9 px-3 text-xs bg-[#22C55E] hover:bg-[#16A34A]">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <><Upload className="w-3.5 h-3.5 mr-1"/>Upload photos</>}
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input data-testid="pf-photo-input" placeholder="…or paste an image URL" value={photoInput} onChange={(e)=>setPhotoInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addPhoto(); } }} className="rounded-xl h-10"/>
                <Button data-testid="pf-photo-add" type="button" onClick={addPhoto} variant="outline" className="rounded-full h-10 px-4 text-xs"><Plus className="w-4 h-4 mr-1"/>Add URL</Button>
              </div>
              {form.images?.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} data-testid={`pf-photo-thumb-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={url} alt={`photo ${i+1}`} className="w-full h-full object-cover"/>
                      {i === 0 && <div className="absolute top-1 left-1 bg-[#22C55E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">COVER</div>}
                      <button data-testid={`pf-photo-remove-${i}`} type="button" onClick={()=>removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Video <span className="text-xs text-gray-400 font-normal">(MP4 upload or YouTube link)</span></Label>
                <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={onVideoFile} data-testid="pf-video-file-input"/>
                <Button type="button" data-testid="pf-video-upload" onClick={()=>videoFileRef.current?.click()} disabled={uploading} className="rounded-full h-9 px-3 text-xs bg-[#22C55E] hover:bg-[#16A34A]">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <><VideoIcon className="w-3.5 h-3.5 mr-1"/>Upload video</>}
                </Button>
              </div>
              <Input data-testid="pf-video" value={form.video_url?.startsWith("data:") ? "[uploaded video]" : form.video_url} onChange={upd("video_url")} placeholder="…or paste a video URL / YouTube link" className="mt-2 rounded-xl h-10" readOnly={form.video_url?.startsWith("data:")}/>
              {form.video_url?.startsWith("data:") && (
                <button type="button" onClick={()=>setForm({...form, video_url: ""})} className="mt-2 text-xs text-red-500 font-semibold">Remove uploaded video</button>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                <Button type="button" data-testid="ai-generate-desc" onClick={aiDescribe} disabled={aiLoading} className="rounded-full h-8 px-3 text-xs bg-[#F3EEFF] text-[#6C3BFF] hover:bg-[#E4D9FF]">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <><Sparkles className="w-3.5 h-3.5 mr-1"/>AI generate</>}
                </Button>
              </div>
              <Textarea data-testid="pf-description" value={form.description} onChange={upd("description")} rows={4} className="mt-1.5 rounded-xl"/>
            </div>

            {/* Keywords */}
            <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
              <Label className="text-sm font-semibold">Search keywords <span className="text-xs text-gray-400 font-normal">(Hinglish, Hindi, brand aliases)</span></Label>
              <p className="text-xs text-gray-500 mt-1">e.g. for Aashirvaad Atta add: <span className="font-mono">atta, आटा, gehu, gehun, wheat flour</span></p>
              <div className="mt-2 flex items-center gap-2">
                <Input data-testid="pf-keyword-input" placeholder="Type a keyword and press Add" value={keywordInput} onChange={(e)=>setKeywordInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addKeyword(); } }} className="rounded-xl h-10"/>
                <Button data-testid="pf-keyword-add" type="button" onClick={addKeyword} variant="outline" className="rounded-full h-10 px-4 text-xs"><Plus className="w-4 h-4 mr-1"/>Add</Button>
              </div>
              {form.search_keywords?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.search_keywords.map((k) => (
                    <span key={k} data-testid={`pf-kw-${k}`} className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold">
                      {k}
                      <button type="button" onClick={()=>removeKeyword(k)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ToggleField label="Featured" testid="pf-featured" value={form.featured} onChange={v=>setForm({...form, featured:v})}/>
              <ToggleField label="Today's deal" testid="pf-deal" value={form.todays_deal} onChange={v=>setForm({...form, todays_deal:v})}/>
              <ToggleField label="Best seller" testid="pf-best" value={form.best_seller} onChange={v=>setForm({...form, best_seller:v})}/>
              <ToggleField label="Available" testid="pf-avail" value={form.available} onChange={v=>setForm({...form, available:v})}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="pf-save" onClick={save} disabled={saving} className="rounded-full bg-[#22C55E] hover:bg-[#16A34A] mg-shadow-brand">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save SKU"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- IMPORT EXCEL DIALOG ---------- */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-[#F3EEFF] flex items-center justify-center mb-2"><FileSpreadsheet className="w-6 h-6 text-[#6C3BFF]"/></div>
            <DialogTitle className="font-display tracking-tight">Bulk import SKUs from Excel</DialogTitle>
            <DialogDescription>
              One row per (SKU × City). Matching SKUs are updated by name; new ones are created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button data-testid="import-template" onClick={doTemplate} variant="outline" className="w-full rounded-xl h-11 border-[#6C3BFF] text-[#6C3BFF] hover:bg-[#F3EEFF]">
              <Download className="w-4 h-4 mr-2"/>Download template with sample rows
            </Button>

            <div className="rounded-2xl border-2 border-dashed border-[#6C3BFF]/30 p-6 text-center bg-[#F3EEFF]/30">
              <input ref={excelFileRef} type="file" accept=".xlsx,.xls" className="hidden" data-testid="import-file-input" onChange={(e)=>{setImportFile(e.target.files?.[0] || null); setImportResult(null);}}/>
              <FileSpreadsheet className="w-8 h-8 mx-auto text-[#6C3BFF]"/>
              <div className="mt-2 font-semibold">{importFile ? importFile.name : "Choose an Excel file (.xlsx)"}</div>
              <div className="text-xs text-gray-500 mt-1">Max 5,000 rows recommended</div>
              <Button type="button" data-testid="import-choose" onClick={()=>excelFileRef.current?.click()} className="mt-3 rounded-full bg-[#6C3BFF] hover:bg-[#5A2FE0] h-9 px-4 text-sm">Choose file</Button>
            </div>

            {importResult && (
              <div data-testid="import-result" className={`rounded-xl p-3 text-sm ${importResult.errors?.length ? "bg-amber-50 border border-amber-100 text-amber-900" : "bg-[#DCFCE7] border border-[#22C55E]/30 text-[#166534]"}`}>
                <div className="font-bold">Import complete</div>
                <div className="text-xs mt-1">Rows: {importResult.rows_processed} · Created: {importResult.created} · Updated: {importResult.updated}</div>
                {importResult.errors?.length > 0 && (
                  <ul className="mt-2 text-xs list-disc pl-4">
                    {importResult.errors.map((e,i)=><li key={i}>Row {e.row}: {e.error}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setImportOpen(false)} className="rounded-full">Close</Button>
            <Button data-testid="import-confirm" disabled={!importFile || importing} onClick={doImport} className="rounded-full bg-[#22C55E] hover:bg-[#16A34A]">
              {importing ? <Loader2 className="w-4 h-4 animate-spin"/> : <><FileUp className="w-4 h-4 mr-1"/>Import now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ---------- BULK DELETE SELECTED DIALOG ---------- */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-2"><Trash2 className="w-6 h-6 text-red-600"/></div>
            <DialogTitle className="font-display tracking-tight">Delete {selectedIds.size} SKU{selectedIds.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              These SKUs will be permanently removed from the catalog. Consumers will no longer see them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setBulkDeleteOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="bulk-delete-confirm" onClick={bulkDelete} disabled={bulkDeleting} className="rounded-full bg-red-500 hover:bg-red-600">
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Trash2 className="w-4 h-4 mr-1"/>Delete {selectedIds.size}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- WIPE-ALL DIALOG (destructive) ---------- */}
      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-2"><ShieldAlert className="w-6 h-6 text-red-600"/></div>
            <DialogTitle className="font-display tracking-tight">Delete every SKU?</DialogTitle>
            <DialogDescription>
              This wipes the ENTIRE catalog · {products?.length ?? 0} SKUs across every city.
              This cannot be undone. Export a backup Excel first if you might need it.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Type <span className="font-mono font-bold text-red-600">DELETE ALL</span> to confirm</Label>
            <Input data-testid="wipe-confirm-input" value={wipeConfirm} onChange={(e)=>setWipeConfirm(e.target.value)} placeholder="DELETE ALL" className="mt-1.5 rounded-xl h-11 font-mono"/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>{setWipeOpen(false); setWipeConfirm("");}} className="rounded-full">Cancel</Button>
            <Button data-testid="wipe-confirm" onClick={wipeCatalog} disabled={bulkDeleting || wipeConfirm.trim().toUpperCase() !== "DELETE ALL"} className="rounded-full bg-red-600 hover:bg-red-700">
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><ShieldAlert className="w-4 h-4 mr-1"/>Yes, wipe everything</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ToggleField({ label, value, onChange, testid }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5">
      <Label className="text-xs">{label}</Label>
      <Switch data-testid={testid} checked={value} onCheckedChange={onChange}/>
    </div>
  );
}

function CityAdder({ existing, onAdd }) {
  const [custom, setCustom] = useState("");
  const suggestions = DEFAULT_CITIES.filter(c => !existing.includes(c));
  return (
    <div className="flex items-center gap-2">
      <select data-testid="city-add-select" className="h-10 rounded-xl border border-gray-200 px-3 text-sm" onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = ""; } }} value="">
        <option value="">+ Add city…</option>
        {suggestions.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Input data-testid="city-add-custom" placeholder="or custom" value={custom} onChange={(e)=>setCustom(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); onAdd(custom); setCustom(""); } }} className="h-10 rounded-xl w-28"/>
    </div>
  );
}
