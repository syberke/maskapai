// app/bookings/[id]/checkout/page.tsx
// app/bookings/[id]/checkout/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

type Airport = {
    code: string;
    name: string;
    city: string;
    country: string;
};

type Airline = {
    name: string;
    code: string;
    logoUrl?: string | null;
};

type Plane = {
    name: string;
    code: string;
    airline: Airline;
};

type Flight = {
    id: number;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    departureAirport: Airport;
    arrivalAirport: Airport;
    plane: Plane;
};

type FlightSeat = {
    seatNumber: string;
    seatClass: string;
};

type BookingSeat = {
    id: number;
    passengerName: string;
    passengerNik: string;
    passengerGender: string | null;
    flightSeat: FlightSeat;
};

type BookingDetail = {
    id: number;
    bookingCode: string;
    totalPrice: number | string;
    status: string;
    createdAt: string;
    payment?: {
        id: number;
        invoiceNumber: string;
        paymentStatus: string;
        amount: number | string;
    } | null;
    flight: Flight;
    bookingSeats: BookingSeat[];
};

type PaymentResponse = {
    token?: string;
    message?: string;
};

type MidtransResult = Record<string, unknown>;

declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                callbacks: {
                    onSuccess: (result: MidtransResult) => void;
                    onPending: (result: MidtransResult) => void;
                    onError: (result: MidtransResult) => void;
                    onClose: () => void;
                }
            ) => void;
        };
    }
}

