'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  Truck,
  Percent,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  LogIn,
  Package,
  HeartHandshake,
  Smartphone
} from 'lucide-react';

const LOGO_URL = "https://customer-assets-agu9un31.emergentagent.net/job_zopin-preview/artifacts/ajjfrqqn_image.png";

export default function LandingPage() {
  const [activeSpend, setActiveSpend] = useState<number>(5000);

  // Savings calculations
  const calculateSavings = (spend: number) => {
    const monthlySaving = Math.round(spend * 0.20);
    const yearlySaving = monthlySaving * 12;
    return { monthlySaving, yearlySaving };
  };

  const { monthlySaving, yearlySaving } = calculateSavings(activeSpend);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif',
      color: '#0B1220',
      overflowX: 'hidden'
    }}>
      {/* ----------------- TOP PROMO BAR ----------------- */}
      <div style={{
        backgroundColor: '#1E7A46',
        color: '#FFFFFF',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <Sparkles size={15} color="#FDE047" />
        <span>First Month Grocery Special: Flat <strong>20% OFF</strong> on orders above ₹2,500 + Free 4-Hour Delivery</span>
      </div>

      {/* ----------------- NAVBAR ----------------- */}
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #EFE8D8',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#F5EFE1',
              padding: '2px 6px'
            }}>
              <img
                src={LOGO_URL}
                alt="MonthlyGrocery"
                style={{ height: '38px', width: 'auto', display: 'block' }}
              />
            </span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#pantry-packs" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Pantry Packs</a>
            <a href="#savings-calculator" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Savings Calculator</a>
            <a href="#how-it-works" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>How It Works</a>
            <Link href="/privacy-policy" style={{ color: '#4B5563', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Privacy Policy</Link>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <LogIn size={14} />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '50px 24px 70px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        {/* Hero Left Content */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '18px'
          }}>
            <Sparkles size={14} />
            <span>BHARAT KA KIRANA REVOLUTION</span>
          </div>

          <h1 style={{
            fontSize: '44px',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#0B1220',
            letterSpacing: '-1px',
            margin: '0 0 18px 0'
          }}>
            Aapke mohalle ki kirana dukaan.<br />
            <span style={{ color: '#1E7A46' }}>Mahine bhar ka ration.</span>
          </h1>

          <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#4B5563',
            marginBottom: '32px'
          }}>
            Plan your complete monthly pantry basket once. We fetch the guaranteed lowest area prices from certified neighbourhood stores and deliver sealed packs within 4 hours.
          </p>

          {/* Quick Stats / Trust Points */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            marginBottom: '36px'
          }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '16px', border: '1px solid #EFE8D8', textAlign: 'center' }}>
              <Truck size={22} color="#1E7A46" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220' }}>4-Hour</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>Home Delivery</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '16px', border: '1px solid #EFE8D8', textAlign: 'center' }}>
              <Percent size={22} color="#1E7A46" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220' }}>20% OFF</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>₹2,500+ Orders</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '16px', border: '1px solid #EFE8D8', textAlign: 'center' }}>
              <ShieldCheck size={22} color="#1E7A46" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0B1220' }}>100% Sealed</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>Factory Fresh</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                borderRadius: '9999px',
                backgroundColor: '#1E7A46',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 700,
                boxShadow: '0 10px 25px rgba(30, 122, 70, 0.25)'
              }}
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>

            <a
              href="#savings-calculator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 26px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#0B1220',
                border: '1px solid #D1D5DB',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600
              }}
            >
              Calculate Savings
            </a>
          </div>
        </div>

        {/* Hero Right: Visual Carousel */}
        <HeroCarousel />
      </section>

      {/* ----------------- SECTION: KIRANA PANTRY PACKS ----------------- */}
      <section id="pantry-packs" style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #EFE8D8',
        borderBottom: '1px solid #EFE8D8',
        padding: '70px 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E7A46', letterSpacing: '1px', textTransform: 'uppercase' }}>
              FACTORY SEALED BULK PACKS
            </span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#0B1220', marginTop: '8px', letterSpacing: '-0.5px' }}>
              Mahine Ka Kirana, Wholesale Ke Daam
            </h2>
            <p style={{ fontSize: '16px', color: '#6B7280', marginTop: '10px' }}>
              No small 200g sachets. We deliver full 5kg, 10kg, 25kg monthly pantry packs directly to your doorstep.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            <PantryPackCard
              title="Aashirvaad Shudh Chakki Atta"
              size="10 kg Sealed Pack"
              mrp="₹499"
              price="₹449"
              saving="Save ₹50 (10% OFF)"
              category="Atta & Flours"
              image="https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/aashirvaad_atta_10kg.png"
            />
            <PantryPackCard
              title="Fortune Sunlite Sunflower Oil"
              size="5 Litre Can / Pouch"
              mrp="₹899"
              price="₹749"
              saving="Save ₹150 (17% OFF)"
              category="Oils & Ghee"
              image="https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/prod_1788519424287_w0855u.png"
            />
            <PantryPackCard
              title="Daawat Rozana Super Basmati Rice"
              size="5 kg Pack"
              mrp="₹599"
              price="₹479"
              saving="Save ₹120 (20% OFF)"
              category="Rice & Grains"
              image="https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/prod_1788519364045_rr06qa.png"
            />
            <PantryPackCard
              title="Tata Sampann Unpolished Toor Dal"
              size="2 kg Value Pack"
              mrp="₹380"
              price="₹310"
              saving="Save ₹70 (18% OFF)"
              category="Dals & Pulses"
              image="https://monthly-grocery-media-prod.s3.ap-south-1.amazonaws.com/products/prod_1788519449900_nqjgm7.png"
            />
          </div>
        </div>
      </section>

      {/* ----------------- SECTION: SAVINGS CALCULATOR ----------------- */}
      <section id="savings-calculator" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 24px'
      }}>
        <div style={{
          backgroundColor: '#0F172A',
          borderRadius: '28px',
          padding: '56px 40px',
          color: '#FFFFFF',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '6px 14px',
              backgroundColor: '#1E7A4640',
              color: '#4ADE80',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '16px'
            }}>
              💰 MONTHLY SAVINGS CALCULATOR
            </span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.2 }}>
              See How Much Your Family Saves Every Month
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
              Select your average monthly grocery budget below. We aggregate bulk buying power to pass wholesale prices directly to you.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[3000, 5000, 8000, 12000].map((spend) => (
                <button
                  key={spend}
                  onClick={() => setActiveSpend(spend)}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: activeSpend === spend ? '#22C55E' : '#334155',
                    backgroundColor: activeSpend === spend ? '#22C55E' : '#1E293B',
                    color: activeSpend === spend ? '#0B1220' : '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ₹{spend.toLocaleString('en-IN')}/mo
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Output Display Card */}
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Estimated Monthly Savings
            </div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#4ADE80', margin: '12px 0 6px 0' }}>
              ₹{monthlySaving.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '14px', color: '#CBD5E1', marginBottom: '24px' }}>
              + Free 4-Hour Delivery to Your Doorstep
            </div>

            <div style={{
              backgroundColor: '#0F172A',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '14px', color: '#94A3B8' }}>Annual Family Savings:</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#FDE047' }}>
                ₹{yearlySaving.toLocaleString('en-IN')}/yr
              </span>
            </div>

            <Link
              href="/login"
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#22C55E',
                color: '#0B1220',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 800,
                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)'
              }}
            >
              Start Saving Now
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION: HOW IT WORKS ----------------- */}
      <section id="how-it-works" style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #EFE8D8',
        padding: '70px 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 56px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E7A46', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SIMPLE 4-STEP PROCESS
            </span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#0B1220', marginTop: '8px' }}>
              Pantry Planned. Mahina Simplified.
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px'
          }}>
            <ProcessStep
              num="01"
              title="Fill Monthly Basket"
              desc="Select everything your kitchen needs for the whole month: Atta, Rice, Oil, Dals, Spices, and Cleaning essentials."
            />
            <ProcessStep
              num="02"
              title="Lowest Area Rate"
              desc="Our system compares local wholesale partners to guarantee the lowest price for your entire monthly list."
            />
            <ProcessStep
              num="03"
              title="4-Hour Delivery"
              desc="Your grocery packs arrive safely sealed at your doorstep in your preferred convenient delivery window."
            />
            <ProcessStep
              num="04"
              title="1-Tap Reorder"
              desc="Next month, simply tap reorder to copy your past basket and modify as needed in under 30 seconds."
            />
          </div>
        </div>
      </section>

      {/* ----------------- FOOTER ----------------- */}
      <footer style={{
        backgroundColor: '#0F172A',
        color: '#94A3B8',
        padding: '60px 24px 30px',
        borderTop: '1px solid #1E293B'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          paddingBottom: '40px',
          borderBottom: '1px solid #1E293B'
        }}>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '12px',
              backgroundColor: '#F5EFE1',
              padding: '4px 8px',
              marginBottom: '16px'
            }}>
              <img src={LOGO_URL} alt="MonthlyGrocery" style={{ height: '36px', width: 'auto' }} />
            </span>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#94A3B8' }}>
              Your entire monthly grocery list, delivered home in 4 hours with wholesale bulk savings.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: 2 }}>
              <li><a href="#pantry-packs" style={{ color: '#94A3B8', textDecoration: 'none' }}>Pantry Packs</a></li>
              <li><a href="#savings-calculator" style={{ color: '#94A3B8', textDecoration: 'none' }}>Savings Calculator</a></li>
              <li><a href="#how-it-works" style={{ color: '#94A3B8', textDecoration: 'none' }}>How It Works</a></li>
              <li><Link href="/privacy-policy" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Management</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: 2 }}>
              <li><Link href="/login" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600 }}>Admin Login Portal</Link></li>
              <li><span style={{ color: '#64748B' }}>Merchant Partner App</span></li>
              <li><span style={{ color: '#64748B' }}>Delivery Partner Network</span></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Support &amp; Contact</h4>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}><strong>Email:</strong> monthlygrocery7@gmail.com</p>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}><strong>Helpline:</strong> +91 8830480015</p>
            <p style={{ margin: 0, fontSize: '14px' }}><strong>Operations:</strong> Pune &amp; Maharashtra</p>
          </div>
        </div>

        <div style={{
          maxWidth: '1280px',
          margin: '24px auto 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: '#64748B',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>© {new Date().getFullYear()} MonthlyGrocery (EVER). All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/privacy-policy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy Policy</Link>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ----------------- SUB-COMPONENTS -----------------

function HeroCarousel() {
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

  return (
    <div style={{
      position: 'relative',
      height: '460px',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      border: '1px solid #EFE8D8'
    }}>
      <img
        src={active.url}
        alt={active.caption}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'all 0.5s ease'
        }}
      />
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(11, 18, 32, 0.9) 0%, rgba(11, 18, 32, 0.2) 60%, transparent 100%)'
      }} />

      {/* Top Tag */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          backgroundColor: '#22C55E',
          color: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          ✨ {active.tag}
        </span>
        <span style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: '#0B1220',
          padding: '6px 12px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700
        }}>
          ₹12,500+ Saved
        </span>
      </div>

      {/* Bottom Caption */}
      <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
        <h3 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, margin: '0 0 10px 0', lineHeight: 1.3 }}>
          {active.caption}
        </h3>
        <div style={{ display: 'flex', gap: '14px', color: 'rgba(255, 255, 255, 0.85)', fontSize: '12px', fontWeight: 600 }}>
          <span>🚚 4 Ghante Me</span>
          <span>•</span>
          <span>🏷️ 20% Bachat</span>
          <span>•</span>
          <span>📦 Sealed Packs</span>
        </div>
      </div>
    </div>
  );
}

function PantryPackCard({ title, size, mrp, price, saving, category, image }: {
  title: string;
  size: string;
  mrp: string;
  price: string;
  saving: string;
  category: string;
  image: string;
}) {
  return (
    <div style={{
      backgroundColor: '#FAFAF7',
      borderRadius: '20px',
      border: '1px solid #EFE8D8',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      <div>
        <div style={{
          height: '160px',
          borderRadius: '14px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          overflow: 'hidden',
          padding: '10px'
        }}>
          <img src={image} alt={title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1E7A46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {category}
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1220', margin: '4px 0 6px 0' }}>
          {title}
        </h3>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          {size}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #EFE8D8', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#0B1220' }}>{price}</span>
          <span style={{ fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>{mrp}</span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
          {saving}
        </div>
      </div>
    </div>
  );
}

function ProcessStep({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{
      backgroundColor: '#FAFAF7',
      padding: '30px',
      borderRadius: '20px',
      border: '1px solid #EFE8D8'
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: 900,
        color: '#1E7A46',
        marginBottom: '12px',
        fontFamily: 'monospace'
      }}>
        {num}
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0B1220', margin: '0 0 8px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
        {desc}
      </p>
    </div>
  );
}
