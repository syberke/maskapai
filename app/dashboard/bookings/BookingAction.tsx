// app/dashboard/bookings/BookingAction.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Loader2, QrCode, Trash2, X } from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { passengerGenderLabel } from "@/lib/passengerManifest";

interface BookingActionProps {
    bookingId: number;
    initialStatus: string;
    initialPaymentStatus: string;
    bookingCode: string;
    initialIsBoarded?: boolean;
}

type ManifestSeat = {
    id: number;
    passengerName: string;
    passengerNik: string;
    passengerGender: string;
    flightSeat: {
        seatNumber: string;
        seatClass: string;
    };
};

type BookingDetailResponse = {
    bookingSeats?: ManifestSeat[];
};

export default function BookingAction({
    bookingId,
    initialStatus,
    initialPaymentStatus,
    bookingCode,
    initialIsBoarded = false,
}: BookingActionProps) {
    const [status] = useState(initialStatus);
    const [paymentStatus] = useState(initialPaymentStatus);
    const [isBoarded] = useState(initialIsBoarded);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [manifest, setManifest] = useState<ManifestSeat[]>([]);
    const [manifestLoading, setManifestLoading] = useState(false);
    const [manifestError, setManifestError] = useState("");

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get("payment")) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (!showModal || manifest.length > 0 || manifestLoading) return;

        async function loadManifest() {
            setManifestLoading(true);
            setManifestError("");

            try {
                const response = await fetch(`/api/bookings?id=${bookingId}`, {
                    cache: "no-store",
                });
                const data = (await response.json()) as BookingDetailResponse & { message?: string };

                if (!response.ok) {
                    setManifestError(data.message || "Manifest gagal dimuat.");
                    return;
                }

                setManifest(Array.isArray(data.bookingSeats) ? data.bookingSeats : []);
            } catch (error) {
                console.error(error);
                setManifestError("Koneksi gagal saat memuat manifest penumpang.");
            } finally {
                setManifestLoading(false);
            }
        }

        loadManifest();
    }, [bookingId, manifest.length, manifestLoading, showModal]);

    const handleDeleteBooking = async () => {
        if (!confirm("Hapus booking ini? Kursi akan tersedia kembali untuk dipesan.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/bookings?id=${bookingId}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menghapus booking.");
                return;
            }

            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Koneksi bermasalah saat menghapus booking.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (status === "CONFIRMED") {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white transition-colors hover:bg-indigo-700"
                >
                    <QrCode className="h-3 w-3" /> Boarding Pass & Manifest
                </button>

                {showModal && (
                    <div
                        onClick={() => setShowModal(false)}
                        className="fixed inset-0 flex items-center justify-center bg-slate-900/60 p-4 text-slate-900 backdrop-blur-sm"
                        style={{ zIndex: 9999 }}
                    >
                        <div
                            onClick={(event) => event.stopPropagation()}
                            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl"
                        >
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5 stroke-[2.5]" />
                            </button>

                            <div className="text-center">
                                <h3 className="mt-2 text-lg font-black tracking-tight">Boarding Pass Digital</h3>
                                <p className="mb-5 text-xs font-medium text-slate-400">
                                    Satu kode booking dapat berisi beberapa identitas penumpang.
                                </p>

                                <div className="mb-4 inline-block rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <QRCode
                                        value={`RENGGO-MANIFEST-${bookingCode || "NO-CODE"}`}
                                        size={150}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                </div>

                                <div className="rounded-xl border border-indigo-100/50 bg-indigo-50 py-2 font-mono text-sm font-black uppercase tracking-widest text-indigo-600">
                                    KODE: {bookingCode || "N/A"}
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-left">
                                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                        Manifest Penumpang
                                    </span>
                                    <span className="text-[9px] font-black text-slate-600">
                                        {manifest.length} tiket
                                    </span>
                                </div>

                                {manifestLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-8 text-[10px] font-bold text-slate-400">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Memuat manifest
                                    </div>
                                ) : manifestError ? (
                                    <p className="rounded-lg bg-rose-50 px-3 py-4 text-center text-[10px] font-bold text-rose-700">
                                        {manifestError}
                                    </p>
                                ) : manifest.length === 0 ? (
                                    <p className="py-6 text-center text-[10px] font-bold text-slate-400">
                                        Manifest penumpang belum tersedia.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {manifest.map((passenger, index) => (
                                            <div key={passenger.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-900">
                                                            {index + 1}. {passenger.passengerName}
                                                        </p>
                                                        <p className="mt-1 text-[9px] font-medium text-slate-500">
                                                            NIK {passenger.passengerNik}
                                                        </p>
                                                        <p className="mt-0.5 text-[9px] font-bold text-sky-700">
                                                            {passengerGenderLabel(passenger.passengerGender)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="rounded-md bg-slate-950 px-2 py-1 text-[9px] font-black text-white">
                                                            {passenger.flightSeat.seatNumber}
                                                        </span>
                                                        <p className="mt-1 text-[8px] font-black uppercase text-slate-400">
                                                            {passenger.flightSeat.seatClass}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 text-center text-xs font-semibold text-slate-500">
                                {isBoarded ? (
                                    <span className="text-emerald-600">✓ Boarding Selesai</span>
                                ) : (
                                    <span className="text-indigo-600">⏳ Siap Boarding, tunjukkan QR ke petugas</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    if (status === "PENDING") {
        if (paymentStatus === "PAID") {
            return (
                <div className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-wider text-sky-700">
                    Menunggu Konfirmasi Staff
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1.5">
                <Link
                    href={`/bookings/${bookingId}/checkout`}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-wider text-white transition-colors hover:bg-indigo-700"
                >
                    Bayar Sekarang <ChevronRight className="h-3 w-3" />
                </Link>

                <button
                    onClick={handleDeleteBooking}
                    disabled={isDeleting}
                    className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-wider text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                    <Trash2 className="h-2.5 w-2.5" />
                    {isDeleting ? "Menghapus..." : "Hapus"}
                </button>
            </div>
        );
    }

    return (
        <span className="block py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
            Tidak Aktif
        </span>
    );
}
