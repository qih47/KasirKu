"use client";

import { useState } from "react";
import Link from "next/link";
import { voidTransactionAction } from "@/modules/transaction/actions";
import { toastError, toastSuccess, swalConfirm } from "@/lib/swal";
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
  Ban,
  Loader2,
  Lock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

interface PosHistoryClientProps {
  initialTransactions: any[];
  appliedTheme?: any;
}

export function HistoryClient(props: PosHistoryClientProps) {
  return <PosHistoryClient {...props} />;
}

export function PosHistoryClient({
  initialTransactions,
  appliedTheme,
}: PosHistoryClientProps) {
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  // Void Modal State
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [targetVoidTrx, setTargetVoidTrx] = useState<any | null>(null);
  const [voidReasonPreset, setVoidReasonPreset] = useState("Salah Input Pesanan");
  const [voidCustomReason, setVoidCustomReason] = useState("");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  const openVoidModal = (trx: any) => {
    setTargetVoidTrx(trx);
    setVoidReasonPreset("Salah Input Pesanan");
    setVoidCustomReason("");
    setSupervisorPin("");
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVoidTrx) return;

    const finalReason =
      voidReasonPreset === "Lainnya"
        ? voidCustomReason.trim()
        : voidCustomReason.trim()
        ? `${voidReasonPreset}: ${voidCustomReason.trim()}`
        : voidReasonPreset;

    if (!finalReason) {
      toastError("Alasan pembatalan transaksi wajib diisi.");
      return;
    }

    setVoidSubmitting(true);
    try {
      const res = await voidTransactionAction({
        transactionId: targetVoidTrx.id,
        reason: finalReason,
        supervisorPin: supervisorPin.trim() || undefined,
      });

      toastSuccess(res.message || "Transaksi berhasil dibatalkan (Void).");
      setTransactions((prev) =>
        prev.map((t) => (t.id === targetVoidTrx.id ? { ...t, status: "CANCELLED" } : t))
      );
      setVoidModalOpen(false);
      setTargetVoidTrx(null);
    } catch (err: any) {
      toastError(err.message || "Gagal melakukan void transaksi.");
    } finally {
      setVoidSubmitting(false);
    }
  };

  // Dynamic Theme Engine
  const tokens = (appliedTheme?.tokens as any) || {};
  const primaryColor = tokens.primaryColor || "#4f46e5";
  const accentColor = tokens.accentColor || "#06b6d4";
  const layoutStyle = tokens.layoutStyle || "MODERN";
  const isLuxeDark = layoutStyle === "LUXE";
  const isWarm = layoutStyle === "WARM";
  const isCompact = layoutStyle === "COMPACT";
  const fontFamily = tokens.fontFamily || "inherit";
  const radius = tokens.radius || (isCompact ? "0.375rem" : isWarm ? "1.5rem" : "1.25rem");

  const bgStyle = tokens.bgStyle || (isLuxeDark ? "radial-gradient(ellipse at 20% 0%, rgba(245, 158, 11, 0.09) 0%, transparent 60%), #0A0E17" : isWarm ? "radial-gradient(circle at 10% 20%, rgba(217, 119, 6, 0.05) 0%, transparent 40%), #F7F3EB" : isCompact ? "#ECEFF1" : "#F8FAFC");
  const cardBg = tokens.cardBg || (isLuxeDark ? "#121826" : isWarm ? "#FFFDF9" : "#FFFFFF");
  const cardBorder = tokens.cardBorder || (isLuxeDark ? "rgba(245, 158, 11, 0.28)" : isWarm ? "#E8DCB8" : isCompact ? "#CBD5E1" : "rgba(226, 232, 240, 0.9)");
  const textPrimary = tokens.textPrimary || (isLuxeDark ? "#F8FAFC" : isWarm ? "#29180E" : "#0F172A");
  const textSecondary = tokens.textSecondary || (isLuxeDark ? "#94A3B8" : isWarm ? "#785D4F" : "#64748B");
  const innerBoxBg = tokens.innerBoxBg || (isLuxeDark ? "#1A2234" : isWarm ? "#F3EDE2" : isCompact ? "#F1F5F9" : "#F8F9FD");
  const inputBg = tokens.inputBg || (isLuxeDark ? "#161F30" : isWarm ? "#FFFDF9" : "#FFFFFF");

  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.transactionNumber.toLowerCase().includes(q) ||
      t.shift?.kasir?.name.toLowerCase().includes(q) ||
      t.items.some((i: any) => i.product.name.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 text-left font-sans transition-all duration-300"
      style={{
        background: bgStyle,
        color: textPrimary,
        fontFamily,
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 border shadow-lg transition-all"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderRadius: radius,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="p-3 rounded-2xl border transition"
            style={{
              backgroundColor: innerBoxBg,
              borderColor: cardBorder,
              color: textPrimary,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: textPrimary }}>
              <History className="w-5 h-5" style={{ color: primaryColor }} />
              Riwayat Transaksi POS
            </h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color: textSecondary }}>
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
            className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none font-medium"
            style={{
              backgroundColor: inputBg,
              borderColor: cardBorder,
              color: textPrimary,
            }}
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div
        className="border rounded-3xl overflow-hidden shadow-lg transition-all"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderRadius: radius,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b font-bold"
              style={{
                backgroundColor: innerBoxBg,
                borderColor: cardBorder,
                color: textSecondary,
              }}
            >
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
            <tbody className="divide-y" style={{ borderColor: cardBorder }}>
              {filtered.length > 0 ? (
                filtered.map((t) => {
                  const payment = t.payments[0];
                  return (
                    <tr
                      key={t.id}
                      className="hover:opacity-80 transition"
                      style={{ borderColor: cardBorder }}
                    >
                      <td className="py-4 px-6 font-mono font-black" style={{ color: primaryColor }}>
                        {t.transactionNumber}
                      </td>

                      <td className="py-4 px-6 font-medium" style={{ color: textSecondary }}>
                        {new Date(t.createdAt).toLocaleString("id-ID")}
                      </td>

                      <td className="py-4 px-6 font-bold" style={{ color: textPrimary }}>
                        {t.shift?.kasir?.name || "Kasir"}
                      </td>

                      <td className="py-4 px-6">
                        <div className="max-w-xs truncate" style={{ color: textPrimary }}>
                          {t.items
                            .map((i: any) => `${i.quantity}x ${i.product.name}`)
                            .join(", ")}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-black" style={{ color: textPrimary }}>
                        Rp {Number(t.totalAmount).toLocaleString("id-ID")}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="px-2.5 py-1 rounded-full font-bold text-[10px] border"
                            style={{
                              backgroundColor: `${primaryColor}15`,
                              borderColor: `${primaryColor}40`,
                              color: primaryColor,
                            }}
                          >
                            {payment?.method || "CASH"}
                          </span>
                          {t.status === "CANCELLED" && (
                            <span className="px-2 py-0.5 rounded-full font-black text-[10px] border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                              VOID
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTrx(t)}
                            className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 border"
                            style={{
                              backgroundColor: innerBoxBg,
                              borderColor: cardBorder,
                              color: textPrimary,
                            }}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Struk</span>
                          </button>
                          {t.status !== "CANCELLED" && (
                            <button
                              onClick={() => openVoidModal(t)}
                              className="px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer shadow-xs"
                              title="Otorisasi pembatalan nota kasir (Void)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Void</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center"
                    style={{ color: textSecondary }}
                  >
                    Tidak ada riwayat transaksi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Ulang Struk */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
              borderRadius: radius,
            }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: cardBorder }}>
              <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
                SALINAN STRUK TRANSAKSI
              </span>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-slate-400 hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center border-b border-dashed pb-3 space-y-0.5" style={{ borderColor: cardBorder }}>
              <h4 className="font-black text-sm uppercase tracking-tight" style={{ color: textPrimary }}>
                POS UNIVERSAL
              </h4>
              <p className="text-[10px]" style={{ color: textSecondary }}>Struk Pembelian Kasir</p>
            </div>

            <div className="text-[11px] space-y-0.5 border-b border-dashed pb-2" style={{ borderColor: cardBorder, color: textSecondary }}>
              <div className="flex justify-between">
                <span>No. TRX:</span>
                <span className="font-bold" style={{ color: textPrimary }}>{selectedTrx.transactionNumber}</span>
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

            <div className="space-y-1 border-b border-dashed pb-2" style={{ borderColor: cardBorder }}>
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

            <div className="text-xs font-bold space-y-1 border-b border-dashed pb-2" style={{ borderColor: cardBorder }}>
              <div className="flex justify-between" style={{ color: textPrimary }}>
                <span>TOTAL:</span>
                <span style={{ color: primaryColor }}>
                  Rp {Number(selectedTrx.totalAmount).toLocaleString("id-ID")}
                </span>
              </div>
              {selectedTrx.payments?.[0] && (
                <>
                  <div className="flex justify-between font-normal text-[11px]" style={{ color: textSecondary }}>
                    <span>DITERIMA:</span>
                    <span>
                      Rp{" "}
                      {Number(
                        selectedTrx.payments[0].amountPaid
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-normal text-[11px]" style={{ color: textSecondary }}>
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

            <div className="text-center pt-1 text-[10px]" style={{ color: textSecondary }}>
              <p className="font-bold" style={{ color: textPrimary }}>Terima kasih atas kunjungan Anda!</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition"
                style={{
                  backgroundColor: innerBoxBg,
                  borderColor: cardBorder,
                  color: textPrimary,
                }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="w-1/2 py-3 rounded-2xl text-white font-extrabold text-xs shadow-md transition"
                style={{ backgroundColor: primaryColor }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Otorisasi Void Transaksi Kasir Modern */}
      {voidModalOpen && targetVoidTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textPrimary,
            }}
          >
            <div className="flex items-start justify-between border-b pb-3.5" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: textPrimary }}>
                    Otorisasi Void Transaksi
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Nota: {targetVoidTrx.transactionNumber} &bull; Rp {Number(targetVoidTrx.totalAmount).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVoidModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="leading-snug">
                Pembatalan transaksi akan mengembalikan stok produk &amp; bahan baku resep BOM ke cabang, serta membatalkan komisi staf terkait.
              </p>
            </div>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              {/* Preset Alasan Pembatalan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: textPrimary }}>
                  Alasan Pembatalan Nota <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    "Salah Input Pesanan",
                    "Pelanggan Membatalkan",
                    "Salah Metode Bayar",
                    "Lainnya",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setVoidReasonPreset(preset)}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-bold text-left transition cursor-pointer ${
                        voidReasonPreset === preset
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Alasan Tambahan */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={voidCustomReason}
                  onChange={(e) => setVoidCustomReason(e.target.value)}
                  placeholder={voidReasonPreset === "Lainnya" ? "Ketik alasan spesifik pembatalan (wajib)..." : "Catatan tambahan (opsional)..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  style={{
                    backgroundColor: innerBoxBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                  required={voidReasonPreset === "Lainnya"}
                />
              </div>

              {/* PIN Supervisor Otorisasi */}
              <div className="p-3.5 rounded-2xl border space-y-2" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: textPrimary }}>
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>PIN Supervisor / Owner <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-400">4 - 8 Digit Angka</span>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  minLength={4}
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ketik PIN Otorisasi Supervisor..."
                  className="w-full px-3.5 py-2 rounded-xl border text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                  required
                />
                <p className="text-[10px] text-slate-400 text-center">
                  Minta izin ke Supervisor atau Owner untuk otorisasi pembatalan nota kasir ini.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border font-bold text-xs transition cursor-pointer"
                  style={{
                    backgroundColor: innerBoxBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={voidSubmitting || !supervisorPin}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {voidSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-3.5 h-3.5" />
                  )}
                  <span>Konfirmasi Void</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
