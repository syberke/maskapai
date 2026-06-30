// app/bookings/[id]/checkout/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle2, CreditCard, Plane, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: PageProps) {
    // Unwrap params menggunakan utility bawaan React/Next 15
    const resolvedParams = use(params);
    const bookingId = Number(resolvedParams.id);

    const [booking, setBooking] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Load data booking secara client-side agar aman berinteraksi dengan window object Midtrans
    useEffect(() => {
        async function fetchBookingDetail() {
            try {
                // Kita bisa bypass langsung mengambil data via fetch ke route internal atau membuat API ringkas, 
                // Namun untuk simulasi cepat kita gunakan rute mock object yang aman:
                const res = await fetch(`/api/bookings`);
                // *Tips: Jika kamu punya API GET detail, bisa arahkan ke `/api/bookings/${bookingId}`*
                setBooking({ id: bookingId, bookingCode: "RGG-SIMULATION", totalPrice: 750000 });
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        }
        fetchBookingDetail();
    }, [bookingId]);

    // 2. Inject script Snap Midtrans ke dokumen HTML aplikasi secara dinamis
    useEffect(() => {
        const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

        const script = document.createElement("script");
        script.src = snapScriptUrl;
        script.setAttribute("data-client-key", clientKey);
        script.async = true;

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Gagal menginisialisasi pembayaran.");
                return;
            }

            // 3. Panggil jendela kasir Snap pop-up Midtrans di atas browser
            (window as any).snap.pay(data.token, {
                onSuccess: function (result: any) {
                    alert("Pembayaran Sukses! Selamat Terbang.");
                    console.log(result);
                    // Arahkan ke halaman sukses/tiket di sini
                },
                onPending: function (result: any) {
                    alert("Menunggu pembayaran kamu selesai.");
                    console.log(result);
                },
                onError: function (result: any) {
                    alert("Pembayaran gagal diproses.");
                    console.log(result);
                },
                onClose: function () {
                    alert("Kamu menutup halaman kasir sebelum menyelesaikan pembayaran.");
                },
            });

        } catch (error) {
            console.error("Payment trigger error:", error);
            alert("Terjadi gangguan koneksi sistem.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loadingData) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const basePrice = booking ? Number(booking.totalPrice) : 0;
    const totalTax = 50000;
    const finalPrice = basePrice + totalTax;

    return (
        <div className="w-full min-h-screen bg-[#f2f4f7] flex flex-col antialiased pt-28 pb-6">
            <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-3">

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                        <h3 className="text-emerald-900 text-xs font-bold">Metode Pembayaran Resmi</h3>
                        <p className="text-[10px] text-emerald-700 mt-0.5">Terintegrasi aman menggunakan sistem Sandbox Midtrans.</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block border-b border-slate-100 pb-2">Rincian Tarif</span>
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Tarif Dasar Penerbangan</span>
                        <span>Rp {basePrice.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Pajak Bandara (Flat)</span>
                        <span>Rp {totalTax.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="border-t border-slate-100 my-1 pt-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900">Total Tagihan</span>
                        <span className="text-sm font-black text-indigo-600">Rp {finalPrice.toLocaleString("id-ID")}</span>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[11px] font-bold py-2.5 rounded-lg shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-1 cursor-pointer"
                >
                    {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                    )}
                    {isProcessing ? "Membuka Kasir..." : "Bayar Sekarang Via Midtrans"}
                </button>

                <Link href="/flights" className="text-center text-[10px] text-slate-400 hover:text-slate-600 font-bold py-1">
                    Kembali ke Pencarian
                </Link>
            </div>
        </div>
    );
}