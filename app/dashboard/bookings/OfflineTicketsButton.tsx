"use client";

import { useEffect, useState } from "react";
import { QrCode, WifiOff, X, FileWarning, Plane } from "lucide-react";
import QRCode from "react-qr-code";

type Airport = {
    code: string;
    name: string;
    city: string;
    country: string;
};

type Airline = {
    name: string;
    code: string;
};

type PlaneType = {
    name: string;
    code: string;
    airline: Airline;
};

type Flight = {
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    departureAirport: Airport;
    arrivalAirport: Airport;
    plane: PlaneType;
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

type CachedBooking = {
    id: number;
    bookingCode: string;
    totalPrice: number | string;
    status: string;
    createdAt: string;
    flight: Flight;
    bookingSeats: BookingSeat[];
    payment?: {
        paymentStatus: string;
    } | null;
};

interface OfflineTicketsButtonProps {
    bookings?: CachedBooking[];
}

export default function OfflineTicketsButton({ bookings }: OfflineTicketsButtonProps) {
    const [isOffline, setIsOffline] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [cachedBookings, setCachedBookings] = useState<CachedBooking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<CachedBooking | null>(null);

    // 0. Auto-cache bookings dari server ke local storage
    useEffect(() => {
        if (bookings && bookings.length > 0) {
            bookings.forEach(b => {
                try {
                    localStorage.setItem(`renggo_cached_booking_${b.id}`, JSON.stringify(b));
                } catch (e) {
                    console.error("Gagal caching offline booking:", e);
                }
            });
            try {
                const cachedIds = bookings.map(b => b.id);
                localStorage.setItem("renggo_cached_booking_ids", JSON.stringify(cachedIds));
            } catch (e) {
                console.error("Gagal update list ID offline:", e);
            }
        }
    }, [bookings]);

    // 1. Deteksi status online/offline browser
    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // 2. Load cached bookings dari localStorage
    useEffect(() => {
        if (showModal) {
            try {
                const keys = Object.keys(localStorage);
                const bookingKeys = keys.filter(key => key.startsWith("renggo_cached_booking_") && !key.endsWith("_ids"));
                
                const bookings: CachedBooking[] = [];
                bookingKeys.forEach(key => {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw) as CachedBooking;
                            if (parsed && parsed.bookingCode) {
                                bookings.push(parsed);
                            }
                        } catch (e) {
                            console.error("Gagal parse cached ticket:", e);
                        }
                    }
                });

                // Urutkan berdasarkan tanggal dibuat terbaru
                bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setCachedBookings(bookings);
                
                if (bookings.length > 0) {
                    setSelectedBooking(bookings[0]);
                }
            } catch (err) {
                console.error("Gagal memuat local storage:", err);
            }
        }
    }, [showModal]);

    return (
        <div className="w-full flex flex-col gap-2.5 mb-6">
            {/* Warning Banner saat Offline */}
            {isOffline && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex items-start gap-2.5 text-amber-600 animate-in fade-in slide-in-from-top-1 duration-200">
                    <WifiOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider">Koneksi Internet Terputus</h4>
                        <p className="text-[10px] font-medium text-amber-500/90 mt-0.5">
                            Tenang, sistem Renggo mengaktifkan mode offline otomatis. Anda tetap dapat mengakses boarding pass yang telah dibuka sebelumnya.
                        </p>
                    </div>
                </div>
            )}

            {/* Tombol Akses Tiket Offline */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black px-4 py-2 rounded-xl border border-slate-800 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                >
                    <QrCode className="w-3.5 h-3.5" />
                    AKSES TIKET OFFLINE
                </button>
            </div>

            {/* MODAL OFFLINE TIKET */}
            {showModal && (
                <div
                    onClick={() => setShowModal(false)}
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
                    >
                        {/* Header Modal */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <WifiOff className="w-4 h-4 text-rose-500" />
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Dompet Tiket Luring (Offline)</h3>
                                    <p className="text-[9px] text-slate-400 font-medium">Boarding pass digital tersimpan aman di perangkat Anda.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Konten Modal */}
                        {cachedBookings.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <FileWarning className="w-5 h-5 text-slate-400" />
                                </div>
                                <h4 className="text-xs font-bold text-slate-900">Belum Ada Tiket Tersimpan</h4>
                                <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                                    Anda harus membuka detail tiket setidaknya satu kali saat terhubung ke internet agar tiket ter-caching otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                                {/* Sidebar List Booking */}
                                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto p-3 flex flex-col gap-2 max-h-[200px] md:max-h-none">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block px-1">Daftar Tiket</span>
                                    {cachedBookings.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setSelectedBooking(b)}
                                            className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-0.5 cursor-pointer ${
                                                selectedBooking?.id === b.id
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-mono font-black uppercase text-[10px] tracking-wider text-indigo-500">
                                                    {b.bookingCode}
                                                </span>
                                                <span className={`text-[7px] font-black uppercase px-1 rounded ${
                                                    b.status === "CONFIRMED" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                            <div className="font-black text-[9px] flex items-center gap-1 uppercase mt-1">
                                                <span>{b.flight.departureAirport.code}</span>
                                                <Plane className="w-2.5 h-2.5 rotate-45 text-slate-400 shrink-0" />
                                                <span>{b.flight.arrivalAirport.code}</span>
                                            </div>
                                            <span className="text-[8px] opacity-75">
                                                {new Date(b.flight.departureTime).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Area Detail Boarding Pass */}
                                <div className="flex-1 overflow-y-auto p-5 bg-slate-50 flex flex-col gap-4">
                                    {selectedBooking && (
                                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                                            {/* Logo & Booking Code */}
                                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                <div>
                                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Renggo Airline</span>
                                                    <span className="text-xs font-black uppercase text-slate-800">{selectedBooking.flight.plane.airline.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Kode Booking (PNR)</span>
                                                    <span className="text-sm font-mono font-black text-indigo-600 tracking-wider uppercase">{selectedBooking.bookingCode}</span>
                                                </div>
                                            </div>

                                            {/* Rute Penerbangan */}
                                            <div className="grid grid-cols-3 items-center text-center">
                                                <div className="text-left">
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{selectedBooking.flight.departureAirport.code}</span>
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">{selectedBooking.flight.departureAirport.city}</span>
                                                    <span className="block text-[9px] font-mono text-slate-600 font-semibold mt-1">
                                                        {new Date(selectedBooking.flight.departureTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{selectedBooking.flight.flightNumber}</span>
                                                    <div className="w-12 border-t-2 border-dotted border-slate-200 my-1"></div>
                                                    <span className="text-[7px] font-bold text-slate-400 uppercase">{selectedBooking.bookingSeats[0]?.flightSeat.seatClass}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{selectedBooking.flight.arrivalAirport.code}</span>
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">{selectedBooking.flight.arrivalAirport.city}</span>
                                                    <span className="block text-[8px] text-slate-400 mt-1">
                                                        {new Date(selectedBooking.flight.departureTime).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* QR Code Scannable */}
                                            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-4 my-1">
                                                <QRCode
                                                    value={`RENGGO-MANIFEST-${selectedBooking.bookingCode}`}
                                                    size={120}
                                                    style={{ height: "auto", maxWidth: "100%", width: "120px" }}
                                                />
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Pindai di Gerbang Keberangkatan</span>
                                            </div>

                                            {/* Manifes Penumpang */}
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 block">Penumpang Penerbangan</span>
                                                <div className="flex flex-col gap-1.5">
                                                    {selectedBooking.bookingSeats.map((seat, idx) => (
                                                        <div key={seat.id} className="flex justify-between items-center text-[10px] text-slate-700">
                                                            <div className="text-left">
                                                                <span className="block font-bold uppercase text-slate-900">{idx + 1}. {seat.passengerName}</span>
                                                                <span className="text-[8px] text-slate-400 font-medium">NIK: {seat.passengerNik} &bull; {seat.passengerGender === "MALE" ? "Laki-laki" : "Perempuan"}</span>
                                                            </div>
                                                            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-black text-white shrink-0">
                                                                Kursi {seat.flightSeat.seatNumber}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer Modal Info */}
                                            <div className="bg-slate-100 text-center rounded-xl py-2 px-3 text-[8px] font-bold text-slate-500 leading-normal border border-slate-200/50">
                                                BOARDING PASS DIGITAL LURING &bull; TIAP TIKET SUDAH KONSISTEN DENGAN DATABASE
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
