'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: mobile, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedNotice = sessionStorage.getItem('@admin_login_notice');
    if (savedNotice) {
      setNotice(savedNotice);
      sessionStorage.removeItem('@admin_login_notice');
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mobile || mobile.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile: mobile.trim(), role: 'super_admin' }),
      });
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.trim().length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          mobile: mobile.trim(),
          code: code.trim(),
          name: name.trim(),
          role: 'super_admin',
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      // STRICT ROLE CHECK: Only allow super_admin on this web panel
      if (data.user.role !== 'super_admin') {
        throw new Error('Access Denied: Only the Super Admin is authorized to log in to this web dashboard.');
      }

      // Save token and redirect
      localStorage.setItem('@admin_token', data.token);
      localStorage.setItem('@admin_user', JSON.stringify(data.user));
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#090D16] via-[#0F172A] to-[#1E1B4B] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#090D16]/65 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/80 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">MonthlyGrocery</h1>
            <p className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">Super Admin Portal</p>
          </div>
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-xl">
            {notice}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your super admin mobile number to receive an OTP.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mobile Number</label>
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors p-1.5 pl-4">
                <span className="text-slate-500 font-bold mr-1.5 text-sm">+91</span>
                <input
                  type="tel"
                  placeholder="8830480015"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  required
                  className="w-full h-10 bg-transparent outline-none text-base text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setError(''); }}
                className="text-xs text-slate-400 hover:text-white underline mb-3 cursor-pointer"
              >
                ← Change number
              </button>
              <h2 className="text-lg font-bold text-white">Verify OTP</h2>
              <p className="text-xs text-slate-400 mt-1">Sent code to +91 {mobile}. Enter <strong>123456</strong> in development.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
                  required
                  className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-center text-xl font-bold tracking-[0.5em] text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none px-4 text-base text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

