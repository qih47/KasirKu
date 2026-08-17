"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Printer,
  Receipt,
  CheckCircle2,
  Clock,
  User,
  History,
  X,
} from "lucide-react";

interface PosHistoryClientProps {
  initialTransactions: any[];
}

export function PosHistoryClient({
  initialTransactions,
}: PosHistoryClientProps) {
  const [transactions] = useState<any[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.transactionNumber.toLowerCase().includes(q) ||
      t.shift.kasir.name.toLowerCase().includes(q) ||
      t.items.some((i: any) => i.product.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6 text-left font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header - Clean White */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="p-3 rounded-2xl bg-[#F8F9FD] border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-950 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Riwayat Transaksi POS
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Daftar transaksi penjualan kasir dan cetak ulang struk thermal
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. TRX / Kasir / Item..."
            className="w-full pl-10 pr-3 py-2.5 bg-[#F8F9FD] border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
          />
        </div>
      </div>

      {/* Transaction Table - Clean White */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FD] text-slate-600 border-b border-slate-200/80 font-bold">
              <tr>
                <th className="py-3.5 px-6">No. Transaksi</th>
                <th className="py-3.5 px-6">Waktu Transaksi</th>
                <th className="py-3.5 px-6">Kasir</th>
                <th className="py-3.5 px-6">Item Belanja</th>
                <th className="py-3.5 px-6">Total Tagihan</th>
                <th className="py-3.5 px-6">Metode Bayar</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((t) => {
                  const payment = t.payments[0];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-4 px-6 font-mono font-black text-indigo-600">
                        {t.transactionNumber}
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {new Date(t.createdAt).toLocaleString("id-ID")}
                      </td>

                      <td className="py-4 px-6 text-slate-900 font-bold">
                        {t.shift?.kasir?.name || "Kasir"}
                      </td>

                      <td className="py-4 px-6">
                        <div className="max-w-xs truncate text-slate-700">
                          {t.items
                            .map((i: any) => `${i.quantity}x ${i.product.name}`)
                            .join(", ")}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-black text-slate-950">
                        Rp {Number(t.totalAmount).toLocaleString("id-ID")}
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                          {payment?.method || "CASH"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedTrx(t)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 text-xs"
                  >
                    Tidak ada transaksi yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Ulang Struk - Clean White Surface */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold text-slate-400">
                SALINAN STRUK TRANSAKSI
              </span>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
              <h4 className="font-black text-sm uppercase tracking-tight text-slate-950">
                POS UNIVERSAL
              </h4>
              <p className="text-[10px] text-slate-500">Struk Pembelian Kasir</p>
            </div>

            <div className="text-[11px] space-y-0.5 text-slate-600 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>No. TRX:</span>
                <span className="font-bold">{selectedTrx.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>
                  {new Date(selectedTrx.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{selectedTrx.shift?.kasir?.name}</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
              {selectedTrx.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-[11px]">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span>
                    Rp{" "}
                    {(
                      item.quantity * Number(item.pricePerUnit)
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs font-bold space-y-1 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between text-slate-950">
                <span>TOTAL:</span>
                <span>
                  Rp {Number(selectedTrx.totalAmount).toLocaleString("id-ID")}
                </span>
              </div>
              {selectedTrx.payments?.[0] && (
                <>
                  <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                    <span>DITERIMA:</span>
                    <span>
                      Rp{" "}
                      {Number(
                        selectedTrx.payments[0].amountPaid
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                    <span>KEMBALIAN:</span>
                    <span>
                      Rp{" "}
                      {Number(
                        selectedTrx.payments[0].change
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center pt-1 text-[10px] text-slate-500">
              <p className="font-bold text-slate-700">Terima kasih atas kunjungan Anda!</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="w-1/2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
