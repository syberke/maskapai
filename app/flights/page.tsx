// app/flights/page.tsx
import { PrismaClient } from "@prisma/client";
import FlightCard from "../components/FlightCard";
import SearchForm from "../components/SearchForm";
import { AlertCircle, Search, SlidersHorizontal, ArrowRight } from "lucide-react";

const prisma = new PrismaClient();

async function getAirports() {
    return await prisma.airport.findMany({
        select: { id: true, code: true, name: true, city: true },
        orderBy: { city: "asc" },
    });
}

export default async function FlightsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedSearchParams = await searchParams;

    const from = (resolvedSearchParams.from as string) || "";
    const to = (resolvedSearchParams.to as string) || "";
    const date = (resolvedSearchParams.date as string) || "";
    const seatClass = (resolvedSearchParams.class as string) || "ECONOMY";
    const passengers = Number(resolvedSearchParams.passengers) || 1;

    const airports = await getAirports();

    const isValidDate = date && !isNaN(new Date(date).getTime());
    const isSearchParamComplete = from && to && isValidDate;

    let flights: any[] = [];

    if (isSearchParamComplete) {
        flights = await prisma.flight.findMany({
            where: {
                departureAirport: { code: from },
                arrivalAirport: { code: to },
                departureTime: {
                    gte: new Date(`${date}T00:00:00.000Z`),
                    lte: new Date(`${date}T23:59:59.999Z`),
                },
            },
            include: {
                departureAirport: true,
                arrivalAirport: true,
                plane: { include: { airline: true } },
                flightSeats: {
                    where: { seatClass: seatClass as any, isAvailable: true },
                },
            },
            orderBy: { departureTime: "asc" },
        });
    }

    const formattedDate = isValidDate
        ? new Date(date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
        : "";

    return (
        <div className="w-full min-h-screen bg-[#f2f4f7] flex flex-col antialiased">

            {/* ================= SEARCH COCKPIT SECTION ================= */}
            {/* 🎯 FIX: pt-16 (diperkecil agar nempel navbar) dan pb-2 (mempersempit jarak bawah form) */}
            <div className="w-full pt-16 pb-2 sticky top-0 z-40 bg-[#f2f4f7]/95 backdrop-blur-xs">
                <div className="w-full max-w-5xl mx-auto px-4">
                    <SearchForm airports={airports} isHome={false} />
                </div>
            </div>

            {/* ================= MAIN RESULTS ENGINE ================= */}
            {/* 🎯 FIX: py-1 dan mt-0 menghilangkan gap kosong di tengah, max-w-4xl bikin card lebih pendek/tidak kepanjangan */}
            <div className="w-full max-w-4xl mx-auto px-4 py-1 flex flex-col gap-2 flex-1 mt-0">

                {!isSearchParamComplete ? (
                    <div className="bg-white border border-slate-200/60 rounded-xl p-8 text-center shadow-xs max-w-2xl mx-auto w-full mt-2">
                        <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                            <Search className="text-slate-400 h-4 w-4" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-xs tracking-tight">Tentukan Rute Keberangkatan</h3>
                    </div>
                ) : (
                    <>
                        {/* UTILITY CONTROL BAR */}
                        {/* 🎯 FIX: py-2 dan px-3 untuk mengecilkan background si control bar jadwal */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200/60 shadow-xs">
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] font-medium text-slate-600">
                                <span className="flex items-center gap-1 font-bold text-slate-900 text-xs tracking-tight bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                                    {from} <ArrowRight className="h-2.5 w-2.5 text-slate-400" /> {to}
                                </span>
                                <span className="text-slate-200 hidden sm:inline">|</span>
                                <span className="text-slate-600 font-semibold">{formattedDate}</span>
                                <span className="text-slate-200">|</span>
                                <div className="flex items-center gap-1">
                                    <span className="bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">
                                        {seatClass}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Menampilkan <span className="text-slate-900 font-black text-xs">{flights.length}</span> Opsi
                            </div>
                        </div>

                        {/* FLIGHT CARDS PIPELINE */}
                        {flights.length > 0 ? (
                            // 🎯 FIX: gap-2 agar jarak antar kartu tiket mepet dan padat
                            <div className="flex flex-col gap-2">
                                {flights.map((flight) => (
                                    <FlightCard
                                        key={flight.id}
                                        flight={{
                                            ...flight,
                                            plane: {
                                                model: flight.plane.name,
                                                airline: flight.plane.airline
                                            }
                                        }}
                                        seatClass={seatClass}
                                        passengers={passengers}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* STATE 3: NO RESULTS FOUND */
                            // 🎯 FIX: p-8 mengecilkan background box saat zonk
                            <div className="bg-white border border-slate-200/60 rounded-xl p-8 text-center shadow-xs w-full max-w-xl mx-auto mt-2">
                                <div className="bg-rose-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-100/50">
                                    <AlertCircle className="text-rose-500 h-4 w-4" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-xs tracking-tight">Penerbangan Tidak Ditemukan</h3>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}