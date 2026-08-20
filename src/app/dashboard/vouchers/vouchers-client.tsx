"use client";

import { useState } from "react";
import {
  VoucherItem,
  VoucherStats,
  createVoucherAction,
  updateVoucherAction,
  toggleVoucherStatusAction,
  deleteVoucherAction,
  getVouchersData,
} from "@/modules/voucher/actions";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Percent,
  DollarSign,
  Copy,
  Check,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  X,
  Loader2,
  Calendar,
  Tag,
  Flame,
  Power,
} from "lucide-react";

interface VouchersClientProps {
  initialData: {
    vouchers: VoucherItem[];
    stats: VoucherStats;
  };
  hideHeader?: boolean;
}

export function VouchersClient({ initialData, hideHeader = false }: VouchersClientProps) {
  const [vouchers, setVouchers] = useState<VoucherItem[]>(initialData.vouchers);
  const [stats, setStats] = useState<VoucherStats>(initialData.stats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "INACTIVE">("ALL");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT" as "PERCENT" | "FIXED",
    discountValue: 10,
    minOrder: 0,
    maxDiscount: "" as number | string,
    usageLimit: "" as number | string,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    isActive: true,
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await getVouchersData({ search: searchQuery, status: statusFilter });
      setVouchers(res.vouchers);
      setStats(res.stats);
    } catch (err: any) {
      toastError(err.message || "Gagal memperbarui data voucher.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    try {
      const res = await getVouchersData({ search: val, status: statusFilter });
      setVouchers(res.vouchers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = async (status: "ALL" | "ACTIVE" | "EXPIRED" | "INACTIVE") => {
    setStatusFilter(status);
    setLoading(true);
    try {
      const res = await getVouchersData({ search: searchQuery, status });
      setVouchers(res.vouchers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setForm({
      code: "",
      description: "",
      discountType: "PERCENT",
      discountValue: 10,
      minOrder: 0,
      maxDiscount: "",
      usageLimit: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v: VoucherItem) => {
    setEditingVoucher(v);
    setForm({
      code: v.code,
      description: v.description || "",
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrder: v.minOrder,
      maxDiscount: v.maxDiscount !== null ? v.maxDiscount : "",
      usageLimit: v.usageLimit !== null ? v.usageLimit : "",
      startDate: v.startDate ? v.startDate.slice(0, 10) : "",
      endDate: v.endDate ? v.endDate.slice(0, 10) : "",
      isActive: v.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toastError("Kode voucher wajib diisi.");
      return;
    }

    setFormLoading(true);
    try {
      const payload: any = {
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount !== "" ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit !== "" ? Number(form.usageLimit) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        isActive: form.isActive,
      };

      if (editingVoucher) {
        await updateVoucherAction(editingVoucher.id, payload);
        toastSuccess("Voucher berhasil diperbarui!");
      } else {
        await createVoucherAction(payload);
        toastSuccess("Voucher promo baru berhasil dibuat!");
      }

      setShowModal(false);
      refreshData();
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan voucher.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (v: VoucherItem) => {
    try {
      await toggleVoucherStatusAction(v.id, !v.isActive);
      setVouchers((prev) =>
        prev.map((item) => (item.id === v.id ? { ...item, isActive: !v.isActive } : item))
      );
      toastSuccess(`Voucher ${v.code} ${!v.isActive ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status voucher.");
    }
  };

  const handleDelete = async (v: VoucherItem) => {
    const isConfirmed = await swalConfirm(
      `Hapus Voucher ${v.code}?`,
      "Voucher yang telah dihapus tidak dapat digunakan kembali oleh kasir atau pelanggan.",
      { isDanger: true, confirmText: "Ya, Hapus" }
    );

    if (isConfirmed) {
      try {
        await deleteVoucherAction(v.id);
        toastSuccess(`Voucher ${v.code} berhasil dihapus.`);
        refreshData();
      } catch (err: any) {
        toastError(err.message || "Gagal menghapus voucher.");
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header (or Action Bar when embedded) */}
      {!hideHeader ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Ticket className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Voucher &amp; Promo
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kelola kupon diskon, batas kuota pemakaian, masa kedaluwarsa, dan promo khusus kasir Bisnis Anda.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Voucher Baru</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Daftar Kupon Diskon &amp; Promo Bisnis Aktif
          </span>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Voucher Baru</span>
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Voucher */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Voucher</span>
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Ticket className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalVouchers}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Kupon terdaftar di Bisnis</div>
        </div>

        {/* Card 2: Voucher Aktif */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Voucher Aktif</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.activeVouchers}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">Siap digunakan di POS</div>
        </div>

        {/* Card 3: Total Penggunaan (Redeemed) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Digunakan</span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalRedeemed} <span className="text-xs font-normal text-slate-400">kali</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Klaim transaksi kasir</div>
        </div>

        {/* Card 4: Voucher Expired */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Kedaluwarsa</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.expiredVouchers}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Batas waktu habis</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode kupon / deskripsi..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-bold">
          {(
            [
              { id: "ALL", label: "Semua" },
              { id: "ACTIVE", label: "Aktif" },
              { id: "EXPIRED", label: "Kedaluwarsa" },
              { id: "INACTIVE", label: "Nonaktif" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${statusFilter === tab.id
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <Ticket className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum Ada Voucher Ditemukan
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Buat kupon voucher promo pertama Anda untuk menarik lebih banyak pelanggan dan meningkatkan loyalitas.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow transition hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Voucher Sekarang</span>
            </button>
          </div>
        ) : (
          vouchers.map((v) => {
            const isCurrentlyActive = v.isActive && !v.isExpired && !v.isQuotaFull;

            return (
              <div
                key={v.id}
                className={`rounded-3xl p-5 bg-white dark:bg-slate-900 border shadow-sm transition hover:shadow-md relative overflow-hidden flex flex-col justify-between space-y-4 ${isCurrentlyActive
                    ? "border-slate-200/90 dark:border-slate-800"
                    : "border-slate-200/50 dark:border-slate-800/50 opacity-80"
                  }`}
              >
                {/* Top Badge & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(v.code)}
                      className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono font-black text-sm tracking-wider hover:bg-indigo-100 transition cursor-pointer"
                      title="Klik untuk salin kode voucher"
                    >
                      <span>{v.code}</span>
                      {copiedCode === v.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                      )}
                    </button>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.discountType === "PERCENT"
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        }`}
                    >
                      {v.discountType === "PERCENT" ? "Persen" : "Nominal"}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {v.isExpired ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">
                        Kedaluwarsa
                      </span>
                    ) : v.isQuotaFull ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                        Kuota Habis
                      </span>
                    ) : v.isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Nonaktif
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & Value */}
                <div className="space-y-1">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {v.discountType === "PERCENT" ? (
                      <span>
                        Diskon {v.discountValue}%
                        {v.maxDiscount && (
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            (Maks. Rp {v.maxDiscount.toLocaleString("id-ID")})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Potongan Rp {v.discountValue.toLocaleString("id-ID")}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {v.description || "Tidak ada catatan deskripsi."}
                  </p>
                </div>

                {/* Constraints & Limits */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Min. Belanja:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {v.minOrder > 0 ? `Rp ${v.minOrder.toLocaleString("id-ID")}` : "Tanpa Minimum"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Penggunaan Kuota:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {v.usedCount} {v.usageLimit !== null ? `/ ${v.usageLimit}x` : "kali (Tak terbatas)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Masa Berlaku:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {v.endDate ? (
                        <span className={v.isExpired ? "text-rose-500 font-bold" : ""}>
                          s/d {new Date(v.endDate).toLocaleDateString("id-ID")}
                        </span>
                      ) : (
                        "Selamanya"
                      )}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${v.isActive
                        ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{v.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(v)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                      title="Edit voucher"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(v)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      title="Hapus voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Buat / Edit Voucher */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Ticket className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {editingVoucher ? `Edit Voucher ${editingVoucher.code}` : "Buat Voucher Promo Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Konfigurasi kupon promo untuk Bisnis Anda</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Kode Voucher */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Kupon Voucher: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: PROMO2026, HEMAT10..."
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs uppercase font-mono font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Deskripsi Promo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Deskripsi Promo:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Diskon Grand Opening 20%..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tipe Diskon Switcher */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Potongan Diskon:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: "PERCENT" })}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${form.discountType === "PERCENT"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500"
                      }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Persentase (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: "FIXED" })}
                    className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${form.discountType === "FIXED"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500"
                      }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Nominal Tetap (Rp)</span>
                  </button>
                </div>
              </div>

              {/* Nilai Diskon & Maksimal Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {form.discountType === "PERCENT" ? "Besar Diskon (%):" : "Potongan (Rp):"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={form.discountType === "PERCENT" ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {form.discountType === "PERCENT" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Maksimal Diskon (Rp):
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Opsional (cth: 30000)"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Min Belanja & Batas Kuota */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Minimum Belanja (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 (Tanpa minimum)"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Kuota Penggunaan:
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Tak terbatas (kosongkan)"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tanggal Mulai & Expired */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Mulai Berlaku:
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kedaluwarsa:
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Checkbox Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Aktifkan voucher ini agar langsung dapat digunakan di kasir POS
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingVoucher ? "Simpan Perubahan" : "Buat Voucher"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
