"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Store,
  Users,
  ShieldCheck,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  ArrowRight,
  Loader2,
  CreditCard,
  Check,
  Plus,
  Info,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { upgradeSubscriptionAction } from "@/modules/subscription/actions";

import {
  DEFAULT_DURATION_SETTINGS,
  DurationSettingItem,
  calculateDurationPrice,
} from "@/types/subscription-duration";
import { useTranslation } from "@/lib/i18n/language-context";

interface SubscriptionClientProps {
  initialData?: any;
  data?: any;
}

export function SubscriptionClient({ initialData, data: propData }: SubscriptionClientProps) {
  const { locale, tr } = useTranslation();
  const data = initialData || propData || {
    tenant: { status: "TRIAL", daysRemaining: 30 },
    activeSubscription: { billingCycle: "MONTHLY", durationKey: "1M", durationMonths: 1 },
    currentTier: { name: "Lisensi Basic" },
    activePluginIds: [],
    activePlugins: [],
    availableTiers: [],
    availablePlugins: [],
    durationSettings: DEFAULT_DURATION_SETTINGS,
    quota: {
      outletsUsed: 1,
      outletLimit: 1,
      cashiersUsed: 1,
      kasirLimit: 5,
    },
  };

  const currentTierId = data.currentTier?.id || data.availableTiers?.[0]?.id || "";
  const initialActivePluginIds: string[] = data.activePluginIds || [];
  const isTrial = data.tenant?.status === "TRIAL";

  const durationSettings: DurationSettingItem[] =
    data.durationSettings && data.durationSettings.length > 0
      ? data.durationSettings
      : DEFAULT_DURATION_SETTINGS;
  const activeDurations = durationSettings.filter((d) => d.isActive);

  const initialDurationKey =
    data.currentDurationKey ||
    (data.activeSubscription as any)?.durationKey ||
    (data.activeSubscription?.billingCycle === "ANNUAL" ? "1Y" : "1M");

  const [selectedDurationKey, setSelectedDurationKey] = useState<string>(initialDurationKey);
  const selectedDuration =
    activeDurations.find((d) => d.key === selectedDurationKey) || activeDurations[0] || DEFAULT_DURATION_SETTINGS[0];

  const [selectedTierId, setSelectedTierId] = useState<string>(currentTierId);
  const [selectedPluginIds, setSelectedPluginIds] = useState<string[]>(initialActivePluginIds);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const availableTiers = data.availableTiers || [];
  const availablePlugins = data.availablePlugins || [];

  // Toggle Plugin Selection
  const togglePlugin = (pluginId: string) => {
    setSelectedPluginIds((prev) =>
      prev.includes(pluginId)
        ? prev.filter((id) => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  // Kalkulasi Biaya Upgrade & Tambahan (Delta Pricing & Prorated untuk durasi fleksibel)
  const isDurationChanged = selectedDurationKey !== initialDurationKey;
  const isOngoingMonthlyActive = initialDurationKey === "1M" && !isTrial && !data.tenant?.isExpired;
  const selectedTier = availableTiers.find((t: any) => t.id === selectedTierId);
  const isTierChanged = selectedTierId !== currentTierId;

  // Biaya tier prorata jika berpindah dari 1 bulan berjalan ke durasi yang lebih panjang
  let tierCostToday = 0;
  if (selectedTier) {
    const monthlyPrice = Number(selectedTier.priceMonthly);
    const tierCalc = calculateDurationPrice(monthlyPrice, selectedDuration);

    if (isTierChanged || isTrial || data.tenant?.isExpired) {
      // Paket baru / dari trial / masa expired -> bayar durasi baru penuh
      tierCostToday = tierCalc.totalPrice;
    } else if (isDurationChanged && isOngoingMonthlyActive) {
      // Konversi paket yang sama dari 1 bulan aktif -> Prorata (potong 1 bulan yang sudah dibayar)
      tierCostToday = Math.max(0, tierCalc.totalPrice - monthlyPrice);
    } else if (isDurationChanged) {
      tierCostToday = tierCalc.totalPrice;
    } else {
      tierCostToday = 0; // Paket dan durasi sama serta aktif
    }
  }

  // Rincian Plugin: Modul yang sudah dimiliki vs Modul Baru (Prorata jika konversi durasi)
  const pluginItemsCalculation = availablePlugins.map((plugin: any) => {
    const isSelected = selectedPluginIds.includes(plugin.id);
    const wasAlreadyActive = initialActivePluginIds.includes(plugin.id);
    const monthlyPrice = Number(plugin.priceMonthly);
    const pluginCalc = calculateDurationPrice(monthlyPrice, selectedDuration);

    let costToday = 0;
    let isProrated1Month = false;

    if (isSelected) {
      if (!wasAlreadyActive || isTrial || data.tenant?.isExpired) {
        // Plugin baru -> Bayar penuh sesuai durasi terpilih
        costToday = pluginCalc.totalPrice;
      } else if (isDurationChanged && isOngoingMonthlyActive) {
        // Modul aktif 1 bulan dikonversi ke durasi lebih panjang -> Prorata (potong 1 bulan)
        costToday = Math.max(0, pluginCalc.totalPrice - monthlyPrice);
        isProrated1Month = true;
      } else if (isDurationChanged) {
        costToday = pluginCalc.totalPrice;
      } else {
        costToday = 0; // Sudah aktif
      }
    }

    return {
      plugin,
      isSelected,
      wasAlreadyActive,
      calc: pluginCalc,
      costToday,
      isProrated1Month,
    };
  });

  const pluginsTotalCostToday = pluginItemsCalculation.reduce(
    (acc: number, curr: any) => acc + curr.costToday,
    0
  );

  const grandTotalToday = tierCostToday + pluginsTotalCostToday;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await upgradeSubscriptionAction({
        licenseTierId: selectedTierId,
        durationKey: selectedDuration.key,
        durationMonths: selectedDuration.months,
        billingCycle: selectedDuration.months >= 12 ? "ANNUAL" : "MONTHLY",
        selectedPluginIds,
      });

      if (res.success) {
        setSuccessMsg(
          `Paket lisensi & modul bisnis berhasil diperbarui untuk durasi ${selectedDuration.label}! Fitur tambahan langsung aktif.`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui langganan.");
    } finally {
      setLoading(false);
    }
  };


  const getPluginIcon = (code: string) => {
    switch (code.toLowerCase()) {
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

  // Cek apakah ada perubahan dari kondisi saat ini
  const hasTierChange = selectedTierId !== currentTierId;
  const hasPluginChange =
    selectedPluginIds.length !== initialActivePluginIds.length ||
    selectedPluginIds.some((id) => !initialActivePluginIds.includes(id)) ||
    initialActivePluginIds.some((id) => !selectedPluginIds.includes(id));

  const hasAnyChange = hasTierChange || hasPluginChange || isDurationChanged || isTrial;

  const currentDurationLabel =
    durationSettings.find((d) => d.key === initialDurationKey)?.label ||
    (initialDurationKey === "1Y" ? "1 Tahun" : "1 Bulan");

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Hero Overview - Status Langganan Saat Ini */}
      <div
        className="p-6 sm:p-8 border shadow-sm space-y-5 transition-all"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e2e8f0)",
          borderRadius: "var(--theme-radius, 1.5rem)",
          boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                  color: "var(--theme-primary, #4f46e5)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Paket Lisensi Aktif:{" "}
                <strong className="text-indigo-600 ml-1">
                  {data.currentTier?.name || "Trial"}
                </strong>
              </span>

              {isTrial ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 text-xs font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Masa Uji Coba (Sisa {data.tenant?.daysRemaining ?? 30} Hari)
                </span>
              ) : data.tenant?.isExpired ? (
                <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Masa Berlangganan Berakhir
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Langganan Aktif ({currentDurationLabel})
                </span>
              )}

            </div>

            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
              Kelola Lisensi &amp; Modul Bisnis
            </h1>

            <p className="text-xs sm:text-sm max-w-2xl font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
              Pilih durasi langganan fleksibel (1 Bulan s/d 3 Tahun). Nikmati potongan diskon semakin hemat untuk durasi lebih panjang tanpa mereset modul yang sudah Anda miliki.
            </p>
          </div>

          {/* Active Inventory & Quota Badges */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border text-xs w-full lg:w-auto"
            style={{
              backgroundColor: "var(--theme-inner-bg, #f8fafc)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
            }}
          >
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                <Store className="w-3 h-3" /> Cabang Outlet
              </span>
              <p className="text-sm font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                {data.quota?.outletsUsed ?? 1} / {data.quota?.outletLimit ?? "Unlimited"}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                <Users className="w-3 h-3" /> Kuota Kasir
              </span>
              <p className="text-sm font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                {data.quota?.cashiersUsed ?? 1} / {data.quota?.kasirLimit ?? "Unlimited"}
              </p>
            </div>

            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                <Layers className="w-3 h-3" /> Modul Aktif
              </span>
              <p className="text-sm font-black text-indigo-600">
                {initialActivePluginIds.length} Modul Terpasang
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Multi-Duration Switcher (1 Bulan s/d 3 Tahun) */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-1">
        <div
          className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl border shadow-sm max-w-full"
          style={{
            backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
            borderColor: "var(--theme-card-border, #e2e8f0)",
          }}
        >
          {activeDurations.map((dur) => {
            const isSelected = selectedDurationKey === dur.key;
            return (
              <button
                key={dur.key}
                type="button"
                onClick={() => setSelectedDurationKey(dur.key)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: isSelected ? "var(--theme-card-bg, #ffffff)" : "transparent",
                  color: isSelected ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
                }}
              >
                <span>{dur.label}</span>
                {dur.discountPercent > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"
                    }`}
                  >
                    Hemat {dur.discountPercent}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Section 1: Pilihan Paket Lisensi (Tier) */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-black flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
            1. Pilihan Paket Lisensi (Kapasitas &amp; Cabang)
          </h3>
          <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            Pilih paket yang Anda inginkan untuk durasi {selectedDuration.label}. Paket yang saat ini sudah Anda miliki ditandai dan tidak akan dikenakan biaya ganda.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${expandedTier === null ? 'items-stretch' : 'items-start'}`}>
          {availableTiers.map((tier: any) => {
            const isSelected = selectedTierId === tier.id;
            const isCurrentActive = tier.id === currentTierId && !isTrial && !isDurationChanged;
            const isCurrentTierOnNewDuration = tier.id === currentTierId && !isTrial && isDurationChanged;
            
            const monthlyBase = Number(tier.priceMonthly);
            const tierCalc = calculateDurationPrice(monthlyBase, selectedDuration);
            const thisTierProratedCost = Math.max(0, tierCalc.totalPrice - monthlyBase);
            const isPopularPro = tier.code?.toLowerCase() === "pro";

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                className={`p-6 sm:p-7 rounded-3xl border transition cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? "ring-2 ring-indigo-500 shadow-xl"
                    : isPopularPro
                    ? "border-indigo-300/80 shadow-md hover:border-indigo-400"
                    : "hover:border-indigo-300 shadow-sm"
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--theme-inner-bg, #f8fafc)" : "var(--theme-card-bg, #ffffff)",
                  borderColor: isSelected ? "var(--theme-primary, #4f46e5)" : "var(--theme-card-border, #e2e8f0)",
                }}
              >
                {/* Popular Pro Ribbon */}
                {isPopularPro && !isCurrentActive && !isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                      ⭐ Paling Populer
                    </span>
                  </div>
                )}

                {/* Badge Status */}
                {isCurrentActive ? (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Paket Anda Saat Ini
                    </span>
                  </div>
                ) : isCurrentTierOnNewDuration ? (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ganti ke {selectedDuration.label}
                    </span>
                  </div>
                ) : isSelected ? (
                  <div className="absolute top-4 right-4" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dipilih
                    </span>
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div className="min-h-[4rem]">
                    <span className="text-xs font-black uppercase tracking-wider block" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                      {tier.name}
                    </span>
                  </div>

                  <div className="min-h-[4.5rem] flex flex-col justify-center">
                    <div className="text-2xl sm:text-3xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                      {monthlyBase === 0 && tier.code === "enterprise"
                        ? "Hubungi Sales"
                        : `Rp ${tierCalc.totalPrice.toLocaleString("id-ID")}`}
                    </div>
                    {monthlyBase > 0 ? (
                      <div className="mt-1">
                        {selectedDuration.months > 1 ? (
                          <span className="text-[11px] font-semibold text-emerald-600 block">
                            setara Rp {tierCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat Rp {tierCalc.savedAmount.toLocaleString("id-ID")} ({selectedDuration.discountPercent}%)
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                            /bulan
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-transparent select-none">
                        /bulan
                      </span>
                    )}
                  </div>

                  {/* Comprehensive & Authentic System Benefits List */}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Benefit &amp; Fitur Termasuk:
                    </span>
                    <ul className="text-xs space-y-2 font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                       <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>{tier.code === 'basic' ? '1 Cabang Outlet' : tier.code === 'pro' ? 'Hingga 10 Cabang' : 'Unlimited Cabang'}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>{tier.code === 'basic' ? '5 Akun Kasir' : 'Unlimited Akun Kasir'}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Manajemen Stok & Penjualan Lengkap</span>
                          </li>
                    </ul>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setExpandedTier(expandedTier === tier.id ? null : tier.id); }}
                      className="text-[11px] font-bold text-indigo-500 flex items-center justify-center gap-1 w-full py-1 hover:text-indigo-600 transition mt-2"
                    >
                      {expandedTier === tier.id ? (
                        <>Tutup Detail <AlertCircle className="w-3 h-3 hidden" /></> 
                      ) : (
                        <>Lihat Detail Paket <Info className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>

                </div>

                <div className="pt-4 mt-5 border-t" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  {isCurrentActive ? (
                    <span className="text-xs font-bold text-emerald-600 block text-center py-1">
                      Sudah Aktif (Rp 0)
                    </span>
                  ) : isCurrentTierOnNewDuration ? (
                    <span className="text-xs font-bold text-indigo-600 block text-center py-1">
                      Ganti ke {selectedDuration.label} (Prorata): Rp {thisTierProratedCost.toLocaleString("id-ID")}
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-indigo-600 block text-center py-1">
                      {monthlyBase === 0
                        ? "Pilih Lisensi Enterprise"
                        : `🚀 Upgrade ke Paket Ini (+Rp ${tierCalc.totalPrice.toLocaleString("id-ID")})`}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 block text-center py-1 group-hover:text-indigo-600">
                      Klik untuk Pilih Paket
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Section 2: Modul Vertikal Bisnis (Add-On Modules) */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-black flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
            <Layers className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
            2. Modul Vertikal Bisnis (Bisa Multi-Vertikal)
          </h3>
          <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            Modul yang sudah Anda miliki tetap aktif. Anda bisa menambah modul vertikal lain (misal: Cafe + Barbershop) untuk durasi {selectedDuration.label}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlugins.map((plugin: any) => {
            const isSelected = selectedPluginIds.includes(plugin.id);
            const wasAlreadyActive = initialActivePluginIds.includes(plugin.id);
            const isPluginActiveOnThisDuration = wasAlreadyActive && !isTrial && !isDurationChanged;
            
            const monthlyBase = Number(plugin.priceMonthly);
            const pluginCalc = calculateDurationPrice(monthlyBase, selectedDuration);
            const isPluginProrated = isDurationChanged && wasAlreadyActive && isOngoingMonthlyActive;
            const itemProratedCost = Math.max(0, pluginCalc.totalPrice - monthlyBase);

            return (
              <div
                key={plugin.id}
                onClick={() => togglePlugin(plugin.id)}
                className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? "ring-2 ring-indigo-500 shadow-md"
                    : "hover:border-slate-300 shadow-sm"
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--theme-inner-bg, #f8fafc)" : "var(--theme-card-bg, #ffffff)",
                  borderColor: isSelected ? "var(--theme-primary, #4f46e5)" : "var(--theme-card-border, #e2e8f0)",
                }}
              >
                {/* Badge Status */}
                {isPluginActiveOnThisDuration ? (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Dimiliki
                    </span>
                  </div>
                ) : isSelected ? (
                  <div className="absolute top-4 right-4" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                      <Plus className="w-3 h-3" /> {wasAlreadyActive ? `Ganti ${selectedDuration.label}` : "Tambahan Baru"}
                    </span>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-2xl border flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--theme-card-bg, #ffffff)",
                      borderColor: "var(--theme-card-border, #e2e8f0)",
                    }}
                  >
                    {getPluginIcon(plugin.code)}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                      {plugin.name}
                    </h4>
                  </div>
                </div>

                <div className="pt-3 border-t mt-4 flex items-baseline justify-between" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  {isPluginActiveOnThisDuration ? (
                    <span className="text-xs font-bold text-emerald-600">
                      Aktif (Rp 0)
                    </span>
                  ) : (
                    <span className="text-xs font-black text-indigo-600">
                      {isPluginProrated
                        ? `Rp ${itemProratedCost.toLocaleString("id-ID")} (Prorata)`
                        : `+Rp ${pluginCalc.totalPrice.toLocaleString("id-ID")}`}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                    /{selectedDuration.months > 1 ? selectedDuration.label : "bln"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Summary Breakdown & Action Button */}
      <div
        className="p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e2e8f0)",
        }}
      >
        <div className="border-b pb-4 space-y-1" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
          <h3 className="font-black text-base" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
            Rincian Tagihan Pembayaran Hari Ini (Durasi: {selectedDuration.label})
          </h3>
          <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            Hanya menghitung biaya paket upgrade, perpanjangan durasi, atau modul tambahan baru yang Anda pilih.
          </p>
        </div>

        {/* Breakdown Items Table */}
        <div className="space-y-2.5 text-xs">
          {/* Tier Item */}
          <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  Paket Lisensi: {selectedTier?.name || "Lisensi Basic"}
                </p>
                <p className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                  {isTierChanged
                    ? `Upgrade ke ${selectedTier?.name || "Paket Baru"} (Durasi ${selectedDuration.label})`
                    : isDurationChanged && isOngoingMonthlyActive
                    ? `Konversi ke ${selectedDuration.label} (Prorata dipotong 1 bulan berjalan)`
                    : isDurationChanged
                    ? `Perpanjang ke Durasi ${selectedDuration.label}`
                    : !isTrial
                    ? "Paket yang sedang aktif saat ini"
                    : "Aktivasi Paket Baru"}
                </p>
              </div>
            </div>
            <span className="font-black" style={{ color: tierCostToday === 0 ? "#10b981" : "var(--theme-text-primary, #0f172a)" }}>
              {tierCostToday === 0 ? "Rp 0 (Sudah Aktif)" : `Rp ${tierCostToday.toLocaleString("id-ID")}`}
            </span>
          </div>

          {/* Plugin Items */}
          {pluginItemsCalculation.filter((i: any) => i.isSelected).map((item: any) => (
            <div key={item.plugin.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
              <div className="flex items-center gap-2">
                {getPluginIcon(item.plugin.code)}
                <div>
                  <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                    Modul Vertikal: {item.plugin.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                    {item.isProrated1Month
                      ? `Konversi ke ${selectedDuration.label} (Prorata dipotong 1 bulan berjalan)`
                      : isDurationChanged
                      ? `Konversi ke Durasi ${selectedDuration.label}`
                      : item.wasAlreadyActive && !isTrial
                      ? "Modul yang sudah Anda miliki"
                      : "Modul Tambahan Baru"}
                  </p>
                </div>
              </div>
              <span className="font-black" style={{ color: item.costToday === 0 ? "#10b981" : "#6366f1" }}>
                {item.costToday === 0 ? "Rp 0 (Sudah Aktif)" : `+Rp ${item.costToday.toLocaleString("id-ID")}`}
              </span>
            </div>
          ))}
        </div>

        {/* Total & Action */}
        <div className="pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
              Total Pembayaran Hari Ini
            </span>
            <div className="text-3xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
              Rp {grandTotalToday.toLocaleString("id-ID")}
              <span className="text-xs font-medium ml-1" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                / {selectedDuration.label}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
              {selectedPluginIds.length} Modul Vertikal akan aktif untuk akun Anda.
            </p>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading || (!hasAnyChange && grandTotalToday === 0)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Perubahan...</span>
              </>
            ) : !hasAnyChange && grandTotalToday === 0 ? (
              <>
                <Check className="w-4 h-4" />
                <span>Paket &amp; Durasi Sudah Sesuai</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>
                  {grandTotalToday > 0
                    ? `Bayar & Aktifkan Paket ${selectedDuration.label} (Rp ${grandTotalToday.toLocaleString("id-ID")})`
                    : "Simpan & Terapkan Perubahan"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
