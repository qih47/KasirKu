"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import { createThemeAction } from "@/modules/superadmin/theme-actions";
import {
  Palette,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Layers,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export function AdminThemesClient({
  initialThemes,
}: {
  initialThemes: any[];
}) {
  const [themes, setThemes] = useState(initialThemes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form input state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"DEFAULT" | "PRESET" | "CUSTOM">("PRESET");
  const [priceMonthly, setPriceMonthly] = useState<number | "">(25000);
  const [layoutStyle, setLayoutStyle] = useState("MODERN");
  const [density, setDensity] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [accentColor, setAccentColor] = useState("#06b6d4");
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif");
  const [radius, setRadius] = useState("1.25rem");

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setLoading(true);
    try {
      await createThemeAction({
        name,
        code,
        type,
        priceMonthly: Number(priceMonthly) || 0,
        tokens: {
          primaryColor,
          accentColor,
          fontFamily,
          radius,
          layoutStyle,
          density,
          description: description || `Tema ${name} dengan layout ${layoutStyle}.`,
        },
      });

      setShowAddModal(false);
      setName("");
      setCode("");
      setDescription("");
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal menambah tema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Admin Themes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin"
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Super Admin
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-6 h-6 text-indigo-600" />
            Katalog & Penjualan Tema UI SaaS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Buat preset tema & layout dinamis baru. Setiap tema yang dibuat otomatis masuk ke katalog marketplace Bisnis untuk dibeli dan diterapkan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tema Dijual</span>
        </button>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {themes.map((theme) => {
          const tokens = (theme.tokens as any) || {};
          const pColor = tokens.primaryColor || "#4f46e5";
          const aColor = tokens.accentColor || "#06b6d4";
          const layout = tokens.layoutStyle || "MODERN";

          return (
            <div
              key={theme.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {layout} &bull; {theme.type}
                  </span>
                  <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">
                    Rp {Number(theme.priceMonthly).toLocaleString("id-ID")}/bln
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {theme.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    code: {theme.code}
                  </p>
                </div>

                {tokens.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {tokens.description}
                  </p>
                )}

                {/* Color Palette Preview */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    Design Tokens:
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl shadow-sm flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: pColor }}
                      title={`Primary: ${pColor}`}
                    >
                      P
                    </div>
                    <div
                      className="w-7 h-7 rounded-xl shadow-sm flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: aColor }}
                      title={`Accent: ${aColor}`}
                    >
                      A
                    </div>
                    <div className="text-[11px] text-slate-500 ml-1 truncate">
                      {tokens.fontFamily?.split(",")[0] || "Inter"} &bull; r:{" "}
                      {tokens.radius || "1rem"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Aktif di Bisnis:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {theme._count?.tenantThemes || 0} Tenant
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Theme */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-600" /> Buat & Jual Tema Baru
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTheme} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nama Tema *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!code) {
                        setCode(
                          e.target.value.toLowerCase().replace(/\s+/g, "_")
                        );
                      }
                    }}
                    placeholder="Contoh: Emerald Bistro"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Kode Unik *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="emerald_bistro"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Layout Template</label>
                  <select
                    value={layoutStyle}
                    onChange={(e) => setLayoutStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="MODERN">MODERN (Glassmorphism)</option>
                    <option value="COMPACT">COMPACT (High Density Retail)</option>
                    <option value="LUXE">LUXE (OLED Dark Luxe)</option>
                    <option value="WARM">WARM (Bistro & Cafe)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Kepadatan (Density)</label>
                  <select
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="COMPACT">COMPACT (Rapat)</option>
                    <option value="SPACIOUS">SPACIOUS (Lega)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Harga Sewa / Bulan (Rp)</label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Border Radius</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="0.5rem">0.5rem (Tegas / Kotak)</option>
                    <option value="1rem">1.0rem (Sedang)</option>
                    <option value="1.25rem">1.25rem (Membulat Modern)</option>
                    <option value="1.75rem">1.75rem (Ekstra Membulat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Deskripsi Tema</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan vibe dan keunggulan tema..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Warna Utama (Primary)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <span className="font-mono text-[11px]">{primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Warna Aksen (Accent)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    />
                    <span className="font-mono text-[11px]">{accentColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Terbitkan Tema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
