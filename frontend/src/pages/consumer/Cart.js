import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, PartyPopper } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import ProductImage from "@/components/ProductImage";

export default function CartPage() {
  const { cart, updateQty } = useCart();
  const navigate = useNavigate();
  const MIN_ORDER = 2500;
  const short = Math.max(0, MIN_ORDER - cart.subtotal);
  const canCheckout = cart.subtotal >= MIN_ORDER;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/shop" data-testid="cart-back" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#22C55E] text-sm font-semibold"><ArrowLeft className="w-4 h-4"/> Continue shopping</Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Your cart</h1>

        {cart.items.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white border border-dashed border-gray-200 p-16 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto text-gray-300"/>
            <div className="mt-3 text-lg font-semibold">Your cart is empty</div>
            <div className="text-sm text-gray-500 mt-1">Add products from your favourite categories to see them here.</div>
            <Link to="/shop"><Button className="mt-6 rounded-full bg-[#22C55E] hover:bg-[#16A34A]">Browse groceries</Button></Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {cart.savings > 0 && (
                <div data-testid="cart-savings-banner" className="rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white p-4 flex items-center gap-3 mm-shadow-soft">
                  <PartyPopper className="w-6 h-6"/>
                  <div className="flex-1">
                    <div className="font-bold">You'll save ₹{cart.savings.toFixed(0)} on this order</div>
                    <div className="text-xs opacity-90">That's {cart.savings_percent}% off MRP</div>
                  </div>
                </div>
              )}
              {cart.items.map((it) => (
                <div key={it.product_id} data-testid={`cart-line-${it.product_id}`} className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-4 flex items-center gap-4">
                  <ProductImage product={it} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#22C55E] font-semibold uppercase tracking-widest">{it.secondary_category || it.primary_category}</div>
                    <div className="font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.unit} · {it.brand}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="font-bold">₹{it.price}</div>
                      {it.mrp > it.price && <div className="text-xs text-gray-400 line-through">₹{it.mrp}</div>}
                      {it.line_savings > 0 && <div className="text-xs text-[#22C55E] font-semibold">Save ₹{it.line_savings.toFixed(0)}</div>}
                    </div>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                    <button data-testid={`cart-dec-${it.product_id}`} onClick={()=>updateQty(it.product_id, it.quantity-1)} className="w-9 h-9 rounded-full"><Minus className="w-3.5 h-3.5 mx-auto"/></button>
                    <div className="w-8 text-center font-semibold">{it.quantity}</div>
                    <button data-testid={`cart-inc-${it.product_id}`} onClick={()=>updateQty(it.product_id, it.quantity+1)} className="w-9 h-9 rounded-full"><Plus className="w-3.5 h-3.5 mx-auto"/></button>
                  </div>
                  <button data-testid={`cart-remove-${it.product_id}`} onClick={()=>updateQty(it.product_id, 0)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-6 h-fit sticky top-24">
              <h3 className="text-lg font-semibold tracking-tight">Bill summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <Row label={`Item total (at MRP)`} value={`₹${cart.mrp_total.toFixed(2)}`} strike/>
                {cart.savings > 0 && <Row label={`MonthlyGrocery discount (${cart.savings_percent}%)`} value={`− ₹${cart.savings.toFixed(2)}`} tone="green"/>}
                <Row label="Subtotal" value={`₹${cart.subtotal.toFixed(2)}`}/>
                <Row label="Delivery fee" value="FREE" tone="green"/>
                <Row label="Platform fee" value="FREE" tone="green"/>
                <div className="border-t border-gray-100 my-3"/>
                <div className="flex items-center justify-between text-base font-bold"><span>Grand total</span><span data-testid="cart-total">₹{cart.total.toFixed(2)}</span></div>
                {cart.savings > 0 && (
                  <div data-testid="cart-total-savings" className="mt-2 rounded-xl bg-[#DCFCE7] text-[#166534] text-center py-2 text-xs font-bold">
                    🎉 You save ₹{cart.savings.toFixed(0)} on this order
                  </div>
                )}
              </div>
              {!canCheckout && (
                <div data-testid="min-order-warning" className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                  Add <span className="font-bold">₹{short.toFixed(0)}</span> more to reach the minimum monthly order of ₹2,500.
                </div>
              )}
              <Button data-testid="cart-checkout" disabled={!canCheckout} onClick={()=>navigate("/checkout")} className="mt-4 w-full rounded-full h-11 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50">
                {canCheckout ? "Proceed to checkout" : `₹${short.toFixed(0)} away from minimum`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strike, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${tone==='green' ? "text-[#166534]" : "text-gray-900"} ${strike ? "line-through text-gray-400" : ""}`}>{value}</span>
    </div>
  );
}
