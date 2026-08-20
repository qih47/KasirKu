"use client";

import { useState } from "react";
import {
  Printer,
  Sparkles,
  Layers,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  Zap,
  Coffee,
  Scissors,
  Utensils,
  ShoppingBag,
  Shirt,
  Crown,
  ChefHat,
  Ticket,
  Sliders,
  Maximize2,
  Minimize2,
  Eye,
  Check,
  Download,
  Upload,
  FileJson,
} from "lucide-react";
import { saveReceiptDesignAction } from "@/modules/receipt-designer/actions";
import {
  ReceiptConfig,
  ReceiptTemplateStyle,
  ReceiptDividerStyle,
  ReceiptFontScale,
  DynamicCouponConfig,
  KitchenTicketConfig,
} from "@/types/receipt";
import {
  DynamicReceiptRenderer,
  BUILTIN_RECEIPT_PRESETS,
  TransactionReceiptData,
} from "@/components/receipt/dynamic-receipt-renderer";
import { ReceiptPresetBlueprint } from "@/types/plugin-package";
import Link from "next/navigation";


interface ReceiptDesignerClientProps {
  initialData: {
    tenantId: string;
    businessName: string;
    logoUrl?: string | null;
    receiptConfig: ReceiptConfig;
    hasDesignerPlugin: boolean;
    isTrial: boolean;
    isPaidActive: boolean;
    pluginInfo: {
      name: string;
      priceMonthly: number;
      priceAnnual: number;
    };
    primaryOutlet?: any;
  };
}

