"use client";

import React, { useState } from "react";
import { X, RefreshCw, ArrowRightLeft, Users, CheckCircle2, Loader2 } from "lucide-react";
import { TableStatus } from "@prisma/client";
import { transferTableAction } from "@/plugins/cafe/actions";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";

interface TableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Array<{
    id: string;
    tableNumber: string;
    capacity: number;
    areaZone?: string | null;
    status: TableStatus;
    currentGuestName?: string | null;
    currentOrderNotes?: string | null;
  }>;
  onClearTable: (tableId: string, tableNumber: string) => Promise<void>;
  onRefreshTables?: () => Promise<void>;
  onLoadTableBill?: (table: any, orderData: any) => void;
  onPrintKitchenTicket?: (table: any, orderData: any) => void;
  themeStyles: {
    cardBg: string;
    cardBorder: string;
    innerBoxBg: string;
    textPrimary: string;
    textSecondary: string;
    radius: string;
    primaryColor: string;
  };
}

export function TableManagementModal({
  isOpen,
  onClose,
  tables,
  onClearTable,
  onRefreshTables,
  onLoadTableBill,
  onPrintKitchenTicket,
  themeStyles,
}: TableManagementModalProps) {
  const [filterZone, setFilterZone] = useState<string>("ALL");
  const [isTransferMode, setIsTransferMode] = useState<boolean>(false);
  const [sourceTableId, setSourceTableId] = useState<string>("");
  const [targetTableId, setTargetTableId] = useState<string>("");
  const [loadingTransfer, setLoadingTransfer] = useState<boolean>(false);

  if (!isOpen) return null;

  const { cardBg, cardBorder, innerBoxBg, textPrimary, textSecondary, radius } = themeStyles;

  const zones = ["ALL", ...Array.from(new Set(tables.map((t) => t.areaZone || "INDOOR")))];
  const filteredTables = filterZone === "ALL" ? tables : tables.filter((t) => (t.areaZone || "INDOOR") === filterZone);

  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTableId || !targetTableId) {
      toastError("Harap pilih meja asal dan meja tujuan.");
      return;
    }
    if (sourceTableId === targetTableId) {
      toastError("Meja asal dan meja tujuan tidak boleh sama.");
      return;
    }

    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);

    const confirmed = await swalConfirm(
      "Pindahkan Meja?",
      `Pindahkan tamu dari ${sourceTable?.tableNumber} ke ${targetTable?.tableNumber}?`,
      {
        confirmText: "Ya, Pindahkan",
        cancelText: "Batal",
      }
    );

    if (!confirmed) return;

    setLoadingTransfer(true);
    try {
      const res = await transferTableAction({
        sourceTableId,
        targetTableId,
      });
      if (res.success) {
        toastSuccess(`Tamu berhasil dipindahkan ke ${targetTable?.tableNumber}!`);
        setIsTransferMode(false);
        setSourceTableId("");
        setTargetTableId("");
        if (onRefreshTables) {
          await onRefreshTables();
        }
      }
    } catch (err: any) {
      toastError(err.message || "Gagal memindahkan meja.");
    } finally {
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className="rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 border transition-all my-8 max-h-[90vh] flex flex-col animate-scaleUp"
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
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-lg">
              🪑
            </div>
            <div>
              <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                Manajemen Status Meja Resto
              </h3>
              <p className="text-[11px]" style={{ color: textSecondary }}>
                Pantau meja terisi, kosongkan meja setelah tamu selesai, atau pindahkan meja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:opacity-80 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl border flex-shrink-0" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 font-bold border border-rose-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{occupiedCount} Terisi</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{availableCount} Kosong</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTransferMode(!isTransferMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                isTransferMode
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              style={!isTransferMode ? { backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary } : {}}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isTransferMode ? "Tutup Mode Pindah" : "Pindah Meja"}</span>
            </button>
          </div>
        </div>

        {/* Transfer Table Panel (If Active) */}
        {isTransferMode && (
          <form onSubmit={handleExecuteTransfer} className="p-4 rounded-2xl border space-y-3 flex-shrink-0 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                Form Pindah Meja Tamu
              </span>
              <span className="text-[10px] text-slate-500">
                Pilih meja yang terisi lalu pilih meja baru yang kosong
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  Meja Asal (Yang Sedang Terisi) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sourceTableId}
                  onChange={(e) => setSourceTableId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }}
                >
                  <option value="">-- Pilih Meja Terisi --</option>
                  {tables
                    .filter((t) => t.status === "OCCUPIED")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} {t.currentGuestName ? `(${t.currentGuestName})` : ""} - {t.areaZone || "INDOOR"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-400">
                  Meja Tujuan (Yang Masih Kosong) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }}
                >
                  <option value="">-- Pilih Meja Kosong --</option>
                  {tables
                    .filter((t) => t.status === "AVAILABLE")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} (Kapasitas {t.capacity} orang) - {t.areaZone || "INDOOR"}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loadingTransfer || !sourceTableId || !targetTableId}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loadingTransfer ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                )}
                <span>Konfirmasi Pindah Meja</span>
              </button>
            </div>
          </form>
        )}

        {/* Zone Filters */}
        {zones.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0">
            {zones.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => setFilterZone(zone)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  filterZone === zone
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                style={filterZone !== zone ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
              >
                {zone === "ALL" ? "Semua Area" : zone}
              </button>
            ))}
          </div>
        )}

        {/* Table Cards Grid */}
        <div className="overflow-y-auto flex-1 pr-1">
          {filteredTables.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">Tidak ada data meja pada area ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredTables.map((table) => {
                const isOccupied = table.status === "OCCUPIED";

                let parsedOrder: any = null;
                if (table.currentOrderNotes) {
                  try {
                    parsedOrder = JSON.parse(table.currentOrderNotes);
                  } catch {
                    parsedOrder = null;
                  }
                }

                const cartItems = parsedOrder?.cart || [];
                const totalItemCount = cartItems.reduce((acc: number, item: any) => acc + (item.qty || 1), 0);
                const subtotal = parsedOrder?.subtotal || 0;

                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden space-y-3 ${
                      isOccupied
                        ? "border-rose-500/50 bg-rose-500/5 shadow-sm ring-1 ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    style={{
                      backgroundColor: isOccupied ? undefined : innerBoxBg,
                      borderColor: isOccupied ? undefined : cardBorder,
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-black tracking-tight" style={{ color: textPrimary }}>
                          {table.tableNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOccupied
                              ? "bg-rose-500 text-white shadow-xs"
                              : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                          }`}
                        >
                          {isOccupied ? "Terisi (Open Bill)" : "Kosong"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{table.areaZone || "INDOOR"}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Kapasitas {table.capacity} Org</span>
                        </span>
                      </div>

                      {isOccupied && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-rose-700 dark:text-rose-300 truncate">
                              👤 {table.currentGuestName || "Tamu Meja"}
                            </span>
                            {subtotal > 0 && (
                              <span className="font-black font-mono text-rose-700 dark:text-rose-300">
                                Rp {Number(subtotal).toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>

                          {cartItems.length > 0 ? (
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-0.5 border-t border-rose-500/20">
                              {cartItems.map((c: any) => `${c.qty}x ${c.name}`).join(", ")}
                            </div>
                          ) : (
                            <p className="text-[10.5px] text-slate-400 italic">
                              {table.currentOrderNotes?.startsWith("{") ? "Pesanan tersimpan" : table.currentOrderNotes || "Belum ada rincian"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t space-y-1.5" style={{ borderColor: cardBorder }}>
                      {isOccupied ? (
                        <>
                          {onLoadTableBill && parsedOrder && (
                            <button
                              type="button"
                              onClick={() => onLoadTableBill(table, parsedOrder)}
                              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
                            >
                              <span>⚡ Buka Tagihan Meja</span>
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-1.5">
                            {onPrintKitchenTicket && (
                              <button
                                type="button"
                                onClick={() => onPrintKitchenTicket(table, parsedOrder)}
                                className="py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-slate-950 font-bold text-[10.5px] transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Cetak Tiket Pesanan Dapur"
                              >
                                <span>🍽️ KOT Dapur</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onClearTable(table.id, table.tableNumber)}
                              className="py-1.5 px-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 font-bold text-[10.5px] transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Kosongkan</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] py-1 text-emerald-600 font-bold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Siap Digunakan</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t flex justify-end flex-shrink-0" style={{ borderColor: cardBorder }}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border font-bold text-xs transition cursor-pointer"
            style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
