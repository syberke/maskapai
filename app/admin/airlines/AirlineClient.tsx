// app/admin/airlines/AirlineClient.tsx
"use client";

import { useState } from "react";
import { createAirline, updateAirline, deleteAirline } from "./actions";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

interface Airline {
  id: number;
  name: string;
  code: string;
  logoUrl: string | null;
}

export default function AirlineClient({ initialAirlines }: { initialAirlines: Airline[] }) {
  const [airlines, setAirlines] = useState<Airline[]>(initialAirlines);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", logoUrl: "" });

  const resetForm = () => { setForm({ name: "", code: "", logoUrl: "" }); setShowForm(false); setEditId(null); };

  const handleSubmit = async () => {
    if (!form.name || !form.code) { alert("Nama dan kode maskapai wajib diisi."); return; }
    setLoading(true);
    try {
      if (editId !== null) {
        const result = await updateAirline(editId, form);
        if (!result.success) { alert(result.error === "KODE_ALREADY_EXISTS" ? "Kode maskapai sudah digunakan!" : result.error); setLoading(false); return; }
        setAirlines(prev => prev.map(a => a.id === editId ? { ...a, ...form, code: form.code.toUpperCase() } : a));
      } else {
        const result = await createAirline(form);
        if (!result.success) { alert(result.error === "KODE_ALREADY_EXISTS" ? "Kode maskapai sudah digunakan!" : result.error); setLoading(false); return; }
        window.location.reload();
      }
      resetForm();
    } catch { alert("Gagal menyimpan data."); } finally { setLoading(false); }
  };

  const handleEdit = (airline: Airline) => {
    setEditId(airline.id);
    setForm({ name: airline.name, code: airline.code, logoUrl: airline.logoUrl || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus maskapai ini? Semua pesawat dan penerbangan terkait juga akan terhapus.")) return;
    setLoading(true);
    try {
      const result = await deleteAirline(id);
      if (result.success) setAirlines(prev => prev.filter(a => a.id !== id));
      else alert(result.error || "Gagal menghapus.");
    } catch { alert("Gagal menghapus."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Maskapai</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Kelola data maskapai penerbangan komersial.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Tambah Maskapai
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">{editId ? "Edit Maskapai" : "Tambah Maskapai Baru"}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Nama Maskapai</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Renggo Air" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Kode IATA</label>
              <input type="text" maxLength={5} value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                placeholder="RG" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Logo URL (Opsional)</label>
              <input type="text" value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})}
                placeholder="/logos/renggo.png" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[10px] font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editId ? "Simpan Perubahan" : "Tambahkan"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-3.5">Kode</th>
                <th className="px-6 py-3.5">Nama Maskapai</th>
                <th className="px-6 py-3.5">Logo URL</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
              {airlines.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">Belum ada data maskapai.</td></tr>
              ) : (
                airlines.map(airline => (
                  <tr key={airline.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5"><span className="bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{airline.code}</span></td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{airline.name}</td>
                    <td className="px-6 py-3.5 text-slate-400 truncate max-w-[200px]">{airline.logoUrl || "-"}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEdit(airline)} className="p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors cursor-pointer"><Pencil className="w-3 h-3 text-amber-600" /></button>
                        <button onClick={() => handleDelete(airline.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors cursor-pointer"><Trash2 className="w-3 h-3 text-rose-600" /></button>
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
