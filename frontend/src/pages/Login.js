import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/context/AuthContext";
import MonthlyGroceryLogo from "@/components/MonthlyGroceryLogo";

export default function Login() {
  const [step, setStep] = useState(1); // 1: mobile, 2: OTP
  const [role, setRole] = useState("consumer");
  const [mobile, setMobile] = useState("");
  const [normalizedMobile, setNormalizedMobile] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const doSend = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!/^\+?[\d\s-]{10,15}$/.test(mobile.trim())) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    const res = await sendOtp(mobile.trim(), role);
    setLoading(false);
    if (!res.ok) { setError(res.error); toast.error(res.error); return; }
    setNormalizedMobile(res.mobile);
    setStep(2);
    setResendIn(30);
    toast.success(`OTP sent to ${res.mobile}`);
  };

  const doVerify = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (code.length < 4) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true);
    const res = await verifyOtp(normalizedMobile, code.trim(), name.trim());
    setLoading(false);
    if (!res.ok) { setError(res.error); toast.error(res.error); return; }
    const dest = res.user.role === "super_admin" ? "/admin"
      : res.user.role === "admin" ? "/admin"
      : "/shop";
    toast.success(`Welcome, ${res.user.name || res.user.mobile}`);
    navigate(dest, { replace: true });
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    const res = await sendOtp(normalizedMobile || mobile, role);
    setLoading(false);
    if (res.ok) { toast.success("OTP resent"); setResendIn(30); }
    else { setError(res.error); toast.error(res.error); }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#FFF8ED]">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-[#0B1220] text-white grain">
        <MonthlyGroceryLogo variant="dark"/>
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FCD34D]/15 text-[#FCD34D] px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"/> Upto 20% OFF · Monthly Groceries
          </div>
          <h2 className="mt-6 text-5xl xl:text-6xl font-bold tracking-tighter font-display leading-[1.02]">
            Ghar ka <em className="not-italic text-[#22C55E]">poora</em><br/>kirana, delivered.
          </h2>
          <p className="mt-6 text-white/70 max-w-md leading-relaxed">Sirf mobile daalo — password ki tension nahi. OTP aayega SMS par.</p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="font-display font-bold text-2xl text-[#FCD34D]">4hr</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Delivery</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="font-display font-bold text-2xl text-[#22C55E]">20%</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Off</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="font-display font-bold text-2xl text-white">4.9★</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Rating</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-xs text-white/50 relative">
          <span>© MonthlyGrocery</span><span>·</span><span>Terms</span><span>·</span><span>Privacy</span>
        </div>
        <div className="absolute -right-32 -bottom-24 w-96 h-96 rounded-full bg-[#22C55E]/30 blur-3xl" />
        <div className="absolute -left-24 top-1/3 w-64 h-64 rounded-full bg-[#6C3BFF]/25 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="w-full max-w-md">
          <div className="lg:hidden mb-8"><MonthlyGroceryLogo/></div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="s1" initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-10}} onSubmit={doSend}>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-display">Sign in / Sign up</h1>
                <p className="text-gray-600 mt-2">Enter your mobile to receive an OTP.</p>

                <Tabs value={role} onValueChange={setRole} className="mt-6">
                  <TabsList className="grid grid-cols-2 rounded-full bg-white border border-[#F1EAD8] p-1 w-full mg-shadow-soft">
                    <TabsTrigger data-testid="tab-consumer" value="consumer" className="rounded-full data-[state=active]:bg-[#22C55E] data-[state=active]:text-white data-[state=active]:shadow font-semibold">Consumer</TabsTrigger>
                    <TabsTrigger data-testid="tab-admin" value="admin" className="rounded-full data-[state=active]:bg-[#0B1220] data-[state=active]:text-white data-[state=active]:shadow font-semibold">Admin</TabsTrigger>
                  </TabsList>
                </Tabs>

                {role === "admin" && (
                  <div className="mt-4 rounded-xl bg-[#0B1220] text-[#FCD34D] p-3 text-xs">
                    <span className="font-bold">Invite-only:</span> Admin access hai sirf un mobiles ko jo Super Admin ne whitelist kiye hain.
                  </div>
                )}

                <div className="mt-6">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <div className="mt-1.5 flex items-center rounded-xl bg-white border-2 border-[#F1EAD8] focus-within:border-[#22C55E] transition-colors mg-shadow-soft">
                    <div className="pl-4 pr-2 text-sm text-gray-600 font-semibold flex items-center gap-1"><Phone className="w-4 h-4"/>+91</div>
                    <Input data-testid="login-mobile" id="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" required value={mobile} onChange={(e)=>setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))} placeholder="9833833498" className="border-0 focus-visible:ring-0 h-12 text-base bg-transparent"/>
                  </div>
                </div>

                {error && <div data-testid="login-error" className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

                <Button data-testid="login-send-otp" disabled={loading} type="submit" className="mt-6 w-full rounded-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-base font-semibold mg-shadow-brand">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Send OTP"}
                </Button>

                <div className="mt-6 text-xs text-gray-500 flex items-center gap-2 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]"/> Secure OTP via SMS · No passwords needed
                </div>

                <div data-testid="twilio-badge-login" className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-semibold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5FE] text-[#1E40AF] px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"/>
                    SMS delivery powered by <span className="font-bold">Twilio Verify</span>
                  </span>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="s2" initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-10}} onSubmit={doVerify}>
                <button type="button" onClick={()=>{setStep(1); setCode(""); setError("");}} data-testid="back-to-mobile" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF]"><ArrowLeft className="w-4 h-4"/> Change number</button>
                <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Verify OTP</h1>
                <p className="text-gray-500 mt-2">We sent a 6-digit code to <span className="font-semibold text-gray-800">{normalizedMobile}</span></p>

                <div className="mt-6">
                  <Label htmlFor="otp">OTP code</Label>
                  <Input data-testid="login-otp" id="otp" type="tel" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} autoFocus required value={code}
                    onChange={(e)=>setCode(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="••••••" className="mt-1.5 rounded-xl h-14 text-center text-2xl tracking-[0.6em] font-bold"/>
                </div>

                <div>
                  <Label htmlFor="name" className="mt-4">Your name <span className="text-xs text-gray-400 font-normal">(only asked once)</span></Label>
                  <Input data-testid="login-name" id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" className="mt-1.5 rounded-xl h-11"/>
                </div>

                {error && <div data-testid="login-error" className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

                <Button data-testid="login-verify" disabled={loading} type="submit" className="mt-6 w-full rounded-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-base font-semibold mg-shadow-brand">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Verify & continue"}
                </Button>

                <button type="button" onClick={resend} disabled={resendIn > 0 || loading} data-testid="resend-otp" className="mt-4 w-full text-sm text-[#22C55E] font-semibold disabled:text-gray-400">
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </button>

                <div data-testid="twilio-badge-otp" className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-semibold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5FE] text-[#1E40AF] px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"/>
                    OTP delivered via <span className="font-bold">Twilio</span>
                  </span>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-xs text-gray-500 text-center">
            <Link to="/" className="hover:text-[#22C55E] font-semibold">← Back to home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
