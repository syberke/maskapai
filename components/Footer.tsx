"use client";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/60 bg-white select-none">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">

        {/* BARIS UTAMA: Branding & Navigasi Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-100">

          {/* Sisi Kiri: Logo & Deskripsi Ringkas */}
          <div className="md:col-span-6 space-y-3">
            <span className="text-sm font-black tracking-[0.2em] text-slate-950 uppercase block">
              RENGGO
            </span>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Mitra perjalanan udara terpercaya yang menghubungkan Anda dengan berbagai maskapai dan destinasi melalui layanan pemesanan yang cepat, aman, dan profesional.
            </p>
          </div>

          {/* Sisi Kanan: Tautan Navigasi */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-6 md:justify-items-end">
            <div className="space-y-3">
              <span className="text-[10px] font-black tracking-[0.15em] text-slate-950 uppercase block">
                Penerbangan
              </span>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><a href="#" className="hover:text-slate-950 transition-colors">Cari Tiket</a></li>
                <li><a href="#" className="hover:text-slate-950 transition-colors">Mitra Resmi</a></li>
                <li><a href="#" className="hover:text-slate-950 transition-colors">Jadwal Rute</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black tracking-[0.15em] text-slate-950 uppercase block">
                Perusahaan
              </span>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><a href="#" className="hover:text-slate-950 transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-slate-950 transition-colors">Pusat Bantuan</a></li>
                <li><a href="#" className="hover:text-slate-950 transition-colors">Karir</a></li>
              </ul>
            </div>
          </div>
          
        </div>

        {/* BARIS BAWAH: Hak Cipta & Dokumen Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-[10px] font-bold tracking-[0.05em] text-slate-400 uppercase">
            &copy; {new Date().getFullYear()} RENGGO INC. All Rights Reserved.
          </div>

          <div className="flex items-center gap-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            <a href="#" className="hover:text-slate-950 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-950 transition-colors">Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
}