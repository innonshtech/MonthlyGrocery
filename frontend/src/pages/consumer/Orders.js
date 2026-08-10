import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  refunded: "bg-gray-100 text-gray-700",
};

export default function ConsumerOrders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    api.get("/orders/mine").then((r) => setOrders(r.data.orders || [])).catch(()=>setOrders([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/shop" data-testid="orders-back" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#6C3BFF] text-sm font-semibold"><ArrowLeft className="w-4 h-4"/> Back</Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Your orders</h1>

        <div className="mt-6 space-y-3">
          {orders === null ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>) :
          orders.length === 0 ? (
            <div className="rounded-3xl bg-white border border-dashed border-gray-200 p-16 text-center">
              <Package className="w-10 h-10 mx-auto text-gray-300"/>
              <div className="mt-3 text-lg font-semibold">No orders yet</div>
              <div className="text-sm text-gray-500 mt-1">Your future orders will show up here.</div>
            </div>
          ) : orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} data-testid={`order-row-${o.id}`} className="block rounded-2xl bg-white border border-gray-100 mm-shadow-soft card-lift p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Order #{o.order_number}</div>
                  <div className="mt-1 font-semibold text-lg">{o.shop_name}</div>
                  <div className="text-sm text-gray-500">{o.items.length} items · {new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">₹{o.total.toFixed(2)}</div>
                  <Badge className={`mt-1 ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"} hover:${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}>{o.status.replace(/_/g," ")}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
