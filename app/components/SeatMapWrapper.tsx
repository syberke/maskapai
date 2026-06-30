"use client";

// components/SeatMapWrapper.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
// 🎯 FIX: Path dikoreksi dari ".././components/SeatMaps" menjadi "./SeatMaps" karena sekarang posisinya satu folder berdampingan
import SeatMap from "./SeatMaps";

interface SeatMapWrapperProps {
    initialSeats: any[];
    maxPassengers: number;
    flightId: number; // Menangkap ID penerbangan dari halaman server
}

export default function SeatMapWrapper({ initialSeats, maxPassengers, flightId }: SeatMapWrapperProps) {
    const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSelectionChange = (ids: number[]) => {
        setSelectedSeatIds(ids);
        console.log("State kursi tersimpan di Client:", ids);
    };

    const handleBookingSubmit = async () => {
        if (selectedSeatIds.length !== maxPassengers) return;

        setIsLoading(true);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flightId: flightId,
                    seatIds: selectedSeatIds,
                    passengersCount: maxPassengers,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Gagal mengunci kursi.");
                if (response.status === 409) {
                    router.refresh();
                }
                return;
            }

            // Sukses langsung lempar ke halaman checkout
            router.push(`/bookings/${data.bookingId}/checkout`);

        } catch (err) {
            console.error(err);
            alert("Koneksi bermasalah atau terjadi gangguan sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <SeatMap
                seats={initialSeats}
                maxPassengers={maxPassengers}
                onSelectionChange={handleSelectionChange}
            />

            {/* ACTION TOMBOL DI LEVEL CLIENT */}
            {selectedSeatIds.length === maxPassengers && (
                <button
                    disabled={isLoading}
                    onClick={handleBookingSubmit}
                    className={`w-full bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-bold py-2 rounded-lg shadow-md transition-all active:scale-[0.99] ${isLoading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                >
                    {isLoading ? "Mengunci Kursi Pilihan..." : "Konfirmasi & Lanjut Pembayaran"}
                </button>
            )}
        </div>
    );
}