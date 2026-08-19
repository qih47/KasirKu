"use client";

import { useState } from "react";
import { toastSuccess, toastError } from "@/lib/swal";
import { useSearchParams } from "next/navigation";
import {
  updateLicenseTierAction,
  updatePluginAction,
  updateThemeAction,
} from "@/modules/superadmin/actions";
import { createThemeAction } from "@/modules/superadmin/theme-actions";
import { importPluginPackageAction } from "@/modules/superadmin/plugin-package-actions";
import { validatePluginPackage } from "@/types/plugin-package";
import {
  DEFAULT_DURATION_SETTINGS,
  DurationSettingItem,
  calculateDurationPrice,
} from "@/types/subscription-duration";
import { updateSubscriptionDurationSettingsAction } from "@/modules/superadmin/duration-actions";
import {
  FeatureEntitlement,
  CATEGORY_LABELS,
  FeatureCategory,
} from "@/modules/features/types";
import { DEFAULT_FEATURE_ENTITLEMENTS } from "@/modules/features/feature-registry";
import { updateFeatureEntitlementsMatrixAction } from "@/modules/features/feature-actions";
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
  Printer,
  Plus,
  X,
  FileText,
  Layout,
  Check,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Store,
  ExternalLink,
  Upload,
  Download,
  PackageCheck,
  AlertCircle,
  FileCode,
  Box,
  Clock,
  Percent,
  Sliders,
  Lock,
} from "lucide-react";


