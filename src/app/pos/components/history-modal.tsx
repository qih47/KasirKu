"use client";

import { useState, useEffect } from "react";
import {
  getTransactionHistoryAction,
  voidTransactionAction,
} from "@/modules/transaction/actions";
import { toastError, toastSuccess, swalConfirm } from "@/lib/swal";
import {
  History,
  X,
  Printer,
  Ban,
  Search,
  Loader2,
} from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  shiftId?: string;
  onReprint: (transaction: any) => void;
}

export function PosHistoryModal({
  isOpen,
  onClose,
  outletId,
  shiftId,
  onReprint,
}: HistoryModalProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [voidLoadingId, setVoidLoadingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const list = await getTransactionHistoryAction({ outletId, shiftId, limit: 50 });
      setTransactions(list || []);
    } catch (err: any) {
      toastError(err.message || "Gagal memuat riwayat transaksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, outletId, shiftId]);

  if (!isOpen) return null;

  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const num = (t.transactionNumber || "").toLowerCase();
    const cust = (t.customer?.name || "").toLowerCase();
    return num.includes(q) || cust.includes(q);
  });

  const handleVoid = async (trx: any) => {
    const reason = window.prompt(`Masukkan alasan pembatalan (Void) untuk transaksi ${trx.transactionNumber}:`);
    if (!reason || !reason.trim()) {
      if (reason !== null) toastError("Alasan pembatalan wajib diisi.");
      return;
    }

    const confirmed = await swalConfirm(
      "Konfirmasi Void Transaksi",
      `Apakah Anda yakin ingin membatalkan transaksi ${trx.transactionNumber}? Stok akan dikembalikan dan komisi akan dibatalkan.`,
      { confirmText: "Ya, Batalkan Transaksi", isDanger: true }
    );

    if (!confirmed) return;

    setVoidLoadingId(trx.id);
    try {
      const res = await voidTransactionAction({
        transactionId: trx.id,
        reason: reason.trim(),
      });
      toastSuccess(res.message || "Transaksi berhasil di-void.");
      fetchHistory();
    } catch (err: any) {
      toastError(err.message || "Gagal melakukan void transaksi.");
    } finally {
      setVoidLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Riwayat Transaksi Kasir
              </h2>
              <p className="text-xs text-slate-500">
                Daftar transaksi shift saat ini &bull; Cetak ulang struk atau void transaksi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor struk TRX atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* List of Transactions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">Memuat riwayat transaksi...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada riwayat transaksi yang ditemukan.
            </div>
          ) : (
            filtered.map((trx) => {
              const isVoid = trx.status === "VOID" || trx.status === "CANCELLED";
              const totalItems = trx.items?.reduce((s: number, i: any) => s + i.qty, 0) || 0;
              const primaryPayment = trx.payments?.[0]?.method || "CASH";

              return (
                <div
                  key={trx.id}
                  className={`p-4 rounded-2xl border transition ${
                    isVoid
                      ? "bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 opacity-75"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                          {trx.transactionNumber}
                        </span>
                        {isVoid ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            VOID / BATAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            LUNAS
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{totalItems} item barang</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Metode: {primaryPayment}
                        </span>
                        {trx.customer && (
                          <>
                            <span>&bull;</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              Pelanggan: {trx.customer.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Tagihan</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          Rp {Number(trx.totalAmount).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onReprint(trx)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-4 h-4 text-indigo-500" />
                          <span className="hidden sm:inline">Struk</span>
                        </button>

                        {!isVoid && (
                          <button
                            disabled={voidLoadingId === trx.id}
                            onClick={() => handleVoid(trx)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Void Transaksi"
                          >
                            {voidLoadingId === trx.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Void</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
