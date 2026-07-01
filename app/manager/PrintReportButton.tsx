"use client";

import { Download } from "lucide-react";

export default function PrintReportButton() {
  return (
    <a
      href="/api/reports/sales/pdf"
      data-print-hidden="true"
      download
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98]"
    >
      <Download className="h-3.5 w-3.5" />
      Unduh PDF Penjualan
    </a>
  );
}
