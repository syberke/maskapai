// app/admin/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, 
  MapPin, 
  Calendar, 
  LayoutDashboard, 
  ArrowLeft, 
  LogOut,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== "ADMIN") {
            router.push("/");
          } else {
            setAdminName(data.user.name);
          }
        } else {
          router.push("/auth/login");
        }
      } catch {
        router.push("/auth/login");
      }
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/auth/login");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Bandara", href: "/admin/airports", icon: MapPin },
    { name: "Maskapai", href: "/admin/airlines", icon: Building2 },
    { name: "Penerbangan", href: "/admin/flights", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased">
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-black tracking-widest uppercase">Admin Panel</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-1 focus:outline-none">
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR SIDE */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col">
          {/* BRANDING HEADER */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Renggo Air</h2>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Administrator</span>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="p-4 flex flex-col gap-1 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM USER CONTROL */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2 bg-slate-950/40">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/40">
            <div className="w-7 h-7 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center uppercase font-black text-xs">
              {adminName.substring(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-[10px] font-black text-white truncate uppercase">{adminName}</p>
              <span className="text-[8px] text-slate-500 font-bold uppercase">Role: Admin</span>
            </div>
          </div>

          <Link href="/" className="flex items-center gap-2.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Beranda Utama
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar Sesi
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 min-w-0 overflow-y-auto px-6 py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
