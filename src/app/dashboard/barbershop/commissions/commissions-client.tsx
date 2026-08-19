"use client";

import { useState } from "react";
import { toastError, toastSuccess } from "@/lib/swal";
import {
  getBarberCommissionsReport,
  updateStaffBarberRateAction,
} from "@/plugins/barbershop/actions";
import {
  Scissors,
  Sparkles,
  DollarSign,
  User,
  Calendar,
  Printer,
  Download,
  CheckCircle2,
  X,
  Layers,
  Percent,
  Sliders,
  Save,
  FileText,
} from "lucide-react";
import Link from "next/link";

export function BarberCommissionsClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"RECAP" | "RATES">("RECAP");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("ALL");
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [activeSlipBarber, setActiveSlipBarber] = useState<any>(null);

  // Rate config modal state
  const [editingBarber, setEditingBarber] = useState<any | null>(null);
  const [schemeType, setSchemeType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [serviceRate, setServiceRate] = useState<number>(40);
  const [productRate, setProductRate] = useState<number>(5);
  const [tierLabel, setTierLabel] = useState<string>("Kapster");
  const [savingRate, setSavingRate] = useState(false);

  const handleBarberFilter = async (barberId: string) => {
    setSelectedBarberId(barberId);
    try {
      const res = await getBarberCommissionsReport({ barberId });
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal memfilter laporan komisi.");
    }
  };

  const handleOpenSlip = (barberSummary: any) => {
    const barberCommissions = data.commissions.filter(
      (c: any) => c.staffId === barberSummary.id
    );
    setActiveSlipBarber({
      ...barberSummary,
      items: barberCommissions,
    });
    setShowSlipModal(true);
  };

  const openRateModal = (barber: any) => {
    const attrs = (barber.attributes as any) || {};
    setEditingBarber(barber);
    setSchemeType(attrs.schemeType || "PERCENTAGE");
    setServiceRate(Number(attrs.serviceRate || (attrs.schemeType === "FLAT" ? 15000 : 40)));
    setProductRate(Number(attrs.productCommissionRate || 5));
    setTierLabel(attrs.tierLabel || "Kapster");
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber) return;

    setSavingRate(true);
    try {
      await updateStaffBarberRateAction({
        staffId: editingBarber.id,
        schemeType,
        serviceRate: Number(serviceRate),
        productCommissionRate: Number(productRate),
        tierLabel,
      });

      toastSuccess(`Skema komisi ${editingBarber.name} berhasil disimpan!`);
      setEditingBarber(null);
      const res = await getBarberCommissionsReport();
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan skema komisi.");
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Barbershop Commissions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Percent className="w-3.5 h-3.5" />
            Laporan Bagi Hasil &amp; Komisi Barber
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Rekap Komisi Kapster &amp; Stylist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Periode:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.dateRange.from} &mdash; {data.dateRange.to}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/barbershop/queue"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-500" />
            <span>Lihat Antrian Kursi</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
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
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            Rp {data.totalCommissionsPaid.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Bagi hasil hak kapster</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Treatment Selesai
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {data.commissions.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Jasa pangkas &amp; perawatan</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Staff Kapster Aktif
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {data.barberSummaryList.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kapster terdaftar di cabang</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("RECAP")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "RECAP"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          📊 Rekap &amp; Slip Gaji Kapster
        </button>

        <button
          onClick={() => setActiveTab("RATES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "RATES"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          ⚙️ Atur Skema &amp; Rate Kapster
        </button>
      </div>

      {/* TAB 1: RECAP VIEW */}
      {activeTab === "RECAP" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Breakdown Komisi per Kapster
            </h3>
            <select
              value={selectedBarberId}
              onChange={(e) => handleBarberFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              <option value="ALL">Semua Kapster</option>
              {data.barbers.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.barberSummaryList.map((b: any) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {b.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{b.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openRateModal(b)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition"
                    title="Ubah Skema Komisi"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Kepala Dicukur:</span>
                  <span className="font-bold">{b.totalServices} pelanggan</span>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Komisi:</span>
                    <span className="font-black text-base text-amber-600 dark:text-amber-400">
                      Rp {b.totalCommission.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenSlip(b)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Slip Gaji</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Transactions List */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Riwayat Transaksi Potong &amp; Treatment
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Kapster</th>
                    <th className="p-3">Treatment / Produk</th>
                    <th className="p-3">Rate Bagi Hasil</th>
                    <th className="p-3 text-right">Hak Komisi</th>
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
                          {c.transactionItem?.product?.name || "Jasa Potong"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {c.commissionType === "PERCENTAGE"
                            ? `${Number(c.rate)}% (Bagi Hasil)`
                            : `Rp ${Number(c.rate).toLocaleString("id-ID")} (Flat)`}
                        </td>
                        <td className="p-3 text-right font-black text-amber-600">
                          Rp {Number(c.amount).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Belum ada data transaksi komisi pada periode ini.
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
              Konfigurasi Rate Bagi Hasil per Kapster &amp; Stylist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan apakah kapster menerima persentase bagi hasil (misal: 40%) atau nominal uang lelah tetap per kepala (misal: Rp 15.000).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {data.barbers.map((b: any) => {
              const attrs = (b.attributes as any) || {};
              const sType = attrs.schemeType || "PERCENTAGE";
              const sRate = attrs.serviceRate || (sType === "FLAT" ? 15000 : 40);

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {b.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Level: <span className="font-bold text-amber-600">{attrs.tierLabel || "Kapster"}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => openRateModal(b)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 transition"
                    >
                      Ubah Rate
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Skema Komisi Jasa:</span>
                      <strong className="text-amber-600">
                        {sType === "PERCENTAGE" ? `${sRate}% dari Omzet` : `Rp ${Number(sRate).toLocaleString("id-ID")} / Kepala`}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Komisi Penjualan Pomade:</span>
                      <strong className="text-indigo-600">
                        {attrs.productCommissionRate || 5}% per item
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Barber Rate Modal */}
      {editingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm">
                  Atur Skema: {editingBarber.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Konfigurasi bagi hasil jasa potong &amp; penjualan produk
                </p>
              </div>
              <button
                onClick={() => setEditingBarber(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Level / Jabatan Kapster
                </label>
                <input
                  type="text"
                  value={tierLabel}
                  onChange={(e) => setTierLabel(e.target.value)}
                  placeholder="Contoh: Master Barber / Senior / Junior"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilihan Model Skema Jasa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSchemeType("PERCENTAGE");
                      setServiceRate(40);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      schemeType === "PERCENTAGE"
                        ? "bg-amber-50 border-amber-500 text-amber-700"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    Bagi Hasil (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSchemeType("FLAT");
                      setServiceRate(15000);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      schemeType === "FLAT"
                        ? "bg-amber-50 border-amber-500 text-amber-700"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    Flat Nominal (Rp)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {schemeType === "PERCENTAGE" ? "Persentase Komisi (%)" : "Nominal Tetap per Kepala (Rp)"}
                </label>
                <input
                  type="number"
                  required
                  value={serviceRate}
                  onChange={(e) => setServiceRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Komisi Penjualan Produk Retail / Pomade (%)
                </label>
                <input
                  type="number"
                  required
                  value={productRate}
                  onChange={(e) => setProductRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingBarber(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRate}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingRate ? "Menyimpan..." : "Simpan Skema"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Gaji Preview Modal */}
      {showSlipModal && activeSlipBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="text-center border-b pb-3 space-y-1">
              <span className="p-2 rounded-full bg-amber-500/10 text-amber-600 inline-block">
                <Scissors className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                SLIP KOMISI KAPSTER
              </h3>
              <p className="text-xs font-bold text-amber-600">{activeSlipBarber.name}</p>
              <p className="text-[10px] text-slate-400">
                Periode: {data.dateRange.from} &mdash; {data.dateRange.to}
              </p>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Total Servis / Kepala:</span>
                <strong className="font-bold">{activeSlipBarber.totalServices} Orang</strong>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Total Uang Komisi:</span>
                <strong className="font-black text-sm text-emerald-600">
                  Rp {activeSlipBarber.totalCommission.toLocaleString("id-ID")}
                </strong>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between gap-2">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
