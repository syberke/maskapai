"use client";
import Link from "next/link";
import { Plane, Luggage, Clock, ShieldCheck, ChevronRight } from "lucide-react";

interface FlightCardProps {
    flight: {
        id: number;
        flightNumber: string;
        departureTime: string | Date;
        arrivalTime: string | Date;
        departureAirport: { code: string; city: string; name: string };
        arrivalAirport: { code: string; city: string; name: string };
        plane: {
            model: string;
            airline: { name: string; logoUrl?: string };
        };
        priceEconomy: number;
        priceBusiness: number;
        priceFirstClass: number;
    };
    seatClass: string;
    passengers: number;
}

export default function FlightCard({ flight, seatClass, passengers }: FlightCardProps) {
    const depDate = new Date(flight.departureTime);
    const arrDate = new Date(flight.arrivalTime);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };

    const durationMs = arrDate.getTime() - depDate.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    let basePrice = flight.priceEconomy;
    if (seatClass === "BUSINESS") basePrice = flight.priceBusiness;
    if (seatClass === "FIRST_CLASS") basePrice = flight.priceFirstClass;

    const totalPrice = basePrice * passengers;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:py-4 sm:px-5 gap-3">

                {/* LEFT: MASKAPAI */}
                <div className="flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                        {flight.plane.airline.name.substring(0, 2)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight">{flight.plane.airline.name}</h4>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                            {flight.flightNumber} • {flight.plane.model.split(" ")[0]}
                        </p>
                    </div>
                </div>

                {/* CENTER: TIMELINE JADWAL & DURASI */}
                <div className="flex items-center justify-between gap-6 flex-1 max-w-md w-full">
                    {/* Pergi */}
                    <div className="text-right sm:text-left">
                        <span className="text-base font-black text-slate-900 tracking-tight">
                            {formatTime(depDate)}
                        </span>
                        <span className="block font-bold text-slate-700 text-[11px] uppercase">{flight.departureAirport.code}</span>
                        <span className="block text-[9px] text-slate-400 font-medium truncate max-w-[60px]">{flight.departureAirport.city}</span>
                    </div>

                    {/* Garis Tengah */}
                    <div className="flex-1 flex flex-col items-center min-w-[80px]">
                        <span className="text-[9px] font-medium text-slate-400 mb-1 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {durationHours}j {durationMinutes}m
                        </span>
                        <div className="w-full flex items-center relative">
                            <div className="h-[1.5px] w-full bg-slate-200 rounded-full"></div>
                            <div className="absolute left-0 w-1.5 h-1.5 rounded-full bg-slate-300 -translate-x-1/2"></div>
                            <Plane className="w-3 h-3 text-slate-400 absolute left-1/2 -translate-x-1/2 bg-white px-0.5" />
                            <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-slate-900 translate-x-1/2"></div>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 tracking-wider uppercase mt-1">Langsung</span>
                    </div>

                    {/* Tiba */}
                    <div className="text-left sm:text-right">
                        <span className="text-base font-black text-slate-900 tracking-tight">
                            {formatTime(arrDate)}
                        </span>
                        <span className="block font-bold text-slate-700 text-[11px] uppercase">{flight.arrivalAirport.code}</span>
                        <span className="block text-[9px] text-slate-400 font-medium truncate max-w-[60px]">{flight.arrivalAirport.city}</span>
                    </div>
                </div>

                {/* RIGHT: HARGA & TOMBOL */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 min-w-[160px]">
                    <div className="text-left sm:text-right">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            {passengers}x Pax Total:
                        </span>
                        <span className="text-base font-black text-slate-900">
                            {formatCurrency(totalPrice)}
                        </span>
                    </div>
                    {/* 🎯 FIX: Tombol diperpendek & diperkecil agar tidak kepanjangan */}
                    <Link
                        href={`/flights/${flight.id}/seats?class=${seatClass}&passengers=${passengers}`}
                        className="bg-slate-950 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                        Pilih Kursi
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

            </div>

            {/* MINI FOOTER */}
            <div className="px-5 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                <span className="flex items-center gap-1"><Luggage className="w-3 h-3" /> Kabin 7kg</span>
                <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="w-3 h-3" /> Refund Aman</span>
            </div>
        </div>
    );
}