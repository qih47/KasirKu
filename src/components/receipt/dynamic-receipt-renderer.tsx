"use client";

import React from "react";
import { ReceiptPresetBlueprint } from "@/types/plugin-package";
import { ReceiptConfig } from "@/types/receipt";

export interface TransactionReceiptData {
  storeName: string;
  legalName?: string;
  npwp?: string;
  outletName?: string;
  address?: string;
  phone?: string;
  headerNote?: string;
  logoUrl?: string | null;
  invoiceNo: string;
  dateTime: string;
  cashierName: string;
  customerName?: string;
  queueNumber?: string;
  tableNumber?: string;
  orderType?: string; // "Dine In" | "Take Away" | "Delivery"
  vertical?: string;
  laundryWeight?: number;
  laundryFragrance?: string;
  laundryRack?: string;
  stylistName?: string;
  barberTip?: number;
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
  taxPpnAmount?: number;
  serviceChargeAmount?: number;
  adminFeeAmount?: number;
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
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  customNote?: string;
  footerNote?: string;
}

export function DynamicReceiptRenderer({
  preset,
  config,
  data,
  isPrintMode = false,
}: {
  preset?: ReceiptPresetBlueprint;
  config?: ReceiptConfig | any;
  data: TransactionReceiptData;
  isPrintMode?: boolean;
}) {
  const rc: ReceiptConfig = (config || {}) as ReceiptConfig;

  const paperWidth = rc.paperSize || preset?.paperWidth || "80mm";
  const fontScale = rc.fontScale || preset?.fontSizeScale?.toUpperCase() || "NORMAL";
  const dividerStyle = rc.dividerStyle || preset?.dividerStyle?.toUpperCase() || "DASHED";

  const renderDivider = () => {
    switch (dividerStyle) {
      case "DOUBLE":
        return <div className="border-b-2 border-stone-800 border-double my-2" />;
      case "SOLID":
        return <div className="border-b border-stone-800 my-2" />;
      case "ASTERISK":
        return <p className="text-center tracking-widest text-[9px] text-stone-400 my-2">********************************</p>;
      case "MINIMAL":
        return <div className="h-2 my-2" />;
      case "DASHED":
      default:
        return <div className="border-b border-stone-400 border-dashed my-2" />;
    }
  };

  const showLogo = rc.showLogo ?? Boolean(data.logoUrl);
  const showLegalName = rc.showLegalName && (rc.legalName || data.legalName);
  const showNpwp = rc.showNpwp && (rc.npwp || data.npwp);
  const showAddress = rc.showAddress ?? Boolean(data.address);
  const showPhone = rc.showPhone ?? Boolean(data.phone);
  const showInvoiceNo = rc.showInvoiceNo ?? Boolean(data.invoiceNo);
  const showDateTime = rc.showDateTime ?? Boolean(data.dateTime);
  const showCashier = rc.showCashier ?? Boolean(data.cashierName);
  const showQueueNumber = rc.showQueueNumber ?? Boolean(data.queueNumber);
  const showTableNumber = rc.showTableNumber ?? Boolean(data.tableNumber);
  const showOrderType = rc.showOrderType ?? Boolean(data.orderType);
  const showDiscount = rc.showDiscount ?? true;
  const showPaymentDetail = rc.showPaymentDetail ?? true;
  const showWifi = rc.showWifi && (rc.wifiSsid || data.wifi?.ssid);
  const showFooter = rc.showFooter ?? true;
  const showPoweredBy = rc.showPoweredBy ?? true;

  const hasOrderMeta = Boolean(
    showInvoiceNo ||
    showDateTime ||
    showCashier ||
    (showOrderType && data.orderType) ||
    (showTableNumber && data.tableNumber) ||
    (showQueueNumber && data.queueNumber)
  );

  return (
    <div
      className={`bg-[#FFFDF9] font-mono text-stone-900 select-none transition-all ${
        isPrintMode ? "p-2 shadow-none border-0" : "border border-dashed border-stone-300 rounded-3xl p-6 shadow-2xl space-y-3"
      } ${
        fontScale === "COMPACT"
          ? "text-[10px]"
          : fontScale === "SPACIOUS"
          ? "text-sm"
          : "text-xs"
      } ${
        paperWidth === "80mm" ? "max-w-full" : "max-w-[320px] mx-auto"
      }`}
    >
      {/* 1. Logo & Kop Header */}
      <div className="text-center space-y-1">
        {showLogo && data.logoUrl && (
          <div className="flex justify-center pb-1">
            <img
              src={data.logoUrl}
              alt="Logo Struk"
              className="max-h-12 max-w-[120px] object-contain filter grayscale"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
        <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
          {data.storeName || "NAMA BISNIS ANDA"}
        </h4>
        {showLegalName && (
          <p className="text-[9px] text-stone-500 font-semibold">{rc.legalName || data.legalName}</p>
        )}
        {showAddress && data.address && (
          <p className="text-[10px] text-stone-600 leading-tight">
            {data.address}
          </p>
        )}
        {showPhone && data.phone && (
          <p className="text-[10px] text-stone-600 font-mono">
            Telp: {data.phone}
          </p>
        )}
        {showNpwp && (
          <p className="text-[9px] text-stone-500 font-mono">NPWP: {rc.npwp || data.npwp}</p>
        )}
      </div>

      {/* 2. Order Meta & Dynamic Divider (Only shown if hasOrderMeta is true) */}
      {hasOrderMeta && (
        <>
          {renderDivider()}
          <div className="space-y-1 text-[10px]">
            {Boolean(showInvoiceNo || showDateTime) && (
              <div className="flex justify-between items-center">
                {showInvoiceNo && <span className="font-bold">No. Struk: {data.invoiceNo}</span>}
                {showDateTime && <span>{data.dateTime}</span>}
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              {showCashier && <span>Kasir: {data.cashierName}</span>}
              {showOrderType && data.orderType && <span className="font-bold">{data.orderType}</span>}
            </div>
            {showTableNumber && data.tableNumber && (
              <div className="flex justify-between font-bold text-stone-950">
                <span>MEJA / STATION:</span>
                <span>{data.tableNumber}</span>
              </div>
            )}
            {showQueueNumber && data.queueNumber && (
              <div className="text-center p-1.5 border border-dashed border-stone-400 rounded-lg my-1">
                <span className="text-[9px] block text-stone-600">NOMOR ANTREAN</span>
                <span className="text-xl font-black tracking-widest text-stone-950">{data.queueNumber}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 3. Divider Style before Items */}
      {renderDivider()}

      {/* 4. Items List */}
      <div className="space-y-2 text-[11px]">
        {data.items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between font-semibold">
              <span>{item.qty}x {item.name}</span>
              <span>Rp {(item.qty * item.price).toLocaleString("id-ID")}</span>
            </div>
            {rc.showItemModifiers !== false && item.notes && (
              <div className="pl-3 text-[9px] text-stone-500">
                <p>• {item.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Divider before Calculations */}
      {renderDivider()}

      {/* 6. Calculations */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-stone-600 text-[11px]">
          <span>Subtotal</span>
          <span>Rp {data.subtotal.toLocaleString("id-ID")}</span>
        </div>
        {rc.showTax && Boolean(data.taxPpnAmount && data.taxPpnAmount > 0) && (
          <div className="flex justify-between text-stone-600 text-[11px]">
            <span>PPN ({rc.taxPercent || 11}%)</span>
            <span>Rp {data.taxPpnAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}
        {rc.showPb1 && Boolean(data.taxPb1Amount && data.taxPb1Amount > 0) && (
          <div className="flex justify-between text-stone-600 text-[11px]">
            <span>PB1 Resto ({rc.pb1Percent || 10}%)</span>
            <span>Rp {data.taxPb1Amount?.toLocaleString("id-ID")}</span>
          </div>
        )}
        {rc.showServiceCharge && Boolean(data.serviceChargeAmount && data.serviceChargeAmount > 0) && (
          <div className="flex justify-between text-stone-600 text-[11px]">
            <span>Service Charge ({rc.servicePercent || 5}%)</span>
            <span>Rp {data.serviceChargeAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}
        {rc.showAdminFee && Boolean(data.adminFeeAmount && data.adminFeeAmount > 0) && (
          <div className="flex justify-between text-stone-600 text-[11px]">
            <span>Biaya Admin Transaksi</span>
            <span>Rp {data.adminFeeAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}
        {showDiscount && Boolean(data.discountAmount && data.discountAmount > 0) && (
          <div className="flex justify-between text-emerald-700 text-[11px] font-bold">
            <span>Diskon &amp; Voucher Promo</span>
            <span>-Rp {data.discountAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-stone-950 text-sm pt-1.5 border-t border-stone-300">
          <span>TOTAL BILL</span>
          <span>Rp {data.grandTotal.toLocaleString("id-ID")}</span>
        </div>
        {showPaymentDetail && (
          <div className="pt-1 text-[10px] text-stone-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Metode Bayar:</span>
              <span>
                {data.paymentMethod === "CASH"
                  ? "TUNAI"
                  : data.paymentMethod === "QRIS"
                  ? "QRIS BCA"
                  : data.paymentMethod === "TRANSFER"
                  ? "TRANSFER BANK"
                  : data.paymentMethod}
              </span>
            </div>
            {data.paymentMethod === "CASH" && (
              <div className="flex justify-between">
                <span>Kembalian:</span>
                <span>Rp {(data.changeAmount || 0).toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Dynamic Coupon Ticket */}
      {rc.dynamicCoupon?.enabled && (
        <div className="my-2 p-2 border border-dashed border-purple-400 bg-purple-50/50 rounded-xl text-center text-purple-950 space-y-0.5">
          <span className="text-[9px] font-bold block">🎟️ KUPON VOUCHER SPESIAL</span>
          <span className="text-xs font-black tracking-wider uppercase">{data.coupon?.code || rc.dynamicCoupon.couponCode || "DISKON10"}</span>
          <p className="text-[9px]">{data.coupon?.text || rc.dynamicCoupon.discountText || "Diskon transaksi berikutnya"}</p>
          <p className="text-[8px] text-purple-600">Berlaku {rc.dynamicCoupon.expiryDays || 30} hari dari struk ini</p>
        </div>
      )}

      {/* 8. WiFi Info */}
      {showWifi && (
        <div className="text-center text-[9px] text-stone-500 py-1 border-t border-stone-200 border-dashed">
          📶 WiFi: <span className="font-bold text-stone-700">{rc.wifiSsid || data.wifi?.ssid}</span> | Pass:{" "}
          <span className="font-mono text-stone-700">{rc.wifiPassword || data.wifi?.password}</span>
        </div>
      )}

      {/* 9. Footer */}
      <div className="text-center text-[10px] space-y-1 pt-1 text-stone-600">
        {showFooter && (
          <p className="font-semibold text-stone-800 italic">
            {data.footerNote || rc.footerText || "Terima kasih atas kunjungan Anda!"}
          </p>
        )}

        {/* Multi-Social Media on Receipt */}
        {rc.showSocialMedia && data.socialMedia && (
          <div className="space-y-0.5 text-[9px]">
            {data.socialMedia.instagram && <p>📷 IG: {data.socialMedia.instagram}</p>}
            {data.socialMedia.tiktok && <p>🎵 TikTok: {data.socialMedia.tiktok}</p>}
            {data.socialMedia.website && <p>🌐 {data.socialMedia.website}</p>}
          </div>
        )}

        {showPoweredBy && (
          <p className="text-[8px] font-bold opacity-60 pt-1 tracking-wider uppercase">
            Powered by Qassa POS
          </p>
        )}
      </div>
    </div>
  );
}

export const BUILTIN_RECEIPT_PRESETS: Record<
  string,
  { name: string; preset: ReceiptPresetBlueprint; description: string }
> = {
  "qassa-receipt-modern-80mm": {
    name: "Thermal Modern Pro (80mm)",
    preset: {
      paperWidth: "80mm",
      dividerStyle: "dashed",
      fontSizeScale: "normal",
    },
    description: "Layout 80mm lengkap dengan nomor antrean jumbo, logo, dan rincian pajak.",
  },
  "qassa-receipt-compact-58mm": {
    name: "Eco Compact Mini (58mm)",
    preset: {
      paperWidth: "58mm",
      dividerStyle: "dashed",
      fontSizeScale: "compact",
    },
    description: "Layout 58mm ringkas & hemat kertas untuk printer bluetooth kasir portable.",
  },
};
