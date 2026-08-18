"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Printer,
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  Coffee,
  Scissors,
  Utensils,
  Shirt,
  Crown,
  Eye,
  Check,
  Loader2,
  Package,
  Layers,
  X,
  CreditCard,
  Building2,
  ArrowRight,
  Palette,
  LayoutTemplate,
  Sliders,
  Monitor,
  ScanBarcode,
  Scale,
  Smartphone,
} from "lucide-react";
import {
  purchaseReceiptThemeAction,
  applyUiThemeAction,
  purchasePosLayoutAction,
} from "@/modules/store/actions";
import {
  ReceiptThemeItem,
  BusinessVertical,
  ReceiptTemplateStyle,
} from "@/types/receipt";
import {
  PosLayoutItem,
  PosLayoutType,
} from "@/types/pos-layout";
import Link from "next/link";

interface StoreClientProps {
  initialData: {
    tenantId: string;
    businessName: string;
    logoUrl?: string | null;
    isTrial: boolean;
    isPaidActive: boolean;
    licenseTier?: any;
    activePluginCodes: string[];
    plugins: any[];
    uiThemes: any[];
    activeUiThemeId: string | null;
    receiptThemes: ReceiptThemeItem[];
    purchasedThemeIds: string[];
    activeReceiptThemeId: string;
    posLayouts: PosLayoutItem[];
    purchasedLayoutIds: string[];
    activePosLayout: string;
    activeUiThemeCode?: string;
    activeUiThemeName?: string;
    receiptConfig: any;
    primaryOutlet?: any;
  };
}

