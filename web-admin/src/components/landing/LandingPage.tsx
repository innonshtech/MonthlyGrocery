'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShoppingBag,
  Store,
  ShieldCheck,
  Truck,
  Sparkles,
  Star,
  Clock,
  MapPin,
  Percent,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogIn,
  X,
  Smartphone,
  Download,
  Gift,
  HelpCircle,
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import { API_BASE, resolveImageUrl } from '../../utils/api';

const LOGO_URL = "/ever-logo.png";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.monthlygrocerymobile";

interface DynamicBanner {
  id: string;
  kind?: 'image' | 'promo';
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  cta_text?: string;
  action_link?: string;
  active?: boolean;
}

interface DynamicCategory {
  id: string;
  name: string;
  image_url?: string;
}

export default function LandingPage() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [modalContext, setModalContext] = useState<string | null>(null);
  const [banners, setBanners] = useState<DynamicBanner[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [showStickyBottomBar, setShowStickyBottomBar] = useState(false);

  useEffect(() => {
    // Ensure document body is styled correctly for landing page
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF8ED';

    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowStickyBottomBar(true);
      } else {
        setShowStickyBottomBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.body.style.backgroundColor = prevBg;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch live banners and categories dynamically from backend
  useEffect(() => {
    let isMounted = true;

    async function loadDynamicContent() {
      try {
        const bannersRes = await fetch(`${API_BASE}/admin/banners`);
        if (bannersRes.ok) {
          const bData = await bannersRes.json();
          if (isMounted && bData.success && Array.isArray(bData.banners)) {
            setBanners(bData.banners.filter((b: DynamicBanner) => b.active !== false));
          }
        }
      } catch (err) {
        console.warn('[LandingPage] Could not load live banners:', err);
      }

      try {
        const catRes = await fetch(`${API_BASE}/admin/categories`);
        if (catRes.ok) {
          const cData = await catRes.json();
          if (isMounted && cData.success && Array.isArray(cData.categories)) {
            setCategories(cData.categories.slice(0, 12));
          }
        }
      } catch (err) {
        console.warn('[LandingPage] Could not load live categories:', err);
      }
    }

    loadDynamicContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-advance banner carousel if active banners exist
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const openAppDownload = (context?: string) => {
    setModalContext(context || null);
    setShowDownloadModal(true);
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF8ED] text-[#0B1220] relative overflow-x-hidden font-sans selection:bg-[#22C55E]/30 pb-20 md:pb-0">
      {/* Background dynamic ambient glow */}
      <div className="absolute top-20 -left-40 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-[#22C55E]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-80 -right-32 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-[#F97316]/15 blur-[140px] pointer-events-none" />

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="w-full bg-[#0B1220] text-white py-2 px-3 sm:px-4 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[#FCD34D] font-bold">
          <Truck className="w-3.5 h-3.5" /> 4-Hour Express Delivery
        </span>
        <span className="hidden sm:inline text-white/40">•</span>
        <span className="hidden sm:inline text-white/90">Pan India Home Delivery</span>
        <span className="hidden md:inline text-white/40">•</span>
        <span className="hidden md:inline text-emerald-400 font-bold">Minimum Order ₹1,000</span>
      </div>

      {/* HEADER */}
      <header className="w-full glass-nav sticky top-0 z-40 transition-all backdrop-blur-md bg-white/90 border-b border-[#F1EAD8]">
        <div className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-2.5 sm:py-3 flex items-center justify-between">
          <EverLogo size="lg" />
          <nav className="flex items-center gap-2 sm:gap-6">
            <a
              href="#categories"
              className="hidden md:inline-flex text-sm sm:text-base font-semibold text-gray-700 hover:text-[#22C55E] px-2 py-1 transition-colors"
            >
              Categories
            </a>
            <a
              href="#how"
              className="hidden md:inline-flex text-sm sm:text-base font-semibold text-gray-700 hover:text-[#22C55E] px-2 py-1 transition-colors"
            >
              How it works
            </a>
            <Link
              href="/privacy-policy"
              className="hidden sm:inline-flex text-sm font-semibold text-gray-600 hover:text-[#22C55E] px-2 py-1 transition-colors"
            >
              Privacy Policy
            </Link>
            
            {/* Get App Button */}
            <button
              type="button"
              onClick={() => openAppDownload('Navbar button')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-9 sm:h-11 px-3.5 sm:px-5 text-xs sm:text-sm font-bold mg-shadow-brand transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Get App</span>
            </button>

            {/* Admin Portal Button */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 hover:border-slate-800 text-slate-800 hover:text-white hover:bg-slate-900 h-9 sm:h-11 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              title="Admin & Operations Portal"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="w-full relative">
        {/* --------- HERO SECTION (Fluid, Mobile-Perfect, Zero Overflows) --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pt-5 sm:pt-8 pb-8 sm:pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm self-start mb-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              Live Delivery Pan India
            </div>

            <h1 className="mt-2 text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight font-display leading-[1.12] sm:leading-[1.06] text-[#0B1220]">
              Ghar ka <em className="not-italic bg-gradient-to-r from-[#22C55E] to-[#16A34A] bg-clip-text text-transparent">poora</em>
              <br />
              <span className="relative inline-block">
                mahine ka kirana.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 90 2, 180 6 T 298 4" stroke="#FCD34D" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-3.5 sm:mt-5 text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed max-w-2xl font-medium">
              Atta, chawal, dal, tel, ghee, chai, masale, sabun — <span className="font-bold text-[#0B1220]">poora mahine ka saamaan</span>, sealed pantry packs mein, aapke <span className="font-extrabold text-[#22C55E]">ghar par 4 ghante mein</span>. Har order par upto 20% ki bachat.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => openAppDownload('Hero Start Shopping')}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-13 sm:h-14 px-8 text-base font-bold mg-shadow-brand group transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer active:scale-98"
              >
                <span>Start shopping · Get App</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </button>
              
              <button
                type="button"
                onClick={() => openAppDownload('Hero View Offers')}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full h-12 sm:h-14 px-6 text-sm sm:text-base font-bold border-2 border-[#0B1220] text-[#0B1220] hover:bg-[#0B1220] hover:text-white bg-transparent transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <span>View Monthly Deals</span>
              </button>
            </div>

            {/* Responsive Trust Badges */}
            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-xl">
              <TrustPill icon={Truck} label="4-Hour Delivery" sub="Express home slot" />
              <TrustPill icon={Percent} label="Upto 20% OFF" sub="Zero middlemen" />
              <TrustPill icon={ShieldCheck} label="OTP Login" sub="100% passwordless" />
            </div>
          </div>

          {/* HERO VISUAL & EDITORIAL CAROUSEL */}
          <div className="lg:col-span-5 relative w-full mt-4 lg:mt-0">
            {/* Visual Box (Responsive height, never clips) */}
            <div className="relative h-[320px] sm:h-[440px] lg:h-[500px] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border border-[#F1EAD8] shadow-2xl bg-[#FDF3DE]">
              <HeroImage />
            </div>

            {/* Desktop floating stat cards (Safely inlined / hidden on small phones to avoid clipping) */}
            <div className="hidden sm:flex absolute -bottom-4 -left-4 rounded-2xl bg-white/95 backdrop-blur border border-[#F1EAD8] shadow-xl p-3 items-center gap-3 z-20">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-xl">🛒</div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-[#22C55E]">Minimum order</div>
                <div className="font-display font-black text-lg text-[#0B1220]">₹1,000</div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -top-3 -right-3 rounded-2xl bg-white/95 backdrop-blur border border-[#F1EAD8] shadow-xl p-3 items-center gap-3 z-20">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
              </div>
              <div>
                <div className="font-display font-black text-lg leading-none text-[#0B1220]">
                  4.9<span className="text-xs text-gray-500 font-normal">/5</span>
                </div>
                <div className="text-[10px] text-gray-600 font-bold mt-0.5">2,400+ families</div>
              </div>
            </div>
          </div>
        </section>

        {/* --------- DYNAMIC LIVE PROMOTIONAL FESTIVE BANNERS --------- */}
        {banners.length > 0 && (
          <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-4">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#F1EAD8] bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white">
              {banners.map((b, idx) => {
                const isActive = idx === activeBannerIdx;
                if (!isActive) return null;

                return (
                  <div
                    key={b.id || idx}
                    className="p-5 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer"
                    onClick={() => openAppDownload(`Banner: ${b.title || 'Promo'}`)}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 flex-1">
                      {b.image_url ? (
                        <img
                          src={resolveImageUrl(b.image_url)}
                          alt={b.title || 'Festive Banner'}
                          className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-2xl border-2 border-white/40 shadow-md shrink-0 bg-white/10"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0">
                          🎉
                        </div>
                      )}
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-[#FCD34D] bg-black/30 rounded-full px-2.5 py-0.5 mb-1.5">
                          ⭐ Special Campaign Deal
                        </div>
                        <h3 className="text-xl sm:text-3xl font-black font-display leading-tight">
                          {b.title || 'MONTHLY SAVINGS SALE'}
                        </h3>
                        {b.subtitle && (
                          <p className="text-sm sm:text-base text-white/90 font-medium mt-1">
                            {b.subtitle}
                          </p>
                        )}
                        {b.body && (
                          <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                            {b.body}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAppDownload(`Banner CTA: ${b.title || 'Promo'}`);
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-[#FCD34D] hover:bg-[#F59E0B] text-slate-950 font-black rounded-xl text-sm sm:text-base shadow-lg transition-transform hover:scale-105 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{b.cta_text || 'Claim on App'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Multiple Banner Carousel Indicators */}
              {banners.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveBannerIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeBannerIdx ? 'w-6 bg-[#FCD34D]' : 'w-1.5 bg-white/40'
                      }`}
                      aria-label={`Banner slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* --------- DYNAMIC MASTER CATEGORIES SHOWCASE --------- */}
        <section id="categories" className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase font-extrabold text-[#22C55E] tracking-widest bg-[#DCFCE7] px-3 py-1 rounded-full">
                500+ Staple SKUs
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-display text-[#0B1220] mt-2">
                Explore Essential Categories
              </h2>
              <p className="text-xs sm:text-base text-gray-600 mt-1 font-medium">
                Pantry staples, flours, oils, dals, aur masale — har mahine ki zaroorat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAppDownload('Browse all categories')}
              className="text-xs sm:text-sm font-bold text-[#22C55E] hover:text-[#16A34A] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Download App to Shop All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {(categories.length > 0
              ? categories
              : [
                  { id: '1', name: 'Atta & Flour', image_url: '' },
                  { id: '2', name: 'Rice & Grains', image_url: '' },
                  { id: '3', name: 'Edible Oils & Ghee', image_url: '' },
                  { id: '4', name: 'Dals & Pulses', image_url: '' },
                  { id: '5', name: 'Spices & Masalas', image_url: '' },
                  { id: '6', name: 'Tea, Coffee & Sugar', image_url: '' },
                ]
            ).map((cat, idx) => {
              const defaultIcons = ['🌾', '🍚', '🫒', '🥣', '🌶️', '☕', '🧂', '🧼'];
              const iconEmoji = defaultIcons[idx % defaultIcons.length];

              return (
                <div
                  key={cat.id || idx}
                  onClick={() => openAppDownload(`Category: ${cat.name}`)}
                  className="group rounded-2xl bg-white border border-[#F1EAD8] p-4 text-center hover:border-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-between"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FFF8ED] p-2 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    {cat.image_url ? (
                      <img
                        src={resolveImageUrl(cat.image_url)}
                        alt={cat.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl">{iconEmoji}</span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B1220] group-hover:text-[#22C55E] transition-colors leading-tight">
                    {cat.name}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-semibold mt-1">
                    Tap to view
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* --------- HOW IT WORKS (Sirf 3 Steps) --------- */}
        <section id="how" className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-sm">
              Simple 3-Step Process
            </span>
            <h2 className="mt-3.5 text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display text-[#0B1220]">
              Monthly Grocery kaise kaam karta hai
            </h2>
            <p className="mt-2 text-gray-600 text-sm sm:text-lg font-medium">
              Pura mahina ek order mein sort. Market ki bhaag-daud khatam.
            </p>
          </div>

          <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="rounded-3xl bg-white border border-[#F1EAD8] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-3xl">🛒</div>
                <span className="text-4xl font-black font-display text-[#22C55E]/30">01</span>
              </div>
              <h3 className="mt-5 text-xl font-bold font-display text-[#0B1220]">Cart mein daalo</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">
                App open karke Atta, Dal, Tel, Ghee, Sabun — 60 seconds me poora saamaan add karo.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#F1EAD8] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-3xl">🕐</div>
                <span className="text-4xl font-black font-display text-[#22C55E]/30">02</span>
              </div>
              <h3 className="mt-5 text-xl font-bold font-display text-[#0B1220]">Slot chuno</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">
                Koi bhi 4-ghante ka delivery slot select karo. Ham guaranteed time par deliver karte hain.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#F1EAD8] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#FCE7F3] flex items-center justify-center text-3xl">📦</div>
                <span className="text-4xl font-black font-display text-[#22C55E]/30">03</span>
              </div>
              <h3 className="mt-5 text-xl font-bold font-display text-[#0B1220]">Unpack &amp; Muskurao</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">
                Factory-sealed fresh pantry packs direct aapki rasoi tak delivered. No lifting tension.
              </p>
            </div>
          </div>
        </section>

        {/* --------- SMART APP FEATURES (Bento Grid) --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] text-[#166534] px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Smart Mobile App
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-black font-display text-[#0B1220]">
              Built for Modern Indian Households
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: "🤖", title: "AI List Ordering", body: "Photo ya WhatsApp list upload karo — AI 10 items ka cart ek click me bana deta hai.", accent: "bg-[#DCFCE7]" },
              { icon: "👨‍👩‍👧", title: "Family Size Planner", body: "Family size (1–10 log) select karo — monthly pantry basket automatically calculate ho jata hai.", accent: "bg-[#FEF3C7]" },
              { icon: "🔁", title: "Copy Last Month", body: "Pichle mahine ka poora order 1 click me re-order karein. Modify or skip freely.", accent: "bg-[#FCE7F3]" },
              { icon: "🏷️", title: "Direct Mill Pricing", body: "Zero middlemen margin. Har order par minimum ₹1,000+ ki direct savings.", accent: "bg-[#E9D5FF]" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-3xl bg-white border border-[#F1EAD8] p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.accent} flex items-center justify-center text-3xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0B1220]">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --------- SOCIAL PROOF / CUSTOMER LOVE --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-12">
          <div className="rounded-[32px] bg-[#22C55E] text-white p-6 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl -translate-y-20 translate-x-20" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 text-[#FCD34D] px-3.5 py-1 text-xs font-bold uppercase tracking-widest mb-3">
                  Loved by 2,400+ Homes
                </span>
                <h3 className="text-2xl sm:text-4xl font-black font-display leading-tight text-white">
                  &ldquo;Kirana ki tension khatam. Har mahine paise aur 6 ghante bachte hain.&rdquo;
                </h3>
                <div className="mt-6 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-lg font-black">
                    P
                  </div>
                  <div>
                    <div className="font-bold text-base text-white">Priya M., Andheri</div>
                    <div className="text-xs text-white/80">4 logon ka parivaar · Customer since 2025</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <ProofStat n="₹1.2L" label="Avg. Yearly Savings" />
                <ProofStat n="4.9★" label="Play Store Rating" />
                <ProofStat n="98%" label="Repeat Monthly" />
              </div>
            </div>
          </div>
        </section>

        {/* --------- FREQUENTLY ASKED QUESTIONS (FAQ) --------- */}
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-12">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-extrabold text-[#22C55E] tracking-widest bg-[#DCFCE7] px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-display text-[#0B1220] mt-2">
              Aapke Sawaal, Hamare Jawaab
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Delivery kitne time mein hoti hai?",
                a: "Hamare 4-hour slots rehte hain. Aap order karte waqt subah ya shaam ka koi bhi slot chun sakte hain. Ham time par deliver karte hain."
              },
              {
                q: "Minimum order value kitni hai?",
                a: "Minimum order value sirf ₹1,000 hai. Aap monthly ration ya essential grocery order karein aur seedha wholesale discount aur fast home delivery ka faayda uthayein."
              },
              {
                q: "Kaun kaun se brands available hain?",
                a: "Aashirvaad, Fortune, Tata Sampann, Amul, Everest, MDH, Dettol, Surf Excel samet sabhi leading authentic brands 100% factory sealed condition mein milte hain."
              },
              {
                q: "Order kaise karein?",
                a: "Humara official mobile app Google Play Store se download karein, apne phone number se OTP login karein, aur 60 seconds mein cart banakar checkout karein."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#F1EAD8] overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#0B1220] hover:text-[#22C55E] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      faqOpen === idx ? 'rotate-180 text-[#22C55E]' : ''
                    }`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* --------- FINAL CTA --------- */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display text-[#0B1220] leading-tight">
            Pantry planned.<br />Mahina simplified.
          </h2>
          <p className="mt-4 text-gray-700 text-base sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Pehla monthly cart 4 ghante mein ghar. No subscription. No commitment. Sirf sealed pantry packs.
          </p>
          <button
            type="button"
            onClick={() => openAppDownload('Bottom Final CTA')}
            className="inline-flex items-center mt-8 rounded-full bg-[#0B1220] hover:bg-[#1F2937] text-white h-14 sm:h-16 px-10 sm:px-12 text-base sm:text-lg font-bold group transition-all shadow-2xl hover:scale-105 active:scale-98 cursor-pointer"
          >
            <span>Download App &amp; Start Shopping</span>
            <ArrowRight className="w-5 h-5 ml-2.5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#F1EAD8] py-8 sm:py-12 bg-white/80 backdrop-blur">
        <div className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 font-medium text-center md:text-left">
          <EverLogo size="md" />
          <div className="flex items-center gap-2 font-semibold text-[#0B1220]">
            <MapPin className="w-4 h-4 text-[#22C55E]" /> Pan India Delivery Available
          </div>
          <div>© {new Date().getFullYear()} EVER (Everyday Value &amp; Essentials Retail) · monthlygrocery.in</div>
        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM APP DOWNLOAD BAR */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F1EAD8] p-3 shadow-2xl transition-transform duration-300 ${
        showStickyBottomBar ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8ED] p-1 border border-[#F1EAD8] flex items-center justify-center shrink-0">
              <img src={LOGO_URL} alt="EVER" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0B1220] truncate">Monthly Grocery App</div>
              <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <span>⭐ 4.9</span>
                <span>•</span>
                <span>4-Hr Delivery</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAppDownload('Sticky Bottom Bar')}
            className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-black rounded-full text-xs shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>INSTALL</span>
          </button>
        </div>
      </div>

      {/* APP DOWNLOAD POPUP MODAL */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-2xl border border-[#F1EAD8] space-y-5 sm:space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFF8ED] p-1.5 border border-[#F1EAD8] shadow-md flex items-center justify-center shrink-0">
                <img
                  src={LOGO_URL}
                  alt="EVER Monthly Grocery"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#22C55E] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                  Customer Mobile App
                </span>
                <h3 className="text-lg sm:text-2xl font-black font-display text-[#0B1220] mt-1 leading-tight">
                  Download Monthly Grocery App
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
              Ghar ka poora mahine ka kirana order karein 60 seconds me. Enjoy <span className="font-bold text-[#22C55E]">4-hour home delivery</span>, upto <span className="font-bold text-[#22C55E]">20% savings</span>, aur sealed fresh pantry packs.
            </p>

            {/* Direct Google Play Store Button */}
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#0B1220] hover:bg-[#1F2937] text-white transition-all shadow-lg hover:shadow-xl group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.5 1.5 0 0 1-.61-.92L3 2.734a1.5 1.5 0 0 1 .609-.92zm11.602 11.604l2.133 2.134-11.455 6.613 9.322-8.747zm0-2.836L5.89 1.835l11.454 6.613-2.133 2.134zm1.414 1.418l3.655 2.11a1.5 1.5 0 0 1 0 2.598l-3.655 2.11-1.748-1.748 1.748-1.748z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[9px] text-white/70 uppercase tracking-widest font-extrabold">GET IT ON</div>
                  <div className="text-sm sm:text-lg font-black font-display leading-tight">Google Play Store</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#22C55E]">
                <span>Install</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Scan QR Code Option for Desktop */}
            <div className="p-3.5 sm:p-4 bg-[#FFF8ED] rounded-2xl border border-[#F1EAD8] flex items-center gap-3.5">
              <div className="bg-white p-1.5 rounded-xl border border-[#F1EAD8] shadow-sm shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(PLAY_STORE_URL)}`}
                  alt="Scan to Download Monthly Grocery App"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] uppercase font-extrabold text-[#22C55E] tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Scan to Download
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1220] mt-0.5 leading-snug">
                  Camera se QR code scan karke direct phone me install karein
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Direct Android installation link.
                </p>
              </div>
            </div>

            {/* Apple iOS Badge */}
            <div className="flex items-center justify-between px-2 text-xs text-gray-600 font-medium pt-1 border-t border-gray-100">
              <span className="flex items-center gap-1.5">
                🍏 Apple App Store (iOS)
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------- SUB-COMPONENTS -----------------

function EverLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const height = size === "xl" ? 85 : size === "lg" ? 64 : size === "md" ? 50 : 38;
  return (
    <Link href="/" className="inline-flex items-center group transition-transform hover:scale-105" aria-label="EVER - Everyday Value and Essentials Retail">
      <span className="inline-flex items-center justify-center rounded-2xl overflow-hidden bg-white px-2.5 sm:px-3 py-1 ring-1 ring-[#F1EAD8] shadow-sm">
        <img
          src={LOGO_URL}
          alt="EVER - Everyday Value and Essentials Retail"
          height={height}
          style={{ height: `${height}px`, width: "auto", display: "block" }}
          className="select-none object-contain"
        />
      </span>
    </Link>
  );
}

function HeroImage() {
  const slides = [
    {
      url: "/hero-green-saree-pack.jpg",
      tag: "Everyday Value",
    },
    {
      url: "/hero-western-checkout.png",
      tag: "Handpicked for you",
    },
    {
      url: "/hero-couple.png",
      tag: "For Indian families",
    },
    {
      url: "/hero-family-cooking.jpg",
      tag: "Happy families",
    },
    {
      url: "/hero-women-kitchen.jpg",
      tag: "Ghar ki rasoi",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const active = slides[currentIndex];
  const prev = () => setCurrentIndex((currentIndex - 1 + slides.length) % slides.length);
  const next = () => setCurrentIndex((currentIndex + 1) % slides.length);

  return (
    <div className="absolute inset-0">
      <img
        src={active.url}
        alt={active.tag}
        className="w-full h-full object-cover object-top sm:object-center transition-opacity duration-700"
      />

      {/* Ribbon at top */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] text-white px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-lg">
          <Sparkles className="w-3 h-3" /> {active.tag}
        </span>
        <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur text-[#0B1220] px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-md">
          ₹1,000+ order
        </span>
      </div>

      {/* Clean Carousel controls at bottom */}
      <div className="absolute bottom-3 left-3.5 right-3.5 sm:left-6 sm:right-6 flex items-center justify-between z-10">
        <div className="flex gap-1.5 bg-black/35 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 shadow-md">
          {slides.map((_, s) => (
            <button
              key={s}
              onClick={() => setCurrentIndex(s)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === currentIndex ? "w-6 bg-[#22C55E]" : "w-1.5 bg-white/60 hover:bg-white"
              }`}
              aria-label={`Slide ${s + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors shadow-md cursor-pointer border border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors shadow-md cursor-pointer border border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrustPill({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-2xl bg-white border border-[#F1EAD8] p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#22C55E]" />
      <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-1">{label}</div>
      <div className="hidden sm:block text-[10px] text-gray-500 font-medium mt-0.5">{sub}</div>
    </div>
  );
}

function ProofStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-md p-3 sm:p-5 text-center border border-white/30 shadow-inner">
      <div className="font-display text-2xl sm:text-4xl font-black text-white">{n}</div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/90 mt-1 font-bold leading-tight">{label}</div>
    </div>
  );
}
