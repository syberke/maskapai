"use client";

import { useState, useMemo } from "react";
import { createUser, updateUser, deleteUser } from "./actions";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
};

interface UserClientProps {
  users: UserData[];
  currentUserId: number;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  STAFF: "bg-sky-100 text-sky-700 border-sky-200",
  MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
  USER: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function UserClient({ users, currentUserId }: UserClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openAdd = () => {
    setEditUser(null);
    setShowModal(true);
  };

  const openEdit = (user: UserData) => {
    setEditUser(user);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Manajemen Pengguna</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Kelola semua akun pengguna sistem.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-indigo-700"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Pengguna
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none focus:border-indigo-400"
        >
          <option value="ALL">Semua Role</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="USER">User</option>
        </select>
        <span className="text-[10px] font-bold text-slate-400">{filtered.length} dari {users.length} pengguna</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Verifikasi</th>
              <th className="px-4 py-3">Dibuat</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Tidak ada pengguna ditemukan.</td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-black text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${roleColors[user.role] || roleColors.USER}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isVerified ? (
                      <span className="text-emerald-600 font-black">✓ Terverifikasi</span>
                    ) : (
                      <span className="text-amber-600 font-black">✗ Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={user.id} />
                        <button
                          disabled={user.id === currentUserId}
                          className={`rounded-lg px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider ${
                            user.id === currentUserId
                              ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          }`}
                          title={user.id === currentUserId ? "Tidak dapat menghapus diri sendiri" : "Hapus pengguna"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH/EDIT */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black tracking-tight text-slate-900">
                {editUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={editUser ? updateUser : createUser} className="flex flex-col gap-3">
              {editUser && <input type="hidden" name="id" value={editUser.id} />}

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Nama</label>
                <input
                  name="name"
                  defaultValue={editUser?.name || ""}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editUser?.email || ""}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Password {editUser ? "(kosongkan jika tidak diubah)" : ""}
                </label>
                <input
                  name="password"
                  type="password"
                  required={!editUser}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Role</label>
                <select
                  name="role"
                  defaultValue={editUser?.role || "USER"}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option value="USER">USER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="mt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-indigo-700"
                >
                  {editUser ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}