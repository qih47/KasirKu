"use client";

import { useState, useEffect } from "react";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";
import Link from "next/link";
import {
  DashboardWidgetItem,
  WidgetColSpan,
  DEFAULT_DASHBOARD_LAYOUT,
} from "@/modules/dashboard/widget-types";
import { WIDGET_DEFINITIONS } from "@/modules/dashboard/widget-registry";
import { saveTenantDashboardWidgetsAction } from "@/modules/dashboard/widget-actions";
import {
  Clock,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Receipt,
  Zap,
  SlidersHorizontal,
  Plus,
  Save,
  RotateCcw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  MoveLeft,
  MoveRight,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
  Coffee,
  Scissors,
  Shirt,
  ShoppingBag,
  Flame,
  Target,
  ChevronRight,
  Store,
} from "lucide-react";

interface DynamicDashboardGridProps {
  initialWidgets?: DashboardWidgetItem[];
  metricsData: {
    tenantName: string;
    outletName: string;
    activeTierName: string;
    activePlugins: string[];
    todayRevenue: number;
    todayTransactionsCount: number;
    yesterdayRevenue?: number;
    weeklyTrends: { day: string; revenue: number; transactions: number }[];
    recentTransactions: any[];
    lowStockProducts: any[];
    cafeStats?: { totalTables: number; occupied: number; available: number };
    barberStats?: { activeChairs: number; queueCount: number };
    laundryStats?: { todayWeightKg: number; pendingOrders: number };
  };
}

