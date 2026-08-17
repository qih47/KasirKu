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
  Building,
} from "lucide-react";
import { upgradeSubscriptionAction } from "@/modules/subscription/actions";

interface SubscriptionClientProps {
  initialData?: any;
  data?: any;
}

export function SubscriptionClient({ initialData, data: propData }: SubscriptionClientProps) {
  const data = initialData || propData || {
    tenant: { status: "TRIAL", daysRemaining: 30 },
    currentSubscription: { billingCycle: "MONTHLY" },
    currentTier: { name: "Lisensi Basic" },
    activePluginIds: [],
    availableTiers: [],
    availablePlugins: [],
    quota: {
      outletsUsed: 1,
      outletLimit: 1,
      cashiersUsed: 1,
      kasirLimit: 5,
    },
  };

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">(
    data.currentSubscription?.billingCycle || "MONTHLY"
  );
  const [selectedTierId, setSelectedTierId] = useState<string>(
    data.currentTier?.id || data.availableTiers?.[0]?.id || ""
  );
  const [selectedPluginIds, setSelectedPluginIds] = useState<string[]>(
    data.activePluginIds || []
  );

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAnnual = billingCycle === "ANNUAL";

  // Toggle Plugin Selection
  const togglePlugin = (pluginId: string) => {
    setSelectedPluginIds((prev) =>
      prev.includes(pluginId)
        ? prev.filter((id) => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  // Kalkulasi Total Biaya
  const availableTiers = data.availableTiers || [];
  const availablePlugins = data.availablePlugins || [];

  const selectedTier = availableTiers.find((t: any) => t.id === selectedTierId);
  const tierPrice = selectedTier
    ? isAnnual
      ? Number(selectedTier.priceAnnual)
      : Number(selectedTier.priceMonthly)
    : 0;

  const pluginsPrice = selectedPluginIds.reduce((sum, pid) => {
    const plugin = availablePlugins.find((p: any) => p.id === pid);
    if (!plugin) return sum;
    const price = isAnnual
      ? Number(plugin.priceAnnual)
      : Number(plugin.priceMonthly);
    return sum + price;
  }, 0);

  const totalCalculatedPrice = tierPrice + pluginsPrice;

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
          "Paket lisensi & modul plugin berhasil diperbarui! Perubahan fitur langsung aktif."
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

  return (
    <div className="space-y-8 text-left">
      {/* Hero Overview - Clean Material 3 White Surface */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Status Lisensi:{" "}
                <strong className="text-slate-950 font-black">
                  {data.currentTier?.name || "Lisensi Basic"}
                </strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              {data.tenant?.status === "TRIAL"
                ? `Masa Percobaan Trial Gratis (${data.tenant?.daysRemaining ?? 30} Hari Tersisa)`
                : "Langganan Aktif"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-medium">
              Tingkatkan paket lisensi Anda untuk menambah cabang outlet & kuota
              kasir, serta aktifkan modul plugin vertikal spesifik bisnis Anda.
            </p>
          </div>

          {/* Quota Stats Box - Clean Light */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8F9FD] border border-slate-200 text-xs w-full md:w-auto">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Store className="w-3 h-3" /> Cabang Outlet
              </span>
              <p className="text-sm font-black text-slate-950">
                {data.quota?.outletsUsed ?? 1} / {data.quota?.outletLimit ?? "Unlimited"}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Kuota Kasir
              </span>
              <p className="text-sm font-black text-slate-950">
                {data.quota?.cashiersUsed ?? 1} / {data.quota?.kasirLimit ?? "Unlimited"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Billing Cycle Switcher */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-2">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
              billingCycle === "MONTHLY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Tagihan Bulanan
          </button>
          <button
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              billingCycle === "ANNUAL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Tagihan Tahunan</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
              Hemat 17%
            </span>
          </button>
        </div>
      </div>

      {/* Section 1: Tier Selection Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          1. Pilih Paket Lisensi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {availableTiers.map((tier: any) => {
            const isSelected = selectedTierId === tier.id;
            const price = isAnnual
              ? Number(tier.priceAnnual)
              : Number(tier.priceMonthly);

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                className={`p-6 rounded-3xl border transition cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-md"
                    : "bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-indigo-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                <div className="space-y-3">
                  <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                    {tier.name}
                  </span>

                  <div>
                    <div className="text-2xl font-black text-slate-950">
                      Rp {price.toLocaleString("id-ID")}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      /{isAnnual ? "tahun" : "bulan"}
                    </span>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>
                        {tier.outletLimit
                          ? `${tier.outletLimit} Cabang Outlet`
                          : "Unlimited Outlet"}
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{tier.kasirLimitPerOutlet} Kasir per Outlet</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Multi-Shift & Laporan Laba Rugi</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Plugin Modul Selection */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          2. Tambah Modul Vertikal (Plugin Add-Ons)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlugins.map((plugin: any) => {
            const isSelected = selectedPluginIds.includes(plugin.id);
            const price = isAnnual
              ? Number(plugin.priceAnnual)
              : Number(plugin.priceMonthly);

            return (
              <div
                key={plugin.id}
                onClick={() => togglePlugin(plugin.id)}
                className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-md"
                    : "bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-indigo-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F8F9FD] border border-slate-200 flex items-center justify-center">
                    {getPluginIcon(plugin.code)}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-950">
                      {plugin.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-medium">
                      {plugin.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-4 flex items-baseline justify-between">
                  <span className="text-xs font-black text-indigo-600">
                    +Rp {price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    /{isAnnual ? "thn" : "bln"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer & Action Button */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Total Estimasi Investasi
          </span>
          <div className="text-3xl font-black text-slate-950">
            Rp {totalCalculatedPrice.toLocaleString("id-ID")}
            <span className="text-xs font-medium text-slate-400 ml-1">
              /{isAnnual ? "tahun" : "bulan"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedPluginIds.length} Modul Plugin aktif terpilih.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Perubahan...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Simpan & Aktifkan Paket Baru</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
