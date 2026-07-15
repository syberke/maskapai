// app/dashboard/bookings/page.tsx
import prisma from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { Plane, TicketX, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import BookingAction from "./BookingAction";

interface PageProps {
    searchParams: Promise<{ payment?: string }>;
}

function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatTime(date: Date | string) {
    return new Date(date).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

type StatusCfg = {
    label: string;
    badgeClass: string;
    icon: React.ReactNode;
};

function statusConfig(status: BookingStatus, paymentStatus: PaymentStatus): StatusCfg {
    if (status === BookingStatus.CONFIRMED) {
        return {
            label: "Dikonfirmasi",
            badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            icon: <CheckCircle2 className="w-3 h-3" />,
        };
    }
    if (status === BookingStatus.PENDING && paymentStatus === PaymentStatus.PAID) {
        return {
            label: "Menunggu Konfirmasi",
            badgeClass: "bg-sky-50 text-sky-700 border border-sky-200",
            icon: <Clock className="w-3 h-3" />,
        };
    }
    if (status === BookingStatus.PENDING) {
        return {
            label: "Belum Dibayar",
            badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
            icon: <AlertCircle className="w-3 h-3" />,
        };
    }
    if (status === BookingStatus.CANCELLED) {
        return {
            label: "Dibatalkan",
            badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
            icon: <XCircle className="w-3 h-3" />,
        };
    }
    return {
        label: "Kedaluwarsa",
        badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
        icon: <XCircle className="w-3 h-3" />,
    };
}

export default async function BookingsDashboardPage({ searchParams }: PageProps) {
    const session = await getSessionFromCookie();

    if (!session) {
        redirect("/auth/login");
    }

    const resolvedSearchParams = await searchParams;
    const paymentNotif = resolvedSearchParams?.payment;

    const bookings = await prisma.booking.findMany({
        where: { userId: session.userId },
        include: {
            payment: true,
            flight: {
                include: {
                    departureAirport: true,
                    arrivalAirport: true,
                    plane: {
                        include: { airline: true },
                    },
                },
            },
            bookingSeats: {
                include: { flightSeat: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="w-full min-h-screen bg-slate-50 pt-24 pb-16 antialiased">
            <div className="max-w-3xl mx-auto px-4">

                {/* Payment Notification Banner */}
                {paymentNotif === "paid" && (
                    <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Pembayaran berhasil! Booking Anda sedang menunggu konfirmasi staff.
                    </div>
                )}
                {paymentNotif === "pending" && (
                    <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        Pembayaran Anda sedang diproses.
                    </div>
                )}
                {paymentNotif === "error" && (
                    <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2.5">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        Terjadi kesalahan saat pembayaran. Silakan coba lagi.
                    </div>
                )}

                {/* Empty State */}
                {bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-white rounded-2xl border border-slate-200">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                            <TicketX className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-slate-700 font-black text-sm">Belum ada tiket</p>
                            <p className="text-slate-400 text-xs mt-1 font-medium">Yuk pesan penerbangan pertama Anda!</p>
                        </div>
                        <Link
                            href="/flights"
                            className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black py-2 px-5 rounded-lg transition-colors uppercase tracking-wider"
                        >
                            Cari Penerbangan
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {bookings.map((booking) => {
                            const payStatus = booking.payment?.paymentStatus ?? PaymentStatus.UNPAID;
                            const { label, badgeClass, icon } = statusConfig(booking.status, payStatus);
                            const flight = booking.flight;
                            const isExpiredOrCancelled = (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED);

                            return (
                                <div
                                    key={booking.id}
                                    className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${isExpiredOrCancelled ? "border-slate-200 opacity-60" : "border-slate-200 shadow-sm"}`}
                                >
                                    {/* Top: Route bar */}
                                    <div className="px-5 pt-4 pb-3 flex items-center gap-4">
                                        {/* Airline icon */}
                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                            <Plane className="w-4 h-4 text-indigo-500" />
                                        </div>

                                        {/* Route */}
                                        <div className="flex-1 flex items-center gap-3 min-w-0">
                                            <div className="text-center shrink-0">
                                                <span className="block text-xl font-black text-slate-900 tracking-tight leading-none">{flight.departureAirport.code}</span>
                                                <span className="block text-[9px] text-slate-400 font-semibold uppercase mt-0.5">{flight.departureAirport.city}</span>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center gap-0.5">
                                                <span className="text-[9px] font-black text-indigo-600 font-mono tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded-full">{flight.flightNumber}</span>
                                                <div className="w-full flex items-center gap-1">
                                                    <div className="flex-1 h-px bg-slate-200" />
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    <div className="flex-1 h-px bg-slate-200" />
                                                </div>
                                                <span className="text-[8px] text-slate-400 font-semibold uppercase">{booking.bookingSeats[0]?.flightSeat?.seatClass}</span>
                                            </div>
                                            <div className="text-center shrink-0">
                                                <span className="block text-xl font-black text-slate-900 tracking-tight leading-none">{flight.arrivalAirport.code}</span>
                                                <span className="block text-[9px] text-slate-400 font-semibold uppercase mt-0.5">{flight.arrivalAirport.city}</span>
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${badgeClass}`}>
                                            {icon}
                                            {label}
                                        </span>
                                    </div>

                                    {/* Divider: boarding pass style */}
                                    <div className="relative flex items-center mx-5">
                                        <div className="absolute -left-8 w-5 h-5 rounded-full bg-slate-50 border border-slate-200" />
                                        <div className="flex-1 border-t border-dashed border-slate-200" />
                                        <div className="absolute -right-8 w-5 h-5 rounded-full bg-slate-50 border border-slate-200" />
                                    </div>

                                    {/* Middle: flight details */}
                                    <div className="px-5 py-3 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Maskapai</span>
                                            <span className="text-xs font-bold text-slate-700 mt-0.5 block">{flight.plane.airline.name}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Tanggal</span>
                                            <span className="text-xs font-bold text-slate-700 mt-0.5 block">{formatDate(flight.departureTime)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Berangkat</span>
                                            <span className="text-base font-black text-slate-900 mt-0.5 block">{formatTime(flight.departureTime)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Tiba</span>
                                            <span className="text-base font-black text-slate-900 mt-0.5 block">{formatTime(flight.arrivalTime)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Penumpang</span>
                                            <span className="text-xs font-bold text-slate-700 mt-0.5 block">{booking.bookingSeats.length} orang</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Kursi</span>
                                            <span className="text-xs font-bold text-slate-700 font-mono mt-0.5 block">
                                                {booking.bookingSeats.map(s => s.flightSeat.seatNumber).join(", ")}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Kode Booking</span>
                                            <span className="text-xs font-black text-indigo-600 font-mono mt-0.5 block">{booking.bookingCode}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Total Bayar</span>
                                            <span className="text-xs font-black text-slate-900 mt-0.5 block">
                                                Rp {(Number(booking.totalPrice) + 50000).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom: action bar */}
                                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                        {/* Boarding status badge */}
                        <div className="mb-2">
                            {booking.status === BookingStatus.CONFIRMED ? (
                                booking.isBoarded ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Boarding Selesai
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-700">
                                        <Clock className="w-3 h-3" />
                                        Siap Boarding
                                    </span>
                                )
                            ) : null}
                        </div>
                        <BookingAction
                            bookingId={booking.id}
                            initialStatus={booking.status}
                            initialPaymentStatus={payStatus}
                            bookingCode={booking.bookingCode}
                            initialIsBoarded={booking.isBoarded}
                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}