export function StoreClient({ initialData }: StoreClientProps) {
  const [activeTab, setActiveTab] = useState<
    "POS_LAYOUTS" | "RECEIPT_THEMES" | "UI_THEMES"
  >("POS_LAYOUTS");

  const [selectedVertical, setSelectedVertical] = useState<string>("ALL");

  // State tema struk
  const [purchasedIds, setPurchasedIds] = useState<string[]>(
    initialData.purchasedThemeIds || []
  );
  const [activeReceiptTheme, setActiveReceiptTheme] = useState<string>(
    initialData.activeReceiptThemeId || "DEFAULT"
  );

  // State tema layout POS
  const [purchasedLayoutIds, setPurchasedLayoutIds] = useState<string[]>(
    initialData.purchasedLayoutIds || []
  );
  const [activePosLayout, setActivePosLayout] = useState<string>(
    initialData.activePosLayout || "DEFAULT"
  );

  const isUsingDefaultPos =
    activePosLayout === "DEFAULT" ||
    !activePosLayout ||
    activePosLayout === "STANDARD";


  // State tema UI
  const [activeUiThemeId, setActiveUiThemeId] = useState<string | null>(
    initialData.activeUiThemeId || null
  );

  // Modal Preview States
  const [previewTheme, setPreviewTheme] = useState<ReceiptThemeItem | null>(null);
  const [previewLayout, setPreviewLayout] = useState<PosLayoutItem | null>(null);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter themes based on selected vertical tab
  const filteredReceiptThemes = initialData.receiptThemes.filter((t) => {
    if (selectedVertical === "ALL") return true;
    return t.vertical === selectedVertical;
  });

  const filteredPosLayouts = initialData.posLayouts.filter((l) => {
    if (selectedVertical === "ALL") return true;
    return l.vertical === selectedVertical;
  });

  const handlePurchaseOrApplyReceiptTheme = async (
    theme: ReceiptThemeItem
  ) => {
    setLoadingId(theme.id);
    try {
      const res = await purchaseReceiptThemeAction(theme.id);
      if (res.success) {
        if (!purchasedIds.includes(theme.id)) {
          setPurchasedIds([...purchasedIds, theme.id]);
        }
        setActiveReceiptTheme(theme.id);
        setSuccessMsg(`Tema Struk "${theme.name}" berhasil diterapkan!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setPreviewTheme(null);
      }
    } catch (err: any) {
      alert(err.message || "Gagal membeli tema struk.");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePurchaseOrApplyPosLayout = async (layout: PosLayoutItem) => {
    setLoadingId(layout.id);
    try {
      const res = await purchasePosLayoutAction(layout.id);
      if (res.success) {
        if (!purchasedLayoutIds.includes(layout.id)) {
          setPurchasedLayoutIds([...purchasedLayoutIds, layout.id]);
        }
        setActivePosLayout(layout.id);
        setSuccessMsg(`Layout Kasir POS "${layout.name}" berhasil diterapkan ke kasir!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setPreviewLayout(null);
      }
    } catch (err: any) {
      alert(err.message || "Gagal memasang layout POS.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleApplyUiTheme = async (themeId: string, themeName: string) => {
    setLoadingId(themeId);
    try {
      const res = await applyUiThemeAction(themeId);
      if (res.success) {
        setActiveUiThemeId(themeId);
        setSuccessMsg(`Tema UI "${themeName}" berhasil diterapkan!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || "Gagal menerapkan tema UI.");
    } finally {
      setLoadingId(null);
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
            <ShoppingBag className="w-3.5 h-3.5" />
            KasirKu Add-on & Theme Marketplace
          </div>
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--theme-text-primary, #0f172a)" }}
          >
            Store & Add-on Marketplace
          </h1>
          <p
            className="text-xs mt-1 font-medium"
            style={{ color: "var(--theme-text-secondary, #64748b)" }}
          >
            Pusat belanja tema layout antarmuka kasir POS, tema cetak struk thermal, tema UI sistem, dan plugin modul vertikal.
          </p>
        </div>

        {/* 4 Tab Selector Switcher */}
        <div
          className="flex items-center gap-1 p-1 border overflow-x-auto max-w-full"
          style={{
            backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
            borderColor: "var(--theme-card-border, #e2e8f0)",
            borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.7)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("POS_LAYOUTS")}
            className="px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
              backgroundColor:
                activeTab === "POS_LAYOUTS"
                  ? "var(--theme-card-bg, #ffffff)"
                  : "transparent",
              color:
                activeTab === "POS_LAYOUTS"
                  ? "var(--theme-primary, #4f46e5)"
                  : "var(--theme-text-secondary, #64748b)",
              boxShadow:
                activeTab === "POS_LAYOUTS"
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Tema POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RECEIPT_THEMES")}
            className="px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
              backgroundColor:
                activeTab === "RECEIPT_THEMES"
                  ? "var(--theme-card-bg, #ffffff)"
                  : "transparent",
              color:
                activeTab === "RECEIPT_THEMES"
                  ? "var(--theme-primary, #4f46e5)"
                  : "var(--theme-text-secondary, #64748b)",
              boxShadow:
                activeTab === "RECEIPT_THEMES"
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Tema Struk Kasir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UI_THEMES")}
            className="px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
              backgroundColor:
                activeTab === "UI_THEMES"
                  ? "var(--theme-card-bg, #ffffff)"
                  : "transparent",
              color:
                activeTab === "UI_THEMES"
                  ? "var(--theme-primary, #4f46e5)"
                  : "var(--theme-text-secondary, #64748b)",
              boxShadow:
                activeTab === "UI_THEMES"
                  ? "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema UI Dashboard</span>
          </button>
        </div>
      </div>


      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <Link
            href="/pos"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
          >
            <span>Buka Kasir POS Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* TAB 1: TEMA LAYOUT LAYAR KASIR POS */}
      {activeTab === "POS_LAYOUTS" && (
        <div className="space-y-6">
          {initialData.posLayouts.length === 0 ? (
            <div
              className="p-12 text-center border-2 border-dashed space-y-3"
              style={{
                borderRadius: "var(--theme-radius, 1.5rem)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                backgroundColor: "var(--theme-card-bg, #ffffff)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                  color: "var(--theme-primary, #4f46e5)",
                }}
              >
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h3
                className="font-bold text-base"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                Belum Ada Blueprint Layout POS di Katalog
              </h3>
              <p
                className="text-xs max-w-md mx-auto"
                style={{ color: "var(--theme-text-secondary, #64748b)" }}
              >
                Layout POS standar bawaan sistem aktif digunakan. Layout kustom baru akan muncul di sini saat dipublikasikan oleh Platform Admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 0: Bawaan Tema UI Aktif (Default) */}
              <div
                className="border shadow-sm flex flex-col justify-between transition-all group overflow-hidden"
                style={{
                  backgroundColor: "var(--theme-card-bg, #ffffff)",
                  borderColor: isUsingDefaultPos
                    ? "var(--theme-primary, #4f46e5)"
                    : "var(--theme-card-border, #e2e8f0)",
                  borderRadius: "var(--theme-radius, 1.5rem)",
                  boxShadow: isUsingDefaultPos
                    ? "0 12px 28px -4px rgba(0,0,0,0.1)"
                    : "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
                }}
              >
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border"
                        style={{
                          backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                          borderColor: "var(--theme-card-border, #e2e8f0)",
                          color: "var(--theme-primary, #4f46e5)",
                        }}
                      >
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                          style={{
                            backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                            borderColor: "var(--theme-card-border, #e2e8f0)",
                            color: "var(--theme-primary, #4f46e5)",
                          }}
                        >
                          BAWAAN TEMA UI
                        </span>
                      </div>
                    </div>

                    {isUsingDefaultPos ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Sedang Digunakan (Default)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold opacity-70 border">
                        Bawaan Tema UI
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      className="font-black text-lg"
                      style={{ color: "var(--theme-text-primary, #0f172a)" }}
                    >
                      🌟 Ikuti Bawaan Tema UI Aktif
                    </h3>
                    <p
                      className="text-xs mt-1.5 leading-relaxed"
                      style={{ color: "var(--theme-text-secondary, #64748b)" }}
                    >
                      Tampilan kasir POS akan secara otomatis mewarisi tema warna, font, dan nuansa dari Tema UI yang aktif ({initialData.activeUiThemeName || "Tema UI Sistem"}).
                    </p>
                  </div>

                  <div
                    className="p-4 border rounded-2xl space-y-2 text-xs"
                    style={{
                      backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                      borderColor: "var(--theme-card-border, #e2e8f0)",
                    }}
                  >
                    <span
                      className="font-bold text-[11px] block"
                      style={{ color: "var(--theme-text-primary, #0f172a)" }}
                    >
                      ✨ Karakteristik:
                    </span>
                    <ul className="space-y-1.5 text-[11px]">
                      <li
                        className="flex items-start gap-1.5"
                        style={{ color: "var(--theme-text-secondary, #475569)" }}
                      >
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>Otomatis sinkron dengan tema UI Dashboard yang dipilih</span>
                      </li>
                      <li
                        className="flex items-start gap-1.5"
                        style={{ color: "var(--theme-text-secondary, #475569)" }}
                      >
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>Tanpa biaya tambahan &bull; Paket Bawaan Sistem</span>
                      </li>
                    </ul>
                  </div>

                  <p
                    className="text-[11px] italic"
                    style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
                  >
                    💡 <strong>Status:</strong> {isUsingDefaultPos ? "POS saat ini mengikuti tema UI aktif." : "POS sedang menggunakan layout kustom independen."}
                  </p>
                </div>

                {/* Card Footer */}
                <div
                  className="p-5 border-t flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                    borderColor: "var(--theme-card-border, #f1f5f9)",
                  }}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Biaya:
                    </span>
                    <span
                      className="font-black text-base"
                      style={{ color: "var(--theme-text-primary, #0f172a)" }}
                    >
                      Rp 0
                      <span className="text-[11px] font-normal text-slate-500">
                        /bln
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isUsingDefaultPos || loadingId === "DEFAULT"}
                    onClick={() =>
                      handlePurchaseOrApplyPosLayout({
                        id: "DEFAULT",
                        name: "Bawaan Tema UI",
                        vertical: "GENERAL",
                        verticalLabel: "Umum",
                        layoutType: "STANDARD",
                        priceMonthly: 0,
                        description: "Bawaan Tema UI",
                        badge: "DEFAULT",
                        features: [],
                      } as any)
                    }
                    className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                    style={{
                      backgroundColor: isUsingDefaultPos
                        ? "#10b981"
                        : "var(--theme-primary, #4f46e5)",
                      color: "#ffffff",
                    }}
                  >
                    {loadingId === "DEFAULT" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isUsingDefaultPos ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Sedang Digunakan</span>
                      </>
                    ) : (
                      <span>Kembalikan ke Bawaan Tema UI</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Other POS Layouts */}
              {initialData.posLayouts.map((layout) => {
                const isPurchased = purchasedLayoutIds.includes(layout.id);
                const isActive = activePosLayout === layout.id;
                const isLoading = loadingId === layout.id;


                return (
                  <div
                    key={layout.id}
                    className="border shadow-sm flex flex-col justify-between transition-all group overflow-hidden"
                    style={{
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      borderColor: isActive
                        ? "var(--theme-primary, #4f46e5)"
                        : "var(--theme-card-border, #e2e8f0)",
                      borderRadius: "var(--theme-radius, 1.5rem)",
                      boxShadow: isActive
                        ? "0 12px 28px -4px rgba(0,0,0,0.1)"
                        : "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
                    }}
                  >
                    <div className="p-6 sm:p-7 space-y-4">

                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border"
                            style={{
                              backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                              borderColor: "var(--theme-card-border, #e2e8f0)",
                              color: "var(--theme-primary, #4f46e5)",
                            }}
                          >
                            {layout.vertical === "CAFE" ? (
                              <Coffee className="w-5 h-5" />
                            ) : layout.vertical === "BARBERSHOP" ? (
                              <Scissors className="w-5 h-5" />
                            ) : layout.vertical === "LAUNDRY" ? (
                              <Shirt className="w-5 h-5" />
                            ) : (
                              <ScanBarcode className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                              style={{
                                backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                                borderColor: "var(--theme-card-border, #e2e8f0)",
                                color: "var(--theme-primary, #4f46e5)",
                              }}
                            >
                              {layout.verticalLabel}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Sedang Digunakan
                          </span>
                        ) : isPurchased ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sudah Dimiliki
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            {layout.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3
                          className="font-black text-lg"
                          style={{ color: "var(--theme-text-primary, #0f172a)" }}
                        >
                          {layout.name}
                        </h3>
                        <p
                          className="text-xs mt-1.5 leading-relaxed"
                          style={{ color: "var(--theme-text-secondary, #64748b)" }}
                        >
                          {layout.description}
                        </p>
                      </div>

                      {/* Feature Bullets */}
                      <div
                        className="p-4 border rounded-2xl space-y-2 text-xs"
                        style={{
                          backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                          borderColor: "var(--theme-card-border, #e2e8f0)",
                        }}
                      >
                        <span
                          className="font-bold text-[11px] block"
                          style={{ color: "var(--theme-text-primary, #0f172a)" }}
                        >
                          ✨ Keunggulan Alur Kasir:
                        </span>
                        <ul className="space-y-1.5 text-[11px]">
                          {layout.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              className="flex items-start gap-1.5"
                              style={{ color: "var(--theme-text-secondary, #475569)" }}
                            >
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p
                        className="text-[11px] italic"
                        style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
                      >
                        💡 <strong>Alur:</strong> {layout.workflowDescription}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div
                      className="p-5 border-t flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                        borderColor: "var(--theme-card-border, #f1f5f9)",
                      }}
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Biaya Add-on:
                        </span>
                        <span
                          className="font-black text-base"
                          style={{ color: "var(--theme-text-primary, #0f172a)" }}
                        >
                          Rp {layout.priceMonthly.toLocaleString("id-ID")}
                          <span className="text-[11px] font-normal text-slate-500">
                            /bln
                          </span>
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isLoading || isActive}
                        onClick={() => handlePurchaseOrApplyPosLayout(layout)}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                        style={{
                          backgroundColor: isActive
                            ? "#10b981"
                            : "var(--theme-primary, #4f46e5)",
                          color: "#ffffff",
                        }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Sedang Digunakan</span>
                          </>
                        ) : isPurchased ? (
                          <span>Pasang Layout Ini</span>
                        ) : (
                          <span>Beli & Pasang Layout</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* TAB 2: TEMA STRUK KASIR PER VERTIKAL */}
      {activeTab === "RECEIPT_THEMES" && (
        <div className="space-y-6">
          {/* Vertical Filter Pills */}
          <div
            className="p-4 border shadow-sm flex items-center gap-2 overflow-x-auto"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
            }}
          >
            <span
              className="text-xs font-bold whitespace-nowrap mr-2"
              style={{ color: "var(--theme-text-secondary, #64748b)" }}
            >
              Filter Sektor:
            </span>

            {[
              { id: "ALL", label: "🌟 Semua Vertikal" },
              { id: "CAFE", label: "☕ Cafe & F&B" },
              { id: "BARBERSHOP", label: "💈 Barbershop & Salon" },
              { id: "RETAIL", label: "🛒 Retail & Minimarket" },
              { id: "LAUNDRY", label: "🧺 Laundry" },
              { id: "GENERAL", label: "✨ Luxury & Umum" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedVertical(cat.id)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 border"
                style={{
                  backgroundColor:
                    selectedVertical === cat.id
                      ? "var(--theme-primary, #4f46e5)"
                      : "var(--theme-inner-bg, #f8fafc)",
                  borderColor:
                    selectedVertical === cat.id
                      ? "var(--theme-primary, #4f46e5)"
                      : "var(--theme-card-border, #e2e8f0)",
                  color:
                    selectedVertical === cat.id
                      ? "#ffffff"
                      : "var(--theme-text-primary, #0f172a)",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Receipt Themes Cards Grid */}
          {filteredReceiptThemes.length === 0 ? (
            <div
              className="p-12 text-center border-2 border-dashed space-y-3"
              style={{
                borderRadius: "var(--theme-radius, 1.5rem)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                backgroundColor: "var(--theme-card-bg, #ffffff)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                  color: "var(--theme-primary, #4f46e5)",
                }}
              >
                <Printer className="w-6 h-6" />
              </div>
              <h3
                className="font-bold text-base"
                style={{ color: "var(--theme-text-primary, #0f172a)" }}
              >
                Belum Ada Template Struk Kustom di Katalog
              </h3>
              <p
                className="text-xs max-w-md mx-auto"
                style={{ color: "var(--theme-text-secondary, #64748b)" }}
              >
                Struk standar sistem aktif digunakan. Template struk kustom (58mm/80mm) akan muncul di sini saat dipublikasikan oleh Platform Admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReceiptThemes.map((theme) => {
                const isPurchased = purchasedIds.includes(theme.id);
                const isActive = activeReceiptTheme === theme.id;
                const isLoading = loadingId === theme.id;

                return (
                  <div
                    key={theme.id}
                    className="border shadow-sm flex flex-col justify-between transition-all group overflow-hidden"
                    style={{
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      borderColor: isActive
                        ? "var(--theme-primary, #4f46e5)"
                        : "var(--theme-card-border, #e2e8f0)",
                      borderRadius: "var(--theme-radius, 1.5rem)",
                      boxShadow: isActive
                        ? "0 12px 28px -4px rgba(0,0,0,0.1)"
                        : "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
                    }}
                  >
                    {/* Card Header */}
                    <div className="p-5 sm:p-6 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                          style={{
                            backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                            borderColor: "var(--theme-card-border, #e2e8f0)",
                            color: "var(--theme-primary, #4f46e5)",
                          }}
                        >
                          {theme.verticalLabel}
                        </span>

                        {isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                            <Check className="w-3 h-3" /> Sedang Dipasang
                          </span>
                        ) : isPurchased ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sudah Dimiliki
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            {theme.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3
                          className="font-black text-base"
                          style={{ color: "var(--theme-text-primary, #0f172a)" }}
                        >
                          {theme.name}
                        </h3>
                        <p
                          className="text-xs mt-1 leading-relaxed line-clamp-2"
                          style={{ color: "var(--theme-text-secondary, #64748b)" }}
                        >
                          {theme.description}
                        </p>
                      </div>

                      {/* Mini Visual Thermal Simulation Box */}
                      <div className="p-3 bg-[#FFFDF9] border border-dashed border-stone-300 rounded-xl font-mono text-[10px] text-stone-800 space-y-1.5 shadow-inner select-none">
                        <div className="text-center font-bold text-stone-950 uppercase">
                          {theme.vertical === "BARBERSHOP"
                            ? "💈 BARBER LOUNGE"
                            : theme.vertical === "CAFE"
                              ? "☕ FORE COFFEE"
                              : theme.vertical === "LAUNDRY"
                                ? "🧺 BERSIH LAUNDRY"
                                : "🛒 SUPERMARKET"}
                        </div>
                        <div className="border-b border-stone-300 border-dashed pb-1 flex justify-between text-[9px] text-stone-500">
                          <span>
                            {theme.vertical === "CAFE"
                              ? "Meja 04 • Dine In"
                              : theme.vertical === "BARBERSHOP"
                                ? "Kapster: Dimas"
                                : "No: #8821"}
                          </span>
                          <span>14:30</span>
                        </div>
                        <div className="space-y-0.5 text-[9.5px]">
                          <div className="flex justify-between">
                            <span>1x Menu Utama</span>
                            <span className="font-bold">35.000</span>
                          </div>
                          <div className="flex justify-between text-[8.5px] text-stone-500">
                            <span>+ Service Charge</span>
                            <span>2.500</span>
                          </div>
                        </div>
                        <div className="border-t border-stone-300 border-dashed pt-1 flex justify-between font-black text-[11px] text-stone-950">
                          <span>TOTAL</span>
                          <span>Rp 37.500</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div
                      className="p-4 sm:p-5 border-t flex items-center justify-between gap-2"
                      style={{
                        backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                        borderColor: "var(--theme-card-border, #f1f5f9)",
                      }}
                    >
                      <div>
                        {theme.priceMonthly === 0 ? (
                          <span className="font-extrabold text-xs text-emerald-600">
                            GRATIS
                          </span>
                        ) : (
                          <div>
                            <span
                              className="font-black text-sm block"
                              style={{ color: "var(--theme-text-primary, #0f172a)" }}
                            >
                              Rp {theme.priceMonthly.toLocaleString("id-ID")}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "var(--theme-text-secondary, #64748b)" }}
                            >
                              per bulan
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewTheme(theme)}
                          className="p-2.5 rounded-xl border font-bold text-xs transition hover:bg-slate-50 flex items-center gap-1"
                          style={{
                            borderColor: "var(--theme-card-border, #e2e8f0)",
                            color: "var(--theme-text-secondary, #64748b)",
                            backgroundColor: "var(--theme-card-bg, #ffffff)",
                          }}
                          title="Preview Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isLoading || isActive}
                          onClick={() => handlePurchaseOrApplyReceiptTheme(theme)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                          style={{
                            backgroundColor: isActive
                              ? "#10b981"
                              : "var(--theme-primary, #4f46e5)",
                            color: "#ffffff",
                          }}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Aktif</span>
                            </>
                          ) : isPurchased ? (
                            <span>Pasang Tema</span>
                          ) : (
                            <span>Beli & Pasang</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEMA UI DASHBOARD */}
      {activeTab === "UI_THEMES" && (
        initialData.uiThemes.length === 0 ? (
          <div
            className="p-12 text-center border-2 border-dashed space-y-3"
            style={{
              borderRadius: "var(--theme-radius, 1.5rem)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              backgroundColor: "var(--theme-card-bg, #ffffff)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border"
              style={{
                backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                color: "var(--theme-primary, #4f46e5)",
              }}
            >
              <Palette className="w-6 h-6" />
            </div>
            <h3
              className="font-bold text-base"
              style={{ color: "var(--theme-text-primary, #0f172a)" }}
            >
              Belum Ada Tema UI di Katalog
            </h3>
            <p
              className="text-xs max-w-md mx-auto"
              style={{ color: "var(--theme-text-secondary, #64748b)" }}
            >
              Tema antarmuka bawaan sistem aktif digunakan. Tema kustom akan muncul di sini saat dipublikasikan oleh Platform Admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialData.uiThemes.map((theme: any) => {
              const tokens = (theme.tokens as any) || {};
              const isCurrentlyActive = activeUiThemeId === theme.id;
              const isFree = theme.priceMonthly === 0;
              const isApplying = loadingId === theme.id;

              return (
                <div
                  key={theme.id}
                  className="border shadow-sm flex flex-col justify-between transition-all group overflow-hidden"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: isCurrentlyActive
                      ? "var(--theme-primary, #4f46e5)"
                      : "var(--theme-card-border, #e2e8f0)",
                    borderRadius: "var(--theme-radius, 1.5rem)",
                    boxShadow: isCurrentlyActive
                      ? "0 12px 28px -4px rgba(0,0,0,0.1)"
                      : "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
                  }}
                >
                  <div className="p-6 space-y-4">
                    {/* Theme Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                        style={{
                          backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                          borderColor: "var(--theme-card-border, #e2e8f0)",
                          color: "var(--theme-primary, #4f46e5)",
                        }}
                      >
                        {tokens.density || "THEME"}
                      </span>

                      {isCurrentlyActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3" /> Sedang Dipasang
                        </span>
                      ) : isFree ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Gratis Bawaan
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Add-on UI
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        className="font-black text-base"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        {theme.name}
                      </h3>
                      <p
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: "var(--theme-text-secondary, #64748b)" }}
                      >
                        {tokens.description || "Gaya antarmuka sistem dinamis."}
                      </p>
                    </div>

                    {/* Visual Color Palette Swatches */}
                    <div
                      className="p-3 border rounded-xl space-y-2"
                      style={{
                        backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                        borderColor: "var(--theme-card-border, #e2e8f0)",
                      }}
                    >
                      <span
                        className="text-[10px] font-bold block"
                        style={{ color: "var(--theme-text-secondary, #64748b)" }}
                      >
                        Palet Warna & Gaya:
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: tokens.primaryColor || "#4f46e5" }}
                          title="Primary Color"
                        />
                        <div
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: tokens.accentColor || "#06b6d4" }}
                          title="Accent Color"
                        />
                        <div
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: tokens.cardBg || "#ffffff" }}
                          title="Card Background"
                        />
                        <span className="text-[10px] font-mono text-slate-500 ml-1">
                          {tokens.layoutStyle || "MODERN"} • {tokens.radius || "1.5rem"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div
                    className="p-5 border-t flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                      borderColor: "var(--theme-card-border, #f1f5f9)",
                    }}
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Harga Lisensi:
                      </span>
                      <span
                        className="font-black text-sm"
                        style={{ color: "var(--theme-text-primary, #0f172a)" }}
                      >
                        {isFree
                          ? "Gratis"
                          : `Rp ${theme.priceMonthly.toLocaleString("id-ID")}/bln`}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrentlyActive || isApplying}
                      onClick={() => handleApplyUiTheme(theme.id, theme.name)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                      style={{
                        backgroundColor: isCurrentlyActive
                          ? "#10b981"
                          : "var(--theme-primary, #4f46e5)",
                      }}
                    >
                      {isApplying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isCurrentlyActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Sedang Digunakan</span>
                        </>
                      ) : (
                        <span>Terapkan Tema UI</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal Preview Tema Struk Thermal Interaktif */}

      {previewTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4 border transition-all relative"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              color: "var(--theme-text-primary, #0f172a)",
              borderRadius: "var(--theme-radius, 1.5rem)",
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                  Pratinjau Tema Struk
                </span>
                <h3 className="font-black text-sm">{previewTheme.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Paper Simulation */}
            <div className="bg-[#FFFDF9] border border-dashed border-stone-300 rounded-2xl p-5 font-mono text-stone-900 shadow-xl space-y-2.5 text-xs">
              <div className="text-center space-y-1">
                <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
                  {initialData.businessName || "POS STORE"}
                </h4>
                <p className="text-[10px] font-bold text-stone-700">
                  Cabang Utama
                </p>
                <p className="text-[10px] text-stone-600">
                  Jl. Sudirman No. 45, Jakarta
                </p>
              </div>

              <div className="border-b border-stone-400 border-dashed my-2" />

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold">
                  {previewTheme.vertical === "CAFE"
                    ? "TABLE 18"
                    : previewTheme.vertical === "BARBERSHOP"
                      ? "CHAIR #01"
                      : previewTheme.vertical === "LAUNDRY"
                        ? "RAK B-04"
                        : "NO. KASIR 01"}
                </span>
                <span className="font-black text-sm">#5078</span>
              </div>

              <div className="border-b border-stone-400 border-dashed my-2" />

              {(() => {
                const sampleItems =
                  previewTheme.sampleItems && previewTheme.sampleItems.length > 0
                    ? previewTheme.sampleItems
                    : [
                        { name: "Kopi Susu Gula Aren", qty: 1, price: 22000, mods: ["Normal Ice", "Less Sweet"] },
                        { name: "Iced Caramel Macchiato", qty: 1, price: 28000, mods: ["Extra Shot"] },
                        { name: "Butter Croissant", qty: 1, price: 24000 },
                      ];
                const totalCalculated = sampleItems.reduce(
                  (acc, item) => acc + item.qty * item.price,
                  0
                );

                return (
                  <>
                    <div className="space-y-1.5 text-[11px]">
                      {sampleItems.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between font-semibold">
                            <span>
                              {item.qty} x {item.name}
                            </span>
                            <span>Rp {item.price.toLocaleString("id-ID")}</span>
                          </div>
                          {item.mods && (
                            <div className="pl-3 text-[9px] text-stone-500">
                              {item.mods.map((m, mIdx) => (
                                <p key={mIdx}>• {m}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-b border-stone-400 border-dashed my-2" />

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal:</span>
                        <span>Rp {totalCalculated.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between font-black text-stone-950 pt-1 border-t border-stone-300">
                        <span>TOTAL:</span>
                        <span>Rp {totalCalculated.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="border-b border-stone-400 border-dashed my-2" />


              <div className="text-center text-[9px] text-stone-500 pt-1">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p className="text-[8px] opacity-70">Powered by KasirKu</p>
              </div>
            </div>

            {/* Action inside Modal */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="w-1/2 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePurchaseOrApplyReceiptTheme(previewTheme)
                }
                disabled={
                  loadingId === previewTheme.id ||
                  activeReceiptTheme === previewTheme.id
                }
                className="w-1/2 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-1"
                style={{
                  backgroundColor: "var(--theme-primary, #4f46e5)",
                }}
              >
                {loadingId === previewTheme.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : activeReceiptTheme === previewTheme.id ? (
                  "Sudah Aktif"
                ) : purchasedIds.includes(previewTheme.id) ? (
                  "Pasang Tema Ini"
                ) : (
                  "Beli & Pasang"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
