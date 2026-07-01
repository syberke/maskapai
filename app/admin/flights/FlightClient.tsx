"use client";

import { useMemo, useState } from "react";
import { createFlight, deleteFlight, FlightFormData, updateFlight } from "./actions";
import {
  CalendarClock,
  Loader2,
  Pencil,
  Plane,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Airport = {
  id: number;
  code: string;
  name: string;
  city: string;
};

type Airline = {
  id: number;
  name: string;
  code: string;
};

type Flight = {
  id: number;
  flightNumber: string;
  planeId: number;
  departureAirportId: number;
  arrivalAirportId: number;
  departureTime: string;
  arrivalTime: string;
  priceEconomy: string;
  priceBusiness: string;
  priceFirstClass: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  plane: {
    airline: Airline;
  };
  flightSeats: {
    isAvailable: boolean;
    seatClass: string;
  }[];
};

const emptyForm = {
  flightNumber: "",
  airlineId: 0,
  departureAirportId: 0,
  arrivalAirportId: 0,
  departureTime: "",
  arrivalTime: "",
  priceEconomy: "",
  priceBusiness: "",
  priceFirstClass: "",
};

const errorMessages: Record<string, string> = {
  FIELD_REQUIRED: "Semua kolom wajib diisi.",
  SAME_AIRPORT: "Bandara asal dan tujuan tidak boleh sama.",
  INVALID_TIME_RANGE: "Waktu tiba harus lebih akhir dari waktu berangkat.",
  INVALID_PRICE: "Harga setiap kelas harus lebih dari nol.",
  FLIGHT_NUMBER_EXISTS: "Nomor penerbangan sudah digunakan.",
  AIRLINE_NOT_FOUND: "Maskapai tidak ditemukan.",
  UNAUTHORIZED: "Sesi admin tidak valid. Silakan login ulang.",
};

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatCurrency(value: string | number) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlightClient({
  initialFlights,
  airports,
  airlines,
}: {
  initialFlights: Flight[];
  airports: Airport[];
  airlines: Airline[];
}) {
  const [flights, setFlights] = useState(initialFlights);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const flightStats = useMemo(() => {
    const activeSeats = flights.reduce(
      (total, flight) => total + flight.flightSeats.filter((seat) => seat.isAvailable).length,
      0
    );
    return { flightCount: flights.length, activeSeats };
  }, [flights]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const buildPayload = (): FlightFormData => ({
    flightNumber: form.flightNumber.trim(),
    airlineId: Number(form.airlineId),
    departureAirportId: Number(form.departureAirportId),
    arrivalAirportId: Number(form.arrivalAirportId),
    departureTime: form.departureTime,
    arrivalTime: form.arrivalTime,
    priceEconomy: Number(form.priceEconomy),
    priceBusiness: Number(form.priceBusiness),
    priceFirstClass: Number(form.priceFirstClass),
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = buildPayload();
      const result = editId ? await updateFlight(editId, payload) : await createFlight(payload);

      if (!result.success) {
        alert(errorMessages[result.error || ""] || result.error || "Gagal menyimpan jadwal.");
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      alert("Gagal menyimpan jadwal penerbangan.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (flight: Flight) => {
    setEditId(flight.id);
    setForm({
      flightNumber: flight.flightNumber,
      airlineId: flight.plane.airline.id,
      departureAirportId: flight.departureAirportId,
      arrivalAirportId: flight.arrivalAirportId,
      departureTime: toDatetimeLocal(flight.departureTime),
      arrivalTime: toDatetimeLocal(flight.arrivalTime),
      priceEconomy: String(Number(flight.priceEconomy)),
      priceBusiness: String(Number(flight.priceBusiness)),
      priceFirstClass: String(Number(flight.priceFirstClass)),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal penerbangan ini? Semua kursi dan booking terkait akan ikut terhapus.")) return;
    setLoading(true);
    try {
      const result = await deleteFlight(id);
      if (result.success) {
        setFlights((prev) => prev.filter((flight) => flight.id !== id));
      } else {
        alert(errorMessages[result.error || ""] || result.error || "Gagal menghapus jadwal.");
      }
    } catch {
      alert("Gagal menghapus jadwal penerbangan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Penerbangan</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Kelola jadwal, rute, maskapai, harga, dan kursi otomatis.</p>
        </div>
        <button
          onClick={() => {
            setForm({
              ...emptyForm,
              airlineId: airlines[0]?.id || 0,
              departureAirportId: airports[0]?.id || 0,
              arrivalAirportId: airports[1]?.id || airports[0]?.id || 0,
            });
            setEditId(null);
            setShowForm(true);
          }}
          className="flex w-fit items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Jadwal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Jadwal</span>
          <p className="text-2xl font-black text-slate-950 mt-1">{flightStats.flightCount}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kursi Tersedia</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{flightStats.activeSeats}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Maskapai Aktif</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{airlines.length}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
              {editId ? "Edit Jadwal Penerbangan" : "Tambah Jadwal Penerbangan"}
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nomor Penerbangan</span>
              <input
                value={form.flightNumber}
                onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
                placeholder="RG-204"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Maskapai</span>
              <select
                value={form.airlineId}
                onChange={(e) => setForm({ ...form, airlineId: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={0}>Pilih maskapai</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.code} - {airline.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bandara Asal</span>
              <select
                value={form.departureAirportId}
                onChange={(e) => setForm({ ...form, departureAirportId: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={0}>Pilih asal</option>
                {airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>
                    {airport.code} - {airport.city}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bandara Tujuan</span>
              <select
                value={form.arrivalAirportId}
                onChange={(e) => setForm({ ...form, arrivalAirportId: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value={0}>Pilih tujuan</option>
                {airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>
                    {airport.code} - {airport.city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <label className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Berangkat</span>
              <input
                type="datetime-local"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tiba</span>
              <input
                type="datetime-local"
                value={form.arrivalTime}
                onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            {[
              ["priceEconomy", "Harga Economy"],
              ["priceBusiness", "Harga Business"],
              ["priceFirstClass", "Harga First"],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                <input
                  type="number"
                  min={1}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="1250000"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || airlines.length === 0 || airports.length < 2}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[10px] font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editId ? "Simpan Perubahan" : "Tambahkan Jadwal"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-3.5">Penerbangan</th>
                <th className="px-6 py-3.5">Rute</th>
                <th className="px-6 py-3.5">Jadwal</th>
                <th className="px-6 py-3.5">Harga</th>
                <th className="px-6 py-3.5">Kursi</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
              {flights.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                    Belum ada jadwal penerbangan.
                  </td>
                </tr>
              ) : (
                flights.map((flight) => {
                  const availableSeats = flight.flightSeats.filter((seat) => seat.isAvailable).length;
                  return (
                    <tr key={flight.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Plane className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-black text-slate-950 uppercase">{flight.flightNumber}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{flight.plane.airline.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-black text-slate-950">{flight.departureAirport.code}</span>
                        <span className="mx-1.5 text-slate-300">-</span>
                        <span className="font-black text-slate-950">{flight.arrivalAirport.code}</span>
                        <p className="text-[8px] text-slate-400 mt-0.5">
                          {flight.departureAirport.city} ke {flight.arrivalAirport.city}
                        </p>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-900">{formatDateTime(flight.departureTime)}</p>
                            <p className="text-[8px] text-slate-400">Tiba {formatDateTime(flight.arrivalTime)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-black text-slate-950">{formatCurrency(flight.priceEconomy)}</p>
                        <p className="text-[8px] text-slate-400">Business {formatCurrency(flight.priceBusiness)}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600">
                          {availableSeats} tersedia
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(flight)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-amber-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(flight.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
