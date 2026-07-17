"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SeatMap from "./SeatMaps";
import {
    isPassengerGender,
    type PassengerGender,
} from "@/lib/passengerManifest";

type Seat = {
    id: number;
    seatNumber: string;
    seatClass: "ECONOMY" | "BUSINESS" | "FIRST_CLASS";
    isAvailable: boolean;
};

type PassengerDraft = {
    name: string;
    nik: string;
    gender: "" | PassengerGender;
};

interface SeatMapWrapperProps {
    initialSeats: Seat[];
    maxPassengers: number;
    flightId: number;
}

const emptyPassenger = (): PassengerDraft => ({ name: "", nik: "", gender: "" });

export default function SeatMapWrapper({ initialSeats, maxPassengers, flightId }: SeatMapWrapperProps) {
    const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
    const [passengersBySeatId, setPassengersBySeatId] = useState<Record<number, PassengerDraft>>({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const selectedSeats = useMemo(() => {
        return selectedSeatIds
            .map((id) => initialSeats.find((seat) => seat.id === id))
            .filter(Boolean)
            .sort((left, right) =>
                (left as Seat).seatNumber.localeCompare((right as Seat).seatNumber, "id", {
                    numeric: true,
                }),
            ) as Seat[];
    }, [initialSeats, selectedSeatIds]);

    const handleSelectionChange = (ids: number[]) => {
        setSelectedSeatIds(ids);
        setPassengersBySeatId((current) => {
            const next: Record<number, PassengerDraft> = {};

            ids.forEach((seatId) => {
                next[seatId] = current[seatId] ?? emptyPassenger();
            });

            return next;
        });
    };

    const updatePassenger = (
        seatId: number,
        field: keyof PassengerDraft,
        value: string,
    ) => {
        setPassengersBySeatId((current) => ({
            ...current,
            [seatId]: {
                ...(current[seatId] ?? emptyPassenger()),
                [field]: value,
            },
        }));
    };

    const handleBookingSubmit = async () => {
        if (selectedSeats.length !== maxPassengers) {
            alert(`Pilih tepat ${maxPassengers} kursi untuk ${maxPassengers} penumpang.`);
            return;
        }

        const passengerManifest = selectedSeats.map((seat) => {
            const passenger = passengersBySeatId[seat.id] ?? emptyPassenger();

            return {
                seatId: seat.id,
                name: passenger.name.trim(),
                nik: passenger.nik.trim(),
                gender: passenger.gender,
            };
        });

        const isPassengerDataComplete = passengerManifest.every((passenger) => {
            return (
                passenger.name.length >= 2 &&
                /^\d{8,20}$/.test(passenger.nik) &&
                isPassengerGender(passenger.gender)
            );
        });

        if (!isPassengerDataComplete) {
            alert("Lengkapi nama, NIK 8-20 digit, dan gender untuk semua penumpang.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flightId,
                    seatIds: selectedSeats.map((seat) => seat.id),
                    passengersCount: maxPassengers,
                    passengers: passengerManifest,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Gagal mengunci kursi.");
                if (response.status === 409) router.refresh();
                return;
            }

            router.push(`/bookings/${data.bookingId}/checkout`);
        } catch (error) {
            console.error(error);
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

            {selectedSeats.length > 0 && (
                <div className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-slate-900">Data Penumpang</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                            Setiap identitas terikat langsung ke nomor kursi untuk manifest staf.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {selectedSeats.map((seat, index) => {
                            const passenger = passengersBySeatId[seat.id] ?? emptyPassenger();

                            return (
                                <div key={seat.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                            Penumpang {index + 1}
                                        </span>
                                        <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[9px] font-black text-white">
                                            Kursi {seat.seatNumber}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        <input
                                            value={passenger.name}
                                            onChange={(event) => updatePassenger(seat.id, "name", event.target.value)}
                                            placeholder="Nama lengkap"
                                            autoComplete="name"
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-900 outline-none focus:border-indigo-400"
                                        />
                                        <input
                                            value={passenger.nik}
                                            onChange={(event) =>
                                                updatePassenger(seat.id, "nik", event.target.value.replace(/\D/g, "").slice(0, 20))
                                            }
                                            placeholder="NIK 8-20 digit"
                                            inputMode="numeric"
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-900 outline-none focus:border-indigo-400"
                                        />
                                        <select
                                            value={passenger.gender}
                                            onChange={(event) => updatePassenger(seat.id, "gender", event.target.value)}
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400"
                                        >
                                            <option value="">Pilih gender</option>
                                            <option value="MALE">Laki-laki</option>
                                            <option value="FEMALE">Perempuan</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedSeats.length === maxPassengers && (
                <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleBookingSubmit}
                    className={`w-full rounded-lg bg-slate-950 py-2 text-[11px] font-bold text-white shadow-md transition-all hover:bg-slate-900 active:scale-[0.99] ${
                        isLoading ? "cursor-not-allowed opacity-60" : ""
                    }`}
                >
                    {isLoading ? "Menyimpan Manifest & Mengunci Kursi..." : "Konfirmasi Data & Lanjut Pembayaran"}
                </button>
            )}
        </div>
    );
}
