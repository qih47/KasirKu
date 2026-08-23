"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  Sparkles,
  Layers,
  Save,
  Loader2,
  Lock,
  Coffee,
  Scissors,
  Utensils,
  ShoppingBag,
  Shirt,
  Crown,
  Check,
  Download,
  Code,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RefreshCw,
  QrCode,
  Wifi,
  Ticket,
  Minus,
  FileText,
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
import { ReceiptBlock, ReceiptBlockType, ReceiptPresetBlueprint } from "@/types/plugin-package";

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

const DEFAULT_RECEIPT_BLOCKS: ReceiptBlock[] = [
  { type: "HEADER_LOGO", align: "center" },
  { type: "STORE_META", align: "center" },
  { type: "DIVIDER", align: "center" },
  { type: "QUEUE_NUMBER", align: "center" },
  { type: "TABLE_META", align: "left" },
  { type: "TRANSACTION_META", align: "left" },
  { type: "DIVIDER", align: "center" },
  { type: "ITEMS_TABLE", align: "left" },
  { type: "DIVIDER", align: "center" },
  { type: "DISCOUNT_VOUCHER", align: "right" },
  { type: "TOTAL_SUMMARY", align: "right" },
  { type: "PAYMENT_DETAILS", align: "left" },
  { type: "QRIS_CODE", align: "center" },
  { type: "COUPON_PROMO", align: "center" },
  { type: "WIFI_INFO", align: "center" },
  { type: "FOOTER_NOTES", align: "center" },
  { type: "POWERED_BY", align: "center" },
];

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
    rc.paperSize || "80mm"
  );

  // Active Studio Mode: Visual Blocks vs Live JSON vs Preset Themes
  const [studioTab, setStudioTab] = useState<"VISUAL_BLOCKS" | "JSON_CODE" | "THEMES">("VISUAL_BLOCKS");

  // Dynamic Custom Blocks
  const [customBlocks, setCustomBlocks] = useState<ReceiptBlock[]>(() => {
    return DEFAULT_RECEIPT_BLOCKS;
  });

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
  const [activeReceiptPresetKey, setActiveReceiptPresetKey] = useState<string>("qassa-receipt-modern-80mm");

  // Live JSON Code Editor State & Sync
  const [jsonCode, setJsonCode] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Synchronize state -> JSON code string
  useEffect(() => {
    const payload = {
      manifest: {
        id: `custom-receipt-${templateStyle.toLowerCase()}`,
        name: `Custom Receipt Layout (${paperSize})`,
        type: "RECEIPT_PRESET",
        version: "1.0.0",
        author: initialData.businessName || "Qassa Super Admin",
        description: "Tata letak struk modular yang disesuaikan secara visual.",
      },
      receipt: {
        paperWidth: paperSize,
        fontFamily: "monospace",
        fontSizeScale: fontScale.toLowerCase(),
        dividerStyle: dividerStyle.toLowerCase(),
        blocks: customBlocks,
      },
    };
    setJsonCode(JSON.stringify(payload, null, 2));
    setJsonError(null);
  }, [customBlocks, paperSize, fontScale, dividerStyle, templateStyle, initialData.businessName]);

  // Handle Manual Edit in JSON Editor
  const handleJsonEditorChange = (newText: string) => {
    setJsonCode(newText);
    try {
      const parsed = JSON.parse(newText);
      if (parsed.receipt) {
        if (parsed.receipt.blocks && Array.isArray(parsed.receipt.blocks)) {
          setCustomBlocks(parsed.receipt.blocks);
        }
        if (parsed.receipt.paperWidth) {
          setPaperSize(parsed.receipt.paperWidth);
        }
        if (parsed.receipt.dividerStyle) {
          setDividerStyle(parsed.receipt.dividerStyle.toUpperCase() as ReceiptDividerStyle);
        }
        if (parsed.receipt.fontSizeScale) {
          setFontScale(parsed.receipt.fontSizeScale.toUpperCase() as ReceiptFontScale);
        }
        setJsonError(null);
      }
    } catch (err: any) {
      setJsonError("Format JSON tidak valid: " + err.message);
    }
  };

  // Block Manipulation Handlers
  const handleMoveBlock = (index: number, direction: "UP" | "DOWN") => {
    const newBlocks = [...customBlocks];
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setCustomBlocks(newBlocks);
  };

  const handleChangeAlign = (index: number, align: "left" | "center" | "right") => {
    const newBlocks = [...customBlocks];
    newBlocks[index] = { ...newBlocks[index], align };
    setCustomBlocks(newBlocks);
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = customBlocks.filter((_, i) => i !== index);
    setCustomBlocks(newBlocks);
  };

  const handleAddBlock = (type: ReceiptBlockType, align: "left" | "center" | "right" = "center") => {
    const newBlocks = [...customBlocks, { type, align }];
    setCustomBlocks(newBlocks);
  };

  const getBlockName = (type: ReceiptBlockType): { name: string; icon: any } => {
    switch (type) {
      case "HEADER_LOGO":
        return { name: "Logo Brand Toko", icon: Sparkles };
      case "STORE_META":
        return { name: "Kop & Identitas Usaha", icon: FileText };
      case "DIVIDER":
        return { name: "Garis Pembatas (Divider)", icon: Minus };
      case "QUEUE_NUMBER":
        return { name: "Nomor Antrean Jumbo", icon: Ticket };
      case "TABLE_META":
        return { name: "Nomor Meja / Station", icon: Utensils };
      case "TRANSACTION_META":
        return { name: "Informasi No. Struk & Waktu", icon: FileText };
      case "ITEMS_TABLE":
        return { name: "Daftar Item Belanja & Modifiers", icon: ShoppingBag };
      case "DISCOUNT_VOUCHER":
        return { name: "Potongan Diskon & Voucher", icon: Ticket };
      case "TOTAL_SUMMARY":
        return { name: "Ringkasan Total, Pajak & Biaya", icon: FileText };
      case "PAYMENT_DETAILS":
        return { name: "Rincian Pembayaran & Kembalian", icon: FileText };
      case "QRIS_CODE":
        return { name: "Kode QRIS (Dinamis / Review)", icon: QrCode };
      case "COUPON_PROMO":
        return { name: "Kupon Diskon Repeat Order", icon: Ticket };
      case "WIFI_INFO":
        return { name: "Informasi WiFi Kafe", icon: Wifi };
      case "CUSTOM_NOTE":
        return { name: "Teks / Catatan Kustom", icon: FileText };
      case "FOOTER_NOTES":
        return { name: "Catatan Footer & Ucapan", icon: FileText };
      case "POWERED_BY":
        return { name: "Watermark Powered by Qassa", icon: Sparkles };
      default:
        return { name: type, icon: FileText };
    }
  };

  const sampleTransactionData: TransactionReceiptData = {
    storeName: initialData.businessName || "Toko Anda",
    outletName: initialData.primaryOutlet?.name || "Cabang Utama",
    address: initialData.primaryOutlet?.address || "",
    phone: initialData.primaryOutlet?.phone || "",
    headerNote: rc.headerText || "",
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
    const exportPayload = {
      manifest: {
        id: `custom-receipt-${templateStyle.toLowerCase()}`,
        name: `Custom Receipt Layout (${paperSize})`,
        type: "RECEIPT_PRESET",
        version: "1.0.0",
        author: initialData.businessName || "Qassa Super Admin",
        description: "Blueprint tema struk dinamis dengan fleksibilitas blok visual.",
        compatibility: ">=1.0.0",
        priceMonthly: 19000,
        priceAnnual: 190000,
      },
      receipt: {
        paperWidth: paperSize,
        fontFamily: "monospace",
        fontSizeScale: fontScale.toLowerCase(),
        dividerStyle: dividerStyle.toLowerCase(),
        blocks: customBlocks,
      },
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `receipt-${templateStyle.toLowerCase()}-${paperSize}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const activeBlueprint: ReceiptPresetBlueprint = {
    paperWidth: paperSize,
    fontSizeScale: fontScale.toLowerCase() as any,
    dividerStyle: dividerStyle.toLowerCase() as any,
    blocks: customBlocks,
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
            Super Admin &amp; Pro Studio: Visual Receipt Builder
          </div>
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--theme-text-primary, #0f172a)" }}
          >
            Desain &amp; Tata Letak Struk Kasir Modular
          </h1>
          <p
            className="text-xs mt-1 font-medium"
            style={{ color: "var(--theme-text-secondary, #64748b)" }}
          >
            Rancang posisi komponen secara bebas (QRIS, kupon, garis divider, WiFi), atur perataan kiri/tengah/kanan, dan lakukan 2-Way Live Sync dengan kode JSON.
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
              className="px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
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
              className="px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
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

      {/* Main Grid: Visual Builder & JSON Sync Left, Live Thermal Canvas Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Studio & JSON Code Editor */}
        <div className="lg:col-span-7 space-y-5">
          {/* Navigation Tabs */}
          <div
            className="flex items-center gap-1.5 p-1.5 border"
            style={{
              backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.25rem)",
            }}
          >
            <button
              type="button"
              onClick={() => setStudioTab("VISUAL_BLOCKS")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                studioTab === "VISUAL_BLOCKS"
                  ? "bg-white text-indigo-600 shadow-sm border border-stone-200/60 font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Visual Block Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab("JSON_CODE")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                studioTab === "JSON_CODE"
                  ? "bg-white text-indigo-600 shadow-sm border border-stone-200/60 font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>2. 2-Way Live JSON Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab("THEMES")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                studioTab === "THEMES"
                  ? "bg-white text-indigo-600 shadow-sm border border-stone-200/60 font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. Preset Tema</span>
            </button>
          </div>

          {/* TAB 1: VISUAL BLOCK BUILDER */}
          {studioTab === "VISUAL_BLOCKS" && (
            <div
              className="p-6 sm:p-7 border shadow-sm space-y-5 transition-all"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                borderRadius: "var(--theme-radius, 1.5rem)",
                boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}>
                <div>
                  <h3 className="font-black text-sm flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Susunan Blok Komponen Struk</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Geser urutan blok ke atas/bawah dan atur perataan posisi secara leluasa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomBlocks(DEFAULT_RECEIPT_BLOCKS)}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-[11px] font-bold flex items-center gap-1 transition"
                  title="Kembalikan susunan ke default"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Add Block Quick Toolbar */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-700 block">
                  + Tambah Komponen Baru ke Struk:
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleAddBlock("DIVIDER", "center")}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-bold text-stone-800 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-indigo-600" />
                    <span>+ Garis (Divider)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("QRIS_CODE", "center")}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-bold text-stone-800 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <QrCode className="w-3 h-3 text-indigo-600" />
                    <span>+ QRIS Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("DISCOUNT_VOUCHER", "right")}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-bold text-stone-800 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Ticket className="w-3 h-3 text-amber-600" />
                    <span>+ Potongan Diskon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("COUPON_PROMO", "center")}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-bold text-stone-800 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Ticket className="w-3 h-3 text-indigo-600" />
                    <span>+ Kupon Repeat Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("WIFI_INFO", "center")}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-bold text-stone-800 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Wifi className="w-3 h-3 text-indigo-600" />
                    <span>+ Info WiFi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock("CUSTOM_NOTE", "center")}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-bold text-stone-800 flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-indigo-600" />
                    <span>+ Catatan Kustom</span>
                  </button>
                </div>
              </div>

              {/* Block List Interactive Cards */}
              <div className="space-y-2">
                {customBlocks.map((block, idx) => {
                  const blockMeta = getBlockName(block.type);
                  const IconComp = blockMeta.icon;
                  const currentAlign = block.align || "center";

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border flex items-center justify-between gap-3 bg-stone-50/70 border-stone-200 hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs text-stone-900 truncate">
                            {blockMeta.name}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">
                            type: {block.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Alignment Switcher */}
                        <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleChangeAlign(idx, "left")}
                            className={`p-1 rounded ${currentAlign === "left" ? "bg-indigo-600 text-white" : "text-stone-400 hover:text-stone-700"} cursor-pointer`}
                            title="Rata Kiri"
                          >
                            <AlignLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeAlign(idx, "center")}
                            className={`p-1 rounded ${currentAlign === "center" ? "bg-indigo-600 text-white" : "text-stone-400 hover:text-stone-700"} cursor-pointer`}
                            title="Rata Tengah"
                          >
                            <AlignCenter className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeAlign(idx, "right")}
                            className={`p-1 rounded ${currentAlign === "right" ? "bg-indigo-600 text-white" : "text-stone-400 hover:text-stone-700"} cursor-pointer`}
                            title="Rata Kanan"
                          >
                            <AlignRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(idx, "UP")}
                            disabled={idx === 0}
                            className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(idx, "DOWN")}
                            disabled={idx === customBlocks.length - 1}
                            className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
                          title="Hapus Blok"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE TWO-WAY JSON CODE EDITOR */}
          {studioTab === "JSON_CODE" && (
            <div
              className="p-6 sm:p-7 border shadow-sm space-y-4 transition-all"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                borderRadius: "var(--theme-radius, 1.5rem)",
                boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}>
                <div>
                  <h3 className="font-black text-sm flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                    <Code className="w-4 h-4 text-indigo-600" />
                    <span>2-Way Live JSON Code Editor</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ketik atau modifikasi JSON secara langsung. Pratinjau di sisi kanan akan ter-update secara real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File .json</span>
                </button>
              </div>

              {jsonError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                  {jsonError}
                </div>
              )}

              <textarea
                value={jsonCode}
                onChange={(e) => handleJsonEditorChange(e.target.value)}
                rows={16}
                className="w-full p-4 rounded-xl font-mono text-xs bg-stone-900 text-emerald-400 border border-stone-700 focus:outline-none focus:border-indigo-500 shadow-inner leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 3: PRESET THEME CARDS */}
          {studioTab === "THEMES" && (
            <div
              className="p-6 sm:p-7 border shadow-sm space-y-4 transition-all"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                borderRadius: "var(--theme-radius, 1.5rem)",
                boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}>
                <h3 className="font-black text-sm flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Koleksi Tema Struk Industri</span>
                </h3>
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
                      className="p-4 border text-left transition-all flex flex-col justify-between gap-3 group relative overflow-hidden cursor-pointer"
                      style={{
                        borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.75)",
                        backgroundColor: isSelected ? "var(--theme-inner-bg, #f1f5f9)" : "var(--theme-card-bg, #ffffff)",
                        borderColor: isSelected ? "var(--theme-primary, #4f46e5)" : "var(--theme-card-border, #e2e8f0)",
                        boxShadow: isSelected ? "0 8px 24px -4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center border"
                          style={{
                            backgroundColor: isSelected ? "var(--theme-primary, #4f46e5)" : "var(--theme-inner-bg, #f8fafc)",
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
                        <h4 className="font-black text-xs flex items-center gap-1.5" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                          <span>{tmpl.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </h4>
                        <p className="text-[11px] mt-1 leading-relaxed text-stone-500">
                          {tmpl.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Save Bar */}
          <div className="flex items-center justify-between pt-2">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Desain struk berhasil disimpan!
              </span>
            )}
            {!savedSuccess && <span />}

            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan Desain</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Thermal Paper Canvas */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div
            className="p-5 border shadow-sm space-y-4 transition-all"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--theme-card-border, #f1f5f9)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-black text-xs uppercase tracking-wider text-stone-900">
                  Pratinjau Kertas Struk
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                  title="Download file JSON preset struk ini"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                  title="Coba cetak struk"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Test Print</span>
                </button>
              </div>
            </div>

            {/* Thermal Paper Render Canvas */}
            <DynamicReceiptRenderer
              preset={activeBlueprint}
              config={rc}
              data={sampleTransactionData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
