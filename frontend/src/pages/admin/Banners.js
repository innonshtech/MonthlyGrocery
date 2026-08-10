import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, Upload, Image as ImageIcon, ChevronUp, ChevronDown, Loader2, X, Link as LinkIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const EMPTY = {
  title: "",
  subtitle: "",
  tag: "",
  image_url: "",
  gradient: "",
  icon: "🛒",
  cta_label: "",
  cta_url: "",
  order: 0,
  enabled: true,
  start_at: "",
  end_at: "",
};

const GRADIENT_PRESETS = [
  { name: "Green (Kirana)", value: "linear-gradient(135deg, #22C55E 0%, #15803D 100%)" },
  { name: "Slate", value: "linear-gradient(135deg, #0B1220 0%, #1F2937 100%)" },
  { name: "Orange", value: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)" },
  { name: "Purple", value: "linear-gradient(135deg, #6C3BFF 0%, #4C1D95 100%)" },
  { name: "Rose", value: "linear-gradient(135deg, #DB2777 0%, #831843 100%)" },
];

export default function BannersAdmin() {
  const [banners, setBanners] = useState(null);
  const [editing, setEditing] = useState(null); // banner object or "new"
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/banners");
      setBanners(data.banners || []);
    } catch (_e) {
      setBanners([]);
      toast.error("Could not load banners");
    }
  };

  useEffect(() => { load(); }, []);

  const move = async (index, dir) => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= banners.length) return;
    const next = [...banners];
    const [moved] = next.splice(index, 1);
    next.splice(nextIdx, 0, moved);
    setBanners(next);
    try {
      await api.post("/admin/banners/reorder", { ids: next.map(b => b.id) });
    } catch (_e) {
      toast.error("Reorder failed");
      load();
    }
  };

  const toggleEnabled = async (b) => {
    try {
      await api.put(`/admin/banners/${b.id}`, { ...b, enabled: !b.enabled });
      setBanners(bs => bs.map(x => x.id === b.id ? { ...x, enabled: !x.enabled } : x));
    } catch (_e) {
      toast.error("Toggle failed");
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete banner "${b.title}"?`)) return;
    try {
      await api.delete(`/admin/banners/${b.id}`);
      setBanners(bs => bs.filter(x => x.id !== b.id));
      toast.success("Banner deleted");
    } catch (_e) { toast.error("Delete failed"); }
  };

  const save = async () => {
    if (!editing.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    try {
      if (editing.id) {
        const { data } = await api.put(`/admin/banners/${editing.id}`, editing);
        setBanners(bs => bs.map(x => x.id === editing.id ? data.banner : x));
        toast.success("Banner saved");
      } else {
        const { data } = await api.post("/admin/banners", editing);
        setBanners(bs => [...bs, data.banner]);
        toast.success("Banner created");
      }
      setEditing(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div data-testid="banners-admin">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#22C55E]">Carousel</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tighter font-display">Home banners</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-lg">Upload, reorder, schedule and toggle the hero carousel on the consumer home page. Empty list = defaults are shown.</p>
        </div>
        <Button data-testid="banner-new" onClick={()=>setEditing({ ...EMPTY, order: (banners?.length || 0) + 1 })} className="rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-[#FCD34D]"><Plus className="w-4 h-4 mr-1"/> New banner</Button>
      </div>

      {banners === null ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#22C55E]"/></div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center bg-white">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center"><ImageIcon className="w-7 h-7"/></div>
          <div className="mt-4 text-lg font-semibold">No banners yet</div>
          <div className="text-sm text-gray-500 mt-1">Default banners are shown until you add the first one.</div>
          <Button data-testid="banner-empty-new" onClick={()=>setEditing({ ...EMPTY, order: 1 })} className="mt-6 rounded-full bg-[#22C55E] hover:bg-[#16A34A]"><Plus className="w-4 h-4 mr-1"/> Add banner</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <BannerRow key={b.id} b={b} idx={i} total={banners.length}
              onEdit={()=>setEditing(b)}
              onMove={(d)=>move(i, d)}
              onToggle={()=>toggleEnabled(b)}
              onDelete={()=>remove(b)}
            />
          ))}
        </div>
      )}

      {editing && (
        <BannerEditor value={editing} onChange={setEditing} onClose={()=>setEditing(null)} onSave={save} saving={saving}/>
      )}
    </div>
  );
}

function BannerRow({ b, idx, total, onEdit, onMove, onToggle, onDelete }) {
  const bg = b.image_url
    ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%), url(${b.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundImage: b.gradient || "linear-gradient(135deg, #22C55E 0%, #15803D 100%)" };
  return (
    <div data-testid={`banner-row-${b.id}`} className={`rounded-2xl bg-white border ${b.enabled ? "border-gray-100" : "border-dashed border-gray-300 opacity-70"} mm-shadow-soft flex items-center gap-4 p-3`}>
      <div className="flex flex-col gap-1">
        <button data-testid={`banner-up-${b.id}`} onClick={()=>onMove(-1)} disabled={idx===0} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center"><ChevronUp className="w-4 h-4"/></button>
        <button data-testid={`banner-down-${b.id}`} onClick={()=>onMove(1)} disabled={idx===total-1} className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center"><ChevronDown className="w-4 h-4"/></button>
      </div>
      <div className="w-40 h-20 rounded-xl overflow-hidden text-white flex items-center gap-2 p-3 shrink-0" style={bg}>
        <div className="text-xl">{b.icon || "🛒"}</div>
        <div className="min-w-0">
          {b.tag && <div className="text-[8px] uppercase tracking-widest font-bold text-white/80 truncate">{b.tag}</div>}
          <div className="text-xs font-bold leading-tight truncate">{b.title}</div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold truncate">{b.title}</div>
          {!b.enabled && <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Off</span>}
        </div>
        <div className="text-xs text-gray-500 truncate">{b.subtitle || "—"}</div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
          <span>Order #{b.order}</span>
          {b.start_at && <span>Starts {b.start_at.slice(0,10)}</span>}
          {b.end_at && <span>Ends {b.end_at.slice(0,10)}</span>}
          {b.cta_url && <span className="inline-flex items-center gap-1"><LinkIcon className="w-3 h-3"/> {b.cta_label || "CTA"}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch data-testid={`banner-toggle-${b.id}`} checked={b.enabled} onCheckedChange={onToggle}/>
        <Button data-testid={`banner-edit-${b.id}`} variant="outline" onClick={onEdit} className="rounded-full"><Save className="w-4 h-4 mr-1"/> Edit</Button>
        <Button data-testid={`banner-delete-${b.id}`} variant="ghost" onClick={onDelete} className="text-red-500 rounded-full"><Trash2 className="w-4 h-4"/></Button>
      </div>
    </div>
  );
}

function BannerEditor({ value, onChange, onClose, onSave, saving }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const upd = (k) => (e) => onChange({ ...value, [k]: e.target?.value ?? e });

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Max 8 MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" }});
      onChange({ ...value, image_url: data.url });
      toast.success("Image uploaded");
    } catch (_err) { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div data-testid="banner-editor" className="w-full max-w-3xl bg-white rounded-3xl mg-shadow-hover max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#22C55E]">{value.id ? "Edit banner" : "New banner"}</div>
            <h2 className="text-xl font-bold tracking-tight font-display">{value.title || "Untitled banner"}</h2>
          </div>
          <button data-testid="banner-close" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-4 h-4"/></button>
        </div>

        <div className="p-6 space-y-5">
          <BannerPreview b={value}/>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input data-testid="banner-title" required value={value.title} onChange={upd("title")} placeholder="Mahine ka kirana" className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div>
              <Label>Tag <span className="text-gray-400 text-xs">(top-left kicker)</span></Label>
              <Input data-testid="banner-tag" value={value.tag} onChange={upd("tag")} placeholder="Pan India Launch" className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div className="sm:col-span-2">
              <Label>Subtitle</Label>
              <Input data-testid="banner-subtitle" value={value.subtitle} onChange={upd("subtitle")} placeholder="₹2,500+ ke order par bachat" className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div>
              <Label>Icon <span className="text-gray-400 text-xs">(one emoji)</span></Label>
              <Input data-testid="banner-icon" value={value.icon} onChange={upd("icon")} placeholder="🛒" className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div>
              <Label>Display order</Label>
              <Input data-testid="banner-order" type="number" min={0} value={value.order} onChange={(e)=>onChange({ ...value, order: parseInt(e.target.value || "0", 10) })} className="mt-1.5 rounded-xl h-11"/>
            </div>
          </div>

          <div>
            <Label>Background image <span className="text-gray-400 text-xs">(overrides gradient)</span></Label>
            <div className="mt-1.5 flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onUpload} hidden data-testid="banner-file"/>
              <Button variant="outline" onClick={()=>fileInputRef.current?.click()} disabled={uploading} className="rounded-full">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1"/> : <Upload className="w-4 h-4 mr-1"/>}
                {value.image_url ? "Replace image" : "Upload image"}
              </Button>
              {value.image_url && (
                <Button variant="ghost" onClick={()=>onChange({ ...value, image_url: "" })} className="text-red-500 rounded-full text-xs">Remove image</Button>
              )}
            </div>
            <Input data-testid="banner-image-url" value={value.image_url} onChange={upd("image_url")} placeholder="…or paste an image URL" className="mt-2 rounded-xl h-10 text-xs"/>
          </div>

          <div>
            <Label>Gradient <span className="text-gray-400 text-xs">(shown when no image)</span></Label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button key={g.name} data-testid={`banner-gradient-${g.name}`} type="button" onClick={()=>onChange({ ...value, gradient: g.value })}
                  className={`h-12 rounded-xl border-2 flex items-end p-1 text-[10px] font-semibold text-white ${value.gradient === g.value ? "border-[#22C55E]" : "border-transparent"}`}
                  style={{ backgroundImage: g.value }}>{g.name}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>CTA label <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Input data-testid="banner-cta-label" value={value.cta_label} onChange={upd("cta_label")} placeholder="Shop now" className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div>
              <Label>CTA URL <span className="text-gray-400 text-xs">(/shop, or full https://)</span></Label>
              <Input data-testid="banner-cta-url" value={value.cta_url} onChange={upd("cta_url")} placeholder="/shop?category=Atta%20%26%20Rice" className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div>
              <Label>Schedule start <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Input data-testid="banner-start-at" type="datetime-local" value={toLocal(value.start_at)} onChange={(e)=>onChange({ ...value, start_at: fromLocal(e.target.value) })} className="mt-1.5 rounded-xl h-11"/>
            </div>
            <div>
              <Label>Schedule end <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Input data-testid="banner-end-at" type="datetime-local" value={toLocal(value.end_at)} onChange={(e)=>onChange({ ...value, end_at: fromLocal(e.target.value) })} className="mt-1.5 rounded-xl h-11"/>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch data-testid="banner-enabled" checked={value.enabled} onCheckedChange={(v)=>onChange({ ...value, enabled: v })}/>
            <div>
              <div className="text-sm font-semibold">Enabled</div>
              <div className="text-xs text-gray-500">Disable to hide from the consumer carousel without deleting.</div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button data-testid="banner-save" onClick={onSave} disabled={saving} className="rounded-full bg-[#0F172A] text-[#FCD34D] hover:bg-[#1E293B]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1"/> : <Sparkles className="w-4 h-4 mr-1"/>}
            {value.id ? "Save changes" : "Publish banner"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BannerPreview({ b }) {
  const bg = b.image_url
    ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%), url(${b.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundImage: b.gradient || "linear-gradient(135deg, #22C55E 0%, #15803D 100%)" };
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 mm-shadow-soft h-24 text-white p-4 flex items-center gap-3" style={bg} data-testid="banner-preview">
      <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl shrink-0">{b.icon || "🛒"}</div>
      <div className="min-w-0">
        {b.tag && <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">{b.tag}</div>}
        <div className="text-base font-bold tracking-tight font-display leading-tight line-clamp-1">{b.title || "Untitled banner"}</div>
        {b.subtitle && <div className="text-xs text-white/80 mt-0.5 line-clamp-1">{b.subtitle}</div>}
      </div>
    </div>
  );
}

// datetime-local uses "YYYY-MM-DDTHH:mm" (no tz). We store ISO with Z.
function toLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocal(local) {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
