// app/dashboard/bookings/BookingAction.tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronRight, QrCode, RefreshCw, Trash2, X } from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";

interface BookingActionProps {
    bookingId: number;
    initialStatus: string;
    initialPaymentStatus: string;
    bookingCode: string;
}

export default function BookingAction({ bookingId, initialStatus, initialPaymentStatus, bookingCode }: BookingActionProps) {
    const [status, setStatus] = useState(initialStatus);
    const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Bersihkan query notifikasi setelah dashboard menampilkan banner server-side.
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const paymentParam = queryParams.get("payment");

        if (paymentParam) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleCheckStatus = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/bookings/check-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || data.error || "Gagal mengecek status booking.");
                return;
            }

            if (data.status === "CONFIRMED") {
                setStatus("CONFIRMED");
                window.location.reload();
            } else if (data.paymentStatus === "PAID") {
                setPaymentStatus("PAID");
                alert(data.message || "Pembayaran diterima. Menunggu konfirmasi staff.");
            } else {
                alert(data.message || "Belum dibayar nih, silakan bayar dulu.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!confirm("Hapus booking ini? Kursi akan tersedia kembali untuk dipesan.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/bookings?id=${bookingId}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menghapus booking.");
                return;
            }

            window.location.reload();
        } catch (err) {
            console.error(err);
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
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                >
                    <QrCode className="w-3 h-3" /> Boarding Pass
                </button>

                {/* MODAL MENGGUNAKAN FIXED DI ATAS LAYAR */}
                {showModal && (
                    <div
                        onClick={() => setShowModal(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 text-slate-900"
                        style={{ zIndex: 9999 }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl border border-slate-100"
                        >
                            {/* Tombol Tutup X */}
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5 stroke-[2.5]" />
                            </button>

                            <h3 className="text-lg font-black tracking-tight mb-1 mt-2">Boarding Pass Digital</h3>
                            <p className="text-xs text-slate-400 mb-6 font-medium">Tunjukkan QR Code ini ke petugas bandara.</p>

                            <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-100 mb-4">
                                <QRCode
                                    value={`RENGGO-MANIFEST-${bookingCode || 'NO-CODE'}`}
                                    size={180}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                />
                            </div>

                            <div className="text-sm font-mono font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 py-2 rounded-xl border border-indigo-100/50">
                                KODE: {bookingCode || 'N/A'}
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
                <div className="flex flex-col gap-1.5">
                    <div className="w-full text-center bg-sky-500/15 text-sky-200 border border-sky-400/20 text-[9px] font-black py-1.5 px-3 rounded-lg uppercase tracking-wider">
                        Menunggu Staff
                    </div>
                    <button
                        onClick={handleCheckStatus}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider text-center disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`} />
                        {isLoading ? "Checking..." : "Cek Konfirmasi"}
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1.5">
                <Link
                    href={`/bookings/${bookingId}/checkout`}
                    className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-indigo-300 text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider text-center"
                >
                    Bayar <ChevronRight className="w-3 h-3" />
                </Link>

                <button
                    onClick={handleCheckStatus}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider text-center disabled:opacity-50 cursor-pointer"
                >
                    <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Checking..." : "Cek Status"}
                </button>

                <button
                    onClick={handleDeleteBooking}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-[9px] font-black py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider text-center disabled:opacity-50 cursor-pointer"
                >
                    <Trash2 className="w-2.5 h-2.5" />
                    {isDeleting ? "Menghapus..." : "Hapus"}
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
