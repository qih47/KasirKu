"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  Receipt,
  Users,
  TrendingUp,
  ShoppingBag,
  Clock,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Store,
  Scissors,
  Coffee,
  Shirt,
  BarChart3,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useDynamicTheme, BUILTIN_THEME_PRESETS } from "@/components/theme/dynamic-theme-provider";
import { DashboardWidgetId } from "@/types/plugin-package";

export interface DashboardMetricsData {
  tenantName: string;
  userName: string;
  isTrial: boolean;
  tierName: string;
  outletsCount: number;
  maxOutlets: number | null;
  usersCount: number;
  activePlugins: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  todayRevenue: number;
  todayTransactionsCount: number;
  averageOrderValue: number;
  weeklySalesTrend?: Array<{
    day: string;
    amount: number;
  }>;
  activeShiftStatus: {
    isOpen: boolean;
    cashierName?: string;
    openedAt?: string;
    openingCash?: number;
  };
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    customerName?: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category?: string;
    soldQty: number;
    revenue: number;
  }>;
}

export function DynamicDashboardRenderer({
  data,
}: {
  data: DashboardMetricsData;
}) {
  const primaryColor = "var(--theme-primary, #6366f1)";
  const accentColor = "var(--theme-accent, #818cf8)";
  const radius = "var(--theme-radius, 1.25rem)";
  const cardBorder = "var(--theme-card-border, #1e293b)";
  const cardBg = "var(--theme-card-bg, #111a2e)";
  const textPrimary = "var(--theme-text-primary, #f8fafc)";
  const textSecondary = "var(--theme-text-secondary, #94a3b8)";
  const innerBoxBg = "var(--theme-inner-bg, #0f172a)";


  const getPluginIcon = (code: string) => {
    switch (code) {
      case "barbershop":
        return <Scissors className="w-4 h-4 text-amber-500" />;
      case "cafe":
        return <Coffee className="w-4 h-4 text-emerald-500" />;
      case "retail":
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case "laundry":
        return <Shirt className="w-4 h-4 text-purple-500" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-500" />;
    }
  };

  // Render individual registered widget
  const renderWidget = (widgetId: string, colSpan: number = 12) => {
    const spanClass =
      colSpan === 3
        ? "col-span-12 sm:col-span-6 lg:col-span-3"
        : colSpan === 4
        ? "col-span-12 md:col-span-4"
        : colSpan === 6
        ? "col-span-12 lg:col-span-6"
        : colSpan === 7
        ? "col-span-12 lg:col-span-7"
        : colSpan === 8
        ? "col-span-12 lg:col-span-8"
        : "col-span-12";

    switch (widgetId as DashboardWidgetId) {
      case "dashboard.kpi_revenue":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-5 border shadow-sm flex items-center justify-between transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: textSecondary }}>
                Total Omzet Hari Ini
              </span>
              <p className="text-xl sm:text-2xl font-black" style={{ color: textPrimary }}>
                Rp {data.todayRevenue.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>Real-time Database</span>
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        );

      case "dashboard.kpi_transactions":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-5 border shadow-sm flex items-center justify-between transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: textSecondary }}>
                Transaksi Hari Ini
              </span>
              <p className="text-xl sm:text-2xl font-black" style={{ color: textPrimary }}>
                {data.todayTransactionsCount} Struk
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                <span>Tercatat di Kasir</span>
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: "#10b98120", color: "#10b981" }}
            >
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        );

      case "dashboard.kpi_average_order":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-5 border shadow-sm flex items-center justify-between transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: textSecondary }}>
                Rata-rata Order (AOV)
              </span>
              <p className="text-xl sm:text-2xl font-black" style={{ color: textPrimary }}>
                Rp {data.averageOrderValue.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                <TrendingUp className="w-3 h-3" />
                <span>Rata-rata Keranjang</span>
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: "#8b5cf620", color: "#8b5cf6" }}
            >
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        );

      case "dashboard.kpi_active_shift":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-5 border shadow-sm flex items-center justify-between transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: textSecondary }}>
                Shift Kasir
              </span>
              <p className="text-base font-black flex items-center gap-1.5" style={{ color: textPrimary }}>
                <span className={`w-2 h-2 rounded-full ${data.activeShiftStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
                {data.activeShiftStatus.isOpen ? "Shift Buka" : "Shift Tertutup"}
              </p>
              <p className="text-[10px] font-medium" style={{ color: textSecondary }}>
                {data.activeShiftStatus.cashierName || "Kasir"} &bull; Modal Rp {(data.activeShiftStatus.openingCash || 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: "#f59e0b20", color: "#f59e0b" }}
            >
              <Clock className="w-6 h-6" />
            </div>
          </div>
        );

      case "dashboard.sales_chart":
        const maxVal = Math.max(...(data.weeklySalesTrend?.map((w) => w.amount) || [1]), 1);
        const totalWeeklyRevenue = data.weeklySalesTrend?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        return (
          <div
            key={widgetId}
            className={`${spanClass} p-6 border shadow-sm space-y-4 transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <div className="space-y-0.5">
                <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                  📈 Tren Penjualan 7 Hari Terakhir
                </h3>
                <p className="text-[11px]" style={{ color: textSecondary }}>
                  Total 7 hari: Rp {totalWeeklyRevenue.toLocaleString("id-ID")}
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Data Real-time DB
              </span>
            </div>

            {/* Visual Bar Graph from Real Data */}
            <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
              {(data.weeklySalesTrend || [
                { day: "Sen", amount: 0 },
                { day: "Sel", amount: 0 },
                { day: "Rab", amount: 0 },
                { day: "Kam", amount: 0 },
                { day: "Jum", amount: 0 },
                { day: "Sab", amount: 0 },
                { day: "Min", amount: 0 },
              ]).map((item, idx) => {
                const heightPercent = maxVal > 0 && item.amount > 0 ? Math.round((item.amount / maxVal) * 85) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity font-mono" style={{ color: textSecondary }}>
                      {item.amount >= 1000000 ? `${(item.amount / 1000000).toFixed(1)}jt` : item.amount >= 1000 ? `${Math.round(item.amount / 1000)}k` : item.amount}
                    </span>
                    <div
                      className="w-full rounded-t-xl transition-all duration-300 group-hover:brightness-125"
                      style={{
                        height: `${Math.max(heightPercent, 6)}%`,
                        backgroundColor: item.amount > 0 ? primaryColor : `${primaryColor}20`,
                      }}
                    />
                    <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "dashboard.recent_transactions":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-6 border shadow-sm space-y-4 transition-all flex flex-col justify-between`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
                <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                  🧾 Transaksi Terbaru
                </h3>
                <Link href="/pos/history" className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>
                  Lihat Semua &rarr;
                </Link>
              </div>

              {data.recentTransactions.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl" style={{ borderColor: cardBorder }}>
                  <p className="text-xs font-semibold" style={{ color: textSecondary }}>
                    Belum ada transaksi tercatat.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.recentTransactions.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 border flex items-center justify-between gap-2 transition"
                      style={{
                        backgroundColor: innerBoxBg,
                        borderColor: cardBorder,
                        borderRadius: `calc(${radius} * 0.7)`,
                      }}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold truncate font-mono" style={{ color: textPrimary }}>
                          {t.receiptNumber}
                        </p>
                        <p className="text-[10px]" style={{ color: textSecondary }}>
                          {t.paymentMethod} &bull; {t.createdAt}
                        </p>
                      </div>
                      <span className="font-black text-xs font-mono flex-shrink-0" style={{ color: primaryColor }}>
                        Rp {t.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/pos"
              className="w-full py-2.5 text-center text-xs font-bold rounded-xl text-white shadow-sm transition flex items-center justify-center gap-1.5 mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Buka POS Kasir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );

      case "dashboard.top_products":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-6 border shadow-sm space-y-4 transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
              <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                ⭐ Menu &amp; Produk Terlaris
              </h3>
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Top Ranked
              </span>
            </div>

            {data.topProducts.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl" style={{ borderColor: cardBorder }}>
                <p className="text-xs font-semibold" style={{ color: textSecondary }}>
                  Belum ada produk yang terjual.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.topProducts.map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 border flex items-center gap-3 transition"
                    style={{
                      backgroundColor: innerBoxBg,
                      borderColor: cardBorder,
                      borderRadius: `calc(${radius} * 0.7)`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: idx === 0 ? "#f59e0b" : idx === 1 ? primaryColor : "#64748b" }}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>
                        {prod.name}
                      </p>
                      <p className="text-[10px] font-semibold" style={{ color: textSecondary }}>
                        {prod.soldQty} Terjual &bull; Rp {prod.revenue.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "dashboard.quick_shortcuts":
        return (
          <div
            key={widgetId}
            className={`${spanClass} p-5 border shadow-sm space-y-3 transition-all`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderRadius: radius,
            }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textSecondary }}>
              ⚡ Navigasi Pintas Operasional
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/pos"
                className="p-3.5 border rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
              >
                <div className="p-2 rounded-xl text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: textPrimary }}>Kasir POS</p>
                  <p className="text-[10px]" style={{ color: textSecondary }}>Layanan Kasir</p>
                </div>
              </Link>

              <Link
                href="/dashboard/products"
                className="p-3.5 border rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
              >
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: textPrimary }}>Katalog Produk</p>
                  <p className="text-[10px]" style={{ color: textSecondary }}>Stok &amp; Harga</p>
                </div>
              </Link>

              <Link
                href="/dashboard/receipt-designer"
                className="p-3.5 border rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
              >
                <div className="p-2 rounded-xl bg-purple-500 text-white shadow-sm">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: textPrimary }}>Desain Struk</p>
                  <p className="text-[10px]" style={{ color: textSecondary }}>Thermal Studio</p>
                </div>
              </Link>

              <Link
                href="/dashboard/reports"
                className="p-3.5 border rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
              >
                <div className="p-2 rounded-xl bg-blue-500 text-white shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: textPrimary }}>Laporan Omzet</p>
                  <p className="text-[10px]" style={{ color: textSecondary }}>Analisa Penjualan</p>
                </div>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const dashboardSlots = [
    { widget: "dashboard.kpi_revenue", order: 1, colSpan: 3 },
    { widget: "dashboard.kpi_transactions", order: 2, colSpan: 3 },
    { widget: "dashboard.kpi_average_order", order: 3, colSpan: 3 },
    { widget: "dashboard.kpi_active_shift", order: 4, colSpan: 3 },
    { widget: "dashboard.sales_chart", order: 5, colSpan: 8 },
    { widget: "dashboard.recent_transactions", order: 6, colSpan: 4 },
    { widget: "dashboard.top_products", order: 7, colSpan: 12 },
    { widget: "dashboard.quick_shortcuts", order: 8, colSpan: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner - Clean and Unified */}
      <div
        className="p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary, #6366f1) 0%, var(--theme-card-bg, #111a2e) 100%)`,
          borderRadius: radius,
          border: `1px solid var(--theme-card-border, #1e293b)`,
          boxShadow: `0 10px 30px -5px rgba(0,0,0,0.5)`,
        }}
      >

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem Kasir Aktif &bull; {data.tenantName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {data.userName}! 👋
          </h1>
          <p className="text-white/90 text-xs sm:text-sm max-w-xl leading-relaxed">
            Kelola transaksi kasir, pantau performa omzet harian, dan kustomisasi sistem bisnis Anda secara real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/pos"
            className="px-5 py-2.5 bg-white font-extrabold text-xs shadow-lg hover:bg-slate-50 transition flex items-center gap-2 rounded-xl"
            style={{ color: primaryColor }}
          >
            <span>Buka Kasir (POS)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Dynamic Grid Layout Slots */}
      <div className="grid grid-cols-12 gap-5">
        {dashboardSlots
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((slot) => renderWidget(slot.widget, slot.colSpan))}
      </div>
    </div>
  );
}

