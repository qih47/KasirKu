"use client";

import { useState } from "react";
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

interface ThemesClientProps {
  themes: any[];
  activeThemeId: string | null;
}

export function ThemesClient({ themes, activeThemeId: initialActiveThemeId }: ThemesClientProps) {
  const [activeThemeId, setActiveThemeId] = useState<string | null>(initialActiveThemeId);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApplyTheme = async (themeId: string) => {
    setLoadingId(themeId);
    try {
      const res = await applyThemeAction(themeId);
      if (res.success) {
        setActiveThemeId(themeId);
        setSuccessMsg(`Tema "${res.themeName}" berhasil diterapkan ke sistem kasir Anda!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || "Gagal menerapkan tema.");
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
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-2.5 rounded" style={{ backgroundColor: pColor }} />
                      <div className="w-4 h-2.5 rounded bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <div className="h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Katalog
                      </div>
                      <div className="h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        Produk
                      </div>
                      <div
                        className="h-6 rounded text-white flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: pColor }}
                      >
                        Bayar
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
                    onClick={() => handleApplyTheme(theme.id)}
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
