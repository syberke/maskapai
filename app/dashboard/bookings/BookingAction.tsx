"use client";

import { useState } from "react";
import { ChevronRight, QrCode, RefreshCw } from "lucide-react";
import Link from "next/link";

interface BookingActionProps {
    bookingId: number;
    initialStatus: string;
}

export default function BookingAction({ bookingId, initialStatus }: BookingActionProps) {
    const [status, setStatus] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckStatus = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/bookings/check-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });

            const data = await res.json();

            if (data.status === "CONFIRMED") {
                alert("Mantap! Pembayaran aman, status sudah CONFIRMED.");
                setStatus("CONFIRMED");
                window.location.reload(); // Reload halaman agar badge status utama ikut berubah hijau
            } else {
                alert("Midtrans bilang belum dibayar nih, silakan transfer dulu di simulator.");
            }
        } catch (err) {
            console.error("Gagal cek status:", err);
            alert("Terjadi kesalahan saat memeriksa status.");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "CONFIRMED") {
        return (
            <button className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider">
                <QrCode className="w-3 h-3" /> Boarding Pass
            </button>
        );
    }

    if (status === "PENDING") {
        return (
            <div className="flex flex-col gap-1.5">
                <Link
                    href={`/bookings/${bookingId}/checkout`}
                    className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-indigo-300 text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider text-center"
                >
                    Bayar <ChevronRight className="w-3 h-3" />
                </Link>

                {/* 🎯 TOMBOL COCOK UNTUK CEK STATUS MANUAL DI SINI */}
                <button
                    onClick={handleCheckStatus}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider text-center disabled:opacity-50"
                >
                    <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Checking..." : "Cek Status"}
                </button>
            </div>
        );
    }

    return (
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block text-center">
            Expired
        </span>
    );
}