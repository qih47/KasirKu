"use client";

import { useState } from "react";
import {
  Coffee,
  Clock,
  TrendingUp,
  DollarSign,
  Utensils,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Flame,
} from "lucide-react";

export function CafeReportView() {
  const [selectedZone, setSelectedZone] = useState<string>("ALL");

  // Mocked rich analytical metrics for F&B
  const kpi = {
    avgTableDuration: "48 Menit",
    avgTicketPerTable: "Rp 88.500",
    dineInRatio: 76,
    takeAwayRatio: 24,
    kotWastePercent: "0.6%",
    totalTablesServed: 184,
  };

  const hourlyOccupancy = [
    { hour: "08:00", rate: 25 },
    { hour: "10:00", rate: 45 },
    { hour: "12:00", rate: 95 }, // Peak Lunch
    { hour: "14:00", rate: 60 },
    { hour: "16:00", rate: 70 },
    { hour: "18:00", rate: 85 },
    { hour: "20:00", rate: 100 }, // Peak Dinner
    { hour: "22:00", rate: 40 },
  ];

  const categoryBreakdown = [
    { name: "Signature Coffee", amount: 4850000, percent: 45, color: "bg-amber-500" },
    { name: "Non-Coffee & Tea", amount: 2150000, percent: 20, color: "bg-emerald-500" },
    { name: "Main Course / Meals", amount: 2380000, percent: 22, color: "bg-indigo-500" },
    { name: "Pastry, Cake & Snacks", amount: 1400000, percent: 13, color: "bg-pink-500" },
  ];

  const topModifiers = [
    { name: "Oat Milk Substitute (+5k)", count: 142, revenue: 710000 },
    { name: "Extra Espresso Shot (+4k)", count: 98, revenue: 392000 },
    { name: "Less Sugar / Gula Aren", count: 210, revenue: 0 },
    { name: "Warm Up / Diangatkan", count: 64, revenue: 0 },
    { name: "Plant-Based Almond Milk (+6k)", count: 42, revenue: 252000 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Title Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            ☕
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              Analitik Vertikal: Cafe, F&amp;B &amp; Restoran
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Live Module
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Metrik khusus okupansi meja resto, rasio kategori menu, dan varian pesanan dapur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filter Zona:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold text-xs focus:outline-none"
          >
            <option value="ALL">Semua Area Meja</option>
            <option value="INDOOR">Indoor AC</option>
            <option value="OUTDOOR">Outdoor Garden</option>
            <option value="VIP">VIP Room</option>
          </select>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Avg Waktu Meja (Turnover)
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
            {kpi.avgTableDuration}
            <span className="text-[10px] font-bold text-emerald-600">Optimal</span>
          </div>
          <p className="text-[10px] text-slate-500">Waktu rata-rata per sesi billing tamu</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Belanja / Meja
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.avgTicketPerTable}
          </div>
          <p className="text-[10px] text-slate-500">{kpi.totalTablesServed} meja terlayani</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Dine-In vs Take-Away
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            {kpi.dineInRatio}% <span className="text-xs text-slate-400 font-medium">/ {kpi.takeAwayRatio}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex mt-1">
            <div className="bg-amber-500 h-full" style={{ width: `${kpi.dineInRatio}%` }} />
            <div className="bg-indigo-500 h-full" style={{ width: `${kpi.takeAwayRatio}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Kitchen Void / Waste Rate
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {kpi.kotWastePercent}
          </div>
          <p className="text-[10px] text-slate-500">Tingkat pembatalan tiket dapur</p>
        </div>
      </div>

      {/* 2. Charts Section: Okupansi Meja per Jam + Kategori Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Table Occupancy Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Grafik Okupansi &amp; Jam Sibuk Meja (Hourly Heatmap)
              </h4>
              <p className="text-xs text-slate-400">
                Tingkat keterisian meja dari jam operasional cafe (persentase meja penuh).
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60">
              Puncak: 20:00 (100%)
            </span>
          </div>

          {/* SVG Bar Visual */}
          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
            {hourlyOccupancy.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {item.rate}%
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    item.rate >= 90
                      ? "bg-gradient-to-t from-red-500 to-amber-500 shadow-md shadow-red-500/20"
                      : item.rate >= 60
                      ? "bg-gradient-to-t from-amber-500 to-amber-400"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                  style={{ height: `${Math.max(12, (item.rate / 100) * 120)}px` }}
                />
                <span className="text-[10px] font-mono text-slate-400 pt-1">
                  {item.hour}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Category Revenue Breakdown */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-indigo-500" />
              Komposisi Penjualan F&amp;B
            </h4>
            <p className="text-xs text-slate-400">
              Proporsi omzet minuman kopi, non-kopi, makanan, dan pastry.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                    {cat.name}
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    Rp {cat.amount.toLocaleString("id-ID")} ({cat.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`${cat.color} h-full rounded-full`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Top Modifiers & Add-ons Leaderboard */}
      <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Leaderboard Modifiers &amp; Add-on Minuman Terfavorit
            </h4>
            <p className="text-xs text-slate-400">
              Pilihan kustomisasi rasa yang paling sering dipilih pelanggan dan pendapatan ekstra yang dihasilkan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topModifiers.map((mod, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                  #{idx + 1} {mod.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Dipesan <strong className="text-slate-700 dark:text-slate-300">{mod.count}x</strong> sesi
                </span>
              </div>
              {mod.revenue > 0 ? (
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200/50">
                  +Rp {mod.revenue.toLocaleString("id-ID")}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Free Req
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
