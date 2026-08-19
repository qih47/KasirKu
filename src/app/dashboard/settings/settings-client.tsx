"use client";

import { useState } from "react";
import {
  Store,
  Printer,
  CheckCircle2,
  Save,
  Loader2,
  Image as ImageIcon,
  QrCode,
  Wifi,
  Instagram,
  Sparkles,
  Palette,
  Monitor,
  Phone,
  MapPin,
  FileText,
  Percent,
  Check,
  ArrowRight,
  ExternalLink,
  Upload,
  Link2,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
  Globe,
  Tag,
  Utensils,
  Receipt,
} from "lucide-react";
import { updateTenantBrandingAction } from "@/modules/tenant/settings-actions";
import { ReceiptConfig, defaultReceiptConfig } from "@/types/receipt";
import Link from "next/link";

interface SettingsClientProps {
  initialData: {
    tenantId: string;
    businessName: string;
    logoUrl?: string | null;
    receiptConfig: ReceiptConfig;
    detectedVertical: string;
    isTrial: boolean;
    isPaidActive: boolean;
    tierName: string;
    canCustomBrand: boolean;
    hasReceiptProPlugin: boolean;
    primaryOutlet?: any;
    ownedUiThemes: { id: string; code: string; name: string; priceMonthly: number }[];
    ownedPosLayouts: { id: string; name: string; vertical: string }[];
    ownedReceiptThemes: { id: string; name: string; vertical: string }[];
    activeUiThemeId: string | null;
    activePosLayout: string;
    activeReceiptTemplate: string;
  };
}

