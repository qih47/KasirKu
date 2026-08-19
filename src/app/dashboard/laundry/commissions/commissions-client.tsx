"use client";

import { useState } from "react";
import {
  WashingMachine,
  Scale,
  Sparkles,
  DollarSign,
  User,
  Printer,
  Sliders,
  Save,
  CheckCircle2,
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import Link from "next/link";
import {
  getLaundryCommissionsData,
  updateStaffLaundryRatesAction,
} from "@/plugins/laundry/commission-actions";
import { toastSuccess, toastError, swalSuccess } from "@/lib/swal";

export function LaundryCommissionsClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"RECAP" | "RATES">("RECAP");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("ALL");

  // Rate config modal state
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [ironingRate, setIroningRate] = useState<number>(900);
  const [washingRate, setWashingRate] = useState<number>(400);
  const [deliveryRate, setDeliveryRate] = useState<number>(3000);
  const [rateSaving, setRateSaving] = useState(false);

  const handleStaffFilter = async (staffId: string) => {
    setSelectedStaffId(staffId);
    try {
      const res = await getLaundryCommissionsData({ staffId });
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal memfilter data komisi.");
    }
  };

  const openRateModal = (staff: any) => {
    const attrs = (staff.attributes as any) || {};
    setEditingStaff(staff);
    setIroningRate(attrs.ironingRatePerKg || 900);
    setWashingRate(attrs.washingRatePerKg || 400);
    setDeliveryRate(attrs.deliveryRatePerTrip || 3000);
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setRateSaving(true);
    try {
      await updateStaffLaundryRatesAction({
        staffId: editingStaff.id,
        ironingRatePerKg: Number(ironingRate),
        washingRatePerKg: Number(washingRate),
        deliveryRatePerTrip: Number(deliveryRate),
      });

      toastSuccess(`Tarif komisi ${editingStaff.name} berhasil disimpan!`);
      setEditingStaff(null);
      const res = await getLaundryCommissionsData();
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan tarif komisi.");
    } finally {
      setRateSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Scale className="w-3.5 h-3.5" />
            Manajemen Komisi &amp; Produktivitas Laundry
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Komisi Karyawan (Setrika, Cuci &amp; Kurir)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Periode:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.dateRange.from} &mdash; {data.dateRange.to}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/laundry/orders"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <WashingMachine className="w-3.5 h-3.5 text-cyan-600" />
            <span>Order Cucian</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Komisi Terakumulasi
          </span>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            Rp {data.totalCommissionsPaid.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bagi hasil hak karyawan laundry
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Bobot Kg Diproses
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {data.totalKgProcessed.toFixed(1)} Kg
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dari total {data.totalOrdersCount} order cucian
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Jumlah Operator Aktif
          </span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {data.staffList.length} Orang
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Staf cuci, setrika, &amp; kurir
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("RECAP")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "RECAP"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          📊 Rekap &amp; Pencairan Komisi
        </button>

        <button
          onClick={() => setActiveTab("RATES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "RATES"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          ⚙️ Atur Tarif Kerja per Staf (Rp/Kg)
        </button>
      </div>

      {/* TAB 1: RECAP VIEW */}
      {activeTab === "RECAP" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Rincian Komisi per Operator Laundry
            </h3>
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="ALL">Semua Operator</option>
              {data.staffList.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.staffSummaryList.map((staff: any) => (
              <div
                key={staff.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-black text-sm">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {staff.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{staff.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openRateModal(staff)}
                    className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-slate-100 transition"
                    title="Ubah Tarif Komisi"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tugas Diselesaikan:</span>
                  <span className="font-bold">{staff.totalTasks} order/batch</span>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Komisi:</span>
                  <span className="font-black text-base text-cyan-600">
                    Rp {staff.totalCommission.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Transaction History Table */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Riwayat Transaksi Komisi Terbaru
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Item / Layanan</th>
                    <th className="p-3">Skema Tarif</th>
                    <th className="p-3 text-right">Nominal Komisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.commissions.length > 0 ? (
                    data.commissions.slice(0, 30).map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 font-bold">{c.staff?.name || "-"}</td>
                        <td className="p-3">
                          {c.transactionItem?.product?.name || "Layanan Laundry"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {c.commissionType === "WEIGHT_RATE"
                            ? `Rp ${Number(c.rate).toLocaleString("id-ID")}/Kg`
                            : `Tarif Standar`}
                        </td>
                        <td className="p-3 text-right font-black text-cyan-600">
                          Rp {Number(c.amount).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Belum ada data transaksi komisi laundry pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RATES CONFIGURATION */}
      {activeTab === "RATES" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Konfigurasi Standar Tarif Kerja Operator Laundry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan upah bagi hasil per Kg setrika, cuci/kering, dan trip kurir antar jemput untuk setiap staf.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {data.staffList.map((s: any) => {
              const attrs = (s.attributes as any) || {};
              return (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {s.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{s.role}</p>
                    </div>
                    <button
                      onClick={() => openRateModal(s)}
                      className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs rounded-xl border border-cyan-200 transition"
                    >
                      Ubah Tarif
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Tarif Setrika &amp; Packing:</span>
                      <strong className="text-cyan-600">
                        Rp {(attrs.ironingRatePerKg || 900).toLocaleString("id-ID")} / Kg
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Tarif Cuci &amp; Kering:</span>
                      <strong className="text-indigo-600">
                        Rp {(attrs.washingRatePerKg || 400).toLocaleString("id-ID")} / Kg
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Tarif Kurir Antar-Jemput:</span>
                      <strong className="text-emerald-600">
                        Rp {(attrs.deliveryRatePerTrip || 3000).toLocaleString("id-ID")} / Trip
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Rate Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm">
                  Atur Tarif Komisi: {editingStaff.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Hitungan otomatis saat order diselesaikan
                </p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Setrika &amp; Packing (Rp per Kg)
                </label>
                <input
                  type="number"
                  required
                  value={ironingRate}
                  onChange={(e) => setIroningRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Cuci &amp; Pengeringan (Rp per Kg)
                </label>
                <input
                  type="number"
                  required
                  value={washingRate}
                  onChange={(e) => setWashingRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Kurir Antar-Jemput (Rp per Trip)
                </label>
                <input
                  type="number"
                  required
                  value={deliveryRate}
                  onChange={(e) => setDeliveryRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rateSaving}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{rateSaving ? "Menyimpan..." : "Simpan Tarif"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
