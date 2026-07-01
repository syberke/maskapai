import prisma from "@/lib/prisma";
import PrintReportButton from "./PrintReportButton";
import { Banknote, CalendarDays, CircleDollarSign, ReceiptText, TicketCheck } from "lucide-react";

type ChartBar = {
  label: string;
  value: number;
};

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildWeeklyData(payments: { createdAt: Date; amount: unknown }[]): ChartBar[] {
  const today = new Date();

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const value = payments
      .filter((payment) => sameDate(payment.createdAt, date))
      .reduce((total, payment) => total + Number(payment.amount), 0);

    return {
      label: date.toLocaleDateString("id-ID", { weekday: "short" }),
      value,
    };
  });
}

function buildMonthlyData(payments: { createdAt: Date; amount: unknown }[]): ChartBar[] {
  const today = new Date();

  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const value = payments
      .filter((payment) => payment.createdAt.getFullYear() === date.getFullYear() && payment.createdAt.getMonth() === date.getMonth())
      .reduce((total, payment) => total + Number(payment.amount), 0);

    return {
      label: date.toLocaleDateString("id-ID", { month: "short" }),
      value,
    };
  });
}

function RevenueChart({ title, subtitle, data, tone }: { title: string; subtitle: string; data: ChartBar[]; tone: "emerald" | "indigo" }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const gradientId = `${tone}-gradient`;
  const barColor = tone === "emerald" ? "#059669" : "#4f46e5";
  const stopColor = tone === "emerald" ? "#34d399" : "#818cf8";

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs print-break-inside-avoid">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-950">{title}</h2>
          <p className="mt-1 text-[10px] font-medium text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-slate-500">
          Paid only
        </span>
      </div>
      <svg viewBox="0 0 640 240" className="h-64 w-full overflow-visible" role="img" aria-label={title}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stopColor} />
            <stop offset="100%" stopColor={barColor} />
          </linearGradient>
          <filter id={`${gradientId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor={barColor} floodOpacity="0.18" />
          </filter>
        </defs>
        <line x1="36" x2="612" y1="188" y2="188" stroke="#e2e8f0" strokeWidth="1" />
        {data.map((item, index) => {
          const barWidth = 52;
          const gap = 30;
          const x = 58 + index * (barWidth + gap);
          const height = Math.max((item.value / maxValue) * 140, item.value > 0 ? 12 : 4);
          const y = 188 - height;

          return (
            <g key={item.label} className="group">
              <rect x={x} y={y} width={barWidth} height={height} rx="10" fill={`url(#${gradientId})`} filter={`url(#${gradientId}-shadow)`} className="transition-all duration-200 group-hover:opacity-80" />
              <text x={x + barWidth / 2} y={y - 12} textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">
                {item.value > 0 ? `${Math.round(item.value / 1000)}k` : "0"}
              </text>
              <text x={x + barWidth / 2} y="213" textAnchor="middle" className="fill-slate-400 text-[10px] font-black uppercase">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export default async function ManagerDashboardPage() {
  const paidPayments = await prisma.payment.findMany({
    where: { paymentStatus: "PAID" },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          user: true,
          bookingSeats: true,
          flight: {
            include: {
              departureAirport: true,
              arrivalAirport: true,
              plane: { include: { airline: true } },
            },
          },
        },
      },
    },
  });

  const totalRevenue = paidPayments.reduce((total, payment) => total + Number(payment.amount), 0);
  const totalTickets = paidPayments.reduce((total, payment) => total + payment.booking.bookingSeats.length, 0);
  const averageTransaction = paidPayments.length > 0 ? Math.round(totalRevenue / paidPayments.length) : 0;
  const weeklyData = buildWeeklyData(paidPayments);
  const monthlyData = buildMonthlyData(paidPayments);
  const printedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cards = [
    { label: "Total Omset", value: formatCurrency(totalRevenue), icon: CircleDollarSign, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Transaksi Sukses", value: paidPayments.length.toLocaleString("id-ID"), icon: ReceiptText, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "Tiket Terjual", value: totalTickets.toLocaleString("id-ID"), icon: TicketCheck, color: "text-sky-600 bg-sky-50 border-sky-100" },
    { label: "Rata-rata Transaksi", value: formatCurrency(averageTransaction), icon: Banknote, color: "text-amber-600 bg-amber-50 border-amber-100" },
  ];

  return (
    <div className="print-report space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Laporan per {printedAt}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Dashboard Manager</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Analitik omset dan transaksi sukses berdasarkan pembayaran berstatus PAID.</p>
        </div>
        <PrintReportButton />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs print-break-inside-avoid">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="mt-1 text-xl font-black text-slate-950">{card.value}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart title="Omset 7 Hari" subtitle="Ringkasan transaksi sukses dalam tujuh hari terakhir." data={weeklyData} tone="emerald" />
        <RevenueChart title="Omset 6 Bulan" subtitle="Pembacaan tren bulanan dari seluruh pembayaran PAID." data={monthlyData} tone="indigo" />
      </div>

      <section className="rounded-2xl border border-slate-200/70 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-950">Riwayat Transaksi Sukses</h2>
          <p className="mt-1 text-[10px] font-medium text-slate-500">Data ini menjadi sumber file PDF laporan penjualan.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-3.5">Invoice</th>
                <th className="px-6 py-3.5">Penumpang</th>
                <th className="px-6 py-3.5">Rute</th>
                <th className="px-6 py-3.5">Tanggal Bayar</th>
                <th className="px-6 py-3.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
              {paidPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-400">
                    Belum ada transaksi dengan status PAID.
                  </td>
                </tr>
              ) : (
                paidPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5">
                      <p className="font-black uppercase text-emerald-700">{payment.invoiceNumber}</p>
                      <p className="mt-0.5 text-[8px] text-slate-400">Booking {payment.booking.bookingCode}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-black uppercase text-slate-950">{payment.booking.user.name}</p>
                      <p className="mt-0.5 text-[8px] text-slate-400">{payment.booking.user.email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-black text-slate-950">
                        {payment.booking.flight.departureAirport.code} - {payment.booking.flight.arrivalAirport.code}
                      </p>
                      <p className="mt-0.5 text-[8px] text-slate-400">
                        {payment.booking.flight.plane.airline.name} / {payment.booking.flight.flightNumber}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      {payment.updatedAt.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-slate-950">{formatCurrency(Number(payment.amount))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