function ExpiryCountdown({ createdAt }: { createdAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const createdTime = new Date(createdAt).getTime();
        const expiryTime = createdTime + 15 * 60 * 1000;

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = expiryTime - now;

            if (difference <= 0) {
                setTimeLeft("Kedaluwarsa");
            } else {
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [createdAt]);

    if (timeLeft === "Kedaluwarsa") {
        return (
            <div className="w-full text-center bg-rose-50 border border-rose-200 text-rose-700 font-extrabold py-2 rounded-xl text-xs uppercase tracking-wider">
                Masa Kunci Kursi Habis / Kedaluwarsa
            </div>
        );
    }

    return (
        <div className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider">Selesaikan Pembayaran Sebelum Kursi Dilepas:</span>
            <span className="font-mono text-xs font-black bg-amber-200 px-2 py-0.5 rounded text-amber-950 animate-pulse">{timeLeft || "15:00"}</span>
        </div>
    );
}

export default function CheckoutPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const bookingId = Number(resolvedParams.id);

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        async function fetchBookingDetail() {
            try {
                const res = await fetch(`/api/bookings?id=${bookingId}`);
                if (res.ok) {
                    const data = (await res.json()) as BookingDetail;
                    setBooking(data);
                    
                    if (data && data.id) {
                        try {
                            localStorage.setItem(`renggo_cached_booking_${data.id}`, JSON.stringify(data));
                            const cachedIds = JSON.parse(localStorage.getItem("renggo_cached_booking_ids") || "[]");
                            if (!cachedIds.includes(data.id)) {
                                cachedIds.push(data.id);
                                localStorage.setItem("renggo_cached_booking_ids", JSON.stringify(cachedIds));
                            }
                        } catch (e) {
                            console.error("Gagal caching offline booking:", e);
                        }
                    }
                } else {
                    console.error("Gagal memuat detail booking.");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        }
        fetchBookingDetail();
    }, [bookingId]);

    useEffect(() => {
        const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

        const script = document.createElement("script");
        script.src = snapScriptUrl;
        script.setAttribute("data-client-key", clientKey);
        script.async = true;

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });

            const data = (await response.json()) as PaymentResponse;

            if (!response.ok) {
                alert(data.message || "Gagal menginisialisasi pembayaran.");
                return;
            }

            if (!data.token || !window.snap) {
                alert("Kasir Midtrans belum siap. Silakan coba lagi beberapa saat.");
                return;
            }

            window.snap.pay(data.token, {
				onSuccess: async function (result: MidtransResult) {
                    console.log(result);
                    window.location.href = "/dashboard/bookings?payment=paid";
                },
                onPending: function (result: MidtransResult) {
                    console.log(result);
                    window.location.href = "/dashboard/bookings";
                },
                onError: function (result: MidtransResult) {
                    console.log(result);
                    window.location.href = "/dashboard/bookings";
                },
                onClose: function () {
                    window.location.href = "/dashboard/bookings";
                },
            });

        } catch (error) {
            console.error("Payment trigger error:", error);
            alert("Terjadi gangguan koneksi sistem.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loadingData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#f2f4f7] p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-sm text-center">
                    <p className="text-xs font-bold text-red-600">Gagal memuat detail pemesanan.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Data pemesanan tidak ditemukan atau terjadi kesalahan server.</p>
                    <Link href="/dashboard/bookings" className="inline-block mt-4 bg-indigo-600 text-white text-[10px] font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                        Kembali ke Tiket Saya
                    </Link>
                </div>
            </div>
        );
    }

    const basePrice = booking ? Number(booking.totalPrice) : 0;
    const totalTax = 50000;
    const finalPrice = basePrice + totalTax;
    const isAlreadyPaid = booking.payment?.paymentStatus === "PAID";
    const isInactive = ["CANCELLED", "EXPIRED"].includes(booking.status);

    return (
        <div className="w-full min-h-screen bg-[#f2f4f7] flex flex-col antialiased pt-28 pb-12">
            <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-3">

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                        <h3 className="text-emerald-900 text-xs font-bold">Metode Pembayaran Resmi</h3>
                        <p className="text-[10px] text-emerald-700 mt-0.5">Terintegrasi aman menggunakan sistem Sandbox Midtrans.</p>
                    </div>
                </div>

                {!isAlreadyPaid && !isInactive && <ExpiryCountdown createdAt={booking.createdAt} />}

                <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rincian Penerbangan</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-lg font-black text-slate-900 tracking-tight">{booking.flight.departureAirport.code}</span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">{booking.flight.departureAirport.city}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-indigo-600 font-mono tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded">{booking.flight.flightNumber}</span>
                            <div className="w-16 border-t-2 border-dashed border-slate-200 my-1"></div>
                            <span className="text-[8px] text-slate-400 font-semibold uppercase">{booking.bookingSeats[0]?.flightSeat.seatClass}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black text-slate-900 tracking-tight">{booking.flight.arrivalAirport.code}</span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">{booking.flight.arrivalAirport.city}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                        <span>Maskapai: <b className="text-slate-800 uppercase">{booking.flight.plane.airline.name}</b></span>
                        <span>Pesawat: <b className="text-slate-800">{booking.flight.plane.name}</b></span>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manifes Penumpang</span>
                        <span className="text-[9px] font-black text-slate-500 font-mono">PNR: {booking.bookingCode}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {booking.bookingSeats.map((seat, index) => (
                            <div key={seat.id} className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <span className="block font-black text-slate-900 uppercase">
                                        {index + 1}. {seat.passengerName}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        NIK: {seat.passengerNik} &bull; {seat.passengerGender === "MALE" ? "Laki-laki" : "Perempuan"}
                                    </span>
                                </div>
                                <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[9px] font-black text-white">
                                    Kursi {seat.flightSeat.seatNumber}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block border-b border-slate-100 pb-2">Rincian Tarif</span>
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Tarif Dasar ({booking.bookingSeats.length} Penumpang)</span>
                        <span>Rp {basePrice.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Pajak Bandara (Flat)</span>
                        <span>Rp {totalTax.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="border-t border-slate-100 my-1 pt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900">Total Tagihan</span>
                        <span className="text-sm font-black text-indigo-600">Rp {finalPrice.toLocaleString("id-ID")}</span>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing || isAlreadyPaid || isInactive}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[11px] font-bold py-2.5 rounded-lg shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer"
                >
                    {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                    )}
                    {isProcessing
                        ? "Membuka Kasir..."
                        : isAlreadyPaid
                            ? "Pembayaran Diterima, Menunggu Staff"
                            : isInactive
                                ? "Booking Sudah Tidak Aktif"
                                : "Bayar Sekarang Via Midtrans"}
                </button>

                <Link href="/flights" className="text-center text-[10px] text-slate-400 hover:text-slate-600 font-bold py-1">
                    Kembali ke Pencarian
                </Link>
            </div>
        </div>
    );
}
