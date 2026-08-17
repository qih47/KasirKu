"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  CreditCard,
  Building,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { registerTenantAndOwner } from "@/modules/auth/actions";

export function RegisterClient({
  dbTiers = [],
  dbPlugins = [],
  initialPlan,
  initialBilling = "MONTHLY",
}: {
  dbTiers: any[];
  dbPlugins: any[];
  initialPlan?: string;
  initialBilling?: "MONTHLY" | "ANNUAL";
}) {
  const router = useRouter();

  // Mode Pendaftaran: "TRIAL" vs "PAID" (Jalur Resmi Berbayar)
  const isPaidInitial = initialPlan && initialPlan.toLowerCase() !== "trial";
  const [planType, setPlanType] = useState<"TRIAL" | "PAID">(isPaidInitial ? "PAID" : "TRIAL");

  // State Pilihan Lisensi & Modul
  const defaultTierCode = initialPlan?.toLowerCase() || "basic";
  const [selectedTierCode, setSelectedTierCode] = useState<string>(
    dbTiers.find((t) => t.code === defaultTierCode)?.code || "basic"
  );
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">(initialBilling);

  // State Plugins yang dipilih (Default: barbershop & cafe)
  const [selectedPluginCodes, setSelectedPluginCodes] = useState<string[]>(["barbershop"]);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper Icon Plugin
  const getPluginIcon = (code: string) => {
    switch (code.toLowerCase()) {
      case "barbershop":
        return Scissors;
      case "cafe":
        return Coffee;
      case "retail":
        return ShoppingBag;
      case "laundry":
        return Shirt;
      default:
        return Store;
    }
  };

  // Kalkulasi Harga Resmi Real-Time
  const currentTierObj = useMemo(() => {
    return (
      dbTiers.find((t) => t.code === selectedTierCode) ||
      dbTiers[0] || {
        name: "Lisensi Basic",
        priceMonthly: 150000,
        priceAnnual: 1494000,
        outletLimit: 1,
        kasirLimitPerOutlet: 5,
      }
    );
  }, [dbTiers, selectedTierCode]);

  const calculation = useMemo(() => {
    const isAnnual = billingCycle === "ANNUAL";
    const monthlyTier = Number(currentTierObj.priceMonthly) || 0;
    const annualTier = Number(currentTierObj.priceAnnual) || Math.round(monthlyTier * 12 * 0.83);

    let monthlyPlugins = 0;
    let annualPlugins = 0;

    selectedPluginCodes.forEach((pCode) => {
      const p = dbPlugins.find((item) => item.code === pCode);
      if (p) {
        monthlyPlugins += Number(p.priceMonthly) || 0;
        annualPlugins += Number(p.priceAnnual) || Math.round((Number(p.priceMonthly) || 0) * 12 * 0.83);
      }
    });

    const totalMonthly = monthlyTier + monthlyPlugins;
    const totalAnnual = annualTier + annualPlugins;
    const finalAmount = isAnnual ? totalAnnual : totalMonthly;
    const totalSavings = Math.max(0, totalMonthly * 12 - totalAnnual);

    return {
      monthlyTier,
      annualTier,
      monthlyPlugins,
      annualPlugins,
      totalMonthly,
      totalAnnual,
      finalAmount,
      totalSavings,
      effectiveMonthly: isAnnual ? Math.round(totalAnnual / 12) : totalMonthly,
    };
  }, [currentTierObj, selectedPluginCodes, dbPlugins, billingCycle]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await registerTenantAndOwner({
        businessName,
        ownerName,
        email,
        password,
        verticalCode: selectedPluginCodes[0] || "barbershop",
        planType,
        tierCode: selectedTierCode,
        billingCycle,
        pluginCodes: selectedPluginCodes,
      });

      if (!res.success) {
        setError(res.message || "Gagal melakukan pendaftaran.");
        setLoading(false);
        return;
      }

      // Auto login setelah registrasi berhasil
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses registrasi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/25">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-950">
                POS Universal
              </span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                Registrasi Akun
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sudah punya akun?</span>
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Masuk di sini
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Top Toggle: Trial vs Jalur Resmi Berbayar */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Pendaftaran Akun POS Universal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Pilih jalur pendaftaran sesuai kebutuhan operasional usaha Anda:
          </p>

          {/* Mode Switcher */}
          <div className="p-1 rounded-full bg-white border border-slate-200 shadow-sm inline-flex items-center gap-1 text-xs font-bold mt-2">
            <button
              type="button"
              onClick={() => setPlanType("TRIAL")}
              className={`px-5 py-2.5 rounded-full transition flex items-center gap-1.5 ${
                planType === "TRIAL"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jalur Trial 30 Hari (Gratis)</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanType("PAID")}
              className={`px-5 py-2.5 rounded-full transition flex items-center gap-1.5 ${
                planType === "PAID"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Jalur Resmi Langganan Berbayar</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
                Langsung Aktif
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Data Bisnis & Akun Pemilik) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                1. Informasi Usaha & Akun Pemilik
              </h2>
              <p className="text-xs text-slate-500">
                Akun ini akan otomatis menjadi <strong>OWNER</strong> dengan hak kontrol penuh.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nama Bisnis / Toko / Outlet Utama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Barbershop Batavia, Kopi Kenangan, Minimarket Berkah"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-semibold text-slate-900 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nama Pemilik (Owner) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap Anda"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Email Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@bisnisanda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Password Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 transition"
                />
              </div>
            </div>

            {/* Modul Add-on Selection */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block font-bold text-slate-950 text-xs uppercase tracking-wider">
                2. Pilih Modul Usaha Vertikal yang Diaktifkan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dbPlugins.map((p) => {
                  const Icon = getPluginIcon(p.code);
                  const isChecked = selectedPluginCodes.includes(p.code);
                  const pPrice = Number(p.priceMonthly);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPluginCodes((prev) =>
                          isChecked
                            ? prev.length > 1
                              ? prev.filter((c) => c !== p.code)
                              : prev
                            : [...prev, p.code]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        isChecked
                          ? "bg-indigo-50/70 border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isChecked ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.description}</p>
                        </div>
                      </div>
                      {planType === "PAID" && (
                        <span className="text-xs font-bold text-indigo-600">
                          +Rp {pPrice.toLocaleString("id-ID")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (Pilihan Paket & Ringkasan Tagihan) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Jika Jalur Resmi: Tampilkan Selektor Paket Lisensi & Billing */}
            {planType === "PAID" ? (
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-5 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    3. Pilih Paket Lisensi Resmi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akun langsung berstatus <strong>ACTIVE</strong> resmi.
                  </p>
                </div>

                {/* Billing Switcher */}
                <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("MONTHLY")}
                    className={`flex-1 py-2 rounded-lg transition text-center ${
                      billingCycle === "MONTHLY" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("ANNUAL")}
                    className={`flex-1 py-2 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                      billingCycle === "ANNUAL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    <span>Tahunan</span>
                    <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">
                      -17%
                    </span>
                  </button>
                </div>

                {/* Tier Selector Cards */}
                <div className="space-y-2.5">
                  {dbTiers.map((tier) => {
                    const isSel = selectedTierCode === tier.code;
                    const monthlyNum = Number(tier.priceMonthly);
                    const annualNum =
                      Number(tier.priceAnnual) || Math.round(monthlyNum * 12 * 0.83);
                    const displayAmt = billingCycle === "ANNUAL" ? annualNum : monthlyNum;

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierCode(tier.code)}
                        className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSel
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border-indigo-600"
                            : "bg-[#FAFAFC] border-slate-200 hover:border-slate-300 text-slate-900"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{tier.name}</span>
                            {tier.code === "pro" && (
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  isSel ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                Populer ⭐
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isSel ? "text-indigo-100" : "text-slate-500"}`}>
                            {tier.outletLimit ? `${tier.outletLimit} Outlet` : "Unlimited Outlet"} &bull;{" "}
                            {tier.kasirLimitPerOutlet ? `${tier.kasirLimitPerOutlet} Kasir` : "Unlimited Kasir"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xs">
                            {monthlyNum === 0 ? "Custom" : `Rp ${displayAmt.toLocaleString("id-ID")}`}
                          </p>
                          <span className={`text-[10px] ${isSel ? "text-indigo-200" : "text-slate-400"}`}>
                            {billingCycle === "ANNUAL" ? "/ thn" : "/ bln"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Total Billing Breakdown */}
                <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{currentTierObj.name} ({billingCycle === "ANNUAL" ? "1 Tahun" : "1 Bulan"}):</span>
                    <span className="font-semibold">
                      Rp {(billingCycle === "ANNUAL" ? calculation.annualTier : calculation.monthlyTier).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Add-on ({selectedPluginCodes.length} modul):</span>
                    <span className="font-semibold">
                      +Rp {(billingCycle === "ANNUAL" ? calculation.annualPlugins : calculation.monthlyPlugins).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {billingCycle === "ANNUAL" && (
                    <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-200">
                      <span>Hemat Diskon Tahunan:</span>
                      <span>-Rp {calculation.totalSavings.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">TOTAL TAGIHAN:</span>
                    <span className="text-xl font-black text-indigo-600">
                      Rp {calculation.finalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Jalur Trial 30 Hari Summary Card */
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">Ringkasan Trial</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    100% Gratis Coba
                  </span>
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-900">Rp 0</p>
                  <p className="text-xs text-slate-500">Masa aktif 30 hari penuh tanpa kartu kredit.</p>
                </div>

                <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Akses Modul ({selectedPluginCodes.join(", ")})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Layar Kasir POS, Shift & Barcode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Bebas upgrade ke paket berbayar kapan saja</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Pendaftaran...</span>
                </>
              ) : planType === "PAID" ? (
                <>
                  <span>Aktifkan Langganan Resmi Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Mulai Uji Coba Gratis 30 Hari</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500">
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan POS Universal.
            </p>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        POS Universal SaaS Platform &copy; 2026. Jalur Pendaftaran Resmi & Trial 30 Hari.
      </footer>
    </div>
  );
}
