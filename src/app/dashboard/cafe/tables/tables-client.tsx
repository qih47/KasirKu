"use client";

import { useState } from "react";
import {
  createCafeTableAction,
  updateTableStatusAction,
} from "@/plugins/cafe/actions";
import {
  Coffee,
  Plus,
  Users,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  X,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { TableStatus } from "@prisma/client";

export function CafeTablesClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add Table state
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState<number | "">(4);

  // Selected Table Modal (for updating status / KOT)
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [guestName, setGuestName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    setLoading(true);
    try {
      await createCafeTableAction({
        outletId: data.currentOutletId,
        tableNumber,
        capacity: Number(capacity) || 4,
      });

      setShowAddModal(false);
      setTableNumber("");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal menambah meja.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: TableStatus) => {
    if (!selectedTable) return;

    try {
      await updateTableStatusAction({
        tableId: selectedTable.id,
        status,
        guestName,
        notes: orderNotes,
      });

      setSelectedTable(null);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status meja.");
    }
  };

  const openTableDetail = (table: any) => {
    setSelectedTable(table);
    setGuestName(table.currentGuestName || "");
    setOrderNotes(table.currentOrderNotes || "");
  };

  return (
    <div className="space-y-6">
      {/* Header Cafe Tables */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Coffee className="w-3.5 h-3.5" />
            Modul Cafe & F&B
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Denah Meja & Live Floor Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau ketersediaan meja resto/cafe secara real-time dan cetak Kitchen Order Ticket (KOT).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Meja Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
              Meja Kosong (Available)
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {data.availableCount}
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">
              Meja Terisi (Occupied)
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {data.occupiedCount}
            </p>
          </div>
          <Utensils className="w-8 h-8 text-rose-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
              Reservasi (Booked)
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {data.reservedCount}
            </p>
          </div>
          <Clock className="w-8 h-8 text-amber-500/40" />
        </div>
      </div>

      {/* Floor Map Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          Denah Tata Letak Meja Resto
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.tables.map((table: any) => {
            const isAvailable = table.status === "AVAILABLE";
            const isOccupied = table.status === "OCCUPIED";

            return (
              <div
                key={table.id}
                onClick={() => openTableDetail(table)}
                className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  isAvailable
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500"
                    : isOccupied
                    ? "bg-rose-50/60 dark:bg-rose-950/40 border-rose-500/50 shadow-sm"
                    : "bg-amber-50/60 dark:bg-amber-950/40 border-amber-500/50 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                      {table.tableNumber}
                    </h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {table.capacity} Kursi
                    </span>
                  </div>

                  <span
                    className={`w-3 h-3 rounded-full ${
                      isAvailable
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                        : isOccupied
                        ? "bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"
                        : "bg-amber-500"
                    }`}
                  />
                </div>

                {isOccupied && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {table.currentGuestName || "Tamu"}
                    </p>
                    {table.currentOrderNotes && (
                      <p className="text-slate-500 truncate">
                        {table.currentOrderNotes}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {table.status} &bull; Klik kelola
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Add Table */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-emerald-600" /> Tambah Meja Cafe
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nomor / Nama Meja *</label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Misal: Meja 08 atau VIP-2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Kapasitas Kursi</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Status Meja */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" /> Kelola {selectedTable.tableNumber}
              </span>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Tamu / Pemesan</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Misal: Bapak Gunawan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan Order / KOT Dapur</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Misal: Kopi less sugar, Nasi goreng pedas level 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-semibold block text-slate-600 dark:text-slate-400">
                  Ubah Status Meja:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("AVAILABLE")}
                    className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900"
                  >
                    Kosongkan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("OCCUPIED")}
                    className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900"
                  >
                    Isi Meja
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("RESERVED")}
                    className="py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900"
                  >
                    Reservasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
