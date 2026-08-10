import { useState, useEffect } from "react";

/**
 * Product image with a category-themed fallback.
 *
 * When the product has no `image_url` (or the image fails to load) we render a
 * beautiful placeholder that matches the product's primary_category — same
 * emoji + gradient we already use for the category tiles. Consumers get a
 * confident-looking tile even before the admin uploads a real product photo.
 */

// Kept in sync with the theme map on the Home page. Duplicating here so this
// component works standalone (Product / Cart pages import it too).
const CAT_THEMES = [
  { match: ["oil", "ghee", "tel"],                                       emoji: "🫒", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", ring: "#F59E0B" },
  { match: ["rice", "chawal", "basmati"],                                emoji: "🍚", bg: "linear-gradient(135deg, #FEFCE8 0%, #FEF3C7 100%)", ring: "#EAB308" },
  { match: ["atta", "flour", "wheat", "maida", "besan"],                 emoji: "🌾", bg: "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)", ring: "#D97706" },
  { match: ["sugar", "shakkar", "gud", "jaggery"],                       emoji: "🍬", bg: "linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)", ring: "#F43F5E" },
  { match: ["dal", "pulse", "lentil", "grain", "beans"],                 emoji: "🫘", bg: "linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)", ring: "#EA580C" },
  { match: ["spice", "masala", "salt", "chilli"],                        emoji: "🌶️", bg: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)", ring: "#DC2626" },
  { match: ["dairy", "milk", "curd", "paneer", "butter"],                emoji: "🥛", bg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)", ring: "#3B82F6" },
  { match: ["cooking essential", "essentials"],                          emoji: "🧂", bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", ring: "#22C55E" },
  { match: ["biscuit", "cookie", "cracker"],                             emoji: "🍪", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", ring: "#B45309" },
  { match: ["snack", "chip", "namkeen"],                                 emoji: "🍿", bg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", ring: "#DB2777" },
  { match: ["beverage", "drink", "juice", "tea", "coffee", "chai"],      emoji: "🥤", bg: "linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)", ring: "#0891B2" },
  { match: ["household", "clean", "detergent", "soap bar", "laundry"],   emoji: "🧴", bg: "linear-gradient(135deg, #E9D5FF 0%, #D8B4FE 100%)", ring: "#9333EA" },
  { match: ["personal care", "shampoo", "soap", "toothpaste", "hygiene"],emoji: "🧼", bg: "linear-gradient(135deg, #FCE7F3 0%, #F5D0FE 100%)", ring: "#C026D3" },
  { match: ["instant", "noodle", "ready", "maggi", "pasta"],             emoji: "🍜", bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", ring: "#D97706" },
  { match: ["baby", "diaper", "kids"],                                   emoji: "🍼", bg: "linear-gradient(135deg, #FFE4E6 0%, #FBCFE8 100%)", ring: "#EC4899" },
  { match: ["pet", "dog", "cat food"],                                   emoji: "🐾", bg: "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)", ring: "#B45309" },
  { match: ["fruit", "veg", "vegetable", "produce", "sabzi"],            emoji: "🥦", bg: "linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)", ring: "#16A34A" },
  { match: ["dry fruit", "nut", "kaju", "badam"],                        emoji: "🥜", bg: "linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)", ring: "#B45309" },
  { match: ["frozen", "ice cream"],                                      emoji: "🧊", bg: "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)", ring: "#2563EB" },
  { match: ["grocery", "general", "kirana", "staple"],                   emoji: "🛒", bg: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", ring: "#16A34A" },
];

const DEFAULT_THEME = { emoji: "🛒", bg: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)", ring: "#6B7280" };

export function themeFor(product) {
  const bag = [
    product?.primary_category,
    product?.secondary_category,
    product?.category,
    product?.name,
    product?.brand,
  ].filter(Boolean).join(" ").toLowerCase();
  for (const t of CAT_THEMES) {
    if (t.match.some(k => bag.includes(k))) return t;
  }
  return DEFAULT_THEME;
}

export function CategoryPlaceholder({ product, className = "", size = "md" }) {
  const theme = themeFor(product);
  const emojiClass = size === "sm" ? "text-4xl" : size === "lg" ? "text-7xl" : "text-6xl";
  const brand = (product?.brand || "").trim();
  const category = product?.secondary_category || product?.primary_category || "Kirana";
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      style={{ backgroundImage: theme.bg }}
      aria-hidden="true"
    >
      <div className={`${emojiClass} drop-shadow-sm`}>{theme.emoji}</div>
      {brand && (
        <div className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/70 text-[#0B1220] backdrop-blur max-w-[80%] truncate">{brand}</div>
      )}
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-[#0B1220]/70 max-w-[80%] truncate">{category}</div>
    </div>
  );
}

/**
 * Drop-in <img> replacement. Renders the actual photo when we have one, otherwise
 * shows the themed placeholder. Also swaps to the placeholder if the network
 * request for the photo fails at runtime.
 */
export default function ProductImage({ product, className = "", imgClassName = "w-full h-full object-cover", size = "md" }) {
  const [broken, setBroken] = useState(false);
  const url = product?.image_url;

  useEffect(() => { setBroken(false); }, [url]);

  if (!url || broken) {
    return (
      <div className={className}>
        <CategoryPlaceholder product={product} size={size}/>
      </div>
    );
  }
  return (
    <div className={className}>
      <img
        src={url}
        alt={product?.name || ""}
        loading="lazy"
        className={imgClassName}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
