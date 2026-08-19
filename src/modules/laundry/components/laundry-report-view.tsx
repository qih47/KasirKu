"use client";

import { useState } from "react";
import {
  Shirt,
  Scale,
  Clock,
  Sparkles,
  Layers,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export function LaundryReportView({ data }: { data?: any }) {
  const kpi = {
    totalWeightKg: data?.totalWeightKg || "324.50 Kg",
    totalSatuanPcs: data?.totalSatuanPcs || "39 Pcs",
    avgWeightPerOrder: data?.avgWeightPerOrder || "4.2 Kg",
    onTimeSlaPercent: data?.onTimeSlaPercent || "96.4%",
    pendingRackPickup: data?.pendingPickup || "4 Nota",
  };

  const dailyWeightTrend = [
    { day: "Sen", kg: 42.5 },
    { day: "Sel", kg: 38.0 },
    { day: "Rab", kg: 45.5 },
    { day: "Kam", kg: 39.0 },
    { day: "Jum", kg: 52.0 },
    { day: "Sab", kg: 61.5 },
    { day: "Min", kg: 46.0 },
  ];

  const packageBreakdown = [
    { name: "Cuci Kiloan", percent: data?.kiloanOrders ? Math.round((data.kiloanOrders / (data.kiloanOrders + (data.satuanOrders || 0) || 1)) * 100) : 62, count: data?.totalWeightKg || "201 Kg", color: "bg-purple-500" },
    { name: "Cuci Satuan / Dry Clean", percent: data?.satuanOrders ? Math.round((data.satuanOrders / ((data.kiloanOrders || 0) + data.satuanOrders || 1)) * 100) : 38, count: data?.totalSatuanPcs || "39 Pcs", color: "bg-indigo-500" },
  ];

  const fragranceDistribution = [
    { name: "Lavender Fresh", percent: 46, tag: "Paling Diminati" },
    { name: "Sakura Blossom", percent: 34, tag: "Favorit Wanita" },
    { name: "Ocean Breeze", percent: 20, tag: "Aroma Segar" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/20">
            🧺
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              Analitik Vertikal: Laundry Service (Kiloan &amp; Satuan)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Live Module
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Volume berat timbangan Kg, ketepatan waktu penyelesaian (SLA), paket laundry, dan aroma parfum.
            </p>
          </div>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Volume Timbangan
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.totalWeightKg}
          </div>
          <p className="text-[10px] text-slate-500">Total berat pakaian masuk</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Berat / Nota
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.avgWeightPerOrder}
          </div>
          <p className="text-[10px] text-slate-500">Ukuran rata-rata keranjang cucian</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Ketepatan Waktu (On-Time SLA)
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {kpi.onTimeSlaPercent}
          </div>
          <p className="text-[10px] text-slate-500">Selesai sesuai janji estimasi nota</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cucian di Rak &gt; 3 Hari
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {kpi.pendingRackPickup}
          </div>
          <p className="text-[10px] text-slate-500">Siap diambil tapi belum diambil</p>
        </div>
      </div>

      {/* 2. Charts Section: Tren Timbangan Harian + Paket Laundry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Weight Volume Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-500" />
                Tren Volume Berat Cucian Masuk (Kg)
              </h4>
              <p className="text-xs text-slate-400">
                Fluktuasi timbangan pakaian kiloan per hari dalam seminggu terakhir.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60">
              Puncak: Sabtu (61.5 Kg)
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
            {dailyWeightTrend.map((item: any, idx: number) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {item.kg}k
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-indigo-500 transition-all duration-300 hover:brightness-110 shadow-sm"
                  style={{ height: `${Math.max(16, (item.kg / 65) * 120)}px` }}
                />
                <span className="text-[10px] font-bold text-slate-400 pt-1">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Package & Fragrance Breakdown */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shirt className="w-4 h-4 text-purple-500" />
              Komposisi Paket Cucian
            </h4>
            <div className="space-y-2">
              {packageBreakdown.map((pkg: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{pkg.name}</span>
                    <span className="font-mono text-slate-900 dark:text-white">{pkg.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${pkg.color || "bg-purple-500"} h-full rounded-full`} style={{ width: `${pkg.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              Distribusi Aroma Parfum Terfavorit
            </h4>
            <div className="space-y-2">
              {fragranceDistribution.map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    🌸 {f.name}
                  </span>
                  <span className="font-extrabold text-purple-600">
                    {f.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
