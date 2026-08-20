"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  ScanBarcode,
  ArrowUpRight,
  CreditCard,
  Utensils,
  ShoppingBag,
  Layers,
  Split,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PaymentMethod, TableStatus } from "@prisma/client";

export interface SplitPaymentLine {
  method: PaymentMethod;
  amount: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountPaid: number | string;
  setAmountPaid: (val: number | string) => void;
  isSplitPayment: boolean;
  setIsSplitPayment: (val: boolean) => void;
  splitPayments: SplitPaymentLine[];
  setSplitPayments: React.Dispatch<React.SetStateAction<SplitPaymentLine[]>>;
  orderType: "DINE_IN" | "TAKEAWAY" | "STANDARD";
  setOrderType: (val: "DINE_IN" | "TAKEAWAY" | "STANDARD") => void;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  hasCafePlugin: boolean;
  cafeTables: Array<{
    id: string;
    tableNumber: string;
    capacity: number;
    areaZone?: string | null;
    status: TableStatus;
  }>;
  laundryDetails?: any;
  setLaundryDetails?: (details: any) => void;
  hasLaundryPlugin?: boolean;
  loading: boolean;
  onCheckout: (e: React.FormEvent) => Promise<void>;
  themeStyles: {
    cardBg: string;
    cardBorder: string;
    innerBoxBg: string;
    inputBg: string;
    textPrimary: string;
    textSecondary: string;
    radius: string;
    primaryColor: string;
  };
}

