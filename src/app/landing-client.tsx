"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Check,
  Laptop,
  Layers,
  BarChart3,
  TrendingUp,
  Receipt,
  QrCode,
  Smartphone,
  Shield,
  HelpCircle,
  Clock,
  Building,
  CreditCard,
  Printer,
  Plus,
  Minus,
  RotateCcw,
  Users,
  Palette,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function LandingClient({
  tiers = [],
  plugins = [],
  themes = [],
}: {
  tiers: any[];
  plugins: any[];
  themes: any[];
}) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [activePluginTab, setActivePluginTab] = useState<string>("barbershop");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Map real plugin data from database
  const pluginInfoMap: Record<string, { icon: any; route: string; highlight: string; features: string[] }> = {
    barbershop: {
      icon: Scissors,
      route: "/dashboard/barbershop/queue",
      highlight: "Live Chair Board & Komisi Kapster",
      features: [
        "Live Chair Board 3 kolom status (Menunggu, Sedang Dilayani, Selesai)",
        "Perhitungan otomatis komisi kapster & cetak slip bagi hasil per transaksi",
        "Penetapan kapster langsung saat input transaksi kasir",
      ],
    },
    cafe: {
      icon: Coffee,
      route: "/dashboard/cafe/tables",
      highlight: "Visual Floor Map Meja, KOT Dapur & QR Menu",
      features: [
        "Manajemen okupansi denah meja visual (Available, Occupied, Reserved, Billing)",
        "Kitchen Order Ticket (KOT) untuk kirim pesanan ke juru masak",
        "Digital Menu & Self-Order QR Pelanggan di URL /menu/[tenantId]",
      ],
    },
    retail: {
      icon: ShoppingBag,
      route: "/dashboard/products",
      highlight: "Barcode Scanner, Multi-Satuan & Harga Grosir",
      features: [
        "Scan barcode cepat & pencarian SKU barang instan di kasir",
        "Multi-satuan unit produk (Beli Dus, Jual Satuan Pcs/Lusin)",
        "Harga grosir bertingkat otomatis berdasarkan kuantiti belanja",
      ],
    },
    laundry: {
      icon: Shirt,
      route: "/dashboard/laundry/orders",
      highlight: "Timbangan Kg, Pilihan Parfum & 5 Tahap Tracking",
      features: [
        "Input berat cucian desimal (misal 3.45 Kg) akurat hingga gram",
        "Pilihan aroma parfum laundry & tipe layanan (Express / Reguler)",
        "Live tracking status order 5 tahap cucian & cetak nota laundry",
      ],
    },
  };

  const currentPluginMeta = pluginInfoMap[activePluginTab] || pluginInfoMap["barbershop"];
  const currentPluginDb = plugins.find((p) => p.code === activePluginTab) || {
    name: "Barbershop & Salon",
    description: "Modul antrian kursi dan komisi kapster.",
    priceMonthly: 50000,
  };

  // Real System Core Features (100% ada di aplikasi kita)
  const systemCorePillars = [
    {
      icon: Store,
      title: "Manajemen Multi-Cabang Outlet",
      desc: "Kelola banyak cabang outlet dalam 1 akun pemilik, lengkap dengan pembagian kuota outlet dan hak akses khusus Admin Cabang.",
      tag: "/dashboard/outlets",
    },
    {
      icon: Clock,
      title: "Buka / Tutup Shift Kasir Nyata",
      desc: "Pencatatan modal kas awal (opening cash), rekonsiliasi kas akhir saat tutup shift, dan mutasi kas masuk/keluar (cash movement).",
      tag: "/pos & /pos/history",
    },
    {
      icon: TrendingUp,
      title: "Laporan Konsolidasi & Heatmap Jam Ramai",
      desc: "Grafik tren omset harian, deteksi jam paling ramai (peak hours heatmap), rekap laba, serta export laporan ke CSV dan PDF.",
      tag: "/dashboard/reports",
    },
    {
      icon: Palette,
      title: "Dynamic UI Theme & Marketplace",
      desc: "Ganti layout antarmuka kasir secara live (Modern, Compact, Luxe, Warm) dengan token warna dan tema yang diterbitkan Super Admin.",
      tag: "/dashboard/themes",
    },
    {
      icon: Receipt,
      title: "Custom Branding & Struk Thermal",
      desc: "Ubah nama bisnis, alamat toko, logo, dan teks footer struk belanja dengan live preview thermal 58mm/80mm di paket berbayar.",
      tag: "/dashboard/settings",
    },
    {
      icon: Laptop,
      title: "Simulator & Guest Demo Bebas Akun",
      desc: "Uji coba seluruh fitur kasir, antrian, denah meja, dan racik paket secara nyata di browser tanpa registrasi akun & tanpa database.",
      tag: "/demo & /demo/app",
    },
  ];

  const realFaqs = [
    {
      q: "Bagaimana cara mencoba sistem tanpa mendaftar akun?",
      a: "Anda dapat membuka halaman Simulator & Guest Demo (/demo). Anda bebas meracik paket lisensi, modul vertikal, dan tema layout, lalu langsung masuk ke dashboard demo nyata tanpa registrasi akun dan tanpa mengotori database server.",
    },
    {
      q: "Bagaimana cara kerja modul bisnis vertikal (Barbershop, Cafe, Laundry, Retail)?",
      a: "Sistem kami dibangun secara modular. Saat modul diaktifkan, menu dan alur kasir otomatis menyesuaikan. Contoh: Cafe memunculkan denah meja & KOT, Barbershop memunculkan live antrian kursi & komisi, Laundry memunculkan timbangan kg & nota 5 tahap.",
    },
    {
      q: "Apakah pemilik bisa memantau semua cabang sekaligus?",
      a: "Bisa. Di paket Pro dan Enterprise, Anda mendapatkan fitur Multi-Outlet dan Laporan Konsolidasi untuk melihat total omset seluruh cabang dalam 1 layar, serta mendelegasikan Admin Cabang khusus per outlet.",
    },
    {
      q: "Apakah saya bisa mengubah nama toko dan footer struk?",
      a: "Bisa. Pada menu Pengaturan Toko (/dashboard/settings), tenant yang telah aktif berlangganan dapat mengganti nama brand, alamat, dan catatan footer struk yang otomatis tampil pada hasil cetak printer thermal.",
    },
    {
      q: "Bagaimana sistem lisensi dan pembayaran langganan bekerja?",
      a: "Setiap tenant baru otomatis mendapatkan masa Trial 30 Hari penuh. Setelah itu, Anda dapat memilih lisensi (Basic, Pro, Enterprise) dan menambah add-on modul sesuai kebutuhan dengan kalkulasi transparan per bulan atau per tahun.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFC] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* ── FULL-PAGE LINEAR GRID VECTOR ACCENT (REAL CONTINUOUS BACKGROUND) ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Ambient Guide Lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line x1="0" y1="120" x2="100%" y2="1200" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="8 8" />
          <line x1="15%" y1="0" x2="100%" y2="2600" stroke="url(#lineGrad)" strokeWidth="1" />
          <line x1="0" y1="1400" x2="100%" y2="4200" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="12 12" />
        </svg>

        {/* Ambient Glows */}
        <div className="absolute -top-48 right-0 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-indigo-100/60 via-purple-50/40 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-100/50 via-indigo-50/40 to-transparent blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-emerald-50/50 via-indigo-50/30 to-transparent blur-3xl" />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/25">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-950">
                POS Universal
              </span>
              <span className="text-[10px] ml-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                Sistem Multi-Tenant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-xs font-bold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 space-y-24 sm:space-y-32">
        {/* ── 1. HERO SECTION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-indigo-700 border border-indigo-100 shadow-[0_2px_12px_rgba(79,70,229,0.06)] text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Platform Kasir Cloud Multi-Tenant & Multi-Outlet
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] text-slate-950">
            Satu Sistem Kasir untuk{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
              Semua Jenis Bisnis
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Aplikasi kasir online pintar yang otomatis beradaptasi dengan alur usaha Anda. Dilengkapi modul antrian barbershop, denah meja cafe, laundry timbangan, dan barcode retail.
          </p>

          {/* Hero CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/demo"
              className="px-7 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Coba Demo Kasir & Simulasi Harga (Bebas Akun)</span>
            </Link>
            <Link
              href="/register"
              className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200/90 transition flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
            >
              <span>Daftar Akun Baru (Trial 30 Hari)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Trial 30 Hari Penuh
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Buka/Tutup Shift Kasir
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Cabang & Multi-Role
            </span>
          </div>

          {/* Real System Live Preview Showcase */}
          <div className="mt-14 w-full max-w-4xl relative">
            <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-400 ml-2 font-mono">
                    POS Universal &bull; Live System Architecture
                  </span>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ● PostgreSQL & Next.js Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Modul Vertikal Aktif</span>
                  <p className="text-xl font-black text-slate-900">{plugins.length} Plugin Resmi</p>
                  <p className="text-[11px] text-slate-500">Barbershop &bull; Cafe &bull; Retail &bull; Laundry</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Preset Tema UI</span>
                  <p className="text-xl font-black text-slate-900">{themes.length} Tema Desain</p>
                  <p className="text-[11px] text-slate-500">Modern, Compact, Luxe, Warm</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Struktur Lisensi</span>
                  <p className="text-xl font-black text-indigo-600">{tiers.length} Pilihan Paket</p>
                  <p className="text-[11px] text-slate-500">Trial, Basic, Pro, Enterprise</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. REAL VERTICAL MODULES SECTION (SESUAI SISTEM KITA) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Modul Vertikal Terpasang
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Fitur Nyata Sesuai Bidang Usaha Anda
            </h2>
            <p className="text-sm text-slate-600">
              Setiap modul menambahkan menu khusus di dashboard dan menyesuaikan alur mesin kasir:
            </p>

            {/* Plugin Switcher Tabs */}
            <div className="pt-4 flex flex-wrap justify-center gap-2">
              {plugins.map((p) => {
                const isSel = activePluginTab === p.code;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePluginTab(p.code)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                      isSel
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105"
                        : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm"
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plugin Details Display */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Modul / Plugin ID: {activePluginTab}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  {currentPluginDb.name}
                </h3>
                <p className="text-sm font-semibold text-slate-700">
                  {currentPluginMeta.highlight}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  {currentPluginDb.description}
                </p>
              </div>

              {/* Real Feature Bullets in our Codebase */}
              <div className="space-y-2.5 pt-2 text-xs text-slate-700">
                {currentPluginMeta.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href="/demo"
                  className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Uji Coba Modul Ini di Sandbox Demo</span>
                </Link>
                {activePluginTab === "cafe" && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Self-order: /menu/[tenantId]
                  </span>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Real Database Price & Specs Card */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold uppercase text-slate-500">Biaya Add-on Resmi</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Database Catalog
                </span>
              </div>

              <div>
                <p className="text-3xl font-black text-slate-950">
                  Rp {Number(currentPluginDb.priceMonthly).toLocaleString("id-ID")}
                  <span className="text-xs text-slate-500 font-normal"> / bulan</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dapat diaktifkan atau dinonaktifkan kapan saja dari portal Langganan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Rute Akses Tenant:</span>
                  <span className="font-mono text-indigo-600 text-[11px]">{currentPluginMeta.route}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status Plugin:</span>
                  <span className="text-emerald-600 font-bold">✓ Tersedia & Siap Pakai</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. REAL SYSTEM CORE PILLARS (APA YANG ADA DI KODINGAN KITA) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
                <ShieldCheck className="w-3.5 h-3.5" /> Arsitektur & Fitur Inti
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Pilar Fitur yang Terpasang di Sistem Kita
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Setiap fitur di bawah ini telah selesai dibangun 100% dan terhubung langsung ke database:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {systemCorePillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-indigo-200 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {pillar.tag}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. PRICING SECTION (DATABASE CATALOG TERHUBUNG LISENSI) ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-indigo-600" /> Katalog Lisensi Resmi
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Pilihan Paket Langganan & Kapasitas
            </h2>
            <p className="text-sm text-slate-600">
              Harga live langsung dari database katalog. Diurutkan dari Trial &rarr; Basic &rarr; Pro &rarr; Enterprise.
            </p>

            {/* Interactive Billing Cycle Toggle */}
            <div className="pt-2 flex justify-center">
              <div className="p-1 rounded-full bg-white border border-slate-200 shadow-sm flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={`px-5 py-2 rounded-full transition ${
                    billingCycle === "MONTHLY"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bayar Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("ANNUAL")}
                  className={`px-5 py-2 rounded-full transition flex items-center gap-1.5 ${
                    billingCycle === "ANNUAL"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Bayar Tahunan</span>
                  <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-extrabold">
                    Hemat 17%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Card 1: Trial 30 Hari */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Trial 30 Hari
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Gratis Coba
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-slate-500">Rp</span>
                    <span className="text-3xl font-black text-slate-950">
                      0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">30 Hari Pertama</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Uji coba seluruh modul vertikal dan fitur kasir secara lengkap tanpa biaya kartu kredit.
                </p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium">1 Outlet & 5 Akun Kasir</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium">Akses Semua Modul Vertikal</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium">Buka-Tutup Shift Kasir</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium">Laporan Penjualan Harian</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="w-full py-3 rounded-full text-xs font-bold text-center bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center justify-center gap-1.5"
              >
                <span>Daftar Trial Gratis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Cards 2-4: Diambil Langsung dari Database LicenseTier */}
            {tiers.map((tier) => {
              const isPro = tier.code === "pro";
              const isEnterprise = tier.code === "enterprise";
              const monthlyPriceNum = Number(tier.priceMonthly);

              // Perhitungan Tagihan Tahunan Real & Penghematan
              const normalAnnualPrice = monthlyPriceNum * 12;
              const discountedAnnualPrice =
                Number(tier.priceAnnual) || Math.round(monthlyPriceNum * 12 * 0.83);
              const totalYearSavings = normalAnnualPrice - discountedAnnualPrice;
              const effectiveMonthlyNum = Math.round(discountedAnnualPrice / 12);

              const isAnnual = billingCycle === "ANNUAL";

              return (
                <div
                  key={tier.id}
                  className={`p-6 rounded-3xl border transition flex flex-col justify-between space-y-6 ${
                    isPro
                      ? "bg-white border-indigo-600 shadow-[0_12px_40px_rgba(79,70,229,0.1)] ring-2 ring-indigo-600/20"
                      : "bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {tier.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isPro
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isPro
                          ? "Paling Populer ⭐"
                          : isEnterprise
                          ? "Enterprise"
                          : "Basic"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {isEnterprise && monthlyPriceNum === 0 ? (
                        <div>
                          <span className="text-3xl font-black text-slate-950">Custom</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">sesuai skala usaha</p>
                        </div>
                      ) : isAnnual ? (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-slate-500">Rp</span>
                            <span className="text-3xl font-black text-slate-950">
                              {discountedAnnualPrice.toLocaleString("id-ID")}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">/ tahun</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-slate-400 line-through">
                              Rp {normalAnnualPrice.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Hemat Rp {totalYearSavings.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Setara <strong>Rp {effectiveMonthlyNum.toLocaleString("id-ID")}</strong> / bulan
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-slate-500">Rp</span>
                            <span className="text-3xl font-black text-slate-950">
                              {monthlyPriceNum.toLocaleString("id-ID")}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">/ bulan</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">ditagih bulanan</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isEnterprise
                        ? "Dukungan skala besar untuk franchise & jaringan ritel multi-cabang."
                        : isPro
                        ? "Solusi lengkap bisnis multi-outlet dengan laporan konsolidasi."
                        : "Ideal untuk pemilik toko tunggal dengan custom branding & struk."}
                    </p>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          {tier.outletLimit ? `Hingga ${tier.outletLimit} Outlet Cabang` : "Unlimited Outlet Cabang"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          {tier.kasirLimitPerOutlet ? `${tier.kasirLimitPerOutlet} Kasir per Outlet` : "Unlimited Kasir"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          Custom Branding Struk & Logo
                        </span>
                      </div>
                      {tier.hasAdminCabang && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            Role Admin Cabang Scoped
                          </span>
                        </div>
                      )}
                      {tier.hasConsolidatedReport && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            Laporan Konsolidasi Cabang
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/register?plan=${tier.code}&billing=${billingCycle}`}
                    className={`w-full py-3 rounded-full text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
                      isPro
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                    }`}
                  >
                    <span>Pilih {tier.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. FAQ SECTION (REAL SYSTEM FACTS) ── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-sm">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Informasi faktual mengenai cara kerja dan fitur POS Universal.
            </p>
          </div>

          <div className="space-y-3">
            {realFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white transition overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((prev) => (prev === idx ? null : idx))}
                    className="w-full p-5 text-left font-bold text-sm text-slate-900 flex items-center justify-between gap-4 hover:text-indigo-600 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. FINAL CTA BANNER ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="p-8 sm:p-14 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 text-center space-y-6 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              <span className="px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
                Uji Coba Langsung
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Coba Sistem Kasir POS Universal Sekarang
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                Gunakan Simulator & Guest Demo untuk mencoba seluruh fitur kasir secara bebas tanpa akun, atau daftar akun baru untuk masa Trial 30 Hari penuh.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                href="/demo"
                className="px-8 py-3.5 rounded-full bg-white text-indigo-600 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Mulai Uji Coba Demo (Bebas Akun)</span>
              </Link>
              <Link
                href="/register"
                className="px-8 py-3.5 rounded-full bg-indigo-700/80 hover:bg-indigo-700 text-white font-bold text-xs border border-indigo-400/40 transition flex items-center gap-2"
              >
                <span>Daftar Akun Baru (Trial 30 Hari)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5 font-black text-slate-950 text-base">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Store className="w-4 h-4" />
              </div>
              <span>POS Universal</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Platform software kasir cloud multi-tenant dan multi-outlet terintegrasi untuk Barbershop, Cafe & Resto, Retail, dan Laundry.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">
              Modul Vertikal Nyata
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li><Link href="/demo" className="hover:text-indigo-600">Barbershop & Salon (/queue)</Link></li>
              <li><Link href="/demo" className="hover:text-indigo-600">Cafe & Resto (/tables & /menu)</Link></li>
              <li><Link href="/demo" className="hover:text-indigo-600">Retail & Minimarket (/products)</Link></li>
              <li><Link href="/demo" className="hover:text-indigo-600">Laundry Kiloan (/orders)</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">
              Solusi & Sandbox
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li><Link href="/demo" className="hover:text-indigo-600">Simulator Harga Live</Link></li>
              <li><Link href="/demo/app" className="hover:text-indigo-600">Guest Sandbox Demo</Link></li>
              <li><Link href="/demo/app/pos" className="hover:text-indigo-600">Layar Kasir POS</Link></li>
              <li><Link href="/register" className="hover:text-indigo-600">Trial 30 Hari</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px]">
              Akses Portal
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li><Link href="/login" className="hover:text-indigo-600">Masuk Akun Kasir / Owner</Link></li>
              <li><Link href="/admin" className="hover:text-indigo-600">Portal Super Admin</Link></li>
              <li><Link href="/register" className="hover:text-indigo-600">Registrasi Usaha Baru</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>&copy; 2026 POS Universal SaaS Platform. Seluruh hak cipta dilindungi.</p>
          <p>Sistem Multi-Tenant PostgreSQL & Next.js.</p>
        </div>
      </footer>
    </div>
  );
}