export function CatalogClient({
  initialLicenses,
  initialPlugins,
  initialThemes,
  initialDurationSettings,
  initialFeatureEntitlements,
}: {
  initialLicenses: any[];
  initialPlugins: any[];
  initialThemes: any[];
  initialDurationSettings?: DurationSettingItem[];
  initialFeatureEntitlements?: FeatureEntitlement[];
}) {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get("tab") as any) || "LICENSES";
  const [tab, setTab] = useState<"LICENSES" | "PLUGINS" | "THEMES" | "POS_LAYOUTS" | "RECEIPTS" | "DURATIONS" | "FEATURE_MATRIX">(defaultTab);


  const [licenses, setLicenses] = useState(initialLicenses);
  const [plugins, setPlugins] = useState(initialPlugins);
  const [themes, setThemes] = useState(initialThemes);
  const [durationSettings, setDurationSettings] = useState<DurationSettingItem[]>(
    initialDurationSettings && initialDurationSettings.length > 0
      ? initialDurationSettings
      : DEFAULT_DURATION_SETTINGS
  );
  const [durationLoading, setDurationLoading] = useState(false);

  // Dynamic Feature Entitlements Matrix State
  const [featureEntitlements, setFeatureEntitlements] = useState<FeatureEntitlement[]>(
    initialFeatureEntitlements && initialFeatureEntitlements.length > 0
      ? initialFeatureEntitlements
      : DEFAULT_FEATURE_ENTITLEMENTS
  );
  const [featureFilterCategory, setFeatureFilterCategory] = useState<string>("ALL");
  const [featureLoading, setFeatureLoading] = useState(false);

  const handleSaveFeatureMatrix = async () => {
    setFeatureLoading(true);
    try {
      await updateFeatureEntitlementsMatrixAction(featureEntitlements);
      toastSuccess("Matriks fitur berhasil disimpan!");
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan matriks fitur.");
    } finally {
      setFeatureLoading(false);
    }
  };


  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Create Theme
  const [showAddThemeModal, setShowAddThemeModal] = useState(false);
  const [themeModalLoading, setThemeModalLoading] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeCode, setNewThemeCode] = useState("");
  const [newThemeType, setNewThemeType] = useState<"DEFAULT" | "PRESET" | "CUSTOM">("PRESET");
  const [newThemePrice, setNewThemePrice] = useState<number | "">(25000);
  const [newThemePrimary, setNewThemePrimary] = useState("#4f46e5");
  const [newThemeAccent, setNewThemeAccent] = useState("#06b6d4");
  const [newThemeRadius, setNewThemeRadius] = useState("1rem");
  const [newThemeLayout, setNewThemeLayout] = useState("MODERN");
  const [newThemeDesc, setNewThemeDesc] = useState("");

  // Modal Package Importer (Plugin / Theme / Receipt / POS Layout JSON)
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCategory, setImportCategory] = useState<"THEME" | "POS_LAYOUT" | "RECEIPT" | "PLUGIN">("THEME");
  const [importJsonText, setImportJsonText] = useState("");
  const [customMonthly, setCustomMonthly] = useState<string>("");
  const [customAnnual, setCustomAnnual] = useState<string>("");
  const [validationPreview, setValidationPreview] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const openImporter = (cat: "THEME" | "POS_LAYOUT" | "RECEIPT" | "PLUGIN") => {
    setImportCategory(cat);
    setShowImportModal(true);
    setImportError(null);
    setValidationPreview(null);
    setImportJsonText("");
    setCustomMonthly("");
    setCustomAnnual("");
  };


  const handleValidateJson = (text: string) => {
    setImportJsonText(text);
    setImportError(null);
    if (!text.trim()) {
      setValidationPreview(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const res = validatePluginPackage(parsed);
      if (res.success && res.package) {
        setValidationPreview(res.package);
        setCustomMonthly(String(res.package.manifest.priceMonthly ?? 25000));
        setCustomAnnual(String(res.package.manifest.priceAnnual ?? 250000));
      } else {
        setValidationPreview(null);
        setImportError(res.error || "Format paket tidak memenuhi spesifikasi Qassa.");
      }
    } catch (err: any) {
      setValidationPreview(null);
      setImportError("JSON tidak valid: " + err.message);
    }
  };

  const handleExecuteImport = async () => {
    if (!importJsonText.trim()) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const res = await importPluginPackageAction({
        jsonContent: importJsonText,
        customPriceMonthly: customMonthly ? Number(customMonthly) : undefined,
        customPriceAnnual: customAnnual ? Number(customAnnual) : undefined,
      });

      if (res.success && res.item) {
        if (res.type === "THEME") {
          setThemes((prev) => {
            const exists = prev.some((t) => t.id === res.item.id);
            if (exists) {
              return prev.map((t) => (t.id === res.item.id ? res.item : t));
            }
            return [res.item, ...prev];
          });
          setTab("THEMES");
        } else if (res.type === "PLUGIN") {
          setPlugins((prev) => {
            const exists = prev.some((p) => p.id === res.item.id);
            if (exists) {
              return prev.map((p) => (p.id === res.item.id ? res.item : p));
            }
            return [res.item, ...prev];
          });
          setTab("PLUGINS");
        }
        setShowImportModal(false);
        setImportJsonText("");
        setValidationPreview(null);
        setSuccessMsg(`Paket "${res.manifest?.name || "Plugin"}" (${res.type}) berhasil dipublikasikan ke Katalog Qassa!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setImportError(res.error || "Gagal mempublikasikan paket plugin.");
      }
    } catch (err: any) {
      setImportError(err.message || "Gagal memproses import.");
    } finally {
      setImportLoading(false);
    }
  };



  // Discount state per item id (e.g. 17%, 20%, 15%)
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  const getDiscount = (id: string, defaultVal: number = 17) => {
    return discounts[id] !== undefined ? discounts[id] : defaultVal;
  };

  const setDiscount = (id: string, val: number) => {
    setDiscounts((prev) => ({ ...prev, [id]: val }));
  };

  // License Handlers
  const handleLicenseChange = (id: string, field: string, value: any) => {
    setLicenses((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleCalcAnnualLicense = (id: string) => {
    const item = licenses.find((l) => l.id === id);
    if (!item) return;
    const disc = getDiscount(id, 17);
    const monthly = Number(item.priceMonthly) || 0;
    const annual = Math.round(monthly * 12 * ((100 - disc) / 100));
    handleLicenseChange(id, "priceAnnual", annual);
  };

  const handleSaveLicense = async (l: any) => {
    setLoadingId(l.id);
    try {
      await updateLicenseTierAction(l.id, {
        name: l.name,
        priceMonthly: Number(l.priceMonthly),
        priceAnnual: Number(l.priceAnnual),
        outletLimit: l.outletLimit !== null && l.outletLimit !== "" ? Number(l.outletLimit) : null,
        kasirLimitPerOutlet:
          l.kasirLimitPerOutlet !== null && l.kasirLimitPerOutlet !== ""
            ? Number(l.kasirLimitPerOutlet)
            : null,
      });
      setSuccessMsg(`Lisensi "${l.name}" berhasil disimpan!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan lisensi.");
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
    const disc = getDiscount(id, 17);
    const monthly = Number(item.priceMonthly) || 0;
    const annual = Math.round(monthly * 12 * ((100 - disc) / 100));
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
      toastError(err.message || "Gagal menyimpan plugin.");
    } finally {
      setLoadingId(null);
    }
  };

  // Duration Discount Settings Handler
  const handleSaveDurationSettings = async () => {
    setDurationLoading(true);
    try {
      const res = await updateSubscriptionDurationSettingsAction(durationSettings);
      if (res.success) {
        setDurationSettings(res.settings);
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan pengaturan diskon durasi.");
    } finally {
      setDurationLoading(false);
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
      toastError(err.message || "Gagal menyimpan tema.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim() || !newThemeCode.trim()) return;

    setThemeModalLoading(true);
    try {
      const res = await createThemeAction({
        name: newThemeName,
        code: newThemeCode,
        type: newThemeType,
        priceMonthly: Number(newThemePrice) || 0,
        tokens: {
          primaryColor: newThemePrimary,
          accentColor: newThemeAccent,
          fontFamily: "Inter, sans-serif",
          radius: newThemeRadius,
          layoutStyle: newThemeLayout,
          density: "NORMAL",
          description: newThemeDesc || `Tema ${newThemeName} eksklusif Qassa.`,
        },
      });

      if (res.success && res.theme) {
        setThemes((prev) => [...prev, res.theme]);
        setShowAddThemeModal(false);
        setNewThemeName("");
        setNewThemeCode("");
        setNewThemeDesc("");
        setSuccessMsg(`Tema baru "${newThemeName}" berhasil diterbitkan ke katalog!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      toastError(err.message || "Gagal membuat tema baru.");
    } finally {
      setThemeModalLoading(false);
    }
  };

  // Dynamic DB-driven lists (Empty by default until Super Admin imports JSON packages)
  const themesList = themes.filter(
    (t) =>
      (t.tokens as any)?.packageType !== "POS_LAYOUT" &&
      (t.tokens as any)?.packageType !== "RECEIPT_PRESET" &&
      !t.code?.startsWith("pos-") &&
      !t.code?.startsWith("receipt-")
  );

  const posLayoutsList = themes.filter(
    (t) =>
      (t.tokens as any)?.packageType === "POS_LAYOUT" ||
      t.code?.startsWith("pos-") ||
      Boolean((t.tokens as any)?.layouts?.pos?.cartDock)
  );

  const receiptsList = themes.filter(
    (t) =>
      (t.tokens as any)?.packageType === "RECEIPT_PRESET" ||
      t.code?.startsWith("receipt-") ||
      Boolean((t.tokens as any)?.receipt?.paperWidth) ||
      Boolean((t.tokens as any)?.receipt?.blocks?.length)
  );


  return (
    <div className="space-y-6">
      {/* Top Action Bar with Tab Navigation & Package Importer */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
          <button
            onClick={() => setTab("LICENSES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "LICENSES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Lisensi Kapasitas (Core)</span>
          </button>

          <button
            onClick={() => setTab("PLUGINS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "PLUGINS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Plugin Vertikal &amp; Modul</span>
          </button>

          <button
            onClick={() => setTab("THEMES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "THEMES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Tema &amp; Tampilan UI</span>
          </button>

          <button
            onClick={() => setTab("POS_LAYOUTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "POS_LAYOUTS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Tata Letak Layar POS</span>
          </button>

          <button
            onClick={() => setTab("RECEIPTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "RECEIPTS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Studio &amp; Template Struk</span>
          </button>

          <button
            onClick={() => setTab("DURATIONS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "DURATIONS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Diskon Durasi Langganan ⚙️</span>
          </button>

          <button
            onClick={() => setTab("FEATURE_MATRIX")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "FEATURE_MATRIX"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriks Hak Akses Fitur Tier 🛡️</span>
          </button>
        </div>
      </div>



      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}


      {/* ======================================================== */}
      {/* 1. LISENSI KAPASITAS (CORE) */}
      {/* ======================================================== */}
      {tab === "LICENSES" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Konfigurasi Harga &amp; Kuota Lisensi Platform</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Perubahan harga dan limit cabang/kasir langsung berlaku untuk tagihan tenant baru dan perpanjangan langganan.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {licenses.length} Paket Lisensi
            </span>
          </div>

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
                      <span className="text-xs text-indigo-400 font-semibold">Lisensi Tier</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Nama Lisensi
                        </label>
                        <input
                          type="text"
                          value={l.name}
                          onChange={(e) => handleLicenseChange(l.id, "name", e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Harga Bulanan & Input Diskon Tahunan Custom */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                            Harga Bulanan (Rp)
                          </label>
                          <input
                            type="number"
                            value={l.priceMonthly}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleLicenseChange(l.id, "priceMonthly", val);
                              const disc = getDiscount(l.id, 17);
                              const annual = Math.round((Number(val) || 0) * 12 * ((100 - disc) / 100));
                              handleLicenseChange(l.id, "priceAnnual", annual);
                            }}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase text-slate-400">
                              Diskon Tahunan
                            </label>
                            <span className="text-[10px] text-indigo-400 font-bold">
                              {getDiscount(l.id, 17)}% Off
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={getDiscount(l.id, 17)}
                              onChange={(e) => {
                                const disc = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                setDiscount(l.id, disc);
                                const monthly = Number(l.priceMonthly) || 0;
                                const annual = Math.round(monthly * 12 * ((100 - disc) / 100));
                                handleLicenseChange(l.id, "priceAnnual", annual);
                              }}
                              placeholder="17"
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center font-bold"
                            />
                            <span className="text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold uppercase text-slate-400">
                            Harga Tahunan (Rp)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const disc = getDiscount(l.id, 17);
                              const monthly = Number(l.priceMonthly) || 0;
                              const annual = Math.round(monthly * 12 * ((100 - disc) / 100));
                              handleLicenseChange(l.id, "priceAnnual", annual);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                            title="Hitung ulang harga tahunan dengan diskon yang diset di atas"
                          >
                            <Calculator className="w-3 h-3" />
                            <span>Hitung Diskon ({getDiscount(l.id, 17)}%)</span>
                          </button>
                        </div>
                        <input
                          type="number"
                          value={l.priceAnnual}
                          onChange={(e) => handleLicenseChange(l.id, "priceAnnual", e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-indigo-300"
                        />
                      </div>


                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Limit Outlet
                          </label>
                          <input
                            type="text"
                            value={l.outletLimit === null ? "" : l.outletLimit}
                            placeholder="Unlimited (null)"
                            onChange={(e) =>
                              handleLicenseChange(
                                l.id,
                                "outletLimit",
                                e.target.value === "" ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Limit Kasir/Outlet
                          </label>
                          <input
                            type="text"
                            value={l.kasirLimitPerOutlet === null ? "" : l.kasirLimitPerOutlet}
                            placeholder="Unlimited"
                            onChange={(e) =>
                              handleLicenseChange(
                                l.id,
                                "kasirLimitPerOutlet",
                                e.target.value === "" ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveLicense(l)}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan Lisensi</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PLUGIN VERTIKAL & MODUL BISNIS */}
      {/* ======================================================== */}
      {tab === "PLUGINS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">Katalog Modul &amp; Plugin Vertikal Bisnis</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Modul add-on yang bisa dibeli tenant untuk membuka alur kerja spesifik industri.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {plugins.length} Modul Aktif
              </span>
              <button
                onClick={() => openImporter("PLUGIN")}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5 text-amber-300" />
                <span>📦 Import Plugin (JSON)</span>
              </button>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Plugin Code: {p.code}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[11px] text-slate-400">Aktif Dijual:</span>
                        <input
                          type="checkbox"
                          checked={p.isActive}
                          onChange={(e) => handlePluginChange(p.id, "isActive", e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Nama Modul / Plugin
                        </label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handlePluginChange(p.id, "name", e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Deskripsi Fitur
                        </label>
                        <textarea
                          rows={2}
                          value={p.description || ""}
                          onChange={(e) => handlePluginChange(p.id, "description", e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Harga Bulanan & Input Diskon Tahunan Plugin */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                            Bulan (Rp)
                          </label>
                          <input
                            type="number"
                            value={p.priceMonthly}
                            onChange={(e) => {
                              const val = e.target.value;
                              handlePluginChange(p.id, "priceMonthly", val);
                              const disc = getDiscount(p.id, 17);
                              const annual = Math.round((Number(val) || 0) * 12 * ((100 - disc) / 100));
                              handlePluginChange(p.id, "priceAnnual", annual);
                            }}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold uppercase text-slate-400">
                              Diskon (%)
                            </label>
                            <span className="text-[10px] text-indigo-400 font-bold">
                              {getDiscount(p.id, 17)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={getDiscount(p.id, 17)}
                              onChange={(e) => {
                                const disc = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                setDiscount(p.id, disc);
                                const monthly = Number(p.priceMonthly) || 0;
                                const annual = Math.round(monthly * 12 * ((100 - disc) / 100));
                                handlePluginChange(p.id, "priceAnnual", annual);
                              }}
                              placeholder="17"
                              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center font-bold"
                            />
                            <span className="text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold uppercase text-slate-400">
                            Harga Tahunan (Rp)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const disc = getDiscount(p.id, 17);
                              const monthly = Number(p.priceMonthly) || 0;
                              const annual = Math.round(monthly * 12 * ((100 - disc) / 100));
                              handlePluginChange(p.id, "priceAnnual", annual);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                            title="Hitung ulang harga tahunan dengan diskon"
                          >
                            <Calculator className="w-3 h-3" />
                            <span>Hitung ({getDiscount(p.id, 17)}%)</span>
                          </button>
                        </div>
                        <input
                          type="number"
                          value={p.priceAnnual}
                          onChange={(e) => handlePluginChange(p.id, "priceAnnual", e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-indigo-300"
                        />
                      </div>

                    </div>
                  </div>

                  <button
                    onClick={() => handleSavePlugin(p)}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan Plugin</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TEMA & TAMPILAN UI SAAS (MERGED) */}
      {/* ======================================================== */}
      {tab === "THEMES" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">Katalog Preset Tema &amp; Design Tokens UI</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Kelola tema visual POS. Setiap preset tema yang dibuat otomatis muncul di toko untuk dibeli atau diterapkan.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openImporter("THEME")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Box className="w-4 h-4 text-amber-300" />
                <span>📦 Import Tema UI (JSON)</span>
              </button>
              <button
                onClick={() => setShowAddThemeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Manual</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themesList.map((t) => {
              const isLoading = loadingId === t.id;
              const tokens = (t.tokens as any) || {};
              const primary = tokens.primaryColor || tokens.colors?.primary || "#4F46E5";
              const accent = tokens.accentColor || tokens.colors?.accent || "#06B6D4";

              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm space-y-4 hover:border-slate-700 transition"
                >
                  <div>
                    {/* Color Preview Swatch */}
                    <div
                      className="h-16 rounded-xl mb-3 flex items-center justify-between px-4 border border-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${primary}, ${accent})`,
                      }}
                    >
                      <span className="text-xs font-black text-white drop-shadow">
                        {t.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/20">
                        {t.type}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                          Nama Tema
                        </label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => handleThemeChange(t.id, "name", e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                            Kode Tema
                          </label>
                          <span className="block px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                            {t.code}
                          </span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                            Harga (Rp/bln)
                          </label>
                          <input
                            type="number"
                            value={Number(t.priceMonthly)}
                            onChange={(e) =>
                              handleThemeChange(t.id, "priceMonthly", Number(e.target.value))
                            }
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Token details badge */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Warna Primer:</span>
                          <span className="flex items-center gap-1 font-mono text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: primary }} />
                            {primary}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Warna Aksen:</span>
                          <span className="flex items-center gap-1 font-mono text-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: accent }} />
                            {accent}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveTheme(t)}
                    disabled={isLoading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Modal Tambah Tema Baru */}
          {showAddThemeModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl animate-scaleUp">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Palette className="w-5 h-5 text-indigo-400" />
                    <span>Buat Preset Tema UI Baru</span>
                  </div>
                  <button
                    onClick={() => setShowAddThemeModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateThemeSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Tema <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Midnight Velvet"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kode Unik <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="midnight-velvet"
                        value={newThemeCode}
                        onChange={(e) => setNewThemeCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Harga (Rp/bulan)
                      </label>
                      <input
                        type="number"
                        value={newThemePrice}
                        onChange={(e) =>
                          setNewThemePrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Tipe Tema
                      </label>
                      <select
                        value={newThemeType}
                        onChange={(e) => setNewThemeType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="PRESET">PRESET (Siap Pakai)</option>
                        <option value="CUSTOM">CUSTOM (Premium)</option>
                        <option value="DEFAULT">DEFAULT</option>
                      </select>
                    </div>
                  </div>

                  {/* Design Tokens Picker */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                      Design Tokens &amp; Palet Warna:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Warna Primer</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newThemePrimary}
                            onChange={(e) => setNewThemePrimary(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-slate-200">{newThemePrimary}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Warna Aksen</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newThemeAccent}
                            onChange={(e) => setNewThemeAccent(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-slate-200">{newThemeAccent}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Deskripsi Singkat
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Jelaskan daya tarik tema ini untuk merchant..."
                      value={newThemeDesc}
                      onChange={(e) => setNewThemeDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddThemeModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={themeModalLoading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {themeModalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Terbitkan Tema</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TATA LETAK LAYAR POS (POS SCREEN LAYOUTS) */}
      {/* ======================================================== */}
      {tab === "POS_LAYOUTS" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Layout className="w-4 h-4" />
                <span>Qassa POS Dynamic Screen Layout Engine</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Katalog Tata Letak Layar Kasir Dinamis
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Tata letak layar kasir dinamis dari database platform hasil impor paket JSON.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {posLayoutsList.length} Layout Live di Database
              </span>
              <button
                onClick={() => openImporter("POS_LAYOUT")}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
              >
                <Box className="w-4 h-4 text-purple-200" />
                <span>📦 Import Layout POS (JSON)</span>
              </button>
            </div>
          </div>

          {posLayoutsList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border-2 border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
                <Layout className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Belum Ada Blueprint Layout POS di Database</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Katalog saat ini bersih dan tidak memiliki data hardcode. Gunakan tombol import di atas untuk mempublikasikan paket JSON layout kasir baru.
              </p>
              <button
                onClick={() => openImporter("POS_LAYOUT")}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
              >
                <Box className="w-4 h-4" />
                <span>Import Layout POS Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posLayoutsList.map((item) => {
                const tokens = (item.tokens as any) || {};
                const pos = tokens.layouts?.pos || {};
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                          <Layout className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          {tokens.vertical || "UNIVERSAL"}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {tokens.description || `Dock: ${pos.cartDock || "right"} • Grid: ${pos.productGridColumns || 4} kolom`}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span className="font-mono text-slate-400">{item.code}</span>
                      <span className="text-emerald-400 font-bold">
                        {Number(item.priceMonthly) === 0 ? "Gratis" : `Rp ${Number(item.priceMonthly).toLocaleString("id-ID")}/bln`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. STUDIO & TEMPLATE STRUK THERMAL (RECEIPTS) */}
      {/* ======================================================== */}
      {tab === "RECEIPTS" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Printer className="w-4 h-4" />
                <span>Qassa Thermal Receipt Studio (58mm / 80mm)</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Katalog Template &amp; Blueprint Struk Thermal
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Template struk thermal dari database platform hasil impor paket JSON.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {receiptsList.length} Struk Live di Database
              </span>
              <button
                onClick={() => openImporter("RECEIPT")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                <Box className="w-4 h-4 text-cyan-200" />
                <span>📦 Import Struk Thermal (JSON)</span>
              </button>
              <a
                href="/dashboard/receipt-designer"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka Designer</span>
              </a>
            </div>
          </div>

          {receiptsList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border-2 border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Belum Ada Blueprint Struk Thermal di Database</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Katalog saat ini bersih dan tidak memiliki data hardcode. Gunakan tombol import di atas untuk mempublikasikan template struk thermal 58mm/80mm baru.
              </p>
              <button
                onClick={() => openImporter("RECEIPT")}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
              >
                <Box className="w-4 h-4" />
                <span>Import Struk Thermal Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {receiptsList.map((item) => {
                const tokens = (item.tokens as any) || {};
                const rc = tokens.receipt || {};
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-4 group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-indigo-500/30">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {rc.paperWidth || "80mm"}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {tokens.description || `Blueprint ${rc.paperWidth || "80mm"} dengan ${rc.blocks?.length || 0} blok komponen.`}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        Vertikal: {tokens.vertical || "GENERAL"}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {Number(item.priceMonthly) === 0 ? "Gratis" : `Rp ${Number(item.priceMonthly).toLocaleString("id-ID")}/bln`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PENGATURAN DISKON DURASI LANGGANAN (1 BLN - 3 THN) */}
      {/* ======================================================== */}
      {tab === "DURATIONS" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Percent className="w-4 h-4" />
                </span>
                <p className="font-bold text-white text-sm">Pengaturan Diskon Durasi Berlangganan (Dinamis)</p>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tentukan persentase potongan harga untuk langganan <strong>1 Bulan, 3 Bulan, 6 Bulan, 1 Tahun, 2 Tahun, dan 3 Tahun</strong>.
                Perubahan ini langsung otomatis ter-update di <strong>Landing Page</strong> dan <strong>Dashboard Langganan Toko</strong>.
              </p>
            </div>
            <button
              onClick={handleSaveDurationSettings}
              disabled={durationLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 flex-shrink-0"
            >
              {durationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke DB...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Diskon</span>
                </>
              )}
            </button>
          </div>

          {/* Cards for each duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {durationSettings.map((dur, idx) => (
              <div
                key={dur.key}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                  dur.isActive
                    ? "bg-slate-900/90 border-slate-800 shadow-sm hover:border-slate-700"
                    : "bg-slate-950/60 border-slate-900 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 font-black text-xs flex items-center justify-center font-mono">
                        {dur.key}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{dur.label}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Durasi {dur.months} Bulan ({dur.months * 30} Hari)
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dur.isActive}
                        onChange={(e) => {
                          const updated = [...durationSettings];
                          updated[idx].isActive = e.target.checked;
                          setDurationSettings(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Potongan Diskon (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={dur.discountPercent}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                          const updated = [...durationSettings];
                          updated[idx].discountPercent = val;
                          updated[idx].badgeText = val > 0 ? `Hemat ${val}%` : "Standar";
                          setDurationSettings(updated);
                        }}
                        className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-black text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Badge Promo:</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 text-[10px]">
                      {dur.discountPercent > 0 ? `Hemat ${dur.discountPercent}%` : "Harga Normal"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SIMULASI LIVE KALKULATOR HARGA */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  Simulasi Live Perhitungan Harga per Durasi
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tabel berikut mengkalkulasi secara instan harga lisensi dan plugin sesuai persentase diskon yang diatur di atas.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Diskon %</th>
                    <th className="py-3 px-4">Lisensi Basic (Rp 150rb/bln)</th>
                    <th className="py-3 px-4">Lisensi Pro (Rp 500rb/bln)</th>
                    <th className="py-3 px-4">Modul Cafe (Rp 100rb/bln)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {durationSettings.map((dur) => {
                    const basicCalc = calculateDurationPrice(150000, dur);
                    const proCalc = calculateDurationPrice(500000, dur);
                    const cafeCalc = calculateDurationPrice(100000, dur);

                    return (
                      <tr key={dur.key} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-white">
                          <span className="text-indigo-400 font-mono mr-1.5">{dur.key}</span>
                          {dur.label}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-emerald-400">
                          {dur.discountPercent > 0 ? `${dur.discountPercent}%` : "0% (Normal)"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">
                            Rp {basicCalc.totalPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            (Rp {basicCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat Rp {basicCalc.savedAmount.toLocaleString("id-ID")})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">
                            Rp {proCalc.totalPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            (Rp {proCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat Rp {proCalc.savedAmount.toLocaleString("id-ID")})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">
                            Rp {cafeCalc.totalPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            (Rp {cafeCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat Rp {cafeCalc.savedAmount.toLocaleString("id-ID")})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {dur.isActive ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                              Nonaktif
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MATRIKS HAK AKSES FITUR TIER & VERTIKAL (DYNAMIC)     */}
      {/* ======================================================== */}
      {tab === "FEATURE_MATRIX" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action Bar */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <p className="font-bold text-white text-sm">
                  Matriks Hak Akses Fitur Tier &amp; Vertikal (Tanpa Hardcode)
                </p>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
                Atur fitur mana saja yang aktif di paket <strong>Starter (Basic)</strong>, <strong>Pro</strong>, <strong>Enterprise</strong>, atau yang memerlukan <strong>Modul Vertikal Khusus</strong>. Perubahan ini langsung disinkronkan secara live ke dashboard seluruh tenant.
              </p>
            </div>

            <button
              onClick={handleSaveFeatureMatrix}
              disabled={featureLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 flex-shrink-0"
            >
              {featureLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Matriks...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Matriks</span>
                </>
              )}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setFeatureFilterCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                featureFilterCategory === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              Semua Modul ({featureEntitlements.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as FeatureCategory[]).map((catKey) => {
              const info = CATEGORY_LABELS[catKey];
              const count = featureEntitlements.filter((f) => f.category === catKey).length;
              if (count === 0) return null;

              return (
                <button
                  key={catKey}
                  onClick={() => setFeatureFilterCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 flex items-center gap-1.5 ${
                    featureFilterCategory === catKey
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <span>{info.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Feature Matrix Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                  <th className="py-3 px-4 w-[35%]">Fitur &amp; Deskripsi Upsell</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-center">Starter (Basic)</th>
                  <th className="py-3 px-3 text-center">Pro</th>
                  <th className="py-3 px-3 text-center">Enterprise</th>
                  <th className="py-3 px-4">Prasyarat Vertikal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {featureEntitlements
                  .filter(
                    (f) =>
                      featureFilterCategory === "ALL" ||
                      f.category === featureFilterCategory
                  )
                  .map((feat) => {
                    const isStarter = feat.allowedTiers.includes("starter") || feat.allowedTiers.includes("basic");
                    const isPro = feat.allowedTiers.includes("pro");
                    const isEnterprise = feat.allowedTiers.includes("enterprise");
                    const catInfo = CATEGORY_LABELS[feat.category] || {
                      name: feat.category,
                      color: "text-slate-400 bg-slate-800 border-slate-700",
                    };

                    const handleToggleTier = (tier: string) => {
                      const updated = featureEntitlements.map((item) => {
                        if (item.key !== feat.key) return item;
                        let tiers = [...item.allowedTiers];

                        if (tier === "starter") {
                          if (isStarter) {
                            tiers = tiers.filter((t) => t !== "starter" && t !== "basic");
                          } else {
                            tiers.push("starter");
                          }
                        } else if (tier === "pro") {
                          if (isPro) {
                            tiers = tiers.filter((t) => t !== "pro");
                          } else {
                            tiers.push("pro");
                          }
                        } else if (tier === "enterprise") {
                          if (isEnterprise) {
                            tiers = tiers.filter((t) => t !== "enterprise");
                          } else {
                            tiers.push("enterprise");
                          }
                        }

                        return { ...item, allowedTiers: tiers };
                      });

                      setFeatureEntitlements(updated);
                    };

                    const handlePluginChange = (pluginVal: string) => {
                      const updated = featureEntitlements.map((item) => {
                        if (item.key !== feat.key) return item;
                        return {
                          ...item,
                          requiredPlugin: pluginVal === "none" ? null : pluginVal,
                        };
                      });
                      setFeatureEntitlements(updated);
                    };

                    return (
                      <tr key={feat.key} className="hover:bg-slate-800/30 transition">
                        {/* Feature Info */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-white text-xs">
                            {feat.name}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                            {feat.description}
                          </p>
                          <span className="font-mono text-[9px] text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {feat.key}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.color}`}>
                            {catInfo.name}
                          </span>
                        </td>

                        {/* Starter Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isStarter}
                              onChange={() => handleToggleTier("starter")}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* Pro Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPro}
                              onChange={() => handleToggleTier("pro")}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* Enterprise Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnterprise}
                              onChange={() => handleToggleTier("enterprise")}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* Required Plugin Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={feat.requiredPlugin || "none"}
                            onChange={(e) => handlePluginChange(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="none">Bebas (Tanpa Plugin)</option>
                            <option value="cafe">☕ Wajib Plugin Cafe</option>
                            <option value="barbershop">✂️ Wajib Plugin Barbershop</option>
                            <option value="laundry">🧺 Wajib Plugin Laundry</option>
                            <option value="retail">🛒 Wajib Plugin Retail</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

{/* MODAL: Import Plugin / Theme Package JSON */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="rounded-3xl p-6 max-w-2xl w-full bg-slate-900 border border-slate-800 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Box className="w-4 h-4" />
                  </span>
                  <h3 className="font-black text-base text-white">
                    {importCategory === "THEME" && "Import Preset Tema UI (JSON)"}
                    {importCategory === "POS_LAYOUT" && "Import Tata Letak Layar POS (JSON)"}
                    {importCategory === "RECEIPT" && "Import Blueprint Struk Thermal (JSON)"}
                    {importCategory === "PLUGIN" && "Import Modul Plugin Bisnis (JSON)"}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {importCategory === "THEME" && "Impor paket warna, efek visual, dan tata letak UI kasir secara dinamis dari file JSON terpisah."}
                  {importCategory === "POS_LAYOUT" && "Impor spesifikasi dock keranjang, grid produk, dan tata letak layar POS per vertikal bisnis."}
                  {importCategory === "RECEIPT" && "Impor blueprint struk thermal 58mm/80mm siap cetak dengan logo, QR, & footer dinamis."}
                  {importCategory === "PLUGIN" && "Impor modul alur bisnis industri dari file manifest JSON terpisah."}
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Sample Presets Loader */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                ⚡ Contoh Preset Terkait (1-Click Load)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Sample 1: Cyberpunk Theme */}
                {(importCategory === "THEME" || importCategory === "POS_LAYOUT") && (
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateJson(
                        JSON.stringify(
                          {
                            manifest: {
                              id: "theme-cyber-dark",
                              name: "Cyberpunk Neon Pro",
                              type: "THEME",
                              version: "1.0.0",
                              author: "Qassa Studio",
                              vertical: "GENERAL",
                              description: "Tema gelap futuristik dengan neon glow, panel navy pekat, dan layout kasir 4 kolom.",
                              pricing: { priceMonthly: 29000, priceAnnual: 290000 },
                            },
                            tokens: {
                              mode: "dark",
                              colors: {
                                primary: "#6366f1",
                                accent: "#818cf8",
                                background: "#090d16",
                                card: "#111a2e",
                                border: "#1e293b",
                              },
                              effects: { borderRadius: "14px" },
                            },
                            layouts: {
                              pos: { cartDock: "right", productGridColumns: 4 },
                              dashboard: { kpiColumns: 4 },
                            },
                          },
                          null,
                          2
                        )
                      )
                    }
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs space-y-0.5 transition"
                  >
                    <span className="font-bold block text-indigo-400">⚡ Cyberpunk</span>
                    <span className="text-[10px] text-slate-400 block">Dark Neon Theme</span>
                  </button>
                )}

                {/* Sample 2: Cafe Emerald Theme */}
                {(importCategory === "THEME" || importCategory === "POS_LAYOUT") && (
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateJson(
                        JSON.stringify(
                          {
                            manifest: {
                              id: "theme-cafe-emerald",
                              name: "Artisan Cafe Emerald",
                              type: "THEME",
                              version: "1.0.0",
                              author: "Qassa F&B Lab",
                              vertical: "CAFE",
                              description: "Tema estetik hangat Forest Green & Sand Gold dengan pemilih meja.",
                              pricing: { priceMonthly: 39000, priceAnnual: 390000 },
                            },
                            tokens: {
                              mode: "dark",
                              colors: {
                                primary: "#059669",
                                accent: "#f59e0b",
                                background: "#061f18",
                                card: "#0c3328",
                                border: "#134e3f",
                              },
                              effects: { borderRadius: "16px" },
                            },
                            layouts: {
                              pos: { cartDock: "right", productGridColumns: 3 },
                              dashboard: { kpiColumns: 4 },
                            },
                          },
                          null,
                          2
                        )
                      )
                    }
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs space-y-0.5 transition"
                  >
                    <span className="font-bold block text-emerald-400">☕ Cafe Emerald</span>
                    <span className="text-[10px] text-slate-400 block">Warm F&B Theme</span>
                  </button>
                )}

                {/* Sample 3: Modern 80mm Receipt */}
                {(importCategory === "RECEIPT" || importCategory === "PLUGIN") && (
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateJson(
                        JSON.stringify(
                          {
                            manifest: {
                              id: "receipt-modern-thermal-80mm",
                              name: "Thermal Modern Pro (80mm)",
                              type: "RECEIPT_PRESET",
                              version: "1.0.0",
                              author: "Qassa Thermal Lab",
                              vertical: "GENERAL",
                              description: "Preset struk 80mm lengkap dengan nomor antrean jumbo, barcode, kupon, dan QRIS.",
                              pricing: { priceMonthly: 19000, priceAnnual: 190000 },
                            },
                            receipt: {
                              paperWidth: "80mm",
                              dividerStyle: "dashed",
                              blocks: [
                                { id: "b1", type: "HEADER_LOGO", enabled: true, order: 1 },
                                { id: "b2", type: "STORE_META", enabled: true, order: 2 },
                                { id: "b3", type: "QUEUE_NUMBER", enabled: true, order: 3 },
                                { id: "b4", type: "ITEMS_TABLE", enabled: true, order: 4 },
                                { id: "b5", type: "TOTAL_SUMMARY", enabled: true, order: 5 },
                                { id: "b6", type: "QRIS_CODE", enabled: true, order: 6 },
                                { id: "b7", type: "FOOTER_NOTES", enabled: true, order: 7 },
                              ],
                            },
                          },
                          null,
                          2
                        )
                      )
                    }
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs space-y-0.5 transition"
                  >
                    <span className="font-bold block text-purple-400">🧾 Modern 80mm</span>
                    <span className="text-[10px] text-slate-400 block">Thermal Pro</span>
                  </button>
                )}

                {/* Sample 4: Compact 58mm Receipt */}
                {(importCategory === "RECEIPT" || importCategory === "PLUGIN") && (
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateJson(
                        JSON.stringify(
                          {
                            manifest: {
                              id: "receipt-compact-58mm",
                              name: "Eco Compact Mini (58mm)",
                              type: "RECEIPT_PRESET",
                              version: "1.0.0",
                              author: "Qassa Thermal Lab",
                              vertical: "RETAIL",
                              description: "Preset struk 58mm hemat kertas untuk printer bluetooth portable.",
                              pricing: { priceMonthly: 15000, priceAnnual: 150000 },
                            },
                            receipt: {
                              paperWidth: "58mm",
                              dividerStyle: "solid",
                              blocks: [
                                { id: "b1", type: "STORE_META", enabled: true, order: 1 },
                                { id: "b2", type: "ITEMS_TABLE", enabled: true, order: 2 },
                                { id: "b3", type: "TOTAL_SUMMARY", enabled: true, order: 3 },
                                { id: "b4", type: "FOOTER_NOTES", enabled: true, order: 4 },
                              ],
                            },
                          },
                          null,
                          2
                        )
                      )
                    }
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs space-y-0.5 transition"
                  >
                    <span className="font-bold block text-amber-400">🏷️ Compact 58mm</span>
                    <span className="text-[10px] text-slate-400 block">Eco Mini Struk</span>
                  </button>
                )}

                {/* Sample 5: Dual Screen POS Layout */}
                {importCategory === "POS_LAYOUT" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateJson(
                        JSON.stringify(
                          {
                            manifest: {
                              id: "pos-layout-dual-screen",
                              name: "Dual Screen Split POS",
                              type: "POS_LAYOUT",
                              version: "1.0.0",
                              author: "Qassa POS Lab",
                              vertical: "GENERAL",
                              description: "Layout dua kolom seimbang dengan docking keranjang kiri dan grid produk 3 kolom.",
                              pricing: { priceMonthly: 20000, priceAnnual: 200000 },
                            },
                            layouts: {
                              pos: {
                                cartDock: "left",
                                cartWidth: "420px",
                                productGridColumns: 3,
                                productCardStyle: "compact_row",
                                showCategoriesAs: "sidebar_left",
                                slots: [],
                              },
                            },
                          },
                          null,
                          2
                        )
                      )
                    }
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs space-y-0.5 transition"
                  >
                    <span className="font-bold block text-blue-400">📱 Dual Screen</span>
                    <span className="text-[10px] text-slate-400 block">Left Dock Layout</span>
                  </button>
                )}

                {/* Sample 6: F&B Table Plugin */}
                {importCategory === "PLUGIN" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleValidateJson(
                        JSON.stringify(
                          {
                            manifest: {
                              id: "plugin-table-management",
                              name: "F&B Table Management Pro",
                              type: "PLUGIN",
                              version: "1.0.0",
                              author: "Qassa F&B Lab",
                              vertical: "CAFE",
                              description: "Manajemen denah meja, split bill, transfer meja, dan status pesanan dapur.",
                              pricing: { priceMonthly: 49000, priceAnnual: 490000 },
                            },
                          },
                          null,
                          2
                        )
                      )
                    }
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left text-xs space-y-0.5 transition"
                  >
                    <span className="font-bold block text-emerald-400">🍽️ F&B Tables</span>
                    <span className="text-[10px] text-slate-400 block">Table Plugin</span>
                  </button>
                )}
              </div>
            </div>


            {/* Paste or Upload JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Isi Payload Plugin Package (JSON Schema)
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">
                  Schema: PluginPackage v1.0
                </span>
              </div>
              <textarea
                rows={7}
                value={importJsonText}
                onChange={(e) => handleValidateJson(e.target.value)}
                placeholder='Paste JSON paket plugin/tema di sini...'
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Live Schema Validation Preview Card */}
            {validationPreview && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-xs text-emerald-300">
                      ✓ Validasi Schema Berhasil: {validationPreview.manifest.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">
                    {validationPreview.manifest.type} &bull; v{validationPreview.manifest.version}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {validationPreview.manifest.description}
                </p>

                {/* Pricing Fields */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-800/60">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Harga Langganan Bulanan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={customMonthly}
                      onChange={(e) => setCustomMonthly(e.target.value)}
                      placeholder="Contoh: 29000"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Harga Langganan Tahunan (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={customAnnual}
                      onChange={(e) => setCustomAnnual(e.target.value)}
                      placeholder="Contoh: 290000"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!validationPreview || importLoading}
                className="flex-1 py-2.5 rounded-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-lg transition text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mempublikasikan ke Katalog...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Publish ke Katalog Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

