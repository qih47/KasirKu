"use client";

import React from "react";
import { ReceiptPresetBlueprint } from "@/types/plugin-package";
import { ReceiptConfig, ReceiptTemplateStyle, ReceiptDividerStyle, ReceiptFontScale } from "@/types/receipt";

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
  customerPhone?: string;
  queueNumber?: string;
  tableNumber?: string;
  areaZone?: string;
  orderType?: string; // "Dine In" | "Take Away" | "Delivery"
  vertical?: "BARBERSHOP" | "CAFE" | "LAUNDRY" | "RETAIL" | "GENERAL" | string;

  // Barbershop Fields
  stylistName?: string;
  chairNumber?: number;
  barberTip?: number;

  // Laundry Fields
  laundryServiceType?: "KILOAN" | "SATUAN";
  laundryWeight?: number;
  laundryUnitQty?: number;
  laundryFragrance?: string;
  laundryRack?: string;
  laundryEstimatedCompletionDate?: string;

  // Retail Fields
  retailSavings?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsTotal?: number;

  items: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
    notes?: string;
    barcode?: string;
  }>;
  subtotal: number;
  discountAmount?: number;
  voucherCode?: string;
  taxPb1Amount?: number;
  taxPpnAmount?: number;
  serviceChargeAmount?: number;
  adminFeeAmount?: number;
  roundingAmount?: number;
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
  socialMediaText?: string;
  promoBannerText?: string;
  customNote?: string;
  footerNote?: string;
}

