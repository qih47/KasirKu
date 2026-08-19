"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import {
  Palette,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Sliders,
  Check,
  Loader2,
  Lock,
  Sun,
  LayoutTemplate,
} from "lucide-react";
import { applyThemeAction } from "@/modules/tenant/theme-actions";
import { useDynamicTheme } from "@/components/theme/dynamic-theme-provider";

interface ThemesClientProps {
  initialData?: {
    themes: any[];
    activeThemeId: string | null;
  };
  themes?: any[];
  activeThemeId?: string | null;
}

export function ThemesClient({
  themes: propThemes,
  activeThemeId: initialActiveThemeId,
  initialData,
}: ThemesClientProps) {
  const themes = propThemes || initialData?.themes || [];
  const defaultThemeId = initialActiveThemeId ?? initialData?.activeThemeId ?? null;
  const [activeThemeId, setActiveThemeId] = useState<string | null>(defaultThemeId);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { setActivePresetId, applyCustomPackage } = useDynamicTheme();

  const handleApplyTheme = async (theme: any) => {
    setLoadingId(theme.id);
    try {
      const res = await applyThemeAction(theme.id);
      if (res.success) {
        setActiveThemeId(theme.id);
        const code = (theme.code || "").toLowerCase();
        if (code.includes("cyber") || code.includes("neon")) {
          setActivePresetId("cyberpunk");
        } else if (code.includes("cafe") || code.includes("emerald") || code.includes("bistro")) {
          setActivePresetId("cafe_emerald");
        } else if (theme.tokens?.colors || theme.tokens?.layouts) {
          applyCustomPackage({
            manifest: {
              id: theme.code,
              name: theme.name,
              type: "THEME",
              version: "1.0.0",
              author: "Marketplace",
              vertical: "GENERAL",
              priceMonthly: theme.priceMonthly,
              priceAnnual: theme.priceAnnual,
              compatibility: ">=1.0.0",
              previewUrls: [],
              tags: [],
            },
            tokens: {
              mode: theme.tokens?.layoutStyle === "LUXE" || theme.tokens?.mode === "dark" ? "dark" : "light",
              colors: {
                primary: theme.tokens?.primaryColor || "#4f46e5",
                primaryForeground: "#ffffff",
                background: theme.tokens?.mode === "dark" ? "#090d16" : "#F8FAFC",
                card: theme.tokens?.cardBg || "#ffffff",
                border: theme.tokens?.cardBorder || "#e2e8f0",
                accent: theme.tokens?.accentColor || "#06b6d4",
                success: "#10b981",
                warning: "#f59e0b",
                danger: "#ef4444",
              },
              typography: {
                fontFamily: theme.tokens?.fontFamily || "Plus Jakarta Sans, sans-serif",
                fontMono: "ui-monospace, monospace",
                baseFontSize: "14px",
                headingWeight: "bold",
              },

              effects: {
                borderRadius: theme.tokens?.radius || "1rem",
                cardBorderRadius: "1.25rem",
                buttonBorderRadius: "0.75rem",
                glassmorphism: false,
                shadowScale: "md",
              },
            },
            layouts: theme.tokens?.layouts || {
              pos: {
                cartDock: "right",
                cartWidth: "380px",
                productGridColumns: 4,
                productCardStyle: "grid_card",
                showCategoriesAs: "horizontal_pills",
                slots: [],
              },
              dashboard: {
                kpiColumns: 4,
                gap: "1.5rem",
                slots: [],
              },
            },
          });
        }



        const name = res.appliedTheme?.name || res.themeName || theme.name;
        setSuccessMsg(`Tema "${name}" berhasil diaktifkan secara instan ke seluruh sistem!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      toastError(err.message || "Gagal menerapkan tema.");
    } finally {
      setLoadingId(null);
    }
  };


  return (
    <div className="space-y-6 text-left">
      {/* Header Themes Marketplace - Clean White Surface */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-100">
            <Palette className="w-3.5 h-3.5" />
            Katalog & Add-on Tema UI
          </div>
          <h1 className="text-2xl font-black text-slate-950">
            Galeri Tema & Layout Dinamis Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pilih dan terapkan tema layout sistem (warna, kepadatan tabel, font, dan tombol kasir) yang sesuai dengan karakter bisnis Anda.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Themes Grid - Clean White Material 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((theme: any) => {
          const tokens = (theme.tokens as any) || {};
          const isApplied = activeThemeId === theme.id;
          const pColor = tokens.primaryColor || "#4f46e5";
          const aColor = tokens.accentColor || "#06b6d4";
          const layoutStyle = tokens.layoutStyle || "MODERN";
          const density = tokens.density || "NORMAL";
          const isFree = Number(theme.priceMonthly) === 0;

          return (
            <div
              key={theme.id}
              className={`p-6 sm:p-7 rounded-3xl border-2 transition flex flex-col justify-between space-y-5 ${
                isApplied
                  ? "bg-white border-indigo-600 shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-600/20"
                  : "bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              }`}
            >
              <div className="space-y-4">
                {/* Header Card */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Layout: {layoutStyle}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {density}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-950 mt-2">
                      {theme.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    {isFree ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">
                        GRATIS
                      </span>
                    ) : (
                      <span className="font-black text-sm text-slate-950">
                        Rp {Number(theme.priceMonthly).toLocaleString("id-ID")}/bln
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {theme.description || "Preset tata letak dan palet warna visual yang memukau untuk sistem POS Anda."}
                </p>

                {/* Color Swatch & Layout Preview Box */}
                <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Palet Warna</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: pColor }}
                          title={`Primary: ${pColor}`}
                        />
                        <span className="text-[11px] font-mono text-slate-500">{pColor}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: aColor }}
                          title={`Accent: ${aColor}`}
                        />
                        <span className="text-[11px] font-mono text-slate-500">{aColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Miniature UI Mock */}
                  <div
                    className="p-3.5 rounded-2xl border space-y-2.5 transition-all shadow-sm"
                    style={{
                      background: tokens.bgStyle || (layoutStyle === "LUXE" ? "#0A0E17" : "#F8FAFC"),
                      borderColor: tokens.cardBorder || "#e2e8f0",
                    }}
                  >
                    <div
                      className="p-3 rounded-xl border space-y-2 shadow-sm"
                      style={{
                        backgroundColor: tokens.cardBg || "#ffffff",
                        borderColor: tokens.cardBorder || "#e2e8f0",
                        borderRadius: tokens.radius || "0.75rem",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-16 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                        <div className="w-4 h-2.5 rounded-full bg-slate-400/30" />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div
                          className="h-6 rounded flex items-center justify-center text-[9px] font-bold"
                          style={{
                            backgroundColor: tokens.innerBoxBg || "#f8fafc",
                            color: tokens.textSecondary || "#64748b",
                          }}
                        >
                          Katalog
                        </div>
                        <div
                          className="h-6 rounded flex items-center justify-center text-[9px] font-bold"
                          style={{
                            backgroundColor: tokens.innerBoxBg || "#f8fafc",
                            color: tokens.textSecondary || "#64748b",
                          }}
                        >
                          Produk
                        </div>
                        <div
                          className="h-6 rounded text-white flex items-center justify-center text-[9px] font-bold shadow-sm"
                          style={{ backgroundColor: pColor }}
                        >
                          Bayar
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isApplied ? (
                  <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Tema Sedang Digunakan</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleApplyTheme(theme)}
                    disabled={loadingId === theme.id}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                  >

                    {loadingId === theme.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menerapkan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Terapkan Tema Ini</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TenantThemesClient = ThemesClient;
