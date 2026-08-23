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
  SlidersHorizontal,
  Plus,
  Save,
  RotateCcw,
  Trash2,
  MoveLeft,
  MoveRight,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Scissors,
  Armchair,
  Users,
  Award,
  ShoppingBag,
  Coffee,
  Utensils,
  QrCode,
  Shirt,
  Scale,
  Phone,
  AlertCircle,
  Layers,
  BookOpen,
  Building2,
  ArrowRightLeft,
  Monitor,
  Banknote,
  CreditCard,
  Coins,
  Target,
  Flame,
  Zap,
  Globe,
  Store,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";

interface DynamicDashboardGridProps {
  initialWidgets?: DashboardWidgetItem[];
  outlets?: any[];
  activeTierCode?: string;
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
    outletBreakdown?: any[];
    stockValuationRp?: number;
    fastMovingSku?: any[];
    cafeStats?: {
      totalTables: number;
      available: number;
      occupied: number;
      tablesList?: any[];
      kitchenPreparing?: number;
      kitchenReady?: number;
      recentSelfOrders?: any[];
    };
    barberStats?: {
      activeChairs: number;
      queueCount: number;
      waitingList?: any[];
      inProgressList?: any[];
      stylistLeaderboard?: any[];
    };
    laundryStats?: {
      todayWeightKg: number;
      todayUnitQty: number;
      pipeline?: {
        received: number;
        washing: number;
        ironing: number;
        ready: number;
        completed: number;
      };
      rackReadyList?: any[];
      topFragrance?: any[];
    };
    financialStats?: {
      cashIn: number;
      qrisIn: number;
      transferIn: number;
      edcIn: number;
      totalCommissionsMonth: number;
      activeShiftsCount: number;
    };
  };
}

