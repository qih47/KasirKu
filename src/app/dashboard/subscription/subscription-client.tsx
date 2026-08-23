"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  AlertTriangle,
  QrCode,
  Building2,
  Copy,
  Clock,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { upgradeSubscriptionAction } from "@/modules/subscription/actions";
import {
  generateSaaSDynamicQrisAction,
  checkSaaSPaymentStatusAction,
  simulatePaymentWebhookAction,
} from "@/modules/payment/actions";
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
    currentTier: { name: "Lisensi Basic", code: "basic" },
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

  // Modal Downgrade States
  const [showDowngradeModal, setShowDowngradeModal] = useState<boolean>(false);
  const [downgradeAgreed, setDowngradeAgreed] = useState<boolean>(false);
  const [downgradeSinglePluginId, setDowngradeSinglePluginId] = useState<string>(initialActivePluginIds[0] || "");

  // Modal Payment Gateway States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [activePaymentTab, setActivePaymentTab] = useState<"QRIS" | "VA" | "TRANSFER">("QRIS");
  const [selectedVaBank, setSelectedVaBank] = useState<"bca" | "mandiri" | "bni" | "bri">("bca");
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<boolean>(false);
  const [paymentPollingActive, setPaymentPollingActive] = useState<boolean>(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expirySeconds, setExpirySeconds] = useState<number>(900); // 15 menit

  const availableTiers = data.availableTiers || [];
  const availablePlugins = data.availablePlugins || [];

  const tierRank: Record<string, number> = { basic: 1, pro: 2, enterprise: 3 };
  const currentRank = tierRank[data.currentTier?.code?.toLowerCase() || "basic"] || 1;
  const selectedTier = availableTiers.find((t: any) => t.id === selectedTierId) || availableTiers[0];
  const selectedRank = tierRank[selectedTier?.code?.toLowerCase() || "basic"] || 1;

  const isDowngrading = selectedRank < currentRank && !isTrial && !data.tenant?.isExpired;
  const isUpgrading = selectedRank > currentRank;
  const isBasicSelected = selectedTier?.code?.toLowerCase() === "basic";

  // Enforcement: Jika memilih tier Basic, pastikan hanya 1 vertikal yang dipilih
  useEffect(() => {
    if (isBasicSelected && selectedPluginIds.length > 1) {
      setSelectedPluginIds([selectedPluginIds[0]]);
    }
  }, [selectedTierId, isBasicSelected]);

  // Toggle Plugin Selection
  const togglePlugin = (pluginId: string) => {
    if (isBasicSelected) {
      // Basic hanya boleh 1 vertikal (ganti pilihan secara langsung)
      setSelectedPluginIds([pluginId]);
      return;
    }

    // PRO / Enterprise: Multi-vertikal bebas
    setSelectedPluginIds((prev) =>
      prev.includes(pluginId)
        ? prev.filter((id) => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  // Kalkulasi Biaya Upgrade & Tambahan (Delta Pricing & Prorated untuk durasi fleksibel)
  const isDurationChanged = selectedDurationKey !== initialDurationKey;
  const isOngoingMonthlyActive = initialDurationKey === "1M" && !isTrial && !data.tenant?.isExpired;
  const isTierChanged = selectedTierId !== currentTierId;

  let tierCostToday = 0;
  if (selectedTier) {
    const monthlyPrice = Number(selectedTier.priceMonthly);
    const tierCalc = calculateDurationPrice(monthlyPrice, selectedDuration);

    if (isTierChanged || isTrial || data.tenant?.isExpired) {
      tierCostToday = tierCalc.totalPrice;
    } else if (isDurationChanged && isOngoingMonthlyActive) {
      tierCostToday = Math.max(0, tierCalc.totalPrice - monthlyPrice);
    } else if (isDurationChanged) {
      tierCostToday = tierCalc.totalPrice;
    } else {
      tierCostToday = 0;
    }
  }

  // Rincian Plugin: Modul yang sudah dimiliki vs Modul Baru
  const pluginItemsCalculation = availablePlugins.map((plugin: any) => {
    const isSelected = selectedPluginIds.includes(plugin.id);
    const wasAlreadyActive = initialActivePluginIds.includes(plugin.id);
    const monthlyPrice = Number(plugin.priceMonthly);
    const pluginCalc = calculateDurationPrice(monthlyPrice, selectedDuration);

    let costToday = 0;
    let isProrated1Month = false;

    if (isSelected) {
      if (!wasAlreadyActive || isTrial || data.tenant?.isExpired) {
        costToday = pluginCalc.totalPrice;
      } else if (isDurationChanged && isOngoingMonthlyActive) {
        costToday = Math.max(0, pluginCalc.totalPrice - monthlyPrice);
        isProrated1Month = true;
      } else if (isDurationChanged) {
        costToday = pluginCalc.totalPrice;
      } else {
        costToday = 0;
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

  // Countdown timer untuk modal QRIS
  useEffect(() => {
    if (!showPaymentModal || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPaymentModal, expirySeconds]);

  // Polling Status Pembayaran SaaS Gateway setiap 3 detik
  useEffect(() => {
    if (!paymentPollingActive || !invoiceData?.orderId || isPaymentVerified) return;

    const interval = setInterval(async () => {
      try {
        const res = await checkSaaSPaymentStatusAction(invoiceData.orderId);
        if (res.isPaid) {
          setIsPaymentVerified(true);
          setPaymentPollingActive(false);
          await finalizeSubscriptionActivation();
        }
      } catch (err) {
        // Silent polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentPollingActive, invoiceData, isPaymentVerified]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 1. Eksekusi Pembayaran & Buka Modal Gateway
  const handleInitiateCheckout = async () => {
    setError(null);

    // Skenario A: Downgrade ke paket lebih rendah -> Buka Modal Peringatan
    if (isDowngrading) {
      setDowngradeAgreed(false);
      setDowngradeSinglePluginId(selectedPluginIds[0] || initialActivePluginIds[0] || availablePlugins[0]?.id || "");
      setShowDowngradeModal(true);
      return;
    }

    // Skenario B: Gratis / Sudah Aktif / Tidak ada tagihan -> Langsung terapkan
    if (grandTotalToday === 0) {
      await finalizeSubscriptionActivation();
      return;
    }

    // Skenario C: Ada Tagihan Berbayar -> Buka Modal Payment Gateway Interaktif
    setGeneratingInvoice(true);
    setShowPaymentModal(true);
    setExpirySeconds(900); // 15 menit
    setIsPaymentVerified(false);

    try {
      const qrisRes = await generateSaaSDynamicQrisAction({
        tierCode: selectedTier.code,
        durationMonths: selectedDuration.months,
        totalAmount: grandTotalToday,
        tierName: selectedTier.name,
      });

      if (qrisRes.success) {
        setInvoiceData(qrisRes);
        setPaymentPollingActive(true);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat gateway pembayaran.");
      setShowPaymentModal(false);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // 2. Simulasi Scan QRIS Lunas (Testing Sandbox)
  const handleSimulateScanPayment = async () => {
    if (!invoiceData?.orderId) return;
    setLoading(true);

    try {
      await simulatePaymentWebhookAction(invoiceData.orderId);
      setIsPaymentVerified(true);
      setPaymentPollingActive(false);
      await finalizeSubscriptionActivation();
    } catch (err: any) {
      setError(err.message || "Gagal melakukan simulasi pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Finalisasi Aktivasi Langganan di Database
  const finalizeSubscriptionActivation = async (customPluginIds?: string[]) => {
    setLoading(true);
    try {
      const res = await upgradeSubscriptionAction({
        licenseTierId: selectedTierId,
        durationKey: selectedDuration.key,
        durationMonths: selectedDuration.months,
        billingCycle: selectedDuration.months >= 12 ? "ANNUAL" : "MONTHLY",
        selectedPluginIds: customPluginIds || selectedPluginIds,
      });

      if (res.success) {
        setShowPaymentModal(false);
        setShowDowngradeModal(false);
        setSuccessMsg(
          `✨ Paket ${selectedTier.name} berhasil diaktifkan untuk durasi ${selectedDuration.label}! Fitur langsung dapat digunakan.`
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui paket langganan.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Konfirmasi Eksekusi Downgrade -> Buka Modal Payment Gateway dengan Rincian Paket Downgrade
  const handleConfirmDowngrade = async () => {
    if (!downgradeAgreed) {
      setError("Mohon centang persetujuan konsekuensi penurunan paket.");
      return;
    }

    // Set pilihan plugin tunggal hasil downgrade
    const finalPlugins = [downgradeSinglePluginId];
    setSelectedPluginIds(finalPlugins);
    setShowDowngradeModal(false);

    // Hitung total biaya paket baru hasil downgrade
    const monthlyTier = Number(selectedTier.priceMonthly);
    const tierCalc = calculateDurationPrice(monthlyTier, selectedDuration);
    const selectedPluginObj = availablePlugins.find((p: any) => p.id === downgradeSinglePluginId);
    const monthlyPlugin = Number(selectedPluginObj?.priceMonthly || 0);
    const pluginCalc = calculateDurationPrice(monthlyPlugin, selectedDuration);
    const downgradeTotalAmount = tierCalc.totalPrice + pluginCalc.totalPrice;

    // Buka Modal Payment Gateway Interaktif
    setGeneratingInvoice(true);
    setShowPaymentModal(true);
    setExpirySeconds(900);
    setIsPaymentVerified(false);

    try {
      const qrisRes = await generateSaaSDynamicQrisAction({
        tierCode: selectedTier.code,
        durationMonths: selectedDuration.months,
        totalAmount: downgradeTotalAmount,
        tierName: selectedTier.name,
      });

      if (qrisRes.success) {
        setInvoiceData(qrisRes);
        setPaymentPollingActive(true);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat gateway pembayaran downgrade.");
      setShowPaymentModal(false);
    } finally {
      setGeneratingInvoice(false);
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

  const hasTierChange = selectedTierId !== currentTierId;
  const hasPluginChange =
    selectedPluginIds.length !== initialActivePluginIds.length ||
    selectedPluginIds.some((id) => !initialActivePluginIds.includes(id)) ||
    initialActivePluginIds.some((id) => !selectedPluginIds.includes(id));

  const hasAnyChange = hasTierChange || hasPluginChange || isDurationChanged || isTrial;

  const currentDurationLabel =
    durationSettings.find((d) => d.key === initialDurationKey)?.label ||
    (initialDurationKey === "1Y" ? "1 Tahun" : "1 Bulan");

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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
              Pilih durasi langganan fleksibel (1 Bulan s/d 3 Tahun). Nikmati diskon hemat hingga 30% tanpa mereset modul bisnis yang sudah Anda miliki.
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
                <Layers className="w-3 h-3" /> Vertikal Aktif
              </span>
              <p className="text-sm font-black text-indigo-600">
                {data.activePlugins?.length || 1} Modul
              </p>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. Durasi Langganan Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pilih Periode Durasi Langganan:</span>
          </label>
        </div>

        <div
          className="p-1.5 rounded-2xl border flex flex-wrap items-center gap-1.5 shadow-xs overflow-x-auto"
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
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
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
            Pilih paket yang Anda inginkan untuk durasi {selectedDuration.label}. Basic dibatasi 1 vertikal, sedangkan PRO dan Enterprise mendukung Multi-Vertikal penuh.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${expandedTier === null ? 'items-stretch' : 'items-start'}`}>
          {availableTiers.map((tier: any) => {
            const isSelected = selectedTierId === tier.id;
            const thisTierRank = tierRank[tier.code?.toLowerCase() || "basic"] || 1;
            const isThisTierCurrent = tier.id === currentTierId && !isTrial && !isDurationChanged;
            const isThisTierCurrentOnNewDuration = tier.id === currentTierId && !isTrial && isDurationChanged;
            const isThisTierDowngrade = thisTierRank < currentRank && !isTrial && !data.tenant?.isExpired;
            
            const monthlyBase = Number(tier.priceMonthly);
            const tierCalc = calculateDurationPrice(monthlyBase, selectedDuration);
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
                {isPopularPro && !isThisTierCurrent && !isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                      ⭐ Paling Populer
                    </span>
                  </div>
                )}

                {/* Badge Status */}
                {isThisTierCurrent ? (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Paket Anda Saat Ini
                    </span>
                  </div>
                ) : isThisTierCurrentOnNewDuration ? (
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
                    <span className="text-[10px] text-slate-400 font-bold">
                      {tier.code === "basic" ? "Maksimal 1 Vertikal" : "Mendukung Multi-Vertikal"}
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
                            setara Rp ${tierCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat {selectedDuration.discountPercent}%
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

                  {/* Benefit Items List */}
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
                        <span>{tier.code === 'basic' ? '1 Vertikal Bisnis' : 'Multi-Vertikal Penuh (Kafe, Barber, Laundry, Retail)'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>Manajemen Stok &amp; Penjualan Lengkap</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Footer Action on Card */}
                <div className="pt-4 mt-5 border-t" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  {isThisTierCurrent ? (
                    <span className="text-xs font-bold text-emerald-600 block text-center py-1">
                      Sudah Aktif (Rp 0)
                    </span>
                  ) : isThisTierDowngrade ? (
                    <span className="text-xs font-black text-rose-600 block text-center py-1 group-hover:underline">
                      ⬇️ Downgrade ke {tier.name}
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-indigo-600 block text-center py-1">
                      {monthlyBase === 0
                        ? "Pilih Lisensi Enterprise"
                        : isThisTierDowngrade
                        ? `⬇️ Downgrade ke ${tier.name}`
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
              <Layers className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
              2. Modul Vertikal Bisnis {isBasicSelected ? "(Maks 1 Vertikal di Lisensi Basic)" : "(Multi-Vertikal Bebas)"}
            </h3>
            {isBasicSelected && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
                🔒 Lisensi Basic: 1 Vertikal Aktif
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            {isBasicSelected
              ? "Lisensi Basic hanya dapat memilih 1 modul vertikal aktif. Upgrade ke Lisensi PRO untuk mengaktifkan Multi-Vertikal sekaligus."
              : "Modul yang sudah Anda miliki tetap aktif. Anda bisa mencentang beberapa modul vertikal sekaligus (misal: Cafe + Barbershop + Laundry)."}
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
                    ? "ring-2 ring-indigo-500 shadow-md bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400"
                    : "hover:border-slate-300 shadow-sm"
                }`}
                style={{
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
                      <CheckCircle2 className="w-3 h-3" /> Terpilih
                    </span>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div
                    className="w-10 h-10 rounded-2xl border flex items-center justify-center bg-white dark:bg-slate-800"
                    style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
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
                        ? `Rp ${itemProratedCost.toLocaleString("id-ID")}`
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
            Rincian Tagihan Pembayaran ({selectedDuration.label})
          </h3>
          <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            {isDowngrading
              ? "Penurunan lisensi ke paket lebih rendah. Harap tinjau ketentuan sebelum konfirmasi."
              : "Menghitung biaya lisensi upgrade, perpanjangan durasi, atau modul vertikal baru."}
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
                  {isDowngrading
                    ? `⬇️ Downgrade ke ${selectedTier.name} (Batas 1 Cabang & 1 Vertikal)`
                    : isTierChanged
                    ? `🚀 Upgrade ke ${selectedTier?.name} (Durasi ${selectedDuration.label})`
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
                    {item.wasAlreadyActive && !isTrial
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
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Dengan melanjutkan, Anda menyetujui{" "}
              <Link href="/terms" target="_blank" className="text-indigo-500 hover:underline font-bold">
                Syarat &amp; Ketentuan Layanan (No-Refund Policy)
              </Link>.
            </p>
          </div>

          <button
            onClick={handleInitiateCheckout}
            disabled={loading || (!hasAnyChange && grandTotalToday === 0)}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
              isDowngrading ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : isDowngrading ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Konfirmasi Downgrade &amp; Bayar (Rp {grandTotalToday.toLocaleString("id-ID")})</span>
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
                    ? `Bayar & Aktifkan Paket (Rp ${grandTotalToday.toLocaleString("id-ID")})`
                    : "Simpan & Terapkan Perubahan"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PERINGATAN KONSEKUENSI DOWNGRADE PAKET LISENSI */}
      {/* ========================================================================= */}
      {showDowngradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Peringatan Penurunan Paket (Downgrade)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dari {data.currentTier?.name} ke {selectedTier.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="font-black text-rose-600">1.</span>
                  <div>
                    <strong className="text-rose-700 dark:text-rose-400">Pembatasan Cabang Outlet:</strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Lisensi Basic hanya mendukung <strong>1 Cabang Outlet</strong>. Cabang tambahan ({data.quota.outletsUsed > 1 ? `${data.quota.outletsUsed - 1} cabang lain` : "cabang lain"}) akan dibekukan sementara.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-black text-rose-600">2.</span>
                  <div>
                    <strong className="text-rose-700 dark:text-rose-400">Isolasi 1 Vertikal Bisnis:</strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Lisensi Basic tidak mendukung Multi-Vertikal. Silakan pilih <strong>1 Vertikal Utama</strong> yang tetap aktif di bawah ini:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availablePlugins.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setDowngradeSinglePluginId(p.id)}
                          className={`p-2.5 rounded-xl border text-left font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                            downgradeSinglePluginId === p.id
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {getPluginIcon(p.code)}
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-black text-rose-600">3.</span>
                  <div>
                    <strong className="text-rose-700 dark:text-rose-400">Sisa Hari Masa Aktif Hangus:</strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Sisa masa aktif paket PRO berjalan tidak dapat diuangkan kembali (*no refund*).
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox Persetujuan */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={downgradeAgreed}
                  onChange={(e) => setDowngradeAgreed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 mt-0.5 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Saya memahami dan menyetujui seluruh konsekuensi penurunan paket ke Lisensi Basic.
                </span>
              </label>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!downgradeAgreed || loading}
                onClick={handleConfirmDowngrade}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>Lanjut ke Pembayaran Downgrade &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IN-APP PAYMENT GATEWAY (DYNAMIC QRIS & VIRTUAL ACCOUNT SANDBOX) */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 text-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Pembayaran Invoice Langganan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Order ID: <span className="font-mono">{invoiceData?.orderId || "Generating..."}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentPollingActive(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatingInvoice ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-slate-500">Menyiapkan QRIS Dinamis &amp; Gateway...</p>
              </div>
            ) : isPaymentVerified ? (
              <div className="py-10 text-center space-y-4 animate-scaleUp">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    Pembayaran Berhasil Diverifikasi!
                  </h4>
                  <p className="text-xs text-slate-500">
                    Paket {selectedTier.name} ({selectedDuration.label}) telah aktif di sistem.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Ringkasan Total Tagihan */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tagihan</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {selectedTier.name} ({selectedDuration.label})
                    </span>
                  </div>
                  <span className="text-xl font-black text-indigo-600 font-mono">
                    Rp {grandTotalToday.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Tab Pilihan Metode Pembayaran */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab("QRIS")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activePaymentTab === "QRIS"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS Real</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab("VA")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activePaymentTab === "VA"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Virtual Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab("TRANSFER")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activePaymentTab === "TRANSFER"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Transfer Bank</span>
                  </button>
                </div>

                {/* CONTENT TAB 1: DYNAMIC QRIS */}
                {activePaymentTab === "QRIS" && (
                  <div className="space-y-4 text-center">
                    {/* Countdown Timer */}
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Batas Waktu Bayar: {formatCountdown(expirySeconds)}</span>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm mx-auto">
                      {invoiceData?.qrDataUrl ? (
                        <img
                          src={invoiceData.qrDataUrl}
                          alt="Dynamic QRIS Midtrans"
                          className="w-56 h-56 mx-auto object-contain"
                        />
                      ) : (
                        <div className="w-56 h-56 flex items-center justify-center bg-slate-50 rounded-xl">
                          <QrCode className="w-16 h-16 text-slate-300 animate-pulse" />
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                        BCA • Mandiri • GoPay • OVO • DANA • ShopeePay • LinkAja
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Mendengarkan status pembayaran real-time...</span>
                    </div>

                    {/* Tombol Testing Simulator Scan Lunas */}
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        🧪 Mode Pengujian Sandbox / Demo:
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulateScanPayment}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                        <span>📱 Simulasi Scan QRIS Lunas (Instant Settlement)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* CONTENT TAB 2: VIRTUAL ACCOUNT */}
                {activePaymentTab === "VA" && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["bca", "mandiri", "bni", "bri"] as const).map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedVaBank(bank)}
                          className={`py-2 rounded-xl border text-center font-bold uppercase transition cursor-pointer ${
                            selectedVaBank === bank
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">Nomor Virtual Account ({selectedVaBank.toUpperCase()}):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(invoiceData?.vaNumbers?.[selectedVaBank] || "8077708571600865", `va-${selectedVaBank}`)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === `va-${selectedVaBank}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `va-${selectedVaBank}` ? "Tersalin!" : "Salin VA"}</span>
                        </button>
                      </div>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {invoiceData?.vaNumbers?.[selectedVaBank] || "8077708571600865"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Atas Nama: <strong className="text-slate-700 dark:text-slate-300">POS UNIVERSAL SAAS</strong>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700 dark:text-slate-300">Panduan Pembayaran:</p>
                      <p>1. Buka Mobile Banking / ATM {selectedVaBank.toUpperCase()}</p>
                      <p>2. Pilih menu Transfer &gt; Virtual Account</p>
                      <p>3. Masukkan nominal tagihan tepat: <strong>Rp {grandTotalToday.toLocaleString("id-ID")}</strong></p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateScanPayment}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Konfirmasi Pembayaran VA Lunas</span>
                    </button>
                  </div>
                )}

                {/* CONTENT TAB 3: TRANSFER BANK */}
                {activePaymentTab === "TRANSFER" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">Bank BCA (Manual Settlement):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy("8291029381", "bca-rek")}
                          className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === "bca-rek" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === "bca-rek" ? "Tersalin!" : "Salin No Rek"}</span>
                        </button>
                      </div>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white">
                        8291-029-381
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Atas Nama: <strong className="text-slate-700 dark:text-slate-300">PT POS UNIVERSAL TEKNOLOGI</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateScanPayment}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Konfirmasi Pembayaran Transfer</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
