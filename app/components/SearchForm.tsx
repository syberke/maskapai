"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, PlaneTakeoff, PlaneLanding, ArrowLeftRight, Check, ChevronDown, Users } from "lucide-react";

interface Airport {
  id: number;
  code: string;
  name: string;
  city: string;
}

interface SearchFormProps {
  airports: Airport[];
  isHome?: boolean;
}

export default function SearchForm({ airports, isHome = false }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [origin, setOrigin] = useState(searchParams.get("from") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || "");
  const [departureDate, setDepartureDate] = useState(searchParams.get("date") || "");
  const [seatClass, setSeatClass] = useState(searchParams.get("class") || "ECONOMY");
  const [passengers, setPassengers] = useState(Number(searchParams.get("passengers")) || 1);

  // State kustom dropdown: "origin" | "destination" | "class" | "passengers" | null
  const [openDropdown, setOpenDropdown] = useState<"origin" | "destination" | "class" | "passengers" | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setOpenDropdown(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      alert("Harap isi kota asal, tujuan, dan tanggal keberangkatan!");
      return;
    }
    router.push(`/flights?from=${origin}&to=${destination}&date=${departureDate}&class=${seatClass}&passengers=${passengers}`);
  };

  const classLabels: Record<string, string> = {
    ECONOMY: "Ekonomi",
    BUSINESS: "Bisnis",
    FIRST_CLASS: "First Class",
  };

  const selectedOriginCity = airports.find(ap => ap.code === origin)?.city || "Pilih Asal";
  const selectedDestCity = airports.find(ap => ap.code === destination)?.city || "Pilih Tujuan";

  return (
    // 2. Gunakan kondisi dinamis pada class margin-top-nya
    <div className={`mx-auto w-full relative z-30 select-none ${isHome ? "-mt-28" : "mt-0"}`}>
      <div className="bg-white max-w-5xl mx-auto p-6 rounded-xl border border-slate-200 shadow-lg">
        <form ref={formRef} onSubmit={handleSearch} className="space-y-5">

          {/* ================= BARIS DROPDOWN ATAS (KELAS & PENERBANGAN) ================= */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3 relative">

            {/* 1. KELAS PENERBANGAN */}
            <div className="relative">
              <div
                onClick={() => setOpenDropdown(openDropdown === "class" ? null : "class")}
                className={`text-[10px] font-black tracking-[0.2em] uppercase rounded-lg px-3 py-1.5 border transition-all duration-200 cursor-pointer flex items-center gap-2 ${openDropdown === "class" ? "bg-white border-slate-950 text-slate-950 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
              >
                {classLabels[seatClass]}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "class" ? "rotate-180 text-slate-950" : "text-slate-400"}`} />
              </div>

              {openDropdown === "class" && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] z-50 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
                  {Object.keys(classLabels).map((key) => {
                    const isSelected = key === seatClass;
                    return (
                      <button
                        key={`select-class-${key}`}
                        type="button"
                        onClick={() => { setSeatClass(key); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-2 text-[10px] font-black tracking-wider uppercase transition-colors flex items-center justify-between cursor-pointer ${isSelected ? "bg-slate-50 text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                      >
                        {classLabels[key]}
                        {isSelected && <Check className="h-3 w-3 text-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. JUMLAH PENUMPANG RINGKAS (DI SAMPING KELAS) */}
            <div className="relative">
              <div
                onClick={() => setOpenDropdown(openDropdown === "passengers" ? null : "passengers")}
                className={`text-[10px] font-black tracking-[0.2em] uppercase rounded-lg px-3 py-1.5 border transition-all duration-200 cursor-pointer flex items-center gap-2 ${openDropdown === "passengers" ? "bg-white border-slate-950 text-slate-950 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
              >
                <Users className="h-3 w-3" />
                {passengers} Penumpang
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${openDropdown === "passengers" ? "rotate-180 text-slate-950" : "text-slate-400"}`} />
              </div>

              {openDropdown === "passengers" && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] z-50 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isSelected = num === passengers;
                    return (
                      <button
                        key={`select-pax-${num}`}
                        type="button"
                        onClick={() => { setPassengers(num); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-2 text-[10px] font-black tracking-wider uppercase transition-colors flex items-center justify-between cursor-pointer ${isSelected ? "bg-slate-50 text-slate-950" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                      >
                        <span>{num} Pax</span>
                        {isSelected && <Check className="h-3 w-3 text-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* GRID FORM BARIS UTAMA (KEMBALI KE LAYOUT AWAL KAMU YANG SEMPURNA) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

            {/* GRUP RUTE ASAL & TUJUAN */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-9 gap-2 items-center">

              {/* KOTA ASAL KUSTOM */}
              <div className="sm:col-span-4 relative">
                <div
                  onClick={() => setOpenDropdown(openDropdown === "origin" ? null : "origin")}
                  className={`rounded-xl border px-3 h-[58px] flex flex-col justify-center cursor-pointer transition-all duration-200 bg-white ${openDropdown === "origin" ? "border-slate-950 ring-[1px] ring-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.02)]" : "border-slate-200/80 hover:border-slate-400"
                    }`}
                >
                  <label className={`text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 transition-colors duration-200 ${openDropdown === "origin" ? "text-slate-950" : "text-slate-400"}`}>
                    <PlaneTakeoff className="h-3.5 w-3.5" /> Dari
                  </label>
                  <div className="mt-0.5 text-xs font-bold text-slate-900 truncate">
                    {origin ? `${selectedOriginCity} (${origin})` : "Pilih Kota Asal"}
                  </div>
                </div>

                {/* LIST BANDARA ASAL */}
                {openDropdown === "origin" && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {airports.map((ap) => {
                      const isSelected = ap.code === origin;
                      const isDisabled = ap.code === destination;
                      return (
                        <button
                          key={`select-origin-${ap.id}`}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => { setOrigin(ap.code); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${isDisabled ? "opacity-30 cursor-not-allowed bg-slate-50/50" : "hover:bg-slate-50 cursor-pointer"
                            } ${isSelected ? "bg-slate-50 font-bold text-slate-950" : "text-slate-700"}`}
                        >
                          <div>
                            <span className="font-bold block text-slate-900">{ap.city} ({ap.code})</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{ap.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-slate-950" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TOMBOL SWAP RUTE */}
              <div className="sm:col-span-1 flex justify-center py-0.5 sm:py-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="rounded-full bg-white p-2 text-slate-500 hover:text-slate-950 border border-slate-200 shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-10 group"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 rotate-90 sm:rotate-0 transition-transform duration-300 group-hover:rotate-180" strokeWidth={2.5} />
                </button>
              </div>

              {/* KOTA TUJUAN KUSTOM */}
              <div className="sm:col-span-4 relative">
                <div
                  onClick={() => setOpenDropdown(openDropdown === "destination" ? null : "destination")}
                  className={`rounded-xl border px-3 h-[58px] flex flex-col justify-center cursor-pointer transition-all duration-200 bg-white ${openDropdown === "destination" ? "border-slate-950 ring-[1px] ring-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.02)]" : "border-slate-200/80 hover:border-slate-400"
                    }`}
                >
                  <label className={`text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 transition-colors duration-200 ${openDropdown === "destination" ? "text-slate-950" : "text-slate-400"}`}>
                    <PlaneLanding className="h-3.5 w-3.5" /> Ke
                  </label>
                  <div className="mt-0.5 text-xs font-bold text-slate-900 truncate">
                    {destination ? `${selectedDestCity} (${destination})` : "Pilih Kota Tujuan"}
                  </div>
                </div>

                {/* LIST BANDARA TUJUAN */}
                {openDropdown === "destination" && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {airports.map((ap) => {
                      const isSelected = ap.code === destination;
                      const isDisabled = ap.code === origin;
                      return (
                        <button
                          key={`select-dest-${ap.id}`}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => { setDestination(ap.code); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${isDisabled ? "opacity-30 cursor-not-allowed bg-slate-50/50" : "hover:bg-slate-50 cursor-pointer"
                            } ${isSelected ? "bg-slate-50 font-bold text-slate-950" : "text-slate-700"}`}
                        >
                          <div>
                            <span className="font-bold block text-slate-900">{ap.city} ({ap.code})</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{ap.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-slate-950" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* TANGGAL PERGI */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200/80 px-3 bg-white h-[58px] flex flex-col justify-center transition-all duration-200 ease-out hover:border-slate-400 focus-within:border-slate-950 focus-within:ring-[1px] focus-within:ring-slate-950 focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.02)] group">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 group-focus-within:text-slate-950 flex items-center gap-1.5 transition-colors duration-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-950 transition-colors duration-200" /> Tanggal Pergi
              </label>
              <input
                type="date"
                value={departureDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="mt-0.5 block w-full bg-transparent font-bold text-slate-900 outline-none text-xs cursor-pointer"
              />
            </div>

            {/* TOMBOL CARI */}
            <div className="lg:col-span-3">
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-950 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-md hover:bg-slate-900 hover:shadow-[0_8px_20px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-all duration-200 cursor-pointer h-[58px] flex items-center justify-center"
              >
                Cari Penerbangan
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}