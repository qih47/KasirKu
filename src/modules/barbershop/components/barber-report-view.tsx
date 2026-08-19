"use client";

import { useState } from "react";
import {
  Scissors,
  Users,
  Percent,
  Award,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export function BarberReportView({ data }: { data?: any }) {
  const [selectedCapster, setSelectedCapster] = useState<string>("ALL");

  const kpi = {
    totalHeadsCut: data?.totalHeadsCut || 142,
    avgServiceDuration: "38 Menit",
    totalCommissionReady: data?.totalCommissionReady || "Rp 3.420.000",
    retailCrossSellRate: "34%",
  };

  const capsterPerformance = data?.capsterPerformance && data.capsterPerformance.length > 0 ? data.capsterPerformance : [
    { name: "Hendra (Senior)", cuts: 54, revenue: 3510000, commission: 1228500, rating: "4.9" },
    { name: "Dimas Prasetyo", cuts: 46, revenue: 2760000, commission: 966000, rating: "4.8" },
    { name: "Rizky Firmansyah", cuts: 42, revenue: 2310000, commission: 808500, rating: "4.7" },
  ];

  const serviceVsProduct = data?.serviceVsProduct && data.serviceVsProduct.length > 0 ? data.serviceVsProduct : [
    { name: "Jasa Treatment & Potong Rambut", amount: 8580000, percent: 78, color: "bg-cyan-500" },
    { name: "Produk Retail (Pomade & Tonic)", amount: 2420000, percent: 22, color: "bg-amber-500" },
  ];

  const chairBusyness = [
    { chair: "Kursi #01 (Hendra)", util: 88, queueAvg: "12 mnt" },
    { chair: "Kursi #02 (Dimas)", util: 74, queueAvg: "8 mnt" },
    { chair: "Kursi #03 (Rizky)", util: 68, queueAvg: "5 mnt" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-600/20">
            ✂️
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              Analitik Vertikal: Barbershop &amp; Salon
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                Live Module
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kinerja kapster, perhitungan komisi bagi hasil, okupansi kursi cukur, dan penjualan pomade.
            </p>
          </div>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Kepala Dicukur
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.totalHeadsCut} Pelanggan
          </div>
          <p className="text-[10px] text-slate-500">Periode laporan aktif</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Durasi Potong
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.avgServiceDuration}
          </div>
          <p className="text-[10px] text-slate-500">Per kepala termasuk hair wash</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Komisi Siap Cair
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {kpi.totalCommissionReady}
          </div>
          <p className="text-[10px] text-slate-500">Akumulasi komisi bagi hasil kapster</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cross-Sell Pomade &amp; Tonic
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.retailCrossSellRate}
          </div>
          <p className="text-[10px] text-slate-500">Konversi belanja produk takeaway</p>
        </div>
      </div>

      {/* 2. Capster Leaderboard & Commission Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-500" />
                Leaderboard Kinerja &amp; Rekap Komisi Kapster
              </h4>
              <p className="text-xs text-slate-400">
                Pencapaian omzet, jumlah pelanggan yang dilayani, dan komisi bersih yang diperoleh masing-masing stylist.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {capsterPerformance.map((c: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <strong className="text-xs font-black text-slate-900 dark:text-white block">
                        {c.name}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {c.cuts} Pelanggan • Rating ⭐ {c.rating || "4.9"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 block">
                      Komisi: Rp {Number(c.commission || 0).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Omzet: Rp {Number(c.revenue || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Progress bar ratio to top performer */}
                <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (c.cuts / 50) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chair Utilization & Revenue Ratio */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-cyan-500" />
              Utilisasi Kursi Cukur
            </h4>
            <div className="space-y-2.5">
              {chairBusyness.map((ch: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{ch.chair}</span>
                    <span className="text-cyan-600">{ch.util}% Terisi</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${ch.util}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              Jasa vs Produk Retail
            </h4>
            <div className="space-y-2">
              {serviceVsProduct.map((sp: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{sp.name}</span>
                    <span className="font-mono text-slate-900 dark:text-white">{sp.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${sp.color || "bg-cyan-500"} h-full rounded-full`} style={{ width: `${sp.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
