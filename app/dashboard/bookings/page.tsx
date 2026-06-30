// app/dashboard/bookings/page.tsx
import { PrismaClient } from "@prisma/client";
import {
    Plane,
    CircleCheck,
    Timer
} from "lucide-react";
import BookingAction from "./BookingAction"; // 🎯 Import Client Component baru kita

const prisma = new PrismaClient();

export default async function MyBookingsPage() {
    const myBookings = await prisma.booking.findMany({
        where: { userId: 3 },
        include: {
            flight: {
                include: {
                    departureAirport: true,
                    arrivalAirport: true,
                    plane: {
                        include: {
                            airline: true,
                        },
                    },
                },
            },
            bookingSeats: {
                include: {
                    flightSeat: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-28">
            <div className="max-w-5xl mx-auto px-6">

                {/* HEADER SECTION */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tiket Saya</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">Kelola perjalanan dan unduh boarding pass kamu.</p>
                </div>

                {/* LIST TIKET */}
                <div className="flex flex-col gap-4">
                    {myBookings.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Plane className="w-8 h-8 text-slate-300 -rotate-45" />
                            </div>
                            <h3 className="text-slate-900 font-bold">Belum Ada Perjalanan</h3>
                            <p className="text-xs text-slate-400 mt-1">Kamu belum memiliki riwayat pemesanan tiket pesawat.</p>
                        </div>
                    ) : (
                        myBookings.map((booking) => {
                            const isConfirmed = booking.status === "CONFIRMED";

                            return (
                                <div key={booking.id} className="relative group transition-all duration-300 active:scale-[0.99]">

                                    {/* TIKET HORIZONTAL */}
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-5 items-center">

                                        {/* KOLOM 1: MASKAPAI & STATUS */}
                                        <div className="p-5 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center h-full bg-slate-50/50 min-h-[110px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                                                    <Plane className="w-full h-full text-indigo-600" />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider truncate">
                                                    {booking.flight.plane.airline.name}
                                                </span>
                                            </div>
                                            <div className={`w-fit flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${isConfirmed
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                    : booking.status === 'PENDING'
                                                        ? 'bg-amber-50 border-amber-100 text-amber-600'
                                                        : 'bg-rose-50 border-rose-100 text-rose-600'
                                                }`}>
                                                {isConfirmed ? <CircleCheck className="w-2.5 h-2.5" /> : <Timer className="w-2.5 h-2.5" />}
                                                <span className="text-[8px] font-black uppercase tracking-widest">{booking.status}</span>
                                            </div>
                                        </div>

                                        {/* KOLOM 2: DEPARTURE (ASAL) */}
                                        <div className="p-5 flex flex-col justify-center text-center md:text-left h-full">
                                            <span className="text-2xl font-black text-slate-950 tracking-tighter">{booking.flight.departureAirport.code}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{booking.flight.departureAirport.city}</span>
                                            <span className="text-[10px] font-mono text-slate-600 mt-1 font-semibold">
                                                {new Date(booking.flight.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                            </span>
                                        </div>

                                        {/* KOLOM 3: ARROW TRACKER (TENGAH) */}
                                        <div className="px-4 py-2 flex flex-col items-center justify-center h-full relative">
                                            <div className="w-full border-t-2 border-dotted border-slate-200 absolute top-1/2 -translate-y-1/2 hidden md:block"></div>
                                            <div className="bg-white p-1.5 z-10 border border-slate-100 rounded-full shadow-sm hidden md:block">
                                                <Plane className="w-3.5 h-3.5 text-indigo-500 rotate-90" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 z-10 bg-slate-50 md:bg-white px-2 py-0.5 rounded border border-slate-100/80 md:mt-2">
                                                {booking.flight.flightNumber}
                                            </span>
                                        </div>

                                        {/* KOLOM 4: ARRIVAL (TUJUAN) */}
                                        <div className="p-5 flex flex-col justify-center text-center md:text-right h-full">
                                            <span className="text-2xl font-black text-slate-950 tracking-tighter">{booking.flight.arrivalAirport.code}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{booking.flight.arrivalAirport.city}</span>
                                            <span className="text-[10px] font-mono text-slate-400 mt-1 font-medium">
                                                {new Date(booking.flight.departureTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>

                                        {/* KOLOM 5: INFO KURSI & ACTION TOMBOL */}
                                        <div className="p-5 border-t md:border-t-0 md:border-l border-dashed border-slate-200 flex flex-col justify-center gap-2 h-full bg-slate-950 text-white min-h-[110px]">
                                            <div className="flex justify-between items-center md:flex-col md:items-start gap-1">
                                                <div>
                                                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Kode Booking</span>
                                                    <span className="text-xs font-black tracking-widest font-mono text-indigo-400">{booking.bookingCode}</span>
                                                </div>
                                                <div className="md:mt-1">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block md:hidden">Kursi</span>
                                                    <div className="flex gap-1 flex-wrap md:mt-0.5">
                                                        {booking.bookingSeats.map((bs) => (
                                                            <span key={bs.id} className="text-[9px] font-black text-white bg-white/10 px-1.5 py-0.5 rounded">
                                                                {bs.flightSeat.seatNumber}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACTION BUTTON AREA */}
                                            <div className="mt-1 border-t border-white/5 pt-2">
                                                {/* 🎯 MEMANGGIL CLIENT COMPONENT UNTUK AKSI STATUS */}
                                                <BookingAction 
                                                    bookingId={booking.id} 
                                                    initialStatus={booking.status} 
                                                />
                                            </div>
                                        </div>

                                    </div>

                                    {/* DEKORASI LUBANG TIKET */}
                                    <div className="absolute left-[79.5%] -top-2 w-4 h-4 bg-[#F8FAFC] border-b border-slate-200 rounded-full z-20 hidden md:block"></div>
                                    <div className="absolute left-[79.5%] -bottom-2 w-4 h-4 bg-[#F8FAFC] border-t border-slate-200 rounded-full z-20 hidden md:block"></div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* FOOTER INFO */}
                <p className="text-center text-[10px] text-slate-400 mt-12 font-medium">
                    Menampilkan riwayat pemesanan 6 month terakhir.<br />
                    Butuh bantuan? <span className="text-indigo-500 font-bold">Hubungi Customer Service RENGGO</span>
                </p>

            </div>
        </div>
    );
}