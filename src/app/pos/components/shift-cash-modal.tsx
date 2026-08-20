"use client";

import React from "react";
import {
  X,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ScanBarcode,
  Layers,
  Lock,
  Printer,
  Loader2,
  Check,
} from "lucide-react";

interface ShiftCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "SUMMARY" | "CASH_MOVEMENT";
  setActiveTab: (tab: "SUMMARY" | "CASH_MOVEMENT") => void;
  loadingSummary: boolean;
  liveShiftSummary: any | null;
  activeShift: any | null;
  movementType: "IN" | "OUT";
  setMovementType: (type: "IN" | "OUT") => void;
  movementAmount: number | string;
  setMovementAmount: (amount: string) => void;
  movementNote: string;
  setMovementNote: (note: string) => void;
  handleCashMovement: (e: React.FormEvent) => Promise<void>;
  loadingMovement: boolean;
  onOpenCloseShift: () => void;
  themeStyles: {
    cardBg: string;
    cardBorder: string;
    innerBoxBg: string;
    inputBg: string;
    textPrimary: string;
    textSecondary: string;
    radius: string;
  };
}

export function ShiftCashModal({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  loadingSummary,
  liveShiftSummary,
  activeShift,
  movementType,
  setMovementType,
  movementAmount,
  setMovementAmount,
  movementNote,
  setMovementNote,
  handleCashMovement,
  loadingMovement,
  onOpenCloseShift,
  themeStyles,
}: ShiftCashModalProps) {
  if (!isOpen) return null;

  const { cardBg, cardBorder, innerBoxBg, inputBg, textPrimary, textSecondary, radius } = themeStyles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className="rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 border transition-all my-8 max-h-[90vh] flex flex-col animate-scaleUp"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          color: textPrimary,
          borderRadius: radius,
        }}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b pb-3.5 flex-shrink-0" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                Manajemen Kas &amp; Rekap Shift
              </h3>
              <p className="text-[11px]" style={{ color: textSecondary }}>
                Pantau arus kas laci dan catat mutasi uang masuk/keluar operasional.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:opacity-80 p-1 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-2xl border flex-shrink-0" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
          <button
            type="button"
            onClick={() => setActiveTab("SUMMARY")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "SUMMARY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            style={activeTab !== "SUMMARY" ? { color: textSecondary } : {}}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>📊 Rekap Shift &amp; Omzet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CASH_MOVEMENT")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "CASH_MOVEMENT"
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            style={activeTab !== "CASH_MOVEMENT" ? { color: textSecondary } : {}}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>💸 Kas Masuk / Keluar (+/-)</span>
            {activeShift?.cashMovements && activeShift.cashMovements.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-white">
                {activeShift.cashMovements.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: REKAP SHIFT & OMZET */}
        {activeTab === "SUMMARY" && (
          <>
            {loadingSummary ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-semibold">Mengambil data rekap kas shift...</p>
              </div>
            ) : liveShiftSummary ? (
              <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                {/* Header Info Banner */}
                <div className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-[11px]" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                  <div>
                    <span className="opacity-60 block">Kasir Bertugas:</span>
                    <strong className="text-xs font-black">{liveShiftSummary.cashierName}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">Cabang Outlet:</span>
                    <strong className="text-xs font-black">{liveShiftSummary.outletName}</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">Waktu Buka:</span>
                    <strong className="text-xs font-mono">{new Date(liveShiftSummary.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</strong>
                  </div>
                  <div>
                    <span className="opacity-60 block">Modal Awal:</span>
                    <strong className="text-xs font-mono text-emerald-600">Rp {Number(liveShiftSummary.openingCash || 0).toLocaleString("id-ID")}</strong>
                  </div>
                </div>

                {/* 4 Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omzet Kotor</span>
                    <p className="text-base font-black text-indigo-600 font-mono">
                      Rp {Number(liveShiftSummary.grossSalesTotal || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">{liveShiftSummary.totalTransactions} Transaksi</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penjualan Tunai (Cash)</span>
                    <p className="text-base font-black text-emerald-600 font-mono">
                      Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">Masuk ke laci</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Non-Tunai (QRIS/TRF)</span>
                    <p className="text-base font-black text-cyan-600 font-mono">
                      Rp {Number(liveShiftSummary.nonCashTotal || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">QRIS/Transfer/Kartu</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border space-y-1" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uang Kas di Laci</span>
                    <p className="text-base font-black text-amber-500 font-mono">
                      Rp {Number(liveShiftSummary.expectedCash || 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">Modal + Cash + In - Out</span>
                  </div>
                </div>

                {/* Grid 2 Kolom: Rincian Pembayaran & Rincian Arus Kas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Kolom 1: Breakdown Metode Bayar */}
                  <div className="p-4 rounded-2xl border space-y-2.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <h4 className="font-bold text-xs flex items-center justify-between" style={{ color: textPrimary }}>
                      <span>💳 Rincian Metode Pembayaran</span>
                      <span className="text-[10px] text-slate-400 font-mono">{liveShiftSummary.totalTransactions} Transaksi</span>
                    </h4>
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: cardBorder }}>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-emerald-500" /> Tunai (Cash):</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><ScanBarcode className="w-3 h-3 text-cyan-500" /> QRIS:</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.qrisSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-indigo-500" /> Transfer Bank:</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.transferSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-purple-500" /> Kartu Debit/Kredit:</span>
                        <span className="font-mono font-bold">Rp {Number(liveShiftSummary.cardSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 2: Rekonsiliasi Kas Laci */}
                  <div className="p-4 rounded-2xl border space-y-2.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <h4 className="font-bold text-xs flex items-center justify-between" style={{ color: textPrimary }}>
                      <span>💵 Rekonsiliasi Kas Fisik Laci</span>
                      <span className="text-[10px] text-amber-500 font-bold">Wajib dihitung</span>
                    </h4>
                    <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: cardBorder }}>
                      <div className="flex justify-between items-center py-1">
                        <span>Modal Awal Kasir:</span>
                        <span className="font-mono font-semibold">+ Rp {Number(liveShiftSummary.openingCash || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Penjualan Kas (Cash Sales):</span>
                        <span className="font-mono font-semibold text-emerald-600">+ Rp {Number(liveShiftSummary.cashSalesTotal || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Kas Masuk Tambahan:</span>
                        <span className="font-mono font-semibold text-emerald-600">+ Rp {Number(liveShiftSummary.cashIn || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Kas Keluar Operasional:</span>
                        <span className="font-mono font-semibold text-rose-500">- Rp {Number(liveShiftSummary.cashOut || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t font-black" style={{ borderColor: cardBorder }}>
                        <span>Uang Fisik Seharusnya:</span>
                        <span className="font-mono text-sm text-indigo-600">Rp {Number(liveShiftSummary.expectedCash || 0).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Produk Terlaris Shift Ini */}
                {liveShiftSummary.topProducts && liveShiftSummary.topProducts.length > 0 && (
                  <div className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                    <h4 className="font-bold text-xs" style={{ color: textPrimary }}>
                      🔥 Produk Paling Laku pada Shift Ini
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {liveShiftSummary.topProducts.map((tp: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-xl border flex items-center justify-between" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                              <div className="overflow-hidden mr-2">
                                <p className="font-bold truncate text-xs">{tp.name}</p>
                                <p className="text-[10px] text-slate-400">Rp {Number(tp.subtotal).toLocaleString("id-ID")}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 font-mono font-bold text-xs">
                                {tp.qty}x
                              </span>
                            </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daftar Transaksi Terakhir di Shift Ini */}
                <div className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs" style={{ color: textPrimary }}>
                      📋 Riwayat Transaksi Shift Ini ({liveShiftSummary.recentTransactions?.length || 0})
                    </h4>
                  </div>
                  {liveShiftSummary.recentTransactions && liveShiftSummary.recentTransactions.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {liveShiftSummary.recentTransactions.map((trx: any) => (
                        <div
                          key={trx.id}
                          className="p-2.5 rounded-xl border flex items-center justify-between text-[11px] gap-2"
                          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{trx.transactionNumber}</p>
                            <p className="text-[10px] text-slate-400 truncate">{trx.itemsSummary}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold font-mono text-emerald-600">Rp {trx.totalAmount.toLocaleString("id-ID")}</p>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {trx.paymentMethod}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 py-3 text-center">Belum ada transaksi penjualan pada shift ini.</p>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* TAB 2: MUTASI KAS MASUK / KELUAR */}
        {activeTab === "CASH_MOVEMENT" && (
          <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
            {/* Form Input Kas Masuk / Keluar */}
            <form onSubmit={handleCashMovement} className="p-4 rounded-2xl border space-y-3.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
              <div className="flex items-center justify-between">
                <span className="font-black text-xs" style={{ color: textPrimary }}>
                  📝 Form Catat Mutasi Kas
                </span>
                <span className="text-[10px] text-slate-400">
                  Uang kas masuk / keluar di luar transaksi penjualan
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType("IN")}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    movementType === "IN"
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30"
                      : "border"
                  }`}
                  style={movementType !== "IN" ? { backgroundColor: cardBg, borderColor: cardBorder, color: textSecondary } : undefined}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Kas Masuk (+ IN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("OUT")}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    movementType === "OUT"
                      ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/30"
                      : "border"
                  }`}
                  style={movementType !== "OUT" ? { backgroundColor: cardBg, borderColor: cardBorder, color: textSecondary } : undefined}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Kas Keluar (- OUT)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                    Nominal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: textSecondary }}>
                    Keterangan / Alasan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={movementNote}
                    onChange={(e) => setMovementNote(e.target.value)}
                    placeholder="Misal: Beli es batu, Galon, Tambah modal koin"
                    className="w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingMovement || !movementAmount}
                  className="px-5 py-2 rounded-xl text-white font-extrabold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: movementType === "IN" ? "#059669" : "#e11d48" }}
                >
                  {loadingMovement ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Kas {movementType === "IN" ? "Masuk" : "Keluar"}</span>
                </button>
              </div>
            </form>

            {/* Riwayat Mutasi Kas Berjalan */}
            <div className="p-4 rounded-2xl border space-y-2.5" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs" style={{ color: textPrimary }}>
                  📋 Riwayat Mutasi Kas Shift Ini ({activeShift?.cashMovements?.length || 0})
                </h4>
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="text-emerald-600 font-bold">
                    Masuk: +Rp {Number(liveShiftSummary?.cashIn || 0).toLocaleString("id-ID")}
                  </span>
                  <span>&bull;</span>
                  <span className="text-rose-500 font-bold">
                    Keluar: -Rp {Number(liveShiftSummary?.cashOut || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {activeShift?.cashMovements && activeShift.cashMovements.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {activeShift.cashMovements.map((m: any) => {
                    const isIn = m.type === "IN";
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl border flex items-center justify-between text-[11px] gap-2"
                        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                              isIn ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                            }`}
                          >
                            {isIn ? "↓" : "↑"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold truncate" style={{ color: textPrimary }}>{m.note}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </p>
                          </div>
                        </div>
                        <span className={`font-mono font-bold text-xs flex-shrink-0 ${isIn ? "text-emerald-600" : "text-rose-500"}`}>
                          {isIn ? "+" : "-"} Rp {Number(m.amount).toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 py-6 text-center">
                  Belum ada mutasi kas masuk / keluar pada shift ini.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2 flex-shrink-0" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: cardBorder }}
              title="Cetak Ringkasan Shift ke Printer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cetak Z-Report</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-bold text-xs transition cursor-pointer"
              style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCloseShift();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tutup Shift Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
