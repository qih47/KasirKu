"use client";

import { useState } from "react";
import {
  Settings,
  Store,
  Printer,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ArrowUpRight,
  Receipt,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { updateTenantBrandingAction } from "@/modules/tenant/settings-actions";

interface SettingsClientProps {
  data: {
    tenantId: string;
    businessName: string;
    receiptHeader: string | null;
    receiptFooter: string | null;
    isTrial: boolean;
    tierName: string;
    canCustomBrand: boolean;
  };
}

export function SettingsClient({ data }: SettingsClientProps) {
  const [businessName, setBusinessName] = useState(data.businessName || "");
  const [receiptHeader, setReceiptHeader] = useState(
    data.receiptHeader || "Terima kasih atas kunjungan Anda!"
  );
  const [receiptFooter, setReceiptFooter] = useState(
    data.receiptFooter || "Barang yang sudah dibeli tidak dapat ditukar."
  );

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.isTrial) return;

    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await updateTenantBrandingAction({
        businessName,
        receiptHeader,
        receiptFooter,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui branding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header - Clean White Surface */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-100">
            <Settings className="w-3.5 h-3.5" />
            Pengaturan Toko & Custom Branding
          </div>
          <h1 className="text-2xl font-black text-slate-950">
            Identitas Brand & Tampilan Struk
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Status Paket Saat Ini:{" "}
            <strong className="text-slate-900 font-bold">
              {data.tierName}
            </strong>
          </p>
        </div>

        {data.isTrial ? (
          <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Terkunci di Mode Trial</span>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lisensi Aktif (Custom Branding Terbuka)</span>
          </div>
        )}
      </div>

      {/* Trial Restriction Notice (jika masih trial) */}
      {data.isTrial && (
        <div className="p-6 sm:p-7 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-950">
                Fitur Custom Branding & Logo Eksklusif untuk Lisensi Berbayar
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl font-medium leading-relaxed">
                Selama masa <strong>Trial 30 Hari</strong>, nama brand & struk dikunci dengan nama registrasi awal. Beli / aktifkan paket <strong>Lisensi Basic / Pro / Enterprise</strong> untuk membuka kebebasan kustomisasi logo, nama usaha, dan header/footer struk belanja.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/subscription"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Beli Paket Langganan</span>
          </Link>
        </div>
      )}

      {/* Main Grid: Form Edit Branding & Live Receipt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Branding - Clean White */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              Profil Brand Toko
            </h3>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil disimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Nama Brand / Toko *
              </label>
              <input
                type="text"
                disabled={data.isTrial}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nama ini akan dicetak di baris paling atas struk thermal.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Header Struk Kasir (Catatan Pembuka)
              </label>
              <input
                type="text"
                disabled={data.isTrial}
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dicetak di bawah nama toko (Misal: Jl. Sudirman No. 45).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Footer Struk Kasir (Catatan Penutup)
              </label>
              <input
                type="text"
                disabled={data.isTrial}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dicetak di paling bawah struk kasir.
              </p>
            </div>

            {!data.isTrial && (
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Pengaturan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Live Struk Thermal Preview - Clean White Card */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-950 flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-600" />
              Live Preview Struk 58mm
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Thermal Print Preview
            </span>
          </div>

          {/* Struk Thermal Paper Mockup - Crisp Minimal White Surface */}
          <div className="p-6 bg-[#FAFAFC] border border-dashed border-slate-300 rounded-2xl font-mono text-xs text-slate-900 space-y-3 shadow-inner">
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h4 className="font-black text-sm uppercase tracking-tight text-slate-950">
                {businessName || "POS UNIVERSAL"}
              </h4>
              <p className="text-[10px] text-slate-500">{receiptHeader}</p>
            </div>

            <div className="text-[11px] space-y-0.5 text-slate-600 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>No: #INV-20260817-001</span>
                <span>14:30 WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: Hendra</span>
                <span>Outlet Utama</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[11px]">
              <div className="flex justify-between">
                <span>1x Gentlemen Haircut</span>
                <span>Rp 65.000</span>
              </div>
              <div className="flex justify-between">
                <span>2x Iced Caramel Macchiato</span>
                <span>Rp 64.000</span>
              </div>
            </div>

            <div className="text-xs font-bold space-y-1 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between text-slate-950">
                <span>TOTAL:</span>
                <span>Rp 129.000</span>
              </div>
              <div className="flex justify-between text-slate-500 font-normal text-[11px]">
                <span>TUNAI:</span>
                <span>Rp 150.000</span>
              </div>
              <div className="flex justify-between text-slate-500 font-normal text-[11px]">
                <span>KEMBALI:</span>
                <span>Rp 21.000</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1">
              <p>{receiptFooter}</p>
              <p className="text-[9px] text-slate-400 font-sans">
                Powered by POS Universal SaaS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