export function DynamicDashboardGrid({
  initialWidgets,
  metricsData,
}: DynamicDashboardGridProps) {
  const [widgets, setWidgets] = useState<DashboardWidgetItem[]>(
    initialWidgets && initialWidgets.length > 0
      ? initialWidgets
      : DEFAULT_DASHBOARD_LAYOUT
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      await saveTenantDashboardWidgetsAction(widgets);
      toastSuccess("Tata letak widget dashboard berhasil disimpan!");
      setIsCustomizing(false);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan tata letak widget.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    const ok = await swalConfirm(
      "Reset Tata Letak?",
      "Kembalikan ke susunan widget standar bawaan?",
      { confirmText: "Ya, Reset", isDanger: false }
    );
    if (ok) setWidgets(DEFAULT_DASHBOARD_LAYOUT);
  };

  const handleRemoveWidget = (instanceId: string) => {
    setWidgets((prev) => prev.filter((w) => w.instanceId !== instanceId));
  };

  const handleChangeColSpan = (instanceId: string, newSpan: WidgetColSpan) => {
    setWidgets((prev) =>
      prev.map((w) => (w.instanceId === instanceId ? { ...w, colSpan: newSpan } : w))
    );
  };

  const handleMoveWidget = (index: number, direction: "LEFT" | "RIGHT") => {
    const targetIdx = direction === "LEFT" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setWidgets(updated);
  };

  const handleAddWidget = (widgetKey: string) => {
    const def = WIDGET_DEFINITIONS.find((d) => d.key === widgetKey);
    if (!def) return;

    const newWidget: DashboardWidgetItem = {
      instanceId: `w-${Date.now()}`,
      widgetKey: def.key,
      colSpan: def.defaultColSpan,
      order: widgets.length,
    };

    setWidgets((prev) => [...prev, newWidget]);
    setShowAddWidgetModal(false);
  };

  const getColSpanClass = (span: WidgetColSpan) => {
    switch (span) {
      case 1:
        return "col-span-1";
      case 2:
        return "col-span-1 md:col-span-2";
      case 3:
        return "col-span-1 md:col-span-3";
      case 4:
        return "col-span-1 md:col-span-2 lg:col-span-4";
      default:
        return "col-span-1";
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER INDIVIDUAL WIDGET COMPONENTS
  // ─────────────────────────────────────────────────────────────
  const renderWidgetContent = (widget: DashboardWidgetItem) => {
    switch (widget.widgetKey) {
      // 1. Digital Clock & Store Status
      case "WIDGET_DIGITAL_CLOCK": {
        const timeStr = currentTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const dateStr = currentTime.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <Clock className="w-4 h-4" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Buka Operasional
              </span>
            </div>

            <div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {timeStr}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {dateStr}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>📍 {metricsData.outletName}</span>
              <span className="font-bold text-indigo-600">{metricsData.activeTierName}</span>
            </div>
          </div>
        );
      }

      // 2. Revenue Today
      case "WIDGET_REVENUE_TODAY": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Hari Ini
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Total Omzet Penjualan
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                Rp {metricsData.todayRevenue.toLocaleString("id-ID")}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                <strong>{metricsData.todayTransactionsCount}</strong> Transaksi
              </span>
              <span className="text-emerald-600 font-bold">100% Lunas</span>
            </div>
          </div>
        );
      }

      // 3. Daily Target Gauge
      case "WIDGET_DAILY_TARGET": {
        const targetAmount = 5000000;
        const percent = Math.min(100, Math.round((metricsData.todayRevenue / targetAmount) * 100));

        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Target className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-amber-600">
                {percent}% Tercapai
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Target Omzet Harian
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                Rp {metricsData.todayRevenue.toLocaleString("id-ID")} / <span className="text-slate-400 text-sm">5 Jt</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
              {percent >= 100 ? "🎉 Luar biasa! Target harian terpenuhi!" : "Semangat! Tingkatkan transaksi kasir hari ini."}
            </p>
          </div>
        );
      }

      // 4. Quick Actions
      case "WIDGET_QUICK_ACTIONS": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                <Zap className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Aksi Cepat
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/pos"
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold text-xs shadow-sm transition flex flex-col items-center justify-center gap-1"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Buka Kasir</span>
              </Link>
              <Link
                href="/dashboard/products"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-center font-bold text-xs transition flex flex-col items-center justify-center gap-1"
              >
                <Package className="w-4 h-4" />
                <span>+ Produk</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link href="/dashboard/reports" className="font-bold text-indigo-600 hover:underline">
                Lihat Laporan &rarr;
              </Link>
              <Link href="/dashboard/settings" className="text-slate-400 hover:text-slate-600">
                Pengaturan
              </Link>
            </div>
          </div>
        );
      }

      // 5. 7 Days Trend Chart
      case "WIDGET_CHART_7DAYS": {
        const maxRev = Math.max(...metricsData.weeklyTrends.map((w) => w.revenue), 100000);

        return (
          <div className="h-full flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Grafik Penjualan 7 Hari Terakhir
                </h4>
                <p className="text-xs text-slate-400">
                  Pergerakan omzet toko per hari dalam seminggu.
                </p>
              </div>
              <Link
                href="/dashboard/reports"
                className="text-xs font-bold text-indigo-600 hover:underline hidden sm:block"
              >
                Detail Laporan &rarr;
              </Link>
            </div>

            {/* SVG Bar Visual */}
            <div className="h-36 flex items-end justify-between gap-2 pt-2 px-1 border-b border-slate-100 dark:border-slate-800">
              {metricsData.weeklyTrends.map((t, idx) => {
                const heightPct = Math.max(12, Math.round((t.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition truncate max-w-[50px]">
                      {(t.revenue / 1000).toFixed(0)}k
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-300 hover:brightness-110 shadow-sm"
                      style={{ height: `${heightPct}px` }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 pt-1">
                      {t.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // 6. Recent Transactions Feed
      case "WIDGET_RECENT_TRANSACTIONS": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Live Feed Transaksi Kasir Terakhir
              </h4>
              <Link href="/dashboard/reports" className="text-xs font-bold text-indigo-600 hover:underline">
                Semua
              </Link>
            </div>

            <div className="space-y-2 flex-1 overflow-hidden">
              {metricsData.recentTransactions && metricsData.recentTransactions.length > 0 ? (
                metricsData.recentTransactions.slice(0, 4).map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-indigo-600 text-[11px] block">
                        {tx.transactionNumber || `TRX-${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                        {tx.itemsSummary || "Pesanan Item"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Rp {(tx.totalAmount || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="text-[9.5px] font-extrabold text-emerald-600">
                        {tx.paymentMethod || "PAID"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada transaksi hari ini. Buka kasir POS untuk memulai.
                </div>
              )}
            </div>
          </div>
        );
      }

      // 7. Low Stock Products Alert
      case "WIDGET_LOW_STOCK_ALERT": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Peringatan Stok Barang Kritis
              </h4>
              <Link href="/dashboard/products" className="text-xs font-bold text-indigo-600 hover:underline">
                Restok
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {metricsData.lowStockProducts && metricsData.lowStockProducts.length > 0 ? (
                metricsData.lowStockProducts.slice(0, 3).map((prod, idx) => (
                  <div
                    key={prod.id || idx}
                    className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Min. Alert: {prod.minStockAlert || 5} unit
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px]">
                      Sisa: {prod.stock} Pcs
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Semua stok produk aman di atas batas minimum.
                </div>
              )}
            </div>
          </div>
        );
      }

      // 8. Vertical Operational Status (Cafe/Barber/Laundry)
      case "WIDGET_VERTICAL_STATUS": {
        const isCafe = metricsData.activePlugins.includes("cafe");
        const isBarber = metricsData.activePlugins.includes("barbershop");
        const isLaundry = metricsData.activePlugins.includes("laundry");

        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                Live Operasional Vertikal Bisnis
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                {isCafe ? "☕ Modul Cafe" : isBarber ? "✂️ Modul Barber" : isLaundry ? "🧺 Modul Laundry" : "🛒 POS Universal"}
              </span>
            </div>

            {isCafe ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Meja Kosong</span>
                  <strong className="text-xl font-black text-emerald-600">
                    {metricsData.cafeStats?.available ?? 6} Meja
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Meja Terisi</span>
                  <strong className="text-xl font-black text-rose-600">
                    {metricsData.cafeStats?.occupied ?? 2} Meja
                  </strong>
                </div>
              </div>
            ) : isBarber ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Kursi Aktif</span>
                  <strong className="text-xl font-black text-cyan-600">
                    {metricsData.barberStats?.activeChairs ?? 3} Kursi
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Antrean Tunggu</span>
                  <strong className="text-xl font-black text-amber-600">
                    {metricsData.barberStats?.queueCount ?? 2} Orang
                  </strong>
                </div>
              </div>
            ) : isLaundry ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Timbangan Hari Ini</span>
                  <strong className="text-xl font-black text-purple-600">
                    {metricsData.laundryStats?.todayWeightKg ?? 42.5} Kg
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Proses Cuci</span>
                  <strong className="text-xl font-black text-indigo-600">
                    {metricsData.laundryStats?.pendingOrders ?? 5} Nota
                  </strong>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs text-center text-slate-500">
                Sistem POS Universal siap melayani seluruh cabang dan multi-kasir.
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Sync Real-time</span>
              <span className="font-bold text-emerald-600">🟢 Terhubung</span>
            </div>
          </div>
        );
      }

      // 9. Peak Hours Mini Heatmap
      case "WIDGET_PEAK_HOURS_MINI": {
        const peakMini = [
          { hour: "10:00", rate: 30 },
          { hour: "12:00", rate: 85 },
          { hour: "14:00", rate: 50 },
          { hour: "18:00", rate: 75 },
          { hour: "20:00", rate: 100 },
        ];

        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Mini Analitik Jam Ramai Hari Ini
              </h4>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                Puncak: 20:00
              </span>
            </div>

            <div className="h-28 flex items-end justify-between gap-2 pt-2 border-b border-slate-100 dark:border-slate-800">
              {peakMini.map((p, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      p.rate >= 90
                        ? "bg-orange-500"
                        : p.rate >= 60
                        ? "bg-amber-400"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                    style={{ height: `${(p.rate / 100) * 80}px` }}
                  />
                  <span className="text-[9.5px] font-mono text-slate-400">{p.hour}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return <div className="text-xs text-slate-400">Widget Component</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header Bar with Customize Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Dashboard Ringkasan Toko Dinamis
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Selamat Datang, {metricsData.tenantName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cabang Aktif: <span className="font-semibold text-slate-700 dark:text-slate-300">{metricsData.outletName}</span> &bull; Paket: <span className="font-bold text-indigo-600">{metricsData.activeTierName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCustomizing ? (
            <button
              onClick={() => setIsCustomizing(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kustomisasi Widget Grid ⚙️</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddWidgetModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Widget</span>
              </button>

              <button
                onClick={handleResetDefault}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold"
                title="Reset ke Bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSaveLayout}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Simpan Grid</span>
              </button>

              <button
                onClick={() => setIsCustomizing(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifikasi */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mode Kustomisasi Banner Helper */}
      {isCustomizing && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="font-extrabold">Mode Manajemen Grid Dashboard Aktif</p>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Gunakan kontrol di setiap kartu untuk <strong>mengubah lebar kolom (1x s/d 4x)</strong>, <strong>geser urutan</strong>, atau <strong>hapus widget</strong>. Klik <em>Simpan Grid</em> setelah selesai.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddWidgetModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow hover:bg-indigo-700 flex-shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Komponen
          </button>
        </div>
      )}

      {/* 4-Column Responsive Grid Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget, idx) => {
          const def = WIDGET_DEFINITIONS.find((d) => d.key === widget.widgetKey);
          const colClass = getColSpanClass(widget.colSpan);

          return (
            <div
              key={widget.instanceId}
              className={`${colClass} p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${
                isCustomizing
                  ? "border-dashed border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-500/10 bg-indigo-50/10"
                  : "border-slate-200 dark:border-slate-800 hover:shadow-md"
              }`}
            >
              {/* Customize Mode Controls Header */}
              {isCustomizing && (
                <div className="pb-3 mb-3 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-indigo-600 text-[11px] truncate">
                    #{idx + 1} {def?.title || widget.widgetKey}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Width options */}
                    {def?.allowedColSpans.map((span) => (
                      <button
                        key={span}
                        onClick={() => handleChangeColSpan(widget.instanceId, span)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          widget.colSpan === span
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title={`Ubah ukuran ke ${span} Kolom`}
                      >
                        {span}x
                      </button>
                    ))}

                    {/* Move Left */}
                    <button
                      onClick={() => handleMoveWidget(idx, "LEFT")}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                      title="Geser ke Kiri/Atas"
                    >
                      <MoveLeft className="w-3 h-3" />
                    </button>

                    {/* Move Right */}
                    <button
                      onClick={() => handleMoveWidget(idx, "RIGHT")}
                      disabled={idx === widgets.length - 1}
                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                      title="Geser ke Kanan/Bawah"
                    >
                      <MoveRight className="w-3 h-3" />
                    </button>

                    {/* Delete Widget */}
                    <button
                      onClick={() => handleRemoveWidget(widget.instanceId)}
                      className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 ml-1"
                      title="Hapus Widget dari Dashboard"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Widget Content Body */}
              <div className="min-h-[140px] flex flex-col justify-between">
                {renderWidgetContent(widget)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Galeri Tambah Widget */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Galeri Komponen Widget Dashboard
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih komponen statistik atau utilitas yang ingin ditambahkan ke layar ringkasan toko.
                </p>
              </div>
              <button
                onClick={() => setShowAddWidgetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {WIDGET_DEFINITIONS.map((def) => {
                const isAlreadyAdded = widgets.some((w) => w.widgetKey === def.key);

                return (
                  <div
                    key={def.key}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition space-y-2 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {def.title}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                          {def.defaultColSpan} Kolom
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {def.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddWidget(def.key)}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAlreadyAdded ? "Tambah Lagi" : "Tambahkan ke Grid"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