export function SettingsClient({ initialData }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"BRANDING" | "THEMES" | "RECEIPT">("BRANDING");

  // Form State
  const [businessName, setBusinessName] = useState(initialData.businessName || "");
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || "");
  const [logoMode, setLogoMode] = useState<"UPLOAD" | "LINK">("UPLOAD");

  const [phone, setPhone] = useState(initialData.primaryOutlet?.phone || initialData.receiptConfig?.phone || "");
  const [address, setAddress] = useState(initialData.primaryOutlet?.address || "");

  // Theme Selectors State (Only Owned)
  const [activeUiThemeId, setActiveUiThemeId] = useState(initialData.activeUiThemeId || initialData.ownedUiThemes?.[0]?.id || "");
  const [activePosLayout, setActivePosLayout] = useState(initialData.activePosLayout || "DEFAULT");
  const [activeReceiptTemplate, setActiveReceiptTemplate] = useState(initialData.activeReceiptTemplate || "DEFAULT");

  // Advance Customizer Accordion State
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(initialData.hasReceiptProPlugin || false);

  // Multi-Social Media State
  const [socialInstagram, setSocialInstagram] = useState((initialData.receiptConfig as any)?.socialMediaInstagram || "");
  const [socialTiktok, setSocialTiktok] = useState((initialData.receiptConfig as any)?.socialMediaTiktok || "");
  const [socialWebsite, setSocialWebsite] = useState((initialData.receiptConfig as any)?.socialMediaWebsite || "");

  // Receipt Config State
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    ...defaultReceiptConfig,
    ...(initialData.receiptConfig || {}),
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfigChange = (key: keyof ReceiptConfig, value: any) => {
    setReceiptConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file gambar maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/webp", 0.88);
          setLogoUrl(compressedDataUrl);
          setErrorMsg(null);
        } else {
          setLogoUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!businessName.trim()) {
      setErrorMsg("Nama brand / bisnis tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await updateTenantBrandingAction({
        businessName: businessName.trim(),
        logoUrl: logoUrl.trim() || null,
        phone: phone.trim(),
        address: address.trim(),
        activeUiThemeId: activeUiThemeId || undefined,
        activePosLayout,
        activeReceiptTemplate,
        receiptConfig: {
          ...receiptConfig,
          phone: phone.trim(),
          logoUrl: logoUrl.trim() || null,
          templateStyle: activeReceiptTemplate as any,
          ...({
            socialMediaInstagram: socialInstagram.trim() || undefined,
            socialMediaTiktok: socialTiktok.trim() || undefined,
            socialMediaWebsite: socialWebsite.trim() || undefined,
          } as any),
        },
      });

      if (res.success) {
        setSuccessMsg("Pengaturan berhasil disimpan dan langsung disinkronkan ke seluruh sistem!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  // Sample items for thermal live preview
  const sampleItems = [
    { name: "Kopi Susu Gula Aren", qty: 1, price: 22000, mods: ["Normal Ice", "Less Sweet"] },
    { name: "Iced Caramel Macchiato", qty: 1, price: 28000, mods: ["Extra Shot"] },
    { name: "Butter Croissant", qty: 1, price: 24000 },
  ];
  const subtotal = sampleItems.reduce((acc, i) => acc + i.qty * i.price, 0);
  const taxAmount = receiptConfig.showTax ? Math.round((subtotal * (receiptConfig.taxPercent || 11)) / 100) : 0;
  const pb1Amount = receiptConfig.showPb1 ? Math.round((subtotal * (receiptConfig.pb1Percent || 10)) / 100) : 0;
  const serviceAmount = receiptConfig.showServiceCharge ? Math.round((subtotal * (receiptConfig.servicePercent || 5)) / 100) : 0;
  const discountAmount = receiptConfig.showDiscount ? Math.round((subtotal * (receiptConfig.discountPercent || 10)) / 100) : 0;
  const totalBill = subtotal + taxAmount + pb1Amount + serviceAmount - discountAmount;

  // Active Receipt Theme Blueprint Helper
  const isRetailTheme = activeReceiptTemplate.toLowerCase().includes("retail") || activeReceiptTemplate.toLowerCase().includes("barcode") || activeReceiptTemplate.toLowerCase().includes("58mm");
  const isBarberTheme = activeReceiptTemplate.toLowerCase().includes("barber") || activeReceiptTemplate.toLowerCase().includes("vintage");
  const isLaundryTheme = activeReceiptTemplate.toLowerCase().includes("laundry");
  const isCafeTheme = !isRetailTheme && !isBarberTheme && !isLaundryTheme; // Default is Cafe / F&B

  return (
    <div className="space-y-6 text-left font-sans max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 border shadow-sm transition-all"
        style={{
          backgroundColor: "var(--theme-card-bg, #ffffff)",
          borderColor: "var(--theme-card-border, #e2e8f0)",
          borderRadius: "var(--theme-radius, 1.5rem)",
          boxShadow: "var(--theme-card-shadow, 0 4px 20px rgba(0,0,0,0.03))",
        }}
      >
        <div className="space-y-1">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
            style={{
              backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
              color: "var(--theme-primary, #4f46e5)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
            }}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profil Bisnis &amp; Identitas Kasir</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
            Pengaturan Sistem
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
            Kelola profil bisnis, logo, tema aktif, dan format cetak struk kasir.
          </p>
        </div>

        {/* 3 Tab Navigation Switcher */}
        <div
          className="flex items-center gap-1 p-1 border overflow-x-auto max-w-full"
          style={{
            backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
            borderColor: "var(--theme-card-border, #e2e8f0)",
            borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.7)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("BRANDING")}
            className="px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
              backgroundColor: activeTab === "BRANDING" ? "var(--theme-card-bg, #ffffff)" : "transparent",
              color: activeTab === "BRANDING" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
              boxShadow: activeTab === "BRANDING" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profil &amp; Branding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("THEMES")}
            className="px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
              backgroundColor: activeTab === "THEMES" ? "var(--theme-card-bg, #ffffff)" : "transparent",
              color: activeTab === "THEMES" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
              boxShadow: activeTab === "THEMES" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema &amp; Tampilan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RECEIPT")}
            className="px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            style={{
              borderRadius: "calc(var(--theme-radius, 1.5rem) * 0.5)",
              backgroundColor: activeTab === "RECEIPT" ? "var(--theme-card-bg, #ffffff)" : "transparent",
              color: activeTab === "RECEIPT" ? "var(--theme-primary, #4f46e5)" : "var(--theme-text-secondary, #64748b)",
              boxShadow: activeTab === "RECEIPT" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Konfigurasi Struk</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* TAB 1: PROFIL & BRANDING */}
      {activeTab === "BRANDING" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-2 p-6 sm:p-7 border shadow-sm space-y-6"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
            }}
          >
            <div className="border-b pb-3 space-y-1" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
              <h2 className="text-base font-black flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                <Store className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
                Identitas Bisnis &amp; Kontak
              </h2>
              <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                Informasi ini otomatis tampil pada navbar dashboard, layar kasir POS, dan kop cetak struk.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  Nama Bisnis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Kopi Senja Nusantara"
                  className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                  style={{
                    backgroundColor: "var(--theme-input-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, #e2e8f0)",
                    color: "var(--theme-text-primary, #0f172a)",
                  }}
                  required
                />
              </div>

              {/* Dual Logo Option: File Upload vs URL Link */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Logo Bisnis</span>
                  </label>

                  {/* Mode Switcher */}
                  <div
                    className="flex items-center gap-1 p-0.5 border rounded-lg"
                    style={{
                      backgroundColor: "var(--theme-inner-bg, #f1f5f9)",
                      borderColor: "var(--theme-card-border, #e2e8f0)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setLogoMode("UPLOAD")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                        logoMode === "UPLOAD"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode("LINK")}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                        logoMode === "LINK"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Link URL</span>
                    </button>
                  </div>
                </div>

                {logoMode === "UPLOAD" ? (
                  <div className="space-y-2">
                    <label
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer hover:border-indigo-500 transition group"
                      style={{
                        backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                        borderColor: "var(--theme-card-border, #e2e8f0)",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                        Klik untuk Pilih Logo dari Perangkat
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                        Format PNG, JPG, WebP, SVG (Otomatis Dioptimasi)
                      </p>
                    </label>

                    {logoUrl && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl border" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover border" />
                          <span className="text-[11px] font-bold truncate" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                            Logo Berhasil Dipasang
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Logo</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://domain.com/logo-toko.png"
                        className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                        style={{
                          backgroundColor: "var(--theme-input-bg, #ffffff)",
                          borderColor: "var(--theme-card-border, #e2e8f0)",
                          color: "var(--theme-text-primary, #0f172a)",
                        }}
                      />
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="px-3 py-2 rounded-xl text-xs font-bold border hover:bg-rose-500/10 text-rose-500 transition"
                          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[11px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                  💡 Logo persegi 1:1 otomatis sinkron ke pojok kiri atas Dashboard, kasir POS, dan kop struk.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>No. WhatsApp / Telepon</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                    style={{
                      backgroundColor: "var(--theme-input-bg, #ffffff)",
                      borderColor: "var(--theme-card-border, #e2e8f0)",
                      color: "var(--theme-text-primary, #0f172a)",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Alamat Outlet Utama</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Sudirman No. 45, Jakarta Selatan"
                    className="w-full px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                    style={{
                      backgroundColor: "var(--theme-input-bg, #ffffff)",
                      borderColor: "var(--theme-card-border, #e2e8f0)",
                      color: "var(--theme-text-primary, #0f172a)",
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </form>
          </div>

          {/* Preview Card Branding */}
          <div
            className="p-6 border shadow-sm space-y-4 flex flex-col items-center justify-center text-center"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
            }}
          >
            <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
              Pratinjau Logo &amp; Header
            </span>

            <div
              className="w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden shadow-inner p-1 transition-all"
              style={{
                borderColor: "var(--theme-card-border, #e2e8f0)",
                backgroundColor: "var(--theme-inner-bg, #f8fafc)",
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Preview Logo"
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-[9px] font-bold">Belum Ada Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-base" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                {businessName || "Nama Bisnis Anda"}
              </h3>
              <p className="text-xs font-medium" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                {address || "Alamat Outlet"}
              </p>
              <p className="text-[11px] font-mono" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                {phone || "08xx-xxxx-xxxx"}
              </p>
            </div>

            <div
              className="w-full p-3 rounded-2xl border text-[11px] space-y-1 text-left"
              style={{
                backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                color: "var(--theme-text-secondary, #64748b)",
              }}
            >
              <p className="font-bold flex items-center gap-1 text-emerald-500">
                <Check className="w-3.5 h-3.5" /> Sinkronisasi Otomatis:
              </p>
              <p>&bull; Logo pojok kiri atas Dashboard</p>
              <p>&bull; Header layar kasir POS</p>
              <p>&bull; Kop atas struk belanja pelanggan</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMA & TAMPILAN (HANYA YANG DIMILIKI) */}
      {activeTab === "THEMES" && (
        <div className="space-y-6">
          <div
            className="p-6 sm:p-7 border shadow-sm space-y-6"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              borderColor: "var(--theme-card-border, #e2e8f0)",
              borderRadius: "var(--theme-radius, 1.5rem)",
            }}
          >
            <div className="border-b pb-3 space-y-1" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  <Palette className="w-4 h-4" style={{ color: "var(--theme-primary, #4f46e5)" }} />
                  Koleksi Tema Aktif &amp; Terpasang
                </h2>
                <Link
                  href="/dashboard/store"
                  className="text-xs font-bold flex items-center gap-1 hover:underline"
                  style={{ color: "var(--theme-primary, #4f46e5)" }}
                >
                  <span>Beli Tema Lain di Store</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                Pilih tema visual UI dashboard, blueprint tata letak kasir POS, dan format struk dari koleksi yang sudah Anda miliki.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Selector Tema UI Dashboard */}
              <div
                className="p-5 border rounded-2xl space-y-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                  1. Tema UI Dashboard
                </span>
                <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                  Mengatur warna latar, kartu KPI, grafik, dan nuansa visual seluruh halaman dashboard.
                </p>

                <select
                  value={activeUiThemeId}
                  onChange={(e) => setActiveUiThemeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, #e2e8f0)",
                    color: "var(--theme-text-primary, #0f172a)",
                  }}
                >
                  {initialData.ownedUiThemes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.priceMonthly === 0 ? "(Bawaan)" : "(Dimiliki)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Selector Tema POS */}
              <div
                className="p-5 border rounded-2xl space-y-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                  2. Tema &amp; Layout POS Kasir
                </span>
                <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                  Pilih apakah layar POS mengikuti Tema UI secara default atau menggunakan tata letak kustom yang dimiliki.
                </p>

                <select
                  value={activePosLayout}
                  onChange={(e) => setActivePosLayout(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, #e2e8f0)",
                    color: "var(--theme-text-primary, #0f172a)",
                  }}
                >
                  <option value="DEFAULT">🌟 Ikuti Bawaan Tema UI Aktif (Default)</option>
                  {initialData.ownedPosLayouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.vertical})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Selector Tema Struk Kasir */}
              <div
                className="p-5 border rounded-2xl space-y-3"
                style={{
                  backgroundColor: "var(--theme-inner-bg, #f8fafc)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                  3. Tema Template Struk
                </span>
                <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                  Template desain struk termal yang siap digunakan saat mencetak transaksi belanja.
                </p>

                <select
                  value={activeReceiptTemplate}
                  onChange={(e) => setActiveReceiptTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, #e2e8f0)",
                    color: "var(--theme-text-primary, #0f172a)",
                  }}
                >
                  <option value="DEFAULT">Template Struk Standar (58mm/80mm)</option>
                  {initialData.ownedReceiptThemes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.vertical})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
              <span className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                💡 Pengaturan tema yang dipilih akan langsung diterapkan setelah disimpan.
              </span>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Terapkan Tema Terpilih</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KONFIGURASI STRUK KASIR (DINAMIS SESUAI TEMA + FITUR ADVANCE TERKUNCI) */}
      {activeTab === "RECEIPT" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sisi Kiri: Panel Pengaturan Struk (7 Kolom) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Kartu 1: Pemilihan Tema Struk Aktif */}
            <div
              className="p-5 sm:p-6 border shadow-sm space-y-3"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                borderRadius: "var(--theme-radius, 1.25rem)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  <Receipt className="w-4 h-4 text-indigo-500" />
                  <span>Tema Struk yang Digunakan</span>
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  {initialData.ownedReceiptThemes.find((r) => r.id === activeReceiptTemplate)?.name || "Standar (58mm/80mm)"}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                Komponen pengaturan dasar di bawah otomatis menyesuaikan dengan fitur bawaan tema struk yang Anda pilih.
              </p>

              <select
                value={activeReceiptTemplate}
                onChange={(e) => setActiveReceiptTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none"
                style={{
                  backgroundColor: "var(--theme-input-bg, #ffffff)",
                  borderColor: "var(--theme-card-border, #e2e8f0)",
                  color: "var(--theme-text-primary, #0f172a)",
                }}
              >
                <option value="DEFAULT">Template Struk Standar (58mm/80mm)</option>
                {initialData.ownedReceiptThemes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.vertical})
                  </option>
                ))}
              </select>
            </div>

            {/* Kartu 2: Konfigurasi Komponen Sesuai Tema (Dasar) */}
            <div
              className="p-5 sm:p-6 border shadow-sm space-y-4"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
                borderRadius: "var(--theme-radius, 1.25rem)",
              }}
            >
              <div className="border-b pb-3 space-y-1" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                <h3 className="font-black text-sm flex items-center gap-2" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                  <Store className="w-4 h-4 text-emerald-500" />
                  <span>Komponen Bawaan Tema Struk</span>
                </h3>
                <p className="text-[11px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                  Aktifkan atau sembunyikan elemen visual pada struk cetak belanja.
                </p>
              </div>

              {/* Toggles Kop & Identitas */}
              <div className="space-y-2.5 text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  <div>
                    <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Tampilkan Logo</p>
                    <p className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Cetak logo brand di bagian atas struk</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={receiptConfig.showLogo}
                    onChange={(e) => handleConfigChange("showLogo", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  <div>
                    <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Tampilkan Alamat Outlet</p>
                    <p className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Mencetak lokasi outlet / cabang</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={receiptConfig.showAddress}
                    onChange={(e) => handleConfigChange("showAddress", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  <div>
                    <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Tampilkan Nomor Kontak / Telepon</p>
                    <p className="text-[10px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Nomor WhatsApp atau call center</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={receiptConfig.showPhone}
                    onChange={(e) => handleConfigChange("showPhone", e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </label>
              </div>

              {/* Toggles Transaksi Kasir POS (Otomatis realtime, hanya toggle) */}
              <div className="pt-2 border-t space-y-2 text-xs" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                <span className="text-[11px] font-bold block" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                  Data Transaksi Kasir POS (Otomatis Terisi saat Transaksi):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between p-2 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <div>
                      <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Nama Kasir</p>
                      <p className="text-[9px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Otomatis nama operator login</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={receiptConfig.showCashier}
                      onChange={(e) => handleConfigChange("showCashier", e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <div>
                      <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Rincian Pembayaran</p>
                      <p className="text-[9px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Otomatis QRIS/Tunai &amp; Kembalian</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={receiptConfig.showPaymentDetail}
                      onChange={(e) => handleConfigChange("showPaymentDetail", e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  {/* Cafe / Resto specific toggles */}
                  {isCafeTheme && (
                    <>
                      <label className="flex items-center justify-between p-2 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                        <div>
                          <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Nomor Meja</p>
                          <p className="text-[9px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Otomatis dari meja pesanan</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={receiptConfig.showTableNumber}
                          onChange={(e) => handleConfigChange("showTableNumber", e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                        <div>
                          <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Tipe Pesanan</p>
                          <p className="text-[9px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Dine In / Take Away</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={receiptConfig.showOrderType}
                          onChange={(e) => handleConfigChange("showOrderType", e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </label>
                    </>
                  )}

                  <label className="flex items-center justify-between p-2 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <div>
                      <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Nomor Antrean</p>
                      <p className="text-[9px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Nomor urut antrean harian</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={receiptConfig.showQueueNumber}
                      onChange={(e) => handleConfigChange("showQueueNumber", e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl border cursor-pointer" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <div>
                      <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Varian &amp; Modifiers</p>
                      <p className="text-[9px]" style={{ color: "var(--theme-text-secondary, #64748b)" }}>Catatan es, gula, rasa</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={receiptConfig.showItemModifiers}
                      onChange={(e) => handleConfigChange("showItemModifiers", e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                  </label>
                </div>
              </div>

              {/* Pajak & Biaya F&B */}
              {isCafeTheme && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-xs" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <label className="flex items-center justify-between cursor-pointer font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                      <span>PB1 Pajak Resto (%)</span>
                      <input
                        type="checkbox"
                        checked={receiptConfig.showPb1}
                        onChange={(e) => handleConfigChange("showPb1", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                    </label>
                    {receiptConfig.showPb1 && (
                      <input
                        type="number"
                        value={receiptConfig.pb1Percent || 10}
                        onChange={(e) => handleConfigChange("pb1Percent", Number(e.target.value))}
                        placeholder="Tarif % (Contoh: 10)"
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none"
                        style={{ backgroundColor: "var(--theme-card-bg, #ffffff)", borderColor: "var(--theme-card-border, #e2e8f0)" }}
                      />
                    )}
                  </div>

                  <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                    <label className="flex items-center justify-between cursor-pointer font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                      <span>Service Charge Resto (%)</span>
                      <input
                        type="checkbox"
                        checked={receiptConfig.showServiceCharge}
                        onChange={(e) => handleConfigChange("showServiceCharge", e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                    </label>
                    {receiptConfig.showServiceCharge && (
                      <input
                        type="number"
                        value={receiptConfig.servicePercent || 5}
                        onChange={(e) => handleConfigChange("servicePercent", Number(e.target.value))}
                        placeholder="Tarif % (Contoh: 5)"
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none"
                        style={{ backgroundColor: "var(--theme-card-bg, #ffffff)", borderColor: "var(--theme-card-border, #e2e8f0)" }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Footer Penutup */}
              <div className="pt-2 border-t space-y-1.5 text-xs" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                <label className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Pesan Footer Penutup Struk</label>
                <input
                  type="text"
                  value={receiptConfig.footerText || ""}
                  onChange={(e) => handleConfigChange("footerText", e.target.value)}
                  placeholder="Terima kasih atas kunjungan Anda!"
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: "var(--theme-input-bg, #ffffff)", borderColor: "var(--theme-card-border, #e2e8f0)" }}
                />
              </div>

              <div className="pt-3 border-t flex justify-end" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Konfigurasi Dasar</span>
                </button>
              </div>
            </div>

            {/* Kartu 3: ✨ FITUR ADVANCE (AKORDEON EXPAND/COLLAPSE - STATUS LOCKED / UNLOCKED) */}
            <div
              className="border shadow-sm overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: initialData.hasReceiptProPlugin ? "var(--theme-card-border, #e2e8f0)" : "rgba(245, 158, 11, 0.4)",
                borderRadius: "var(--theme-radius, 1.25rem)",
              }}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setIsAdvanceOpen(!isAdvanceOpen)}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-500/5 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      initialData.hasReceiptProPlugin ? "bg-purple-500/10 text-purple-600" : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {initialData.hasReceiptProPlugin ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                        Kustomisasi Bebas Tingkat Lanjut (Advance Customizer)
                      </h3>
                      {initialData.hasReceiptProPlugin ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-bold border border-emerald-500/30">
                          🔓 Plugin Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Fitur Pro (Terkunci)
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--theme-text-secondary, #64748b)" }}>
                      Kustomisasi bebas: ukuran kertas 58/80mm, gaya garis, kupon voucher, slip dapur, &amp; medsos multi-platform.
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg border text-slate-400">
                  {isAdvanceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isAdvanceOpen && (
                <div className="p-5 sm:p-6 border-t space-y-5" style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                  {!initialData.hasReceiptProPlugin ? (
                    /* LOCKED PRO TEASER BANNER */
                    <div
                      className="p-6 rounded-2xl border border-dashed border-amber-500/40 text-center space-y-4"
                      style={{ backgroundColor: "rgba(245, 158, 11, 0.04)" }}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          Buka Kustomisasi Struk Tanpa Batas dengan Plugin Pro
                        </h4>
                        <p className="text-xs text-slate-500">
                          Dengan Plugin Kustomisasi Struk Pro, Anda dapat mengganti ukuran kertas thermal bebas (58mm/80mm), mengubah divider garis, menambahkan kupon voucher repeat order, tiket dapur, serta mencetak akun medsos multi-platform.
                        </p>
                      </div>

                      <Link
                        href="/dashboard/subscription"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-90"
                        style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Buka Plugin Kustomisasi di Subscription</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    /* UNLOCKED FULL CUSTOMIZER */
                    <div className="space-y-5">
                      {/* 1. Format Kertas & Garis */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold block" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Ukuran Kertas Thermal</label>
                          <select
                            value={receiptConfig.paperSize || "58mm"}
                            onChange={(e) => handleConfigChange("paperSize", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none"
                            style={{ backgroundColor: "var(--theme-input-bg, #ffffff)", borderColor: "var(--theme-card-border, #e2e8f0)" }}
                          >
                            <option value="58mm">58mm (Kompak Standar)</option>
                            <option value="80mm">80mm (Lebar / Resto Besar)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold block" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Gaya Garis Pemisah</label>
                          <select
                            value={receiptConfig.dividerStyle || "DASHED"}
                            onChange={(e) => handleConfigChange("dividerStyle", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none"
                            style={{ backgroundColor: "var(--theme-input-bg, #ffffff)", borderColor: "var(--theme-card-border, #e2e8f0)" }}
                          >
                            <option value="DASHED">Garis Putus-putus (- - -)</option>
                            <option value="DOUBLE">Garis Ganda (===)</option>
                            <option value="SOLID">Garis Lurus Tebal (___)</option>
                            <option value="ASTERISK">Bintang Simbol (***)</option>
                            <option value="BOX">Kotak Pembatas ([ ])</option>
                            <option value="MINIMAL">Minimal / Bersih</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold block" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Skala Huruf / Font</label>
                          <select
                            value={receiptConfig.fontScale || "NORMAL"}
                            onChange={(e) => handleConfigChange("fontScale", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none"
                            style={{ backgroundColor: "var(--theme-input-bg, #ffffff)", borderColor: "var(--theme-card-border, #e2e8f0)" }}
                          >
                            <option value="COMPACT">Kompak (Hemat Kertas)</option>
                            <option value="NORMAL">Normal (Standar)</option>
                            <option value="SPACIOUS">Lega / Huruf Besar</option>
                          </select>
                        </div>
                      </div>

                      {/* 2. Nama Legal & NPWP */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                          <label className="flex items-center justify-between cursor-pointer font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                            <span>Nama Legal PT / Badan Usaha</span>
                            <input
                              type="checkbox"
                              checked={receiptConfig.showLegalName}
                              onChange={(e) => handleConfigChange("showLegalName", e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600"
                            />
                          </label>
                          {receiptConfig.showLegalName && (
                            <input
                              type="text"
                              value={receiptConfig.legalName || ""}
                              onChange={(e) => handleConfigChange("legalName", e.target.value)}
                              placeholder="PT. Kuliner Nusantara Sejahtera"
                              className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold"
                            />
                          )}
                        </div>

                        <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                          <label className="flex items-center justify-between cursor-pointer font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                            <span>NPWP / Tax ID Badan Usaha</span>
                            <input
                              type="checkbox"
                              checked={receiptConfig.showNpwp}
                              onChange={(e) => handleConfigChange("showNpwp", e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600"
                            />
                          </label>
                          {receiptConfig.showNpwp && (
                            <input
                              type="text"
                              value={receiptConfig.npwp || ""}
                              onChange={(e) => handleConfigChange("npwp", e.target.value)}
                              placeholder="01.234.567.8-901.000"
                              className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold"
                            />
                          )}
                        </div>
                      </div>

                      {/* 3. Multi-Media Sosial (Instagram, TikTok, Website) */}
                      <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                        <label className="flex items-center justify-between cursor-pointer font-bold text-xs" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            <span>Cetak Akun Media Sosial Multi-Platform</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={receiptConfig.showSocialMedia}
                            onChange={(e) => handleConfigChange("showSocialMedia", e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600"
                          />
                        </label>

                        {receiptConfig.showSocialMedia && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-dashed border-slate-200 text-xs">
                            <div>
                              <label className="text-[10px] font-bold block mb-1">📷 Instagram</label>
                              <input
                                type="text"
                                value={socialInstagram}
                                onChange={(e) => setSocialInstagram(e.target.value)}
                                placeholder="@tokokita"
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold block mb-1">🎵 TikTok</label>
                              <input
                                type="text"
                                value={socialTiktok}
                                onChange={(e) => setSocialTiktok(e.target.value)}
                                placeholder="@tokokita_official"
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold block mb-1">🌐 Website / Linktree</label>
                              <input
                                type="text"
                                value={socialWebsite}
                                onChange={(e) => setSocialWebsite(e.target.value)}
                                placeholder="tokokita.com"
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Kupon Diskon Kunjungan Berikutnya & Slip Dapur */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Dynamic Coupon */}
                        <div className="p-3.5 rounded-xl border space-y-2" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                          <label className="flex items-center justify-between cursor-pointer font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                            <span>🎟️ Kupon Otomatis di Bawah Struk</span>
                            <input
                              type="checkbox"
                              checked={receiptConfig.dynamicCoupon?.enabled || false}
                              onChange={(e) =>
                                handleConfigChange("dynamicCoupon", {
                                  ...(receiptConfig.dynamicCoupon || { couponCode: "HEMAT20", discountText: "Diskon 20% Kunjungan Berikutnya", expiryDays: 30 }),
                                  enabled: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-indigo-600"
                            />
                          </label>

                          {receiptConfig.dynamicCoupon?.enabled && (
                            <div className="space-y-1.5 pt-1">
                              <input
                                type="text"
                                value={receiptConfig.dynamicCoupon?.couponCode || "HEMAT20"}
                                onChange={(e) =>
                                  handleConfigChange("dynamicCoupon", {
                                    ...receiptConfig.dynamicCoupon,
                                    couponCode: e.target.value,
                                  })
                                }
                                placeholder="Kode Kupon (HEMAT20)"
                                className="w-full px-2.5 py-1 rounded border text-xs font-mono font-bold uppercase"
                              />
                              <input
                                type="text"
                                value={receiptConfig.dynamicCoupon?.discountText || "Diskon 20% Kunjungan Berikutnya"}
                                onChange={(e) =>
                                  handleConfigChange("dynamicCoupon", {
                                    ...receiptConfig.dynamicCoupon,
                                    discountText: e.target.value,
                                  })
                                }
                                placeholder="Pesan Kupon"
                                className="w-full px-2.5 py-1 rounded border text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* Kitchen Slip */}
                        <div className="p-3.5 rounded-xl border space-y-2" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                          <label className="flex items-center justify-between cursor-pointer font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>
                            <span>🍳 Cetak Slip Dapur Terpisah</span>
                            <input
                              type="checkbox"
                              checked={receiptConfig.kitchenTicket?.enabled || false}
                              onChange={(e) =>
                                handleConfigChange("kitchenTicket", {
                                  ...(receiptConfig.kitchenTicket || { autoPrint: true, hidePrices: true }),
                                  enabled: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-indigo-600"
                            />
                          </label>
                          <p className="text-[10px] text-slate-500">
                            Mencetak salinan struk kedua khusus koki dapur tanpa mencantumkan nominal harga.
                          </p>
                        </div>
                      </div>

                      {/* 5. Watermark Qassa POS */}
                      <div className="flex items-center justify-between p-3 rounded-xl border text-xs" style={{ backgroundColor: "var(--theme-inner-bg, #f8fafc)", borderColor: "var(--theme-card-border, #e2e8f0)" }}>
                        <div>
                          <p className="font-bold" style={{ color: "var(--theme-text-primary, #0f172a)" }}>Watermark Powered by Qassa POS</p>
                          <p className="text-[10px] text-slate-500">Menampilkan tanda sistem di bagian paling bawah struk</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={receiptConfig.showPoweredBy}
                          onChange={(e) => handleConfigChange("showPoweredBy", e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSave()}
                          disabled={saving}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 disabled:opacity-50"
                          style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>Simpan Kustomisasi Advance</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Sticky Thermal Receipt Live Preview (5 Kolom) */}
          <div className="lg:col-span-5 sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--theme-primary, #4f46e5)" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Pratinjau Struk Termal Real-Time
              </span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {receiptConfig.paperSize === "80mm" ? "80mm Thermal Paper" : "58mm Thermal Paper"}
              </span>
            </div>

            {/* Thermal Simulation Surface */}
            <div
              className={`bg-[#FFFDF9] border border-dashed border-stone-300 rounded-3xl p-6 font-mono text-stone-900 shadow-2xl space-y-3 select-none transition-all ${
                receiptConfig.fontScale === "COMPACT" ? "text-[10px]" : receiptConfig.fontScale === "SPACIOUS" ? "text-sm" : "text-xs"
              } ${receiptConfig.paperSize === "80mm" ? "max-w-full" : "max-w-[360px] mx-auto"}`}
            >
              {/* Logo & Kop Header */}
              <div className="text-center space-y-1">
                {receiptConfig.showLogo && logoUrl && (
                  <div className="flex justify-center pb-1">
                    <img
                      src={logoUrl}
                      alt="Logo Struk"
                      className="max-h-12 max-w-[120px] object-contain filter grayscale"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
                  {businessName || "NAMA BISNIS ANDA"}
                </h4>
                {receiptConfig.showLegalName && (
                  <p className="text-[9px] text-stone-500 font-semibold">{receiptConfig.legalName || "PT. Kuliner Nusantara Sejahtera"}</p>
                )}
                {receiptConfig.showAddress && (
                  <p className="text-[10px] text-stone-600 leading-tight">
                    {address || "Jl. Sudirman No. 45, Jakarta"}
                  </p>
                )}
                {receiptConfig.showPhone && (
                  <p className="text-[10px] text-stone-600 font-mono">
                    Telp: {phone || "0812-3456-7890"}
                  </p>
                )}
                {receiptConfig.showNpwp && (
                  <p className="text-[9px] text-stone-500 font-mono">NPWP: {receiptConfig.npwp || "01.234.567.8-901.000"}</p>
                )}
              </div>

              {/* Divider Style */}
              <div className="my-2">
                {receiptConfig.dividerStyle === "DOUBLE" ? (
                  <div className="border-b-2 border-stone-800 border-double" />
                ) : receiptConfig.dividerStyle === "SOLID" ? (
                  <div className="border-b border-stone-800" />
                ) : receiptConfig.dividerStyle === "ASTERISK" ? (
                  <p className="text-center tracking-widest text-[9px] text-stone-400">********************************</p>
                ) : receiptConfig.dividerStyle === "MINIMAL" ? (
                  <div className="h-2" />
                ) : (
                  <div className="border-b border-stone-400 border-dashed" />
                )}
              </div>

              {/* Order Meta */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold">No. Struk: #5078</span>
                  <span>14:30 WIB</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  {receiptConfig.showCashier && <span>Kasir: Rian</span>}
                  {receiptConfig.showOrderType && isCafeTheme && <span className="font-bold">Dine In</span>}
                </div>
                {receiptConfig.showTableNumber && isCafeTheme && (
                  <div className="flex justify-between font-bold text-stone-950">
                    <span>MEJA / STATION:</span>
                    <span>MEJA 08</span>
                  </div>
                )}
                {receiptConfig.showQueueNumber && (
                  <div className="text-center p-1.5 border border-dashed border-stone-400 rounded-lg my-1">
                    <span className="text-[9px] block text-stone-600">NOMOR ANTREAN</span>
                    <span className="text-xl font-black tracking-widest text-stone-950">A-24</span>
                  </div>
                )}
              </div>

              {/* Divider Style */}
              <div className="my-2">
                {receiptConfig.dividerStyle === "DOUBLE" ? (
                  <div className="border-b-2 border-stone-800 border-double" />
                ) : receiptConfig.dividerStyle === "SOLID" ? (
                  <div className="border-b border-stone-800" />
                ) : receiptConfig.dividerStyle === "ASTERISK" ? (
                  <p className="text-center tracking-widest text-[9px] text-stone-400">********************************</p>
                ) : receiptConfig.dividerStyle === "MINIMAL" ? (
                  <div className="h-2" />
                ) : (
                  <div className="border-b border-stone-400 border-dashed" />
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 text-[11px]">
                {sampleItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-semibold">
                      <span>{item.qty}x {item.name}</span>
                      <span>Rp {(item.qty * item.price).toLocaleString("id-ID")}</span>
                    </div>
                    {receiptConfig.showItemModifiers && item.mods && (
                      <div className="pl-3 text-[9px] text-stone-500">
                        {item.mods.map((m, mIdx) => (
                          <p key={mIdx}>• {m}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider Style */}
              <div className="my-2">
                {receiptConfig.dividerStyle === "DOUBLE" ? (
                  <div className="border-b-2 border-stone-800 border-double" />
                ) : receiptConfig.dividerStyle === "SOLID" ? (
                  <div className="border-b border-stone-800" />
                ) : receiptConfig.dividerStyle === "ASTERISK" ? (
                  <p className="text-center tracking-widest text-[9px] text-stone-400">********************************</p>
                ) : receiptConfig.dividerStyle === "MINIMAL" ? (
                  <div className="h-2" />
                ) : (
                  <div className="border-b border-stone-400 border-dashed" />
                )}
              </div>

              {/* Calculations */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                {receiptConfig.showTax && (
                  <div className="flex justify-between text-stone-600 text-[11px]">
                    <span>PPN ({receiptConfig.taxPercent || 11}%)</span>
                    <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {receiptConfig.showPb1 && isCafeTheme && (
                  <div className="flex justify-between text-stone-600 text-[11px]">
                    <span>PB1 Resto ({receiptConfig.pb1Percent || 10}%)</span>
                    <span>Rp {pb1Amount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {receiptConfig.showServiceCharge && isCafeTheme && (
                  <div className="flex justify-between text-stone-600 text-[11px]">
                    <span>Service Charge ({receiptConfig.servicePercent || 5}%)</span>
                    <span>Rp {serviceAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {receiptConfig.showDiscount && (
                  <div className="flex justify-between text-emerald-700 text-[11px] font-bold">
                    <span>Diskon Promosi</span>
                    <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-stone-950 text-sm pt-1.5 border-t border-stone-300">
                  <span>TOTAL BILL</span>
                  <span>Rp {totalBill.toLocaleString("id-ID")}</span>
                </div>
                {receiptConfig.showPaymentDetail && (
                  <div className="pt-1 text-[10px] text-stone-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Metode Bayar:</span>
                      <span>QRIS BCA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span>Rp 0</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Coupon Ticket */}
              {receiptConfig.dynamicCoupon?.enabled && (
                <div className="my-2 p-2 border border-dashed border-purple-400 bg-purple-50/50 rounded-xl text-center text-purple-950 space-y-0.5">
                  <span className="text-[9px] font-bold block">🎟️ KUPON VOUCHER SPESIAL</span>
                  <span className="text-xs font-black tracking-wider uppercase">{receiptConfig.dynamicCoupon.couponCode}</span>
                  <p className="text-[9px]">{receiptConfig.dynamicCoupon.discountText}</p>
                  <p className="text-[8px] text-purple-600">Berlaku {receiptConfig.dynamicCoupon.expiryDays || 30} hari dari struk ini</p>
                </div>
              )}

              {/* Divider Style */}
              <div className="my-2">
                {receiptConfig.dividerStyle === "DOUBLE" ? (
                  <div className="border-b-2 border-stone-800 border-double" />
                ) : receiptConfig.dividerStyle === "SOLID" ? (
                  <div className="border-b border-stone-800" />
                ) : receiptConfig.dividerStyle === "ASTERISK" ? (
                  <p className="text-center tracking-widest text-[9px] text-stone-400">********************************</p>
                ) : receiptConfig.dividerStyle === "MINIMAL" ? (
                  <div className="h-2" />
                ) : (
                  <div className="border-b border-stone-400 border-dashed" />
                )}
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] space-y-1 pt-1 text-stone-600">
                <p className="font-semibold text-stone-800">
                  {receiptConfig.footerText || "Terima kasih atas kunjungan Anda!"}
                </p>

                {/* Multi-Social Media on Receipt */}
                {receiptConfig.showSocialMedia && (
                  <div className="space-y-0.5 text-[9px]">
                    {socialInstagram && <p>📷 IG: {socialInstagram}</p>}
                    {socialTiktok && <p>🎵 TikTok: {socialTiktok}</p>}
                    {socialWebsite && <p>🌐 {socialWebsite}</p>}
                  </div>
                )}

                {receiptConfig.showPoweredBy && (
                  <p className="text-[8px] font-bold opacity-60 pt-1 tracking-wider uppercase">
                    Powered by Qassa POS
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
