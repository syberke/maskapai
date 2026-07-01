"use client";

import { useState, useMemo } from "react";
import { Armchair } from "lucide-react";

interface Seat {
    id: number;
    seatNumber: string;
    seatClass: "ECONOMY" | "BUSINESS" | "FIRST_CLASS";
    isAvailable: boolean;
}

interface SeatMapProps {
    seats: Seat[];
    maxPassengers: number;
    onSelectionChange: (selectedSeatIds: number[]) => void;
}

export default function SeatMap({ seats = [], maxPassengers, onSelectionChange }: SeatMapProps) {
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

    const handleSeatClick = (seatId: number, isAvailable: boolean) => {
        if (!isAvailable) return;

        setSelectedSeats((prev) => {
            let updatedSeats: number[];

            if (prev.includes(seatId)) {
                updatedSeats = prev.filter((id) => id !== seatId);
            } else {
                if (prev.length >= maxPassengers) {
                    alert(`Kamu hanya bisa memilih maksimal ${maxPassengers} kursi sesuai jumlah penumpang.`);
                    return prev;
                }
                updatedSeats = [...prev, seatId];
            }

            // Jalankan callback dengan aman setelah state lokal dipastikan siap
            setTimeout(() => {
                onSelectionChange(updatedSeats);
            }, 0);

            return updatedSeats;
        });
    };

    // 🎯 FIX UTAMA: Gunakan useMemo dan berikan guard data agar proses ekstrak string tidak merusak render global
    const rows = useMemo(() => {
        if (!Array.isArray(seats)) return [];
        const extractedRows = seats
            .map((s) => (s?.seatNumber ? s.seatNumber.replace(/[A-Z]/g, "") : ""))
            .filter((row) => row !== "");
        return Array.from(new Set(extractedRows));
    }, [seats]);

    const cols = ["A", "B", "C", "D", "E", "K"];

    return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm max-w-xl mx-auto">
            <div className="text-center mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Pilih Kursi Penerbangan</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Silakan pilih {maxPassengers} kursi yang kamu inginkan</p>
            </div>

            {/* INDIKATOR STATUS KURSI */}
            <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 bg-slate-50 py-2 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-slate-300" /> Tersedia</div>
                <div className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-indigo-600" /> Dipilih</div>
                <div className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-slate-200 fill-slate-200" /> Terisi</div>
            </div>

            {/* BADAN PESAWAT */}
            <div className="border-x-2 border-slate-300 rounded-t-full pt-10 px-6 pb-4 bg-slate-50/50 flex flex-col gap-2 relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-300 tracking-widest uppercase">Kokpit</div>

                {/* LOOPING SEAT GENERATOR */}
                {rows.map((rowNum) => (
                    <div key={rowNum} className="flex items-center justify-between gap-1">
                        {/* Sisi Kiri (A, B, C) */}
                        <div className="flex gap-1.5 flex-1 justify-end">
                            {cols.slice(0, 3).map((colLetter) => {
                                const seatCode = `${rowNum}${colLetter}`;
                                const seat = seats.find((s) => s?.seatNumber === seatCode);

                                if (!seat) return <div key={seatCode} className="w-7 h-7" />;

                                const isSelected = selectedSeats.includes(seat.id);
                                return (
                                    <button
                                        key={seat.id}
                                        disabled={!seat.isAvailable}
                                        onClick={() => handleSeatClick(seat.id, seat.isAvailable)}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${!seat.isAvailable
                                                ? "bg-slate-200/70 text-slate-300 cursor-not-allowed"
                                                : isSelected
                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                                    : "bg-white border border-slate-200 hover:border-indigo-400 text-slate-500"
                                            }`}
                                    >
                                        <span className="text-[9px] font-bold">{seatCode}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Lorong Jalan Tengah (Aisle) */}
                        <div className="w-6 text-center text-[9px] font-black text-slate-300 bg-white/80 py-0.5 rounded border border-slate-100">{rowNum}</div>

                        {/* Sisi Kanan (D, E, K) */}
                        <div className="flex gap-1.5 flex-1 justify-start">
                            {cols.slice(3, 6).map((colLetter) => {
                                const seatCode = `${rowNum}${colLetter}`;
                                const seat = seats.find((s) => s?.seatNumber === seatCode);

                                if (!seat) return <div key={seatCode} className="w-7 h-7" />;

                                const isSelected = selectedSeats.includes(seat.id);
                                return (
                                    <button
                                        key={seat.id}
                                        disabled={!seat.isAvailable}
                                        onClick={() => handleSeatClick(seat.id, seat.isAvailable)}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${!seat.isAvailable
                                                ? "bg-slate-200/70 text-slate-300 cursor-not-allowed"
                                                : isSelected
                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                                    : "bg-white border border-slate-200 hover:border-indigo-400 text-slate-500"
                                            }`}
                                    >
                                        <span className="text-[9px] font-bold">{seatCode}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}