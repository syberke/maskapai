"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface StatData {
  id: number;
  value: string;
  label: string;
  description: string;
}

interface AirlinePartner {
  id: number;
  name: string;
  logo: string; // Path ke folder public kamu, misal: /logos/wings.png
}

export default function Information() {
  const stats: StatData[] = [
    {
      id: 1,
      value: "100+",
      label: "Mitra Maskapai",
      description: "Bandingkan jadwal dan harga terbaik dari ratusan maskapai resmi dalam satu kali pencarian.",
    },
    {
      id: 2,
      value: "Instant",
      label: "E-Ticket Terbit",
      description: "Proses pemesanan real-time. E-ticket langsung dikirim ke email Anda sesaat setelah pembayaran dikonfirmasi.",
    },
    {
      id: 3,
      value: "0%",
      label: "Biaya Tersembunyi",
      description: "Harga jujur sejak awal pencarian. Apa yang Anda lihat di form adalah apa yang Anda bayar saat checkout.",
    }
  ];

  // Data maskapai sesuai gambar yang kamu lampirkan
  const popularAirlines: AirlinePartner[] = [
    { id: 1, name: "Wings Air", logo: "/logos/wings.png" },
    { id: 2, name: "Lion Air", logo: "/logos/lion.png" },
    { id: 3, name: "Citilink", logo: "/logos/citilink.png" },
    { id: 4, name: "Batik Air", logo: "/logos/batik.png" },
    { id: 5, name: "Sriwijaya Air", logo: "/logos/sriwijaya.png" },
    { id: 6, name: "AirAsia", logo: "/logos/airasia.png" },
    { id: 7, name: "Firefly", logo: "/logos/firefly.png" },
    { id: 8, name: "Malaysia Airlines", logo: "/logos/malaysia.avif" },
    { id: 9, name: "Garuda Indonesia", logo: "/logos/garuda.png" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 w-full py-16 sm:py-24 space-y-24 select-none">

      {/* ================= SECTION 1: STAT WALL ================= */}
      <div className="space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 block mb-1">
              RENGGO TRACK RECORD
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
              DIPERCAYA OLEH JUTAAN PENUMPANG
            </h2>
          </div>
          <Link
            href="/about"
            className="group flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-900 hover:text-slate-600 mt-4 sm:mt-0 transition-colors"
          >
            Tentang Kami <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`flex flex-col justify-center ${
                index > 0 ? "pt-8 md:pt-0 md:pl-8" : "pb-4 md:pb-0"
              }`}
            >
              <div className="text-5xl sm:text-6xl font-black text-slate-950 tracking-tighter leading-none mb-3">
                {stat.value}
              </div>
              <div className="text-[10px] font-black tracking-[0.15em] uppercase text-slate-400 mb-1.5">
                {stat.label}
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION 2: MASKAPAI POPULER ================= */}
      <div className="space-y-10">
        <div className="border-b border-slate-100 pb-6">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 block mb-1">
            OFFICIAL PARTNERS
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
            Maskapai Populer di Indonesia
          </h2>
        </div>

        {/* Grid 3 Kolom stabil yang rapi untuk Logo & Nama Maskapai */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-8">
          {popularAirlines.map((airline) => (
            <div 
              key={airline.id} 
              className="flex items-center gap-4 py-2 border-b border-slate-50/50 hover:border-slate-200 transition-all group"
            >
              {/* Wadah Logo Maskapai */}
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-xl p-1 border border-slate-100/60 group-hover:bg-white transition-colors">
                <Image
                  src={airline.logo}
                  alt={airline.name}
                  fill
                  sizes="48px"
                  className="max-w-full max-h-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                />
              </div>

              {/* Nama Maskapai */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors">
                  {airline.name}
                </span>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                  Mitra Resmi
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
