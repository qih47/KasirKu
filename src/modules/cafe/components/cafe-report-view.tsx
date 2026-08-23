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

export function CafeReportView({ data }: { data?: any }) {
  const [selectedZone, setSelectedZone] = useState<string>("ALL");

  const kpi = {
    avgTableDuration: data?.avgTableDuration || "-",
    avgTicketPerTable: data?.avgTicketPerTable || "Rp 0",
    dineInRatio: data?.dineInRatio || 0,
    takeAwayRatio: data?.takeAwayRatio || 0,
    kotWastePercent: data?.kotWastePercent || "0%",
    totalTablesServed: data?.totalTables || 0,
    tableOccupancyPercent: data?.tableOccupancyPercent !== undefined ? `${data.tableOccupancyPercent}%` : "0%",
  };

  const categoryBreakdown = data?.categoryBreakdown || [];
  const topModifiers = data?.topModifiers || [];
  const hourlyOccupancy = data?.hourlyOccupancy || [];

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

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Area:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Semua Area Meja</option>
            <option value="INDOOR">Indoor AC</option>
            <option value="OUTDOOR">Outdoor Smoking</option>
            <option value="VIP">VIP Room</option>
          </select>
        </div>
      </div>

      {/* 4 Specialized F&B KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Okupansi Meja Aktif
          </span>
          <p className="text-2xl font-black text-amber-500">
            {kpi.tableOccupancyPercent}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {kpi.totalTablesServed} total meja terdaftar
          </p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rata-rata Tagihan Meja
          </span>
          <p className="text-2xl font-black text-indigo-500">
            {kpi.avgTicketPerTable}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Rata-rata pengeluaran per nota
          </p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rasio Dine-in vs Takeaway
          </span>
          <p className="text-2xl font-black text-emerald-500">
            {kpi.dineInRatio}% <span className="text-xs text-slate-400 font-normal">/ {kpi.takeAwayRatio}%</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Makan di Tempat vs Dibungkus</p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Durasi Rata-rata Tamu
          </span>
          <p className="text-2xl font-black text-pink-500">
            {kpi.avgTableDuration}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Sejak open table hingga bayar</p>
        </div>
      </div>

      {/* 2-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Occupancy Heatmap Bar */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Kepadatan Okupansi Meja (Hourly)
              </h4>
              <p className="text-xs text-slate-400">
                Pola jam sibuk makan siang (Lunch) dan makan malam (Dinner).
              </p>
            </div>
          </div>

          {/* SVG Bar Visual */}
          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
            {hourlyOccupancy.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data okupansi meja per jam pada periode ini.
              </div>
            ) : (
              hourlyOccupancy.map((item: any, idx: number) => (
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
              ))
            )}
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
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada data penjualan kategori.</p>
            ) : (
              categoryBreakdown.map((cat: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color || "bg-indigo-500"}`} />
                      {cat.name}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      Rp {Number(cat.amount).toLocaleString("id-ID")} ({cat.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color || "bg-indigo-500"} rounded-full`}
                      style={{ width: `${Math.min(100, cat.percent)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Kitchen Modifiers & Custom Notes Breakdown */}
      <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Preferensi &amp; Varian Modifikasi Terpopuler (Kitchen Add-ons)
            </h4>
            <p className="text-xs text-slate-400">
              Data preferensi racikan pelanggan (level gula, jenis susu nabati, extra shot).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topModifiers.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              Belum ada data varian add-ons pesanan dapur tercatat.
            </div>
          ) : (
            topModifiers.map((mod: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{mod.name}</p>
                  <span className="text-[11px] text-slate-400">{mod.count}x dipesan</span>
                </div>
                {mod.revenue > 0 ? (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +Rp {Number(mod.revenue).toLocaleString("id-ID")}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    Non-Berbayar
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
