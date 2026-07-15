"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut, Ticket, Plane, ChevronDown, ShieldAlert, BarChart2, ClipboardCheck } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const shouldHideNavbar = pathname.startsWith("/auth") || pathname.startsWith("/admin") || pathname.startsWith("/manager") || pathname.startsWith("/staff");

  // Server ID - untuk demonstrasi load balancing
  const serverId = process.env.NEXT_PUBLIC_SERVER_ID || "1";

  // 1. STATE AUTHENTICATION (Kini otomatis sinkron dengan API Backend)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  const [isOpen, setIsOpen] = useState(false); // Mobile menu state
  const [isScrolled, setIsScrolled] = useState(false); // Scroll effect state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Desktop avatar dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🎯 DETEKSI HALAMAN: Hanya beranda ("/") yang diizinkan menggunakan tema transparan saat belum di-scroll
  const isHomePage = pathname === "/";
  // Paksa nyalakan mode tema putih solid jika sudah di-scroll ATAU jika sedang TIDAK di halaman beranda
  const forceWhiteTheme = isScrolled || !isHomePage;

  // FUNGSI REAL-TIME SYNC: Mengambil data user dari token cookie secara berkala
  const checkUserSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    if (shouldHideNavbar) {
      return;
    }

    const initialCheck = window.setTimeout(() => {
      checkUserSession();
    }, 0);

    // Sinkronisasi instan jika user login/logout di tab browser lain
    window.addEventListener("storage", checkUserSession);

    // Polling kecil setiap 2 detik untuk memastikan UI langsung berubah begitu redirect dari login
    const interval = setInterval(checkUserSession, 2000);

    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener("storage", checkUserSession);
      clearInterval(interval);
    };
  }, [shouldHideNavbar]);

  // Efek merubah background navbar saat scroll melewati batas banner
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Menutup avatar dropdown otomatis jika user mengklik luar komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler Logout terintegrasi dengan API Backend
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setIsDropdownOpen(false);
        setIsOpen(false);
        router.push("/auth/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal memproses logout:", err);
    }
  };

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 z-50 w-full py-4 transition-all duration-500 ease-in-out ${forceWhiteTheme
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
          : "bg-transparent"
        }`}
    >
      {/* Server Identifier - untuk demonstrasi load balancing */}
      <div className="fixed top-2 right-2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold z-[100] shadow-lg">
        Server: {serverId}
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-10 items-center justify-between">

          {/* SIGNATURE LOGO: Micro-interaction Pesawat */}
          <Link href="/" className="flex items-center group select-none transition-transform duration-300 active:scale-95">
            <span
              className={`relative text-lg font-black tracking-[0.25em] italic uppercase transition-colors duration-500 ${forceWhiteTheme ? "text-slate-950" : "text-white"
                }`}
            >
              RENGG
              <span className={`relative inline-block font-sans not-italic tracking-normal ml-0.5 ${forceWhiteTheme ? "text-slate-900" : "text-slate-100"}`}>
                O
                <Plane
                  className={`absolute -top-2 -right-4 h-4 w-4 rotate-45 transition-all duration-500 ease-out ${forceWhiteTheme
                      ? "text-slate-950 fill-slate-950/5 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110"
                      : "text-white fill-white/5 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110"
                    }`}
                  strokeWidth={2.5}
                />
              </span>
            </span>
          </Link>

          {/* UTILITY MENU: DESKTOP VIEW */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              /* KONDISI 1: JIKA USER SUDAH LOGIN (Avatar Dropdown Premium) */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 group cursor-pointer text-left"
                >
                  <div className={`w-8 h-8 rounded-full font-black text-[11px] flex items-center justify-center border uppercase tracking-wider shadow-sm transition-colors duration-500 ${forceWhiteTheme ? "bg-slate-950 text-white border-slate-900" : "bg-white text-slate-950 border-white"
                    }`}>
                    {user.name.substring(0, 2)}
                  </div>
                  <span className={`text-[10px] font-black tracking-wider group-hover:opacity-80 max-w-[80px] truncate uppercase transition-colors duration-500 ${forceWhiteTheme ? "text-slate-800" : "text-white"
                    }`}>
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className={`h-3 w-3 transition-all duration-300 ${isDropdownOpen ? "rotate-180" : ""} ${forceWhiteTheme ? "text-slate-500" : "text-slate-300"}`} />
                </button>

                {/* DROPDOWN MENU PROFIL PRIVAT */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-[10px] font-black tracking-wider text-slate-950 truncate uppercase">{user.name}</p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[10px] font-black tracking-wider text-indigo-600 hover:bg-indigo-50/50 flex items-center gap-2.5 uppercase transition-colors"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" /> PANEL ADMIN
                      </Link>
                    )}
                    {user.role === "MANAGER" && (
                      <Link
                        href="/manager"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[10px] font-black tracking-wider text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-2.5 uppercase transition-colors"
                      >
                        <BarChart2 className="h-3.5 w-3.5 text-emerald-500" /> PANEL MANAGER
                      </Link>
                    )}
                    {user.role === "STAFF" && (
                      <Link
                        href="/staff"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[10px] font-black tracking-wider text-sky-600 hover:bg-sky-50/50 flex items-center gap-2.5 uppercase transition-colors"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 text-sky-500" /> PANEL STAFF
                      </Link>
                    )}
                    <Link
                      href="/dashboard/bookings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold tracking-wider text-slate-700 hover:bg-slate-50 hover:text-slate-950 flex items-center gap-2.5 uppercase transition-colors"
                    >
                      <Ticket className="h-3.5 w-3.5 text-slate-400" /> TIKET SAYA
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 border-t border-slate-50 text-[10px] font-black tracking-wider text-red-600 hover:bg-red-50/50 flex items-center gap-2.5 uppercase transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-400" /> KELUAR
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* KONDISI 2: JIKA BELUM LOGIN */
              <div className="flex items-center gap-8">
                <Link
                  href="/auth/login"
                  className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${forceWhiteTheme ? "text-slate-600 hover:text-black" : "text-slate-300 hover:text-white"
                    }`}
                >
                  MASUK
                </Link>
                <Link
                  href="/auth/register"
                  className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors duration-300 ${forceWhiteTheme ? "text-slate-950 hover:text-slate-700" : "text-white hover:text-slate-200"
                    }`}
                >
                  DAFTAR
                </Link>
              </div>
            )}
          </div>

          {/* TOGGLE BUTTON: MOBILE VIEW */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-1 focus:outline-none transition-colors duration-500 ${forceWhiteTheme ? "text-slate-950" : "text-white"
                }`}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU: MOBILE VIEW */}
      {isOpen && (
        <div className="md:hidden px-6 py-4 space-y-3 bg-white border-b border-slate-200 mt-3 shadow-sm animate-in fade-in duration-200">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-slate-100">
                <p className="text-[10px] font-black tracking-wider text-slate-950 uppercase">{user.name}</p>
                <p className="text-[9px] text-slate-400 truncate">{user.email}</p>
              </div>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <ShieldAlert className="h-3.5 w-3.5" /> PANEL ADMIN
                </Link>
              )}
              {user.role === "MANAGER" && (
                <Link href="/manager" className="text-[10px] font-black tracking-[0.2em] text-emerald-600 uppercase flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <BarChart2 className="h-3.5 w-3.5" /> PANEL MANAGER
                </Link>
              )}
              {user.role === "STAFF" && (
                <Link href="/staff" className="text-[10px] font-black tracking-[0.2em] text-sky-600 uppercase flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <ClipboardCheck className="h-3.5 w-3.5" /> PANEL STAFF
                </Link>
              )}
              <Link href="/dashboard/bookings" className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <Ticket className="h-3.5 w-3.5" /> TIKET SAYA
              </Link>
              <button onClick={handleLogout} className="text-[10px] font-black tracking-[0.2em] text-red-600 uppercase text-left flex items-center gap-2 cursor-pointer">
                <LogOut className="h-3.5 w-3.5" /> KELUAR
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/auth/login" className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase" onClick={() => setIsOpen(false)}>MASUK</Link>
              <Link href="/auth/register" className="text-[10px] font-black tracking-[0.2em] text-slate-950 uppercase" onClick={() => setIsOpen(false)}>DAFTAR</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
