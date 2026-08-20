"use client";

import { useState } from "react";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";
import {
  createProductAction,
  updateProductAction,
  toggleProductStatusAction,
  deleteProductAction,
  getProductsData,
  ProductType,
} from "@/modules/product/actions";
import {
  Package,
  Plus,
  Search,
  ScanLine,
  Edit2,
  Trash2,
  Power,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import { ImportProductModal } from "@/components/products/import-product-modal";
import { StockManagementModal } from "@/components/products/stock-management-modal";
import { VouchersClient } from "@/app/dashboard/vouchers/vouchers-client";
import { useTranslation } from "@/lib/i18n/language-context";

export function ProductClient({
  initialData,
  vouchersData,
}: {
  initialData: {
    products: any[];
    categories: string[];
    outlets?: any[];
    selectedOutletId?: string | null;
    metrics: {
      totalItems: number;
      totalBarang: number;
      totalJasa: number;
      lowStockCount: number;
    };
  };
  vouchersData?: {
    vouchers: any[];
    stats: any;
  };
}) {
  const { locale, tr } = useTranslation();
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "VOUCHERS">("PRODUCTS");
  const [data, setData] = useState(initialData);
  const [filterType, setFilterType] = useState<"ALL" | "BARANG" | "JASA">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [stockModalProductId, setStockModalProductId] = useState<string | null>(null);

  const refreshProducts = async () => {
    try {
      const refreshed = await getProductsData(data.selectedOutletId || undefined);
      setData(refreshed);
    } catch (err) {
      console.error("Error refreshing products:", err);
    }
  };

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<ProductType>("BARANG");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stockQty, setStockQty] = useState<number | string>("");
  const [minStockAlert, setMinStockAlert] = useState<number | string>(5);

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const openAddModal = () => {
    setEditItem(null);
    setName("");
    setType("BARANG");
    setCategory("");
    setPrice("");
    setImageUrl("");
    setBarcode("");
    setStockQty(10);
    setMinStockAlert(5);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditItem(p);
    setName(p.name);
    setType(p.type);
    setCategory(p.category || "");
    setPrice(Number(p.price));
    setImageUrl(p.imageUrl || "");
    setBarcode(p.barcode || "");
    setStockQty(p.stockQty ?? "");
    setMinStockAlert(p.minStockAlert ?? 5);
    setError(null);
    setShowModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editItem) {
        // Edit Mode
        const res = await updateProductAction(editItem.id, {
          name,
          type,
          price: Number(price),
          imageUrl,
          barcode,
          category,
          stockQty: type === "BARANG" ? Number(stockQty) : null,
          minStockAlert: type === "BARANG" ? Number(minStockAlert) : 5,
        });

        setData((prev) => ({
          ...prev,
          products: prev.products.map((p) =>
            p.id === editItem.id ? res.product : p
          ),
        }));
        setSuccessMsg(`Produk "${name}" berhasil diperbarui!`);
      } else {
        // Create Mode
        const res = await createProductAction({
          name,
          type,
          price: Number(price),
          imageUrl,
          barcode,
          category,
          stockQty: type === "BARANG" ? Number(stockQty) : null,
          minStockAlert: type === "BARANG" ? Number(minStockAlert) : 5,
        });

        setData((prev) => ({
          ...prev,
          products: [res.product, ...prev.products],
          metrics: {
            ...prev.metrics,
            totalItems: prev.metrics.totalItems + 1,
            totalBarang:
              type === "BARANG"
                ? prev.metrics.totalBarang + 1
                : prev.metrics.totalBarang,
            totalJasa:
              type === "JASA"
                ? prev.metrics.totalJasa + 1
                : prev.metrics.totalJasa,
          },
          categories: category && !prev.categories.includes(category)
            ? [...prev.categories, category]
            : prev.categories,
        }));
        setSuccessMsg(`Produk "${name}" berhasil ditambahkan!`);
      }

      setShowModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan produk.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    setActionLoadingId(id);
    try {
      await toggleProductStatusAction(id);
      setData((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === id ? { ...p, isActive: !p.isActive } : p
        ),
      }));
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status produk.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    const ok = await swalConfirm(
      "Hapus Produk?",
      `"${prodName}" akan dihapus permanen dari katalog.`,
      { confirmText: "Ya, Hapus", isDanger: true }
    );
    if (!ok) return;
    setActionLoadingId(id);
    try {
      await deleteProductAction(id);
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
        metrics: {
          ...prev.metrics,
          totalItems: prev.metrics.totalItems - 1,
        },
      }));
      toastSuccess(`"${prodName}" berhasil dihapus.`);
    } catch (err: any) {
      toastError(err.message || "Gagal menghapus produk.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProducts = data.products.filter((p) => {
    const matchType = filterType === "ALL" || p.type === filterType;
    const matchCat =
      selectedCategory === "ALL" || p.category === selectedCategory;
    const matchLowStock =
      !filterLowStockOnly ||
      (p.type === "BARANG" && (p.stockQty ?? 0) <= (p.minStockAlert ?? 5));
    const query = searchQuery.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query));
    return matchType && matchCat && matchLowStock && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {activeTab === "PRODUCTS" ? tr("Daftar Produk & Layanan") : "Kupon & Voucher Promo"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "PRODUCTS"
              ? tr("Kelola inventori barang fisik dan layanan jasa bisnis Anda.")
              : "Kelola kupon diskon, batas kuota pemakaian, dan promo khusus kasir Bisnis Anda."}
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("PRODUCTS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "PRODUCTS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <Package className="w-4 h-4" />
            <span>Katalog Produk ({data.metrics.totalItems})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("VOUCHERS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${activeTab === "VOUCHERS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Voucher Promo ({vouchersData?.stats?.activeVouchers ?? 0})</span>
          </button>
        </div>
      </div>

      {activeTab === "VOUCHERS" ? (
        <div className="pt-2">
          <VouchersClient
            hideHeader={true}
            initialData={
              vouchersData || {
                vouchers: [],
                stats: { totalVouchers: 0, activeVouchers: 0, totalRedeemed: 0, expiredVouchers: 0 },
              }
            }
          />
        </div>
      ) : (
        <>
          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {tr("Total Katalog")}
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {data.metrics.totalItems}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tr("Barang & Jasa")}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {tr("Barang Fisik")}
              </span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {data.metrics.totalBarang}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tr("Memiliki stok & barcode")}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {tr("Layanan Jasa")}
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {data.metrics.totalJasa}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tr("Treatment / service")}</p>
            </div>

            <div
              onClick={() => setFilterLowStockOnly((prev) => !prev)}
              className={`p-5 rounded-2xl border shadow-sm transition cursor-pointer ${filterLowStockOnly
                  ? "bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {tr("Stok Menipis")}
                </span>
                {filterLowStockOnly && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {data.metrics.lowStockCount}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tr("Klik untuk filter stok ≤ batas alert")}</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Header & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Type Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
                <button
                  onClick={() => setFilterType("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterType === "ALL"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {tr("Semua")}
                </button>
                <button
                  onClick={() => setFilterType("BARANG")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterType === "BARANG"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {tr("Barang")}
                </button>
                <button
                  onClick={() => setFilterType("JASA")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterType === "JASA"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {tr("Jasa")}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{tr("Impor Produk (CSV)")}</span>
                </button>

                <button
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Tambah Produk Baru")}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Search Bar */}
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr("Cari nama produk, kategori, atau barcode SKU...")}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Category Dropdown */}
              {data.categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">{tr("Semua Kategori")}</option>
                  {data.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{tr("Nama Produk / Jasa")}</th>
                    <th className="py-3 px-4">{tr("Tipe & Kategori")}</th>
                    <th className="py-3 px-4">{tr("Barcode / SKU")}</th>
                    <th className="py-3 px-4">{tr("Harga Jual")}</th>
                    <th className="py-3 px-4">{tr("Stok")}</th>
                    <th className="py-3 px-4">{tr("Status")}</th>
                    <th className="py-3 px-4 text-right">{tr("Aksi")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => {
                    const isLoading = actionLoadingId === p.id;
                    const minAlert = p.minStockAlert ?? 5;
                    const isOutOfStock = p.type === "BARANG" && (p.stockQty ?? 0) <= 0;
                    const isLowStock = p.type === "BARANG" && !isOutOfStock && (p.stockQty ?? 0) <= minAlert;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
                                {p.type === "BARANG" ? (
                                  <Package className="w-5 h-5 opacity-60" />
                                ) : (
                                  <Sparkles className="w-5 h-5 opacity-60 text-emerald-500" />
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-950 dark:text-slate-100">{p.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono sm:hidden">{p.barcode || ""}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {p.type === "BARANG" ? (
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                                {tr("BARANG")}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                {tr("JASA")}
                              </span>
                            )}
                            <span className="text-slate-500 text-[11px]">
                              {p.category}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {p.barcode || "-"}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          Rp {Number(p.price).toLocaleString("id-ID")}
                        </td>

                        <td className="py-3.5 px-4">
                          {p.type === "JASA" ? (
                            <span className="text-slate-400 italic text-[11px]">
                              {tr("Tidak terbatas")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setStockModalProductId(p.id)}
                              className="text-left group/stock p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                              title="Klik untuk Kelola Stok & Riwayat Mutasi"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 font-semibold ${isOutOfStock
                                        ? "text-rose-600 dark:text-rose-400 font-bold"
                                        : isLowStock
                                          ? "text-amber-600 dark:text-amber-400 font-bold"
                                          : "text-slate-700 dark:text-slate-300"
                                      }`}
                                  >
                                    {p.stockQty ?? 0} {tr("unit")}
                                    {isOutOfStock ? (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">
                                        {tr("Habis (0)")}
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">
                                        {tr("Menipis (≤ " + minAlert + ")")}
                                      </span>
                                    ) : null}
                                  </span>
                                  <SlidersHorizontal className="w-3 h-3 text-slate-400 opacity-0 group-hover/stock:opacity-100 transition-opacity text-indigo-500" />
                                </div>
                                {/* Multi-outlet breakdown badges if > 1 outlet */}
                                {p.outletStocks && p.outletStocks.length > 1 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5 max-w-[220px]">
                                    {p.outletStocks.map((os: any) => (
                                      <span
                                        key={os.id}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                                      >
                                        {os.outlet?.name || "Cabang"}:{" "}
                                        <b
                                          className={
                                            os.stockQty <= 0
                                              ? "text-rose-600 font-bold"
                                              : os.stockQty <= minAlert
                                                ? "text-amber-600 font-bold"
                                                : "text-slate-800 dark:text-slate-200"
                                          }
                                        >
                                          {os.stockQty}
                                        </b>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggle(p.id)}
                            disabled={isLoading}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition ${p.isActive
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                            />
                            {p.isActive ? tr("Aktif") : tr("Non-aktif")}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {p.type === "BARANG" && (
                                <button
                                  onClick={() => setStockModalProductId(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                                  title={tr("Kelola Stok & Kartu Mutasi")}
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                title={tr("Edit Produk")}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                title={tr("Hapus Produk")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Tambah / Edit Produk */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {editItem ? tr("Edit Produk / Jasa") : tr("Tambah Produk / Jasa")}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {tr("Lengkapi rincian katalog item untuk kasir")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-3.5">
                  {/* Foto Produk / Jasa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {tr("Foto / Gambar Item (Opsional)")}
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      {imageUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 group">
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                            title={tr("Hapus gambar")}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                          <Package className="w-5 h-5 opacity-40" />
                          <span className="text-[8px] font-bold mt-0.5">{tr("No Image")}</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer shadow-sm transition flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            <span>{tr("Upload File")}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-slate-400">{tr("atau paste link gambar URL:")}</span>
                        </div>

                        <input
                          type="url"
                          value={imageUrl.startsWith("data:") ? "" : imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/foto-produk.jpg"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {tr("Nama Item")}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={tr("Contoh: Potong Rambut Fade / Kopi Susu Aren / Pomade")}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {tr("Tipe Item")}
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ProductType)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="BARANG">{tr("BARANG (Fisik, ada stok)")}</option>
                        <option value="JASA">{tr("JASA (Layanan/Treatment)")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {tr("Kategori")}
                      </label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={tr("Contoh: Haircut / Minuman")}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {tr("Harga Jual (Rp)")}
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={tr("Contoh: 35000")}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {type === "BARANG" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            {tr("Jumlah Stok")}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={stockQty}
                            onChange={(e) => setStockQty(e.target.value)}
                            placeholder={tr("Contoh: 50")}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{tr("Batas Minimum Alert")}</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={minStockAlert}
                            onChange={(e) => setMinStockAlert(e.target.value)}
                            placeholder={tr("Contoh: 5")}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          {tr("Jumlah Stok")}
                        </label>
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 italic">
                          {tr("Tidak berlaku untuk JASA")}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {tr("Barcode / SKU (Opsional)")}
                      </label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ScanLine className="w-3 h-3" /> {tr("Scanner keyboard ready")}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder={tr("Scan atau ketik kode barcode SKU...")}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {tr("Batal")}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center gap-2"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {editItem ? tr("Simpan Perubahan") : tr("Tambah Produk")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bulk Import & Image Optimizer Modal */}
          <ImportProductModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => window.location.reload()}
          />

          {/* Multi-Outlet Stock & Mutation Ledger Modal */}
          {stockModalProductId && (
            <StockManagementModal
              productId={stockModalProductId}
              isOpen={Boolean(stockModalProductId)}
              onClose={() => setStockModalProductId(null)}
              onStockUpdated={refreshProducts}
            />
          )}
        </>
      )}
    </div>
  );
}
