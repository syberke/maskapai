// app/admin/airports/AirportClient.tsx
"use client";

import { useState } from "react";
import { createAirport, updateAirport, deleteAirport } from "./actions";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

interface Airport {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
}

export default function AirportClient({ initialAirports }: { initialAirports: Airport[] }) {
  const [airports, setAirports] = useState<Airport[]>(initialAirports);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ code: "", name: "", city: "", country: "Indonesia" });

  const resetForm = () => {
    setForm({ code: "", name: "", city: "", country: "Indonesia" });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.city || !form.country) {
      alert("Semua kolom wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      if (editId !== null) {
        const result = await updateAirport(editId, form);
        if (!result.success) {
          alert(result.error === "KODE_ALREADY_EXISTS" ? "Kode bandara sudah digunakan!" : result.error);
          setLoading(false);
          return;
        }
        setAirports(prev => prev.map(a => a.id === editId ? { ...a, ...form, code: form.code.toUpperCase() } : a));
      } else {
        const result = await createAirport(form);
        if (!result.success) {
          alert(result.error === "KODE_ALREADY_EXISTS" ? "Kode bandara sudah digunakan!" : result.error);
          setLoading(false);
          return;
        }
        // Reload to get new ID
        window.location.reload();
      }
      resetForm();
    } catch {
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (airport: Airport) => {
    setEditId(airport.id);
    setForm({ code: airport.code, name: airport.name, city: airport.city, country: airport.country });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus bandara ini? Semua data penerbangan terkait juga akan terhapus.")) return;
    setLoading(true);
    try {
      const result = await deleteAirport(id);
      if (result.success) {
        setAirports(prev => prev.filter(a => a.id !== id));
      } else {
        alert(result.error || "Gagal menghapus.");
      }
    } catch {
      alert("Gagal menghapus data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Bandara</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Kelola data bandara asal dan tujuan penerbangan.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Bandara
        </button>
      </div>

      {/* FORM ADD/EDIT */}
      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
              {editId ? "Edit Bandara" : "Tambah Bandara Baru"}
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Kode IATA</label>
              <input type="text" maxLength={5} value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                placeholder="CGK" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Nama Bandara</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Soekarno-Hatta" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Kota</label>
              <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                placeholder="Jakarta" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Negara</label>
              <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})}
                placeholder="Indonesia" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[10px] font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {editId ? "Simpan Perubahan" : "Tambahkan"}
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-3.5">Kode</th>
                <th className="px-6 py-3.5">Nama Bandara</th>
                <th className="px-6 py-3.5">Kota</th>
                <th className="px-6 py-3.5">Negara</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
              {airports.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">Belum ada data bandara.</td></tr>
              ) : (
                airports.map(airport => (
                  <tr key={airport.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="bg-slate-950 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{airport.code}</span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{airport.name}</td>
                    <td className="px-6 py-3.5">{airport.city}</td>
                    <td className="px-6 py-3.5">{airport.country}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(airport)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors cursor-pointer">
                          <Pencil className="w-3 h-3 text-amber-600" />
                        </button>
                        <button onClick={() => handleDelete(airport.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors cursor-pointer">
                          <Trash2 className="w-3 h-3 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