export function ReceiptDesignerClient({ initialData }: ReceiptDesignerClientProps) {
  const rc = initialData.receiptConfig || {};

  // Designer State
  const [templateStyle, setTemplateStyle] = useState<ReceiptTemplateStyle>(
    rc.templateStyle || "FORE_CLEAN"
  );
  const [dividerStyle, setDividerStyle] = useState<ReceiptDividerStyle>(
    rc.dividerStyle || "DASHED"
  );
  const [fontScale, setFontScale] = useState<ReceiptFontScale>(
    rc.fontScale || "NORMAL"
  );
  const [paperSize, setPaperSize] = useState<"58mm" | "80mm">(
    rc.paperSize || "58mm"
  );

  // Dynamic Coupon State
  const [couponEnabled, setCouponEnabled] = useState(
    rc.dynamicCoupon?.enabled ?? true
  );
  const [couponCode, setCouponCode] = useState(
    rc.dynamicCoupon?.couponCode || "DISKON10"
  );
  const [discountText, setDiscountText] = useState(
    rc.dynamicCoupon?.discountText || "Diskon 10% untuk transaksi berikutnya"
  );
  const [expiryDays, setExpiryDays] = useState(
    rc.dynamicCoupon?.expiryDays || 14
  );

  // Kitchen Ticket State
  const [kitchenEnabled, setKitchenEnabled] = useState(
    rc.kitchenTicket?.enabled ?? false
  );
  const [kitchenAutoPrint, setKitchenAutoPrint] = useState(
    rc.kitchenTicket?.autoPrint ?? true
  );
  const [kitchenNoteHeader, setKitchenNoteHeader] = useState(
    rc.kitchenTicket?.noteHeader || "KITCHEN ORDER TICKET (KOT)"
  );

  // Preview Mode Switcher (Customer Receipt vs Kitchen Slip)
  const [previewTab, setPreviewTab] = useState<"CUSTOMER" | "KITCHEN">("CUSTOMER");

  // Dynamic Receipt Preset State & Export
  const [activeReceiptPresetKey, setActiveReceiptPresetKey] = useState<string>("qassa-receipt-modern-80mm");

  const sampleTransactionData: TransactionReceiptData = {
    storeName: initialData.businessName || "Artisan Coffee Lab",
    outletName: initialData.primaryOutlet?.name || "Cabang Senopati",
    address: initialData.primaryOutlet?.address || "Jl. Senopati No. 88, Jakarta Selatan",
    phone: "0812-3456-7890",
    headerNote: rc.headerText || "Selamat Menikmati Kopi Spesialti Kami",
    logoUrl: initialData.logoUrl || null,
    invoiceNo: "#INV-20260818-0912",
    dateTime: "18/08/2026 14:35 WIB",
    cashierName: "Ahmad (Kasir #01)",
    queueNumber: "#5088",
    tableNumber: "Meja 12",
    orderType: "Dine In",
    items: [
      { name: "Iced Caramel Macchiato", qty: 2, price: 34000, subtotal: 68000, notes: "Less Sugar, Oat Milk" },
      { name: "Almond Croissant Butter", qty: 1, price: 28000, subtotal: 28000, notes: "Heated" },
      { name: "Matcha Espresso Fusion", qty: 1, price: 38000, subtotal: 38000 },
    ],
    subtotal: 134000,
    discountAmount: 13400,
    taxPb1Amount: 12060,
    grandTotal: 132660,
    paymentMethod: "QRIS BCA",
    amountPaid: 132660,
    changeAmount: 0,
    coupon: couponEnabled
      ? {
        code: couponCode,
        text: discountText,
        expiryDate: "14 Hari",
      }
      : undefined,
    wifi: {
      ssid: "ArtisanCafe_Guest",
      password: "kopienakbanget",
    },
    footerNote: "Terima kasih atas kunjungan Anda!",
  };

  const handleExportJson = () => {
    const selectedPreset =
      BUILTIN_RECEIPT_PRESETS[activeReceiptPresetKey] ||
      BUILTIN_RECEIPT_PRESETS["qassa-receipt-modern-80mm"];

    const exportPayload = {
      manifest: {
        id: activeReceiptPresetKey,
        name: selectedPreset.name,
        type: "RECEIPT_PRESET",
        version: "1.0.0",
        author: "Qassa Super Admin",
        description: selectedPreset.description,
        compatibility: ">=1.0.0",
        priceMonthly: 19000,
        priceAnnual: 190000,
      },
      receipt: selectedPreset.preset,
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeReceiptPresetKey}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preset Template Cards Definition

  const templateCards = [
    {
      id: "FORE_CLEAN" as ReceiptTemplateStyle,
      title: "Fore Clean Modern",
      category: "Coffee & Cafe",
      icon: Coffee,
      badge: "Best Seller",
      badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      desc: "Desain rapi, nomor order besar dengan border modern, modifiers item terstruktur, dan banner loyalty app.",
      defaultDivider: "DASHED" as ReceiptDividerStyle,
    },
    {
      id: "VINTAGE_BARBER" as ReceiptTemplateStyle,
      title: "Vintage Barbershop",
      category: "Barber & Grooming",
      icon: Scissors,
      badge: "Popular",
      badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      desc: "Garis ganda klasik, highlight nama Capster/Stylist, nomor antrean lounge, dan QR booking online.",
      defaultDivider: "DOUBLE" as ReceiptDividerStyle,
    },
    {
      id: "RESTO_KITCHEN" as ReceiptTemplateStyle,
      title: "Restaurant & Kitchen",
      category: "Dining & F&B",
      icon: Utensils,
      badge: "Pro F&B",
      badgeColor: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
      desc: "Kotak nomor meja elegan, rincian PB1/Service Tax, dan dukungan cetak slip tiket pesanan dapur otomatis.",
      defaultDivider: "DASHED" as ReceiptDividerStyle,
    },
    {
      id: "RETAIL_BARCODE" as ReceiptTemplateStyle,
      title: "Supermarket Fast Barcode",
      category: "Retail & Mart",
      icon: ShoppingBag,
      badge: "High Speed",
      badgeColor: "bg-blue-500/15 text-blue-600 border-blue-500/30",
      desc: "Format padat hemat kertas, ringkasan total item count, dan barcode transaksi untuk validasi cepat.",
      defaultDivider: "SOLID" as ReceiptDividerStyle,
    },
    {
      id: "LAUNDRY_TRACKING" as ReceiptTemplateStyle,
      title: "Laundry Pick-Up Slip",
      category: "Laundry Service",
      icon: Shirt,
      badge: "Tracking",
      badgeColor: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
      desc: "Highlight nomor rak slot, estimasi tanggal ambil cucian, dan barcode QR status klaim pakaian.",
      defaultDivider: "BOX" as ReceiptDividerStyle,
    },
    {
      id: "LUXURY_MINIMAL" as ReceiptTemplateStyle,
      title: "Luxury Boutique Minimal",
      category: "Fashion & Lifestyle",
      icon: Crown,
      badge: "Exclusive",
      badgeColor: "bg-purple-500/15 text-purple-600 border-purple-500/30",
      desc: "Tipografi lapang berkelas, garis aksen lembut, signature penutup elegan untuk butik & store eksklusif.",
      defaultDivider: "MINIMAL" as ReceiptDividerStyle,
    },
  ];

  // Helper function to render dividers on canvas
  const renderDivider = () => {
    switch (dividerStyle) {
      case "DOUBLE":
        return <div className="border-b-2 border-stone-800 my-2" style={{ borderStyle: "double", borderWidth: "3px 0 0 0" }} />;
      case "SOLID":
        return <div className="border-b border-stone-800 my-2" />;
      case "ASTERISK":
        return (
          <div className="text-center text-[9px] tracking-widest text-stone-400 my-1.5 select-none font-bold">
            * * * * * * * * * * * *
          </div>
        );
      case "BOX":
        return <div className="border-b-2 border-dashed border-stone-400 my-2" />;
      case "MINIMAL":
        return <div className="h-2 my-1" />;
      case "DASHED":
      default:
        return <div className="border-b border-dashed border-stone-400 my-2" />;
    }
  };

  const handleSelectTemplate = (tmpl: typeof templateCards[0]) => {
    setTemplateStyle(tmpl.id);
    setDividerStyle(tmpl.defaultDivider);
    if (tmpl.id === "RESTO_KITCHEN") {
      setKitchenEnabled(true);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const dynamicCoupon: DynamicCouponConfig = {
        enabled: couponEnabled,
        couponCode: couponCode.trim(),
        discountText: discountText.trim(),
        expiryDays: Number(expiryDays) || 14,
      };

      const kitchenTicket: KitchenTicketConfig = {
        enabled: kitchenEnabled,
        autoPrint: kitchenAutoPrint,
        hidePrices: true,
        noteHeader: kitchenNoteHeader.trim(),
      };

      const res = await saveReceiptDesignAction({
        templateStyle,
        dividerStyle,
        fontScale,
        paperSize,
        dynamicCoupon,
        kitchenTicket,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan desain struk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Top Banner Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 border shadow-sm transition-all"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e2e8f0)",
          borderRadius: "var(--theme-radius, 1.5rem)",
          boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
        }}
      >
        <div>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border"
            style={{
              backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
              color: "var(--theme-primary, #4f46e5)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plugin Add-on: Premium Receipt Studio
          </div>
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--theme-text-primary, #0f172a)" }}
          >
            Desain & Template Struk Kasir Eksklusif
          </h1>
          <p
            className="text-xs mt-1 font-medium"
            style={{ color: "var(--theme-text-secondary, #64748b)" }}
          >
            Tingkatkan citra brand Bisnis Anda dengan pilihan template struk berkelas, custom divider, voucher promo pintar, dan slip dapur otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!initialData.hasDesignerPlugin && (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Mode Pratinjau Plugin</span>
            </div>
          )}

          <div
            className="flex items-center gap-1 p-1 border"
            style={{
              backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.7)",
            }}
          >
            <button
              type="button"
              onClick={() => setPaperSize("58mm")}
              className="px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
                backgroundColor: paperSize === "58mm" ? "var(--theme-card-bg, #ffffff)" : "transparent",
                color: paperSize === "58mm" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
                boxShadow: paperSize === "58mm" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            >
              58mm
            </button>
            <button
              type="button"
              onClick={() => setPaperSize("80mm")}
              className="px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
                backgroundColor: paperSize === "80mm" ? "var(--theme-card-bg, #ffffff)" : "transparent",
                color: paperSize === "80mm" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
                boxShadow: paperSize === "80mm" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            >
              80mm
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Grid: Controls Left & Live Thermal Canvas Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Template Gallery */}
          <div
            className="p-6 sm:p-7 border shadow-sm space-y-4 transition-all"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
              boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}
            >
              <h3
                className="font-black text-sm flex items-center gap-2"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                <Layers className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
                1. Koleksi Template Struk Premium
              </h3>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
              >
                Pilih Format
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {templateCards.map((tmpl) => {
                const IconComp = tmpl.icon;
                const isSelected = templateStyle === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className="p-4 border text-left transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
                    style={{
                      borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.75)",
                      backgroundColor: isSelected
                        ? "var(--theme-inner-bg, #f1f5f9)"
                        : "var(--theme-card-bg, #ffffff)",
                      borderColor: isSelected
                        ? "var(--theme-primary, #4f46e5)"
                        : "var(--theme-card-border, #e2e8f0)",
                      boxShadow: isSelected
                        ? "0 8px 24px -4px rgba(0,0,0,0.08)"
                        : "none",
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center border"
                        style={{
                          backgroundColor: isSelected
                            ? "var(--theme-primary, #4f46e5)"
                            : "var(--theme-inner-bg, #f8fafc)",
                          borderColor: "var(--theme-card-border, #e2e8f0)",
                          color: isSelected ? "#ffffff" : "var(--theme-primary, #4f46e5)",
                        }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${tmpl.badgeColor}`}>
                        {tmpl.badge}
                      </span>
                    </div>

                    <div>
                      <h4
                        className="font-black text-xs flex items-center gap-1.5"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        <span>{tmpl.title}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5" style={{ color: "var(--theme-primary, #4f46e5)" }} />
                        )}
                      </h4>
                      <p
                        className="text-[11px] mt-1 leading-relaxed"
                        style={{ color: "var(--theme-text-secondary, #64748b)" }}
                      >
                        {tmpl.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Divider Style & Font Scaling */}
          <div
            className="p-6 sm:p-7 border shadow-sm space-y-4 transition-all"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
              boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}
            >
              <h3
                className="font-black text-sm flex items-center gap-2"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                <Sliders className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
                2. Gaya Garis Pemisah (Divider) & Kerapatan
              </h3>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
              >
                Tipografi
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Divider Style Picker */}
              <div>
                <label
                  className="block font-bold mb-2"
                  style={{ color: "var(--theme-text-primary, #1e293b)" }}
                >
                  Gaya Garis Pemisah Antar-Seksi:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "DASHED" as ReceiptDividerStyle, label: "Dashed (- - -)", sample: "- - - - - -" },
                    { id: "DOUBLE" as ReceiptDividerStyle, label: "Double Line (===)", sample: "=======" },
                    { id: "SOLID" as ReceiptDividerStyle, label: "Solid Line (───)", sample: "───────" },
                    { id: "ASTERISK" as ReceiptDividerStyle, label: "Asterisk (* * *)", sample: "* * * * * *" },
                    { id: "BOX" as ReceiptDividerStyle, label: "Box Border (┌─┐)", sample: "┌─────┐" },
                    { id: "MINIMAL" as ReceiptDividerStyle, label: "Minimal (Spasi)", sample: "(Tanpa Garis)" },
                  ].map((div) => (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() => setDividerStyle(div.id)}
                      className="p-3 border text-left transition-all rounded-xl flex flex-col justify-between gap-1"
                      style={{
                        backgroundColor:
                          dividerStyle === div.id
                            ? "var(--theme-inner-bg, #f1f5f9)"
                            : "var(--theme-card-bg, #ffffff)",
                        borderColor:
                          dividerStyle === div.id
                            ? "var(--theme-primary, #4f46e5)"
                            : "var(--theme-card-border, #e2e8f0)",
                      }}
                    >
                      <span
                        className="font-bold text-[11px]"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        {div.label}
                      </span>
                      <span className="font-mono text-[10px] opacity-60">{div.sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Scale & Spacing */}
              <div>
                <label
                  className="block font-bold mb-2"
                  style={{ color: "var(--theme-text-primary, #1e293b)" }}
                >
                  Kerapatan Teks & Spasi Thermal:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "COMPACT" as ReceiptFontScale, label: "Rapat (Hemat Kertas)", icon: Minimize2 },
                    { id: "NORMAL" as ReceiptFontScale, label: "Standar Kasir", icon: Sliders },
                    { id: "SPACIOUS" as ReceiptFontScale, label: "Lapang & Elegan", icon: Maximize2 },
                  ].map((scale) => (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => setFontScale(scale.id)}
                      className="p-3 border text-center transition-all rounded-xl flex flex-col items-center gap-1.5"
                      style={{
                        backgroundColor:
                          fontScale === scale.id
                            ? "var(--theme-inner-bg, #f1f5f9)"
                            : "var(--theme-card-bg, #ffffff)",
                        borderColor:
                          fontScale === scale.id
                            ? "var(--theme-primary, #4f46e5)"
                            : "var(--theme-card-border, #e2e8f0)",
                      }}
                    >
                      <scale.icon className="w-4 h-4 opacity-70" />
                      <span
                        className="font-bold text-[11px]"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        {scale.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Smart Dynamic Coupon & Kitchen Slip */}
          <div
            className="p-6 sm:p-7 border shadow-sm space-y-4 transition-all"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
              boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}
            >
              <h3
                className="font-black text-sm flex items-center gap-2"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                <Ticket className="w-4 h-4 text-amber-500" />
                3. Fitur Cerdas: Voucher Promo & Slip Pesanan Dapur
              </h3>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
              >
                Marketing & Kitchen
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dynamic Voucher Coupon */}
              <div
                className="p-4 border space-y-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                  borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.65)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-500" />
                    <div>
                      <span
                        className="font-bold block"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        Smart Promo Voucher di Kaki Struk
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--theme-text-secondary, #64748b)" }}
                      >
                        Cetak kode kupon otomatis untuk mendorong pelanggan datang kembali
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={couponEnabled}
                    onChange={(e) => setCouponEnabled(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "var(--theme-primary, #4f46e5)" }}
                  />
                </div>

                {couponEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label
                        className="block font-bold mb-1 text-[10px]"
                        style={{ color: "var(--theme-text-primary, #1e293b)" }}
                      >
                        Kode Kupon Promo
                      </label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="KEMBALILAGI"
                        className="w-full px-2.5 py-1.5 border font-mono font-bold uppercase text-xs"
                        style={{
                          backgroundColor: "var(--theme-input-bg, #ffffff)",
                          borderColor: "var(--theme-card-border, #cbd5e1)",
                          color: "var(--theme-text-primary, #0f172a)",
                          borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.35)",
                        }}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        className="block font-bold mb-1 text-[10px]"
                        style={{ color: "var(--theme-text-primary, #1e293b)" }}
                      >
                        Pesan Tawaran Diskon
                      </label>
                      <input
                        type="text"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        placeholder="Diskon 10% di transaksi berikutnya"
                        className="w-full px-2.5 py-1.5 border text-xs"
                        style={{
                          backgroundColor: "var(--theme-input-bg, #ffffff)",
                          borderColor: "var(--theme-card-border, #cbd5e1)",
                          color: "var(--theme-text-primary, #0f172a)",
                          borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.35)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Kitchen Slip / Dapur Order Ticket */}
              <div
                className="p-4 border space-y-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                  borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.65)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span
                        className="font-bold block"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        Slip Pesanan Dapur / Kitchen Bar Ticket (KOT)
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--theme-text-secondary, #64748b)" }}
                      >
                        Cetak salinan tiket pesanan khusus koki/barista tanpa rincian harga
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenEnabled}
                    onChange={(e) => setKitchenEnabled(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "var(--theme-primary, #4f46e5)" }}
                  />
                </div>

                {kitchenEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label
                        className="block font-bold mb-1 text-[10px]"
                        style={{ color: "var(--theme-text-primary, #1e293b)" }}
                      >
                        Judul Header Slip Dapur
                      </label>
                      <input
                        type="text"
                        value={kitchenNoteHeader}
                        onChange={(e) => setKitchenNoteHeader(e.target.value)}
                        placeholder="KITCHEN ORDER TICKET (KOT)"
                        className="w-full px-2.5 py-1.5 border text-xs"
                        style={{
                          backgroundColor: "var(--theme-input-bg, #ffffff)",
                          borderColor: "var(--theme-card-border, #cbd5e1)",
                          color: "var(--theme-text-primary, #0f172a)",
                          borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.35)",
                        }}
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
                      <input
                        type="checkbox"
                        checked={kitchenAutoPrint}
                        onChange={(e) => setKitchenAutoPrint(e.target.checked)}
                        className="w-3.5 h-3.5 rounded"
                        style={{ accentColor: "var(--theme-primary, #4f46e5)" }}
                      />
                      <span
                        className="font-bold text-xs"
                        style={{ color: "var(--theme-text-primary, #334155)" }}
                      >
                        Otomatis cetak saat checkout kasir
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Submit / Action Bar */}
            <div
              className="pt-4 border-t flex items-center justify-between"
              style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}
            >
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" /> Desain struk berhasil diterapkan!
                </span>
              ) : (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
                >
                  Template ini akan digunakan di seluruh cetakan kasir POS.
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 font-extrabold text-xs shadow-lg disabled:opacity-50 transition flex items-center gap-2"
                style={{
                  backgroundColor: "var(--theme-primary, #4f46e5)",
                  color: "#ffffff",
                  borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.65)",
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Desain Struk</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Thermal Canvas Column */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div
            className="p-6 sm:p-7 border shadow-sm space-y-4 transition-all"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
              boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}
            >
              <h3
                className="font-black text-sm flex items-center gap-2"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                <Printer className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
                Interactive Thermal Canvas
              </h3>

              {kitchenEnabled && (
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("CUSTOMER")}
                    className={`px-2 py-0.5 rounded ${previewTab === "CUSTOMER" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                      }`}
                  >
                    Struk Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("KITCHEN")}
                    className={`px-2 py-0.5 rounded ${previewTab === "KITCHEN" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                      }`}
                  >
                    Slip Dapur
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Receipt Preset Switcher & Exporter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-100/90 rounded-xl border border-stone-200 text-xs">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold text-stone-700">Preset:</span>
                <select
                  value={activeReceiptPresetKey}
                  onChange={(e) => setActiveReceiptPresetKey(e.target.value)}
                  className="px-2 py-1 bg-white border border-stone-300 rounded-lg font-black text-xs cursor-pointer shadow-sm text-stone-900"
                >
                  {Object.entries(BUILTIN_RECEIPT_PRESETS).map(([k, item]) => (
                    <option key={k} value={k}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 transition"
                  title="Download file JSON preset struk ini"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 transition"
                  title="Coba cetak struk"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Test Print</span>
                </button>
              </div>
            </div>

            {/* Thermal Paper Render Canvas */}
            {previewTab === "CUSTOMER" ? (
              <DynamicReceiptRenderer
                preset={BUILTIN_RECEIPT_PRESETS[activeReceiptPresetKey]?.preset}
                data={sampleTransactionData}
              />
            ) : (

              /* Kitchen Slip Preview */
              <div
                className={`mx-auto bg-[#FFFDF9] border border-dashed border-amber-400 rounded-2xl p-5 sm:p-6 font-mono text-stone-900 shadow-2xl space-y-2.5 transition-all ${paperSize === "80mm" ? "max-w-md text-xs" : "max-w-xs text-[11px]"
                  }`}
              >
                <div className="text-center border-b-2 border-stone-800 pb-2 space-y-1">
                  <span className="px-2 py-0.5 bg-stone-900 text-white rounded text-[9px] font-black tracking-wider uppercase">
                    {kitchenNoteHeader || "KITCHEN ORDER TICKET"}
                  </span>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-black">#5078</span>
                    <span className="border-2 border-stone-800 px-2 py-0.5 font-black text-sm">TABLE 18</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500 pt-0.5">
                    <span>18/08/2026 14:30</span>
                    <span>DINE IN</span>
                  </div>
                </div>

                <div className="space-y-2 py-2 border-b-2 border-stone-800">
                  <div className="font-bold text-sm">
                    <div className="flex justify-between">
                      <span>[ 1x ] Iced Cafe Latte Regular</span>
                    </div>
                    <div className="pl-3 text-[10px] text-stone-600 font-normal">
                      <p>➤ Normal Shot</p>
                      <p>➤ Fresh Milk</p>
                      <p>➤ Normal Ice</p>
                    </div>
                  </div>

                  <div className="font-bold text-sm">
                    <div className="flex justify-between">
                      <span>[ 1x ] Butterscotch Sea Salt Latte</span>
                    </div>
                    <div className="pl-3 text-[10px] text-stone-600 font-normal">
                      <p>➤ Normal Sweet</p>
                      <p>➤ No Tumbler</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-stone-500 pt-1">
                  <p>*** TIKET DAPUR / BAR ***</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
