"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  Utensils,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  DynamicReceiptRenderer,
  TransactionReceiptData,
} from "./dynamic-receipt-renderer";
import {
  generateUniversalEscPosReceipt,
  generateCafeKotKitchenSlip,
} from "@/lib/escpos-printer";
import { toastSuccess, toastError } from "@/lib/swal";

interface ModularThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: TransactionReceiptData;
  receiptConfig?: any;
}

export function ModularThermalReceiptModal({
  isOpen,
  onClose,
  receiptData,
  receiptConfig = {},
}: ModularThermalReceiptModalProps) {
  const [activeTab, setActiveTab] = useState<"CUSTOMER" | "KITCHEN">("CUSTOMER");
  const [paperSize, setPaperSize] = useState<"58mm" | "80mm">(
    receiptConfig.paperSize || "58mm"
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isCafe = receiptData.vertical === "CAFE";

  // 1. Action: Cetak Langsung Browser (Ctrl + P)
  const handlePrint = () => {
    window.print();
  };

  // 2. Action: Format & Kirim ke WhatsApp
  const handleSendWhatsApp = () => {
    const phone = receiptData.customerPhone?.replace(/[^0-9]/g, "");
    const targetPhone = phone
      ? phone.startsWith("0")
        ? `62${phone.slice(1)}`
        : phone
      : "";

    const itemsText = receiptData.items
      .map((i) => `• ${i.qty}x ${i.name} (Rp ${(i.qty * i.price).toLocaleString("id-ID")})`)
      .join("\n");

    const message = encodeURIComponent(
      `*${receiptData.storeName.toUpperCase()}*\n` +
      `--------------------------------\n` +
      `No. Struk: *${receiptData.invoiceNo}*\n` +
      `Tanggal: ${receiptData.dateTime}\n` +
      `Kasir: ${receiptData.cashierName}\n` +
      (receiptData.customerName ? `Pelanggan: ${receiptData.customerName}\n` : "") +
      `--------------------------------\n` +
      `*RINCIAN ITEM:*\n${itemsText}\n` +
      `--------------------------------\n` +
      `Subtotal: Rp ${receiptData.subtotal.toLocaleString("id-ID")}\n` +
      (receiptData.discountAmount ? `Diskon: -Rp ${receiptData.discountAmount.toLocaleString("id-ID")}\n` : "") +
      `*TOTAL: Rp ${receiptData.grandTotal.toLocaleString("id-ID")}*\n` +
      `Bayar (${receiptData.paymentMethod}): Rp ${(receiptData.amountPaid || receiptData.grandTotal).toLocaleString("id-ID")}\n` +
      (receiptData.changeAmount ? `Kembalian: Rp ${receiptData.changeAmount.toLocaleString("id-ID")}\n` : "") +
      `--------------------------------\n` +
      `_${receiptData.footerNote || "Terima kasih atas kunjungan Anda!"}_\n` +
      `_Powered by POS Universal_`
    );

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(waUrl, "_blank");
  };

  // 3. Action: Unduh Format ESC/POS
  const handleDownloadEscPos = () => {
    try {
      const escPosData: any = {
        ...receiptData,
        businessName: receiptData.storeName,
        totalAmount: receiptData.grandTotal,
        amountPaid: receiptData.amountPaid || receiptData.grandTotal,
        change: receiptData.changeAmount || 0,
        date: receiptData.dateTime,
        vertical: receiptData.vertical || "GENERAL",
      };

      const rawContent =
        activeTab === "KITCHEN"
          ? generateCafeKotKitchenSlip(escPosData, paperSize)
          : generateUniversalEscPosReceipt(escPosData, paperSize);

      const blob = new Blob([rawContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptData.invoiceNo}-${activeTab.toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Format ESC/POS berhasil diunduh.");
    } catch (err: any) {
      toastError("Gagal mengunduh format ESC/POS.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Pratinjau Struk Thermal</h3>
              <p className="text-[11px] text-slate-500">
                Struk resmi 4 Vertikal &amp; Slip Dapur (58mm / 80mm)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Selector */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Tab Pelanggan vs Dapur (Khusus F&B Cafe) */}
          {isCafe ? (
            <div className="p-1 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("CUSTOMER")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "CUSTOMER"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Struk Tagihan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("KITCHEN")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "KITCHEN"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Slip Dapur (KOT)</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Vertikal: <strong>{receiptData.vertical || "RETAIL"}</strong>
            </span>
          )}

          {/* Paper Size Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Ukuran:</span>
            <button
              type="button"
              onClick={() => setPaperSize("58mm")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                paperSize === "58mm"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              58mm
            </button>
            <button
              type="button"
              onClick={() => setPaperSize("80mm")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                paperSize === "80mm"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              80mm
            </button>
          </div>
        </div>

        {/* Preview Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 dark:bg-slate-950 flex justify-center">
          <div className="w-full">
            <DynamicReceiptRenderer
              data={receiptData}
              config={{
                ...receiptConfig,
                paperSize,
              }}
              isKitchenTicketMode={activeTab === "KITCHEN"}
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadEscPos}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh RAW ESC/POS"
            >
              <Download className="w-4 h-4" />
              <span>ESC/POS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
