import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ShoppingBag, Package, Users, TrendingUp, ArrowUpRight, Wallet, ShieldCheck, UserCheck, MessageSquare, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const STATUS_COLORS = {
  placed: "bg-blue-100 text-blue-700",
  accepted: "bg-purple-100 text-purple-700",
  preparing: "bg-amber-100 text-amber-700",
  packed: "bg-amber-100 text-amber-700",
  ready: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const isSuper = user?.role === "super_admin";
  return isSuper ? <SuperAdminDashboard/> : <OpsAdminDashboard/>;
}

/* ---------- SUPER ADMIN ---------- */
function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingAdmins, setPendingAdmins] = useState(null);
  const [recentOrders, setRecentOrders] = useState(null);
  const [twilio, setTwilio] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(r=>setStats(r.data)).catch(()=>setStats({}));
    api.get("/admin/admins").then(r=>{
      const list = r.data.admins || [];
      setPendingAdmins(list.filter(a=>a.status === "pending" && a.role === "admin"));
    }).catch(()=>setPendingAdmins([]));
    api.get("/admin/orders/recent").then(r=>setRecentOrders(r.data.orders || [])).catch(()=>setRecentOrders([]));
    api.get("/admin/twilio/status").then(r=>setTwilio(r.data)).catch(()=>setTwilio({configured:false}));
  }, []);

  return (
    <div data-testid="super-admin-dashboard">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest"><Crown className="w-3 h-3"/> Super Admin · Control Tower</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Platform overview</h1>
          <div className="text-gray-500 mt-1">Every admin, SKU and rupee across MonthlyGrocery.</div>
        </div>
        <div className="flex items-center gap-2">
          {twilio && (
            <Badge data-testid="twilio-badge" className={twilio.configured ? "bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]" : "bg-red-100 text-red-700 hover:bg-red-100"}>
              <MessageSquare className="w-3 h-3 mr-1"/> Twilio {twilio.configured ? "connected" : "not configured"}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ControlKpi title="Pending admin approvals" value={stats?.pending_admins ?? "–"} icon={UserCheck} accent="gold" testid="kpi-pending-admins"/>
        <ControlKpi title="Approved admins" value={stats?.approved_admins ?? "–"} icon={ShieldCheck}/>
        <ControlKpi title="Total consumers" value={stats?.total_consumers ?? "–"} icon={Users}/>
        <ControlKpi title="Platform revenue" value={`₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`} icon={TrendingUp}/>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-[20px] bg-[#0F172A] text-white p-6 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-[#FCD34D]">Awaiting your approval</div>
              <div className="mt-1 text-2xl font-bold tracking-tight font-display">Admin requests</div>
              <div className="text-sm text-slate-400 mt-1">These admins can&apos;t touch inventory until you approve them.</div>
            </div>
            <Link to="/admin/approvals"><Button data-testid="goto-approvals" className="rounded-full bg-[#FCD34D] text-[#0F172A] hover:bg-[#F5C518] font-bold">Manage all</Button></Link>
          </div>

          <div className="mt-6 space-y-2">
            {pendingAdmins === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-14 rounded-xl bg-slate-800"/>) :
             pendingAdmins.length === 0 ? (
              <div className="rounded-xl bg-slate-800/50 border border-slate-700 border-dashed p-6 text-center text-slate-400 text-sm">All clear — no pending admin requests.</div>
            ) : pendingAdmins.slice(0,4).map(a => (
              <div key={a.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <div>
                  <div className="font-semibold">{a.name || "(unnamed)"}</div>
                  <div className="text-xs text-slate-400">{a.mobile} · {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <Badge className="bg-[#FCD34D]/20 text-[#FCD34D] hover:bg-[#FCD34D]/20">Review</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[20px] p-5 border border-gray-100 bg-white mm-shadow-soft">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#6C3BFF]"/>
              <div className="text-xs uppercase tracking-widest font-semibold text-gray-500">Twilio SMS delivery</div>
            </div>
            {twilio ? (
              <>
                <div className="mt-3 text-2xl font-bold tracking-tight font-display">{twilio.otps_last_24h ?? 0} <span className="text-sm text-gray-500 font-normal">OTPs in 24h</span></div>
                <div className="text-xs text-gray-500 mt-1">Verify Service SID: {twilio.masked_service_sid || "—"}</div>
                <Link to="/admin/twilio-logs"><Button data-testid="goto-twilio-logs" variant="outline" className="mt-4 w-full rounded-full border-[#6C3BFF] text-[#6C3BFF] hover:bg-[#F3EEFF]">View SMS logs</Button></Link>
              </>
            ) : <Skeleton className="mt-3 h-12 rounded-xl"/>}
          </div>

          <div className="rounded-[20px] p-5 border border-gray-100 bg-white mm-shadow-soft">
            <div className="text-xs uppercase tracking-widest font-semibold text-gray-500">Catalog & orders</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MiniCell label="SKUs" value={stats?.total_products ?? "–"} icon={Package}/>
              <MiniCell label="Orders" value={stats?.total_orders ?? "–"} icon={ShoppingBag}/>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight font-display">Recent platform orders</h3>
          <Badge className="bg-[#F3EEFF] text-[#6C3BFF] hover:bg-[#F3EEFF]"><Sparkles className="w-3 h-3 mr-1"/> Live</Badge>
        </div>
        <div className="mt-4 divide-y divide-gray-100">
          {recentOrders === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-14 my-2 rounded-xl"/>) :
          recentOrders.length === 0 ? <div className="text-gray-500 text-sm py-6 text-center">No orders on the platform yet.</div> :
          recentOrders.slice(0,8).map(o => (
            <div key={o.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">#{o.order_number} · {o.consumer_name}</div>
                <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{(o.total || 0).toFixed(2)}</div>
                <Badge className={`${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"} hover:${STATUS_COLORS[o.status] || "bg-gray-100"} mt-1`}>{(o.status || "").replace(/_/g," ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ControlKpi({ title, value, icon: Icon, accent, testid }) {
  const isGold = accent === "gold";
  return (
    <div data-testid={testid} className={`rounded-[20px] p-6 border ${isGold ? "bg-[#FCD34D] text-[#0F172A] border-[#FCD34D]" : "bg-[#0F172A] text-white border-slate-800"}`}>
      <div className="flex items-center justify-between">
        <div className={`text-[10px] uppercase tracking-widest font-bold ${isGold ? "text-[#0F172A]/70" : "text-slate-400"}`}>{title}</div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isGold ? "bg-[#0F172A]/10" : "bg-white/10"}`}><Icon className="w-4 h-4"/></div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight font-display">{value}</div>
    </div>
  );
}

function MiniCell({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{label}</div>
        <div className="mt-1 text-lg font-bold tracking-tight">{value}</div>
      </div>
      <Icon className="w-4 h-4 text-gray-400"/>
    </div>
  );
}


/* ---------- OPS ADMIN ---------- */
function OpsAdminDashboard() {
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/orders/mine").then(r=>setOrders(r.data.orders || [])).catch(()=>setOrders([]));
    api.get("/products/mine").then(r=>setProducts(r.data.products || [])).catch(()=>setProducts([]));
    api.get("/admin/stats").then(r=>setStats(r.data)).catch(()=>setStats({}));
  }, []);

  const today = new Date().toDateString();
  const todaysOrders = (orders || []).filter(o => new Date(o.created_at).toDateString() === today);
  const pending = (orders || []).filter(o => ["placed","accepted","preparing","packed","ready"].includes(o.status));
  const delivered = (orders || []).filter(o => o.status === "delivered");
  const revenueToday = todaysOrders.reduce((s,o)=>s+o.total, 0);
  const revenueMonth = (orders || []).filter(o=>{
    const d = new Date(o.created_at); const n = new Date();
    return d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  }).reduce((s,o)=>s+o.total,0);
  const avgOrder = (orders && orders.length) ? (orders.reduce((s,o)=>s+o.total,0)/orders.length) : 0;
  const lowStock = (products || []).filter(p => (p.stock ?? 0) <= 5);

  const days = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()- (6-i));
    return { label: d.toLocaleDateString(undefined,{weekday:'short'}), key: d.toDateString(), revenue: 0 };
  });
  (orders || []).forEach(o=>{ const k = new Date(o.created_at).toDateString(); const bucket = days.find(x=>x.key===k); if(bucket) bucket.revenue += o.total; });

  return (
    <div data-testid="ops-admin-dashboard">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F3EEFF] text-[#6C3BFF] px-3 py-1 text-[10px] font-bold uppercase tracking-widest"><ShieldCheck className="w-3 h-3"/> Admin · Store operations</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Your store today</h1>
          <div className="text-gray-500 mt-1">Manage inventory, orders and customers.</div>
        </div>
        <Badge className="bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]"><ArrowUpRight className="w-3 h-3 mr-1"/> Live</Badge>
      </div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigKpi title="Revenue today" value={`₹${revenueToday.toFixed(0)}`} icon={TrendingUp} tone="primary"/>
        <BigKpi title="Orders today" value={todaysOrders.length} icon={ShoppingBag}/>
        <BigKpi title="Pending orders" value={pending.length} icon={Package}/>
        <BigKpi title="Delivered" value={delivered.length} icon={Users}/>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Revenue · last 7 days</div>
              <div className="mt-1 text-3xl font-bold tracking-tight font-display">₹{revenueMonth.toFixed(0)}</div>
              <div className="text-sm text-gray-500">This month</div>
            </div>
          </div>
          <div className="mt-6 h-56 w-full min-h-[224px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days}>
                <CartesianGrid stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:"#9CA3AF", fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#9CA3AF", fontSize:12}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:12, border:"1px solid #F3F4F6"}}/>
                <Line type="monotone" dataKey="revenue" stroke="#6C3BFF" strokeWidth={2.5} dot={{fill:"#6C3BFF"}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <SmallStat title="SKU count" value={(products||[]).length} icon={Package}/>
          <SmallStat title="Avg order value" value={`₹${avgOrder.toFixed(0)}`} icon={Wallet}/>
          <SmallStat title="Customers" value={stats?.total_consumers ?? "–"} icon={Users}/>
          <SmallStat title="Low stock" value={lowStock.length} icon={Package} accent="warn"/>
        </div>
      </div>

      <section className="mt-8 rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
        <h3 className="text-lg font-semibold tracking-tight font-display">Recent orders</h3>
        <div className="mt-4 divide-y divide-gray-100">
          {orders === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-14 my-2 rounded-xl"/>) :
          orders.length === 0 ? <div className="text-gray-500 text-sm py-6 text-center">No orders yet.</div> :
          orders.slice(0,6).map(o => (
            <div key={o.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">#{o.order_number} · {o.consumer_name}</div>
                <div className="text-xs text-gray-500">{o.items.length} items · {new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{o.total.toFixed(2)}</div>
                <Badge className={`${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"} hover:${STATUS_COLORS[o.status] || "bg-gray-100"} mt-1`}>{o.status.replace(/_/g," ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {lowStock.length > 0 && (
        <section className="mt-8 rounded-[20px] bg-amber-50 border border-amber-100 p-6">
          <h3 className="text-lg font-semibold tracking-tight text-amber-900">Low stock alerts</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.slice(0,9).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-amber-700 font-bold">{p.stock} left</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BigKpi({ title, value, icon: Icon, tone }) {
  const isPrimary = tone === "primary";
  return (
    <div className={`rounded-[20px] p-6 border ${isPrimary ? "bg-[#6C3BFF] text-white border-[#6C3BFF]" : "bg-white border-gray-100 mm-shadow-soft"}`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs uppercase tracking-widest font-semibold ${isPrimary ? "text-white/80" : "text-gray-400"}`}>{title}</div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPrimary ? "bg-white/15" : "bg-[#F3EEFF] text-[#6C3BFF]"}`}><Icon className="w-4 h-4"/></div>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight font-display">{value}</div>
    </div>
  );
}
function SmallStat({ title, value, icon: Icon, accent }) {
  return (
    <div className={`rounded-[20px] p-5 border ${accent==="warn" ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100 mm-shadow-soft"} flex items-center justify-between`}>
      <div>
        <div className={`text-xs uppercase tracking-widest font-semibold ${accent==="warn" ? "text-amber-800" : "text-gray-400"}`}>{title}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight font-display">{value}</div>
      </div>
      {Icon && <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent==="warn" ? "bg-amber-100 text-amber-800" : "bg-[#F3EEFF] text-[#6C3BFF]"}`}><Icon className="w-4 h-4"/></div>}
    </div>
  );
}