export function PaymentModal({
  isOpen,
  onClose,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  isSplitPayment,
  setIsSplitPayment,
  splitPayments,
  setSplitPayments,
  orderType,
  setOrderType,
  selectedTableId,
  setSelectedTableId,
  hasCafePlugin,
  cafeTables,
  laundryDetails,
  setLaundryDetails,
  hasLaundryPlugin,
  loading,
  onCheckout,
  themeStyles,
}: PaymentModalProps) {
  const [quickCashNominals, setQuickCashNominals] = useState<number[]>([]);

  const { cardBg, cardBorder, innerBoxBg, inputBg, textPrimary, textSecondary, radius, primaryColor } = themeStyles;

  // Generate quick cash buttons
  useEffect(() => {
    if (grandTotal <= 0) return;
    const suggestions: number[] = [grandTotal];
    const next10k = Math.ceil(grandTotal / 10000) * 10000;
    const next20k = Math.ceil(grandTotal / 20000) * 20000;
    const next50k = Math.ceil(grandTotal / 50000) * 50000;
    const next100k = Math.ceil(grandTotal / 100000) * 100000;

    [next10k, next20k, next50k, next100k].forEach((val) => {
      if (val > grandTotal && !suggestions.includes(val)) {
        suggestions.push(val);
      }
    });
    setQuickCashNominals(suggestions.slice(0, 4));
  }, [grandTotal]);

  if (!isOpen) return null;

  // Calculate split total & remaining
  const splitTotalPaid = splitPayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalPaidEffective = isSplitPayment ? splitTotalPaid : Number(amountPaid) || 0;
  const changeAmount = Math.max(0, totalPaidEffective - grandTotal);
  const remainingAmount = Math.max(0, grandTotal - totalPaidEffective);

  const addSplitLine = () => {
    const defaultMethod: PaymentMethod = splitPayments.some((p) => p.method === "CASH") ? "QRIS" : "CASH";
    setSplitPayments([...splitPayments, { method: defaultMethod, amount: remainingAmount > 0 ? remainingAmount : 0 }]);
  };

  const removeSplitLine = (index: number) => {
    if (splitPayments.length <= 1) return;
    setSplitPayments(splitPayments.filter((_, idx) => idx !== index));
  };

  const updateSplitLine = (index: number, field: keyof SplitPaymentLine, value: any) => {
    const updated = [...splitPayments];
    updated[index] = { ...updated[index], [field]: value };
    setSplitPayments(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className="rounded-3xl p-5 sm:p-6 w-full shadow-2xl space-y-4 border transition-all my-6 max-h-[92vh] flex flex-col animate-scaleUp max-w-2xl"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          color: textPrimary,
          borderRadius: radius,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3.5 flex-shrink-0" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-sm" style={{ color: textPrimary }}>
                Pembayaran Transaksi
              </h3>
              <p className="text-[11px]" style={{ color: textSecondary }}>
                Pilih metode pembayaran dan masukkan nominal uang diterima.
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

        {/* Modal Body */}
        <form onSubmit={onCheckout} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {/* Order Type Selector (Dine In / Takeaway for Cafe/Resto) */}
          {hasCafePlugin && (
            <div className="space-y-2">
              <label className="font-bold text-xs block" style={{ color: textPrimary }}>
                Tipe Pesanan &amp; Tempat Duduk:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("DINE_IN")}
                  className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                    orderType === "DINE_IN"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  style={orderType !== "DINE_IN" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
                >
                  <Utensils className="w-4 h-4" />
                  <span>Makan di Tempat (Dine In)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderType("TAKEAWAY");
                    setSelectedTableId(null);
                  }}
                  className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                    orderType === "TAKEAWAY"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  style={orderType !== "TAKEAWAY" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Bungkus (Take Away)</span>
                </button>
              </div>

              {/* Table Selector Grid if DINE_IN */}
              {orderType === "DINE_IN" && (
                <div className="p-3.5 rounded-2xl border space-y-2 bg-indigo-50/30 dark:bg-indigo-950/20" style={{ borderColor: cardBorder }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color: textPrimary }}>
                      🪑 Pilih Nomor Meja:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedTableId
                        ? `Dipilih: ${cafeTables.find((t) => t.id === selectedTableId)?.tableNumber || "Meja"}`
                        : "(Bebas / Tanpa Meja)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(null)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer font-bold text-[11px] ${
                        selectedTableId === null
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      style={selectedTableId !== null ? { backgroundColor: cardBg, borderColor: cardBorder, color: textSecondary } : {}}
                    >
                      Bebas
                    </button>
                    {cafeTables.map((t) => {
                      const isOccupied = t.status === "OCCUPIED";
                      const isSelected = selectedTableId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => setSelectedTableId(t.id)}
                          className={`p-2 rounded-xl border text-center transition font-bold text-[11px] truncate ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs cursor-pointer"
                              : isOccupied
                              ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 line-through text-slate-400"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          }`}
                          style={!isSelected && !isOccupied ? { backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary } : {}}
                        >
                          {t.tableNumber} {isOccupied ? "(Terisi)" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grand Total Banner */}
          <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Tagihan
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono text-indigo-600">
                Rp {grandTotal.toLocaleString("id-ID")}
              </p>
            </div>

            {/* Split Payment Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isSplitPayment;
                setIsSplitPayment(nextState);
                if (nextState && splitPayments.length === 0) {
                  setSplitPayments([
                    { method: "CASH", amount: Math.round(grandTotal / 2) },
                    { method: "QRIS", amount: grandTotal - Math.round(grandTotal / 2) },
                  ]);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSplitPayment
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              style={!isSplitPayment ? { backgroundColor: cardBg, borderColor: cardBorder, color: textSecondary } : {}}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{isSplitPayment ? "Pisah Bayar: Aktif" : "Bagi Pembayaran (Split)"}</span>
            </button>
          </div>

          {/* SINGLE PAYMENT MODE */}
          {!isSplitPayment ? (
            <div className="space-y-3.5">
              {/* Payment Methods Grid */}
              <div className="space-y-1.5">
                <label className="font-bold block" style={{ color: textPrimary }}>
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("CASH");
                      if (!amountPaid || Number(amountPaid) < grandTotal) setAmountPaid(grandTotal);
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      paymentMethod === "CASH"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    style={paymentMethod !== "CASH" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("QRIS");
                      setAmountPaid(grandTotal);
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      paymentMethod === "QRIS"
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    style={paymentMethod !== "QRIS" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
                  >
                    <ScanBarcode className="w-4 h-4" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("TRANSFER");
                      setAmountPaid(grandTotal);
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      paymentMethod === "TRANSFER"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    style={paymentMethod !== "TRANSFER" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Transfer Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("CARD");
                      setAmountPaid(grandTotal);
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      paymentMethod === "CARD"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    style={paymentMethod !== "CARD" ? { backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary } : {}}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Kartu Debit/Kredit</span>
                  </button>
                </div>
              </div>

              {/* Cash Paid Input & Quick Pills */}
              <div className="space-y-2">
                <label className="font-bold block" style={{ color: textPrimary }}>
                  Uang yang Diterima (Rp):
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-2xl border text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: cardBorder,
                    color: textPrimary,
                  }}
                />

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(grandTotal)}
                    className="px-3 py-1 rounded-xl border text-[11px] font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
                  >
                    Uang Pas (Rp {grandTotal.toLocaleString("id-ID")})
                  </button>
                  {quickCashNominals
                    .filter((n) => n > grandTotal)
                    .map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAmountPaid(n)}
                        className="px-3 py-1 rounded-xl border text-[11px] font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textSecondary }}
                      >
                        Rp {n.toLocaleString("id-ID")}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            /* SPLIT PAYMENT MODE */
            <div className="space-y-3 p-4 rounded-2xl border bg-indigo-50/20 dark:bg-indigo-950/10" style={{ borderColor: cardBorder }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: textPrimary }}>
                  <Split className="w-3.5 h-3.5 text-indigo-600" />
                  Rincian Pembagian Pembayaran
                </span>
                <button
                  type="button"
                  onClick={addSplitLine}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Metode</span>
                </button>
              </div>

              <div className="space-y-2">
                {splitPayments.map((sp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={sp.method}
                      onChange={(e) => updateSplitLine(idx, "method", e.target.value as PaymentMethod)}
                      className="px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textPrimary }}
                    >
                      <option value="CASH">💵 Tunai (Cash)</option>
                      <option value="QRIS">📱 QRIS</option>
                      <option value="TRANSFER">🏦 Transfer Bank</option>
                      <option value="CARD">💳 Kartu Debit/Kredit</option>
                    </select>

                    <input
                      type="number"
                      min={0}
                      value={sp.amount || ""}
                      onChange={(e) => updateSplitLine(idx, "amount", Number(e.target.value))}
                      placeholder="Nominal (Rp)"
                      className="flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none"
                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textPrimary }}
                    />

                    {splitPayments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSplitLine(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Split Summary */}
              <div className="pt-2 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: cardBorder }}>
                <span>Total Terbagi: Rp {splitTotalPaid.toLocaleString("id-ID")}</span>
                {remainingAmount > 0 ? (
                  <span className="text-rose-500">Kurang: Rp {remainingAmount.toLocaleString("id-ID")}</span>
                ) : (
                  <span className="text-emerald-600">✓ Pas / Lunas</span>
                )}
              </div>
            </div>
          )}

          {/* Change Info Banner */}
          <div className="p-3.5 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
            <span className="font-bold text-xs" style={{ color: textSecondary }}>
              Uang Kembalian:
            </span>
            <span className="text-base font-black font-mono text-emerald-600">
              Rp {changeAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 border-t flex items-center justify-end gap-2" style={{ borderColor: cardBorder }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border font-bold text-xs transition cursor-pointer"
              style={{ backgroundColor: innerBoxBg, borderColor: cardBorder, color: textPrimary }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || totalPaidEffective < grandTotal}
              className="flex-1 max-w-xs py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {loading
                  ? "Memproses Transaksi..."
                  : `Bayar Lunas Rp ${grandTotal.toLocaleString("id-ID")}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
