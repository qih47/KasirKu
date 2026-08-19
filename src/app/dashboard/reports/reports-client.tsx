"use client";

import { useState } from "react";
import { toastError, swalWarning } from "@/lib/swal";
import {
  getSalesReportData,
  ReportPeriod,
} from "@/modules/transaction/report-actions";
import { CafeReportView } from "@/modules/cafe/components/cafe-report-view";
import { BarberReportView } from "@/modules/barbershop/components/barber-report-view";
import { LaundryReportView } from "@/modules/laundry/components/laundry-report-view";
import { RetailReportView } from "@/modules/retail/components/retail-report-view";
import { FeatureGate, ReportPaywallCard } from "@/components/features/feature-gate";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Download,
  Printer,
  Sparkles,
  User,
  CreditCard,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Store,
  Coffee,
  Scissors,
  Shirt,
  ShoppingBag,
  Lock,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";

interface ReportsClientProps {
  initialData: any;
  activeTierCode?: string;
  activePlugins?: Array<{ code: string; name: string }>;
  availableTiers?: any[];
  featureMatrix?: any[];
}

export function ReportsClient({
  initialData,
  activeTierCode = "STARTER",
  activePlugins = [],
  availableTiers = [],
  featureMatrix = [],
}: ReportsClientProps) {
  const { tr } = useTranslation();
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<ReportPeriod>("LAST_7_DAYS");
  const [selectedOutletId, setSelectedOutletId] = useState<string>(
    initialData.selectedOutletId || "ALL"
  );
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<string>("CORE");

  const isCafeActive = activePlugins.some((p) => p.code === "cafe");
  const isBarberActive = activePlugins.some((p) => p.code === "barbershop");
  const isLaundryActive = activePlugins.some((p) => p.code === "laundry");
  const isRetailActive = activePlugins.some((p) => p.code === "retail");

  // Dynamic Feature Entitlement Checkers
  const isFeatureAllowed = (key: string) => {
    if (!featureMatrix || featureMatrix.length === 0) return true;
    const feat = featureMatrix.find((f: any) => f.key === key);
    if (!feat) return true;
    const normalizedTier = activeTierCode.toLowerCase() === "basic" ? "starter" : activeTierCode.toLowerCase();
    return feat.allowedTiers.some(
      (t: string) => t.toLowerCase() === normalizedTier || t.toLowerCase() === activeTierCode.toLowerCase()
    );
  };

  const canExportExcel = isFeatureAllowed("REPORT_EXPORT_EXCEL");
  const canViewProfitLoss = isFeatureAllowed("REPORT_PROFIT_LOSS");

  const fetchReports = async (newPeriod: ReportPeriod, outletId: string) => {
    setLoading(true);
    try {
      const res = await getSalesReportData({
        period: newPeriod,
        outletId,
      });
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    fetchReports(newPeriod, selectedOutletId);
  };

  const handleOutletChange = (outletId: string) => {
    setSelectedOutletId(outletId);
    fetchReports(period, outletId);
  };

  // Export to CSV
  const [stockTypeFilter, setStockTypeFilter] = useState<string>("ALL");
  const [stockSearchQuery, setStockSearchQuery] = useState<string>("" );

  const handleExportStockLedgerCSV = () => {
    const movements = data.stockLedger?.movements || [];
    if (movements.length === 0) {
      swalWarning("Data Kosong", "Tidak ada log mutasi stok pada periode ini.");
      return;
    }

    const headers = [
      "Waktu",
      "Cabang",
      "Nama Produk",
      "Barcode SKU",
      "Tipe Mutasi",
      "Perubahan Qty",
      "No. Referensi",
      "Petugas/Kasir",
      "Catatan",
    ];

    const rows = movements.map((m: any) => [
      `"${m.date}"`,
      `"${m.outletName}"`,
      `"${m.productName.replace(/"/g, '""')}"`,
      `"${m.productBarcode}"`,
      `"${m.type}"`,
      m.qty,
      `"${m.referenceId}"`,
      `"${m.performedByName}"`,
      `"${m.note.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Log_Mutasi_Stok_${data.tenantName.replace(/\s+/g, "_")}_${
        data.dateRange.from
      }_to_${data.dateRange.to}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    if (!data.transactionsList || data.transactionsList.length === 0) {
      await swalWarning("Tidak Ada Data", "Tidak ada transaksi untuk diexport pada periode ini.");
      return;
    }

    const headers = [
      "No. Transaksi",
      "Tanggal",
      "Outlet",
      "Kasir",
      "Item Belanja",
      "Metode Pembayaran",
      "Total Belanja (Rp)",
    ];

    const rows = data.transactionsList.map((t: any) => [
      `"${t.transactionNumber}"`,
      `"${t.date}"`,
      `"${t.outletName}"`,
      `"${t.cashierName}"`,
      `"${t.itemsSummary.replace(/"/g, '""')}"`,
      `"${t.paymentMethod}"`,
      t.totalAmount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Penjualan_${data.tenantName.replace(/\s+/g, "_")}_${
        data.dateRange.from
      }_to_${data.dateRange.to}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            {tr("Laporan & Analytics Penjualan")}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tr("Ringkasan Performa Bisnis")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {tr("Periode:")}{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.dateRange.fromFormatted} &mdash; {data.dateRange.toFormatted}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Outlet Switcher */}
          {data.allOutlets && data.allOutlets.length > 1 && (
            <select
              value={selectedOutletId}
              onChange={(e) => handleOutletChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">🏢 {tr("Semua Cabang (Konsolidasi)")}</option>
              {data.allOutlets.map((o: any) => (
                <option key={o.id} value={o.id}>
                  📍 {o.name}
                </option>
              ))}
            </select>
          )}

          {/* Period Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => handlePeriodChange("TODAY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === "TODAY"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tr("Hari Ini")}
            </button>
            <button
              onClick={() => handlePeriodChange("LAST_7_DAYS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === "LAST_7_DAYS"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tr("7 Hari")}
            </button>
            <button
              onClick={() => handlePeriodChange("LAST_30_DAYS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === "LAST_30_DAYS"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tr("30 Hari")}
            </button>
            <button
              onClick={() => handlePeriodChange("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                period === "THIS_MONTH"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tr("Bulan Ini")}
            </button>
          </div>

            <button
              onClick={async () => {
                if (!canExportExcel) {
                  await swalWarning(tr("Fitur Terkunci 🔒"), tr("Fitur Export Excel memerlukan Lisensi Pro/Enterprise. Silakan upgrade paket langganan Anda."));
                  return;
                }
                handleExportCSV();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              title={canExportExcel ? tr("Download CSV") : tr("Terkunci: Khusus Paket Pro")}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{tr("Export CSV")}</span>
              {!canExportExcel && <Lock className="w-3 h-3 text-amber-500" />}
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Vertical Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveReportTab("CORE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 ${
              activeReportTab === "CORE"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📊 Laporan Finansial &amp; POS Inti</span>
          </button>

          <button
            onClick={() => setActiveReportTab("STOCK_LEDGER")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 ${
              activeReportTab === "STOCK_LEDGER"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>📋 Log Audit Mutasi Stok</span>
          </button>

          {isCafeActive && (
            <button
              onClick={() => setActiveReportTab("CAFE")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 ${
                activeReportTab === "CAFE"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Coffee className="w-4 h-4 text-amber-500" />
              <span>☕ Analitik Cafe &amp; Meja Resto</span>
            </button>
          )}

          {isBarberActive && (
            <button
              onClick={() => setActiveReportTab("BARBERSHOP")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 ${
                activeReportTab === "BARBERSHOP"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Scissors className="w-4 h-4 text-cyan-500" />
              <span>✂️ Kinerja &amp; Komisi Barber</span>
            </button>
          )}

          {isLaundryActive && (
            <button
              onClick={() => setActiveReportTab("LAUNDRY")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 ${
                activeReportTab === "LAUNDRY"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Shirt className="w-4 h-4 text-purple-500" />
              <span>🧺 Timbangan &amp; SLA Laundry</span>
            </button>
          )}

          {isRetailActive && (
            <button
              onClick={() => setActiveReportTab("RETAIL")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition flex-shrink-0 ${
                activeReportTab === "RETAIL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span>🛒 Analisis SKU &amp; Retail</span>
            </button>
          )}
        </div>

        {/* Conditional Tab Rendering with Real Multi-Vertical Data */}
        {activeReportTab === "CAFE" && <CafeReportView data={data.cafeAnalytics} />}
        {activeReportTab === "BARBERSHOP" && <BarberReportView data={data.barberAnalytics} />}
        {activeReportTab === "LAUNDRY" && <LaundryReportView data={data.laundryAnalytics} />}
        {activeReportTab === "RETAIL" && <RetailReportView data={data.retailAnalytics} />}

        {/* Tab 5: Stock Ledger Audit Trail */}
        {activeReportTab === "STOCK_LEDGER" && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Total Barang Masuk (IN)
                </span>
                <p className="text-2xl font-black text-emerald-600">
                  +{data.stockLedger?.totalIn || 0}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </p>
                <p className="text-[11px] text-slate-500">Restock &amp; Transfer Masuk</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Total Barang Keluar (OUT)
                </span>
                <p className="text-2xl font-black text-rose-600">
                  -{data.stockLedger?.totalOut || 0}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </p>
                <p className="text-[11px] text-slate-500">Penjualan Kasir &amp; Transfer Keluar</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Total Penyesuaian Opname
                </span>
                <p className="text-2xl font-black text-indigo-600">
                  {data.stockLedger?.totalAdjustment || 0}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </p>
                <p className="text-[11px] text-slate-500">Koreksi audit fisik gudang</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Pergerakan Transfer Cabang
                </span>
                <p className="text-2xl font-black text-purple-600">
                  {data.stockLedger?.totalTransfer || 0}{" "}
                  <span className="text-xs font-normal text-slate-400">Unit</span>
                </p>
                <p className="text-[11px] text-slate-500">Rotasi stok antar cabang</p>
              </div>
            </div>

            {/* Filter & Export Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={stockTypeFilter}
                    onChange={(e) => setStockTypeFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Tipe Mutasi</option>
                    <option value="IN">Restock Masuk (+)</option>
                    <option value="OUT">Penjualan Kasir / Buang (-)</option>
                    <option value="ADJUSTMENT">Koreksi Opname</option>
                    <option value="TRANSFER_OUT">Transfer Keluar Cabang</option>
                    <option value="TRANSFER_IN">Transfer Masuk Cabang</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  placeholder="Cari produk, SKU, no ref..."
                  className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none w-56"
                />
              </div>

              <button
                type="button"
                onClick={handleExportStockLedgerCSV}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Log Mutasi CSV</span>
              </button>
            </div>

            {/* Stock Movement Ledger Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Waktu</th>
                      <th className="py-3.5 px-4">Cabang</th>
                      <th className="py-3.5 px-4">Produk &amp; SKU</th>
                      <th className="py-3.5 px-4">Tipe Mutasi</th>
                      <th className="py-3.5 px-4">Perubahan Qty</th>
                      <th className="py-3.5 px-4">No. Referensi</th>
                      <th className="py-3.5 px-4">Petugas / Kasir</th>
                      <th className="py-3.5 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      const list = (data.stockLedger?.movements || []).filter((m: any) => {
                        if (stockTypeFilter !== "ALL" && m.type !== stockTypeFilter) return false;
                        if (stockSearchQuery.trim()) {
                          const q = stockSearchQuery.toLowerCase();
                          const matchProd = m.productName?.toLowerCase().includes(q);
                          const matchSku = m.productBarcode?.toLowerCase().includes(q);
                          const matchRef = m.referenceId?.toLowerCase().includes(q);
                          if (!matchProd && !matchSku && !matchRef) return false;
                        }
                        return true;
                      });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                              Tidak ada riwayat mutasi stok yang sesuai dengan filter.
                            </td>
                          </tr>
                        );
                      }

                      return list.map((m: any) => {
                        const isIn = m.type === "IN" || m.type === "TRANSFER_IN";
                        const isOut = m.type === "OUT" || m.type === "TRANSFER_OUT";
                        const isAdj = m.type === "ADJUSTMENT";

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                              {m.date}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1">
                                <Store className="w-3 h-3 text-slate-400" />
                                {m.outletName}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {m.productName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                SKU: {m.productBarcode}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  m.type === "IN"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : m.type === "OUT"
                                    ? "bg-rose-500/10 text-rose-600"
                                    : m.type === "TRANSFER_IN"
                                    ? "bg-teal-500/10 text-teal-600"
                                    : m.type === "TRANSFER_OUT"
                                    ? "bg-purple-500/10 text-purple-600"
                                    : "bg-indigo-500/10 text-indigo-600"
                                }`}
                              >
                                {m.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-black text-xs">
                              <span
                                className={
                                  isIn
                                    ? "text-emerald-600"
                                    : isOut
                                    ? "text-rose-600"
                                    : "text-indigo-600"
                                }
                              >
                                {isIn ? `+${m.qty}` : isOut ? `-${m.qty}` : `Set: ${m.qty}`}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {m.referenceId}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                              {m.performedByName}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                              {m.note}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === "CORE" && (
          <div className="space-y-6">
            {/* 4 KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Total Omset Penjualan
                </span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  Rp {data.metrics.totalRevenue.toLocaleString("id-ID")}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Semua transaksi sukses</p>
              </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Transaksi
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {data.metrics.totalTransactions}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Struk belanja selesai</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Rata-rata Belanja (AOV)
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            Rp {data.metrics.averageOrderValue.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Per transaksi pelanggan</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Item Terjual
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {data.metrics.totalItemsSold}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unit barang & jasa</p>
        </div>
      </div>

      {/* Advanced Analytics: Jam Ramai Transaksi (Peak Hours Heatmap) */}
      {data.peakHours && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold">⚡</span>
              Analisis Jam Ramai Transaksi
            </h3>
            <span className="text-xs text-slate-500">
              {data.peakHoursRange?.label || "00:00 - 23:00 WIB"}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2 pt-2">
            {data.peakHours.map((ph: any) => {
              const count = ph.count || 0;
              const bgIntensity =
                count === 0
                  ? "bg-slate-50 dark:bg-slate-950 text-slate-400"
                  : count < 3
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900"
                  : count < 6
                  ? "bg-indigo-500/20 text-indigo-600 font-bold border border-indigo-400"
                  : "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30";

              return (
                <div
                  key={ph.hour}
                  className={`p-2.5 rounded-2xl text-center flex flex-col justify-between items-center transition ${bgIntensity}`}
                >
                  <span className="text-[10px] opacity-80">{ph.hour}</span>
                  <strong className="text-xs mt-1">{count} trx</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Branch Consolidated Performance Table (if multiple outlets) */}
      {data.outletPerformance && data.outletPerformance.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              Kontribusi Penjualan Antar Cabang Outlet (Konsolidasi)
            </h3>
            <span className="text-xs text-slate-500">
              {data.outletPerformance.length} cabang aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Cabang Outlet</th>
                  <th className="py-3 px-4">Total Transaksi</th>
                  <th className="py-3 px-4">Kontribusi Omset</th>
                  <th className="py-3 px-4 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.outletPerformance.map((o: any) => {
                  const percentage =
                    data.metrics.totalRevenue > 0
                      ? Math.round(
                          (o.totalRevenue / data.metrics.totalRevenue) * 100
                        )
                      : 0;

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {o.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {o.trxCount} transaksi
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        Rp {o.totalRevenue.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Sales Trend Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Rekap Penjualan Harian
          </h3>
          <span className="text-xs text-slate-500">
            {data.dailyTrends.length} hari dengan aktivitas penjualan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jumlah Transaksi</th>
                <th className="py-3 px-4">Item Terjual</th>
                <th className="py-3 px-4 text-right">Total Pendapatan (Omset)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.dailyTrends.length > 0 ? (
                data.dailyTrends.map((d: any) => (
                  <tr
                    key={d.date}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {d.formattedDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {d.trxCount} transaksi
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {d.itemsCount} unit
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      Rp {d.totalRevenue.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    Belum ada data penjualan pada rentang waktu ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Top Selling Products & Cashier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Produk & Jasa Terlaris
            </h3>
            <span className="text-xs text-slate-500">Top performa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">No.</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Terjual</th>
                  <th className="py-3 px-4 text-right">Kontribusi Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.topProducts.length > 0 ? (
                  data.topProducts.map((p: any, idx: number) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {p.category}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {p.qty} unit
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        Rp {p.revenue.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-slate-500 text-xs"
                    >
                      Belum ada data produk terjual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Performa Staff Kasir
            </h3>
            <span className="text-xs text-slate-500">Aktivitas shift</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Kasir</th>
                  <th className="py-3 px-4">Transaksi</th>
                  <th className="py-3 px-4 text-right">Total Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.cashierPerformance.length > 0 ? (
                  data.cashierPerformance.map((c: any) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {c.trxCount} transaksi
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {c.totalRevenue.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-slate-500 text-xs"
                    >
                      Belum ada transaksi kasir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Printable Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" /> Pratinjau Dokumen Laporan Penjualan
              </span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Document Area */}
            <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-4 text-xs">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-black uppercase text-slate-900">
                  {data.tenantName}
                </h2>
                <p className="text-xs text-slate-500">
                  LAPORAN PENJUALAN OPERASIONAL BISNIS
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Periode: {data.dateRange.fromFormatted} s/d {data.dateRange.toFormatted} &bull; Dicetak: {new Date().toLocaleString("id-ID")}
                </p>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-4 gap-2 border-b pb-4 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500">Total Omset</span>
                  <p className="font-bold text-xs text-indigo-600">
                    Rp {data.metrics.totalRevenue.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500">Total Trx</span>
                  <p className="font-bold text-xs">
                    {data.metrics.totalTransactions}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500">Rata-rata (AOV)</span>
                  <p className="font-bold text-xs text-emerald-600">
                    Rp {data.metrics.averageOrderValue.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500">Item Terjual</span>
                  <p className="font-bold text-xs">
                    {data.metrics.totalItemsSold} unit
                  </p>
                </div>
              </div>

              {/* Detailed Transactions List */}
              <div>
                <h4 className="font-bold text-xs mb-2">Rincian Transaksi Selesai:</h4>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-1">No. TRX</th>
                      <th className="py-1">Waktu</th>
                      <th className="py-1">Kasir</th>
                      <th className="py-1">Item</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.transactionsList.map((t: any) => (
                      <tr key={t.id}>
                        <td className="py-1 font-mono font-bold text-indigo-600">{t.transactionNumber}</td>
                        <td className="py-1 text-slate-500">{t.date}</td>
                        <td className="py-1">{t.cashierName}</td>
                        <td className="py-1 text-slate-600 max-w-xs truncate">{t.itemsSummary}</td>
                        <td className="py-1 text-right font-bold">Rp {t.totalAmount.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
