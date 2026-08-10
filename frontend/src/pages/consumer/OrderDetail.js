import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Truck, Check } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const FLOW = ["placed", "accepted", "preparing", "packed", "ready", "out_for_delivery", "delivered"];

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => {
    api.get(`/orders/${orderId}`).then(r=>setOrder(r.data.order)).catch(()=>setOrder(false));
  }, [orderId]);
  if (order === null) return <div className="p-8 max-w-3xl mx-auto"><Skeleton className="h-96 rounded-3xl"/></div>;
  if (order === false) return <div className="p-8 text-center text-gray-500">Order not found</div>;

  const currentStep = FLOW.indexOf(order.status);
  const isCancel = ["cancelled","rejected","refunded"].includes(order.status);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/orders" data-testid="od-back" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#6C3BFF] text-sm font-semibold"><ArrowLeft className="w-4 h-4"/> Orders</Link>
        <div className="mt-4 rounded-3xl bg-white border border-gray-100 mm-shadow-soft p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Order #{order.order_number}</div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">{order.shop_name}</h1>
              <div className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-2xl">₹{order.total.toFixed(2)}</div>
              <Badge className="bg-[#F3EEFF] text-[#6C3BFF] hover:bg-[#F3EEFF] mt-1">{order.payment_method}</Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              {FLOW.map((s, i) => (<div key={s} className="text-center flex-1 capitalize">{s.replace(/_/g," ")}</div>))}
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-[#22C55E] transition-all" style={{width: isCancel ? "0%" : `${((currentStep+1)/FLOW.length)*100}%`}}/>
            </div>
            {isCancel && <div className="mt-3 text-sm text-red-600 font-semibold capitalize">{order.status}</div>}
            {!isCancel && order.delivery_otp && (
              <div data-testid="delivery-otp" className="mt-4 rounded-2xl border border-gray-100 p-4 bg-[#F0FDF4] text-[#166534] flex items-center gap-3">
                <Truck className="w-5 h-5"/>
                <div className="flex-1">
                  <div className="font-semibold">Delivery OTP</div>
                  <div className="text-xs">Share this code with your delivery partner on arrival.</div>
                </div>
                <div className="text-2xl font-bold font-mono tracking-widest">{order.delivery_otp}</div>
              </div>
            )}
          </div>

          {/* Delivery details */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Delivery address</div>
              <div className="mt-2 flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#6C3BFF]"/><div className="text-sm">{order.address}<br/>{order.city} - {order.pincode}</div></div>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Contact</div>
              <div className="mt-2 flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-[#6C3BFF]"/>{order.consumer_phone}</div>
              <div className="text-xs text-gray-500 mt-1">Slot: {order.delivery_slot}</div>
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold tracking-tight">Items</h3>
            <div className="mt-3 divide-y divide-gray-100">
              {order.items.map((it, i)=>(
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F3EEFF] text-[#6C3BFF] text-xs font-bold flex items-center justify-center">×{it.quantity}</div>
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-gray-500">{it.unit}</div>
                    </div>
                  </div>
                  <div className="font-semibold">₹{it.line_total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F9FAFB] p-4 space-y-1 text-sm">
            <Row label="Subtotal" value={`₹${order.subtotal.toFixed(2)}`}/>
            <Row label="Delivery" value={order.delivery_fee===0?"FREE":`₹${order.delivery_fee.toFixed(2)}`}/>
            <Row label="Platform fee" value={`₹${order.platform_fee.toFixed(2)}`}/>
            <Row label="GST" value={`₹${order.gst.toFixed(2)}`}/>
            <div className="border-t border-gray-200 my-2"/>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{order.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({label, value}){return <div className="flex justify-between text-gray-600"><span>{label}</span><span className="text-gray-900 font-semibold">{value}</span></div>;}
