import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import MonthlyGroceryLogo from "@/components/MonthlyGroceryLogo";

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    address: "", city: "", pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await register({ ...form, role: "consumer", email: form.email.trim().toLowerCase() });
    setLoading(false);
    if (!res.ok) { setError(res.error); toast.error(res.error || "Registration failed"); return; }
    toast.success("Account created. Welcome to MonthlyGrocery!");
    navigate("/shop", { replace: true });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden" style={{background: "linear-gradient(180deg, #ECFDF5 0%, #E4FBEA 100%)"}}>
        <MonthlyGroceryLogo />
        <div>
          <h2 className="text-5xl font-bold tracking-tighter font-display leading-[1.05]">Join<br/>MonthlyGrocery.</h2>
          <p className="mt-6 text-gray-600 max-w-md leading-relaxed">Save upto 20% on your entire month's groceries — atta, rice, oil, pulses, staples &amp; more, delivered to your door within 4 hours. Minimum order ₹2,500.</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>© MonthlyGrocery</span><span>·</span><span>Terms</span><span>·</span><span>Privacy</span>
        </div>
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-[#22C55E]/15 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="w-full max-w-md">
          <div className="lg:hidden mb-8"><MonthlyGroceryLogo/></div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-display">Create your account</h1>
          <p className="text-gray-500 mt-2">Sign up as a consumer to start ordering.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input data-testid="reg-name" id="name" required value={form.name} onChange={upd("name")} className="mt-1.5 rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input data-testid="reg-email" id="email" type="email" required value={form.email} onChange={upd("email")} className="mt-1.5 rounded-xl h-11" />
              </div>
              <div>
                <Label htmlFor="phone">Mobile</Label>
                <Input data-testid="reg-phone" id="phone" value={form.phone} onChange={upd("phone")} className="mt-1.5 rounded-xl h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input data-testid="reg-password" id="password" type="password" required value={form.password} onChange={upd("password")} className="mt-1.5 rounded-xl h-11" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input data-testid="reg-address" id="address" value={form.address} onChange={upd("address")} className="mt-1.5 rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input data-testid="reg-city" id="city" value={form.city} onChange={upd("city")} className="mt-1.5 rounded-xl h-11" />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input data-testid="reg-pincode" id="pincode" value={form.pincode} onChange={upd("pincode")} className="mt-1.5 rounded-xl h-11" />
              </div>
            </div>

            {error && <div data-testid="reg-error" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}

            <Button data-testid="reg-submit" disabled={loading} type="submit" className="w-full rounded-full h-11 bg-[#6C3BFF] hover:bg-[#5A2FE0] text-base font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" data-testid="go-login" className="text-[#6C3BFF] font-semibold hover:underline">Sign in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
