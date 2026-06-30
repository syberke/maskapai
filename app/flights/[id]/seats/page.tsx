// app/flights/[id]/seats/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { ArrowLeft, Plane } from "lucide-react";
import Link from "next/link";
import SeatMapWrapper from "../../../components/SeatMapWrapper";

const prisma = new PrismaClient();

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ class?: string; passengers?: string; from?: string; to?: string; date?: string }>;
}

export default async function FlightSeatsPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const flightId = Number(resolvedParams.id);
    const seatClass = resolvedSearchParams.class || "ECONOMY";
    const passengers = Number(resolvedSearchParams.passengers) || 1;

    // Ambil data murni dari server database
    const flight = await prisma.flight.findUnique({
        where: { id: flightId },
        include: {
            departureAirport: true,
            arrivalAirport: true,
            plane: { include: { airline: true } },
            flightSeats: {
                where: { seatClass: seatClass as any },
                orderBy: { seatNumber: "asc" },
            },
        },
    });

    if (!flight) {
        notFound();
    }

    const backUrl = `/flights?from=${resolvedSearchParams.from || flight.departureAirport.code}&to=${resolvedSearchParams.to || flight.arrivalAirport.code}&date=${resolvedSearchParams.date || flight.departureTime.toString().split("T")[0]}&class=${seatClass}&passengers=${passengers}`;

    // Mapping data bersih untuk dikirim ke Client Component
    const cleanSeats = flight.flightSeats.map(s => ({
        id: s.id,
        seatNumber: s.seatNumber,
        seatClass: s.seatClass as any,
        isAvailable: s.isAvailable
    }));

    return (
        <div className="w-full min-h-screen bg-[#f2f4f7] flex flex-col antialiased">

            {/* ================= HEADER ENGINE (SOLID - ANTI TRANSPARANT) ================= */}
            {/* pt-16 agar mepet pas di bawah navbar, bg-[#f2f4f7] murni tebal tanpa alpha transparan */}
            <div className="w-full pt-16 pb-2 sticky top-0 z-50 bg-[#f2f4f7] border-b border-slate-200/40 shadow-xs">
                <div className="w-full max-w-xl mx-auto px-4">

                    {/* CONTROL BAR RINGKASAN */}
                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200/60 shadow-xs">
                        <Link href={backUrl} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-700">
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>

                        <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs tracking-tight">
                                <span>{flight.departureAirport.code}</span>
                                <Plane className="w-3 h-3 text-slate-400" />
                                <span>{flight.arrivalAirport.code}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">
                                    {seatClass}
                                </span>
                                <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200/40">
                                    {passengers} Pax
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ================= MAIN CONTENT ENGINE ================= */}
            {/* py-1 dan mt-0 menghilangkan jeda hampa di tengah layout */}
            <div className="w-full max-w-xl mx-auto px-4 py-1 flex flex-col gap-2 flex-1 mt-0">
                <SeatMapWrapper initialSeats={cleanSeats} maxPassengers={passengers} flightId={flightId} />      </div>

        </div>
    );
}