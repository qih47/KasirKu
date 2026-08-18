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
  appliedTheme?: any;
}

export function HistoryClient(props: PosHistoryClientProps) {
  return <PosHistoryClient {...props} />;
}

export function PosHistoryClient({
  initialTransactions,
  appliedTheme,
}: PosHistoryClientProps) {
  const [transactions] = useState<any[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

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
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedTrx(t)}
                          className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ml-auto border"
                          style={{
                            backgroundColor: innerBoxBg,
                            borderColor: cardBorder,
                            color: textPrimary,
                          }}
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
    </div>
  );
}
