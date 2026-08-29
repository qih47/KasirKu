"use client";

import { useState } from "react";
import Link from "next/link";
import { toastSuccess, toastError } from "@/lib/swal";
import {
  Store,
  Plus,
  MapPin,
  Users,
  Package,
  Receipt,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Loader2,
  X,
  Building,
  Edit2,
  Coffee,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles,
  Clock,
  Layers,
} from "lucide-react";
import {
  createOutletAction,
  updateOutletAction,
  toggleOutletStatusAction,
} from "@/modules/tenant/outlet-actions";
import { OperatingHoursModal } from "@/components/outlets/operating-hours-modal";
import { useTranslation } from "@/lib/i18n/language-context";

interface OutletsClientProps {
  initialData?: {
    outlets: any[];
    activePlugins?: Array<{ code: string; name: string }>;
    currentCount: number;
    outletLimit: number | null;
    canAddOutlet: boolean;
    tierName: string;
  };
  data?: {
    outlets: any[];
    activePlugins?: Array<{ code: string; name: string }>;
    currentCount: number;
    outletLimit: number | null;
    canAddOutlet: boolean;
    tierName: string;
  };
}

export function OutletsClient({ initialData, data: propData }: OutletsClientProps) {
  const { tr } = useTranslation();
  const data = initialData || propData || {
    outlets: [],
    activePlugins: [],
    currentCount: 0,
    outletLimit: 1,
    canAddOutlet: false,
    tierName: "Lisensi Basic",
  };

  const activePlugins = data.activePlugins || [];
  const hasMultiplePlugins = activePlugins.length > 1;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editOutlet, setEditOutlet] = useState<any | null>(null);
  const [selectedScheduleOutlet, setSelectedScheduleOutlet] = useState<any>(null);

  // Form States
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setName("");
    setAddress("");
    setSelectedVerticals(activePlugins.map((p) => p.code));
    setError(null);
    setShowAddModal(true);
  };

  const openEditModal = (outlet: any) => {
    const existingVerticals = (outlet.operatingHours as any)?.activeVerticals || activePlugins.map((p) => p.code);
    setName(outlet.name || "");
    setAddress(outlet.address || "");
    setSelectedVerticals(existingVerticals);
    setError(null);
    setEditOutlet(outlet);
  };

  const toggleVerticalSelection = (code: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createOutletAction({
        name,
        address,
        activeVerticals: selectedVerticals.length > 0 ? selectedVerticals : undefined,
      });
      if (res.success) {
        toastSuccess("Cabang baru berhasil ditambahkan!");
        setShowAddModal(false);
        setName("");
        setAddress("");
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Gagal menambahkan cabang.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOutlet) return;
    setError(null);
    setLoading(true);

    try {
      const res = await updateOutletAction({
        outletId: editOutlet.id,
        name,
        address,
        activeVerticals: selectedVerticals.length > 0 ? selectedVerticals : undefined,
      });
      if (res.success) {
        toastSuccess("Informasi cabang berhasil diperbarui!");
        setEditOutlet(null);
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui cabang.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (outletId: string) => {
    try {
      await toggleOutletStatusAction(outletId);
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status outlet.");
    }
  };

  const outletList = data.outlets || [];

  return (
    <div className="space-y-6 text-left">
      {/* Header Outlets - Clean Material 3 White Surface */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-100">
            <Store className="w-3.5 h-3.5" />
            {tr("Manajemen Multi-Outlet & Cabang")}
          </div>
          <h1 className="text-2xl font-black text-slate-950">
            {tr("Daftar Outlet & Cabang")}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {tr("Kuota Cabang")}:{" "}
            <strong className="text-slate-900 font-bold">
              {data.currentCount ?? outletList.length} / {data.outletLimit ?? tr("Unlimited")} {tr("Cabang")}
            </strong>{" "}
            ({data.tierName || "Lisensi"})
          </p>
        </div>

        {data.canAddOutlet ? (
          <button
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{tr("Tambah Cabang Baru")}</span>
          </button>
        ) : (
          <Link
            href="/dashboard/subscription"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{tr("Upgrade Lisensi untuk Tambah Cabang")}</span>
          </Link>
        )}
      </div>

      {/* Outlets Grid - Clean Material 3 White Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {outletList.map((outlet: any, idx: number) => {
          const outletVerticals: string[] =
            (outlet.operatingHours as any)?.activeVerticals || activePlugins.map((p) => p.code);

          const hasCafe = outletVerticals.includes("cafe");
          const hasBarber = outletVerticals.includes("barbershop");
          const hasLaundry = outletVerticals.includes("laundry");
          const hasRetail = outletVerticals.includes("retail");

          return (
            <div
              key={outlet.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                    Cabang #{idx + 1}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(outlet)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Edit Nama & Operasional Cabang"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(outlet.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        outlet.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {outlet.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Nonaktif</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-950">
                    {outlet.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {outlet.address || "Belum ada alamat cabang"}
                    </span>
                  </p>
                </div>

                {/* Vertical Badges per Branch */}
                {activePlugins.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>Unit Bisnis Cabang Ini:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {hasCafe && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Coffee className="w-3 h-3" />
                          Cafe &amp; Resto
                        </span>
                      )}
                      {hasBarber && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Scissors className="w-3 h-3" />
                          Barbershop
                        </span>
                      )}
                      {hasLaundry && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <Shirt className="w-3 h-3" />
                          Laundry
                        </span>
                      )}
                      {hasRetail && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShoppingBag className="w-3 h-3" />
                          Retail
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2.5 bg-[#F8F9FD] border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Staff</span>
                    <strong className="text-xs font-black text-slate-950">
                      {outlet._count?.users ?? 0}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-[#F8F9FD] border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Produk</span>
                    <strong className="text-xs font-black text-slate-950">
                      {outlet._count?.products ?? 0}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-[#F8F9FD] border border-slate-100 rounded-2xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Transaksi</span>
                    <strong className="text-xs font-black text-slate-950">
                      {outlet._count?.transactions ?? 0}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedScheduleOutlet(outlet)}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1.5 transition border border-indigo-200/50 cursor-pointer"
                  title="Atur jam buka-tutup mingguan (Senin - Minggu) untuk analitik jam ramai"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Atur Jam Kerja</span>
                </button>

                <Link
                  href={`/pos?outletId=${outlet.id}`}
                  className="font-bold text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Kasir</span> &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Atur Jam Operasional Mingguan */}
      {selectedScheduleOutlet && (
        <OperatingHoursModal
          isOpen={true}
          onClose={() => setSelectedScheduleOutlet(null)}
          outletId={selectedScheduleOutlet.id}
          outletName={selectedScheduleOutlet.name}
          initialSchedule={selectedScheduleOutlet.operatingHours}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Modal Tambah Cabang Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2 text-slate-950">
                <Building className="w-5 h-5 text-indigo-600" />
                Tambah Cabang Outlet Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOutlet} className="space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nama Outlet / Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang Kemang, Outlet Bandung..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Alamat Lengkap Cabang
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Utama No. 123..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Checkboxes Unit Bisnis / Vertikal Cabang */}
              {hasMultiplePlugins && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="block font-bold text-slate-800">
                    Unit Bisnis yang Dibuka di Cabang Ini:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {activePlugins.map((plugin) => {
                      const isChecked = selectedVerticals.includes(plugin.code);
                      return (
                        <button
                          key={plugin.code}
                          type="button"
                          onClick={() => toggleVerticalSelection(plugin.code)}
                          className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center gap-2 cursor-pointer ${
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-indigo-600 cursor-pointer pointer-events-none"
                          />
                          <span className="truncate">{plugin.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Stasiun kasir POS di cabang ini hanya akan mengaktifkan unit bisnis yang dicentang.
                  </p>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan Cabang"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Cabang */}
      {editOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2 text-slate-950">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                Edit Informasi Cabang
              </h3>
              <button
                onClick={() => setEditOutlet(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOutlet} className="space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nama Outlet / Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Cabang..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Alamat Lengkap Cabang
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat Cabang..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Checkboxes Unit Bisnis / Vertikal Cabang */}
              {hasMultiplePlugins && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <span className="block font-bold text-slate-800">
                    Unit Bisnis yang Dibuka di Cabang Ini:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {activePlugins.map((plugin) => {
                      const isChecked = selectedVerticals.includes(plugin.code);
                      return (
                        <button
                          key={plugin.code}
                          type="button"
                          onClick={() => toggleVerticalSelection(plugin.code)}
                          className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center gap-2 cursor-pointer ${
                            isChecked
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-indigo-600 cursor-pointer pointer-events-none"
                          />
                          <span className="truncate">{plugin.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOutlet(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Simpan Perubahan"
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
