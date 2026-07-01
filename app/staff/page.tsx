import prisma from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";
import { BookingStatus, PaymentStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, ClipboardList, Plane, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { cancelBookingAction, confirmBookingAction } from "./actions";

interface PageProps {
  searchParams: Promise<{ flightId?: string; q?: string }>;
}

function getJakartaDayRange(date = new Date()) {
  const jakartaDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const startUtc = Date.UTC(jakartaDate.getUTCFullYear(), jakartaDate.getUTCMonth(), jakartaDate.getUTCDate()) - 7 * 60 * 60 * 1000;
  const endUtc = startUtc + 24 * 60 * 60 * 1000;

  return {
    start: new Date(startUtc),
    end: new Date(endUtc),
  };
}

function statusBadge(status: string, variant: "booking" | "payment") {
  const isGood = status === BookingStatus.CONFIRMED || status === PaymentStatus.PAID;
  const isPending = status === BookingStatus.PENDING || status === PaymentStatus.UNPAID;

  return `inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${isGood
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : isPending
        ? variant === "payment"
          ? "border-slate-200 bg-slate-50 text-slate-500"
          : "border-amber-100 bg-amber-50 text-amber-700"
        : "border-rose-100 bg-rose-50 text-rose-600"
    }`;
}

export default async function StaffPage({ searchParams }: PageProps) {
  const session = await getSessionFromCookie();
  const resolvedSearchParams = await searchParams;

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role !== Role.STAFF) {
    redirect("/");
  }

  const { start, end } = getJakartaDayRange();
  const query = (resolvedSearchParams.q || "").trim().toLowerCase();

  // 1. Ambil daftar penerbangan aktif hari ini untuk sidebar kiri
  const flights = await prisma.flight.findMany({
    where: {
      departureTime: {
        gte: start,
        lt: end,
      },
    },
    include: {
      departureAirport: true,
      arrivalAirport: true,
      plane: { include: { airline: true } },
      bookings: {
        include: {
          payment: true,
          bookingSeats: true,
        },
      },
    },
    orderBy: { departureTime: "asc" },
  });

  // 2. Logic selectedFlightId disempurnakan: prioritaskan ID dari URL agar manifes tanggal berapapun bisa dimuat
  const selectedFlightId = resolvedSearchParams.flightId
    ? Number(resolvedSearchParams.flightId)
    : flights[0]?.id || null;

  const selectedFlight = selectedFlightId
    ? await prisma.flight.findUnique({
      where: { id: selectedFlightId },
      include: {
        departureAirport: true,
        arrivalAirport: true,
        plane: { include: { airline: true } },
        bookings: {
          include: {
            user: true,
            payment: true,
            bookingSeats: {
              include: {
                flightSeat: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })
    : null;

  // 3. Antrean pembayaran terbayar (seluruh tanggal) yang butuh konfirmasi staff
  const paidQueue = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
      payment: { paymentStatus: PaymentStatus.PAID },
    },
    include: {
      user: true,
      payment: true,
      flight: {
        include: {
          departureAirport: true,
          arrivalAirport: true,
        },
      },
      bookingSeats: {
        include: { flightSeat: true },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  // 4. Transformasi baris Manifes Penumpang dengan handling fallback safety (?.)
  const manifestRows = (selectedFlight?.bookings || [])
    .flatMap((booking) =>
      booking.bookingSeats.map((seat) => ({
        id: seat.id,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        customerName: booking.user?.name || "Anonim",
        passengerName: seat.passengerName,
        passengerNik: seat.passengerNik,
        passengerGender: seat.passengerGender === "MALE" ? "Laki-laki" : seat.passengerGender === "FEMALE" ? "Perempuan" : "Belum diisi",
        seatNumber: seat.flightSeat?.seatNumber || "N/A",
        seatClass: seat.flightSeat?.seatClass || "ECONOMY",
        bookingStatus: booking.status,
        paymentStatus: booking.payment?.paymentStatus || PaymentStatus.UNPAID,
      }))
    )
    .filter((row) => {
      if (!query) return true;
      return [row.bookingCode, row.customerName, row.passengerName, row.passengerNik, row.seatNumber]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Operasional Staff</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Manifest, verifikasi boarding, dan konfirmasi pesanan terbayar.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-sky-600" />
          Jadwal Hari Ini
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* PENERBANGAN AKTIF SIDEBAR */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Plane className="h-4 w-4 text-sky-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Penerbangan Aktif</h2>
          </div>
          <div className="flex flex-col gap-2">
            {flights.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-[10px] font-bold text-slate-400">Tidak ada jadwal hari ini.</p>
            ) : (
              flights.map((flight) => {
                const isSelected = flight.id === selectedFlightId;
                const paidPendingCount = flight.bookings.filter((booking) => booking.status === BookingStatus.PENDING && booking.payment?.paymentStatus === PaymentStatus.PAID).length;

                return (
                  <Link
                    key={flight.id}
                    href={`/staff?flightId=${flight.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                    className={`rounded-xl border px-3 py-2 transition-colors ${isSelected ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider">{flight.flightNumber}</span>
                      {paidPendingCount > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-700">{paidPendingCount} perlu cek</span>
                      )}
                    </div>
                    <p className="mt-1 text-[9px] font-bold text-slate-500">
                      {flight.departureAirport.code} - {flight.arrivalAirport.code} / {new Date(flight.departureTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* PESANAN SIAP DIKONFIRMASI */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-3">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Pesanan Siap Dikonfirmasi</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{paidQueue.length} pesanan terbayar menunggu staff</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Rute</th>
                  <th className="px-4 py-3">Kursi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
                {paidQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada pesanan terbayar yang perlu dikonfirmasi.</td>
                  </tr>
                ) : (
                  paidQueue.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-3">
                        <p className="font-black uppercase text-sky-700">{booking.bookingCode}</p>
                        <p className="mt-0.5 text-[8px] text-slate-400">{booking.payment?.invoiceNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black uppercase text-slate-900">{booking.user?.name}</p>
                        <p className="mt-0.5 text-[8px] text-slate-400">{booking.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-black">
                        {booking.flight.departureAirport.code} - {booking.flight.arrivalAirport.code}
                      </td>
                      <td className="px-4 py-3">
                        {booking.bookingSeats.map((seat) => seat.flightSeat?.seatNumber).join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <form action={confirmBookingAction}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            {/* Memasukkan flightId tujuan ke URL otomatis saat submit selesai */}
                            <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white hover:bg-emerald-700">
                              Terima
                            </button>
                          </form>
                          <form action={cancelBookingAction}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-100">
                              Tolak
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MANIFEST PENUMPANG */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-sky-600" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Manifest Penumpang</h2>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                {selectedFlight ? `${selectedFlight.flightNumber} / ${selectedFlight.departureAirport.code}-${selectedFlight.arrivalAirport.code}` : "Pilih jadwal penerbangan"}
              </p>
            </div>
          </div>

          <form className="flex w-full max-w-sm items-center gap-2" action="/staff">
            {selectedFlightId && <input type="hidden" name="flightId" value={selectedFlightId} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={resolvedSearchParams.q || ""}
                placeholder="Cari nama, PNR, NIK, kursi"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[10px] font-bold text-slate-700 outline-none focus:border-sky-400 focus:bg-white"
              />
            </div>
            <button className="rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white">
              Cari
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">PNR</th>
                <th className="px-4 py-3">Penumpang</th>
                <th className="px-4 py-3">NIK</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Kursi</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
              {manifestRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Manifest kosong atau tidak cocok dengan pencarian.</td>
                </tr>
              ) : (
                manifestRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-black uppercase text-sky-700">{row.bookingCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-black uppercase text-slate-900">{row.passengerName}</p>
                      <p className="mt-0.5 text-[8px] text-slate-400">Akun: {row.customerName}</p>
                    </td>
                    <td className="px-4 py-3 font-mono">{row.passengerNik}</td>
                    <td className="px-4 py-3 text-slate-400">{row.passengerGender}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-950 px-2 py-1 text-[9px] font-black text-white">{row.seatNumber}</span>
                      <span className="ml-2 text-[8px] font-black uppercase text-slate-400">{row.seatClass}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={statusBadge(row.bookingStatus, "booking")}>{row.bookingStatus}</span>
                        <span className={statusBadge(row.paymentStatus, "payment")}>{row.paymentStatus}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-bold text-slate-500">
        <XCircle className="h-3.5 w-3.5 text-slate-400" />
        Pesanan yang ditolak staff akan berstatus CANCELLED dan kursinya langsung tersedia kembali.
      </div>
    </div>
  );
}