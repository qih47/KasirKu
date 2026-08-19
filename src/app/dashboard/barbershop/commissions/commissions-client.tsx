"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import { getBarberCommissionsReport } from "@/plugins/barbershop/actions";
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
} from "lucide-react";
import Link from "next/link";

export function BarberCommissionsClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("ALL");
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [activeSlipBarber, setActiveSlipBarber] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      {/* Header Barbershop Commissions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Percent className="w-3.5 h-3.5" />
            Laporan Bagi Hasil & Komisi Barber
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Rekap Komisi Kapster & Stylist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Periode:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.dateRange.from} &mdash; {data.dateRange.to}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          <p className="text-[11px] text-slate-500 mt-0.5">Jasa pangkas & perawatan</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Staff Kapster Aktif
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {data.barberSummaryList.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kapster terdaftar di toko</p>
        </div>
      </div>

      {/* Barber Summary Cards Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-500" />
          Rincian Bagi Hasil per Kapster
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.barberSummaryList.map((barber: any) => (
            <div
              key={barber.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {barber.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    {barber.totalServices} Treatment
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{barber.email}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    Total Hak Komisi
                  </span>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                    Rp {barber.totalCommission.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenSlip(barber)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                <span>Cetak Slip Komisi</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Histori Transaksi Komisi
          </h3>
          <span className="text-xs text-slate-500">
            {data.commissions.length} catatan komisi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Kapster</th>
                <th className="py-3 px-4">Layanan Jasa</th>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Rate (%)</th>
                <th className="py-3 px-4 text-right">Nominal Komisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.commissions.length > 0 ? (
                data.commissions.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {c.staff?.name}
                    </td>
                    <td className="py-3 px-4">
                      {c.transactionItem?.product?.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {c.transactionItem?.transaction?.transactionNumber}
                    </td>
                    <td className="py-3 px-4">
                      {c.commissionType === "PERCENTAGE"
                        ? `${c.rate}%`
                        : `Rp ${Number(c.rate).toLocaleString("id-ID")}`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                      Rp {Number(c.amount).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    Belum ada transaksi jasa yang menghasilkan komisi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Slip Komisi Barber */}
      {showSlipModal && activeSlipBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-500" /> Pratinjau Slip Komisi
              </span>
              <button
                onClick={() => setShowSlipModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-4 text-xs font-mono">
              <div className="text-center border-b pb-3 space-y-0.5">
                <h3 className="text-base font-black uppercase">
                  SLIP KOMISI KAPSTER
                </h3>
                <p className="text-[11px] text-slate-500">
                  Nama Staff: {activeSlipBarber.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  Periode: {data.dateRange.from} &mdash; {data.dateRange.to}
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between border-b pb-1 text-slate-500">
                  <span>Item Jasa</span>
                  <span>Komisi</span>
                </div>
                {activeSlipBarber.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-1">
                    <span className="truncate max-w-[200px]">
                      {item.transactionItem?.product?.name}
                    </span>
                    <span className="font-bold">
                      Rp {Number(item.amount).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-300 flex justify-between items-center text-sm font-black">
                <span>TOTAL DITERIMA:</span>
                <span className="text-amber-600">
                  Rp {activeSlipBarber.totalCommission.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
