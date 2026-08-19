"use client";

import { useState, useEffect } from "react";
import {
  X,
  Package,
  Layers,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Store,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  FileText,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import {
  getProductStockDetailsAction,
  updateOutletStockAction,
  updateProductOutletPriceAction,
  toggleProductOutletAvailabilityAction,
} from "@/modules/product/actions";
import { toastSuccess, toastError } from "@/lib/swal";
import { format } from "date-fns";

interface StockManagementModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export function StockManagementModal({
  productId,
  isOpen,
  onClose,
  onStockUpdated,
}: StockManagementModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");

  // Adjustment Form State
  const [adjustMode, setAdjustMode] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");
  const [adjustQty, setAdjustQty] = useState<number | string>("");
  const [adjustNote, setAdjustNote] = useState("");

  // Price Override State
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [isPriceCustom, setIsPriceCustom] = useState(false);

  // Load details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getProductStockDetailsAction(productId);
      setProductDetails(res);
      if (res.outletStocks && res.outletStocks.length > 0) {
        const defaultOutletId = selectedOutletId || res.outletStocks[0].outletId;
        setSelectedOutletId(defaultOutletId);
        const currentStock = res.outletStocks.find((s: any) => s.outletId === defaultOutletId);
        if (currentStock?.priceOverride !== null && currentStock?.priceOverride !== undefined) {
          setIsPriceCustom(true);
          setPriceOverride(String(currentStock.priceOverride));
        } else {
          setIsPriceCustom(false);
          setPriceOverride("");
        }
      }
    } catch (err: any) {
      toastError(err.message || "Gagal memuat detail stok.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productId) {
      fetchDetails();
      setAdjustQty("");
      setAdjustNote("");
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const currentOutletStock = productDetails?.outletStocks?.find(
    (s: any) => s.outletId === selectedOutletId
  );
  const currentStockQty = currentOutletStock ? currentOutletStock.stockQty : 0;
  const currentPrice = currentOutletStock?.priceOverride !== null && currentOutletStock?.priceOverride !== undefined
    ? Number(currentOutletStock.priceOverride)
    : Number(productDetails?.price || 0);

  const isLowStock = currentStockQty <= 5;
  const isOutOfStock = currentStockQty <= 0;

  const handleOutletSwitch = (outletId: string) => {
    setSelectedOutletId(outletId);
    const targetStock = productDetails?.outletStocks?.find((s: any) => s.outletId === outletId);
    if (targetStock?.priceOverride !== null && targetStock?.priceOverride !== undefined) {
      setIsPriceCustom(true);
      setPriceOverride(String(targetStock.priceOverride));
    } else {
      setIsPriceCustom(false);
      setPriceOverride("");
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(adjustQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toastError("Masukkan jumlah stok yang valid (angka positif).");
      return;
    }

    try {
      setSubmitting(true);
      await updateOutletStockAction({
        outletId: selectedOutletId,
        productId,
        mode: adjustMode,
        qty: qtyNum,
        note: adjustNote.trim() || undefined,
      });

      toastSuccess(
        `Stok di cabang ${currentOutletStock?.outlet?.name || ""} berhasil disesuaikan.`
      );
      setAdjustQty("");
      setAdjustNote("");
      await fetchDetails();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      toastError(err.message || "Gagal menyesuaikan stok.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePriceOverride = async () => {
    try {
      setSubmitting(true);
      const val = isPriceCustom && priceOverride !== "" ? Number(priceOverride) : null;
      await updateProductOutletPriceAction({
        outletId: selectedOutletId,
        productId,
        priceOverride: val,
      });
      toastSuccess(
        val !== null
          ? `Harga khusus Rp ${val.toLocaleString("id-ID")} berhasil diterapkan.`
          : "Harga kembali menggunakan harga master toko."
      );
      await fetchDetails();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan harga khusus.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (newStatus: boolean) => {
    try {
      setSubmitting(true);
      await toggleProductOutletAvailabilityAction({
        outletId: selectedOutletId,
        productId,
        isAvailable: newStatus,
      });
      toastSuccess(
        newStatus ? "Produk kini AKTIF dijual di cabang ini." : "Produk dinonaktifkan di cabang ini."
      );
      await fetchDetails();
      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status ketersediaan.");
    } finally {
      setSubmitting(false);
    }
  };

  const movements = currentOutletStock?.movements || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-all">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Manajemen Stok &amp; Kartu Mutasi</span>
              </h2>
              <p className="text-xs text-slate-500">
                Kelola stok fisik per cabang, harga khusus cabang, dan audit jejak mutasi barang.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Memuat rincian stok multi-cabang...</p>
          </div>
        ) : !productDetails ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Data produk tidak ditemukan.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Product Overview Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center gap-3.5">
                {productDetails.imageUrl ? (
                  <img
                    src={productDetails.imageUrl}
                    alt={productDetails.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {productDetails.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 text-[10px] font-bold">
                      {productDetails.category || "Umum"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Barcode / SKU: {productDetails.barcode || "-"} • Harga Master: Rp{" "}
                    {Number(productDetails.price).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Outlet Tabs Selector */}
              {productDetails.outletStocks && productDetails.outletStocks.length > 1 && (
                <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto max-w-full">
                  {productDetails.outletStocks.map((os: any) => {
                    const isSelected = os.outletId === selectedOutletId;
                    return (
                      <button
                        key={os.outletId}
                        onClick={() => handleOutletSwitch(os.outletId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{os.outlet?.name || "Cabang"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Current Branch KPIs & Control */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Current Stock */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Stok Cabang: {currentOutletStock?.outlet?.name || "Utama"}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {currentStockQty}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Unit</span>
                </div>
                <div className="mt-2">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Habis (Out of Stock)</span>
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Menipis (≤ 5 unit)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aman &amp; Tersedia</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2: Branch Price */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Harga Jual di Cabang Ini
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    Rp {currentPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                  {currentOutletStock?.priceOverride !== null && currentOutletStock?.priceOverride !== undefined ? (
                    <span className="text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                      Khusus Cabang Ini
                    </span>
                  ) : (
                    <span className="text-slate-500">Mengikuti Harga Master Toko</span>
                  )}
                </div>
              </div>

              {/* Card 3: Availability Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status Jual di Cabang Ini
                </span>
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      handleToggleAvailability(!currentOutletStock?.isAvailable)
                    }
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      currentOutletStock?.isAvailable
                        ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        currentOutletStock?.isAvailable ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>
                      {currentOutletStock?.isAvailable
                        ? "Aktif Dijual di Cabang Ini"
                        : "Non-Aktif (Hidden di Kasir)"}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Jika dinonaktifkan, kasir di cabang ini tidak akan melihat produk ini di layar POS.
                </p>
              </div>
            </div>

            {/* Quick Action Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form 1: Stock Adjustment */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                    <span>Aksi Mutasi Stok Manual</span>
                  </h4>

                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => setAdjustMode("ADD")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                        adjustMode === "ADD"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Restock (+)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustMode("SUBTRACT")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                        adjustMode === "SUBTRACT"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      <span>Buang (-)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustMode("SET")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                        adjustMode === "SET"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Opname (=)</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAdjustSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {adjustMode === "ADD"
                          ? "Jumlah Ditambah (Unit)"
                          : adjustMode === "SUBTRACT"
                          ? "Jumlah Dikurangi (Unit)"
                          : "Jumlah Stok Fisik Riil"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        placeholder="Contoh: 10"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Catatan Mutasi
                      </label>
                      <input
                        type="text"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        placeholder={
                          adjustMode === "ADD"
                            ? "Pengiriman dari supplier"
                            : adjustMode === "SUBTRACT"
                            ? "Barang rusak / kadaluarsa"
                            : "Hasil hitung fisik bulanan"
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                      adjustMode === "ADD"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : adjustMode === "SUBTRACT"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>
                      {adjustMode === "ADD"
                        ? "Simpan Restock Masuk"
                        : adjustMode === "SUBTRACT"
                        ? "Simpan Pengurangan Stok"
                        : "Perbarui Saldo Stok Opname"}
                    </span>
                  </button>
                </form>
              </div>

              {/* Form 2: Price Override for Branch */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    <span>Pengaturan Harga Khusus Cabang</span>
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Gunakan Harga Khusus di Cabang Ini?
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Cocok untuk outlet dengan biaya sewa/lokasi berbeda (misal: mall vs ruko).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPriceCustom}
                      onChange={(e) => {
                        setIsPriceCustom(e.target.checked);
                        if (!e.target.checked) setPriceOverride("");
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {isPriceCustom && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Harga Khusus Cabang {currentOutletStock?.outlet?.name || ""} (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={priceOverride}
                        onChange={(e) => setPriceOverride(e.target.value)}
                        placeholder={`Harga master: Rp ${Number(productDetails.price).toLocaleString(
                          "id-ID"
                        )}`}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSavePriceOverride}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan Kebijakan Harga</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stock Movement Ledger Table (Kartu Stok) */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Kartu Stok &amp; Riwayat Mutasi (Ledger)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {movements.length} mutasi tercatat di cabang ini
                </span>
              </div>

              {movements.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  Belum ada riwayat mutasi stok untuk cabang ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                        <th className="py-2.5 px-3">Tipe Mutasi</th>
                        <th className="py-2.5 px-3">Jumlah (Qty)</th>
                        <th className="py-2.5 px-3">Catatan / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {movements.map((m: any) => {
                        const isPlus = m.type === "IN" || m.type === "TRANSFER_IN";
                        const isMinus = m.type === "OUT" || m.type === "TRANSFER_OUT";

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                          >
                            <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {format(new Date(m.createdAt), "dd MMM yyyy, HH:mm")}
                            </td>
                            <td className="py-2.5 px-3">
                              {m.type === "IN" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>STOK MASUK (IN)</span>
                                </span>
                              )}
                              {m.type === "OUT" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                                  <ArrowDownRight className="w-3 h-3" />
                                  <span>STOK KELUAR (OUT)</span>
                                </span>
                              )}
                              {m.type === "ADJUSTMENT" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600">
                                  <RefreshCw className="w-3 h-3" />
                                  <span>OPNAME / PENYESUAIAN</span>
                                </span>
                              )}
                              {m.type.startsWith("TRANSFER") && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600">
                                  <RefreshCw className="w-3 h-3" />
                                  <span>TRANSFER ANTAR CABANG</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                              <span
                                className={
                                  isPlus
                                    ? "text-emerald-600"
                                    : isMinus
                                    ? "text-rose-600"
                                    : "text-slate-900 dark:text-white"
                                }
                              >
                                {isPlus ? `+${m.qty}` : isMinus ? `-${m.qty}` : m.qty} Unit
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              <p className="font-medium text-[11px]">{m.note || "-"}</p>
                              {m.referenceId && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Ref: {m.referenceId}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
