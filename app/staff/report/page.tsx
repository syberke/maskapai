import prisma from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";
import { passengerGenderLabel } from "@/lib/passengerManifest";
import { PaymentStatus, Role } from "@prisma/client";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Plane,
  UserRound,
  Users,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ flightId?: string }>;
}

function formatDateTime(value: Date) {
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function statusClass(value: string) {
  if (["CONFIRMED", "PAID"].includes(value)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (["PENDING", "UNPAID"].includes(value)) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }
  return "border-rose-100 bg-rose-50 text-rose-700";
}

export default async function StaffPassengerReportPage({ searchParams }: PageProps) {
  await connection();

  const session = await getSessionFromCookie();
  if (!session) redirect("/auth/login");
  if (session.role !== Role.STAFF) redirect("/");

  const resolvedSearchParams = await searchParams;
  const flights = await prisma.flight.findMany({
    include: {
      departureAirport: true,
      arrivalAirport: true,
      plane: { include: { airline: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { departureTime: "desc" },
    take: 50,
  });

  const requestedFlightId = Number(resolvedSearchParams.flightId);
  const selectedFlightId = Number.isInteger(requestedFlightId) && requestedFlightId > 0
    ? requestedFlightId
    : flights[0]?.id;

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
                include: { flightSeat: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    : null;

  const rows = (selectedFlight?.bookings || [])
    .flatMap((booking) =>
      booking.bookingSeats.map((bookingSeat) => ({
        id: bookingSeat.id,
        bookingCode: booking.bookingCode,
        accountName: booking.user.name,
        passengerName: bookingSeat.passengerName,
        passengerNik: bookingSeat.passengerNik,
        passengerGender: bookingSeat.passengerGender,
        seatNumber: bookingSeat.flightSeat.seatNumber,
        seatClass: bookingSeat.flightSeat.seatClass,
        bookingStatus: booking.status,
        paymentStatus: booking.payment?.paymentStatus ?? PaymentStatus.UNPAID,
        isBoarded: booking.isBoarded,
      })),
    )
    .sort((left, right) =>
      left.seatNumber.localeCompare(right.seatNumber, "id", { numeric: true }),
    );

  const maleCount = rows.filter((row) => row.passengerGender === "MALE").length;
  const femaleCount = rows.filter((row) => row.passengerGender === "FEMALE").length;
  const incompleteCount = rows.length - maleCount - femaleCount;
  const boardedCount = rows.filter((row) => row.isBoarded).length;

  const cards = [
    {
      label: "Total Penumpang",
      value: rows.length,
      icon: Users,
      description: `${selectedFlight?.bookings.length || 0} kode booking`,
    },
    {
      label: "Laki-laki",
      value: maleCount,
      icon: UserRound,
      description: "Gender MALE tersimpan",
    },
    {
      label: "Perempuan",
      value: femaleCount,
      icon: UserRound,
      description: "Gender FEMALE tersimpan",
    },
    {
      label: "Sudah Boarding",
      value: boardedCount,
      icon: CheckCircle2,
      description: `${incompleteCount} data legacy belum lengkap`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-sky-600">
            Staff Report
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Report Manifest Penumpang
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Satu baris mewakili satu tiket, satu kursi, dan satu identitas penumpang.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/staff"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            Operasional
          </Link>
          {selectedFlightId && (
            <a
              href={`/api/staff/reports/passengers?flightId=${selectedFlightId}`}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </a>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <form className="flex flex-col gap-3 md:flex-row md:items-end" action="/staff/report">
          <div className="flex-1">
            <label className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
              Pilih Penerbangan
            </label>
            <select
              name="flightId"
              defaultValue={selectedFlightId || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:border-sky-400"
            >
              {flights.map((flight) => (
                <option key={flight.id} value={flight.id}>
                  {flight.flightNumber} | {flight.departureAirport.code}-{flight.arrivalAirport.code} | {formatDateTime(flight.departureTime)} | {flight._count.bookings} booking
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-xl bg-sky-600 px-5 py-2.5 text-[9px] font-black uppercase tracking-wider text-white hover:bg-sky-700">
            Tampilkan Report
          </button>
        </form>
      </section>

      {selectedFlight ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wider">
                    {selectedFlight.flightNumber} | {selectedFlight.departureAirport.code}-{selectedFlight.arrivalAirport.code}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-300">
                    {selectedFlight.plane.airline.name} | {formatDateTime(selectedFlight.departureTime)}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                {selectedFlight.plane.name}
              </span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {card.label}
                    </span>
                    <Icon className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">{card.value}</p>
                  <p className="mt-1 text-[9px] font-semibold text-slate-400">{card.description}</p>
                </div>
              );
            })}
          </section>

          {incompleteCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Ada {incompleteCount} data lama dengan gender UNKNOWN. Booking baru wajib MALE atau FEMALE.
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3">PNR</th>
                    <th className="px-4 py-3">Penumpang</th>
                    <th className="px-4 py-3">NIK</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Kursi</th>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Pembayaran</th>
                    <th className="px-4 py-3">Boarding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Belum ada data tiket pada penerbangan ini.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-black uppercase text-sky-700">{row.bookingCode}</td>
                        <td className="px-4 py-3">
                          <p className="font-black uppercase text-slate-900">{row.passengerName}</p>
                          <p className="mt-0.5 text-[8px] text-slate-400">Akun: {row.accountName}</p>
                        </td>
                        <td className="px-4 py-3 font-mono">{row.passengerNik}</td>
                        <td className="px-4 py-3 font-bold">{passengerGenderLabel(row.passengerGender)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-950 px-2 py-1 text-[9px] font-black text-white">
                            {row.seatNumber}
                          </span>
                          <span className="ml-2 text-[8px] font-black uppercase text-slate-400">{row.seatClass}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${statusClass(row.bookingStatus)}`}>
                            {row.bookingStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${statusClass(row.paymentStatus)}`}>
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.isBoarded ? (
                            <span className="font-black text-emerald-700">Sudah</span>
                          ) : (
                            <span className="font-black text-slate-400">Belum</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center text-xs font-bold text-slate-400">
          Belum ada penerbangan untuk dibuatkan report.
        </div>
      )}
    </div>
  );
}
