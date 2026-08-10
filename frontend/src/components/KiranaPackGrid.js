/**
 * KiranaPackGrid — a custom illustration of packaged monthly kirana staples.
 * NO fresh produce / vegetables anywhere — this is a home-kirana pantry app.
 *
 * Each item is a hand-crafted SVG pack (paper bag, jar, bottle, pouch, tin, soap bar).
 */
export default function KiranaPackGrid() {
  return (
    <div className="relative w-full h-full">
      {/* Ambient background */}
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#FDF3DE] via-[#FFF8ED] to-[#FDE68A]/60 border border-[#F1EAD8] overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#22C55E]/15 blur-3xl"/>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#F97316]/15 blur-3xl"/>

        {/* Wooden-shelf line */}
        <div className="absolute inset-x-6 top-[55%] h-1 rounded-full bg-[#0B1220]/10"/>
        <div className="absolute inset-x-6 top-[calc(55%+4px)] h-2 rounded-full bg-[#0B1220]/5"/>

        {/* Pack grid */}
        <div className="absolute inset-0 p-6 grid grid-cols-3 gap-3 items-end">
          <AttaBag />
          <RicePouch />
          <OilBottle />
          <DalJar />
          <GheeTin />
          <SoapBar />
        </div>

        {/* Hinglish caption strip */}
        <div className="absolute bottom-4 inset-x-4 rounded-2xl bg-[#0B1220]/85 backdrop-blur-sm text-white p-3 pl-4 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#FCD34D] text-[#0B1220] flex items-center justify-center text-lg">🛒</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#FCD34D]">Har ghar ka kirana</div>
            <div className="text-sm font-display font-semibold leading-tight">Aata, chawal, dal, tel — sab tayyar</div>
          </div>
          <span className="rounded-full bg-[#22C55E] text-white text-[10px] font-bold px-2 py-1">FRESH PACK</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Individual packs ---------- */

function AttaBag() {
  return (
    <Pack label="Atta" hindi="आटा">
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
        {/* Paper bag */}
        <path d="M10 20 Q10 15 15 15 L65 15 Q70 15 70 20 L72 92 Q72 96 68 96 L12 96 Q8 96 8 92 Z" fill="#DC2626"/>
        <path d="M10 20 L70 20 L69 30 L11 30 Z" fill="#B91C1C"/>
        {/* Label */}
        <rect x="18" y="38" width="44" height="34" rx="3" fill="#FFF8ED"/>
        <text x="40" y="52" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0B1220" fontFamily="serif">ATTA</text>
        <text x="40" y="63" textAnchor="middle" fontSize="7" fill="#B91C1C" fontFamily="serif" fontWeight="700">10 KG</text>
        <line x1="22" y1="68" x2="58" y2="68" stroke="#0B1220" strokeWidth="0.5"/>
      </svg>
    </Pack>
  );
}

function RicePouch() {
  return (
    <Pack label="Rice" hindi="चावल">
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
        <path d="M12 22 L68 22 L72 96 L8 96 Z" fill="#FFF8ED" stroke="#0B1220" strokeWidth="0.5"/>
        {/* Top seal */}
        <rect x="10" y="16" width="60" height="8" fill="#0B1220"/>
        <path d="M14 16 L18 12 L22 16 L26 12 L30 16 L34 12 L38 16 L42 12 L46 16 L50 12 L54 16 L58 12 L62 16 L66 12" fill="none" stroke="#0B1220" strokeWidth="1"/>
        {/* Label */}
        <rect x="18" y="40" width="44" height="36" rx="2" fill="#22C55E"/>
        <text x="40" y="54" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" fontFamily="serif">BASMATI</text>
        <text x="40" y="67" textAnchor="middle" fontSize="6" fill="white">RICE · 5 KG</text>
        {/* Rice grains illustration */}
        <ellipse cx="30" cy="88" rx="1.5" ry="0.7" fill="#0B1220" opacity="0.4"/>
        <ellipse cx="40" cy="90" rx="1.5" ry="0.7" fill="#0B1220" opacity="0.4"/>
        <ellipse cx="50" cy="88" rx="1.5" ry="0.7" fill="#0B1220" opacity="0.4"/>
      </svg>
    </Pack>
  );
}

function OilBottle() {
  return (
    <Pack label="Oil" hindi="तेल">
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
        {/* Cap */}
        <rect x="32" y="4" width="16" height="10" rx="2" fill="#0B1220"/>
        {/* Neck */}
        <rect x="34" y="12" width="12" height="6" fill="#F59E0B"/>
        {/* Body */}
        <path d="M20 20 Q20 18 22 18 L58 18 Q60 18 60 20 L62 92 Q62 96 58 96 L22 96 Q18 96 18 92 Z" fill="#FDE68A"/>
        {/* Oil level */}
        <path d="M22 32 L58 32 L60 92 Q60 94 58 94 L22 94 Q20 94 20 92 Z" fill="#F59E0B" opacity="0.9"/>
        {/* Label */}
        <rect x="22" y="42" width="36" height="30" rx="2" fill="white"/>
        <text x="40" y="55" textAnchor="middle" fontSize="8" fontWeight="800" fill="#B45309" fontFamily="serif">OIL</text>
        <text x="40" y="65" textAnchor="middle" fontSize="6" fill="#0B1220" fontFamily="serif">SUNFLOWER · 5L</text>
        {/* Shine */}
        <rect x="26" y="46" width="3" height="42" rx="1" fill="white" opacity="0.6"/>
      </svg>
    </Pack>
  );
}

function DalJar() {
  return (
    <Pack label="Dal" hindi="दाल">
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
        {/* Lid */}
        <rect x="12" y="10" width="56" height="10" rx="2" fill="#7C2D12"/>
        <rect x="12" y="10" width="56" height="4" fill="#92400E"/>
        {/* Body */}
        <rect x="10" y="20" width="60" height="76" rx="4" fill="#FBBF24" opacity="0.85"/>
        {/* Dal grains texture */}
        {[...Array(24)].map((_, i) => {
          const x = 15 + (i % 6) * 10;
          const y = 30 + Math.floor(i / 6) * 12;
          return <circle key={i} cx={x} cy={y} r="1.6" fill="#B45309" opacity="0.7"/>;
        })}
        {/* Label */}
        <rect x="16" y="52" width="48" height="22" rx="2" fill="white" opacity="0.95"/>
        <text x="40" y="63" textAnchor="middle" fontSize="8" fontWeight="800" fill="#7C2D12" fontFamily="serif">TOOR DAL</text>
        <text x="40" y="71" textAnchor="middle" fontSize="6" fill="#0B1220" fontFamily="serif">1 KG</text>
      </svg>
    </Pack>
  );
}

function GheeTin() {
  return (
    <Pack label="Ghee" hindi="घी">
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
        {/* Tin body */}
        <rect x="14" y="24" width="52" height="72" rx="2" fill="#EAB308"/>
        <rect x="14" y="24" width="52" height="6" fill="#CA8A04"/>
        <rect x="14" y="90" width="52" height="6" fill="#CA8A04"/>
        {/* Lid */}
        <rect x="12" y="14" width="56" height="12" rx="2" fill="#CA8A04"/>
        <rect x="12" y="14" width="56" height="4" fill="#A16207"/>
        {/* Label */}
        <rect x="18" y="40" width="44" height="40" rx="2" fill="#FEF3C7"/>
        <text x="40" y="54" textAnchor="middle" fontSize="8" fontWeight="800" fill="#7C2D12" fontFamily="serif">DESI GHEE</text>
        <text x="40" y="64" textAnchor="middle" fontSize="6" fill="#0B1220">PURE · 1 KG</text>
        {/* Cow doodle */}
        <circle cx="40" cy="72" r="4" fill="none" stroke="#7C2D12" strokeWidth="1"/>
      </svg>
    </Pack>
  );
}

function SoapBar() {
  return (
    <Pack label="Soap" hindi="साबुन">
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-md">
        {/* Soap wrapper */}
        <rect x="8" y="30" width="64" height="56" rx="4" fill="#6C3BFF"/>
        <rect x="8" y="30" width="64" height="8" fill="#5A2FE0"/>
        {/* Label */}
        <rect x="14" y="46" width="52" height="30" rx="2" fill="#FFF8ED"/>
        <text x="40" y="58" textAnchor="middle" fontSize="7" fontWeight="800" fill="#6C3BFF" fontFamily="serif">SANDAL</text>
        <text x="40" y="68" textAnchor="middle" fontSize="6" fill="#0B1220" fontFamily="serif">SOAP · 100g</text>
        {/* Sparkle */}
        <path d="M62 42 L64 46 L68 44 L64 48 L62 52 L60 48 L56 44 L60 46 Z" fill="#FCD34D"/>
      </svg>
    </Pack>
  );
}

function Pack({ children, label, hindi }) {
  return (
    <div className="relative aspect-[3/4] transition-transform hover:-translate-y-1 duration-300">
      {children}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
        <div className="text-[9px] uppercase tracking-widest font-bold text-[#0B1220]/60">{label}</div>
        <div className="text-[9px] font-semibold text-[#22C55E]">{hindi}</div>
      </div>
    </div>
  );
}
