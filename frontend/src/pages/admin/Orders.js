import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NEXT_STATUS = {
  placed: [["accepted","Accept"], ["rejected","Reject"]],
  accepted: [["preparing","Start preparing"], ["cancelled","Cancel"]],
  preparing: [["packed","Mark packed"]],
  packed: [["ready","Mark ready"]],
  ready: [["out_for_delivery","Out for delivery"]],
  out_for_delivery: [["delivered","Mark delivered"]],
};
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

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("active");

  const load = () => api.get("/orders/mine").then(r=>setOrders(r.data.orders||[])).catch(()=>setOrders([]));
  useEffect(()=>{ load(); const t = setInterval(load, 10000); return ()=>clearInterval(t); }, []);

  const updateStatus = async (o, status) => {
    try {
      await api.post(`/orders/${o.id}/status`, { status });
      toast.success(`Order updated: ${status.replace(/_/g," ")}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
    }
  };

  const activeStatuses = new Set(["placed","accepted","preparing","packed","ready","out_for_delivery"]);
  const list = (orders || []).filter(o => filter==="all" ? true : filter==="active" ? activeStatuses.has(o.status) : filter==="done" ? o.status==="delivered" : ["cancelled","rejected"].includes(o.status));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Orders</div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter font-display">All customer orders</h1>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="rounded-full bg-gray-100 p-1">
            <TabsTrigger data-testid="of-active" value="active" className="rounded-full data-[state=active]:bg-white">Active</TabsTrigger>
            <TabsTrigger data-testid="of-done" value="done" className="rounded-full data-[state=active]:bg-white">Delivered</TabsTrigger>
            <TabsTrigger data-testid="of-cancelled" value="cancelled" className="rounded-full data-[state=active]:bg-white">Cancelled</TabsTrigger>
            <TabsTrigger data-testid="of-all" value="all" className="rounded-full data-[state=active]:bg-white">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-8 space-y-3">
        {orders === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-28 rounded-2xl"/>) :
        list.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-10 text-center text-gray-500">No orders in this view.</div>
        ) : list.map(o => (
          <div key={o.id} data-testid={`mo-row-${o.id}`} className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg">#{o.order_number}</div>
                  <Badge className={`${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"} hover:${STATUS_COLORS[o.status] || "bg-gray-100"}`}>{o.status.replace(/_/g," ")}</Badge>
                </div>
                <div className="mt-1 text-sm text-gray-600">{o.consumer_name} · {o.consumer_phone}</div>
                <div className="text-xs text-gray-500 mt-1">{o.address}, {o.city} - {o.pincode}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">₹{o.total.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">{o.payment_method}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm">
                {o.items.map((it,i)=>(
                  <div key={i} className="flex justify-between">
                    <span>×{it.quantity} {it.name}</span>
                    <span className="text-gray-500">₹{it.line_total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-start flex-wrap justify-end">
                {(NEXT_STATUS[o.status] || []).map(([st, lbl]) => (
                  <Button key={st} data-testid={`mo-act-${o.id}-${st}`} onClick={()=>updateStatus(o, st)}
                    className={`rounded-full h-9 px-4 text-sm ${st==="rejected"||st==="cancelled" ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-[#6C3BFF] hover:bg-[#5A2FE0] text-white"}`}>{lbl}</Button>
                ))}
              </div>
            </div>
            {o.status === "out_for_delivery" && (
              <div className="mt-3 text-xs text-gray-500">Delivery OTP: <span className="font-mono font-bold text-gray-800">{o.delivery_otp}</span></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
