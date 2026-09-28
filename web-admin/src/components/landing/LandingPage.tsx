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
  LogIn
} from 'lucide-react';

const LOGO_URL = "/ever-logo.png";

export default function LandingPage() {
  useEffect(() => {
    // Ensure document body is styled correctly for landing page
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FFF8ED';
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FFF8ED] text-[#0B1220] relative overflow-x-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-40 -left-32 w-96 h-96 rounded-full bg-[#22C55E]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-24 w-96 h-96 rounded-full bg-[#F97316]/10 blur-3xl pointer-events-none" />

      {/* HEADER */}
      <header className="w-full glass-nav sticky top-0 z-50">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
          <EverLogo />
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#how" className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-[#22C55E] px-3 transition-colors">
              How it works
            </a>
            <a href="#benefits" className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-[#22C55E] px-3 transition-colors">
              Why us
            </a>
            <Link href="/privacy-policy" className="hidden sm:inline-flex text-sm font-semibold text-gray-700 hover:text-[#22C55E] px-3 transition-colors">
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-10 px-5 text-sm font-semibold mg-shadow-brand transition-all shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="w-full relative">
        {/* --------- HERO --------- */}
        <section className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 pt-10 lg:pt-16 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-4 py-1.5 text-xs font-bold uppercase tracking-widest mg-shadow-soft self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Now delivering Pan India
            </div>

            <h1 className="mt-6 text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-tighter font-display leading-[1.05] text-[#0B1220]">
              Ghar ka <em className="not-italic bg-gradient-to-r from-[#22C55E] to-[#16A34A] bg-clip-text text-transparent">poora</em>
              <br />
              <span className="relative inline-block">
                mahine ka kirana.
                <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 90 2, 180 6 T 298 4" stroke="#FCD34D" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl">
              Aata, chawal, dal, tel, ghee, chai, masale, sabun — <span className="font-semibold text-[#0B1220]">poora mahine ka saamaan</span>, sealed packs mein, aapke <span className="font-bold text-[#22C55E]">ghar par 4 ghante mein</span>. Har order par upto 20% ki bachat.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-14 px-8 text-base font-semibold mg-shadow-brand group transition-all"
              >
                <span>Start shopping · No login needed</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full h-14 px-8 text-base font-semibold border-2 border-[#0B1220] text-[#0B1220] hover:bg-[#0B1220] hover:text-white bg-transparent transition-all"
              >
                Admin Portal
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
              <TrustPill icon={Truck} label="4-hour delivery" />
              <TrustPill icon={Percent} label="Upto 20% OFF" />
              <TrustPill icon={ShieldCheck} label="OTP login" />
            </div>
          </div>

          {/* HERO CARD STACK */}
          <div className="lg:col-span-5 relative h-[480px] sm:h-[540px] lg:h-[580px] w-full mt-6 lg:mt-0">
            {/* Editorial photo carousel */}
            <div className="absolute inset-0 rounded-[32px] overflow-hidden border border-[#F1EAD8] mg-shadow-hover bg-[#FDF3DE]">
              <HeroImage />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-5 -left-3 sm:-bottom-6 sm:-left-6 rounded-2xl bg-white border border-[#F1EAD8] mg-shadow-soft p-4 flex items-center gap-3 floaty z-10">
              <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-2xl">🛒</div>
              <div>
                <div className="text-xs uppercase tracking-widest font-bold text-[#22C55E]">Minimum order</div>
                <div className="font-display font-bold text-xl text-[#0B1220]">₹2,500</div>
              </div>
            </div>

            {/* Floating rating card */}
            <div
              className="absolute -top-4 -right-2 rounded-2xl bg-white border border-[#F1EAD8] mg-shadow-soft p-4 flex items-center gap-3 z-10"
              style={{ animation: "floaty 4.5s ease-in-out infinite 0.8s" }}
            >
              <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
              </div>
              <div>
                <div className="font-display font-bold text-xl leading-none text-[#0B1220]">
                  4.9<span className="text-sm text-gray-500 font-normal">/5</span>
                </div>
                <div className="text-[11px] text-gray-500 font-semibold">2,400+ ghar · loved</div>
              </div>
            </div>

            {/* Delivery timer chip */}
            <div
              className="absolute top-1/2 -left-3 sm:-left-4 -translate-y-1/2 rounded-2xl bg-[#0B1220] text-white p-3 mg-shadow-hover flex items-center gap-2 z-10"
              style={{ animation: "floaty 5s ease-in-out infinite 0.4s" }}
            >
              <Clock className="w-4 h-4 text-[#FCD34D]" />
              <div className="text-xs font-bold">4 ghante mein ghar par</div>
            </div>
          </div>
        </section>

        {/* --------- HOW IT WORKS --------- */}
        <section id="how" className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              Sirf 3 steps
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter font-display leading-tight text-[#0B1220]">
              EVER kaise kaam karta hai
            </h2>
            <p className="mt-4 text-gray-600 text-base sm:text-lg">
              Ek mahine ka plan. Ek delivery slot. Kirana ki bhaag-daud khatam.
            </p>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connecting dotted line */}
            <div className="hidden md:block absolute top-14 left-[16.67%] right-[16.67%] h-0.5 border-t-2 border-dashed border-[#22C55E]/30 z-0" />
            
            <div className="relative rounded-[24px] bg-white border border-[#F1EAD8] p-7 mg-shadow-soft z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-white shadow-inner bg-[#DCFCE7]">🛒</div>
                <div className="text-4xl font-display font-bold text-[#22C55E]/40">01</div>
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight font-display text-[#0B1220]">Cart mein daalo</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                500+ Hinglish SKUs. Type &apos;तेल&apos; ya &apos;atta&apos; — dono chalte hain.
              </p>
            </div>

            <div className="relative rounded-[24px] bg-white border border-[#F1EAD8] p-7 mg-shadow-soft z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-white shadow-inner bg-[#FEF3C7]">🕐</div>
                <div className="text-4xl font-display font-bold text-[#22C55E]/40">02</div>
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight font-display text-[#0B1220]">Slot chuno</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Agle 7 din mein koi bhi 4-ghante ka slot. Time pe pahunchte hain.
              </p>
            </div>

            <div className="relative rounded-[24px] bg-white border border-[#F1EAD8] p-7 mg-shadow-soft z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-white shadow-inner bg-[#FCE7F3]">📦</div>
                <div className="text-4xl font-display font-bold text-[#22C55E]/40">03</div>
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight font-display text-[#0B1220]">Unpack &amp; muskurao</h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Sealed atta, ghee tin, dal jars, oil bottles — pantry-ready packs.
              </p>
            </div>
          </div>
        </section>

        {/* --------- WHY US BENTO --------- */}
        <section id="benefits" className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            {/* Big feature card */}
            <div className="md:col-span-4 md:row-span-2 rounded-[28px] p-8 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#0B1220] to-[#1F2937] text-white grain">
              <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#22C55E]/20 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FCD34D]/20 text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Har mahine bachao
                </div>
                <h3 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tighter font-display leading-tight text-white">
                  Kirana wale se<br />upto 20% sasta.
                </h3>
                <p className="mt-4 text-white/70 max-w-xl text-base sm:text-lg leading-relaxed">
                  Kyunki hum poore mahine ka bulk order lete hain, middlemen ka margin bachta hai — aur woh saving aap tak pahunchti hai. Pehle mahine mein hi ₹1,000+ ki bachat.
                </p>
                <div className="mt-8 sm:mt-10 flex items-center gap-6 sm:gap-8 text-sm">
                  <div>
                    <div className="font-display text-3xl sm:text-4xl font-bold text-[#FCD34D]">23+</div>
                    <div className="text-white/60 text-xs uppercase tracking-widest mt-1">Kirana SKUs</div>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div>
                    <div className="font-display text-3xl sm:text-4xl font-bold text-[#FCD34D]">4hr</div>
                    <div className="text-white/60 text-xs uppercase tracking-widest mt-1">Home delivery</div>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div>
                    <div className="font-display text-3xl sm:text-4xl font-bold text-[#FCD34D]">100%</div>
                    <div className="text-white/60 text-xs uppercase tracking-widest mt-1">OTP secure</div>
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
        <section className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-14">
          <div className="rounded-[32px] bg-[#22C55E] text-white p-8 sm:p-12 lg:p-14 mg-shadow-brand relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl -translate-y-24 translate-x-24" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Families ka pyaar
                </div>
                <h3 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tighter font-display leading-tight text-white">
                  &ldquo;Kirana ki tension khatam. Har mahine paisa bhi bacha, time bhi.&rdquo;
                </h3>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">P</div>
                  <div>
                    <div className="font-semibold text-white">Priya M., Andheri</div>
                    <div className="text-xs text-white/70">4 logon ka ghar · Since 2025</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <ProofStat n="₹1.2L" label="families ne is saal bachaya" />
                <ProofStat n="4.9★" label="average rating" />
                <ProofStat n="98%" label="har mahine wapas order karte hain" />
              </div>
            </div>
          </div>
        </section>

        {/* --------- FINAL CTA --------- */}
        <section className="max-w-4xl 2xl:max-w-5xl w-full mx-auto px-4 sm:px-8 py-20 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter font-display leading-tight text-[#0B1220]">
            Pantry planned.<br />Mahina simplified.
          </h2>
          <p className="mt-4 text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
            Pehla monthly cart 4 ghante mein ghar. No subscription. No commitment. Sirf sealed pantry packs.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center mt-8 rounded-full bg-[#0B1220] hover:bg-[#1F2937] text-white h-14 px-10 text-base font-semibold group transition-all shadow-xl"
          >
            <span>Free mein shuru karo</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#F1EAD8] py-10 mt-8 bg-white/60">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-gray-500">
          <EverLogo size="sm" />
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Pan India delivery
          </div>
          <div>© {new Date().getFullYear()} EVER (Everyday Value and Essentials Retail) · monthlygrocery.in</div>
        </div>
      </footer>
    </div>
  );
}

// ----------------- SUB-COMPONENTS -----------------

function EverLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const height = size === "lg" ? 56 : size === "sm" ? 38 : 46;
  return (
    <Link href="/" className="inline-flex items-center group" aria-label="EVER - Everyday Value and Essentials Retail">
      <span className="inline-flex items-center rounded-2xl overflow-hidden bg-white px-3 py-1 ring-1 ring-[#F1EAD8] shadow-sm">
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
      url: "https://images.unsplash.com/photo-1780504863283-3157e6d141e1?w=1000&q=85&auto=format&fit=crop",
      caption: "Traditional se digital tak — har ghar ka kirana.",
      tag: "Bharat ka kirana",
    },
    {
      url: "https://images.unsplash.com/photo-1753354868403-bb9e04e74668?w=1000&q=85&auto=format&fit=crop",
      caption: "Poore parivaar ka mahine ka kirana, ek order me.",
      tag: "Family favourite",
    },
    {
      url: "https://images.unsplash.com/photo-1752006183600-3891042ed904?w=1000&q=85&auto=format&fit=crop",
      caption: "Aapke mohalle ki kirana, aapke phone par.",
      tag: "Local shops, delivered",
    },
    {
      url: "https://images.unsplash.com/photo-1667665908399-6d858dd26231?w=1000&q=85&auto=format&fit=crop",
      caption: "Har brand jo aap ghar me use karte ho — sealed & delivered.",
      tag: "500+ SKUs",
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
      {/* Cinematic tint */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/85 via-[#0B1220]/10 to-transparent" />

      {/* Kirana ribbon at top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-md">
          <Sparkles className="w-3 h-3" /> {active.tag}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur text-[#0B1220] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
          ₹2,500+ order
        </span>
      </div>

      {/* Caption */}
      <div className="absolute bottom-16 left-6 right-6 z-10">
        <div className="text-white font-display font-semibold text-2xl leading-tight drop-shadow-md">
          {active.caption}
        </div>
        <div className="text-white/85 text-xs mt-2 flex items-center gap-3 font-semibold">
          <span className="inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> 4 ghante mein
          </span>
          <span className="inline-flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> 20% bachat
          </span>
          <span className="inline-flex items-center gap-1">
            🌾 Sealed packs
          </span>
        </div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex gap-1.5">
          {slides.map((_, s) => (
            <button
              key={s}
              onClick={() => setCurrentIndex(s)}
              className={`h-1.5 rounded-full transition-all ${
                s === currentIndex ? "w-6 bg-[#FCD34D]" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${s + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"
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
    <div className="flex flex-col items-center gap-1.5 text-center rounded-2xl bg-white border border-[#F1EAD8] p-3 mg-shadow-soft">
      <Icon className="w-5 h-5 text-[#22C55E]" />
      <div className="text-xs font-semibold text-gray-700 leading-tight">{label}</div>
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
    <div className={`md:col-span-2 rounded-[24px] p-6 border border-[#F1EAD8] ${bg} card-lift relative`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="mt-4 text-xl font-bold tracking-tight font-display text-[#0B1220]">{title}</h4>
      <p className="mt-1 text-sm text-gray-700 leading-snug">{body}</p>
    </div>
  );
}

function ProofStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 text-center border border-white/20">
      <div className="font-display text-2xl sm:text-3xl font-bold text-white">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/80 mt-1 leading-tight">{label}</div>
    </div>
  );
}
