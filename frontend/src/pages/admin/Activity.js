import { useEffect, useState } from "react";
import { Activity, MessageSquare, User, Package, Trash2, Edit3, Plus, FileSpreadsheet, UserPlus, UserMinus, Clock, CheckCircle2, XCircle, RefreshCw, Send } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ACTION_META = {
  "sku.create": { icon: Plus, label: "SKU created", color: "bg-[#DCFCE7] text-[#166534]" },
  "sku.update": { icon: Edit3, label: "SKU updated", color: "bg-[#F3EEFF] text-[#6C3BFF]" },
  "sku.delete": { icon: Trash2, label: "SKU deleted", color: "bg-red-100 text-red-700" },
  "sku.bulk_import": { icon: FileSpreadsheet, label: "Bulk Excel import", color: "bg-[#FEF3C7] text-[#B45309]" },
  "admin.create": { icon: UserPlus, label: "Admin added", color: "bg-[#DCFCE7] text-[#166534]" },
  "admin.delete": { icon: UserMinus, label: "Admin removed", color: "bg-red-100 text-red-700" },
};

const PURPOSE_META = {
  admin_welcome: { label: "Admin welcome", color: "bg-[#DCFCE7] text-[#166534]" },
  order_placed: { label: "Order confirmation", color: "bg-[#F3EEFF] text-[#6C3BFF]" },
};

export default function AdminActivity() {
  const [entries, setEntries] = useState(null);
  const [outbox, setOutbox] = useState(null);
  const [tab, setTab] = useState("activity");

  const load = () => {
    api.get("/admin/activity").then(r => setEntries(r.data.entries || [])).catch(() => setEntries([]));
    api.get("/admin/notifications-outbox").then(r => setOutbox(r.data.messages || [])).catch(() => setOutbox([]));
  };
  useEffect(load, []);

  return (
    <div data-testid="admin-activity-page">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest"><Activity className="w-3 h-3"/> Audit Trail</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Activity log</h1>
          <div className="text-gray-500 mt-1">Every SKU change, admin action and SMS MonthlyGrocery has recorded.</div>
        </div>
        <Button data-testid="refresh-activity" onClick={load} variant="outline" className="rounded-full border-[#22C55E] text-[#166534] hover:bg-[#DCFCE7]"><RefreshCw className="w-4 h-4 mr-1"/>Refresh</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="rounded-full bg-white border border-gray-100 p-1">
          <TabsTrigger data-testid="tab-activity" value="activity" className="rounded-full data-[state=active]:bg-[#0B1220] data-[state=active]:text-white font-semibold"><Activity className="w-4 h-4 mr-1"/>Admin actions {entries && <span className="ml-2 text-[10px] px-1.5 rounded-full bg-[#FCD34D] text-[#0B1220] font-bold">{entries.length}</span>}</TabsTrigger>
          <TabsTrigger data-testid="tab-outbox" value="outbox" className="rounded-full data-[state=active]:bg-[#0B1220] data-[state=active]:text-white font-semibold"><MessageSquare className="w-4 h-4 mr-1"/>SMS outbox {outbox && <span className="ml-2 text-[10px] px-1.5 rounded-full bg-[#FCD34D] text-[#0B1220] font-bold">{outbox.length}</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          {entries === null ? (
            <div className="space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16 rounded-2xl"/>)}</div>
          ) : entries.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" body="Every admin action will appear here as soon as it happens."/>
          ) : (
            <div className="rounded-[20px] bg-white border border-gray-100 mm-shadow-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-widest">
                    <th className="p-4">When</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Resource</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const meta = ACTION_META[e.action] || { icon: Activity, label: e.action, color: "bg-gray-100 text-gray-700" };
                    const Icon = meta.icon;
                    return (
                      <tr key={e.id} data-testid={`activity-row-${e.id}`} className="border-t border-gray-100">
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1"/>{new Date(e.created_at).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${e.actor_role === "super_admin" ? "bg-[#FCD34D] text-[#0F172A]" : "bg-[#F3EEFF] text-[#6C3BFF]"}`}><User className="w-4 h-4"/></div>
                            <div>
                              <div className="font-semibold text-xs">{e.actor_name || "(unnamed)"}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{e.actor_mobile}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4"><Badge className={`${meta.color} hover:${meta.color}`}><Icon className="w-3 h-3 mr-1"/>{meta.label}</Badge></td>
                        <td className="p-4 text-xs"><div className="font-semibold truncate max-w-[240px]">{e.resource_name || "—"}</div><div className="text-[10px] text-gray-400 font-mono truncate max-w-[240px]">{e.resource_id}</div></td>
                        <td className="p-4 text-xs text-gray-500">{e.metadata && Object.keys(e.metadata).length > 0 ? <code className="bg-gray-50 px-2 py-0.5 rounded">{JSON.stringify(e.metadata)}</code> : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="outbox" className="mt-6">
          {outbox === null ? (
            <div className="space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16 rounded-2xl"/>)}</div>
          ) : outbox.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No SMS sent yet" body="Every welcome/order SMS attempt will show up here — even the failed ones."/>
          ) : (
            <div className="rounded-[20px] bg-white border border-gray-100 mm-shadow-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-widest">
                    <th className="p-4">When</th>
                    <th className="p-4">To</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.map(m => {
                    const pmeta = PURPOSE_META[m.purpose] || { label: m.purpose, color: "bg-gray-100 text-gray-700" };
                    return (
                      <tr key={m.id} data-testid={`sms-row-${m.id}`} className="border-t border-gray-100 align-top">
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1"/>{new Date(m.created_at).toLocaleString()}</td>
                        <td className="p-4"><div className="font-mono text-xs font-semibold">{m.to}</div><div className="text-[10px] text-gray-500">{m.recipient_name} · {m.recipient_role}</div></td>
                        <td className="p-4"><Badge className={`${pmeta.color} hover:${pmeta.color}`}><Send className="w-3 h-3 mr-1"/>{pmeta.label}</Badge></td>
                        <td className="p-4">
                          {m.sent
                            ? <Badge className="bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]"><CheckCircle2 className="w-3 h-3 mr-1"/>Delivered</Badge>
                            : <Badge className="bg-red-100 text-red-700 hover:bg-red-100" title={m.error}><XCircle className="w-3 h-3 mr-1"/>{m.error === "no_sender_configured" ? "Sender not set" : "Failed"}</Badge>}
                          {m.twilio_sid && <div className="text-[10px] text-gray-400 font-mono mt-1">{m.twilio_sid.slice(0,8)}…</div>}
                        </td>
                        <td className="p-4 text-xs text-gray-700 max-w-md"><div className="line-clamp-3">{m.body}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Twilio Messaging config warning */}
      {outbox && outbox.some(m => m.error === "no_sender_configured") && (
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <div className="font-semibold">⚡ Twilio Messaging not fully configured</div>
          <div className="mt-1">To actually deliver these SMS, add <code className="bg-amber-100 px-1.5 rounded">TWILIO_MESSAGING_SERVICE_SID</code> (or <code className="bg-amber-100 px-1.5 rounded">TWILIO_FROM_NUMBER</code>) to <code className="bg-amber-100 px-1.5 rounded">backend/.env</code>. Verify (OTP) works with your existing keys; Messaging needs a sender phone or messaging-service SID.</div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-10 text-center">
      <Icon className="w-8 h-8 mx-auto text-gray-300"/>
      <div className="mt-2 font-semibold">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{body}</div>
    </div>
  );
}
