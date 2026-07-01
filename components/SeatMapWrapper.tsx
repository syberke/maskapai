"use client";

// components/SeatMapWrapper.tsx
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// 🎯 FIX: Path dikoreksi dari ".././components/SeatMaps" menjadi "./SeatMaps" karena sekarang posisinya satu folder berdampingan
import SeatMap from "./SeatMaps";

type Seat = {
    id: number;
    seatNumber: string;
    seatClass: "ECONOMY" | "BUSINESS" | "FIRST_CLASS";
    isAvailable: boolean;
};

interface SeatMapWrapperProps {
    initialSeats: Seat[];
    maxPassengers: number;
    flightId: number; // Menangkap ID penerbangan dari halaman server
}

export default function SeatMapWrapper({ initialSeats, maxPassengers, flightId }: SeatMapWrapperProps) {
    const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
    const [passengers, setPassengers] = useState(
        Array.from({ length: maxPassengers }).map(() => ({ name: "", nik: "", gender: "" }))
    );
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const selectedSeats = useMemo(() => {
        return selectedSeatIds.map((id) => initialSeats.find((seat) => seat.id === id)).filter(Boolean) as Seat[];
    }, [initialSeats, selectedSeatIds]);

    const handleSelectionChange = (ids: number[]) => {
        setSelectedSeatIds(ids);
        console.log("State kursi tersimpan di Client:", ids);
    };

    const updatePassenger = (index: number, field: "name" | "nik" | "gender", value: string) => {
        setPassengers((current) =>
            current.map((passenger, passengerIndex) =>
                passengerIndex === index ? { ...passenger, [field]: value } : passenger
            )
        );
    };

    const handleBookingSubmit = async () => {
        if (selectedSeatIds.length !== maxPassengers) return;

        const selectedPassengers = passengers.slice(0, maxPassengers);
        const isPassengerDataComplete = selectedPassengers.every((passenger) => {
            return passenger.name.trim() && /^\d{8,20}$/.test(passenger.nik.trim()) && ["MALE", "FEMALE"].includes(passenger.gender);
        });

        if (!isPassengerDataComplete) {
            alert("Lengkapi nama, NIK, dan gender untuk semua penumpang.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flightId: flightId,
                    seatIds: selectedSeatIds,
                    passengersCount: maxPassengers,
                    passengers: selectedPassengers,
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

            {selectedSeatIds.length > 0 && (
                <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm max-w-xl mx-auto">
                    <div className="mb-3">
                        <h3 className="font-bold text-slate-900 text-sm">Data Penumpang</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Isi sesuai identitas untuk manifest staff.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {selectedSeats.map((seat, index) => (
                            <div key={seat.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Penumpang {index + 1}</span>
                                    <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[9px] font-black text-white">{seat.seatNumber}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                    <input
                                        value={passengers[index]?.name || ""}
                                        onChange={(event) => updatePassenger(index, "name", event.target.value)}
                                        placeholder="Nama lengkap"
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-900 outline-none focus:border-indigo-400"
                                    />
                                    <input
                                        value={passengers[index]?.nik || ""}
                                        onChange={(event) => updatePassenger(index, "nik", event.target.value.replace(/\D/g, ""))}
                                        placeholder="NIK"
                                        inputMode="numeric"
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-900 outline-none focus:border-indigo-400"
                                    />
                                    <select
                                        value={passengers[index]?.gender || ""}
                                        onChange={(event) => updatePassenger(index, "gender", event.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400"
                                    >
                                        <option value="">Gender</option>
                                        <option value="MALE">Laki-laki</option>
                                        <option value="FEMALE">Perempuan</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
