"use client";

import React, { useState } from "react";
import {
  Scissors,
  X,
  RefreshCw,
  Armchair,
  Clock,
  User,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  Play,
  Check,
} from "lucide-react";

interface BarberQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: any[];
  onRefresh?: () => Promise<void>;
  onLoadToCart: (booking: any) => void;
  themeStyles: {
    cardBg: string;
    cardBorder: string;
    innerBoxBg: string;
    textPrimary: string;
    textSecondary: string;
    primaryColor: string;
  };
}

export function BarberQueueModal({
  isOpen,
  onClose,
  bookings,
  onRefresh,
  onLoadToCart,
  themeStyles,
}: BarberQueueModalProps) {
  const [filterTab, setFilterTab] = useState<"ALL" | "IN_PROGRESS" | "WAITING" | "COMPLETED">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const { cardBg, cardBorder, innerBoxBg, textPrimary, textSecondary, primaryColor } = themeStyles;

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === "ALL") return true;
    return b.status === filterTab;
  });

  const inProgressCount = bookings.filter((b) => b.status === "IN_PROGRESS").length;
  const waitingCount = bookings.filter((b) => b.status === "WAITING").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 border"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b flex-shrink-0" style={{ borderColor: cardBorder }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-2" style={{ color: textPrimary }}>
                <span>Antrean Kursi Barbershop</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono">
                  {bookings.length} Antrean
                </span>
              </h3>
              <p className="text-xs" style={{ color: textSecondary }}>
                Pilih pelanggan untuk langsung memuat layanan &amp; komisi kapster ke kasir POS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl border transition hover:opacity-80 text-slate-500 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                title="Segarkan Antrean"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border flex-shrink-0" style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}>
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTab === "ALL" ? "bg-amber-500 text-slate-950 shadow-xs font-black" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("IN_PROGRESS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTab === "IN_PROGRESS" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Di Kursi</span>
            {inProgressCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {inProgressCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("WAITING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTab === "WAITING" ? "bg-amber-500 text-slate-950 shadow-xs font-black" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu</span>
            {waitingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">
                {waitingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTab === "COMPLETED" ? "bg-emerald-600 text-white shadow-xs font-black" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
            {completedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {completedCount}
              </span>
            )}
          </button>
        </div>

        {/* List of Bookings */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Scissors className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold" style={{ color: textPrimary }}>
                Tidak ada antrean pada kategori ini.
              </p>
              <p className="text-[11px]" style={{ color: textSecondary }}>
                Gunakan menu Live Queue Barbershop untuk mendaftarkan pelanggan baru.
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => {
              const isInProgress = b.status === "IN_PROGRESS";
              const isWaiting = b.status === "WAITING";
              const isCompleted = b.status === "COMPLETED";

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border transition-all space-y-3 hover:border-amber-400"
                  style={{ backgroundColor: innerBoxBg, borderColor: cardBorder }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-black text-xs">
                          {b.queueNumber}
                        </span>
                        {b.chairNumber && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Armchair className="w-3 h-3" /> Kursi #{b.chairNumber}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isInProgress
                              ? "bg-indigo-500/15 text-indigo-600 border border-indigo-500/30"
                              : isWaiting
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                          }`}
                        >
                          {isInProgress ? "Sedang Dikerjakan" : isWaiting ? "Menunggu" : "Selesai Pangkas"}
                        </span>
                      </div>

                      <h4 className="font-black text-sm" style={{ color: textPrimary }}>
                        {b.customerName}
                      </h4>

                      {b.customerPhone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {b.customerPhone}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black font-mono" style={{ color: textPrimary }}>
                        {b.service ? `Rp ${Number(b.service.price).toLocaleString("id-ID")}` : "Tarif Custom"}
                      </p>
                      <span className="text-[10px]" style={{ color: textSecondary }}>
                        {b.service?.name || "Layanan Pangkas"}
                      </span>
                    </div>
                  </div>

                  {/* Detail Kapster & Notes */}
                  <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs" style={{ borderColor: cardBorder }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Kapster:</span>
                      <strong className="font-bold text-indigo-600 dark:text-indigo-400">
                        {b.barber?.name || "Sembarang Kapster"}
                      </strong>
                      {b.barber && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-bold">
                          Komisi Auto
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onLoadToCart(b)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Muat ke Kasir POS</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
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
