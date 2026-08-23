"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Coffee,
  Shirt,
  ShoppingBag,
  Store,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  setupTenantIndustryVerticalAction,
  VerticalIndustryType,
} from "@/modules/onboarding/actions";
import { toastSuccess, toastError } from "@/lib/swal";

const VERTICAL_OPTIONS: Array<{
  id: VerticalIndustryType;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
  features: string[];
}> = [
  {
    id: "BARBERSHOP",
    title: "Barbershop & Salon",
    subtitle: "Pangkas rambut pria, hair styling, creambath, & salon perawatan",
    icon: Scissors,
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-600",
    badge: "Stylist & Kursi Pangkas",
    features: [
      "Manajemen Antrean & Kursi Pangkas",
      "Kalkulasi Komisi Kapster Otomatis",
      "Input Tip Kapster & Booking QR",
    ],
  },
  {
    id: "CAFE",
    title: "Cafe & Resto (F&B)",
    subtitle: "Coffee shop, resto kuliner, bakery, & gerai minuman kekinian",
    icon: Coffee,
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-600",
    badge: "Denah Meja & Kitchen KOT",
    features: [
      "Visual Denah Meja & Area Zone (Indoor/Outdoor)",
      "Cetak Slip Dapur (KOT) & Split Bill Kasir",
      "Pajak Resto PB1 (10%) & Service Charge Otomatis",
    ],
  },
  {
    id: "LAUNDRY",
    title: "Laundry Kiloan & Satuan",
    subtitle: "Jasa cuci kiloan, dry cleaning, setrika, & laundry sepatu/bedcover",
    icon: Shirt,
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-600",
    badge: "Timbangan & Nomor Rak",
    features: [
      "Alur Timbangan Kg / Satuan Pcs & Varian Parfum",
      "Nomor Rak Penyimpanan & Estimasi Selesai",
      "Klaim Nota Pengambilan Cucian & WA Reminder",
    ],
  },
  {
    id: "RETAIL",
    title: "Retail & Supermarket",
    subtitle: "Toko kelontong, minimarket, toko fashion, kosmetik, & ATK",
    icon: ShoppingBag,
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-600",
    badge: "Barcode Cepat & PPN 11%",
    features: [
      "Scanner Barcode Cepat & Multi-Satuan UOM",
      "Peringatan Batas Minimum Stok (Low-Stock Alert)",
      "Poin Loyalitas Member & Rincian PPN Pajak",
    ],
  },
];

export function OnboardingClient({
  initialData,
}: {
  initialData: {
    businessName: string;
    outletName: string;
    address: string;
    activeVertical: string;
  };
}) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedVertical, setSelectedVertical] = useState<VerticalIndustryType>(
    (initialData.activeVertical as VerticalIndustryType) || "RETAIL"
  );
  const [businessName, setBusinessName] = useState(initialData.businessName || "");
  const [outletName, setOutletName] = useState(initialData.outletName || "Cabang Utama");
  const [address, setAddress] = useState(initialData.address || "");
  const [phone, setPhone] = useState("");
  const [seedSampleData, setSeedSampleData] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toastError("Nama bisnis wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await setupTenantIndustryVerticalAction({
        businessName: businessName.trim(),
        outletName: outletName.trim() || "Cabang Utama",
        address: address.trim(),
        phone: phone.trim(),
        vertical: selectedVertical,
        seedSampleData,
      });

      if (res.success) {
        toastSuccess("🎉 Setup industri bisnis Anda berhasil diselesaikan!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (err: any) {
      toastError(err.message || "Gagal menyelesaikan onboarding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Wizard Setup Bisnis Baru
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Pilih Bidang Industri Usaha Anda
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Sistem POS Universal akan mengonfigurasi katalog produk awal, alur kasir, dan format struk sesuai bidang bisnis Anda.
          </p>
        </div>

        {/* Step 1: Pilih Vertikal Industri */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VERTICAL_OPTIONS.map((v) => {
                const Icon = v.icon;
                const isSelected = selectedVertical === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVertical(v.id)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-indigo-600 shadow-xl ring-2 ring-indigo-500/20"
                        : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}

                    <div className="space-y-2">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center border shadow-xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-base">{v.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">
                          {v.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      {v.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Lanjutkan ke Profil Bisnis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Lengkapi Profil Bisnis & Preset Data */}
        {step === 2 && (
          <form onSubmit={handleSubmitSetup} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">Konfigurasi Toko &amp; Outlet</h3>
                <p className="text-xs text-slate-500">
                  Vertikal Terpilih: <strong className="text-indigo-600">{selectedVertical}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600"
              >
                &larr; Ganti Industri
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Store className="w-4 h-4 text-indigo-500" />
                  Nama Bisnis / Usaha *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Kopi Nusantara / Barbershop Ganteng / Laundry Bersih"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Nama Cabang / Outlet Utama
                </label>
                <input
                  type="text"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  placeholder="Contoh: Cabang Utama / Outlet 01"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  Nomor Telepon / WhatsApp Struk
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  Alamat Fisik Outlet
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Sudirman No. 45, Jakarta Pusat"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Checklist Starter Pack */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-start gap-3">
              <input
                type="checkbox"
                id="seedCheck"
                checked={seedSampleData}
                onChange={(e) => setSeedSampleData(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="seedCheck" className="text-xs cursor-pointer">
                <strong className="text-slate-900 dark:text-slate-100 block">
                  Suntikkan Katalog &amp; Konfigurasi Starter Pack Otomatis (Direkomendasikan)
                </strong>
                <span className="text-slate-500 block mt-0.5">
                  Secara otomatis membuat contoh produk terlaris, kategori, denah meja / kursi, dan layout POS sesuai industri {selectedVertical}.
                </span>
              </label>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Sistem...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Selesaikan Setup &amp; Buka Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
