import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Store, BarChart3, LogOut, Menu, UserCheck, ShieldCheck, MessageSquare, Crown, Wrench, Activity, Image as ImageIcon, Eye, ChevronDown, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import MonthlyGroceryLogo from "@/components/MonthlyGroceryLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CONSUMER_ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, key: "orders" },
  { to: "/admin/inventory", label: "SKUs & Inventory", icon: Package, key: "inventory" },
  { to: "/admin/store-profile", label: "Store profile", icon: Store, key: "store-profile" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, key: "analytics" },
];

const SUPER_ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Control tower", icon: LayoutDashboard, key: "dashboard" },
  { to: "/admin/approvals", label: "Admin team", icon: UserCheck, key: "approvals" },
  { to: "/admin/banners", label: "Home banners", icon: ImageIcon, key: "banners" },
  { to: "/admin/activity", label: "Activity log", icon: Activity, key: "activity" },
  { to: "/admin/twilio-logs", label: "Twilio SMS logs", icon: MessageSquare, key: "twilio-logs" },
];

// Two distinct visual themes so Super Admin & Admin cannot be confused.
const THEMES = {
  super_admin: {
    // Deep slate / indigo control tower with gold accent
    sidebarBg: "bg-[#0F172A]",
    sidebarText: "text-slate-300",
    sidebarBorder: "border-slate-800",
    activeBg: "bg-[#FCD34D] text-[#0F172A]",
    hoverBg: "hover:bg-slate-800",
    accentText: "text-[#FCD34D]",
    banner: "bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-[#FCD34D] border-slate-800",
    kicker: "SUPER ADMIN",
    tagline: "Platform Control Tower",
    icon: Crown,
    pageBg: "bg-slate-50",
  },
  admin: {
    // Signature MonthlyGrocery purple / green operations panel
    sidebarBg: "bg-white",
    sidebarText: "text-gray-600",
    sidebarBorder: "border-gray-100",
    activeBg: "bg-[#F3EEFF] text-[#6C3BFF]",
    hoverBg: "hover:bg-gray-50",
    accentText: "text-[#6C3BFF]",
    banner: "bg-gradient-to-r from-[#EEF7EF] via-[#F5F1FF] to-[#EEF7EF] text-[#0F172A] border-[#DCFCE7]",
    kicker: "ADMIN",
    tagline: "Store Operations",
    icon: Wrench,
    pageBg: "bg-[#F9FAFB]",
  },
};

