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

interface SubscriptionClientProps {
  initialData?: any;
  data?: any;
}

export function SubscriptionClient({ initialData, data: propData }: SubscriptionClientProps) {
  const data = initialData || propData || {
    tenant: { status: "TRIAL", daysRemaining: 30 },
    activeSubscription: { billingCycle: "MONTHLY" },
    currentTier: { name: "Lisensi Basic" },
    activePluginIds: [],
    activePlugins: [],
    availableTiers: [],
    availablePlugins: [],
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

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">(
    data.activeSubscription?.billingCycle || "MONTHLY"
  );
  const [selectedTierId, setSelectedTierId] = useState<string>(currentTierId);
  const [selectedPluginIds, setSelectedPluginIds] = useState<string[]>(initialActivePluginIds);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAnnual = billingCycle === "ANNUAL";
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

  // Kalkulasi Biaya Upgrade & Tambahan (Delta Pricing & Prorated 11 Bulan)
  const currentBillingCycle = data.activeSubscription?.billingCycle || "MONTHLY";
  const isCycleChanged = billingCycle !== currentBillingCycle;
  const isOngoingMonthlyActive = currentBillingCycle === "MONTHLY" && !isTrial && !data.tenant?.isExpired;
  const selectedTier = availableTiers.find((t: any) => t.id === selectedTierId);
  const isTierChanged = selectedTierId !== currentTierId;

  // Biaya tier tahunan prorata jika sedang berjalan bulanan (11 bulan = harga tahunan dikurangi 1 bulan yang sudah dibayar)
  let tierCostToday = 0;
  if (selectedTier) {
    if (isAnnual) {
      if (!isTierChanged && isOngoingMonthlyActive) {
        // Konversi tier yang sama dari bulanan aktif -> Prorata 11 bulan (potong 1 bulan yang sudah dibayar)
        tierCostToday = Math.max(0, Number(selectedTier.priceAnnual) - Number(selectedTier.priceMonthly));
      } else if (isTierChanged || isTrial || data.tenant?.isExpired) {
        // Paket baru / dari trial / masa expired -> bayar 12 bulan penuh
        tierCostToday = Number(selectedTier.priceAnnual);
      } else {
        tierCostToday = 0;
      }
    } else {
      // Bulanan
      tierCostToday = isTierChanged || isTrial || data.tenant?.isExpired ? Number(selectedTier.priceMonthly) : 0;
    }
  }

  // Rincian Plugin: Modul yang sudah dimiliki vs Modul Baru (Prorata 11 Bulan untuk modul bulanan aktif)
  const pluginItemsCalculation = availablePlugins.map((plugin: any) => {
    const isSelected = selectedPluginIds.includes(plugin.id);
    const wasAlreadyActive = initialActivePluginIds.includes(plugin.id);
    const price = isAnnual ? Number(plugin.priceAnnual) : Number(plugin.priceMonthly);

    let costToday = 0;
    let isProrated11Months = false;

    if (isSelected) {
      if (isAnnual) {
        if (wasAlreadyActive && isOngoingMonthlyActive) {
          // Modul aktif bulanan dikonversi ke tahunan -> Prorata 11 bulan
          costToday = Math.max(0, Number(plugin.priceAnnual) - Number(plugin.priceMonthly));
          isProrated11Months = true;
        } else if (!wasAlreadyActive || isTrial || data.tenant?.isExpired) {
          costToday = Number(plugin.priceAnnual);
        } else {
          costToday = 0;
        }
      } else {
        // Bulanan
        if (wasAlreadyActive && !isTrial && !data.tenant?.isExpired) {
          costToday = 0; // Sudah aktif
        } else {
          costToday = Number(plugin.priceMonthly);
        }
      }
    }

    return {
      plugin,
      isSelected,
      wasAlreadyActive,
      price,
      costToday,
      isProrated11Months,
    };
  });

  const pluginsCostToday = pluginItemsCalculation.reduce((sum: number, item: any) => sum + item.costToday, 0);
  const totalPayToday = tierCostToday + pluginsCostToday;

  // Cek apakah ada perubahan dari kondisi saat ini
  const hasTierChange = selectedTierId !== currentTierId;
  const hasPluginChange =
    selectedPluginIds.length !== initialActivePluginIds.length ||
    selectedPluginIds.some((id) => !initialActivePluginIds.includes(id)) ||
    initialActivePluginIds.some((id) => !selectedPluginIds.includes(id));

  const hasAnyChange = hasTierChange || hasPluginChange || isCycleChanged || isTrial;



  // Handle Save Subscription Changes
  const handleSave = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await upgradeSubscriptionAction({
        licenseTierId: selectedTierId,
        billingCycle,
        selectedPluginIds,
      });

      if (res.success) {
        setSuccessMsg(
          "Paket lisensi & modul bisnis berhasil diperbarui! Fitur tambahan langsung aktif."
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
                <strong style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  {data.currentTier?.name || "Lisensi Basic"}
                </strong>
              </span>

              {isTrial ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Trial 30 Hari ({data.tenant?.daysRemaining ?? 30} Hari Tersisa)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Langganan Aktif ({currentBillingCycle === "ANNUAL" ? "Tahunan" : "Bulanan"})
                </span>
              )}

            </div>

            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
              Kelola Lisensi &amp; Modul Bisnis
            </h1>

            <p className="text-xs sm:text-sm max-w-2xl font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
              Upgrade paket untuk menambah kuota cabang dan kasir, atau tambahkan modul vertikal baru untuk memperluas operasional bisnis Anda tanpa mereset modul yang sudah aktif.
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

      {/* 2. Billing Cycle Switcher */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-1">
        <div
          className="flex items-center gap-1.5 p-1 rounded-2xl border shadow-sm"
          style={{
            backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
            borderColor: "var(--theme-card-border, #e2e8f0)",
          }}
        >
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className="px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            style={{
              backgroundColor: billingCycle === "MONTHLY" ? "var(--theme-card-bg, #ffffff)" : "transparent",
              color: billingCycle === "MONTHLY" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
            }}
          >
            Tagihan Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("ANNUAL")}
            className="px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: billingCycle === "ANNUAL" ? "var(--theme-card-bg, #ffffff)" : "transparent",
              color: billingCycle === "ANNUAL" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
            }}
          >
            <span>Tagihan Tahunan</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
              Hemat 17%
            </span>
          </button>
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
            Pilih paket yang Anda inginkan. Paket yang saat ini sudah Anda miliki ditandai dan tidak akan dikenakan biaya ganda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {availableTiers.map((tier: any) => {
            const isSelected = selectedTierId === tier.id;
            const isCurrentActive = tier.id === currentTierId && !isTrial && !isCycleChanged;
            const isCurrentTierOnNewCycle = tier.id === currentTierId && !isTrial && isCycleChanged;
            const price = isAnnual ? Number(tier.priceAnnual) : Number(tier.priceMonthly);
            const thisTierProratedCost = Math.max(0, Number(tier.priceAnnual) - Number(tier.priceMonthly));
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
                ) : isCurrentTierOnNewCycle ? (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 text-[10px] font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ganti ke Tahunan
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
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                      {tier.name}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {tier.code === "basic"
                        ? "Solusi ideal untuk 1 outlet usaha yang ingin serba otomatis."
                        : tier.code === "pro"
                        ? "Terbaik untuk usaha multi-cabang & tim kasir bertumbuh."
                        : "Skala franchise, enterprise, dan korporasi multi-gudang."}
                    </p>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                      {price === 0 && tier.code === "enterprise"
                        ? "Hubungi Sales"
                        : `Rp ${price.toLocaleString("id-ID")}`}
                    </div>
                    {price > 0 && (
                      <span className="text-[11px] font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                        /{isAnnual ? "tahun (hemat 17%)" : "bulan"}
                      </span>
                    )}
                  </div>

                  {/* Comprehensive & Authentic System Benefits List */}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Benefit &amp; Fitur Termasuk:
                    </span>
                    <ul className="text-xs space-y-2 font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                      {tier.code === "basic" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              <strong>1 Cabang Outlet</strong> Utama
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              <strong>5 Akun Kasir</strong> per Outlet
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Kasir POS Cepat &amp; Multi-Metode Bayar (QRIS, Tunai, Kartu)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Manajemen Produk &amp; Kategori Tanpa Batas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Manajemen Stok Produk &amp; Peringatan Stok Menipis</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Pencatatan Harga Pokok Penjualan (HPP / Modal)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Buka / Tutup Shift Kasir &amp; Rekap Kas Harian</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Laporan Penjualan &amp; Laba Rugi Outlet</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Kustomisasi Logo &amp; Cetak Struk Kasir Termal</span>
                          </li>
                        </>
                      )}

                      {tier.code === "pro" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              <strong>Hingga 10 Cabang Outlet</strong> Aktif
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              <strong>Unlimited Akun Kasir</strong> per Outlet
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              Hak Akses Role Admin Cabang Terisolasi
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              Laporan Konsolidasi Seluruh Cabang
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Laporan Komparatif Laba Rugi Antar-Cabang</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Monitoring Stok &amp; Mutasi Multi-Outlet</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Laporan Penjualan per Kasir &amp; Audit Transaksi</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Export Laporan Lengkap ke Excel / CSV / PDF</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Kustomisasi Layout POS &amp; Tema Dashboard</span>
                          </li>
                        </>
                      )}

                      {tier.code === "enterprise" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              <strong>Unlimited Cabang Outlet</strong> &amp; Gudang Pusat
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              <strong>Unlimited Akun Kasir</strong> &amp; Role Kustom
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              Akses Open API Sistem POS &amp; Webhook Realtime
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                              Integrasi Sistem ERP / Akuntansi Perusahaan
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Laporan Konsolidasi Holding &amp; Multi-Entitas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Manajemen Multi-Gudang &amp; Distribusi Terpusat</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Akses Bebas Semua Koleksi Tema &amp; Struk Premium</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Dedicated Database Instance &amp; Backup Prioritas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Dedicated Account Manager &amp; SLA 99.9% Uptime</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                            <span>Prioritas Training On-Site &amp; CS Support 24/7</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                </div>

                <div className="pt-4 mt-5 border-t" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  {isCurrentActive ? (
                    <span className="text-xs font-bold text-emerald-600 block text-center py-1">
                      Sudah Aktif (Rp 0)
                    </span>
                  ) : isCurrentTierOnNewCycle ? (
                    <span className="text-xs font-bold text-indigo-600 block text-center py-1">
                      Ganti ke Tahunan (Prorata 11 Bln): Rp {thisTierProratedCost.toLocaleString("id-ID")}
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-indigo-600 block text-center py-1">
                      {price === 0
                        ? "Pilih Lisensi Enterprise"
                        : `🚀 Upgrade ke Paket Ini (+Rp ${price.toLocaleString("id-ID")})`}
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
            Modul yang sudah Anda miliki tetap aktif. Anda bisa menambah modul vertikal lain (misal: Cafe + Barbershop) sebagai ekspansi bisnis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlugins.map((plugin: any) => {
            const isSelected = selectedPluginIds.includes(plugin.id);
            const wasAlreadyActive = initialActivePluginIds.includes(plugin.id);
            const isPluginActiveOnThisCycle = wasAlreadyActive && !isTrial && !isCycleChanged;
            const price = isAnnual ? Number(plugin.priceAnnual) : Number(plugin.priceMonthly);
            const isPluginProrated = isAnnual && wasAlreadyActive && isOngoingMonthlyActive;
            const itemProratedCost = Math.max(0, Number(plugin.priceAnnual) - Number(plugin.priceMonthly));

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
                {isPluginActiveOnThisCycle ? (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Dimiliki
                    </span>
                  </div>
                ) : isSelected ? (
                  <div className="absolute top-4 right-4" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                      <Plus className="w-3 h-3" /> {wasAlreadyActive ? "Ganti Tahunan" : "Tambahan Baru"}
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
                    <p className="text-[11px] line-clamp-2 mt-0.5 font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                      {plugin.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t mt-4 flex items-baseline justify-between" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  {isPluginActiveOnThisCycle ? (
                    <span className="text-xs font-bold text-emerald-600">
                      Aktif (Rp 0)
                    </span>
                  ) : (
                    <span className="text-xs font-black text-indigo-600">
                      {isPluginProrated
                        ? `Rp ${itemProratedCost.toLocaleString("id-ID")} (Prorata 11 Bln)`
                        : isAnnual
                        ? `Rp ${price.toLocaleString("id-ID")}`
                        : `+Rp ${price.toLocaleString("id-ID")}`}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                    /{isAnnual ? "thn" : "bln"}
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
            Rincian Tagihan Pembayaran Hari Ini
          </h3>
          <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            Hanya menghitung biaya paket upgrade atau modul tambahan baru yang Anda pilih.
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
                    ? `Upgrade ke ${selectedTier?.name || "Paket Baru"} (Bayar Penuh)`
                    : isAnnual && isOngoingMonthlyActive
                    ? "Konversi ke Tahunan (Prorata 11 Bulan karena 1 Bulan Sudah Dibayar)"
                    : isCycleChanged
                    ? `Konversi ke Siklus ${isAnnual ? "Tahunan (Hemat 17%)" : "Bulanan"}`
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
                    {item.isProrated11Months
                      ? "Konversi ke Tahunan (Prorata 11 Bulan karena 1 Bulan Sudah Dibayar)"
                      : isCycleChanged
                      ? `Konversi ke Tagihan ${isAnnual ? "Tahunan (1 Tahun Penuh)" : "Bulanan"}`
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
              Total Pembayaran Sekarang
            </span>
            <div className="text-3xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
              Rp {totalPayToday.toLocaleString("id-ID")}
              <span className="text-xs font-medium ml-1" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                /{isAnnual ? "tahun" : "bulan"}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
              {selectedPluginIds.length} Modul Vertikal akan aktif pada akun Anda.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || (!hasAnyChange && totalPayToday === 0)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-extrabold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Perubahan...</span>
              </>
            ) : !hasAnyChange && totalPayToday === 0 ? (
              <>
                <Check className="w-4 h-4" />
                <span>Paket &amp; Modul Sudah Sesuai</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>
                  {totalPayToday > 0
                    ? `Bayar & Aktifkan Perubahan (Rp ${totalPayToday.toLocaleString("id-ID")})`
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
