import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";

const AuthContext = createContext(null);

// Super Admin can preview the app as an Admin or Customer without logging out.
// Persisted in localStorage so the choice survives reloads.
const VIEW_AS_KEY = "mg_view_as_v1";
const VALID_VIEWS = ["super_admin", "admin", "consumer"];

function readViewAs() {
  try {
    const v = localStorage.getItem(VIEW_AS_KEY);
    return VALID_VIEWS.includes(v) ? v : null;
  } catch (_e) { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [viewAs, setViewAsState] = useState(readViewAs);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (_e) {
      setUser(false);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Only super admins are allowed to have a viewAs override; clear stale values otherwise.
  useEffect(() => {
    if (user && user !== false && user.role !== "super_admin" && viewAs) {
      setViewAsState(null);
      try { localStorage.removeItem(VIEW_AS_KEY); } catch (_e) { /* ignore */ }
    }
  }, [user, viewAs]);

  const setViewAs = useCallback((next) => {
    const clean = VALID_VIEWS.includes(next) ? next : null;
    setViewAsState(clean);
    try {
      if (clean) localStorage.setItem(VIEW_AS_KEY, clean);
      else localStorage.removeItem(VIEW_AS_KEY);
    } catch (_e) { /* ignore */ }
  }, []);

  const sendOtp = async (mobile, role) => {
    try {
      const { data } = await api.post("/auth/send-otp", { mobile, role });
      return { ok: true, mobile: data.mobile };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) };
    }
  };

  const verifyOtp = async (mobile, code, name) => {
    try {
      const { data } = await api.post("/auth/verify-otp", { mobile, code, name });
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) };
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_e) { /* ignore */ }
    setUser(false);
    setViewAs(null);
  };

  // The effective role that the UI should render for. Never used for
  // authorization on the backend — the server always checks the real JWT role.
  const isSuper = !!user && user !== false && user.role === "super_admin";
  const effectiveRole = isSuper && viewAs ? viewAs : (user && user !== false ? user.role : null);

  return (
    <AuthContext.Provider value={{
      user, initialized, sendOtp, verifyOtp, logout, refresh,
      viewAs, setViewAs, effectiveRole, isSuper,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
