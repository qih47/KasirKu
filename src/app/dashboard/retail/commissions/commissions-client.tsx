"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  DollarSign,
  User,
  Printer,
  Sliders,
  Save,
  Tag,
  Gift,
  CheckCircle2,
  X,
  Layers,
  Award,
} from "lucide-react";
import Link from "next/link";
import {
  getRetailIncentivesData,
  updateProductIncentiveAction,
} from "@/plugins/retail/commission-actions";
import { toastSuccess, toastError } from "@/lib/swal";

export function RetailCommissionsClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"RECAP" | "SKU_BONUS">("RECAP");

  // Edit SKU bonus modal
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const openBonusModal = (p: any) => {
    const attrs = (p.attributes as any) || {};
    setEditingProduct(p);
    setBonusAmount(Number(attrs.productIncentiveAmount || 0));
  };

  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);
    try {
      await updateProductIncentiveAction({
        productId: editingProduct.id,
        incentiveAmount: Number(bonusAmount),
      });

      toastSuccess(`Bonus insentif untuk "${editingProduct.name}" berhasil disimpan!`);
      setEditingProduct(null);
      const res = await getRetailIncentivesData();
      setData(res);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan bonus insentif.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Manajemen Insentif Ritel &amp; SPG
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Bonus Penjualan SKU &amp; Reward Kasir
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Periode:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.dateRange.from} &mdash; {data.dateRange.to}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/products"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>Katalog Produk</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Insentif</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Insentif Penjualan
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            Rp {data.totalIncentivesPaid.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Reward yang berhak dicairkan staf
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Item Insentif Terjual
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {data.totalCommissionedItemsSold} Transaksi
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            SKU produk komisi yang berhasil dijual
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Staf &amp; Kasir Aktif
          </span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {data.staffList.length} Orang
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kasir Bisnis &amp; promotor
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("RECAP")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "RECAP"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
        >
          🏆 Rekap Perolehan Insentif Kasir
        </button>

        <button
          onClick={() => setActiveTab("SKU_BONUS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === "SKU_BONUS"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
        >
          🏷️ Atur Komisi per Produk (SKU)
        </button>
      </div>

      {/* TAB 1: RECAP */}
      {activeTab === "RECAP" && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
            Daftar Reward Penjualan per Kasir &amp; Promotor
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Kasir / SPG</th>
                  <th className="p-3">Produk Terjual</th>
                  <th className="p-3 text-right">Bonus Insentif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.commissions.length > 0 ? (
                  data.commissions.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 font-bold">{c.staff?.name || "-"}</td>
                      <td className="p-3">{c.transactionItem?.product?.name || "Produk Ritel"}</td>
                      <td className="p-3 text-right font-black text-blue-600">
                        Rp {Number(c.amount).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      Belum ada penjualan produk insentif pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SKU BONUS SETTINGS */}
      {activeTab === "SKU_BONUS" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Daftar Produk dengan Insentif Penjualan Khusus
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan bonus tunai per pcs untuk produk margin tinggi, kosmetik, atau cuci gudang yang berhasil dijual staf kasir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.highMarginProducts.map((p: any) => {
              const attrs = (p.attributes as any) || {};
              const currentBonus = Number(attrs.productIncentiveAmount || 0);

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {p.category || "Umum"}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {p.name}
                    </h4>
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">
                      Rp {Number(p.price).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Bonus Kasir:</span>
                      <strong className={currentBonus > 0 ? "text-blue-600" : "text-slate-400"}>
                        {currentBonus > 0 ? `Rp ${currentBonus.toLocaleString("id-ID")} / pcs` : "Belum Ada"}
                      </strong>
                    </div>

                    <button
                      onClick={() => openBonusModal(p)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition border border-blue-200"
                    >
                      Atur Bonus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Edit Bonus */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm">
                  Atur Insentif: {editingProduct.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Harga Jual: Rp {Number(editingProduct.price).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Bonus Insentif Kasir (Rp per pcs terjual)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  placeholder="Contoh: 2000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bonus ini otomatis dicatat ke akun kasir yang memproses transaksi checkout.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Menyimpan..." : "Simpan Insentif"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
