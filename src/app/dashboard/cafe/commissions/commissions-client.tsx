"use client";

import { useState } from "react";
import {
  Coffee,
  DollarSign,
  Users,
  Sparkles,
  Printer,
  Sliders,
  Save,
  CheckCircle2,
  PieChart,
  Percent,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import {
  getCafeServiceChargePoolData,
  updateCafeServiceChargeConfigAction,
} from "@/plugins/cafe/commission-actions";
import { toastSuccess, toastError } from "@/lib/swal";

export function CafeCommissionsClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"POOL" | "SETTINGS">("POOL");

  // Config settings
  const [serviceRate, setServiceRate] = useState<number>(data.serviceChargePercent || 5);
  const [distributionMethod, setDistributionMethod] = useState<string>("EQUAL_SPLIT");
  const [saving, setSaving] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCafeServiceChargeConfigAction({
        serviceChargePercent: Number(serviceRate),
        poolDistributionMethod: distributionMethod,
      });

      toastSuccess("Pengaturan Service Charge Pool berhasil disimpan!");
      const res = await getCafeServiceChargePoolData();
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Coffee className="w-3.5 h-3.5" />
            Manajemen Service Charge &amp; Tip Pool F&amp;B
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pool Bagi Rata Kru Cafe &amp; Restoran
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
            href="/dashboard/cafe/tables"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-600" />
            <span>Denah Meja Cafe</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Pool</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Service Pool Terkumpul
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            Rp {data.totalServiceChargeCollected.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dikutip {data.serviceChargePercent}% dari total omzet
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Estimasi Hak per Anggota Tim
          </span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            Rp {data.estimatedPoolPerStaff.toLocaleString("id-ID")} / orang
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bagi rata ke {data.staffCount} staf bertugas
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Omzet Penjualan F&amp;B
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Rp {data.totalOmzet.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dari {data.totalTransactions} transaksi meja &amp; dine-in
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("POOL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "POOL"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          👥 Pembagian Pool Staf
        </button>

        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "SETTINGS"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          ⚙️ Aturan Service Charge (% Pool)
        </button>
      </div>

      {/* TAB 1: POOL DISTRIBUTION LIST */}
      {activeTab === "POOL" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Daftar Hak Pembagian Pool Kru (Barista, Cook &amp; Waiter)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.staffList.map((s: any) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {s.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{s.role}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Hak Pool:</span>
                    <strong className="text-sm font-black text-emerald-600">
                      Rp {data.estimatedPoolPerStaff.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === "SETTINGS" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Konfigurasi Service Charge Pool
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Uang service charge yang terkumpul otomatis dihitung dari omzet penjualan dan dibagi rata ke seluruh staf aktif.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Persentase Service Charge (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  required
                  value={serviceRate}
                  onChange={(e) => setServiceRate(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Standar kafe &amp; restoran di Indonesia adalah 5% s/d 10%.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembagian Pool
              </label>
              <select
                value={distributionMethod}
                onChange={(e) => setDistributionMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="EQUAL_SPLIT">Bagi Rata ke Seluruh Kru Aktif (Equal Split)</option>
                <option value="HOURLY_WEIGHTED">Berdasarkan Total Jam Kerja Shift</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Menyimpan..." : "Simpan Pengaturan Service"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
