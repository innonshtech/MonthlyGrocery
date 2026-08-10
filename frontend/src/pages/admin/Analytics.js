import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalytics() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.get("/orders/mine").then(r=>setOrders(r.data.orders||[])).catch(()=>setOrders([])); }, []);

  if (orders === null) return <Skeleton className="h-96 rounded-3xl"/>;

  // Top products by qty
  const productMap = {};
  orders.forEach(o => o.items.forEach(it => {
    productMap[it.name] = (productMap[it.name] || 0) + it.quantity;
  }));
  const topProducts = Object.entries(productMap).map(([name, qty])=>({name, qty})).sort((a,b)=>b.qty-a.qty).slice(0,7);

  // Revenue by weekday
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const wd = weekdays.map(d=>({day:d, revenue:0}));
  orders.forEach(o=>{ const d = new Date(o.created_at).getDay(); wd[d].revenue += o.total; });

  const COLORS = ["#6C3BFF", "#8B5CF6", "#22C55E", "#0EA5E9", "#F59E0B", "#EF4444", "#EC4899"];

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Analytics</div>
      <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Insights</h1>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
          <h3 className="text-lg font-semibold tracking-tight">Revenue by weekday</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wd}>
                <CartesianGrid stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:"#9CA3AF", fontSize:12}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#9CA3AF", fontSize:12}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:12, border:"1px solid #F3F4F6"}}/>
                <Bar dataKey="revenue" fill="#6C3BFF" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[20px] bg-white border border-gray-100 mm-shadow-soft p-6">
          <h3 className="text-lg font-semibold tracking-tight">Top products</h3>
          {topProducts.length === 0 ? (
            <div className="mt-8 text-center text-gray-500">No orders yet.</div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid stroke="#F3F4F6" horizontal={false}/>
                  <XAxis type="number" tick={{fill:"#9CA3AF", fontSize:12}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{fill:"#4B5563", fontSize:12}} width={110} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{borderRadius:12, border:"1px solid #F3F4F6"}}/>
                  <Bar dataKey="qty" radius={[0,8,8,0]}>
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