export function DynamicReceiptRenderer({
  preset,
  config,
  data,
  isPrintMode = false,
  isKitchenTicketMode = false,
}: {
  preset?: ReceiptPresetBlueprint;
  config?: Partial<ReceiptConfig> | any;
  data: TransactionReceiptData;
  isPrintMode?: boolean;
  isKitchenTicketMode?: boolean;
}) {
  const rc: ReceiptConfig = (config || {}) as ReceiptConfig;

  // 1. Ambil Pengaturan Template & Ukuran
  const templateStyle: ReceiptTemplateStyle = rc.templateStyle || "FORE_CLEAN";
  const paperWidth = rc.paperSize || preset?.paperWidth || "80mm";
  const fontScale: ReceiptFontScale = rc.fontScale || preset?.fontSizeScale?.toUpperCase() as any || "NORMAL";
  const dividerStyle: ReceiptDividerStyle = rc.dividerStyle || preset?.dividerStyle?.toUpperCase() as any || "DASHED";

  // 2. Render Divider Helper
  const renderDivider = (styleOverride?: string) => {
    const activeStyle = styleOverride || dividerStyle;
    switch (activeStyle) {
      case "DOUBLE":
        return <div className="border-b-2 border-stone-800 border-double my-2" />;
      case "SOLID":
        return <div className="border-b border-stone-800 my-2" />;
      case "ASTERISK":
        return <p className="text-center tracking-widest text-[9px] text-stone-400 my-2">********************************</p>;
      case "BOX":
        return <div className="border-y-2 border-stone-800 py-0.5 my-2" />;
      case "MINIMAL":
        return <div className="h-1.5 my-1" />;
      case "DASHED":
      default:
        return <div className="border-b border-stone-400 border-dashed my-2" />;
    }
  };

  // =========================================================================
  // KHUSUS: SLIP DAPUR (KITCHEN ORDER TICKET / KOT)
  // =========================================================================
  if (isKitchenTicketMode) {
    return (
      <div
        className={`bg-[#FFFDF9] font-mono text-stone-900 select-none ${
          isPrintMode ? "p-2 shadow-none border-0" : "border-2 border-stone-800 rounded-3xl p-6 shadow-2xl space-y-3"
        } ${paperWidth === "80mm" ? "max-w-full" : "max-w-[320px] mx-auto"}`}
      >
        <div className="text-center pb-1">
          <span className="px-3 py-1 bg-stone-900 text-white rounded-full text-xs font-black tracking-widest uppercase">
            *** SLIP DAPUR (KOT) ***
          </span>
          <h4 className="font-black text-sm uppercase mt-2">{data.outletName || data.storeName}</h4>
        </div>

        {renderDivider("DOUBLE")}

        {/* Order Type & Table Header */}
        <div className="p-2.5 bg-stone-100 rounded-xl text-center font-black">
          <span className="text-sm block">
            {data.orderType === "TAKEAWAY" || data.orderType === "Take Away" ? "BUNGKUS / TAKE AWAY" : "DINE IN"}
          </span>
          <span className="text-base text-stone-950 block mt-0.5">
            {data.tableNumber ? `MEJA ${data.tableNumber}` : "ORDER CEPAT"} {data.areaZone ? `(${data.areaZone})` : ""}
          </span>
        </div>

        <div className="flex justify-between text-[10px] text-stone-600 pt-1">
          <span>Waktu: {data.dateTime}</span>
          <span>Ref: #{data.invoiceNo.slice(-6)}</span>
        </div>
        {data.customerName && (
          <p className="text-[10px] font-bold text-stone-800">Tamu: {data.customerName}</p>
        )}

        {renderDivider("SOLID")}

        {/* Items for Chef/Barista with Modifiers */}
        <div className="space-y-3 text-xs">
          {data.items.map((item, idx) => (
            <div key={idx} className="border-b border-stone-200 pb-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-md border border-stone-400 flex items-center justify-center text-[10px] font-black shrink-0">
                  [ ]
                </span>
                <div>
                  <span className="font-black text-sm text-stone-950">
                    {item.qty}x {item.name}
                  </span>
                  {item.notes && (
                    <div className="mt-1 p-1 bg-amber-50 rounded border border-amber-300 text-[10px] font-bold text-amber-900">
                      &gt;&gt; NOTE: {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {renderDivider("DOUBLE")}

        <div className="text-center font-black text-xs">
          TOTAL ITEM: {data.items.reduce((s, i) => s + i.qty, 0)}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. RESOLUSI PROPERTI DINAMIS DARI SETTING (RC)
  // =========================================================================
  const showLogo = rc.showLogo !== undefined ? rc.showLogo : Boolean(data.logoUrl);
  const showHeader = rc.showHeader ?? true;
  const headerText = rc.headerText || data.headerNote;
  const showOutletName = rc.showOutletName ?? Boolean(data.outletName);
  const showLegalName = (rc.showLegalName ?? false) && Boolean(rc.legalName || data.legalName);
  const showAddress = rc.showAddress ?? Boolean(data.address);
  const showPhone = rc.showPhone ?? Boolean(data.phone);
  const showNpwp = (rc.showNpwp ?? false) && Boolean(rc.npwp || data.npwp);

  const showQueueNumber = rc.showQueueNumber ?? Boolean(data.queueNumber);
  const showTableNumber = rc.showTableNumber ?? Boolean(data.tableNumber);
  const showOrderType = rc.showOrderType ?? Boolean(data.orderType);
  const showInvoiceNo = rc.showInvoiceNo ?? Boolean(data.invoiceNo);
  const showDateTime = rc.showDateTime ?? Boolean(data.dateTime);
  const showCashier = rc.showCashier ?? Boolean(data.cashierName);
  const cashierLabel = rc.cashierLabel || "Kasir";

  const showItemModifiers = rc.showItemModifiers ?? true;
  const showItemCount = rc.showItemCount ?? false;
  const showDiscount = rc.showDiscount ?? true;

  const showPb1 = rc.showPb1 ?? Boolean(data.taxPb1Amount && data.taxPb1Amount > 0);
  const pb1Percent = rc.pb1Percent ?? 10;
  const showTax = rc.showTax ?? Boolean(data.taxPpnAmount && data.taxPpnAmount > 0);
  const taxPercent = rc.taxPercent ?? 11;
  const showServiceCharge = rc.showServiceCharge ?? Boolean(data.serviceChargeAmount && data.serviceChargeAmount > 0);
  const servicePercent = rc.servicePercent ?? 5;
  const showAdminFee = rc.showAdminFee ?? Boolean(data.adminFeeAmount && data.adminFeeAmount > 0);
  const showRounding = rc.showRounding ?? Boolean(data.roundingAmount && data.roundingAmount > 0);
  const showPaymentDetail = rc.showPaymentDetail ?? true;
  const paymentMethodText = rc.paymentMethodText;

  const showPromoBanner = rc.showPromoBanner && Boolean(rc.promoBannerText || data.promoBannerText);
  const promoBannerText = rc.promoBannerText || data.promoBannerText;

  const dynamicCoupon = rc.dynamicCoupon?.enabled ? rc.dynamicCoupon : data.coupon;
  const showWifi = rc.showWifi && Boolean(rc.wifiSsid || data.wifi?.ssid);
  const wifiSsid = rc.wifiSsid || data.wifi?.ssid;
  const wifiPassword = rc.wifiPassword || data.wifi?.password;

  const showSocialMedia = rc.showSocialMedia && Boolean(rc.socialMediaText || data.socialMediaText);
  const socialMediaText = rc.socialMediaText || data.socialMediaText;

  const showQrCode = rc.showQrCode && Boolean(rc.qrCodeText || data.qrisPayload);

  const showFooter = rc.showFooter ?? true;
  const footerText = rc.footerText || data.footerNote;
  const showPoweredBy = rc.showPoweredBy ?? true;

  const vertical = data.vertical || rc.vertical || "GENERAL";

  // Visual Theme Styling Envelope
  const getThemeClassNames = () => {
    switch (templateStyle) {
      case "RETRO_COFFEE":
        return "bg-[#FFFBF2] border-2 border-stone-800 text-stone-900";
      case "VINTAGE_BARBER":
        return "bg-[#FDFBF7] border-2 border-dashed border-stone-700 text-stone-950";
      case "GENTLEMAN_LOUNGE":
        return "bg-[#FAFAFA] border-2 border-stone-900 text-stone-950 shadow-2xl";
      case "COMPACT_ECO":
        return "bg-white border-0 shadow-none text-stone-900 p-2";
      case "RETAIL_BARCODE":
        return "bg-white border border-stone-300 text-stone-900";
      case "LAUNDRY_TRACKING":
        return "bg-[#FCFDFD] border border-blue-200 text-stone-900";
      case "EXPRESS_LAUNDRY":
        return "bg-[#FFFDFB] border-2 border-amber-800 text-stone-900";
      case "LUXURY_MINIMAL":
        return "bg-[#FFFFFE] border border-stone-200 text-stone-800 tracking-wide";
      case "FORE_CLEAN":
      case "DEFAULT":
      default:
        return "bg-[#FFFDF9] border border-dashed border-stone-300 text-stone-900";
    }
  };

  return (
    <div
      className={`font-mono select-none transition-all ${getThemeClassNames()} ${
        isPrintMode ? "p-2 shadow-none border-0" : "rounded-3xl p-6 shadow-2xl space-y-3"
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
      {/* 1. Header & Logo Toko */}
      <div className="text-center space-y-1">
        {showLogo && (data.logoUrl || rc.logoUrl) && (
          <div className="flex justify-center pb-1">
            <img
              src={data.logoUrl || rc.logoUrl || ""}
              alt="Logo Toko"
              className="max-h-12 max-w-[130px] object-contain filter grayscale"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}

        {showHeader && (
          <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
            {headerText || data.storeName || "NAMA BISNIS ANDA"}
          </h4>
        )}

        {showOutletName && (data.outletName || rc.outletName) && (
          <p className="text-[10px] font-bold text-stone-700">{rc.outletName || data.outletName}</p>
        )}

        {showLegalName && (
          <p className="text-[9px] text-stone-500 font-semibold">{rc.legalName || data.legalName}</p>
        )}

        {showAddress && (data.address || rc.address) && (
          <p className="text-[10px] text-stone-600 leading-tight">
            {rc.address || data.address}
          </p>
        )}

        {showPhone && (data.phone || rc.phone) && (
          <p className="text-[10px] text-stone-600 font-mono">
            Telp: {rc.phone || data.phone}
          </p>
        )}

        {showNpwp && (
          <p className="text-[9px] text-stone-500 font-mono">NPWP: {rc.npwp || data.npwp}</p>
        )}
      </div>

      {renderDivider("DOUBLE")}

      {/* 2. Banner Promo Top (Jika diaktifkan di setting) */}
      {showPromoBanner && promoBannerText && (
        <>
          <div className="p-2 bg-stone-100 rounded-xl text-center text-[10px] font-black text-stone-800 border border-stone-300">
            ★ {promoBannerText} ★
          </div>
          {renderDivider()}
        </>
      )}

      {/* 3. Badge Vertikal Khusus (Jika relevan / data tersedia) */}
      {/* 3A. BARBERSHOP */}
      {(vertical === "BARBERSHOP" || Boolean(data.stylistName) || Boolean(data.chairNumber)) && (
        <div className="space-y-1 text-center py-1 bg-amber-50/70 rounded-xl border border-amber-200">
          {showQueueNumber && data.queueNumber && (
            <span className="text-[10px] font-bold text-amber-800 block">
              NO. ANTRIAN: <strong className="text-sm font-black">{data.queueNumber}</strong>
            </span>
          )}
          {(data.stylistName || data.chairNumber) && (
            <span className="text-xs font-black text-stone-900 block">
              {data.chairNumber ? `KURSI #${data.chairNumber}` : ""} {data.stylistName ? `| KAPSTER: ${data.stylistName.toUpperCase()}` : ""}
            </span>
          )}
        </div>
      )}

      {/* 3B. CAFE & RESTO */}
      {(vertical === "CAFE" || Boolean(data.tableNumber)) && (
        <div className="space-y-0.5 text-center py-1 bg-emerald-50/70 rounded-xl border border-emerald-200">
          {showOrderType && (
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              {data.orderType === "TAKEAWAY" || data.orderType === "Take Away" ? "TAKE AWAY / BUNGKUS" : "DINE IN"}
            </span>
          )}
          {showTableNumber && (
            <span className="text-xs font-black text-stone-900 block">
              {data.tableNumber ? `MEJA: ${data.tableNumber}` : "FREE SEATING"} {data.areaZone ? `(${data.areaZone})` : ""}
            </span>
          )}
        </div>
      )}

      {/* 3C. LAUNDRY */}
      {(vertical === "LAUNDRY" || Boolean(data.laundryRack)) && (
        <div className="space-y-1 text-center py-1.5 bg-purple-50/70 rounded-xl border border-purple-200">
          {data.laundryRack && (
            <span className="text-xs font-black text-purple-900 block">
              RAK PENYIMPANAN: {data.laundryRack.toUpperCase()}
            </span>
          )}
          {data.laundryFragrance && (
            <span className="text-[10px] font-bold text-purple-700 block">
              PARFUM: {data.laundryFragrance.toUpperCase()}
            </span>
          )}
          {data.laundryEstimatedCompletionDate && (
            <span className="text-[9px] font-bold text-stone-600 block">
              Est. Selesai: {data.laundryEstimatedCompletionDate}
            </span>
          )}
        </div>
      )}

      {/* 4. Metadata Transaksi */}
      <div className="space-y-1 text-[10px] pt-1">
        {showInvoiceNo && (
          <div className="flex justify-between items-center">
            <span className="font-bold">No. Trx: {data.invoiceNo}</span>
            {showDateTime && <span>{data.dateTime}</span>}
          </div>
        )}
        <div className="flex justify-between text-stone-600">
          {showCashier && <span>{cashierLabel}: {data.cashierName}</span>}
          {data.customerName && <span className="font-bold">Plg: {data.customerName}</span>}
        </div>
      </div>

      {renderDivider()}

      {/* 5. Daftar Item Transaksi */}
      <div className="space-y-2 text-[11px]">
        {data.items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between font-semibold">
              <span>{item.qty}x {item.name}</span>
              <span>Rp {(item.qty * item.price).toLocaleString("id-ID")}</span>
            </div>
            {showItemModifiers && item.notes && (
              <div className="pl-3 text-[9px] text-stone-500">
                <p>• {item.notes}</p>
              </div>
            )}
            {item.barcode && (
              <div className="pl-3 text-[8px] text-stone-400 font-mono">
                SKU: {item.barcode}
              </div>
            )}
          </div>
        ))}
      </div>

      {showItemCount && (
        <div className="text-[9px] text-stone-500 text-right pt-1">
          Total Item: {data.items.reduce((acc, it) => acc + it.qty, 0)} item
        </div>
      )}

      {renderDivider()}

      {/* 6. Finansial, Diskon & Pajak (Sesuai Konfigurasi Dinamis) */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {data.subtotal.toLocaleString("id-ID")}</span>
        </div>

        {showDiscount && Boolean(data.discountAmount && data.discountAmount > 0) && (
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Diskon {data.voucherCode ? `(${data.voucherCode})` : ""}</span>
            <span>-Rp {data.discountAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Tip Kapster Barbershop */}
        {Boolean(data.barberTip && data.barberTip > 0) && (
          <div className="flex justify-between text-amber-800 font-bold">
            <span>Tip Kapster</span>
            <span>+Rp {data.barberTip?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Service Charge */}
        {showServiceCharge && Boolean(data.serviceChargeAmount && data.serviceChargeAmount > 0) && (
          <div className="flex justify-between">
            <span>Service Charge ({servicePercent}%)</span>
            <span>+Rp {data.serviceChargeAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Pajak PB1 Resto */}
        {showPb1 && Boolean(data.taxPb1Amount && data.taxPb1Amount > 0) && (
          <div className="flex justify-between">
            <span>PB1 Resto ({pb1Percent}%)</span>
            <span>+Rp {data.taxPb1Amount?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Pajak PPN */}
        {showTax && Boolean(data.taxPpnAmount && data.taxPpnAmount > 0) && (
          <div className="flex justify-between">
            <span>PPN ({taxPercent}%)</span>
            <span>+Rp {data.taxPpnAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Biaya Admin */}
        {showAdminFee && Boolean(data.adminFeeAmount && data.adminFeeAmount > 0) && (
          <div className="flex justify-between">
            <span>Biaya Admin</span>
            <span>+Rp {data.adminFeeAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {/* Pembulatan */}
        {showRounding && Boolean(data.roundingAmount && data.roundingAmount > 0) && (
          <div className="flex justify-between">
            <span>Pembulatan</span>
            <span>Rp {data.roundingAmount?.toLocaleString("id-ID")}</span>
          </div>
        )}

        {renderDivider("SOLID")}

        <div className="flex justify-between text-xs font-black text-stone-950 pt-0.5">
          <span>TOTAL BAYAR</span>
          <span>Rp {data.grandTotal.toLocaleString("id-ID")}</span>
        </div>

        {showPaymentDetail && (
          <>
            <div className="flex justify-between text-stone-600 pt-1">
              <span>Bayar ({paymentMethodText || data.paymentMethod})</span>
              <span>Rp {(data.amountPaid ?? data.grandTotal).toLocaleString("id-ID")}</span>
            </div>
            {data.changeAmount !== undefined && data.changeAmount > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Kembalian</span>
                <span>Rp {data.changeAmount.toLocaleString("id-ID")}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* 7. Loyalty Points / Savings */}
      {(Boolean(data.retailSavings) || Boolean(data.loyaltyPointsEarned)) && (
        <>
          {renderDivider("DASHED")}
          <div className="space-y-0.5 text-[9px] text-center font-bold text-stone-700">
            {data.retailSavings && data.retailSavings > 0 && (
              <p className="text-emerald-700">🎉 Anda Berhemat: Rp {data.retailSavings.toLocaleString("id-ID")}</p>
            )}
            {data.loyaltyPointsEarned && data.loyaltyPointsEarned > 0 && (
              <p>Poin Didapat: +{data.loyaltyPointsEarned} | Total: {data.loyaltyPointsTotal || data.loyaltyPointsEarned}</p>
            )}
          </div>
        </>
      )}

      {/* 8. Syarat Pengambilan Laundry */}
      {vertical === "LAUNDRY" && (
        <>
          {renderDivider("DASHED")}
          <div className="text-[8.5px] text-stone-500 space-y-0.5 text-center leading-tight">
            <p className="font-bold text-stone-700">KLAIM AMBIL CUCIAN:</p>
            <p>1. Bawa nota ini saat pengambilan cucian.</p>
            <p>2. Komplain maks. 1x24 jam setelah diambil.</p>
            <p>3. Cucian &gt; 30 hari di luar tanggung jawab kami.</p>
          </div>
        </>
      )}

      {/* 9. Dynamic Voucher / Kupon Promo */}
      {dynamicCoupon && (
        <>
          {renderDivider("DASHED")}
          <div className="p-2 border border-dashed border-stone-400 rounded-xl text-center space-y-0.5">
            <p className="text-[8.5px] uppercase tracking-wider text-stone-500">Kupon Belanja Berikutnya</p>
            <p className="font-black text-xs text-stone-900 tracking-widest">{(dynamicCoupon as any)?.couponCode || (dynamicCoupon as any)?.code}</p>
            <p className="text-[9px] text-emerald-700 font-bold">{(dynamicCoupon as any)?.discountText || (dynamicCoupon as any)?.text}</p>
          </div>
        </>
      )}

      {renderDivider("DOUBLE")}

      {/* 10. Footer, WiFi, Social Media & QR Code */}
      <div className="text-center space-y-1 text-[9.5px]">
        {showWifi && wifiSsid && (
          <div className="p-1.5 bg-stone-100 rounded-lg text-[9px] font-mono">
            <span>📶 WiFi: {wifiSsid} {wifiPassword ? `| Pass: ${wifiPassword}` : ""}</span>
          </div>
        )}

        {showSocialMedia && socialMediaText && (
          <p className="text-[9px] text-stone-600 font-semibold">
            {socialMediaText}
          </p>
        )}

        {showFooter && (
          <p className="text-stone-700 font-bold">
            {footerText || "Terima Kasih Atas Kunjungan Anda!"}
          </p>
        )}

        {showPoweredBy && (
          <p className="text-[8px] text-stone-400 tracking-wider">
            Powered by POS Universal
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
    name: "Modern Clean 80mm",
    description: "Format struk modern 80mm dengan logo, QRIS, dan rincian lengkap.",
    preset: {
      paperWidth: "80mm",
      fontSizeScale: "normal",
      dividerStyle: "dashed",
    },
  },
  "qassa-receipt-compact-58mm": {
    name: "Compact Eco 58mm",
    description: "Format hemat kertas 58mm untuk printer thermal mini bluetooth.",
    preset: {
      paperWidth: "58mm",
      fontSizeScale: "compact",
      dividerStyle: "solid",
    },
  },
};
