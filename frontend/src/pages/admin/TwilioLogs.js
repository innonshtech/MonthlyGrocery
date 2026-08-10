import { useEffect, useState } from "react";
import { MessageSquare, CheckCircle2, XCircle, Clock, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function TwilioLogs() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState(null);

  const load = () => {
    api.get("/admin/twilio/status").then(r=>setStatus(r.data)).catch(()=>setStatus({configured:false}));
    api.get("/admin/twilio/logs").then(r=>setLogs(r.data.logs || [])).catch(()=>setLogs([]));
  };
  useEffect(load, []);

  return (
    <div data-testid="twilio-logs-page">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest"><MessageSquare className="w-3 h-3"/> Twilio Integration</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter font-display">SMS OTP delivery logs</h1>
          <div className="text-gray-500 mt-1">Every OTP MonthlyGrocery requested Twilio to deliver, in real time.</div>
        </div>
        <Button data-testid="refresh-logs" onClick={load} variant="outline" className="rounded-full border-[#6C3BFF] text-[#6C3BFF] hover:bg-[#F3EEFF]">Refresh</Button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusCard status={status}/>
        <StatCell title="OTPs (24h)" value={status?.otps_last_24h ?? "–"} icon={MessageSquare}/>
        <StatCell title="OTPs (all time)" value={status?.otps_all_time ?? "–"} icon={CheckCircle2}/>
      </div>

      <section className="mt-8 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight font-display">Recent OTP send attempts</h3>
          <Badge className="bg-[#F3EEFF] text-[#6C3BFF] hover:bg-[#F3EEFF]">Last {(logs||[]).length}</Badge>
        </div>
        {logs === null ? (
          <div className="p-6 space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-12 rounded-xl"/>)}</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">No OTPs sent yet. As soon as someone logs in, requests will appear here.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-widest">
                <th className="p-4">When</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Requested role</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} data-testid={`twilio-log-${i}`} className="border-t border-gray-100">
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1"/>{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-4 font-mono text-xs font-semibold">{l.mobile}</td>
                  <td className="p-4"><Badge className={l.requested_role === "admin" ? "bg-[#F3EEFF] text-[#6C3BFF] hover:bg-[#F3EEFF]" : "bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]"}>{l.requested_role}</Badge></td>
                  <td className="p-4 text-xs">SMS</td>
                  <td className="p-4"><Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/>Requested</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <div className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Note about Twilio trial accounts</div>
        <div className="mt-1">If your Twilio account is on the free trial, SMS will only be delivered to <span className="font-mono">phone numbers you&apos;ve verified inside the Twilio console</span>. Upgrade the Twilio account to remove this restriction.</div>
      </div>
    </div>
  );
}

function StatusCard({ status }) {
  if (!status) return <Skeleton className="h-32 rounded-[20px]"/>;
  const configured = status.configured;
  return (
    <div className={`rounded-[20px] p-5 border ${configured ? "bg-[#0F172A] text-white border-slate-800" : "bg-red-50 border-red-100"}`}>
      <div className="flex items-center gap-2">
        <MessageSquare className={`w-4 h-4 ${configured ? "text-[#FCD34D]" : "text-red-500"}`}/>
        <div className={`text-[10px] uppercase tracking-widest font-bold ${configured ? "text-[#FCD34D]" : "text-red-700"}`}>Twilio Verify</div>
      </div>
      <div className={`mt-3 text-2xl font-bold tracking-tight font-display ${configured ? "" : "text-red-700"}`}>
        {configured ? "Connected" : "Not configured"}
      </div>
      {configured ? (
        <div className="mt-2 space-y-1 text-xs text-slate-300">
          <div>Account SID: <span className="font-mono">{status.masked_account_sid || "—"}</span></div>
          <div>Service SID: <span className="font-mono">{status.masked_service_sid || "—"}</span></div>
        </div>
      ) : <div className="mt-2 text-xs text-red-800">Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID to backend/.env</div>}
    </div>
  );
}

function StatCell({ title, value, icon: Icon }) {
  return (
    <div className="rounded-[20px] p-5 border border-gray-100 bg-white mm-shadow-soft flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{title}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight font-display">{value}</div>
      </div>
      <div className="w-9 h-9 rounded-xl bg-[#F3EEFF] text-[#6C3BFF] flex items-center justify-center"><Icon className="w-4 h-4"/></div>
    </div>
  );
}
