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

export function RetailReportView({ data }: { data?: any }) {
  const kpi = {
    basketSize: data?.basketSize || "0 Pcs / Trx",
    avgScanSpeed: data?.avgScanSpeed || "-",
    totalStockValuation: data?.totalStockValuation || "Rp 0",
    totalStockUnits: data?.totalStockUnits || 0,
    shiftDiscrepancy: "Rp 0",
  };

  const fastMovingSku = data?.fastMovingSku || [];
  const deadStockSku = data?.deadStockSku || [];
  const categoryMargin = data?.categoryMargin || [];

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
            Valuasi Nilai Stok
          </span>
          <div className="text-xl sm:text-2xl font-black text-indigo-600">
            {kpi.totalStockValuation}
          </div>
          <p className="text-[10px] text-slate-500">{kpi.totalStockUnits} unit total stok fisik</p>
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
                Top Fast-Moving SKU (Paling Cepat Laku)
              </h4>
              <p className="text-xs text-slate-400">
                Produk dengan perputaran paling cepat yang wajib dijaga stoknya.
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {fastMovingSku.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada data produk terjual pada periode ini.</p>
            ) : (
              fastMovingSku.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {item.name}
                    </span>
                    <span className="font-mono text-[9.5px] text-slate-400">
                      SKU: {item.sku} • Stok: {item.stockQty ?? 0}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                    {item.salesQty} Terjual
                  </span>
                </div>
              ))
            )}
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
                Produk yang belum terjual dalam periode ini. Disarankan buat promo diskon.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {deadStockSku.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada dead-stock terdeteksi.</p>
            ) : (
              deadStockSku.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {item.name}
                    </span>
                    <span className="font-mono text-[9.5px] text-slate-400">
                      Stok: {item.stockQty ?? 0} unit
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200/50">
                    {item.val || "Perlu Promo"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Margin Kategori */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
              Persentase Margin Keuntungan per Kategori
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {categoryMargin.map((c: any, idx: number) => (
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
