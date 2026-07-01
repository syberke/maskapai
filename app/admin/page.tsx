// app/admin/page.tsx
import prisma from "@/lib/prisma";
import { Plane, Building2, MapPin, Ticket } from "lucide-react";

export default async function AdminDashboardPage() {
  const airportCount = await prisma.airport.count();
  const airlineCount = await prisma.airline.count();
  const flightCount = await prisma.flight.count();
  const bookingCount = await prisma.booking.count();

  // Mengambil 5 pemesanan terakhir untuk log ringkasan
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      flight: {
        include: {
          departureAirport: true,
          arrivalAirport: true,
        },
      },
    },
  });

  const cards = [
    { title: "Total Bandara", count: airportCount, icon: MapPin, color: "from-sky-500 to-indigo-600", desc: "Rute asal & tujuan terdaftar" },
    { title: "Total Maskapai", count: airlineCount, icon: Building2, color: "from-purple-500 to-pink-600", desc: "Armada pesawat udara komersial" },
    { title: "Total Penerbangan", count: flightCount, icon: Plane, color: "from-emerald-500 to-teal-600", desc: "Jadwal penerbangan aktif" },
    { title: "Total Pemesanan", count: bookingCount, icon: Ticket, color: "from-amber-500 to-orange-600", desc: "Pemesanan dari seluruh penumpang" },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Status statistik data logistik maskapai penerbangan secara langsung.</p>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-all">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.title}</span>
                <h3 className="text-2xl font-black text-slate-950">{card.count}</h3>
                <p className="text-[9px] text-slate-400 font-semibold">{card.desc}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md shadow-indigo-600/10 shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider">Log Transaksi Terkini</h2>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">5 Pesanan tiket pesawat terbaru dalam database.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-3.5">Kode Booking</th>
                <th className="px-6 py-3.5">Penumpang</th>
                <th className="px-6 py-3.5">Penerbangan</th>
                <th className="px-6 py-3.5">Tarif</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada transaksi pemesanan tiket.</td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-indigo-600 uppercase">{b.bookingCode}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-950 uppercase">{b.user.name}</span>
                        <span className="text-[8px] text-slate-400">{b.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {b.flight.departureAirport.code} → {b.flight.arrivalAirport.code}
                        </span>
                        <span className="text-[8px] text-slate-400">Nomor Penerbangan: {b.flight.flightNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-black text-slate-950">
                      Rp {Number(b.totalPrice).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                          : b.status === "PENDING"
                          ? "bg-amber-50 border-amber-100 text-amber-600"
                          : "bg-rose-50 border-rose-100 text-rose-600"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
