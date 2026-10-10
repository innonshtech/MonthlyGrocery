'use client';

import React, { useState, useEffect } from 'react';
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
  LogIn,
  X,
  Smartphone,
  Download
} from 'lucide-react';

const LOGO_URL = "/ever-logo.png";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.monthlygrocerymobile";

export default function LandingPage() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  useEffect(() => {
    // Ensure document body is styled correctly for landing page
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF8ED';
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FFF8ED] text-[#0B1220] relative overflow-x-hidden font-sans selection:bg-[#22C55E]/30">
      {/* Background dynamic ambient glow */}
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-[#22C55E]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-80 -right-32 w-[600px] h-[600px] rounded-full bg-[#F97316]/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[1600px] left-1/3 w-[700px] h-[700px] rounded-full bg-[#22C55E]/10 blur-[160px] pointer-events-none" />

      {/* HEADER */}
      <header className="w-full glass-nav sticky top-0 z-50 transition-all backdrop-blur-md bg-white/80 border-b border-[#F1EAD8]">
        <div className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-2.5 sm:py-3 flex items-center justify-between">
          <EverLogo size="lg" />
          <nav className="flex items-center gap-4 sm:gap-8">
            <a
              href="#how"
              className="hidden md:inline-flex text-sm sm:text-base font-semibold text-gray-700 hover:text-[#22C55E] px-2 py-1 transition-colors"
            >
              How it works
            </a>
            <a
              href="#benefits"
              className="hidden md:inline-flex text-sm sm:text-base font-semibold text-gray-700 hover:text-[#22C55E] px-2 py-1 transition-colors"
            >
              Why us
            </a>
            <Link
              href="/privacy-policy"
              className="hidden sm:inline-flex text-sm sm:text-base font-semibold text-gray-700 hover:text-[#22C55E] px-2 py-1 transition-colors"
            >
              Privacy Policy
            </Link>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#22C55E] hover:text-[#16A34A] px-2 py-1 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Get App</span>
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-11 px-5 sm:px-6 text-sm sm:text-base font-bold mg-shadow-brand transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Admin Portal</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="w-full relative">
        {/* --------- HERO SECTION (Snug & Fluid Height) --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pt-5 sm:pt-7 lg:pt-8 pb-8 sm:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-sm self-start mb-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              Now delivering Pan India
            </div>

            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight font-display leading-[1.05] text-[#0B1220]">
              Ghar ka <em className="not-italic bg-gradient-to-r from-[#22C55E] to-[#16A34A] bg-clip-text text-transparent">poora</em>
              <br />
              <span className="relative inline-block">
                mahine ka kirana.
                <svg className="absolute -bottom-2.5 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 90 2, 180 6 T 298 4" stroke="#FCD34D" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl font-medium">
              Aata, chawal, dal, tel, ghee, chai, masale, sabun — <span className="font-bold text-[#0B1220]">poora mahine ka saamaan</span>, sealed packs mein, aapke <span className="font-extrabold text-[#22C55E]">ghar par 4 ghante mein</span>. Har order par upto 20% ki bachat.
            </p>

            <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center justify-center rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-12 sm:h-14 px-7 sm:px-8 text-base font-bold mg-shadow-brand group transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Start shopping · Get App</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full h-12 sm:h-14 px-7 sm:px-8 text-base font-bold border-2 border-[#0B1220] text-[#0B1220] hover:bg-[#0B1220] hover:text-white bg-transparent transition-all shadow-sm hover:shadow-md"
              >
                Admin Portal
              </Link>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              <TrustPill icon={Truck} label="4-hour delivery" />
              <TrustPill icon={Percent} label="Upto 20% OFF" />
              <TrustPill icon={ShieldCheck} label="OTP login" />
            </div>
          </div>

          {/* HERO CARD STACK */}
          <div className="lg:col-span-5 relative h-[440px] sm:h-[480px] lg:h-[510px] xl:h-[540px] w-full mt-3 lg:mt-0">
            {/* Editorial photo carousel */}
            <div className="absolute inset-0 rounded-[32px] overflow-hidden border border-[#F1EAD8] shadow-2xl bg-[#FDF3DE]">
              <HeroImage />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-4 -left-2 sm:-bottom-5 sm:-left-5 rounded-2xl bg-white/95 backdrop-blur border border-[#F1EAD8] shadow-xl p-3 sm:p-4 flex items-center gap-3 floaty z-20">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-2xl">🛒</div>
              <div>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-[#22C55E]">Minimum order</div>
                <div className="font-display font-black text-lg sm:text-xl text-[#0B1220]">₹2,500</div>
              </div>
            </div>

            {/* Floating rating card */}
            <div
              className="absolute -top-3 -right-2 sm:-top-3 sm:-right-3 rounded-2xl bg-white/95 backdrop-blur border border-[#F1EAD8] shadow-xl p-3 sm:p-4 flex items-center gap-3 z-20"
              style={{ animation: "floaty 4.5s ease-in-out infinite 0.8s" }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
              </div>
              <div>
                <div className="font-display font-black text-lg sm:text-xl leading-none text-[#0B1220]">
                  4.9<span className="text-xs sm:text-sm text-gray-500 font-normal">/5</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600 font-bold mt-0.5">2,400+ ghar · loved</div>
              </div>
            </div>

            {/* Delivery timer chip */}
            <div
              className="absolute top-1/2 -left-2 sm:-left-5 -translate-y-1/2 rounded-2xl bg-[#0B1220] text-white p-2.5 sm:p-3 shadow-xl flex items-center gap-2 z-20"
              style={{ animation: "floaty 5s ease-in-out infinite 0.4s" }}
            >
              <Clock className="w-4 h-4 text-[#FCD34D]" />
              <div className="text-xs font-bold">4 ghante mein ghar par</div>
            </div>
          </div>
        </section>

        {/* --------- BUMPER OFFER STRIP (Full Width Responsive) --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pb-8">
          <div
            data-testid="landing-bumper-offer"
            className="relative rounded-3xl bg-gradient-to-r from-[#F97316] via-[#DB2777] to-[#7C3AED] text-white p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-3xl"
          >
            <div
              className="absolute inset-0 opacity-35 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 90% 30%, rgba(252,211,77,0.6) 0%, transparent 50%)" }}
            />
            <div className="relative flex items-center gap-6 flex-col sm:flex-row text-center sm:text-left justify-between">
              <div className="flex items-center gap-5 sm:gap-6 flex-col sm:flex-row">
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-5xl shadow-inner">
                  🎁
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-extrabold text-[#FCD34D] bg-black/30 rounded-full px-3 py-1 mb-2">
                    ⏳ Limited period
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-display leading-tight">
                    Bumper Offer — <span className="text-[#FCD34D]">1 kg sugar FREE</span> on every ₹1,000 purchase
                  </div>
                  <div className="text-base sm:text-lg text-white/90 mt-1.5 font-medium">
                    Auto-applied at checkout. Stock up before it ends!
                  </div>
                </div>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full bg-[#FCD34D] hover:bg-[#F59E0B] text-[#0B1220] font-extrabold text-base sm:text-lg h-14 px-8 sm:px-10 shadow-xl transition-all hover:scale-105 active:scale-100 shrink-0"
              >
                Shop now
              </Link>
            </div>
          </div>
        </section>

        {/* --------- HOW IT WORKS (Full Width Grid) --------- */}
        <section id="how" className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest shadow-sm">
              Sirf 3 steps
            </div>
            <h2 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-tight text-[#0B1220]">
              EVER kaise kaam karta hai
            </h2>
            <p className="mt-4 text-gray-600 text-lg sm:text-xl font-medium">
              Ek mahine ka plan. Ek delivery slot. Kirana ki bhaag-daud khatam.
            </p>
          </div>

          <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 relative">
            {/* Connecting dotted line */}
            <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 border-t-2 border-dashed border-[#22C55E]/40 z-0" />

            <div className="relative rounded-[32px] bg-white border border-[#F1EAD8] p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2 border-white shadow-inner bg-[#DCFCE7]">🛒</div>
                <div className="text-5xl font-display font-black text-[#22C55E]/30">01</div>
              </div>
              <h3 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight font-display text-[#0B1220]">Cart mein daalo</h3>
              <p className="mt-3 text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
                500+ Hinglish SKUs. Type &apos;तेल&apos; ya &apos;atta&apos; — dono chalte hain.
              </p>
            </div>

            <div className="relative rounded-[32px] bg-white border border-[#F1EAD8] p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2 border-white shadow-inner bg-[#FEF3C7]">🕐</div>
                <div className="text-5xl font-display font-black text-[#22C55E]/30">02</div>
              </div>
              <h3 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight font-display text-[#0B1220]">Slot chuno</h3>
              <p className="mt-3 text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
                Agle 7 din mein koi bhi 4-ghante ka slot. Time pe pahunchte hain.
              </p>
            </div>

            <div className="relative rounded-[32px] bg-white border border-[#F1EAD8] p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2 border-white shadow-inner bg-[#FCE7F3]">📦</div>
                <div className="text-5xl font-display font-black text-[#22C55E]/30">03</div>
              </div>
              <h3 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight font-display text-[#0B1220]">Unpack &amp; muskurao</h3>
              <p className="mt-3 text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
                Sealed atta, ghee tin, dal jars, oil bottles — pantry-ready packs.
              </p>
            </div>
          </div>
        </section>

        {/* --------- SMART FEATURES (4 killer capabilities) --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-16" data-testid="landing-smart-features">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] text-[#166534] px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-widest">
              Yeh baaki kirana app nahi karte
            </div>
            <h2 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-tight text-[#0B1220]">
              Kirana that thinks with you
            </h2>
            <p className="mt-4 text-gray-600 text-lg sm:text-xl font-medium">
              Chaar smart tools jo mahine ki grocery ko 2-minute ka kaam bana dete hain.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: "🤖", title: "AI Chat Ordering", body: "Bolo, likho, ya photo daalo — AI 10 photos ki list bhi ek saath cart mein daal deta hai.", accent: "bg-[#DCFCE7]" },
              { icon: "👨‍👩‍👧", title: "One-Click Family Plan", body: "Family size (1–10) chuno — mahine ka pura kirana basket automatically ready.", accent: "bg-[#FEF3C7]" },
              { icon: "🔁", title: "Copy Last Month", body: "Pichle mahine wala poora order ek click me re-order karo. Editable, skip-able, done.", accent: "bg-[#FCE7F3]" },
              { icon: "✨", title: "Intelligent Suggestions", body: "31-din wala mahina? Diwali aa raha? App khud yaad dilata hai stock-up ka time.", accent: "bg-[#E9D5FF]" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-[32px] bg-white border border-[#F1EAD8] p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-16 h-16 rounded-2xl ${f.accent} flex items-center justify-center text-3xl mb-5 shadow-sm`}>{f.icon}</div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight leading-tight text-[#0B1220]">{f.title}</h3>
                  <p className="mt-3 text-base text-gray-600 leading-relaxed font-medium">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --------- WHY US BENTO (Full Dynamic Responsive Grid) --------- */}
        <section id="benefits" className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 sm:gap-8">
            {/* Big feature card */}
            <div className="md:col-span-4 md:row-span-2 rounded-[36px] p-8 sm:p-12 lg:p-14 relative overflow-hidden bg-gradient-to-br from-[#0B1220] to-[#1F2937] text-white shadow-2xl">
              <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-[#22C55E]/25 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FCD34D]/20 text-[#FCD34D] px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4">
                  Har mahine bachao
                </div>
                <h3 className="mt-2 text-4xl sm:text-6xl font-black tracking-tight font-display leading-[1.05] text-white">
                  Kirana wale se<br />upto 20% sasta.
                </h3>
                <p className="mt-6 text-white/80 max-w-2xl text-lg sm:text-xl leading-relaxed font-medium">
                  Kyunki hum poore mahine ka bulk order lete hain, middlemen ka margin bachta hai — aur woh saving aap tak pahunchti hai. Pehle mahine mein hi ₹1,000+ ki bachat.
                </p>
                <div className="mt-10 sm:mt-12 flex flex-wrap items-center gap-8 sm:gap-12 text-sm">
                  <div>
                    <div className="font-display text-4xl sm:text-5xl font-black text-[#FCD34D]">23+</div>
                    <div className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">Kirana SKUs</div>
                  </div>
                  <div className="h-12 w-px bg-white/20" />
                  <div>
                    <div className="font-display text-4xl sm:text-5xl font-black text-[#FCD34D]">4hr</div>
                    <div className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">Home delivery</div>
                  </div>
                  <div className="h-12 w-px bg-white/20" />
                  <div>
                    <div className="font-display text-4xl sm:text-5xl font-black text-[#FCD34D]">100%</div>
                    <div className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">OTP secure</div>
                  </div>
                </div>
              </div>
            </div>

            <BentoCard
              icon={Truck}
              title="4-ghante mein"
              body="Weekend ho ya weekday, morning ya raat — aap chuno."
              bg="bg-[#DCFCE7]"
              iconBg="bg-[#22C55E] text-white"
            />
            <BentoCard
              icon={Store}
              title="Har bada brand"
              body="Aashirvaad, Fortune, Tata, Amul — jo aap ghar mein use karte ho."
              bg="bg-[#FEF3C7]"
              iconBg="bg-[#F59E0B] text-white"
            />
            <BentoCard
              icon={ShieldCheck}
              title="OTP-only login"
              body="Password bhulne ki tension khatam."
              bg="bg-[#FCE7F3]"
              iconBg="bg-[#EC4899] text-white"
            />
            <BentoCard
              icon={Sparkles}
              title="Hinglish search"
              body="'तेल' likho ya 'atta' — dono chalte hain."
              bg="bg-[#E9D5FF]"
              iconBg="bg-[#6C3BFF] text-white"
            />
          </div>
        </section>

        {/* --------- SOCIAL PROOF STRIP --------- */}
        <section className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-14">
          <div className="rounded-[36px] bg-[#22C55E] text-white p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-24 translate-x-24" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 text-[#FCD34D] px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-3">
                  Families ka pyaar
                </div>
                <h3 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight font-display leading-tight text-white">
                  &ldquo;Kirana ki tension khatam. Har mahine paisa bhi bacha, time bhi.&rdquo;
                </h3>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-xl font-black shadow-inner">P</div>
                  <div>
                    <div className="font-bold text-lg text-white">Priya M., Andheri</div>
                    <div className="text-sm text-white/80 font-medium">4 logon ka ghar · Since 2025</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <ProofStat n="₹1.2L" label="families ne is saal bachaya" />
                <ProofStat n="4.9★" label="average rating" />
                <ProofStat n="98%" label="har mahine wapas order karte hain" />
              </div>
            </div>
          </div>
        </section>

        {/* --------- FINAL CTA --------- */}
        <section className="w-full max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-8 py-20 sm:py-28 text-center">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight font-display leading-[1.05] text-[#0B1220]">
            Pantry planned.<br />Mahina simplified.
          </h2>
          <p className="mt-6 text-gray-700 text-lg sm:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
            Pehla monthly cart 4 ghante mein ghar. No subscription. No commitment. Sirf sealed pantry packs.
          </p>
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center mt-10 rounded-full bg-[#0B1220] hover:bg-[#1F2937] text-white h-16 sm:h-18 px-12 sm:px-14 text-lg sm:text-xl font-bold group transition-all shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-100 cursor-pointer"
          >
            <span>Free mein shuru karo · App Download</span>
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#F1EAD8] py-12 mt-10 bg-white/80 backdrop-blur">
        <div className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6 text-base text-gray-600 font-medium">
          <EverLogo size="md" />
          <div className="flex items-center gap-2 font-semibold text-[#0B1220]">
            <MapPin className="w-5 h-5 text-[#22C55E]" /> Pan India delivery
          </div>
          <div>© {new Date().getFullYear()} EVER (Everyday Value and Essentials Retail) · monthlygrocery.in</div>
        </div>
      </footer>

      {/* APP DOWNLOAD POPUP MODAL */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#F1EAD8] space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF8ED] p-1.5 border border-[#F1EAD8] shadow-md flex items-center justify-center shrink-0">
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
                <h3 className="text-xl sm:text-2xl font-black font-display text-[#0B1220] mt-1 leading-tight">
                  Download Monthly Grocery App
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              Ghar ka poora mahine ka kirana order karein sirf 60 seconds me. Enjoy <span className="font-bold text-[#22C55E]">4-hour home delivery</span>, upto <span className="font-bold text-[#22C55E]">20% savings</span>, aur sealed fresh pantry packs.
            </p>

            {/* Direct Google Play Store Button */}
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#0B1220] hover:bg-[#1F2937] text-white transition-all shadow-lg hover:shadow-xl group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.5 1.5 0 0 1-.61-.92L3 2.734a1.5 1.5 0 0 1 .609-.92zm11.602 11.604l2.133 2.134-11.455 6.613 9.322-8.747zm0-2.836L5.89 1.835l11.454 6.613-2.133 2.134zm1.414 1.418l3.655 2.11a1.5 1.5 0 0 1 0 2.598l-3.655 2.11-1.748-1.748 1.748-1.748z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-white/70 uppercase tracking-widest font-extrabold">GET IT ON</div>
                  <div className="text-base sm:text-lg font-black font-display leading-tight">Google Play Store</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#22C55E]">
                <span>Install App</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Scan QR Code Option for Desktop */}
            <div className="p-4 bg-[#FFF8ED] rounded-2xl border border-[#F1EAD8] flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl border border-[#F1EAD8] shadow-sm shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(PLAY_STORE_URL)}`}
                  alt="Scan to Download Monthly Grocery App"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                />
              </div>
              <div>
                <div className="text-[11px] uppercase font-extrabold text-[#22C55E] tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> Scan to Download
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0B1220] mt-1 leading-snug">
                  Camera se QR code scan karke direct phone me install karein
                </h4>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">
                  Available for all Android devices.
                </p>
              </div>
            </div>

            {/* Apple iOS Badge */}
            <div className="flex items-center justify-between px-2 text-xs text-gray-600 font-medium pt-1 border-t border-gray-100">
              <span className="flex items-center gap-1.5">
                🍏 Apple App Store (iOS)
              </span>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
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
  // Enhanced, crisp and prominent logo display
  const height = size === "xl" ? 85 : size === "lg" ? 72 : size === "md" ? 58 : 46;
  return (
    <Link href="/" className="inline-flex items-center group transition-transform hover:scale-105" aria-label="EVER - Everyday Value and Essentials Retail">
      <span className="inline-flex items-center justify-center rounded-2xl overflow-hidden bg-white px-3.5 py-1.5 ring-1 ring-[#F1EAD8] shadow-md group-hover:shadow-lg transition-all">
        <img
          src={LOGO_URL}
          alt="EVER - Everyday Value and Essentials Retail"
          height={height}
          style={{ height: `${height}px`, width: "auto", display: "block" }}
          className="select-none object-contain transition-all"
        />
      </span>
    </Link>
  );
}

function HeroImage() {
  const slides = [
    {
      url: "/hero-couple.png",
      caption: "Ghar ka poora kirana, saath mein — pyaar se chuni gayi list.",
      tag: "For every Indian family",
    },
    {
      url: "/hero-red-saree.png",
      caption: "Bharat ki har saheli ke liye — shuddh, sealed aur ghar tak.",
      tag: "Bharat ka kirana",
    },
    {
      url: "/hero-saree-family.png",
      caption: "Poore parivaar ka mahine ka kirana, ek order me.",
      tag: "Family favourite",
    },
    {
      url: "/hero-western-checkout.png",
      caption: "Har brand jo aap pasand karti ho — sealed & delivered.",
      tag: "Handpicked for you",
    },
    {
      url: "/hero-office-table.png",
      caption: "Office ke beech — 60 seconds me pura mahine ka kirana order.",
      tag: "Made for busy days",
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
        alt={active.caption}
        className="w-full h-full object-cover transition-opacity duration-700"
      />
      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/90 via-[#0B1220]/20 to-transparent" />

      {/* Kirana ribbon at top */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#22C55E] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg">
          <Sparkles className="w-3.5 h-3.5" /> {active.tag}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur text-[#0B1220] px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-md">
          ₹2,500+ order
        </span>
      </div>

      {/* Caption & Badges at bottom */}
      <div className="absolute bottom-14 sm:bottom-16 left-5 right-5 sm:left-6 sm:right-6 z-10">
        <div className="text-white font-display font-bold text-xl sm:text-2xl leading-snug drop-shadow-md">
          {active.caption}
        </div>
        <div className="text-white/90 text-xs sm:text-sm mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3 font-semibold">
          <span className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
            <Truck className="w-3.5 h-3.5 text-[#FCD34D]" /> 4 ghante mein
          </span>
          <span className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
            <Percent className="w-3.5 h-3.5 text-[#FCD34D]" /> 20% bachat
          </span>
          <span className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
            🌾 Sealed packs
          </span>
        </div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-3.5 left-5 right-5 sm:left-6 sm:right-6 flex items-center justify-between z-10">
        <div className="flex gap-1.5">
          {slides.map((_, s) => (
            <button
              key={s}
              onClick={() => setCurrentIndex(s)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === currentIndex ? "w-6 bg-[#FCD34D]" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Slide ${s + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-white/25 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition-colors shadow-md"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-white/25 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition-colors shadow-md"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrustPill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center rounded-2xl bg-white border border-[#F1EAD8] p-4 shadow-sm hover:shadow-md transition-all">
      <Icon className="w-6 h-6 text-[#22C55E]" />
      <div className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{label}</div>
    </div>
  );
}

function BentoCard({
  icon: Icon,
  title,
  body,
  bg,
  iconBg,
}: {
  icon: any;
  title: string;
  body: string;
  bg: string;
  iconBg: string;
}) {
  return (
    <div className={`md:col-span-2 rounded-[32px] p-8 border border-[#F1EAD8] ${bg} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col justify-between`}>
      <div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg} shadow-sm mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <h4 className="mt-2 text-2xl font-bold tracking-tight font-display text-[#0B1220]">{title}</h4>
        <p className="mt-2 text-base text-gray-700 leading-snug font-medium">{body}</p>
      </div>
    </div>
  );
}

function ProofStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-3xl bg-white/20 backdrop-blur-md p-5 sm:p-6 text-center border border-white/30 shadow-inner">
      <div className="font-display text-3xl sm:text-4xl font-black text-white">{n}</div>
      <div className="text-xs sm:text-sm uppercase tracking-widest text-white/90 mt-2 font-bold leading-tight">{label}</div>
    </div>
  );
}
