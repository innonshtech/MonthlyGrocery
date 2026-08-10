import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const ITEMS = [
  { to: "/shop", label: "Home", icon: Home, key: "home" },
  { to: "/shop?view=categories", label: "Categories", icon: LayoutGrid, key: "categories" },
  { to: "/cart", label: "Cart", icon: ShoppingCart, key: "cart" },
  { to: "/orders", label: "Orders", icon: Package, key: "orders", authRequired: true },
  { to: "/shop?view=profile", label: "Profile", icon: User, key: "profile" },
];

export default function BottomNav() {
  const { cart } = useCart();
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const isAuthed = !!user && user !== false;

  const activeKey = (() => {
    if (pathname.startsWith("/cart")) return "cart";
    if (pathname.startsWith("/orders")) return "orders";
    if (search.includes("view=categories")) return "categories";
    if (search.includes("view=profile")) return "profile";
    if (pathname === "/shop") return "home";
    return "";
  })();

  return (
    <nav data-testid="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {ITEMS.map(({ to, label, icon: Icon, key, authRequired }) => {
          const active = activeKey === key;
          const showBadge = key === "cart" && cart.items.length > 0;
          const target = authRequired && !isAuthed ? "/login" : to;
          return (
            <Link key={key} to={target} data-testid={`bnav-${key}`}
              className="flex flex-col items-center justify-center py-2.5 relative">
              <div className={`p-1.5 rounded-xl relative ${active ? "bg-[#F3EEFF] text-[#6C3BFF]" : "text-gray-500"}`}>
                <Icon className="w-5 h-5"/>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#22C55E] text-white text-[10px] font-bold flex items-center justify-center">{cart.items.length}</span>
                )}
              </div>
              <div className={`text-[10px] font-semibold mt-0.5 ${active ? "text-[#6C3BFF]" : "text-gray-500"}`}>{label}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
