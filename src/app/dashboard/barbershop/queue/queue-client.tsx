"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import {
  createQueueBookingAction,
  updateBookingStatusAction,
  BookingStatusType,
} from "@/plugins/barbershop/actions";
import {
  Scissors,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Check,
  X,
  Phone,
  Armchair,
  Sparkles,
  Layers,
  ArrowRight,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export function BarbershopQueueClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form input state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [barberId, setBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [chairNumber, setChairNumber] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setLoading(true);
    try {
      await createQueueBookingAction({
        outletId: data.currentOutletId,
        customerName,
        customerPhone,
        barberId: barberId || undefined,
        serviceId: serviceId || undefined,
        chairNumber: chairNumber ? Number(chairNumber) : undefined,
        notes,
      });

      setShowAddModal(false);
      setCustomerName("");
      setCustomerPhone("");
      setBarberId("");
      setServiceId("");
      setChairNumber("");
      setNotes("");
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal membuat antrian.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    bookingId: string,
    newStatus: BookingStatusType,
    chair?: number
  ) => {
    try {
      await updateBookingStatusAction(bookingId, newStatus, chair);
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status antrian.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Barbershop */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Scissors className="w-3.5 h-3.5" />
            Modul Barbershop & Salon
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Live Queue & Kursi Pangkas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau antrian pelanggan, alokasi kursi kapster, dan proses ke kasir POS secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/barbershop/commissions"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Laporan Komisi</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ambil Antrian Baru</span>
          </button>
        </div>
      </div>

      {/* 3 Columns Live Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: WAITING */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Menunggu (Waiting)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
              {data.waitingList.length}
            </span>
          </div>

          <div className="space-y-3">
            {data.waitingList.length > 0 ? (
              data.waitingList.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono">
                        {item.queueNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {item.customerName}
                      </h4>
                      {item.customerPhone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {item.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <p className="text-slate-600 dark:text-slate-300">
                      Layanan:{" "}
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                        {item.service?.name || "Belum dipilih"}
                      </strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Kapster:{" "}
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                        {item.barber?.name || "Sembarang Kapster"}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Mulai Layani (Kursi)</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, "CANCELLED")}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                      title="Batalkan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Tidak ada antrian menunggu.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: IN_PROGRESS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <Armchair className="w-4 h-4" /> Sedang Dikerjakan (In Chair)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-black">
              {data.inProgressList.length}
            </span>
          </div>

          <div className="space-y-3">
            {data.inProgressList.length > 0 ? (
              data.inProgressList.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {item.queueNumber}
                        </span>
                        {item.chairNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            Kursi #{item.chairNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {item.customerName}
                      </h4>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <p className="text-slate-600 dark:text-slate-300">
                      Layanan:{" "}
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                        {item.service?.name || "Custom Treatment"}
                      </strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Kapster:{" "}
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {item.barber?.name || "Staff Barber"}
                      </strong>
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => handleStatusChange(item.id, "COMPLETED")}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesai Pangkas &rarr; Siap Bayar</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Belum ada kursi yang sedang aktif.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: COMPLETED */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Selesai Hari Ini
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black">
              {data.completedList.length}
            </span>
          </div>

          <div className="space-y-3">
            {data.completedList.length > 0 ? (
              data.completedList.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 opacity-90"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {item.queueNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.completedAt
                        ? new Date(item.completedAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Selesai"}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {item.customerName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {item.service?.name} &bull; {item.barber?.name}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Belum ada antrian yang diselesaikan hari ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-500" /> Ambil Antrian Pelanggan
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQueue} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Mas Budi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  No. WhatsApp / HP (Opsional)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Pilih Layanan
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="">-- Bebas / Pilih di Kasir --</option>
                    {data.services.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Rp {Number(s.price).toLocaleString("id-ID")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Pilih Kapster
                  </label>
                  <select
                    value={barberId}
                    onChange={(e) => setBarberId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="">-- Sembarang Kapster --</option>
                    {data.barbers.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Nomor Kursi (Opsional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={chairNumber}
                  onChange={(e) => setChairNumber(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Misal: 1 atau 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Model undercut fade"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 shadow"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Simpan Antrian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
