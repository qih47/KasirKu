"use client";

import React from "react";
import { ReceiptPresetBlueprint, ReceiptBlock } from "@/types/plugin-package";

// Import sample receipt presets
import modern80mm from "@/lib/registry/presets/receipt-modern-thermal-80mm.json";
import compact58mm from "@/lib/registry/presets/receipt-compact-58mm.json";

export interface TransactionReceiptData {
  storeName: string;
  outletName?: string;
  address?: string;
  phone?: string;
  headerNote?: string;
  logoUrl?: string | null;
  invoiceNo: string;
  dateTime: string;
  cashierName: string;
  queueNumber?: string;
  tableNumber?: string;
  orderType?: string; // "Dine In" | "Take Away" | "Delivery"
  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
    notes?: string;
  }>;
  subtotal: number;
  discountAmount?: number;
  taxPb1Amount?: number;
  serviceChargeAmount?: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid?: number;
  changeAmount?: number;
  qrisPayload?: string;
  coupon?: {
    code: string;
    text: string;
    expiryDate?: string;
  };
  wifi?: {
    ssid: string;
    password: string;
  };
  footerNote?: string;
}

export const BUILTIN_RECEIPT_PRESETS: Record<
  string,
  { name: string; preset: ReceiptPresetBlueprint; description: string }
> = {
  "qassa-receipt-modern-80mm": {
    name: "Thermal Modern Pro (80mm)",
    preset: modern80mm.receipt as unknown as ReceiptPresetBlueprint,
    description: "Layout 80mm lengkap dengan nomor antrean jumbo, logo, dan rincian pajak.",
  },
  "qassa-receipt-compact-58mm": {
    name: "Eco Compact Mini (58mm)",
    preset: compact58mm.receipt as unknown as ReceiptPresetBlueprint,
    description: "Layout 58mm ringkas & hemat kertas untuk printer bluetooth kasir portable.",
  },
};

