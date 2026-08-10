import { useLocation, useNavigate } from "react-router-dom";
import { Crown, X, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Sticky floating pill that appears when a Super Admin is browsing the
 * consumer storefront in "View as Customer" mode. Clicking it exits the
 * preview and returns them to the Super Admin control tower.
 */
export default function ViewAsBanner() {
  const { isSuper, viewAs, setViewAs } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Only render on consumer surfaces — never over the admin panel.
  const isAdminSurface = pathname.startsWith("/admin");
  if (!isSuper || viewAs !== "consumer" || isAdminSurface) return null;

  const exit = () => {
    setViewAs(null);
    navigate("/admin/dashboard");
  };

  return (
    <div
      data-testid="view-as-consumer-banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-3 rounded-full bg-[#0F172A] text-[#FCD34D] pl-3 pr-1.5 py-1.5 mg-shadow-brand border border-[#FCD34D]/30"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
        <Crown className="w-3.5 h-3.5"/>Super Admin
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
        <Eye className="w-3.5 h-3.5"/>Viewing as Customer
      </span>
      <button
        data-testid="view-as-exit"
        onClick={exit}
        className="inline-flex items-center gap-1 rounded-full bg-[#FCD34D] text-[#0F172A] px-3 py-1.5 text-[11px] font-bold hover:bg-[#F5C441]"
      >
        <X className="w-3.5 h-3.5"/> Exit preview
      </button>
    </div>
  );
}
