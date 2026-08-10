import { useEffect, useState } from "react";
import { MapPin, Search, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

/**
 * City picker modal. Consumers must pick a city before shopping, because pricing
 * varies by city and admins only make SKUs live where they've stocked them.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange(open)
 *  - onSelect(cityName): called after successful selection
 *  - current: currently selected city (highlighted with a checkmark)
 *  - mandatory: if true, cannot be dismissed until a city is picked
 */
export default function CitySelector({ open, onOpenChange, onSelect, current, mandatory = false }) {
  const [cities, setCities] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    api.get("/products/cities").then(r => setCities(r.data.cities || [])).catch(() => setCities([]));
  }, [open]);

  const filtered = (cities || []).filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!mandatory || v) onOpenChange(v); }}>
      <DialogContent className="max-w-md rounded-3xl" onInteractOutside={(e) => { if (mandatory) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (mandatory) e.preventDefault(); }}>
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mb-2"><MapPin className="w-6 h-6 text-[#22C55E]"/></div>
          <DialogTitle className="font-display tracking-tight text-2xl">Which city are we delivering to?</DialogTitle>
          <DialogDescription>
            We deliver Pan India. Choose your city for local pricing (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <Input data-testid="city-search" placeholder="Search cities…" value={q} onChange={(e)=>setQ(e.target.value)} className="pl-10 rounded-xl h-11 bg-[#FFF8ED] border-[#F1EAD8]"/>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto -mx-2 px-2">
          <button data-testid="city-pick-pan-india"
            onClick={() => { onSelect(""); onOpenChange(false); }}
            className={`w-full text-left rounded-2xl border-2 px-4 py-3 mb-2 transition-all ${!current ? "border-[#22C55E] bg-[#DCFCE7]" : "border-[#F1EAD8] bg-white hover:border-[#22C55E]/50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold font-display text-base">Pan India</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Browse everything · pricing shown as default</div>
              </div>
              {!current && <Check className="w-4 h-4 text-[#22C55E]"/>}
            </div>
          </button>
          {cities === null ? (
            <div className="py-8 text-center text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin mx-auto"/></div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              {cities.length === 0
                ? "Pan India catalog active. City-specific pricing coming soon."
                : "No cities match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(c => {
                const active = current === c.name;
                return (
                  <button key={c.name} data-testid={`city-pick-${c.name}`}
                    onClick={() => { onSelect(c.name); onOpenChange(false); }}
                    className={`text-left rounded-2xl border-2 px-4 py-3 transition-all ${active ? "border-[#22C55E] bg-[#DCFCE7]" : "border-[#F1EAD8] bg-white hover:border-[#22C55E]/50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold font-display text-base">{c.name}</div>
                      {active && <Check className="w-4 h-4 text-[#22C55E]"/>}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{c.sku_count} items live</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!mandatory && (
          <div className="mt-2 text-center">
            <Button variant="ghost" onClick={()=>onOpenChange(false)} className="text-xs text-gray-500">Cancel</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
