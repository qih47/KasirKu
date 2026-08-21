"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Palette,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Store,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Percent,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Users,
  ShieldCheck,
  Zap,
  ArrowLeft,
} from "lucide-react";

import {
  DEFAULT_TRIAL_CONFIGURATION,
  TrialConfiguration,
  getTrialDurationLabel,
} from "@/types/trial-configuration";

interface SimulatorProps {
  dbTiers: any[];
  dbPlugins: any[];
  dbThemes: any[];
  trialConfig?: TrialConfiguration;
}

export function DemoClient({
  dbTiers,
  dbPlugins,
  dbThemes,
  trialConfig = DEFAULT_TRIAL_CONFIGURATION,
}: SimulatorProps) {
  const router = useRouter();
  const trialLabel = getTrialDurationLabel(trialConfig, "id");

  // State Konfigurator
  const [selectedTierCode, setSelectedTierCode] = useState<string>(
    dbTiers.find((t) => t.code === "pro") ? "pro" : dbTiers[0]?.code || "basic"
  );
  const [selectedPluginCodes, setSelectedPluginCodes] = useState<string[]>([
    "barbershop",
    "cafe",
  ]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dbThemes[0]?.id || ""
  );
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">(
    "ANNUAL"
  );

  const selectedTier =
    dbTiers.find((t) => t.code === selectedTierCode) || dbTiers[0];

  const togglePlugin = (code: string) => {
    if (selectedPluginCodes.includes(code)) {
      setSelectedPluginCodes(selectedPluginCodes.filter((c) => c !== code));
    } else {
      setSelectedPluginCodes([...selectedPluginCodes, code]);
    }
  };

  // Hitung Harga Simulasi
  const tierPrice =
    billingCycle === "ANNUAL"
      ? Number(selectedTier?.priceAnnual || 0) / 12
      : Number(selectedTier?.priceMonthly || 0);

  const pluginsPrice = selectedPluginCodes.reduce((sum, pCode) => {
    const p = dbPlugins.find((item) => item.code === pCode);
    if (!p) return sum;
    const price =
      billingCycle === "ANNUAL"
        ? Number(p.priceAnnual) / 12
        : Number(p.priceMonthly);
    return sum + price;
  }, 0);

  const totalMonthlyEstimate = Math.round(tierPrice + pluginsPrice);

  const getPluginIcon = (code: string) => {
    switch (code) {
      case "barbershop":
        return <Scissors className="w-5 h-5 text-amber-500" />;
      case "cafe":
        return <Coffee className="w-5 h-5 text-emerald-500" />;
      case "retail":
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case "laundry":
        return <Shirt className="w-5 h-5 text-purple-500" />;
      default:
        return <Layers className="w-5 h-5 text-indigo-500" />;
    }
  };

  // Launch Simulator Button
  const handleLaunchGuestDemo = () => {
    const themeObj =
      dbThemes.find((th) => th.id === selectedThemeId) || dbThemes[0];
    const demoConfig = {
      tier: selectedTier,
      plugins: selectedPluginCodes,
      theme: themeObj,
      billingCycle,
      launchedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("pos_guest_demo_config", JSON.stringify(demoConfig));
    }

    router.push("/demo/app");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans">
      {/* Top Header - Clean White */}
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Kembali ke Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-slate-950">
                Simulator Racik Paket & Guest Demo
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Sandbox Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition"
            >
              Daftar Akun Resmi
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-8 w-full text-left">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Konfigurasi Paket & Coba Demo Langsung
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Pilih paket lisensi, modul vertikal, dan tema layout untuk menguji alur kerja kasir POS nyata sebagai Guest tanpa login akun & tanpa database.
          </p>
        </div>

        {/* SECTION SIMULATOR HARGA & KONFIGURATOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Configurator */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
            {/* 1. Pilih Lisensi */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                1. Paket Lisensi Utama
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {dbTiers.map((t) => {
                  const isSel = selectedTierCode === t.code;
                  const priceMonthly = Number(t.priceMonthly);

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTierCode(t.code)}
                      className={`p-4 rounded-2xl border text-left transition relative ${
                        isSel
                          ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                          : "bg-[#F8F9FD] border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {isSel && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                      <p className="font-black text-sm text-slate-950">
                        {t.name}
                      </p>
                      <p className="text-xs text-indigo-600 font-bold mt-1">
                        Rp {priceMonthly.toLocaleString("id-ID")}/bln
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                        {t.outletLimit ? `${t.outletLimit} Outlet` : "Unlimited Outlet"} &bull; Max {t.kasirLimitPerOutlet} Kasir
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Pilih Plugin Modul Vertikal */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                2. Modul Vertikal Tambahan (Multi-Select)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dbPlugins.map((p) => {
                  const isSel = selectedPluginCodes.includes(p.code);
                  const priceMonthly = Number(p.priceMonthly);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlugin(p.code)}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition relative ${
                        isSel
                          ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                          : "bg-[#F8F9FD] border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm flex-shrink-0">
                        {getPluginIcon(p.code)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-slate-950">
                            {p.name}
                          </p>
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                              isSel
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSel ? "✓" : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {p.description}
                        </p>
                        <p className="text-[11px] text-indigo-600 font-bold mt-1">
                          +Rp {priceMonthly.toLocaleString("id-ID")}/bln
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Pilih Tema Layout */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                3. Pilihan Tema Tampilan (Theme Preset)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dbThemes.map((th) => {
                  const isSel = selectedThemeId === th.id;
                  const tokens = th.tokens as any;

                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setSelectedThemeId(th.id)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        isSel
                          ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                          : "bg-[#F8F9FD] border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{
                            backgroundColor: tokens?.primaryColor || "#4f46e5",
                          }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{
                            backgroundColor: tokens?.accentColor || "#06b6d4",
                          }}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-950 truncate">
                        {th.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tokens?.layoutStyle || "MODERN"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Live Price Summary & Sandbox Launch */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Estimasi Investasi
              </span>

              {/* Billing Cycle Toggle */}
              <div className="p-1.5 rounded-2xl bg-[#F8F9FD] border border-slate-200 flex items-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={`flex-1 py-2 rounded-xl transition ${
                    billingCycle === "MONTHLY"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("ANNUAL")}
                  className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1 ${
                    billingCycle === "ANNUAL"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Tahunan</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">
                    -17%
                  </span>
                </button>
              </div>

              {/* Price Calculation */}
              <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Lisensi {selectedTier?.name}:</span>
                  <span className="font-bold text-slate-900">
                    Rp {Math.round(tierPrice).toLocaleString("id-ID")}/bln
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{selectedPluginCodes.length} Plugin Modul:</span>
                  <span className="font-bold text-slate-900">
                    Rp {Math.round(pluginsPrice).toLocaleString("id-ID")}/bln
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-black text-slate-950">Total Est:</span>
                  <span className="text-xl font-black text-indigo-600">
                    Rp {totalMonthlyEstimate.toLocaleString("id-ID")}
                    <span className="text-xs font-normal text-slate-500">
                      /bln
                    </span>
                  </span>
                </div>
              </div>

              {/* Feature Checklist Preview */}
              <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 text-center space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  Simulasi 100% Bebas Akses
                </p>
                <p className="text-[11px] text-slate-500">
                  Data simulasi disimpan di browser lokal tanpa login akun.
                </p>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLaunchGuestDemo}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Buka Aplikasi Demo (Guest)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>

              <Link
                href="/register"
                className="block text-center text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Atau langsung Mulai Trial {trialLabel} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        POS Universal Platform &bull; Demo Simulator Environment
      </footer>
    </div>
  );
}
