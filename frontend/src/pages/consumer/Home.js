import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search, ShoppingCart, Package, LogOut, Sparkles, Zap, Flame, ChevronRight, Clock, Timer, ChevronDown, User } from "lucide-react";

import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import MonthlyGroceryLogo from "@/components/MonthlyGroceryLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/consumer/BottomNav";
import QtyStepper from "@/components/consumer/QtyStepper";
import CitySelector from "@/components/consumer/CitySelector";
import ProductImage from "@/components/ProductImage";

// Themed visual per category — matched by keyword so admin-defined categories
// (e.g. "Atta & Flour", "Edible Oils", "Dal & Pulses", "Biscuits", "Sugar", …)
// all pick up an appropriate emoji + soft gradient background automatically.
const CAT_THEMES = [
  { match: ["oil", "ghee", "tel"],                     emoji: "🫒", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", ring: "#F59E0B" },
  { match: ["rice", "chawal", "basmati"],              emoji: "🍚", bg: "linear-gradient(135deg, #FEFCE8 0%, #FEF3C7 100%)", ring: "#EAB308" },
  { match: ["atta", "flour", "wheat", "maida", "besan"], emoji: "🌾", bg: "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)", ring: "#D97706" },
  { match: ["sugar", "shakkar", "gud", "jaggery"],     emoji: "🍬", bg: "linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)", ring: "#F43F5E" },
  { match: ["dal", "pulse", "lentil", "grain", "beans"], emoji: "🫘", bg: "linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)", ring: "#EA580C" },
  { match: ["spice", "masala", "salt", "chilli"],      emoji: "🌶️", bg: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)", ring: "#DC2626" },
  { match: ["dairy", "milk", "curd", "paneer", "butter"], emoji: "🥛", bg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)", ring: "#3B82F6" },
  { match: ["cooking essential", "essentials"],        emoji: "🧂", bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", ring: "#22C55E" },
  { match: ["biscuit", "cookie", "cracker"],           emoji: "🍪", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", ring: "#B45309" },
  { match: ["snack", "chip", "namkeen"],               emoji: "🍿", bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", ring: "#DB2777" },
  { match: ["beverage", "drink", "juice", "tea", "coffee", "chai"], emoji: "🥤", bg: "linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)", ring: "#0891B2" },
  { match: ["household", "clean", "detergent", "soap bar", "laundry"], emoji: "🧴", bg: "linear-gradient(135deg, #E9D5FF 0%, #D8B4FE 100%)", ring: "#9333EA" },
  { match: ["personal care", "shampoo", "soap", "toothpaste", "hygiene"], emoji: "🧼", bg: "linear-gradient(135deg, #FCE7F3 0%, #F5D0FE 100%)", ring: "#C026D3" },
  { match: ["instant", "noodle", "ready", "maggi", "pasta"], emoji: "🍜", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", ring: "#D97706" },
  { match: ["baby", "diaper", "kids"],                 emoji: "🍼", bg: "linear-gradient(135deg, #FFE4E6 0%, #FBCFE8 100%)", ring: "#EC4899" },
  { match: ["pet", "dog", "cat food"],                 emoji: "🐾", bg: "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)", ring: "#B45309" },
  { match: ["fruit", "veg", "vegetable", "produce", "sabzi"], emoji: "🥦", bg: "linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)", ring: "#16A34A" },
  { match: ["dry fruit", "nut", "kaju", "badam"],      emoji: "🥜", bg: "linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)", ring: "#B45309" },
  { match: ["frozen", "ice cream"],                    emoji: "🧊", bg: "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)", ring: "#2563EB" },
  { match: ["grocery", "general", "kirana", "staple"], emoji: "🛒", bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", ring: "#16A34A" },
];

function themeForCategory(name) {
  const key = (name || "").toLowerCase();
  for (const t of CAT_THEMES) {
    if (t.match.some(k => key.includes(k))) return t;
  }
  return { emoji: "🛒", bg: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)", ring: "#6B7280" };
}

// Fixed theme for the "All" pseudo-category.
const ALL_THEME = { emoji: "🏪", bg: "linear-gradient(135deg, #0B1220 0%, #1F2937 100%)", ring: "#0B1220", light: false };

// Cycled through when a Super Admin uploads banners without picking a gradient.
const DEFAULT_GRADIENTS = [
  "linear-gradient(135deg, #22C55E 0%, #15803D 100%)",
  "linear-gradient(135deg, #0B1220 0%, #1F2937 100%)",
  "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
  "linear-gradient(135deg, #6C3BFF 0%, #4C1D95 100%)",
  "linear-gradient(135deg, #DB2777 0%, #831843 100%)",
];

export default function ConsumerHome() {
  const { user, logout } = useAuth();
  const { cart, city, setCity } = useCart();
  const [products, setProducts] = useState(null);
  const [tree, setTree] = useState([]);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [banners, setBanners] = useState(null); // null = still loading; [] = none

  useEffect(() => {
    // Pan India by default — city selection is optional (opens on demand only).
  }, []);

  useEffect(() => {
    api.get("/banners/active")
      .then(r => setBanners(r.data.banners || []))
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    api.get(`/products/tree${params}`)
      .then(r => setTree(r.data.categories || []))
      .catch(() => setTree([]));
  }, [city]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (primary) params.set("category", primary);
    if (secondary) params.set("secondary", secondary);
    if (q.trim()) params.set("q", q.trim());
    setSearching(true);
    api.get(`/products/all?${params.toString()}`)
      .then(r=>setProducts(r.data.products || []))
      .catch(()=>setProducts([]))
      .finally(()=>setSearching(false));
  }, [primary, secondary, q, city]);

  const currentSubs = useMemo(() => {
    if (!primary) return [];
    const node = tree.find(t => t.name === primary);
    return node ? node.subs : [];
  }, [primary, tree]);

  const clearFilters = () => { setPrimary(null); setSecondary(null); setQ(""); };

  const featured = (products || []).filter(p => p.featured);
  const deals = (products || []).filter(p => p.todays_deal);

  return (
    <div className="min-h-screen bg-[#FFF8ED] pb-28 lg:pb-8">
      {/* ---------- STICKY HEADER — Zepto-style single row with big search ---------- */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#F1EAD8]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 lg:gap-6">
          {/* Logo */}
          <div className="shrink-0"><MonthlyGroceryLogo size="sm"/></div>

          {/* Location — desktop */}
          <button data-testid="city-btn" onClick={()=>setCityOpen(true)}
            className="hidden md:flex items-center gap-1.5 shrink-0 text-sm font-semibold text-gray-800 hover:text-[#22C55E] group">
            <MapPin className="w-4 h-4 text-[#22C55E]"/>
            <span className="truncate max-w-[160px]">{city || "Select Location"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#22C55E]"/>
          </button>

          {/* Location — mobile compact */}
          <button data-testid="mobile-city-btn" onClick={()=>setCityOpen(true)}
            className="md:hidden inline-flex items-center gap-1 text-xs font-semibold text-gray-700 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#22C55E]"/>
            <span className="truncate max-w-[90px]">{city || "Pan India"}</span>
            <ChevronDown className="w-3 h-3 text-gray-400"/>
          </button>

          {/* Big central search — grows */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <Input data-testid="search-input" placeholder='Search for "atta", "dal", "तेल"…' value={q} onChange={(e)=>setQ(e.target.value)}
              className="pl-11 rounded-2xl h-12 bg-[#F5F3EE] border-transparent focus-visible:ring-2 focus-visible:ring-[#22C55E]/30 focus-visible:border-[#22C55E]/40 text-sm"/>
          </div>

          {/* Profile — icon only */}
          {user && user !== false ? (
            <button data-testid="nav-profile" onClick={logout} title="Log out"
              className="hidden md:flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#22C55E] shrink-0 px-2">
              <User className="w-5 h-5"/>
              <span className="text-[10px] font-semibold">Profile</span>
            </button>
          ) : (
            <Link to="/login" data-testid="nav-login"
              className="hidden md:flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#22C55E] shrink-0 px-2">
              <User className="w-5 h-5"/>
              <span className="text-[10px] font-semibold">Sign in</span>
            </Link>
          )}

          {/* Cart — always visible, badge shows count */}
          <Link to="/cart" data-testid="nav-cart"
            className="relative flex flex-col items-center gap-0.5 text-gray-800 hover:text-[#22C55E] shrink-0 px-2">
            <div className="relative">
              <ShoppingCart className="w-5 h-5"/>
              {cart.items.length > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#22C55E] text-white text-[10px] font-bold ring-2 ring-white">{cart.items.length}</span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Cart</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-4">
        {/* ---------- MAIN CATEGORIES — Zepto-style circles ---------- */}
        <section className="mb-6" data-testid="top-categories">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-2xl font-semibold tracking-tight font-display">
              {user && user !== false ? "Buy Again" : "Shop by category"}
            </h2>
            {(primary || secondary || q) && (
              <button onClick={clearFilters} data-testid="clear-filters-top" className="text-xs lg:text-sm font-semibold text-[#22C55E]">Clear filters</button>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 snap-x snap-mandatory">
            <button data-testid="cat-top-all" onClick={()=>{setPrimary(null); setSecondary(null);}}
              className="shrink-0 snap-start w-20 flex flex-col items-center gap-2 group">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative transition-all ${!primary ? "ring-2 ring-[#22C55E] ring-offset-2" : ""}`} style={{backgroundImage: ALL_THEME.bg}}>
                <span className="drop-shadow-sm">{ALL_THEME.emoji}</span>
              </div>
              <div className={`text-xs font-semibold text-center leading-tight line-clamp-2 min-h-[2rem] ${!primary ? "text-[#22C55E]" : "text-gray-800"}`}>All Items</div>
            </button>
            {tree.map((c) => {
              const t = themeForCategory(c.name);
              const active = primary === c.name;
              return (
                <button key={c.name} data-testid={`cat-top-${c.name}`} onClick={()=>{setPrimary(active ? null : c.name); setSecondary(null);}}
                  className="shrink-0 snap-start w-20 flex flex-col items-center gap-2 group">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative transition-all ${active ? "ring-2 ring-offset-2" : ""}`}
                    style={{ backgroundImage: t.bg, ["--tw-ring-color"]: active ? t.ring : undefined }}>
                    <span className="drop-shadow-sm">{t.emoji}</span>
                  </div>
                  <div className={`text-xs font-semibold text-center leading-tight line-clamp-2 min-h-[2rem] ${active ? "text-[#22C55E]" : "text-gray-800"}`}>{c.name}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------- HERO BANNERS (managed by Super Admin, with default fallback) ---------- */}
        <section className="mb-6">
          <div className="flex gap-3 lg:grid lg:grid-cols-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
            {(banners !== null && banners.length > 0)
              ? banners.map((b, i) => (
                  <HeroBanner
                    key={b.id}
                    tag={b.tag || "Featured"}
                    title={b.title}
                    subtitle={b.subtitle}
                    imageUrl={b.image_url}
                    gradient={b.gradient || DEFAULT_GRADIENTS[i % DEFAULT_GRADIENTS.length]}
                    icon={b.icon || "🛒"}
                    ctaUrl={b.cta_url}
                    testid={`hero-${b.id}`}
                  />
                ))
              : (
                <>
                  <HeroBanner
                    tag="Pan India Launch"
                    title="Mahine ka kirana"
                    subtitle="₹2,500+ ke order par bachat"
                    gradient="linear-gradient(135deg, #22C55E 0%, #15803D 100%)"
                    icon="🛒"
                    testid="hero-1"
                  />
                  <HeroBanner
                    tag="Free Delivery"
                    title="4 ghante mein ghar"
                    subtitle="Har order par · No hidden fees"
                    gradient="linear-gradient(135deg, #0B1220 0%, #1F2937 100%)"
                    icon="⚡"
                    testid="hero-2"
                  />
                  <HeroBanner
                    tag="Hinglish Search"
                    title="Type 'तेल' या 'atta'"
                    subtitle="Apni bhasha mein khoj"
                    gradient="linear-gradient(135deg, #F97316 0%, #C2410C 100%)"
                    icon="🔎"
                    testid="hero-3"
                  />
                </>
              )
            }
          </div>
        </section>

        {/* ---------- MOBILE PRODUCT GRID (categories are now at the top) ---------- */}
        <div className="lg:hidden">
          {primary && currentSubs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
              <SubPill label={`All ${primary}`} active={!secondary} onClick={()=>setSecondary(null)} testid="sub-all-m"/>
              {currentSubs.map(s => (
                <SubPill key={s.name} label={`${s.name} (${s.count})`} active={secondary === s.name} onClick={()=>setSecondary(s.name)} testid={`sub-m-${s.name}`}/>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold tracking-tight font-display">
              {q ? `Results for "${q}"` : secondary ? `${primary} · ${secondary}` : primary ? primary : "Sab kirana"}
            </h2>
            <div className="text-xs text-gray-500">{(products || []).length} items</div>
          </div>
          {products === null || searching ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-52 rounded-2xl"/>)}</div>
          ) : (products || []).length === 0 ? (
            <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-8 text-center">
              <div className="font-semibold">Kuch nahi mila</div>
              <div className="text-xs text-gray-500 mt-1">Doosra shabd try karo</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(products || []).map(p => <ProductCardMobile key={p.id} p={p}/>)}
            </div>
          )}
        </div>

        {/* ---------- DESKTOP LAYOUT ---------- */}
        <div className="hidden lg:block">
          {primary && currentSubs.length > 0 && (
            <section className="mb-8">
              <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 flex items-center gap-1">{primary} <ChevronRight className="w-3 h-3"/> Sub-category</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <SubPill label={`All ${primary}`} active={!secondary} onClick={()=>setSecondary(null)} testid="sub-all"/>
                {currentSubs.map(s => (
                  <SubPill key={s.name} label={`${s.name} (${s.count})`} active={secondary === s.name} onClick={()=>setSecondary(s.name)} testid={`sub-${s.name}`}/>
                ))}
              </div>
            </section>
          )}

          {!primary && !secondary && !q && deals.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold tracking-tight font-display flex items-center gap-2"><Flame className="w-5 h-5 text-[#EF4444]"/> Aaj ke offers</h2>
              </div>
              <ProductGrid products={deals}/>
            </section>
          )}
          {!primary && !secondary && !q && featured.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold tracking-tight font-display">Aapke liye chuni gayi</h2>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#22C55E]"><Sparkles className="w-3.5 h-3.5"/> Handpicked</div>
              </div>
              <ProductGrid products={featured}/>
            </section>
          )}

          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold tracking-tight font-display">
                {q ? `Results for "${q}"` : secondary ? `${primary} · ${secondary}` : primary ? primary : "Sab kirana"}
              </h2>
              <div className="text-sm text-gray-500">{(products || []).length} items</div>
            </div>
            {products === null || searching ? <GridSkeleton/> :
            (products || []).length === 0 ? (
              <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-16 text-center">
                <div className="text-lg font-semibold">Kuch nahi mila</div>
                <div className="text-sm text-gray-500 mt-1">Doosra shabd try karo — Hindi ya English, dono chalta hai.</div>
                <Button onClick={clearFilters} className="mt-4 rounded-full bg-[#22C55E] hover:bg-[#16A34A]">Show all</Button>
              </div>
            ) : <ProductGrid products={products}/>}
          </section>
        </div>
      </main>

      {/* ---------- STICKY MOBILE CART CTA ---------- */}
      {cart.items.length > 0 && (
        <Link to="/cart" data-testid="mobile-cart-cta" className="lg:hidden fixed bottom-16 left-4 right-4 z-40 rounded-2xl bg-[#22C55E] text-white shadow-[0_16px_40px_rgba(34,197,94,0.35)] p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{cart.items.length} items · ₹{cart.subtotal?.toFixed(0)}</div>
            <div className="text-sm font-bold">View cart</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><ShoppingCart className="w-4 h-4"/></div>
        </Link>
      )}

      <BottomNav/>

      <CitySelector open={cityOpen} onOpenChange={setCityOpen} onSelect={setCity} current={city} mandatory={false}/>
    </div>
  );
}

/* ------------- SUB COMPONENTS ------------- */

function HeroBanner({ tag, title, subtitle, gradient, imageUrl, icon, ctaUrl, testid }) {
  const bgStyle = imageUrl
    ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%), url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundImage: gradient };
  const inner = (
    <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} data-testid={testid} className="rounded-2xl overflow-hidden relative border border-gray-100 mm-shadow-soft snap-start min-w-[85%] lg:min-w-0 h-full" style={bgStyle}>
      <div className="p-5 flex items-center gap-4 text-white h-full">
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          {tag && <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">{tag}</div>}
          <div className="mt-1 text-lg font-bold tracking-tight font-display leading-tight line-clamp-2">{title}</div>
          {subtitle && <div className="text-xs text-white/80 mt-0.5 line-clamp-2">{subtitle}</div>}
        </div>
      </div>
    </motion.div>
  );
  if (ctaUrl) {
    const isExternal = /^https?:\/\//i.test(ctaUrl);
    return isExternal
      ? <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="block h-full">{inner}</a>
      : <Link to={ctaUrl} className="block h-full">{inner}</Link>;
  }
  return inner;
}

function SubPill({ label, active, onClick, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap ${active ? "bg-[#22C55E] text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-[#22C55E]"}`}>{label}</button>
  );
}

function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {products.map((p) => <ProductCard key={p.id} p={p}/>)}
    </div>
  );
}

function ProductCard({ p }) {
  return (
    <Link to={`/products/${p.id}`} data-testid={`product-card-${p.id}`} className="block rounded-2xl bg-white border border-gray-100 mm-shadow-soft card-lift overflow-hidden group">
      <div className="relative">
        <ProductImage product={p} className="aspect-square bg-[#FAFAFA] relative"/>
        {/* Floating ADD/qty stepper — Zepto style */}
        <div className="absolute bottom-2 right-2 z-10" onClick={(e)=>e.preventDefault()}>
          <QtyStepper product={p}/>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#22C55E] text-white text-sm font-bold px-2 py-0.5">₹{p.price}</div>
          {p.mrp > p.price && <div className="text-xs text-gray-400 line-through">₹{p.mrp}</div>}
        </div>
        {p.discount_percent > 0 && <div className="mt-1 text-[10px] font-bold text-[#166534] uppercase tracking-widest">₹{Math.round(p.mrp - p.price)} OFF</div>}
        <div className="mt-1.5 text-sm font-semibold line-clamp-2 min-h-[2.5rem] text-gray-900">{p.name}</div>
        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {p.unit}</div>
      </div>
    </Link>
  );
}

function ProductCardMobile({ p }) {
  return (
    <Link to={`/products/${p.id}`} data-testid={`product-card-${p.id}`} className="block rounded-2xl bg-white border border-gray-100 overflow-hidden relative">
      <div className="relative">
        <ProductImage product={p} className="aspect-square bg-[#FAFAFA] relative" size="sm"/>
        <div className="absolute bottom-1.5 right-1.5 z-10" onClick={(e)=>e.preventDefault()}>
          <QtyStepper product={p} size="sm"/>
        </div>
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1.5">
          <div className="rounded-md bg-[#22C55E] text-white text-xs font-bold px-1.5 py-0.5">₹{p.price}</div>
          {p.mrp > p.price && <div className="text-[10px] text-gray-400 line-through">₹{p.mrp}</div>}
        </div>
        {p.discount_percent > 0 && <div className="mt-0.5 text-[9px] font-bold text-[#166534] uppercase tracking-widest">₹{Math.round(p.mrp - p.price)} OFF</div>}
        <div className="mt-1 text-xs font-semibold line-clamp-2 min-h-[2.2rem] text-gray-900">{p.name}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">{p.unit}</div>
      </div>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-64 rounded-2xl"/>)}
    </div>
  );
}
