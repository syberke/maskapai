"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { Lock, Mail, User, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const captchaRef = useRef<ReCAPTCHA>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // 1. Validasi reCAPTCHA v2 wajib asesor
    const captchaToken = captchaRef.current?.getValue();
    if (!captchaToken) {
      setError("Silakan centang reCAPTCHA terlebih dahulu.");
      setLoading(false);
      return;
    }

    try {
      // 2. Tembak ke API Endpoint Register backend kamu
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal melakukan registrasi.");
      }

      setSuccess("Registrasi berhasil! Mengalihkan ke halaman verifikasi...");
      
      // 3. Alirkan user langsung ke halaman pengisian OTP sambil membawa parameter email
      setTimeout(() => {
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      captchaRef.current?.reset(); // Reset captcha jika registrasi gagal
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 antialiased select-none">
      <div className="w-full max-w-sm bg-white border border-slate-200/60 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.03)] p-6 md:p-8 space-y-6 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        
        {/* HEADER BRANDING */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-block group">
            <span className="text-xs font-black tracking-[0.4em] text-slate-950 uppercase block transition-transform group-hover:scale-105">
              RENGGO
            </span>
          </Link>
          <h1 className="text-xl font-black tracking-tight text-slate-950">Buat akun baru</h1>
        </div>

        {/* NOTIFIKASI ERROR */}
        {error && (
          <div className="bg-red-50 text-red-600 text-[10px] font-black p-3.5 rounded-xl border border-red-100 uppercase tracking-wider animate-in fade-in zoom-in-95 duration-200">
            ⚠ {error}
          </div>
        )}

        {/* NOTIFIKASI SUKSES */}
        {success && (
          <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black p-3.5 rounded-xl border border-emerald-100 uppercase tracking-wider animate-in fade-in zoom-in-95 duration-200">
            ✓ {success}
          </div>
        )}

        {/* FORM REGISTRASI */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* INPUT NAMA LENGKAP */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">Nama Lengkap</label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-slate-950" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Renggo Jatmiko"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-950 focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-950"
              />
            </div>
          </div>

          {/* INPUT EMAIL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">Alamat Email</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-slate-950" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-950 focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-950"
              />
            </div>
          </div>

          {/* INPUT PASSWORD */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">Kata Sandi Baru</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-slate-950" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-950 focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-950"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* GOOGLE RECAPTCHA WIDGET */}
          <div className="flex justify-center pt-2 scale-[0.92] origin-center">
            <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm">
              <ReCAPTCHA
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
              />
            </div>
          </div>

          {/* TOMBOL SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-950 text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-slate-300 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer group/btn"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Daftar Akun 
              </>
            )}
          </button>
        </form>

        {/* FOOTER NAVIGASI LOGIN */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            Sudah memiliki akun?{" "}
            <Link href="/auth/login" className="text-slate-950 font-bold hover:underline">
              Masuk Di Sini
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}