export function DynamicReceiptRenderer({
  preset,
  data,
  isPrintMode = false,
}: {
  preset?: ReceiptPresetBlueprint;
  data: TransactionReceiptData;
  isPrintMode?: boolean;
}) {
  const activePreset = preset || BUILTIN_RECEIPT_PRESETS["qassa-receipt-modern-80mm"].preset;
  const paperWidth = activePreset.paperWidth || "80mm";
  const fontSizeScale = activePreset.fontSizeScale || "normal";
  const dividerStyle = activePreset.dividerStyle || "dashed";
  const blocks = activePreset.blocks || [];

  const getDividerChar = () => {
    switch (dividerStyle) {
      case "double":
        return "═";
      case "solid":
        return "─";
      case "dotted":
        return "•";
      case "minimal":
        return " ";
      case "dashed":
      default:
        return "-";
    }
  };

  const renderDivider = (styleOverride?: string) => {
    return (
      <div className="w-full text-center overflow-hidden my-1 select-none opacity-40 font-mono text-[10px] tracking-widest leading-none">
        {Array(48).fill(getDividerChar()).join("")}
      </div>
    );
  };

  const renderBlock = (block: ReceiptBlock, index: number) => {
    if (block.hidden) return null;

    const alignClass =
      block.align === "left"
        ? "text-left"
        : block.align === "right"
        ? "text-right"
        : "text-center";

    switch (block.type) {
      case "HEADER_LOGO":
        if (!data.logoUrl) return null;
        return (
          <div key={index} className={`my-1 flex justify-center ${alignClass}`}>
            <img
              src={data.logoUrl}
              alt="Logo"
              className="max-h-12 max-w-[120px] object-contain"
            />
          </div>
        );

      case "STORE_META":
        return (
          <div key={index} className={`space-y-0.5 my-1 ${alignClass}`}>
            <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
              {data.storeName}
            </h4>
            {data.outletName && (
              <p className="text-[10px] font-bold text-stone-700">{data.outletName}</p>
            )}
            {data.address && (
              <p className="text-[9px] text-stone-600 leading-tight">{data.address}</p>
            )}
            {data.phone && (
              <p className="text-[9px] text-stone-600">Telp: {data.phone}</p>
            )}
            {data.headerNote && (
              <p className="text-[9px] text-stone-500 italic mt-0.5">{data.headerNote}</p>
            )}
          </div>
        );

      case "DIVIDER":
        return <React.Fragment key={index}>{renderDivider()}</React.Fragment>;

      case "QUEUE_NUMBER":
        if (!data.queueNumber) return null;
        return (
          <div key={index} className={`my-2 ${alignClass}`}>
            <span className="text-xl font-black tracking-tight text-stone-950 block">
              {data.queueNumber}
            </span>
            {data.orderType && (
              <span className="text-[10px] font-extrabold text-stone-600 uppercase">
                {data.orderType}
              </span>
            )}
          </div>
        );

      case "TABLE_META":
        if (!data.tableNumber) return null;
        return (
          <div key={index} className="flex items-center justify-between my-1">
            <span className="text-[10px] font-bold text-stone-600">Nomor Meja:</span>
            <span className="border-2 border-stone-800 px-2.5 py-0.5 rounded text-xs font-black text-stone-950">
              {data.tableNumber}
            </span>
          </div>
        );

      case "TRANSACTION_META":
        return (
          <div key={index} className={`space-y-0.5 text-[10px] text-stone-600 my-1 ${alignClass}`}>
            <div className="flex justify-between">
              <span>No. Struk:</span>
              <span className="font-mono font-bold text-stone-900">{data.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{data.dateTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span className="font-medium text-stone-800">{data.cashierName}</span>
            </div>
          </div>
        );

      case "ITEMS_TABLE":
        return (
          <div key={index} className="space-y-1.5 my-1.5">
            {data.items.map((item, iIdx) => (
              <div key={iIdx} className="text-[10px]">
                <div className="flex justify-between font-semibold text-stone-900">
                  <span className="truncate pr-2">
                    {item.qty} &times; {item.name}
                  </span>
                  <span className="font-mono flex-shrink-0">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-[9px] text-stone-500 pl-2 italic">• {item.notes}</p>
                )}
              </div>
            ))}
          </div>
        );

      case "TOTAL_SUMMARY":
        return (
          <div key={index} className="space-y-1 text-[10px] my-1">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-mono">Rp {data.subtotal.toLocaleString("id-ID")}</span>
            </div>
            {Boolean(data.discountAmount && data.discountAmount > 0) && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Diskon:</span>
                <span className="font-mono">- Rp {data.discountAmount?.toLocaleString("id-ID")}</span>
              </div>
            )}
            {Boolean(data.taxPb1Amount && data.taxPb1Amount > 0) && (
              <div className="flex justify-between text-stone-600">
                <span>PB1 Resto (10%):</span>
                <span className="font-mono">+ Rp {data.taxPb1Amount?.toLocaleString("id-ID")}</span>
              </div>
            )}
            {Boolean(data.serviceChargeAmount && data.serviceChargeAmount > 0) && (
              <div className="flex justify-between text-stone-600">
                <span>Service Charge:</span>
                <span className="font-mono">+ Rp {data.serviceChargeAmount?.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-stone-950 text-xs pt-1 border-t border-stone-300">
              <span>TOTAL:</span>
              <span className="font-mono">Rp {data.grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        );

      case "PAYMENT_DETAILS":
        return (
          <div key={index} className="space-y-0.5 text-[10px] text-stone-600 my-1">
            <div className="flex justify-between font-bold text-stone-800">
              <span>Metode Bayar:</span>
              <span className="uppercase">{data.paymentMethod}</span>
            </div>
            {Boolean(data.amountPaid) && (
              <div className="flex justify-between">
                <span>Bayar / Tunai:</span>
                <span className="font-mono">Rp {data.amountPaid?.toLocaleString("id-ID")}</span>
              </div>
            )}
            {Boolean(data.changeAmount !== undefined && data.changeAmount >= 0) && (
              <div className="flex justify-between">
                <span>Kembalian:</span>
                <span className="font-mono font-bold text-stone-900">
                  Rp {data.changeAmount?.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>
        );

      case "QRIS_CODE":
        return (
          <div key={index} className={`my-2 space-y-1 ${alignClass}`}>
            <div className="inline-block p-2 bg-white border border-stone-300 rounded-lg shadow-sm">
              <div className="w-24 h-24 bg-stone-900 flex items-center justify-center text-white text-[8px] font-mono text-center rounded p-1">
                [ QRIS CODE ]
              </div>
            </div>
            <p className="text-[8px] text-stone-500 font-bold">Scan QRIS untuk Bayar / Review</p>
          </div>
        );

      case "COUPON_PROMO":
        if (!data.coupon) return null;
        return (
          <div
            key={index}
            className="p-2 rounded border border-dashed border-stone-800 bg-amber-500/10 text-center space-y-1 my-1.5"
          >
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-900 block">
              ✂️ KUPON DISKON TRANSAKSI BERIKUTNYA
            </span>
            <span className="text-xs font-black tracking-widest text-stone-950 font-mono block bg-white py-0.5 rounded border border-stone-300">
              {data.coupon.code}
            </span>
            <p className="text-[8px] text-stone-700">{data.coupon.text}</p>
          </div>
        );

      case "WIFI_INFO":
        if (!data.wifi) return null;
        return (
          <div key={index} className="text-[8px] text-stone-500 text-center space-y-0.5 my-1">
            <p>📶 WiFi: <span className="font-bold text-stone-800">{data.wifi.ssid}</span> | Pass: <span className="font-mono text-stone-800">{data.wifi.password}</span></p>
          </div>
        );

      case "FOOTER_NOTES":
        return (
          <div key={index} className={`text-[9px] text-stone-600 italic my-1.5 ${alignClass}`}>
            <p>{data.footerNote || "Terima kasih atas kunjungan Anda!"}</p>
            <p className="text-[8px] text-stone-400 not-italic mt-0.5">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
          </div>
        );

      case "POWERED_BY":
        return (
          <div key={index} className="text-[8px] text-stone-400 text-center font-sans tracking-wider uppercase my-1">
            Powered by Qassa Cloud POS
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`mx-auto bg-[#FFFDF9] border border-stone-300 font-mono text-stone-900 transition-all ${
        isPrintMode ? "p-2 shadow-none border-0" : "p-4 sm:p-5 rounded-2xl shadow-xl border-dashed"
      } ${
        paperWidth === "80mm" ? "max-w-md text-xs" : "max-w-[280px] text-[11px]"
      } ${
        fontSizeScale === "compact"
          ? "leading-tight"
          : fontSizeScale === "spacious"
          ? "leading-loose"
          : "leading-normal"
      }`}
      style={{
        width: paperWidth === "80mm" ? "360px" : "280px",
      }}
    >
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}
