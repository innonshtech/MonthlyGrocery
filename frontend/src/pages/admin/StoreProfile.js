import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = {
  shop_name:"MonthlyGrocery", owner_name:"", mobile:"", email:"", gst_number:"", address:"", city:"", pincode:"",
  state:"", category:"Grocery", shop_timing:"9:00 AM - 9:00 PM", delivery_radius:25, logo_url:"", banner_url:"",
  description:"", whatsapp:"", instagram:"", facebook:"", website:"",
};

const CATEGORIES = ["Grocery","Provision Store","Wholesale","Household Essentials","Bulk Foods","General Store"];

export default function AdminStoreProfile() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/shops/mine").then((r) => {
      if (r.data.shop) setForm({...EMPTY, ...r.data.shop});
    }).finally(()=>setLoading(false));
  }, []);

  const upd = (k) => (e) => setForm({...form, [k]: e.target.value});

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/shops/mine", { ...form, delivery_radius: Number(form.delivery_radius||25) });
      toast.success("Store profile saved");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin"/> Loading…</div>;

  return (
    <div>
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Store profile</div>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter font-display">MonthlyGrocery storefront</h1>
        <div className="text-gray-500 mt-1">This information appears to consumers browsing on MonthlyGrocery.</div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
          <h3 className="text-lg font-semibold tracking-tight">Basic details</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Store name" required><Input data-testid="sp-name" value={form.shop_name} onChange={upd("shop_name")}/></Field>
            <Field label="Owner name"><Input data-testid="sp-owner" value={form.owner_name} onChange={upd("owner_name")}/></Field>
            <Field label="Mobile"><Input data-testid="sp-mobile" value={form.mobile} onChange={upd("mobile")}/></Field>
            <Field label="Business email"><Input data-testid="sp-email" value={form.email} onChange={upd("email")}/></Field>
            <Field label="GST number"><Input data-testid="sp-gst" value={form.gst_number} onChange={upd("gst_number")}/></Field>
            <Field label="Category">
              <select data-testid="sp-category" value={form.category} onChange={upd("category")} className="h-10 w-full rounded-xl border border-gray-200 px-3">
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Business hours"><Input data-testid="sp-timing" value={form.shop_timing} onChange={upd("shop_timing")}/></Field>
            <Field label="Delivery radius (km)"><Input data-testid="sp-radius" type="number" value={form.delivery_radius} onChange={upd("delivery_radius")}/></Field>
            <Field label="Address" full><Input data-testid="sp-address" value={form.address} onChange={upd("address")}/></Field>
            <Field label="City"><Input data-testid="sp-city" value={form.city} onChange={upd("city")}/></Field>
            <Field label="Pincode"><Input data-testid="sp-pincode" value={form.pincode} onChange={upd("pincode")}/></Field>
            <Field label="State"><Input data-testid="sp-state" value={form.state} onChange={upd("state")}/></Field>
            <Field label="Description" full><Textarea data-testid="sp-desc" rows={3} value={form.description} onChange={upd("description")}/></Field>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
            <h3 className="text-lg font-semibold tracking-tight">Media</h3>
            <div className="mt-4 space-y-3">
              <Field label="Logo URL"><Input data-testid="sp-logo" value={form.logo_url} onChange={upd("logo_url")}/></Field>
              <Field label="Banner URL"><Input data-testid="sp-banner" value={form.banner_url} onChange={upd("banner_url")}/></Field>
              {form.banner_url && <img src={form.banner_url} alt="banner preview" className="w-full h-24 object-cover rounded-xl"/>}
            </div>
          </div>
          <div className="rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
            <h3 className="text-lg font-semibold tracking-tight">Social & contact</h3>
            <div className="mt-4 space-y-3">
              <Field label="WhatsApp"><Input data-testid="sp-wa" value={form.whatsapp} onChange={upd("whatsapp")}/></Field>
              <Field label="Instagram"><Input data-testid="sp-ig" value={form.instagram} onChange={upd("instagram")}/></Field>
              <Field label="Facebook"><Input data-testid="sp-fb" value={form.facebook} onChange={upd("facebook")}/></Field>
              <Field label="Website"><Input data-testid="sp-web" value={form.website} onChange={upd("website")}/></Field>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button data-testid="sp-save" onClick={save} disabled={saving} className="rounded-full h-11 px-7 bg-[#6C3BFF] hover:bg-[#5A2FE0]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4 mr-1"/>Save changes</>}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, required, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