export function DynamicDashboardGrid({
  initialWidgets,
  outlets = [],
  activeTierCode = "BASIC",
  metricsData,
}: DynamicDashboardGridProps) {
  const { tr } = useTranslation();
  const [widgets, setWidgets] = useState<DashboardWidgetItem[]>(
    initialWidgets && initialWidgets.length > 0
      ? initialWidgets
      : DEFAULT_DASHBOARD_LAYOUT
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [widgetCategoryFilter, setWidgetCategoryFilter] = useState<string>("ALL");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isMultiOutlet = outlets.length > 1;
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>(
    isMultiOutlet ? "ALL" : outlets[0]?.id || "ALL"
  );

  const [mounted, setMounted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      await saveTenantDashboardWidgetsAction(widgets);
      toastSuccess("Susunan widget berhasil disimpan!");
      setIsCustomizing(false);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan susunan widget.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    const ok = await swalConfirm(
      "Reset Susunan Widget?",
      "Kembalikan ke susunan awal?",
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
      customTitle: def.title,
    };

    setWidgets((prev) => [...prev, newWidget]);
    setToastMsg(`Widget "${def.title}" berhasil ditambahkan ke dashboard.`);
    setTimeout(() => setToastMsg(null), 3000);
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

  const filteredWidgetDefs = WIDGET_DEFINITIONS.filter((def) => {
    if (widgetCategoryFilter === "ALL") return true;
    if (widgetCategoryFilter === "BARBERSHOP") return def.requiredPlugin === "barbershop";
    if (widgetCategoryFilter === "CAFE") return def.requiredPlugin === "cafe";
    if (widgetCategoryFilter === "LAUNDRY") return def.requiredPlugin === "laundry";
    if (widgetCategoryFilter === "RETAIL") return def.requiredPlugin === "retail";
    if (widgetCategoryFilter === "MULTI_OUTLET") return def.category === "MULTI_OUTLET";
    if (widgetCategoryFilter === "FINANCIAL") return def.category === "FINANCIAL";
    return true;
  });

  const activeOutletObj = outlets.find((o) => o.id === selectedOutletFilter);
  const currentOutletDisplayName =
    selectedOutletFilter === "ALL"
      ? `Semua Cabang (${outlets.length} Outlet)`
      : activeOutletObj?.name || metricsData.outletName;

  const renderWidgetContent = (widget: DashboardWidgetItem) => {
    switch (widget.widgetKey) {
      case "WIDGET_DIGITAL_CLOCK": {
        const timeString = mounted
          ? currentTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "--:--:--";
        const dateString = mounted
          ? currentTime.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "...";

        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Clock className="w-4 h-4" />
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Outlet Buka
              </span>
            </div>
            <div>
              <div
                suppressHydrationWarning
                className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono"
              >
                {timeString}
              </div>
              <p
                suppressHydrationWarning
                className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5"
              >
                {dateString}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 truncate">
              {currentOutletDisplayName}
            </div>
          </div>
        );
      }
      case "WIDGET_REVENUE_TODAY": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Hari Ini
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Total Omzet
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                Rp {metricsData.todayRevenue.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                {metricsData.todayTransactionsCount} Transaksi
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Laba Bersih &uarr;
              </span>
            </div>
          </div>
        );
      }
      case "WIDGET_DAILY_TARGET": {
        const targetAmount = 5000000;
        const percent = Math.min(100, Math.round((metricsData.todayRevenue / targetAmount) * 100));
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Target className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-amber-600">{percent}% Tercapai</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Target Omzet Harian</span>
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
              {percent >= 100 ? "🎉 Luar biasa! Target harian terpenuhi!" : "Tingkatkan transaksi kasir hari ini."}
            </p>
          </div>
        );
      }
      case "WIDGET_QUICK_ACTIONS": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aksi Cepat</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/pos"
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold text-xs shadow-sm transition flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Buka Kasir</span>
              </Link>
              <Link
                href="/dashboard/products"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-center font-bold text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>+ Produk</span>
              </Link>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link href="/dashboard/reports" className="font-bold text-indigo-600 hover:underline">
                Laporan &rarr;
              </Link>
              <Link href="/dashboard/settings" className="text-slate-400 hover:text-slate-600">
                Pengaturan
              </Link>
            </div>
          </div>
        );
      }
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
                <p className="text-xs text-slate-400">Pergerakan omzet bisnis per hari dalam seminggu.</p>
              </div>
              <Link
                href="/dashboard/reports"
                className="text-xs font-bold text-indigo-600 hover:underline hidden sm:block"
              >
                Detail Laporan &rarr;
              </Link>
            </div>
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
                    <span className="text-[10px] font-bold text-slate-400 pt-1">{t.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case "WIDGET_RECENT_TRANSACTIONS": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Live Feed Transaksi Kasir
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-600 text-[11px]">
                          {tx.transactionNumber || `TRX-${idx + 1}`}
                        </span>
                        {tx.outletName && (
                          <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {tx.outletName}
                          </span>
                        )}
                      </div>
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
                  Belum ada transaksi kasir hari ini.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_BARBER_LIVE_CHAIRS": {
        const inProgress = metricsData.barberStats?.inProgressList || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-500" />
                Monitor Kursi Cukur Realtime
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                {inProgress.length} Kursi Terisi
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
              {[1, 2, 3].map((chairNo) => {
                const booking = inProgress.find((b: any) => b.chairNumber === chairNo) || inProgress[chairNo - 1];
                return (
                  <div
                    key={chairNo}
                    className={`p-3 rounded-2xl border text-center flex flex-col justify-between ${
                      booking
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold font-mono">Kursi #{chairNo}</span>
                      <Armchair className={`w-3.5 h-3.5 ${booking ? "text-amber-500 animate-pulse" : "text-slate-300 dark:text-slate-700"}`} />
                    </div>
                    <div className="my-1">
                      <p className="font-bold text-xs truncate">
                        {booking ? booking.customerName : "Kosong"}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {booking ? (booking.barber?.name || "Kapster") : "Tersedia"}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${booking ? "bg-amber-500 text-slate-950" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                      {booking ? "Pangkas" : "Ready"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link href="/dashboard/barbershop/queue" className="font-bold text-amber-600 hover:underline">
                Buka Antrean &rarr;
              </Link>
            </div>
          </div>
        );
      }
      case "WIDGET_BARBER_QUEUE_STREAM": {
        const queue = metricsData.barberStats?.waitingList || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                Live Antrean Tamu Barbershop
              </h4>
              <span className="text-xs font-black text-amber-600">
                {metricsData.barberStats?.queueCount || 0} Antre
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {queue.length > 0 ? (
                queue.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                        {item.queueNumber || `#${idx + 1}`}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{item.customerName}</span>
                        <span className="text-[10px] text-slate-400">{item.service?.name || "Gentleman Cut"}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                      Menunggu
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada tamu menunggu antrean saat ini.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_BARBER_STYLIST_LEADERBOARD": {
        const stylists = metricsData.barberStats?.stylistLeaderboard || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Kapster & Komisi Hari Ini
              </h4>
              <Link href="/dashboard/barbershop/commissions" className="text-xs font-bold text-amber-600 hover:underline">
                Laporan &rarr;
              </Link>
            </div>
            <div className="space-y-2 flex-1">
              {stylists.length > 0 ? (
                stylists.map((st: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-600 text-xs">#{idx + 1}</span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{st.name}</p>
                        <p className="text-[10px] text-slate-400">{st.cuts}x Cukur Selesai</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-[11px]">
                      Rp {st.commission.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada data pangkas selesai hari ini.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_CAFE_TABLE_MAP": {
        const tables = metricsData.cafeStats?.tablesList || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-600" />
                Denah & Status Meja Cafe
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                {metricsData.cafeStats?.occupied || 0} Terisi / {metricsData.cafeStats?.totalTables || 0} Total
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-1">
              {tables.length > 0 ? (
                tables.map((t: any) => {
                  const isOcc = t.status === "OCCUPIED";
                  return (
                    <div
                      key={t.id}
                      className={`p-2.5 rounded-xl border text-center ${
                        isOcc
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500/50 text-rose-900 dark:text-rose-200"
                          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400/40 text-emerald-900 dark:text-emerald-200"
                      }`}
                    >
                      <span className="text-[11px] font-black block">{t.tableNumber}</span>
                      <span className={`text-[9px] font-bold px-1 rounded ${isOcc ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {isOcc ? "Terisi" : "Kosong"}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-4 py-6 text-center text-xs text-slate-400">
                  Belum ada data meja terdaftar.
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link href="/dashboard/cafe/tables" className="font-bold text-emerald-600 hover:underline">
                Kelola Meja &rarr;
              </Link>
            </div>
          </div>
        );
      }
      case "WIDGET_CAFE_KITCHEN_MONITOR": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                Antrean Pesanan Dapur (KOT)
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Sedang Dimasak</span>
                <strong className="text-2xl font-black text-amber-600">
                  {metricsData.cafeStats?.kitchenPreparing || 0} Tiket
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Siap Saji</span>
                <strong className="text-2xl font-black text-emerald-600">
                  {metricsData.cafeStats?.kitchenReady || 0} Menu
                </strong>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Kitchen Display System (KDS) terhubung realtime.
            </div>
          </div>
        );
      }
      case "WIDGET_CAFE_SELF_ORDER_FEED": {
        const selfOrders = metricsData.cafeStats?.recentSelfOrders || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                Pesanan Masuk dari QR Meja
              </h4>
            </div>
            <div className="space-y-2 flex-1">
              {selfOrders.length > 0 ? (
                selfOrders.slice(0, 3).map((o: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-600 block">{o.tableNumber || "Meja Scan"}</span>
                      <span className="text-[10px] text-slate-500">{o.customerName}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Rp {Number(o.totalAmount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada pesanan scan QR meja hari ini.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_LAUNDRY_STAGE_PIPELINE": {
        const pipe = metricsData.laundryStats?.pipeline || { received: 0, washing: 0, ironing: 0, ready: 0, completed: 0 };
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shirt className="w-4 h-4 text-purple-600" />
                Pipeline Tahapan Cucian Hari Ini
              </h4>
              <Link href="/dashboard/laundry/orders" className="text-xs font-bold text-purple-600 hover:underline">
                Order &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-5 gap-1.5 flex-1 pt-1">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">Terima</span>
                <strong className="text-sm font-black text-slate-700 dark:text-slate-200">{pipe.received}</strong>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-center border border-blue-200/50">
                <span className="text-[9px] text-blue-500 block font-bold">Cuci</span>
                <strong className="text-sm font-black text-blue-600">{pipe.washing}</strong>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-center border border-amber-200/50">
                <span className="text-[9px] text-amber-500 block font-bold">Setrika</span>
                <strong className="text-sm font-black text-amber-600">{pipe.ironing}</strong>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-center border border-purple-200/50">
                <span className="text-[9px] text-purple-500 block font-bold">Di Rak</span>
                <strong className="text-sm font-black text-purple-600">{pipe.ready}</strong>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center border border-emerald-200/50">
                <span className="text-[9px] text-emerald-500 block font-bold">Ambil</span>
                <strong className="text-sm font-black text-emerald-600">{pipe.completed}</strong>
              </div>
            </div>
          </div>
        );
      }
      case "WIDGET_LAUNDRY_WEIGHT_TODAY": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                <Scale className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Timbangan</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Masuk</span>
              <div className="text-2xl font-black text-purple-600">
                {(metricsData.laundryStats?.todayWeightKg || 0).toFixed(1)} <span className="text-sm text-slate-400">Kg</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              +{metricsData.laundryStats?.todayUnitQty || 0} Pcs Cucian Satuan
            </div>
          </div>
        );
      }
      case "WIDGET_LAUNDRY_RACK_ALERT": {
        const rackReady = metricsData.laundryStats?.rackReadyList || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Cucian Selesai Siap Ambil di Rak
              </h4>
              <span className="text-xs font-bold text-purple-600">{rackReady.length} Siap</span>
            </div>
            <div className="space-y-2 flex-1">
              {rackReady.length > 0 ? (
                rackReady.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.customerName}</p>
                      <p className="text-[10px] text-slate-400">{item.orderNumber} &bull; {item.weightKg} Kg</p>
                    </div>
                    <a
                      href={`https://wa.me/${(item.customerPhone || "").replace(/\D/g, "")}?text=Halo%20${encodeURIComponent(item.customerName)},%20cucian%20Anda%20${item.orderNumber}%20sudah%20selesai%20dan%20siap%20diambil.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-emerald-700 transition"
                    >
                      <Phone className="w-3 h-3" /> WA
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada cucian yang menunggu pengambilan di rak.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_RETAIL_FAST_MOVING": {
        const fast = metricsData.fastMovingSku || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Top 5 SKU Paling Cepat Laku
              </h4>
            </div>
            <div className="space-y-2 flex-1">
              {fast.length > 0 ? (
                fast.map((item: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-600">#{idx + 1}</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{item.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px]">
                      {item.qty} Terjual
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada produk terjual hari ini.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_RETAIL_STOCK_VALUATION": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Aset Modal</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Valuasi Stok</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600">
                Rp {(metricsData.stockValuationRp || 0).toLocaleString("id-ID")}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Berdasarkan HPP / Modal Awal
            </div>
          </div>
        );
      }
      case "WIDGET_OUTLET_LEADERBOARD": {
        const outletsList = metricsData.outletBreakdown || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Perbandingan Performa Antar Cabang
              </h4>
              <span className="text-xs font-bold text-indigo-600">{outletsList.length} Cabang</span>
            </div>
            <div className="space-y-2 flex-1">
              {outletsList.length > 0 ? (
                outletsList.map((out: any, idx: number) => (
                  <div key={out.id || idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{out.name}</p>
                      <p className="text-[10px] text-slate-400">{out.todayTransactionsCount} Transaksi Hari Ini</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-600 block">
                        Rp {out.todayRevenue.toLocaleString("id-ID")}
                      </span>
                      <span className={`text-[9.5px] font-bold ${out.isOpen ? "text-emerald-600" : "text-slate-400"}`}>
                        {out.isOpen ? `🟢 Buka (${out.activeCashier})` : "🔴 Shift Tutup"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada cabang outlet lain.
                </div>
              )}
            </div>
          </div>
        );
      }
      case "WIDGET_CASH_DRAWER_LIVE": {
        const fin = metricsData.financialStats || { cashIn: 0, qrisIn: 0, transferIn: 0, edcIn: 0, totalCommissionsMonth: 0, activeShiftsCount: 0 };
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Posisi Kas Laci Kasir
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                {fin.activeShiftsCount} Laci Buka
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Uang Tunai Masuk</span>
                <strong className="text-lg font-black text-emerald-600 truncate block">
                  Rp {fin.cashIn.toLocaleString("id-ID")}
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Non-Tunai (QRIS/EDC)</span>
                <strong className="text-lg font-black text-indigo-600 truncate block">
                  Rp {(fin.qrisIn + fin.edcIn + fin.transferIn).toLocaleString("id-ID")}
                </strong>
              </div>
            </div>
          </div>
        );
      }
      case "WIDGET_COMMISSION_ACCRUAL": {
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Coins className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Komisi Staf</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Akumulasi Bulan Ini</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600">
                Rp {(metricsData.financialStats?.totalCommissionsMonth || 0).toLocaleString("id-ID")}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <Link href="/dashboard/payroll" className="font-bold text-amber-600 hover:underline">
                Kelola Payroll &rarr;
              </Link>
            </div>
          </div>
        );
      }
      case "WIDGET_LOW_STOCK_ALERT": {
        const lowStock = metricsData.lowStockProducts || [];
        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Peringatan Stok Menipis
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                lowStock.length > 0
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}>
                {lowStock.length > 0 ? `${lowStock.length} Item Kritis` : "Stok Aman"}
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-hidden">
              {lowStock.length > 0 ? (
                lowStock.slice(0, 3).map((p: any, idx: number) => (
                  <div
                    key={p.id || idx}
                    className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[150px]">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {p.category || "Umum"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-rose-600 block">
                        Sisa {p.stockQty ?? p.effectiveStockQty ?? 0}
                      </span>
                      <span className="text-[9.5px] text-slate-400">
                        Min: {p.minStockAlert ?? 5}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span>Semua persediaan barang dalam batas aman.</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link href="/dashboard/products" className="font-bold text-indigo-600 hover:underline">
                Kelola Stok Produk &rarr;
              </Link>
            </div>
          </div>
        );
      }
      case "WIDGET_VERTICAL_STATUS": {
        const plugins = metricsData.activePlugins || [];
        const hasBarber = plugins.includes("barbershop");
        const hasCafe = plugins.includes("cafe");
        const hasLaundry = plugins.includes("laundry");
        const hasRetail = plugins.includes("retail") || (!hasBarber && !hasCafe && !hasLaundry);

        return (
          <div className="h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Status Modul Vertikal Bisnis
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                {plugins.length || 1} Aktif
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {hasBarber && (
                <Link
                  href="/dashboard/barbershop/queue"
                  className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 hover:brightness-105 transition"
                >
                  <Scissors className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-200 block truncate">Barbershop</span>
                    <span className="text-[10px] text-amber-600">Stasiun &amp; Antrean</span>
                  </div>
                </Link>
              )}
              {hasCafe && (
                <Link
                  href="/dashboard/cafe/tables"
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 hover:brightness-105 transition"
                >
                  <Coffee className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block truncate">Kafe &amp; Resto</span>
                    <span className="text-[10px] text-emerald-600">Denah &amp; KOT</span>
                  </div>
                </Link>
              )}
              {hasLaundry && (
                <Link
                  href="/dashboard/laundry/orders"
                  className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center gap-2 hover:brightness-105 transition"
                >
                  <Shirt className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-200 block truncate">Laundry</span>
                    <span className="text-[10px] text-purple-600">Pipeline &amp; Rak</span>
                  </div>
                </Link>
              )}
              {hasRetail && (
                <Link
                  href="/dashboard/products"
                  className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2 hover:brightness-105 transition"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-xs text-blue-900 dark:text-blue-200 block truncate">Retail Mart</span>
                    <span className="text-[10px] text-blue-600">Stok &amp; Grosir</span>
                  </div>
                </Link>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <Link href="/dashboard/subscription" className="font-bold text-indigo-600 hover:underline">
                Kelola Modul Langganan &rarr;
              </Link>
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {tr("Ringkasan Operasional")}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
              {metricsData.activeTierName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {metricsData.tenantName}
          </h1>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Cabang:
            </span>
            {isMultiOutlet ? (
              <select
                value={selectedOutletFilter}
                onChange={(e) => setSelectedOutletFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-xs font-extrabold text-indigo-900 dark:text-indigo-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🌐 Semua Cabang (Konsolidasi Total)</option>
                {outlets.map((out) => (
                  <option key={out.id} value={out.id}>
                    📍 {out.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {metricsData.outletName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isCustomizing ? (
            <button
              onClick={() => setIsCustomizing(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>{tr("Atur Widget")}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddWidgetModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Widget</span>
              </button>
              <button
                onClick={handleResetDefault}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                title="Reset ke Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSaveLayout}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{tr("Simpan Susunan")}</span>
              </button>
              <button
                onClick={() => setIsCustomizing(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {tr("Selesai")}
              </button>
            </div>
          )}
        </div>
      </div>
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
      {isCustomizing && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <p className="font-extrabold">Mode Manajemen Grid Dashboard Aktif</p>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Gunakan kontrol di setiap kartu untuk <strong>mengubah lebar kolom</strong>, <strong>geser urutan</strong>, atau <strong>hapus widget</strong>. Klik <em>Simpan Susunan</em> setelah selesai.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddWidgetModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow hover:bg-indigo-700 flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Komponen
          </button>
        </div>
      )}
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
              {isCustomizing && (
                <div className="pb-3 mb-3 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-indigo-600 text-[11px] truncate">
                    #{idx + 1} {def?.title || widget.widgetKey}
                  </span>
                  <div className="flex items-center gap-1">
                    {def?.allowedColSpans.map((span) => (
                      <button
                        key={span}
                        onClick={() => handleChangeColSpan(widget.instanceId, span)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                          widget.colSpan === span
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title={`Ubah ukuran ke ${span} Kolom`}
                      >
                        {span}x
                      </button>
                    ))}
                    <button
                      onClick={() => handleMoveWidget(idx, "LEFT")}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Geser ke Kiri/Atas"
                    >
                      <MoveLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveWidget(idx, "RIGHT")}
                      disabled={idx === widgets.length - 1}
                      className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Geser ke Kanan/Bawah"
                    >
                      <MoveRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveWidget(widget.instanceId)}
                      className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 ml-1 cursor-pointer"
                      title="Hapus Widget dari Dashboard"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="min-h-[140px] flex flex-col justify-between">
                {renderWidgetContent(widget)}
              </div>
            </div>
          );
        })}
      </div>
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Galeri Komponen Widget
                </h3>
                <p className="text-xs text-slate-500">Pilih komponen statistik khusus vertikal atau multi-cabang.</p>
              </div>
              <button
                onClick={() => setShowAddWidgetModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "ALL", label: "🌟 Semua" },
                { id: "BARBERSHOP", label: "💈 Barbershop" },
                { id: "CAFE", label: "☕ Cafe" },
                { id: "LAUNDRY", label: "🧺 Laundry" },
                { id: "RETAIL", label: "🏪 Retail" },
                { id: "MULTI_OUTLET", label: "🏢 Multi-Outlet" },
                { id: "FINANCIAL", label: "💼 Finansial" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWidgetCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition cursor-pointer ${
                    widgetCategoryFilter === tab.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {filteredWidgetDefs.map((def) => {
                const isAlreadyAdded = widgets.some((w) => w.widgetKey === def.key);
                return (
                  <div
                    key={def.key}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition space-y-2 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">{def.title}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                          {def.defaultColSpan} Kolom
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{def.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddWidget(def.key)}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
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
