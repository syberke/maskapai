"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [managerName, setManagerName] = useState("Manager");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== "MANAGER") {
            router.push("/");
          } else {
            setManagerName(data.user.name);
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950 antialiased">
      <header
        data-print-hidden="true"
        className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/manager" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-950">Renggo Finance</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Manager Panel</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black uppercase text-emerald-700">
                {managerName.substring(0, 2)}
              </div>
              <div>
                <p className="max-w-[140px] truncate text-[10px] font-black uppercase tracking-wider text-slate-900">{managerName}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Role: Manager</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Beranda
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {isMobileOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <BriefcaseBusiness className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">{managerName}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/" onClick={() => setIsMobileOpen(false)} className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                Beranda
              </Link>
              <button onClick={handleLogout} className="text-left text-[10px] font-black uppercase tracking-wider text-red-500">
                Keluar
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>

      <footer data-print-hidden="true" className="border-t border-slate-200/70 py-5 text-center">
        <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Renggo sales reporting console
        </div>
      </footer>
    </div>
  );
}
