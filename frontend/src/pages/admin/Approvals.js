import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserX, ShieldCheck, Loader2, Trash2, Phone, Crown } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
};

export default function AdminApprovals() {
  const [admins, setAdmins] = useState(null);
  const [busy, setBusy] = useState(null);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => api.get("/admin/admins").then(r=>setAdmins(r.data.admins||[])).catch(()=>setAdmins([]));
  useEffect(()=>{ load(); }, []);

  const setStatus = async (id, status) => {
    setBusy(id);
    try {
      await api.post(`/admin/admins/${id}/status`, { status });
      toast.success(`Admin ${status}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
    } finally { setBusy(null); }
  };

  const removeAdmin = async (a) => {
    if (!window.confirm(`Remove admin ${a.name || a.mobile}? They will no longer be able to log in.`)) return;
    setBusy(a.id);
    try {
      await api.delete(`/admin/admins/${a.id}`);
      toast.success("Admin removed");
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Delete failed"); }
    finally { setBusy(null); }
  };

  const createAdmin = async () => {
    if (!/^\d{10}$/.test(mobile.trim())) { toast.error("Enter a valid 10-digit Indian mobile"); return; }
    setCreating(true);
    try {
      await api.post("/admin/admins", { mobile: mobile.trim(), name: name.trim() });
      toast.success(`${name || mobile} can now log in as admin`);
      setMobile(""); setName(""); setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not create admin");
    } finally { setCreating(false); }
  };

  const list = admins || [];
  const superAdmin = list.find(a => a.role === "super_admin");
  const regularAdmins = list.filter(a => a.role === "admin");

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest"><Crown className="w-3 h-3"/> Super Admin only</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Admin team</h1>
          <div className="text-gray-500 mt-1">Whitelist mobile numbers here. Only these mobiles can log in as admin.</div>
        </div>
        <Button data-testid="btn-create-admin" onClick={()=>setOpen(true)} className="rounded-full h-11 bg-[#22C55E] hover:bg-[#16A34A] mg-shadow-brand"><UserPlus className="w-4 h-4 mr-1"/>Add admin</Button>
      </div>

      {admins === null ? <Skeleton className="mt-8 h-40 rounded-2xl"/> : (
        <>
          {/* Super admin row (locked) */}
          {superAdmin && (
            <div className="mt-8 rounded-[20px] bg-[#0F172A] text-white p-5 border border-slate-800 flex items-center gap-4 flex-wrap">
              <div className="w-11 h-11 rounded-xl bg-[#FCD34D] text-[#0F172A] flex items-center justify-center"><Crown className="w-5 h-5"/></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-[#FCD34D] font-bold">Super Admin · You</div>
                <div className="font-display font-bold text-lg">{superAdmin.name || "Super Admin"}</div>
                <div className="text-xs text-slate-400">{superAdmin.mobile}</div>
              </div>
              <Badge className="bg-[#FCD34D] text-[#0F172A] hover:bg-[#FCD34D]">Locked</Badge>
            </div>
          )}

          {/* Admin roster */}
          <section className="mt-6">
            <h3 className="text-lg font-semibold tracking-tight">Admins <span className="text-sm text-gray-400 font-normal">({regularAdmins.length})</span></h3>

            {regularAdmins.length === 0 ? (
              <div className="mt-3 rounded-2xl bg-white border border-dashed border-gray-200 p-10 text-center">
                <UserPlus className="w-8 h-8 mx-auto text-gray-300"/>
                <div className="mt-2 font-semibold">No admins yet</div>
                <div className="text-sm text-gray-500 mt-1">Click &quot;Add admin&quot; to whitelist a mobile number. Only those mobiles will be able to log in as admin.</div>
                <Button onClick={()=>setOpen(true)} className="mt-4 rounded-full bg-[#22C55E] hover:bg-[#16A34A]"><UserPlus className="w-4 h-4 mr-1"/>Add first admin</Button>
              </div>
            ) : (
              <div className="mt-3 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-widest">
                      <th className="p-4">Name</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Added</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularAdmins.map(a => (
                      <tr key={a.id} data-testid={`admin-row-${a.id}`} className="border-t border-gray-100">
                        <td className="p-4 font-semibold">{a.name || "(unnamed)"}</td>
                        <td className="p-4 font-mono text-xs">{a.mobile}</td>
                        <td className="p-4 text-xs text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}</td>
                        <td className="p-4"><Badge className={`${STATUS_COLORS[a.status] || "bg-gray-100 text-gray-700"} hover:${STATUS_COLORS[a.status] || "bg-gray-100"}`}>{a.status}</Badge></td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            {a.status !== "approved" && <Button data-testid={`resume-${a.id}`} disabled={busy===a.id} onClick={()=>setStatus(a.id, "approved")} className="rounded-full h-8 px-3 text-xs bg-[#22C55E] hover:bg-[#16A34A]"><ShieldCheck className="w-3 h-3 mr-1"/>Activate</Button>}
                            {a.status !== "suspended" && <Button data-testid={`suspend-${a.id}`} disabled={busy===a.id} onClick={()=>setStatus(a.id, "suspended")} variant="outline" className="rounded-full h-8 px-3 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"><UserX className="w-3 h-3 mr-1"/>Suspend</Button>}
                            <Button data-testid={`delete-${a.id}`} disabled={busy===a.id} onClick={()=>removeAdmin(a)} variant="outline" className="rounded-full h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3 mr-1"/>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Create admin modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mb-2"><UserPlus className="w-6 h-6 text-[#22C55E]"/></div>
            <DialogTitle className="font-display tracking-tight text-2xl">Whitelist a new admin</DialogTitle>
            <DialogDescription>
              This mobile can then log in using their own OTP. Random mobiles cannot get admin access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-admin-mobile">Mobile number</Label>
              <div className="mt-1.5 flex items-center rounded-xl bg-white border-2 border-[#F1EAD8] focus-within:border-[#22C55E] transition-colors">
                <div className="pl-4 pr-2 text-sm text-gray-600 font-semibold flex items-center gap-1"><Phone className="w-4 h-4"/>+91</div>
                <Input data-testid="new-admin-mobile" id="new-admin-mobile" type="tel" inputMode="numeric" value={mobile} onChange={(e)=>setMobile(e.target.value.replace(/[^\d]/g,"").slice(0,10))} placeholder="9876543210" className="border-0 focus-visible:ring-0 h-12 text-base bg-transparent"/>
              </div>
            </div>
            <div>
              <Label htmlFor="new-admin-name">Name <span className="text-xs text-gray-400 font-normal">(optional)</span></Label>
              <Input data-testid="new-admin-name" id="new-admin-name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" className="mt-1.5 rounded-xl h-11"/>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="confirm-create-admin" onClick={createAdmin} disabled={creating} className="rounded-full bg-[#22C55E] hover:bg-[#16A34A] mg-shadow-brand">
              {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : <><UserPlus className="w-4 h-4 mr-1"/>Add admin</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
