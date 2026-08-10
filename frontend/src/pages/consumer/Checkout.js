import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Wallet, Phone, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { user, initialized, sendOtp, verifyOtp } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();

  // Guest-friendly checkout is a 2-step flow:
  //  Step 1: Mobile + OTP (skipped once user is authenticated)
  //  Step 2: Address (exact_address, pincode 6-digit, landmark, city)
  const isAuthed = !!user && user !== false && user.role === "consumer";
  const [step, setStep] = useState(isAuthed ? 2 : 1);
  useEffect(() => { if (isAuthed) setStep(2); }, [isAuthed]);

  // --- Step 1 state ---
  const [otpPhase, setOtpPhase] = useState("mobile"); // mobile → code
  const [mobile, setMobile] = useState("");
  const [normalizedMobile, setNormalizedMobile] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // --- Step 2 state ---
  const [form, setForm] = useState({
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    phone: "",
    delivery_slot: "Within 4 hours",
    special_instructions: "",
  });
  useEffect(() => {
    if (!isAuthed) return;
    setForm(f => ({
      ...f,
      address: user.address || f.address,
      city: user.city || f.city,
      pincode: user.pincode || f.pincode,
      phone: user.mobile || f.phone,
    }));
  }, [isAuthed, user]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // ---- OTP handlers ----
  const doSendOtp = async (e) => {
    e?.preventDefault?.();
    setOtpError("");
    if (!/^\+?[\d\s-]{10,15}$/.test(mobile.trim())) { setOtpError("Enter a valid 10-digit mobile"); return; }
    setOtpLoading(true);
    const res = await sendOtp(mobile.trim(), "consumer");
    setOtpLoading(false);
    if (!res.ok) { setOtpError(res.error); toast.error(res.error); return; }
    setNormalizedMobile(res.mobile);
    setOtpPhase("code");
    setResendIn(30);
    toast.success(`OTP sent to ${res.mobile}`);
  };

  const doVerifyOtp = async (e) => {
    e?.preventDefault?.();
    setOtpError("");
    if (code.trim().length < 4) { setOtpError("Enter the OTP"); return; }
    setOtpLoading(true);
    const res = await verifyOtp(normalizedMobile, code.trim(), name.trim());
    setOtpLoading(false);
    if (!res.ok) { setOtpError(res.error); toast.error(res.error); return; }
    toast.success(`Verified. Welcome ${res.user.name || res.user.mobile}`);
    // CartContext will auto-merge guest cart via useEffect
    setForm(f => ({ ...f, phone: res.user.mobile || f.phone }));
    setStep(2);
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setOtpLoading(true);
    const res = await sendOtp(normalizedMobile || mobile, "consumer");
    setOtpLoading(false);
    if (res.ok) { toast.success("OTP resent"); setResendIn(30); }
    else { setOtpError(res.error); toast.error(res.error); }
  };

  // ---- Address submit ----
  const submit = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) { toast.error("Cart is empty"); return; }
    if (!form.address.trim()) { toast.error("Exact address is required"); return; }
    if (!form.landmark.trim()) { toast.error("Nearest landmark is required"); return; }
    if (!/^\d{6}$/.test(form.pincode.trim())) { toast.error("Enter a valid 6-digit PIN code"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/orders/checkout", { ...form, payment_method: "COD" });
      await refresh();
      toast.success("Order placed successfully");
      navigate(`/orders/${data.order.id}`);
    } catch (e) {
      const msg = e.response?.data?.detail || "Failed to place order";
      setError(String(msg));
      toast.error(String(msg));
    } finally { setLoading(false); }
  };

  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#22C55E]"/></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link to="/cart" data-testid="checkout-back" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#22C55E] text-sm font-semibold"><ArrowLeft className="w-4 h-4"/> Back to cart</Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tighter font-display">Checkout</h1>

        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-3 text-xs font-semibold">
          <StepPill num={1} label="Verify mobile" active={step === 1} done={step > 1} testid="step-1"/>
          <div className="h-px flex-1 bg-gray-200"/>
          <StepPill num={2} label="Delivery & payment" active={step === 2} done={false} testid="step-2"/>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <section className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-6" data-testid="otp-panel">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#22C55E]"><ShieldCheck className="w-5 h-5"/></div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Verify your mobile</h3>
                    <p className="text-xs text-gray-500">Sirf checkout ke liye — OTP SMS par aayega.</p>
                  </div>
                </div>

                {otpPhase === "mobile" ? (
                  <form onSubmit={doSendOtp} className="mt-5">
                    <Label>Mobile number</Label>
                    <div className="mt-1.5 flex items-center rounded-xl bg-white border-2 border-[#F1EAD8] focus-within:border-[#22C55E] transition-colors">
                      <div className="pl-4 pr-2 text-sm text-gray-600 font-semibold flex items-center gap-1"><Phone className="w-4 h-4"/>+91</div>
                      <Input data-testid="checkout-mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" required value={mobile} onChange={(e)=>setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))} placeholder="9833833498" className="border-0 focus-visible:ring-0 h-12 text-base bg-transparent"/>
                    </div>
                    {otpError && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" data-testid="checkout-otp-error">{otpError}</div>}
                    <Button data-testid="checkout-send-otp" disabled={otpLoading} type="submit" className="mt-5 w-full rounded-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-base font-semibold">
                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Send OTP"}
                    </Button>
                    <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-2 justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]"/> OTP delivered via Twilio · No passwords
                    </div>
                  </form>
                ) : (
                  <form onSubmit={doVerifyOtp} className="mt-5">
                    <button type="button" onClick={()=>{setOtpPhase("mobile"); setCode(""); setOtpError("");}} data-testid="checkout-change-number" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#22C55E]"><ArrowLeft className="w-3 h-3"/> Change number</button>
                    <p className="text-sm text-gray-600 mt-2">6-digit code sent to <span className="font-semibold text-gray-800">{normalizedMobile}</span></p>
                    <Label className="mt-4">OTP code</Label>
                    <Input data-testid="checkout-otp" type="tel" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} autoFocus required value={code}
                      onChange={(e)=>setCode(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="••••••" className="mt-1.5 rounded-xl h-14 text-center text-2xl tracking-[0.6em] font-bold"/>
                    <Label className="mt-4">Your name <span className="text-xs text-gray-400 font-normal">(only asked once)</span></Label>
                    <Input data-testid="checkout-name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" className="mt-1.5 rounded-xl h-11"/>
                    {otpError && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" data-testid="checkout-otp-error">{otpError}</div>}
                    <Button data-testid="checkout-verify-otp" disabled={otpLoading} type="submit" className="mt-5 w-full rounded-full h-12 bg-[#22C55E] hover:bg-[#16A34A] text-base font-semibold">
                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Verify & continue"}
                    </Button>
                    <button type="button" onClick={resend} disabled={resendIn > 0 || otpLoading} data-testid="checkout-resend" className="mt-3 w-full text-sm text-[#22C55E] font-semibold disabled:text-gray-400">
                      {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                    </button>
                  </form>
                )}
              </section>
            )}

            {step === 2 && (
              <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-6" data-testid="address-panel">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#22C55E]"><MapPin className="w-5 h-5"/></div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">Delivery address</h3>
                      <p className="text-xs text-gray-500">Sahi address + landmark = tez delivery.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label>Exact address <span className="text-red-500">*</span></Label>
                      <Textarea data-testid="co-address" required rows={2} value={form.address} onChange={upd("address")} placeholder="Flat / House no., Street, Society, Area" className="mt-1.5 rounded-xl"/>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Nearest landmark <span className="text-red-500">*</span></Label>
                      <Input data-testid="co-landmark" required value={form.landmark} onChange={upd("landmark")} placeholder="e.g. Opposite HDFC bank, Beside Ganesh temple" className="mt-1.5 rounded-xl h-11"/>
                    </div>
                    <div><Label>City</Label><Input data-testid="co-city" value={form.city} onChange={upd("city")} placeholder="Mumbai, Pune, Bengaluru…" className="mt-1.5 rounded-xl h-11"/></div>
                    <div>
                      <Label>PIN code <span className="text-red-500">*</span></Label>
                      <Input data-testid="co-pincode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e)=>setForm({...form, pincode: e.target.value.replace(/\D/g, "").slice(0,6)})} placeholder="400001" className="mt-1.5 rounded-xl h-11"/>
                    </div>
                    <div><Label>Phone</Label><Input data-testid="co-phone" required value={form.phone} onChange={upd("phone")} className="mt-1.5 rounded-xl h-11"/></div>
                    <div><Label>Delivery slot</Label><Input data-testid="co-slot" value={form.delivery_slot} onChange={upd("delivery_slot")} className="mt-1.5 rounded-xl h-11"/></div>
                    <div className="sm:col-span-2">
                      <Label>Special instructions</Label>
                      <Textarea data-testid="co-notes" value={form.special_instructions} onChange={upd("special_instructions")} rows={2} placeholder="Watchman ko bolo, ghanti mat bajao…" className="mt-1.5 rounded-xl"/>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-6">
                  <h3 className="text-lg font-semibold tracking-tight">Payment</h3>
                  <div className="mt-3 rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#22C55E]"><Wallet className="w-5 h-5"/></div>
                    <div>
                      <div className="font-semibold">Cash on delivery</div>
                      <div className="text-xs text-gray-500">Pay in cash when your order arrives.</div>
                    </div>
                  </div>
                </section>

                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" data-testid="checkout-error">{error}</div>}

                <Button data-testid="place-order" type="submit" disabled={loading || cart.items.length===0} className="w-full lg:w-auto rounded-full h-12 px-8 bg-[#22C55E] hover:bg-[#16A34A] text-base font-semibold">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : `Place order · ₹${cart.total.toFixed(2)}`}
                </Button>
              </form>
            )}
          </div>

          <aside className="rounded-2xl bg-white border border-gray-100 mm-shadow-soft p-6 h-fit">
            <h3 className="text-lg font-semibold tracking-tight">Order summary</h3>
            <div className="mt-4 space-y-3 max-h-72 overflow-auto">
              {cart.items.map((it) => (
                <div key={it.product_id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#22C55E] text-xs font-bold flex items-center justify-center">×{it.quantity}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.unit}</div>
                  </div>
                  <div className="text-sm font-semibold">₹{it.line_total.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 my-4"/>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Item total (at MRP)</span><span className="line-through">₹{cart.mrp_total.toFixed(2)}</span></div>
              {cart.savings > 0 && <div className="flex justify-between text-[#166534]"><span>MonthlyGrocery discount ({cart.savings_percent}%)</span><span className="font-semibold">− ₹{cart.savings.toFixed(2)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="text-gray-900 font-semibold">₹{cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="text-[#166534] font-semibold">FREE</span></div>
              <div className="flex justify-between text-gray-600"><span>Platform fee</span><span className="text-[#166534] font-semibold">FREE</span></div>
              <div className="border-t border-gray-100 my-2"/>
              <div className="flex justify-between text-base font-bold"><span>Total payable</span><span>₹{cart.total.toFixed(2)}</span></div>
              {cart.savings > 0 && (
                <div data-testid="checkout-savings" className="mt-2 rounded-xl bg-[#DCFCE7] text-[#166534] text-center py-2 text-xs font-bold">
                  🎉 You save ₹{cart.savings.toFixed(0)} on this monthly order
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepPill({ num, label, active, done, testid }) {
  const bg = done ? "bg-[#22C55E] text-white" : active ? "bg-[#0B1220] text-white" : "bg-gray-200 text-gray-500";
  return (
    <div data-testid={testid} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${bg}`}>
      {done ? <CheckCircle2 className="w-3.5 h-3.5"/> : <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">{num}</span>}
      <span className="uppercase tracking-widest text-[10px] font-bold">{label}</span>
    </div>
  );
}
