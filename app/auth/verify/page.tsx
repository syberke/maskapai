"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mengambil email dari URL parameter secara otomatis (?email=...)
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digit OTP box
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Logika berpindah kolom otomatis saat mengetik kode OTP
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Pindah ke kolom kanan jika sudah terisi
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Logika mendeteksi tombol backspace untuk mundur kolom
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Silakan masukkan 6 digit kode OTP secara lengkap.");
      setLoading(false);
      return;
    }

    try {
      // Tembak ke API endpoint verifikasi OTP backend kamu
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Kode OTP salah atau kedaluwarsa.");
      }

      setSuccess("Akun berhasil diverifikasi! Mengalihkan ke login...");
      
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]); // Reset kotak jika gagal
      inputRefs.current[0]?.focus();
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
          <h1 className="text-xl font-black tracking-tight text-slate-950">Verifikasi Akun</h1>
          <p className="text-[11px] font-medium text-slate-400 max-w-[250px] mx-auto">
            Masukkan 6 digit kode OTP yang telah dikirimkan ke email <span className="text-slate-950 font-bold break-all">{email || "Anda"}</span>.
          </p>
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

        {/* FORM OTP */}
        <form onSubmit={handleVerify} className="space-y-5">
          
          {/* INPUT KOTAK OTP 6 DIGIT */}
          <div className="flex justify-between gap-2 pt-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                ref={(el) => { if (el) inputRefs.current[index] = el; }}
                value={data}
                onChange={(e) => handleOtpChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-11 h-12 text-center bg-slate-50/50 border border-slate-200/80 rounded-xl text-sm font-black text-slate-950 focus:outline-none focus:border-slate-950 focus:bg-white transition-all duration-150 shadow-sm"
              />
            ))}
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
                Verifikasi Kode 
              </>
            )}
          </button>
        </form>

        {/* FOOTER NAVIGASI KEMBALI */}
        <div className="text-center pt-2 border-t border-slate-100">
          <Link href="/auth/login" className="text-slate-400 hover:text-slate-950 font-black tracking-wide uppercase text-[10px] transition-colors">
            Kembali Ke Halaman Login
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </main>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}