import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShoppingBag, Store, ShieldCheck, Truck, Sparkles, Star, Clock, MapPin, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import MonthlyGroceryLogo from "@/components/MonthlyGroceryLogo";
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const gotoDash = (role) => (role === "admin" || role === "super_admin") ? "/admin" : "/shop";

  return (
    <div className="min-h-screen bg-[#FFF8ED] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-40 -left-32 w-96 h-96 rounded-full bg-[#22C55E]/10 blur-3xl"/>
      <div className="absolute top-96 -right-24 w-96 h-96 rounded-full bg-[#F97316]/10 blur-3xl"/>

      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <MonthlyGroceryLogo />
          <nav className="flex items-center gap-3">
            <a href="#how" className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-[#22C55E] px-3">How it works</a>
            <a href="#benefits" className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-[#22C55E] px-3">Why us</a>
            {user && user !== false ? (
              <Link to={gotoDash(user.role)} data-testid="nav-dashboard">
                <Button className="rounded-full bg-[#0B1220] hover:bg-[#1F2937] text-white h-10 px-5">Go to dashboard</Button>
              </Link>
            ) : (
              <Link to="/login" data-testid="nav-login">
                <Button className="rounded-full bg-[#22C55E] hover:bg-[#16A34A] h-10 px-5 mg-shadow-brand">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* --------- HERO --------- */}
        <section className="max-w-7xl mx-auto px-6 pt-14 lg:pt-20 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-4 py-1.5 text-xs font-bold uppercase tracking-widest mg-shadow-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"/>
              Now delivering Pan India
            </div>

            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter font-display leading-[1.02]">
              Ghar ka <em className="not-italic bg-gradient-to-r from-[#22C55E] to-[#16A34A] bg-clip-text text-transparent">poora</em>
              <br/>
              <span className="relative inline-block">
                mahine ka kirana.
                <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 90 2, 180 6 T 298 4" stroke="#FCD34D" strokeWidth="5" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="mt-8 text-lg text-gray-700 leading-relaxed max-w-2xl">
              Aata, chawal, dal, tel, ghee, chai, masale, sabun — <span className="font-semibold text-[#0B1220]">poora mahine ka saamaan</span>, sealed packs mein, aapke <span className="font-bold text-[#22C55E]">ghar par 4 ghante mein</span>. Har order par upto 20% ki bachat.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" data-testid="cta-shop">
                <Button className="rounded-full bg-[#22C55E] hover:bg-[#16A34A] h-14 px-8 text-base font-semibold mg-shadow-brand group">
                  Start shopping · No login needed
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform"/>
                </Button>
              </Link>
              <Link to="/login?role=admin" data-testid="cta-admin">
                <Button variant="outline" className="rounded-full h-14 px-8 text-base font-semibold border-2 border-[#0B1220] text-[#0B1220] hover:bg-[#0B1220] hover:text-white bg-transparent">
                  Admin
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
              <TrustPill icon={Truck} label="4-hour delivery"/>
              <TrustPill icon={Percent} label="Upto 20% OFF"/>
              <TrustPill icon={ShieldCheck} label="OTP login"/>
            </div>
          </motion.div>

          {/* HERO CARD STACK */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="lg:col-span-5 relative h-[560px]">
            {/* Editorial photo carousel — families and couples with grocery bags */}
            <div className="absolute inset-0 rounded-[32px] overflow-hidden border border-[#F1EAD8] mg-shadow-hover bg-[#FDF3DE]">
              <HeroImage />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white border border-[#F1EAD8] mg-shadow-soft p-4 flex items-center gap-3 floaty z-10">
              <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-2xl">🛒</div>
              <div>
                <div className="text-xs uppercase tracking-widest font-bold text-[#22C55E]">Minimum order</div>
                <div className="font-display font-bold text-xl">₹2,500</div>
              </div>
            </div>

            {/* Floating rating card */}
            <div className="absolute -top-4 -right-2 rounded-2xl bg-white border border-[#F1EAD8] mg-shadow-soft p-4 flex items-center gap-3 z-10" style={{animation: "floaty 4.5s ease-in-out infinite 0.8s"}}>
              <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]"/>
              </div>
              <div>
                <div className="font-display font-bold text-xl leading-none">4.9<span className="text-sm text-gray-500 font-normal">/5</span></div>
                <div className="text-[11px] text-gray-500 font-semibold">2,400+ ghar · loved</div>
              </div>
            </div>

            {/* Delivery timer chip — Hinglish */}
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-2xl bg-[#0B1220] text-white p-3 mg-shadow-hover flex items-center gap-2 z-10" style={{animation: "floaty 5s ease-in-out infinite 0.4s"}}>
              <Clock className="w-4 h-4 text-[#FCD34D]"/>
              <div className="text-xs font-bold">4 ghante mein ghar par</div>
            </div>
          </motion.div>
        </section>

        {/* --------- HOW IT WORKS --------- */}
        <section id="how" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F1EAD8] text-[#0B1220] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">Sirf 3 steps</div>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tighter font-display leading-tight">MonthlyGrocery kaise kaam karta hai</h2>
            <p className="mt-4 text-gray-600 text-lg">Ek mahine ka plan. Ek delivery slot. Kirana ki bhaag-daud khatam.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting dotted line */}
            <div className="hidden md:block absolute top-14 left-[16.67%] right-[16.67%] h-0.5 border-t-2 border-dashed border-[#22C55E]/30 z-0"/>
            {[
              { n:"01", title:"Cart mein daalo", body:"500+ Hinglish SKUs. Type 'तेल' ya 'atta' — dono chalte hain.", emoji:"🛒", color:"#DCFCE7" },
              { n:"02", title:"Slot chuno", body:"Agle 7 din mein koi bhi 4-ghante ka slot. Time pe pahunchte hain.", emoji:"🕐", color:"#FEF3C7" },
              { n:"03", title:"Unpack & muskurao", body:"Sealed atta, ghee tin, dal jars, oil bottles — pantry-ready packs.", emoji:"📦", color:"#FCE7F3" },
            ].map((s, i) => (
              <motion.div key={s.n} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay: i*0.1}}
                className="relative rounded-[24px] bg-white border border-[#F1EAD8] p-7 mg-shadow-soft z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-white shadow-inner" style={{background: s.color}}>{s.emoji}</div>
                  <div className="text-4xl font-display font-bold text-[#22C55E]/30">{s.n}</div>
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight font-display">{s.title}</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --------- WHY US BENTO --------- */}
        <section id="benefits" className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[220px]">
            {/* Big feature */}
            <div className="md:col-span-4 md:row-span-2 rounded-[24px] p-8 relative overflow-hidden bg-gradient-to-br from-[#0B1220] to-[#1F2937] text-white grain">
              <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-[#22C55E]/20 blur-3xl"/>
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FCD34D]/20 text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Har mahine bachao</div>
                <h3 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tighter font-display leading-tight">Kirana wale se<br/>upto 20% sasta.</h3>
                <p className="mt-4 text-white/70 max-w-xl leading-relaxed">Kyunki hum poore mahine ka bulk order lete hain, middlemen ka margin bachta hai — aur woh saving aap tak pahunchti hai. Pehle mahine mein hi ₹1,000+ ki bachat.</p>
                <div className="mt-8 flex items-center gap-6 text-sm">
                  <div><div className="font-display text-3xl font-bold text-[#FCD34D]">23+</div><div className="text-white/60 text-xs uppercase tracking-widest">Kirana SKUs</div></div>
                  <div className="h-8 w-px bg-white/20"/>
                  <div><div className="font-display text-3xl font-bold text-[#FCD34D]">4hr</div><div className="text-white/60 text-xs uppercase tracking-widest">Home delivery</div></div>
                  <div className="h-8 w-px bg-white/20"/>
                  <div><div className="font-display text-3xl font-bold text-[#FCD34D]">100%</div><div className="text-white/60 text-xs uppercase tracking-widest">OTP secure</div></div>
                </div>
              </div>
            </div>

            <BentoCard icon={Truck} title="4-ghante mein" body="Weekend ho ya weekday, morning ya raat — aap chuno." bg="bg-[#DCFCE7]" iconBg="bg-[#22C55E] text-white"/>
            <BentoCard icon={Store} title="Har bada brand" body="Aashirvaad, Fortune, Tata, Amul — jo aap ghar mein use karte ho." bg="bg-[#FEF3C7]" iconBg="bg-[#F59E0B] text-white"/>
            <BentoCard icon={ShieldCheck} title="OTP-only login" body="Password bhulne ki tension khatam." bg="bg-[#FCE7F3]" iconBg="bg-[#EC4899] text-white"/>
            <BentoCard icon={Sparkles} title="Hinglish search" body="'तेल' likho ya 'atta' — dono chalte hain." bg="bg-[#E9D5FF]" iconBg="bg-[#6C3BFF] text-white"/>
          </div>
        </section>

        {/* --------- SOCIAL PROOF STRIP --------- */}
        <section className="max-w-7xl mx-auto px-6 py-14">
          <div className="rounded-[32px] bg-[#22C55E] text-white p-8 sm:p-12 mg-shadow-brand relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/10 blur-3xl -translate-y-24 translate-x-24"/>
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 text-[#FCD34D] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Families ka pyaar</div>
                <h3 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tighter font-display leading-tight">
                  &ldquo;Kirana ki tension khatam. Har mahine paisa bhi bacha, time bhi.&rdquo;
                </h3>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">P</div>
                  <div>
                    <div className="font-semibold">Priya M., Andheri</div>
                    <div className="text-xs text-white/70">4 logon ka ghar · Since 2025</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <ProofStat n="₹1.2L" label="families ne is saal bachaya"/>
                <ProofStat n="4.9★" label="average rating"/>
                <ProofStat n="98%" label="har mahine wapas order karte hain"/>
              </div>
            </div>
          </div>
        </section>

        {/* --------- FINAL CTA --------- */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter font-display leading-tight">
            Pantry planned.<br/>Mahina simplified.
          </h2>
          <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto">Pehla monthly cart 4 ghante mein ghar. No subscription. No commitment. Sirf sealed pantry packs.</p>
          <Link to="/shop" data-testid="cta-final">
            <Button className="mt-8 rounded-full bg-[#0B1220] hover:bg-[#1F2937] text-white h-14 px-10 text-base font-semibold group">
              Free mein shuru karo
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"/>
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#F1EAD8] py-10 mt-8 bg-white/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-gray-500">
          <MonthlyGroceryLogo size="sm" />
          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> Pan India delivery</div>
          <div>© {new Date().getFullYear()} MonthlyGrocery · monthlygrocery.in</div>
        </div>
      </footer>
    </div>
  );
}

function HeroImage() {
  // Verified Unsplash photos of families & couples with groceries in stores.
  // Each slide has a Hinglish caption that fits the shot.
  const slides = [
    {
      // Indian woman in pink traditional outfit with white shopping bag (Anurag Jamwal, IN)
      url: "https://images.unsplash.com/photo-1780504863283-3157e6d141e1?w=1000&q=85&auto=format&fit=crop",
      caption: "Traditional se digital tak — har ghar ka kirana.",
      tag: "Bharat ka kirana",
    },
    {
      // Family shopping in a grocery store (Vitaly Gariev)
      url: "https://images.unsplash.com/photo-1753354868403-bb9e04e74668?w=1000&q=85&auto=format&fit=crop",
      caption: "Poore parivaar ka mahine ka kirana, ek order me.",
      tag: "Family favourite",
    },
    {
      // Woman selling groceries on a city street — kirana context (Benjamin Chambon)
      url: "https://images.unsplash.com/photo-1752006183600-3891042ed904?w=1000&q=85&auto=format&fit=crop",
      caption: "Aapke mohalle ki kirana, aapke phone par.",
      tag: "Local shops, delivered",
    },
    {
      // Indian shopper in-store (Sahil Shettigar, IN)
      url: "https://images.unsplash.com/photo-1667665908399-6d858dd26231?w=1000&q=85&auto=format&fit=crop",
      caption: "Har brand jo aap ghar me use karte ho — sealed & delivered.",
      tag: "500+ SKUs",
    },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);
  const active = slides[i];
  const prev = () => setI((i - 1 + slides.length) % slides.length);
  const next = () => setI((i + 1) % slides.length);

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        <motion.img
          key={i}
          src={active.url}
          alt={active.caption}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>
      {/* Cinematic tint */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/85 via-[#0B1220]/10 to-transparent"/>

      {/* Kirana ribbon at top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <motion.span
          key={`tag-${i}`}
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3"/> {active.tag}
        </motion.span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur text-[#0B1220] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
          ₹2,500+ order
        </span>
      </div>

      {/* Caption */}
      <div className="absolute bottom-16 left-6 right-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`cap-${i}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5 }}
            className="text-white font-display font-semibold text-2xl leading-tight">
            {active.caption}
          </motion.div>
        </AnimatePresence>
        <div className="text-white/85 text-xs mt-2 flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><Truck className="w-3 h-3"/> 4 ghante mein</span>
          <span className="inline-flex items-center gap-1"><Percent className="w-3 h-3"/> 20% bachat</span>
          <span className="inline-flex items-center gap-1">🌾 Sealed packs</span>
        </div>
      </div>

      {/* Carousel controls */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          {slides.map((_, s) => (
            <button key={s} data-testid={`hero-dot-${s}`} onClick={() => setI(s)}
              className={`h-1.5 rounded-full transition-all ${s === i ? "w-6 bg-[#FCD34D]" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
              aria-label={`Slide ${s + 1}`}/>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button data-testid="hero-prev" onClick={prev} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
          <button data-testid="hero-next" onClick={next} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  );
}

function TrustPill({ icon: Icon, label }) {  return (
    <div className="flex flex-col items-center gap-1.5 text-center rounded-2xl bg-white border border-[#F1EAD8] p-3 mg-shadow-soft">
      <Icon className="w-5 h-5 text-[#22C55E]"/>
      <div className="text-xs font-semibold text-gray-700 leading-tight">{label}</div>
    </div>
  );
}

function BentoCard({ icon: Icon, title, body, bg, iconBg }) {
  return (
    <div className={`md:col-span-2 rounded-[24px] p-6 border border-[#F1EAD8] ${bg} card-lift relative`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}><Icon className="w-5 h-5"/></div>
      <h4 className="mt-4 text-xl font-bold tracking-tight font-display">{title}</h4>
      <p className="mt-1 text-sm text-gray-700 leading-snug">{body}</p>
    </div>
  );
}

function ProofStat({ n, label }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 text-center border border-white/20">
      <div className="font-display text-2xl sm:text-3xl font-bold">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/80 mt-1 leading-tight">{label}</div>
    </div>
  );
}
