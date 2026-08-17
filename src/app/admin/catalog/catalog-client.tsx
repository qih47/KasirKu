"use client";

import { useState } from "react";
import {
  updateLicenseTierAction,
  updatePluginAction,
  updateThemeAction,
} from "@/modules/superadmin/actions";
import {
  Tags,
  CheckCircle2,
  Loader2,
  Save,
  Calculator,
  ShieldCheck,
  Layers,
  Palette,
  Sparkles,
} from "lucide-react";

export function CatalogClient({
  initialLicenses,
  initialPlugins,
  initialThemes,
}: {
  initialLicenses: any[];
  initialPlugins: any[];
  initialThemes: any[];
}) {
  const [tab, setTab] = useState<"LICENSES" | "PLUGINS" | "THEMES">("LICENSES");
  const [licenses, setLicenses] = useState(initialLicenses);
  const [plugins, setPlugins] = useState(initialPlugins);
  const [themes, setThemes] = useState(initialThemes);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // License Handlers
  const handleLicenseChange = (id: string, field: string, value: any) => {
    setLicenses((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleCalcAnnualLicense = (id: string) => {
    const item = licenses.find((l) => l.id === id);
    if (!item) return;
    const monthly = Number(item.priceMonthly) || 0;
    const annual = Math.round(monthly * 12 * 0.83); // 17% diskon
    handleLicenseChange(id, "priceAnnual", annual);
  };

  const handleSaveLicense = async (l: any) => {
    setLoadingId(l.id);
    try {
      await updateLicenseTierAction(l.id, {
        name: l.name,
        priceMonthly: Number(l.priceMonthly),
        priceAnnual: Number(l.priceAnnual),
        outletLimit: l.outletLimit ? Number(l.outletLimit) : null,
        kasirLimitPerOutlet: l.kasirLimitPerOutlet
          ? Number(l.kasirLimitPerOutlet)
          : null,
      });
      setSuccessMsg(`Lisensi "${l.name}" berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan lisensi.");
    } finally {
      setLoadingId(null);
    }
  };

  // Plugin Handlers
  const handlePluginChange = (id: string, field: string, value: any) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleCalcAnnualPlugin = (id: string) => {
    const item = plugins.find((p) => p.id === id);
    if (!item) return;
    const monthly = Number(item.priceMonthly) || 0;
    const annual = Math.round(monthly * 12 * 0.83);
    handlePluginChange(id, "priceAnnual", annual);
  };

  const handleSavePlugin = async (p: any) => {
    setLoadingId(p.id);
    try {
      await updatePluginAction(p.id, {
        name: p.name,
        priceMonthly: Number(p.priceMonthly),
        priceAnnual: Number(p.priceAnnual),
        isActive: Boolean(p.isActive),
      });
      setSuccessMsg(`Plugin "${p.name}" berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan plugin.");
    } finally {
      setLoadingId(null);
    }
  };

  // Theme Handlers
  const handleThemeChange = (id: string, field: string, value: any) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSaveTheme = async (t: any) => {
    setLoadingId(t.id);
    try {
      await updateThemeAction(t.id, {
        name: t.name,
        priceMonthly: Number(t.priceMonthly),
        isActive: Boolean(t.isActive),
      });
      setSuccessMsg(`Tema "${t.name}" berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan tema.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setTab("LICENSES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            tab === "LICENSES"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Lisensi Kapasitas (Core)
        </button>

        <button
          onClick={() => setTab("PLUGINS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            tab === "PLUGINS"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Plugin Vertikal
        </button>

        <button
          onClick={() => setTab("THEMES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            tab === "THEMES"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Palette className="w-4 h-4" />
          Tema UI Add-on
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. LISENSI KAPASITAS */}
      {tab === "LICENSES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {licenses.map((l) => {
            const isLoading = loadingId === l.id;
            return (
              <div
                key={l.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Code: {l.code}
                    </span>
                    <span className="text-xs text-indigo-400 font-semibold">
                      Lisensi Tier
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Nama Lisensi
                      </label>
                      <input
                        type="text"
                        value={l.name}
                        onChange={(e) =>
                          handleLicenseChange(l.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold uppercase text-slate-400">
                          Harga Bulanan (Rp)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCalcAnnualLicense(l.id)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                          title="Hitung harga tahunan dengan diskon 17%"
                        >
                          <Calculator className="w-3 h-3" />
                          Auto Diskon 17%
                        </button>
                      </div>
                      <input
                        type="number"
                        value={l.priceMonthly}
                        onChange={(e) =>
                          handleLicenseChange(
                            l.id,
                            "priceMonthly",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Harga Tahunan (Rp)
                      </label>
                      <input
                        type="number"
                        value={l.priceAnnual}
                        onChange={(e) =>
                          handleLicenseChange(
                            l.id,
                            "priceAnnual",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Limit Outlet
                        </label>
                        <input
                          type="number"
                          placeholder="Unlimited (null)"
                          value={l.outletLimit ?? ""}
                          onChange={(e) =>
                            handleLicenseChange(
                              l.id,
                              "outletLimit",
                              e.target.value || null
                            )
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Limit Kasir/Outlet
                        </label>
                        <input
                          type="number"
                          placeholder="Unlimited"
                          value={l.kasirLimitPerOutlet ?? ""}
                          onChange={(e) =>
                            handleLicenseChange(
                              l.id,
                              "kasirLimitPerOutlet",
                              e.target.value || null
                            )
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSaveLicense(l)}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Simpan Lisensi
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. MODUL PLUGIN VERTIKAL */}
      {tab === "PLUGINS" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plugins.map((p) => {
            const isLoading = loadingId === p.id;
            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Code: {p.code}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        onChange={(e) =>
                          handlePluginChange(p.id, "isActive", e.target.checked)
                        }
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-400 font-medium">
                        Aktif
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Nama Plugin
                      </label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) =>
                          handlePluginChange(p.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold uppercase text-slate-400">
                          Harga Bulanan (Rp)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCalcAnnualPlugin(p.id)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                          title="Hitung harga tahunan diskon 17%"
                        >
                          <Calculator className="w-3 h-3" />
                          -17%
                        </button>
                      </div>
                      <input
                        type="number"
                        value={p.priceMonthly}
                        onChange={(e) =>
                          handlePluginChange(
                            p.id,
                            "priceMonthly",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Harga Tahunan (Rp)
                      </label>
                      <input
                        type="number"
                        value={p.priceAnnual}
                        onChange={(e) =>
                          handlePluginChange(
                            p.id,
                            "priceAnnual",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSavePlugin(p)}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Simpan Plugin
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. TEMA UI */}
      {tab === "THEMES" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {themes.map((t) => {
            const isLoading = loadingId === t.id;
            return (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Type: {t.type}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={t.isActive}
                        onChange={(e) =>
                          handleThemeChange(t.id, "isActive", e.target.checked)
                        }
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                      />
                      <span className="text-[11px] text-slate-400 font-medium">
                        Aktif
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Nama Tema
                      </label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) =>
                          handleThemeChange(t.id, "name", e.target.value)
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        Biaya Tambahan / Bulan (Rp)
                      </label>
                      <input
                        type="number"
                        value={t.priceMonthly}
                        onChange={(e) =>
                          handleThemeChange(
                            t.id,
                            "priceMonthly",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSaveTheme(t)}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Simpan Tema
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
