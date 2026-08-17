"use client";

import { useState } from "react";
import {
  createBroadcastAction,
  toggleBroadcastAction,
} from "@/modules/superadmin/broadcast-actions";
import {
  Radio,
  Plus,
  Bell,
  AlertTriangle,
  Info,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export function AdminBroadcastClient({
  initialMessages,
}: {
  initialMessages: any[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form input state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("INFO");

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await createBroadcastAction({
        title,
        content,
        type,
      });

      setShowAddModal(false);
      setTitle("");
      setContent("");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal membuat pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleBroadcastAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status broadcast.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Admin Broadcast */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin"
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Super Admin
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-600 animate-pulse" />
            Sistem Broadcast & Pengumuman SaaS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kirim pengumuman pemeliharaan sistem, info promo, atau fitur baru langsung ke dashboard seluruh tenant.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            Histori Pengumuman Terkirim
          </h3>
          <span className="text-xs text-slate-500">
            {messages.length} pengumuman
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Judul & Isi Pengumuman</th>
                <th className="py-3 px-4">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Status Tampil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {messages.length > 0 ? (
                messages.map((m: any) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          m.type === "MAINTENANCE"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                            : m.type === "PROMO"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {m.title}
                      </div>
                      <p className="text-slate-500 mt-0.5 max-w-xl">
                        {m.content}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggle(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 ${
                          m.isActive
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                        }`}
                      >
                        {m.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Mati</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    Belum ada pengumuman yang dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Broadcast */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-indigo-600" /> Buat Pengumuman Broadcast
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tipe Pengumuman</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="INFO">INFORMASI SISTEM (INFO)</option>
                  <option value="PROMO">PROMO & FITUR BARU</option>
                  <option value="MAINTENANCE">JADWAL PEMELIHARAAN (MAINTENANCE)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan Server POS Malam Ini"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Isi Pesan Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contoh: Sistem POS akan menjalani pembaruan rutin pada pukul 23:00 - 00:00 WIB. Selama waktu tersebut layanan transaksi offline tetap dapat digunakan."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Radio className="w-3.5 h-3.5" />
                  )}
                  Kirim Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
