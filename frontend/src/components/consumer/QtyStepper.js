import { useState } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

/**
 * Zepto / Swiggy Instamart style ADD button that swaps into +/- stepper once added.
 * - Reads current qty from live cart.
 * - Optimistic UX with loading spinner during API calls.
 */
export default function QtyStepper({ product, size = "md" }) {
  const { cart, addToCart, updateQty } = useCart();
  const [busy, setBusy] = useState(false);
  const inCart = cart.items.find(i => i.product_id === product.id);
  const qty = inCart?.quantity || 0;

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  const doAdd = async (e) => {
    stop(e);
    if (busy) return;
    setBusy(true);
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not add");
    } finally { setBusy(false); }
  };

  const doInc = async (e) => {
    stop(e);
    if (busy) return;
    setBusy(true);
    try { await updateQty(product.id, qty + 1); }
    catch (err) { toast.error(err.response?.data?.detail || "Update failed"); }
    finally { setBusy(false); }
  };

  const doDec = async (e) => {
    stop(e);
    if (busy) return;
    setBusy(true);
    try { await updateQty(product.id, Math.max(0, qty - 1)); }
    catch (err) { toast.error(err.response?.data?.detail || "Update failed"); }
    finally { setBusy(false); }
  };

  const height = size === "lg" ? "h-11" : size === "sm" ? "h-7" : "h-9";
  const width = size === "lg" ? "min-w-[104px]" : size === "sm" ? "min-w-[68px]" : "min-w-[84px]";
  const textCls = size === "lg" ? "text-sm" : "text-xs";

  if (qty === 0) {
    return (
      <button data-testid={`add-cart-${product.id}`} onClick={doAdd} disabled={busy}
        className={`${height} ${width} rounded-lg border-2 border-[#22C55E] bg-white text-[#166534] ${textCls} font-bold uppercase tracking-wider hover:bg-[#DCFCE7] active:scale-95 transition-all flex items-center justify-center gap-1`}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : "ADD"}
      </button>
    );
  }

  return (
    <div data-testid={`qty-stepper-${product.id}`} className={`${height} ${width} rounded-lg bg-[#22C55E] text-white flex items-center justify-between px-1 shadow-sm`}>
      <button data-testid={`qty-dec-${product.id}`} onClick={doDec} disabled={busy} className="w-7 h-full flex items-center justify-center hover:bg-white/15 rounded-md active:scale-90 transition-transform">
        <Minus className="w-3.5 h-3.5"/>
      </button>
      <div className={`${textCls} font-bold`} data-testid={`qty-value-${product.id}`}>{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : qty}</div>
      <button data-testid={`qty-inc-${product.id}`} onClick={doInc} disabled={busy} className="w-7 h-full flex items-center justify-center hover:bg-white/15 rounded-md active:scale-90 transition-transform">
        <Plus className="w-3.5 h-3.5"/>
      </button>
    </div>
  );
}