export default function AdminLayout() {
  const { user, logout, isSuper, viewAs, setViewAs, effectiveRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => { await logout(); navigate("/login"); };
  const isPending = user?.status === "pending";
  // A super admin can preview the panel AS admin. viewAs="consumer" is handled
  // by redirecting them to the consumer shop (see effect below).
  const showAsAdmin = isSuper && viewAs === "admin";
  const showAsSuper = user?.role === "super_admin" && !showAsAdmin;
  const nav = showAsSuper ? SUPER_ADMIN_NAV : CONSUMER_ADMIN_NAV;
  const theme = THEMES[showAsSuper ? "super_admin" : "admin"];
  const RoleIcon = theme.icon;

  // If the super admin flips to "customer" view, drop them into the shop.
  useEffect(() => {
    if (isSuper && viewAs === "consumer") navigate("/shop");
  }, [isSuper, viewAs, navigate]);

  const sidebarLogoWrap = showAsSuper ? "brightness-0 invert" : "";

  return (
    <div className={`min-h-screen ${theme.pageBg} flex`} data-testid={showAsSuper ? "layout-super-admin" : "layout-admin"}>
      <aside data-testid="admin-sidebar" className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 ${theme.sidebarBg} border-r ${theme.sidebarBorder} p-6 flex flex-col ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform`}>
        <div className={sidebarLogoWrap}><MonthlyGroceryLogo /></div>

        <div className={`mt-4 rounded-xl px-3 py-2.5 border ${showAsSuper ? "border-[#FCD34D]/30 bg-[#FCD34D]/10" : "border-[#6C3BFF]/20 bg-[#F3EEFF]"}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${showAsSuper ? "bg-[#FCD34D] text-[#0F172A]" : "bg-[#6C3BFF] text-white"}`}>
              <RoleIcon className="w-4 h-4"/>
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] uppercase tracking-widest font-bold ${theme.accentText}`}>{theme.kicker}</div>
              <div className={`text-xs font-semibold truncate ${showAsSuper ? "text-slate-100" : "text-gray-800"}`}>{theme.tagline}</div>
            </div>
          </div>
          {isPending && <Badge className="mt-2 bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">Pending approval</Badge>}
          {isSuper && <ViewAsSwitcher viewAs={effectiveRole} onChange={setViewAs} showAsSuper={showAsSuper}/>}
        </div>

        <nav className="mt-6 space-y-1 flex-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} data-testid={`admin-nav-${n.key}`}
              onClick={()=>setOpen(false)}
              className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive ? theme.activeBg : `${theme.sidebarText} ${theme.hoverBg}`}`}>
              <n.icon className="w-4 h-4"/> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t ${theme.sidebarBorder} pt-4 mt-4`}>
          <div className={`text-xs uppercase tracking-widest font-semibold ${showAsSuper ? "text-slate-500" : "text-gray-400"}`}>Signed in</div>
          <div className={`mt-1 text-sm font-semibold truncate ${showAsSuper ? "text-slate-100" : "text-gray-800"}`}>{user.name || user.mobile}</div>
          <div className={`text-xs truncate ${showAsSuper ? "text-slate-400" : "text-gray-500"}`}>{user.mobile}</div>
          <button data-testid="admin-logout" onClick={onLogout} className={`mt-3 w-full inline-flex items-center gap-2 text-sm font-semibold ${showAsSuper ? "text-red-300 hover:text-red-200" : "text-red-500 hover:text-red-600"}`}><LogOut className="w-4 h-4"/> Log out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 glass-nav px-4 py-3 flex items-center justify-between">
          <MonthlyGroceryLogo size="sm"/>
          <div className="flex items-center gap-2">
            <Badge data-testid="role-badge-mobile" className={showAsSuper ? "bg-[#FCD34D] text-[#0F172A] hover:bg-[#FCD34D]" : "bg-[#F3EEFF] text-[#6C3BFF] hover:bg-[#F3EEFF]"}>{theme.kicker}</Badge>
            <Button data-testid="mobile-menu" onClick={()=>setOpen(!open)} variant="ghost" className="rounded-full"><Menu className="w-5 h-5"/></Button>
          </div>
        </header>

        {/* Role banner — makes the panel visually unmistakable */}
        <div data-testid="role-banner" className={`hidden lg:flex items-center justify-between px-10 py-3 border-b ${theme.banner}`}>
          <div className="flex items-center gap-3">
            <RoleIcon className={`w-5 h-5 ${showAsSuper ? "text-[#FCD34D]" : "text-[#22C55E]"}`}/>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold">{theme.kicker} PORTAL</div>
              <div className={`text-sm font-semibold ${showAsSuper ? "text-slate-100" : "text-slate-800"}`}>{theme.tagline}</div>
            </div>
            {isSuper && !showAsSuper && (
              <Badge data-testid="viewing-as-badge" className="ml-2 bg-[#FCD34D] text-[#0F172A] hover:bg-[#FCD34D] text-[10px]">
                <Eye className="w-3 h-3 mr-1"/>Viewing as Admin
              </Badge>
            )}
          </div>
          <div className={`text-xs font-semibold ${showAsSuper ? "text-[#FCD34D]/80" : "text-[#22C55E]"}`}>
            {showAsSuper ? "You control the entire platform" : "You manage the catalog & orders"}
          </div>
        </div>

        <main className="p-6 sm:p-10">
          {isPending && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900">
              <div className="font-semibold">Your admin account is pending approval</div>
              <div className="text-sm mt-1">You can browse the console but cannot add, edit or delete SKUs until Super Admin approves you.</div>
            </div>
          )}
          <Outlet context={{ isSuper: showAsSuper }}/>
        </main>
      </div>
    </div>
  );
}

/**
 * Compact dropdown that lets a super admin preview the panel as an Admin
 * or hop over to the consumer storefront. Uses just standard buttons + a
 * click-outside handler so we don't pull in a heavy Popover.
 */
function ViewAsSwitcher({ viewAs, onChange, showAsSuper }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const options = [
    { key: "super_admin", label: "Super Admin", icon: Crown, hint: "Full platform control" },
    { key: "admin", label: "Admin",             icon: Wrench, hint: "Catalog & orders only" },
    { key: "consumer", label: "Customer",       icon: User,   hint: "Preview the shop" },
  ];
  const current = options.find(o => o.key === (viewAs || "super_admin")) || options[0];
  const CurrentIcon = current.icon;

  return (
    <div className="mt-3 relative" ref={ref}>
      <button
        data-testid="view-as-toggle"
        type="button"
        onClick={()=>setOpen(v=>!v)}
        className={`w-full inline-flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${showAsSuper ? "bg-slate-800/60 text-slate-200 hover:bg-slate-800" : "bg-white/70 text-gray-700 hover:bg-white"}`}
      >
        <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/>View as</span>
        <span className="inline-flex items-center gap-1">
          <CurrentIcon className="w-3.5 h-3.5"/> {current.label}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}/>
        </span>
      </button>
      {open && (
        <div data-testid="view-as-menu" className="absolute z-40 top-full left-0 right-0 mt-1 rounded-xl bg-white border border-gray-200 mm-shadow-soft overflow-hidden">
          {options.map(o => {
            const OIcon = o.icon;
            const active = current.key === o.key;
            return (
              <button key={o.key} data-testid={`view-as-${o.key}`}
                type="button"
                onClick={()=>{ onChange(o.key === "super_admin" ? null : o.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 ${active ? "bg-[#DCFCE7]" : ""}`}>
                <OIcon className={`w-4 h-4 ${active ? "text-[#22C55E]" : "text-gray-500"}`}/>
                <div className="min-w-0">
                  <div className={`text-xs font-bold ${active ? "text-[#166534]" : "text-gray-800"}`}>{o.label}</div>
                  <div className="text-[10px] text-gray-500">{o.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
