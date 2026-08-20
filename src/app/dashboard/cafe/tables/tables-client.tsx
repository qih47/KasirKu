"use client";

import { useState } from "react";
import Link from "next/link";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";
import {
  createCafeTableAction,
  updateCafeTableAction,
  deleteCafeTableAction,
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
  Edit2,
  Trash2,
  SlidersHorizontal,
  MapPin,
  QrCode,
  Building2,
} from "lucide-react";
import { TableStatus } from "@prisma/client";
import { TableQrModal } from "@/components/cafe/table-qr-modal";

const ZONE_LABELS: Record<string, string> = {
  INDOOR: "Indoor AC",
  OUTDOOR: "Outdoor Garden",
  VIP: "VIP Room",
  LANTAI_2: "Lantai 2 (Balkon)",
};

export function CafeTablesClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [mode, setMode] = useState<"POS_BILLING" | "MANAGE_LAYOUT">("POS_BILLING");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrTableId, setSelectedQrTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Add Table state
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState<number | "">(4);
  const [areaZone, setAreaZone] = useState<string>("INDOOR");

  // Selected Table Modal (for updating status / KOT)
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [guestName, setGuestName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Edit Table Modal
  const [editingTable, setEditingTable] = useState<any>(null);
  const [editTableNumber, setEditTableNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState<number | "">(4);
  const [editAreaZone, setEditAreaZone] = useState<string>("INDOOR");
  const [editLoading, setEditLoading] = useState(false);

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
      toastError(err.message || "Gagal menambah meja.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editTableNumber.trim()) return;

    setEditLoading(true);
    try {
      await updateCafeTableAction({
        tableId: editingTable.id,
        tableNumber: editTableNumber,
        capacity: Number(editCapacity) || 4,
        areaZone: editAreaZone,
      });

      setEditingTable(null);
      toastSuccess("Meja berhasil diperbarui.");
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan perubahan meja.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    const ok = await swalConfirm(
      "Hapus Meja?",
      "Meja ini akan dihapus permanen dari denah cafe.",
      { confirmText: "Ya, Hapus", isDanger: true }
    );
    if (!ok) return;

    setEditLoading(true);
    try {
      await deleteCafeTableAction(tableId);
      setEditingTable(null);
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal menghapus meja.");
    } finally {
      setEditLoading(false);
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
      toastError(err.message || "Gagal mengubah status meja.");
    }
  };

  const openTableDetail = (table: any) => {
    if (mode === "MANAGE_LAYOUT") {
      setEditingTable(table);
      setEditTableNumber(table.tableNumber);
      setEditCapacity(table.capacity || 4);
      setEditAreaZone(table.areaZone || "INDOOR");
    } else {
      setSelectedTable(table);
      setGuestName(table.currentGuestName || "");
      setOrderNotes(table.currentOrderNotes || "");
    }
  };

  const filteredTables = data.tables.filter((t: any) => {
    if (selectedZoneFilter === "ALL") return true;
    return (t.areaZone || "INDOOR") === selectedZoneFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Cafe Tables */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Coffee className="w-3.5 h-3.5" />
              Modul Cafe &amp; F&amp;B
            </span>

            {/* Multi-Outlet Switcher for Owner */}
            {data.outlets && data.outlets.length > 1 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <select
                  value={data.currentOutletId}
                  onChange={(e) => {
                    window.location.href = `/dashboard/cafe/tables?outletId=${e.target.value}`;
                  }}
                  className="bg-transparent border-0 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-0 cursor-pointer p-0 pr-1"
                >
                  {data.outlets.map((o: any) => (
                    <option key={o.id} value={o.id} className="dark:bg-slate-900">
                      Cabang: {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Denah Meja &amp; Tata Letak
          </h1>
          <p className="text-xs text-slate-500">
            Pantau status meja real-time, atur kapasitas kursi, dan cetak QR standee meja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher Toggle */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-0.5">
            <button
              onClick={() => setMode("POS_BILLING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                mode === "POS_BILLING"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Mode Kasir
            </button>
            <button
              onClick={() => setMode("MANAGE_LAYOUT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === "MANAGE_LAYOUT"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Kelola Denah</span>
            </button>
          </div>

          <Link
            href="/dashboard/cafe/commissions"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Laporan Komisi</span>
          </Link>

          <button
            onClick={() => {
              setSelectedQrTableId(null);
              setShowQrModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Cetak QR Meja</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Meja</span>
          </button>
        </div>
      </div>

      {/* Mode Banner Indicator */}
      {mode === "MANAGE_LAYOUT" && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Mode Kelola Denah Aktif: Klik pada meja manapun untuk mengedit nama, kapasitas kursi, atau menghapus meja.</span>
          </div>
          <button
            onClick={() => setMode("POS_BILLING")}
            className="text-[11px] underline font-extrabold hover:text-emerald-900"
          >
            Kembali ke Mode Kasir
          </button>
        </div>
      )}

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
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Denah Tata Letak Meja Resto ({filteredTables.length} Meja)
          </h3>

          {/* Area Zone Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedZoneFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                selectedZoneFilter === "ALL"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Semua Area
            </button>
            {Object.entries(ZONE_LABELS).map(([zKey, zName]) => (
              <button
                key={zKey}
                onClick={() => setSelectedZoneFilter(zKey)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                  selectedZoneFilter === zKey
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {zName}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table: any) => {
            const isAvailable = table.status === "AVAILABLE";
            const isOccupied = table.status === "OCCUPIED";
            const zoneLabel = ZONE_LABELS[table.areaZone || "INDOOR"] || table.areaZone || "Indoor";

            return (
              <div
                key={table.id}
                onClick={() => openTableDetail(table)}
                className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                  mode === "MANAGE_LAYOUT"
                    ? "border-dashed border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20 hover:border-emerald-600 hover:scale-[1.02]"
                    : isAvailable
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md"
                    : isOccupied
                    ? "bg-rose-50/60 dark:bg-rose-950/40 border-rose-500/50 shadow-sm"
                    : "bg-amber-50/60 dark:bg-amber-950/40 border-amber-500/50 shadow-sm"
                }`}
              >
                {mode === "MANAGE_LAYOUT" && (
                  <span className="absolute top-3 right-3 p-1 rounded-lg bg-emerald-600 text-white shadow-sm">
                    <Edit2 className="w-3 h-3" />
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                      {table.tableNumber}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {table.capacity} Kursi
                      </span>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        {zoneLabel}
                      </span>
                    </div>
                  </div>

                  {mode !== "MANAGE_LAYOUT" && (
                    <span
                      className={`w-3 h-3 rounded-full ${
                        isAvailable
                          ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                          : isOccupied
                          ? "bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                  )}
                </div>

                {mode !== "MANAGE_LAYOUT" && isOccupied && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Tamu: {table.currentGuestName || "Pelanggan"}
                    </p>
                    {table.currentOrderNotes && (
                      <p className="text-[10px] text-slate-500 truncate">
                        {table.currentOrderNotes}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-400">
                    {mode === "MANAGE_LAYOUT"
                      ? "Klik untuk Edit"
                      : isAvailable
                      ? "Meja Kosong"
                      : isOccupied
                      ? "Sedang Terisi"
                      : "Reservasi"}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQrTableId(table.id);
                        setShowQrModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-500 transition cursor-pointer"
                      title="Lihat / Cetak QR Meja Ini"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-emerald-600 font-extrabold">&rarr;</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Tambah Meja */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" /> Tambah Meja Baru
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
                <label className="block font-semibold mb-1">Nomor / Nama Meja</label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Misal: Meja 08, Sofa VIP A, Outdoor 03"
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

      {/* Modal Edit Meja (Manage Layout Mode) */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                Edit Data Meja: <span className="text-emerald-600 font-black">{editingTable.tableNumber}</span>
              </span>
              <button
                onClick={() => setEditingTable(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama / Label Meja</label>
                <input
                  type="text"
                  required
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  placeholder="Misal: Meja 08, VIP Room 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Kapasitas Kursi (Orang)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Area / Zona Meja</label>
                <select
                  value={editAreaZone}
                  onChange={(e) => setEditAreaZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="INDOOR">Indoor AC</option>
                  <option value="OUTDOOR">Outdoor Garden</option>
                  <option value="VIP">VIP Room</option>
                  <option value="LANTAI_2">Lantai 2 (Balkon)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteTable(editingTable.id)}
                  disabled={editLoading}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Meja</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    {editLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Status Meja (POS Billing Mode) */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
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

              {/* QR Action Button in Table Detail */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQrTableId(selectedTable.id);
                    setSelectedTable(null);
                    setShowQrModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Lihat &amp; Cetak QR {selectedTable.tableNumber}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code Standee Generator & Batch Print */}
      <TableQrModal
        isOpen={showQrModal}
        onClose={() => {
          setShowQrModal(false);
          setSelectedQrTableId(null);
        }}
        tables={data.tables || []}
        tenantId={data.tenantId || ""}
        businessName={data.businessName || "Cafe & Resto"}
        outletId={data.currentOutletId}
        outletName={data.outletName || "Outlet Utama"}
        selectedTableId={selectedQrTableId}
      />
    </div>
  );
}
