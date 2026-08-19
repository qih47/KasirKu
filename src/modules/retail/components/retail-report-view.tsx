"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  Barcode,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

export function RetailReportView() {
  const kpi = {
    basketSize: "4.8 Pcs / Trx",
    avgScanSpeed: "1.4 Menit",
    totalStockValuation: "Rp 48.250.000",
    shiftDiscrepancy: "Rp 0 (Match)",
  };

  const fastMovingSku = [
    { sku: "8992753011", name: "Sania Minyak Goreng 2L", salesQty: 184, turnover: "2.4 Hari" },
    { sku: "8991002301", name: "Indomie Goreng Spesial (Dus)", salesQty: 142, turnover: "3.1 Hari" },
    { sku: "8998866102", name: "Ultra Milk Cokelat 1L", salesQty: 96, turnover: "4.0 Hari" },
    { sku: "8997001409", name: "Chitato Sapi Panggang 68g", salesQty: 88, turnover: "4.5 Hari" },
  ];

  const deadStockSku = [
    { sku: "8990012991", name: "Kopi Sachet Premium Jar 200g", stockQty: 24, lastSold: "> 35 Hari Lalu", val: "Rp 840.000" },
    { sku: "8993344119", name: "Sabun Mandi Import Lavender", stockQty: 18, lastSold: "> 42 Hari Lalu", val: "Rp 450.000" },
  ];

  const categoryMargin = [
    { name: "Snack & Biskuit", margin: 34, color: "bg-emerald-500" },
    { name: "Minuman Dingin & RTD", margin: 28, color: "bg-blue-500" },
    { name: "Perawatan Tubuh & Sabun", margin: 24, color: "bg-purple-500" },
    { name: "Sembako (Minyak, Beras, Gula)", margin: 12, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/20">
            🛒
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              Analitik Vertikal: Supermarket &amp; Retail Mart
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Live Module
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analisis perputaran inventori SKU (Fast Moving vs Dead Stock), margin kategori, dan kecepatan transaksi.
            </p>
          </div>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Basket Size (Item / Struk)
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.basketSize}
          </div>
          <p className="text-[10px] text-slate-500">Rata-rata belanja keranjang</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Kecepatan Scan Transaksi
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {kpi.avgScanSpeed}
          </div>
          <p className="text-[10px] text-slate-500">Waktu checkout per pelanggan</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Valuasi Nilai Stok Toko
          </span>
          <div className="text-xl sm:text-2xl font-black text-indigo-600">
            {kpi.totalStockValuation}
          </div>
          <p className="text-[10px] text-slate-500">Total aset barang siap jual</p>
        </div>

        <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Audit Selisih Kasir Shift
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {kpi.shiftDiscrepancy}
          </div>
          <p className="text-[10px] text-slate-500">Uang fisik laci kas vs sistem</p>
        </div>
      </div>

      {/* 2. Fast Moving vs Dead Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fast Moving Leaderboard */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Top 4 Fast-Moving SKU (Paling Cepat Laku)
              </h4>
              <p className="text-xs text-slate-400">
                Produk dengan perputaran paling cepat yang wajib dijaga stoknya.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {fastMovingSku.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {item.name}
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-400">
                    SKU: {item.sku} • Habis dlm {item.turnover}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                  {item.salesQty} Terjual
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dead Stock Warning */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Dead-Stock Alert (Barang Mengendap &gt; 30 Hari)
              </h4>
              <p className="text-xs text-slate-400">
                Produk yang tidak terjual dalam 30 hari terakhir. Disarankan buat promo diskon.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {deadStockSku.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold">
                    ⚠️ Sisa Stok: {item.stockQty} Pcs ({item.lastSold})
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
                  Valuasi: {item.val}
                </span>
              </div>
            ))}
          </div>

          {/* Margin Kategori */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Persentase Margin Keuntungan per Kategori
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {categoryMargin.map((c, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-500 block truncate">{c.name}</span>
                  <strong className="text-emerald-600 font-black">+{c.margin}% Margin</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
