"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Check,
  Clock,
  Building2,
  Printer,
  TrendingUp,
  Palette,
  Monitor,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Play,
} from "lucide-react";

import {
  DEFAULT_DURATION_SETTINGS,
  DurationSettingItem,
  calculateDurationPrice,
} from "@/types/subscription-duration";

export function LandingClient({
  tiers = [],
  plugins = [],
  themes = [],
  durationSettings = DEFAULT_DURATION_SETTINGS,
}: {
  tiers: any[];
  plugins: any[];
  themes: any[];
  durationSettings?: DurationSettingItem[];
}) {
  const [isDark, setIsDark] = useState(false);
  const activeDurations = durationSettings.filter((d) => d.isActive);
  const [selectedDurationKey, setSelectedDurationKey] = useState<string>(
    activeDurations.find((d) => d.key === "1Y")?.key || activeDurations[0]?.key || "1M"
  );
  const activeDuration =
    activeDurations.find((d) => d.key === selectedDurationKey) || activeDurations[0] || DEFAULT_DURATION_SETTINGS[0];

  const [activeVerticalTab, setActiveVerticalTab] = useState<"cafe" | "barbershop" | "retail" | "laundry">("cafe");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<string | null>(null);


  // ── Theme Tokens ──────────────────────────────────
  const t = {
    bg: isDark ? "#070A12" : "#F8FAFC",
    bgCard: isDark ? "#111726" : "#FFFFFF",
    bgCard2: isDark ? "#0D1421" : "#F1F5F9",
    border: isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.2)",
    borderSoft: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#94A3B8",
    navBg: isDark ? "rgba(7,10,18,0.85)" : "rgba(248,250,252,0.9)",
    gridColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
    glow1: isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.07)",
    glow2: isDark ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.04)",
    glow3: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.03)",
    pillBg: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
    pillBorder: isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.25)",
    pillText: isDark ? "#A5B4FC" : "#4F46E5",
    toggleBg: isDark ? "#1E293B" : "#E2E8F0",
    inputBg: isDark ? "#0B1022" : "#FFFFFF",
    highlight: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)",
    highlightBorder: isDark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.3)",
    miniPosBg: isDark ? "#070C18" : "#F8FAFC",
    miniPosItem: isDark ? "#111726" : "#EEF2FF",
    faqBg: isDark ? "#111726" : "#FFFFFF",
    receiptBg: isDark ? "#1A2234" : "#FFFFF8",
  };

  // ── Vertical Solutions Data ───────────────────────
  const verticalSolutions = {
    cafe: {
      id: "cafe",
      name: "Cafe, F&B & Restoran",
      icon: Coffee,
      badge: "Solusi F&B",
      tagline: "Percepat pemesanan meja, varian rasa, dan cetak tiket ke dapur tanpa jeda.",
      features: [
        "Denah Meja Visual (Available, Terisi, Reserved, Billing)",
        "Kustomisasi Varian Minuman & Makanan (Hot/Iced, Gula, Es, Susu Oat)",
        "Kirim Tiket Pesanan Otomatis ke Dapur & Bar (KOT)",
        "Menu Digital & Self-Order QR untuk Pelanggan",
      ],
      sampleProducts: [
        { name: "Kopi Susu Gula Aren", price: "Rp 22.000", note: "Less Sugar, Normal Ice" },
        { name: "Iced Caramel Macchiato", price: "Rp 28.000", note: "Oat Milk (+5k)" },
        { name: "Butter Croissant", price: "Rp 24.000", note: "Warm Up" },
      ],
      receiptSample: { title: "FORE COFFEE", meta: "[ TABLE 08 • DINE IN ]", total: "Rp 79.000" },
    },
    barbershop: {
      id: "barbershop",
      name: "Barbershop & Salon",
      icon: Scissors,
      badge: "Spesialis Grooming",
      tagline: "Atur antrean kursi pangkas, hitung komisi kapster, dan cetak slip gaji otomatis.",
      features: [
        "Live Chair Board & Selector Kursi Potong (Chair 1, Chair 2, Chair 3)",
        "Penugasan Capster/Stylist per Item Transaksi",
        "Perhitungan Komisi & Tip Barber Otomatis Tanpa Rekap Manual",
        "Katalog Treatment Cepat (Haircut, Shaving, Creambath, Pomade)",
      ],
      sampleProducts: [
        { name: "Gentleman Haircut & Wash", price: "Rp 50.000", note: "Stylist: Hendra (Kursi 1)" },
        { name: "Beard Shaving & Hot Towel", price: "Rp 35.000", note: "Stylist: Hendra" },
        { name: "Pomade Matte Clay", price: "Rp 85.000", note: "Take Home" },
      ],
      receiptSample: { title: "BARBER LOUNGE", meta: "[ CHAIR #01 • HENDRA ]", total: "Rp 170.000" },
    },
    retail: {
      id: "retail",
      name: "Supermarket & Retail",
      icon: ShoppingBag,
      badge: "High-Speed Scan",
      tagline: "Scan barcode SKU cepat, kelola harga grosir bertingkat, dan gunakan Numpad kasir instan.",
      features: [
        "Auto-Focus Barcode Scanner Tanpa Perlu Klik Input",
        "Touch Numpad Kasir Jumbo untuk Edit Kuantitas Cepat",
        "Multi-Satuan Barang (Beli Dus/Karton, Jual Satuan Pcs/Lusin)",
        "Peringatan Stok Minimum Otomatis agar Tidak Kehabisan Barang",
      ],
      sampleProducts: [
        { name: "Minyak Goreng Sania 2L", price: "Rp 34.000", note: "SKU: 899234511001" },
        { name: "Beras Pandan Wangi 5Kg", price: "Rp 78.000", note: "SKU: 899234511002" },
        { name: "Air Mineral 600ml (x3)", price: "Rp 10.500", note: "SKU: 899234511003" },
      ],
      receiptSample: { title: "SMART MART", meta: "[ KASIR 01 • 5 ITEMS ]", total: "Rp 122.500" },
    },
    laundry: {
      id: "laundry",
      name: "Laundry Service",
      icon: Shirt,
      badge: "Timbangan & Tracking",
      tagline: "Input timbangan berat Kg desimal, pilih aroma parfum cucian, dan tandai nomor rak penyimpanan.",
      features: [
        "Input Timbangan Berat Kilat (Akurat hingga Desimal Kg)",
        "Pemilih Aroma Parfum Laundry & Paket (Cuci Lipat / Setrika Express)",
        "Penomoran Slot Rak Penyimpanan Pakaian Siap Ambil",
        "Cetak Nota Klaim Pelanggan & WhatsApp Notifikasi Selesai",
      ],
      sampleProducts: [
        { name: "Cuci Kering Lipat (3.5 Kg)", price: "Rp 24.500", note: "Aroma: Lavender • Rak B-04" },
        { name: "Cuci Setrika Express (2 Kg)", price: "Rp 24.000", note: "Selesai: Hari Ini 18:00" },
        { name: "Bed Cover Besar Satuan", price: "Rp 30.000", note: "Plastik Tebal" },
      ],
      receiptSample: { title: "BERSIH LAUNDRY", meta: "[ RAK B-04 • 3.5 KG ]", total: "Rp 78.500" },
    },
  };

  const currentVert = verticalSolutions[activeVerticalTab];

  const corePillars = [
    {
      icon: Building2,
      title: "Manajemen Multi-Cabang Outlet",
      desc: "Pantau omzet, stok, dan laporan seluruh cabang dalam 1 dashboard pusat tanpa repot.",
    },
    {
      icon: Clock,
      title: "Rekonsiliasi Buka & Tutup Shift",
      desc: "Kontrol modal kas awal, catat pengeluaran operasional, dan cocokkan selisih laci kasir setiap shift.",
    },
    {
      icon: TrendingUp,
      title: "Analitik Penjualan & Laba Real-Time",
      desc: "Laporan harian, mingguan, bulanan yang otomatis kalkulasi HPP, laba kotor, dan produk terlaris.",
    },
    {
      icon: Printer,
      title: "Cetak Struk Thermal Fleksibel",
      desc: "Mendukung printer 58mm & 80mm via Bluetooth/USB/WiFi, lengkap QRIS dinamis dan logo toko.",
    },
  ];

  const faqs = [
    {
      q: "Apakah saya bisa mencoba Qassa secara gratis terlebih dahulu?",
      a: "Ya! Anda dapat langsung mendaftar untuk menikmati masa Uji Coba Gratis (Free Trial) selama 30 Hari dengan akses penuh ke seluruh fitur tanpa perlu memasukkan kartu kredit.",
    },
    {
      q: "Apakah Qassa cocok untuk bisnis yang memiliki lebih dari satu cabang?",
      a: "Sangat cocok. Qassa dirancang dengan arsitektur multi-outlet di mana Anda dapat memantau penjualan semua cabang, mengelola stok per gudang, dan memberikan hak akses khusus kasir per cabang dari 1 akun pemilik.",
    },
    {
      q: "Perangkat hardware apa saja yang didukung oleh Qassa?",
      a: "Qassa berbasis cloud modern dan dapat diakses melalui laptop, PC komputer, tablet Android/iPad, maupun smartphone. Kompatibel dengan semua jenis printer thermal (Bluetooth/USB/LAN) dan barcode scanner standar.",
    },
    {
      q: "Bagaimana cara kerja perhitungan komisi kapster di Barbershop?",
      a: "Saat kasir menginput transaksi, cukup pilih nama kapster yang melayani. Qassa akan otomatis mengalokasikan komisi dan membuat rekap bagi hasil tanpa perlu dihitung manual.",
    },
    {
      q: "Apakah tema antarmuka kasir bisa disesuaikan dengan jenis bisnis saya?",
      a: "Tentu! Qassa Store menyediakan layout layar kasir khusus per vertikal: F&B, Barbershop, Retail, dan Laundry. Tema cetak struk dan warna dashboard juga bisa diubah.",
    },
    {
      q: "Apakah data transaksi dan keuangan bisnis saya aman?",
      a: "Keamanan adalah prioritas utama kami. Seluruh data disimpan pada server cloud terenkripsi dengan backup otomatis harian dan pemisahan data per tenant yang ketat.",
    },
  ];

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300 relative overflow-hidden"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {/* Background Vector Grid & Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${t.gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${t.gridColor} 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${t.glow1}, transparent 70%)` }}
        />
        <div
          className="absolute top-[45%] -right-40 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ backgroundColor: t.glow2 }}
        />
        <div
          className="absolute top-[75%] -left-40 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ backgroundColor: t.glow3 }}
        />
      </div>

      {/* ── STICKY NAVBAR ── */}
      <header
        className="border-b sticky top-0 z-50 backdrop-blur-xl transition-colors duration-300"
        style={{ backgroundColor: t.navBg, borderColor: t.borderSoft }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group">
            <div className="relative w-20 h-20 group-hover:scale-105 transition">
              <Image
                src="/smLogo.png"
                alt="Qassa Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight" style={{ color: t.text }}>
                  Qassa
                </span>
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border uppercase tracking-wider"
                  style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
                >
                  Cloud POS
                </span>
              </div>
              <p className="text-[10px] font-medium" style={{ color: t.textMuted }}>
                Smart Multi-Vertical Platform
              </p>
            </div>
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold" style={{ color: t.textSub }}>
            <a href="#solutions" className="hover:text-indigo-500 transition">Solusi Vertikal</a>
            <a href="#features" className="hover:text-indigo-500 transition">Fitur Unggulan</a>
            <a href="#store" className="hover:text-indigo-500 transition">Store & Add-on</a>
            <a href="#pricing" className="hover:text-indigo-500 transition">Pilihan Paket</a>
            <a href="#faq" className="hover:text-indigo-500 transition">FAQ</a>
          </nav>

          {/* Right CTA + Dark/Light Toggle */}
          <div className="flex items-center gap-2">
            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
              style={{ backgroundColor: t.toggleBg, borderColor: t.borderSoft, color: t.textSub }}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition"
              style={{ color: t.textSub }}
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-1.5 active:scale-95"
            >
              <span>Coba Gratis 30 Hari</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-extrabold"
          style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Platform POS Multi-Vertikal Generasi Terbaru di Indonesia</span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]" style={{ color: t.text }}>
            Satu Sistem Kasir Cerdas untuk{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Segala Bidang Bisnis Anda.
            </span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium" style={{ color: t.textSub }}>
            Qassa menghadirkan alur kerja kasir yang dirancang khusus untuk{" "}
            <strong style={{ color: t.text }}>F&B Cafe, Barbershop, Retail, dan Laundry</strong>. Lengkap dengan kontrol multi-cabang dan analitik laba real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-2xl shadow-indigo-600/35 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Mulai Uji Coba Gratis 30 Hari</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pos"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm border transition flex items-center justify-center gap-2"
            style={{ backgroundColor: t.bgCard, borderColor: t.borderSoft, color: t.text }}
          >
            <Play className="w-4 h-4 text-indigo-500 fill-indigo-500" />
            <span>Coba Demo Kasir POS Langsung</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold pt-3" style={{ color: t.textMuted }}>
          {["Tanpa Kartu Kredit", "Aktif Seketika dalam 1 Menit", "Dukungan Printer & Multi-Hardware"].map((g) => (
            <span key={g} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* ── LIVE VERTICAL EXPLORER ── */}
      <section id="solutions" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
            Alur Kasir Adaptif Sesuai Usaha Anda
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: t.text }}>
            Pilih Bidang Bisnis & Rasakan Alurnya
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: t.textSub }}>
            Qassa mengadaptasi layar kasir, tombol, dan komponen struk sesuai ritme operasional usaha Anda.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {[
            { id: "cafe", label: "☕ Cafe & Resto" },
            { id: "barbershop", label: "💈 Barbershop & Salon" },
            { id: "retail", label: "🛒 Retail & Mart" },
            { id: "laundry", label: "🧺 Laundry Service" },
          ].map((tab) => {
            const active = activeVerticalTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveVerticalTab(tab.id as any)}
                className="px-5 py-3 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap border"
                style={{
                  backgroundColor: active ? "#4F46E5" : t.bgCard,
                  color: active ? "#FFFFFF" : t.textSub,
                  borderColor: active ? "#4F46E5" : t.borderSoft,
                  boxShadow: active ? "0 4px 20px rgba(79,70,229,0.35)" : "none",
                  transform: active ? "scale(1.05)" : "scale(1)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Simulation Card */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-[2.5rem] p-6 sm:p-9 shadow-2xl items-start border"
          style={{ backgroundColor: t.bgCard, borderColor: t.border }}
        >
          {/* Left */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span
                className="px-3 py-1 rounded-full font-extrabold text-[10px] border uppercase tracking-wider"
                style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
              >
                {currentVert.badge}
              </span>
              <h3 className="text-2xl font-black" style={{ color: t.text }}>{currentVert.name}</h3>
              <p className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: t.textSub }}>
                {currentVert.tagline}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentVert.features.map((feat, fIdx) => (
                <div
                  key={fIdx}
                  className="p-3.5 rounded-2xl flex items-start gap-2.5 text-xs border"
                  style={{ backgroundColor: t.bgCard2, borderColor: t.borderSoft, color: t.textSub }}
                >
                  <span className="text-emerald-500 font-bold text-sm">✓</span>
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>

            {/* Mini POS Preview */}
            <div
              className="p-4 rounded-2xl space-y-3 font-mono text-xs border"
              style={{ backgroundColor: t.miniPosBg, borderColor: t.borderSoft }}
            >
              <div
                className="flex items-center justify-between pb-2 border-b text-[11px] font-sans"
                style={{ borderColor: t.borderSoft, color: t.textMuted }}
              >
                <span className="font-bold flex items-center gap-1.5" style={{ color: t.text }}>
                  <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                  Pratinjau Antarmuka Kasir
                </span>
                <span className="text-emerald-500 font-bold">● Live Active</span>
              </div>
              {currentVert.sampleProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl flex items-center justify-between gap-2 border"
                  style={{ backgroundColor: t.miniPosItem, borderColor: t.borderSoft }}
                >
                  <div>
                    <span className="font-bold text-xs" style={{ color: t.text }}>{p.name}</span>
                    <span className="block text-[10px] italic text-indigo-500">{p.note}</span>
                  </div>
                  <span className="font-bold text-xs text-emerald-500">{p.price}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/register?vertical=${currentVert.id}`}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition inline-flex items-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <span>Daftar Coba Vertikal {currentVert.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Right — Thermal Receipt */}
          <div
            className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-3xl border"
            style={{ backgroundColor: t.bgCard2, borderColor: t.borderSoft }}
          >
            <div className="text-center mb-3">
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1"
                style={{ color: t.textMuted }}
              >
                <Printer className="w-3 h-3 text-indigo-500" /> Hasil Cetak Struk Thermal
              </span>
            </div>

            <div
              className="w-full max-w-[290px] rounded-2xl p-4 sm:p-5 font-mono shadow-2xl space-y-2 text-xs select-none border transition-all duration-300 transform hover:scale-[1.02]"
              style={{
                backgroundColor: "#FFFDF9",
                color: "#1C1917",
                borderColor: "#D6D3D1",
                boxShadow: "0 15px 30px -5px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
              }}
            >
              {/* === 1. CAFE & RESTO RECEIPT === */}
              {activeVerticalTab === "cafe" && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="text-center space-y-0.5">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-xs mx-auto flex items-center justify-center mb-1">
                      ☕
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
                      FORE COFFEE &amp; ROASTERY
                    </h4>
                    <p className="text-[9px] font-bold text-stone-600">Senopati Flagship • Jakarta</p>
                    <p className="text-[9px] text-stone-500">Telp: (021) 5790-2211</p>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="text-[10px] font-semibold text-stone-700 space-y-0.5">
                    <div className="flex justify-between font-black text-stone-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                      <span>[ MEJA 08 • DINE IN ]</span>
                      <span>#KOT-042</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-500 pt-0.5">
                      <span>Kasir: Budi #02</span>
                      <span>19/08/2026 14:23</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-2 text-[10px]">
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>1x Kopi Susu Aren</span>
                        <span>22.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-2">└ Less Sugar, Normal Ice</p>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>1x Iced Caramel Macchiato</span>
                        <span>28.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-2">└ Oat Milk (+5k), Extra Shot (+4k)</p>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>1x Butter Croissant</span>
                        <span>24.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-2">└ Diangatkan (Warm Up)</p>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal:</span>
                      <span>74.000</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Service Charge (5%):</span>
                      <span>3.700</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>PB1 Resto (10%):</span>
                      <span>7.770</span>
                    </div>
                    <div className="flex justify-between font-black text-stone-950 text-xs pt-1 border-t border-stone-300">
                      <span>TOTAL:</span>
                      <span>Rp 85.470</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-emerald-700 font-bold pt-0.5">
                      <span>Bayar (QRIS BCA):</span>
                      <span>LUNAS</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="p-1.5 bg-stone-100 rounded text-center text-[8.5px] space-y-0.5 border border-stone-200">
                    <p className="font-bold text-stone-800">📶 Free WiFi: FORE_GUEST</p>
                    <p className="text-stone-600">Password: <span className="font-mono font-black">kopipagi2026</span></p>
                  </div>

                  <div className="text-center text-[8.5px] text-stone-500 pt-0.5">
                    <p>Terima kasih atas kunjungan Anda!</p>
                    <p className="text-[7.5px] opacity-70">Powered by Qassa F&amp;B POS</p>
                  </div>
                </div>
              )}

              {/* === 2. BARBERSHOP & SALON RECEIPT === */}
              {activeVerticalTab === "barbershop" && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="text-center space-y-0.5">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-black text-xs mx-auto flex items-center justify-center mb-1">
                      ✂️
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
                      CAPTAIN BARBERSHOP
                    </h4>
                    <p className="text-[9px] font-bold text-stone-600">Galaxy City Branch • Bekasi</p>
                    <p className="text-[9px] text-stone-500">Telp: 0811-9988-7711</p>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="text-[10px] font-semibold text-stone-700 space-y-0.5">
                    <div className="flex justify-between font-black text-stone-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60">
                      <span>[ KURSI #01 • CAPSTER HENDRA ]</span>
                      <span>#TRX-882</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-600 pt-0.5">
                      <span>Cust: Dimas P. (VIP Silver)</span>
                      <span>19/08 16:40</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-2 text-[10px]">
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>1x Gentleman Cut &amp; Wash (45m)</span>
                        <span>65.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-2">└ Hot Towel + Tonic Head Massage</p>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>1x Beard Shave &amp; Shaping</span>
                        <span>35.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-2">└ Cooling Aftershave Lotion</p>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>1x Matte Clay Pomade 100g</span>
                        <span>85.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-2">└ Produk Takeaway (Hold 5/5)</p>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal Jasa &amp; Produk:</span>
                      <span>185.000</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Diskon Member VIP:</span>
                      <span>-15.000</span>
                    </div>
                    <div className="flex justify-between font-black text-stone-950 text-xs pt-1 border-t border-stone-300">
                      <span>TOTAL BAYAR:</span>
                      <span>Rp 170.000</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-600 pt-0.5">
                      <span>Metode: Debit Mandiri</span>
                      <span>LUNAS</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="p-1.5 bg-amber-50/80 rounded text-center text-[8.5px] space-y-0.5 border border-amber-200">
                    <p className="font-extrabold text-amber-900">⭐ Reward: +17 Poin (Total: 145 Poin)</p>
                    <p className="text-amber-800 font-medium">3x Kunjungan lagi dapat FREE Haircut!</p>
                  </div>

                  <div className="text-center text-[8.5px] text-stone-500 pt-0.5">
                    <p>Booking kapster favorit: captainbarber.id</p>
                    <p className="text-[7.5px] opacity-70">Powered by Qassa Barbershop POS</p>
                  </div>
                </div>
              )}

              {/* === 3. RETAIL & MINIMARKET RECEIPT === */}
              {activeVerticalTab === "retail" && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="text-center space-y-0.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-black text-xs mx-auto flex items-center justify-center mb-1">
                      🛒
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
                      SMART MART SUPERSTORE
                    </h4>
                    <p className="text-[9px] font-bold text-stone-600">Kelapa Gading Mall • LG-12</p>
                    <p className="text-[9px] text-stone-500">NPWP: 01.889.332.1-042.000</p>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="text-[9px] text-stone-600 flex justify-between font-mono">
                    <span>Kasir: Siti #04 • POS 02</span>
                    <span>19/08/2026 19:45</span>
                  </div>
                  <div className="text-[9px] font-bold text-stone-800 flex justify-between">
                    <span>No: TRX-992014</span>
                    <span>Member: 0812998811</span>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-1.5 text-[9.5px]">
                    <div>
                      <p className="font-bold text-stone-900">8992753 Sania Minyak Goreng 2L</p>
                      <div className="flex justify-between text-stone-600 pl-1">
                        <span>1 Pcs x 34.500</span>
                        <span className="font-semibold text-stone-900">34.500</span>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-stone-900">8991002 Indomie Goreng Spesial</p>
                      <div className="flex justify-between text-stone-600 pl-1">
                        <span>5 Pcs x 3.100</span>
                        <span className="font-semibold text-stone-900">15.500</span>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-stone-900">8998866 Ultra Milk Cokelat 1L</p>
                      <div className="flex justify-between text-stone-600 pl-1">
                        <span>2 Pcs x 19.000</span>
                        <span className="font-semibold text-stone-900">38.000</span>
                      </div>
                      <div className="flex justify-between text-[8px] text-emerald-600 font-bold pl-1">
                        <span>└ Promo Beli 2 Disc:</span>
                        <span>-4.000</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between text-stone-600">
                      <span>Total Item (8 Pcs):</span>
                      <span>88.000</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Hemat Promo Retail:</span>
                      <span>-4.000</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-[8.5px]">
                      <span>PPN 11% (Termasuk):</span>
                      <span>8.324</span>
                    </div>
                    <div className="flex justify-between font-black text-stone-950 text-xs pt-1 border-t border-stone-300">
                      <span>TOTAL AKHIR:</span>
                      <span>Rp 84.000</span>
                    </div>
                    <div className="flex justify-between text-stone-700 pt-0.5">
                      <span>Tunai (Cash):</span>
                      <span>100.000</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-900">
                      <span>KEMBALIAN:</span>
                      <span>16.000</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  {/* Realistic Thermal Barcode */}
                  <div className="text-center pt-1 space-y-0.5">
                    <div className="font-mono text-xs font-black tracking-widest text-stone-800 select-none">
                      ||| | | |||| || || | |||| |||
                    </div>
                    <p className="text-[7.5px] text-stone-400">TRX-992014-20260819</p>
                    <p className="text-[7.5px] text-stone-500">Barang yang dibeli dapat ditukar 1x24 jam dengan struk.</p>
                  </div>
                </div>
              )}

              {/* === 4. LAUNDRY SERVICE RECEIPT === */}
              {activeVerticalTab === "laundry" && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="text-center space-y-0.5">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-black text-xs mx-auto flex items-center justify-center mb-1">
                      🧺
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-stone-950">
                      CLEAN &amp; FRESH LAUNDRY
                    </h4>
                    <p className="text-[9px] font-bold text-stone-600">Margonda Raya No. 88 • Depok</p>
                    <p className="text-[9px] text-stone-500">WhatsApp: 0812-3344-5566</p>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="text-[9.5px] font-semibold text-stone-700 space-y-0.5">
                    <div className="flex justify-between font-black text-stone-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                      <span>NOTA KLAIM: #LND-9921</span>
                      <span>[ RAK: C-04 ]</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-stone-600 pt-0.5">
                      <span>Pelanggan: Ibu Ratna</span>
                      <span>0812-8899-xxxx</span>
                    </div>
                    <div className="grid grid-cols-2 text-[8px] text-stone-500 pt-0.5 border-t border-stone-200">
                      <span>Masuk: 19/08 09:30</span>
                      <span className="text-right font-bold text-purple-800">Selesai: 21/08 17:00</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-2 text-[9.5px]">
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Cuci Kering Lipat Reguler</span>
                        <span>28.000</span>
                      </div>
                      <div className="flex justify-between text-[8.5px] text-stone-500 pl-1">
                        <span>3.50 Kg x Rp 8.000/Kg</span>
                        <span>Parfum: Lavender</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Dry Clean Jas Pria (Satuan)</span>
                        <span>35.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-1">1 Pcs • Hanger + Plastik Cover</p>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Bed Cover King Size (Satuan)</span>
                        <span>25.000</span>
                      </div>
                      <p className="text-[8.5px] text-stone-500 pl-1">1 Pcs • Plastik Vakum</p>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between text-stone-600">
                      <span>Total Berat &amp; Item:</span>
                      <span>3.50 Kg + 2 Pcs</span>
                    </div>
                    <div className="flex justify-between font-black text-stone-950 text-xs pt-1 border-t border-stone-300">
                      <span>TOTAL BIAYA:</span>
                      <span>Rp 88.000</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-emerald-700 font-bold pt-0.5">
                      <span>Status: LUNAS (QRIS)</span>
                      <span>Cucian: 3 Paket</span>
                    </div>
                  </div>

                  <div className="border-b border-stone-400 border-dashed my-1.5" />

                  <div className="p-1.5 bg-stone-100 rounded text-center text-[8px] space-y-0.5 border border-stone-200">
                    <p className="font-bold text-stone-800">⚠️ Syarat Pengambilan:</p>
                    <p className="text-stone-600">1. Wajib tunjukkan nota ini saat ambil pakaian.</p>
                    <p className="text-stone-600">2. Klaim keluhan maksimal 1x24 jam setelah diambil.</p>
                  </div>

                  <div className="text-center text-[8px] text-stone-500 pt-0.5">
                    <p>Cek status cucian online: qassa.id/c/9921</p>
                    <p className="text-[7.5px] opacity-70">Powered by Qassa Laundry POS</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE SYSTEM PILLARS ── */}
      <section id="features" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
            Fondasi Bisnis Tangguh
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: t.text }}>
            Fitur Kelas Enterprise untuk Semua Skala Usaha
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: t.textSub }}>
            Kelola operasional harian secara presisi tanpa perlu rekap manual di atas kertas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePillars.map((pillar, idx) => {
            const IconC = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl shadow-xl space-y-4 border transition"
                style={{ backgroundColor: t.bgCard, borderColor: t.borderSoft }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                  style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder }}
                >
                  <IconC className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ color: t.text }}>{pillar.title}</h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: t.textSub }}>{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── STORE & ADD-ON ── */}
      <section id="store" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className="p-8 sm:p-12 rounded-[3rem] border shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: t.bgCard, borderColor: t.highlightBorder }}
        >
          <div className="max-w-3xl space-y-6">
            <span
              className="px-3.5 py-1 rounded-full font-extrabold text-xs border uppercase tracking-wider inline-flex items-center gap-1.5"
              style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
            >
              <Store className="w-3.5 h-3.5 text-amber-500" />
              Qassa Store & Add-on Marketplace
            </span>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight" style={{ color: t.text }}>
              Kembangkan Fitur Bisnis Anda Kapan Saja Sesuai Kebutuhan
            </h2>

            <p className="text-sm leading-relaxed" style={{ color: t.textSub }}>
              Tidak perlu membayar fitur yang tidak Anda pakai. Aktifkan tema layout layar POS, template cetak struk, dan plugin bisnis tambahan secara modular dari Qassa Store.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { icon: Monitor, color: "text-indigo-500", title: "Tema Layout Layar POS", desc: "Layout kasir khusus F&B, Barber, Retail, dan Laundry." },
                { icon: Printer, color: "text-purple-500", title: "Tema Cetak Struk Thermal", desc: "Template struk modern, vintage, compact, hingga nota klaim." },
                { icon: Palette, color: "text-cyan-500", title: "Tema UI Dashboard", desc: "Palet warna Luxe Dark, Modern Slate, Warm Sand, dan Compact." },
              ].map((item, idx) => {
                const IconC = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border space-y-1.5"
                    style={{ backgroundColor: t.bgCard2, borderColor: t.borderSoft }}
                  >
                    <IconC className={`w-5 h-5 ${item.color}`} />
                    <h4 className="font-bold text-xs" style={{ color: t.text }}>{item.title}</h4>
                    <p className="text-[11px]" style={{ color: t.textMuted }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">Transparan & Fleksibel</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: t.text }}>
            Investasi Terjangkau untuk Pertumbuhan Bisnis
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: t.textSub }}>
            Mulai dengan Trial Gratis 30 Hari. Pilih paket yang sesuai saat Anda sudah siap berlangganan.
          </p>

          {/* Multi-Duration Pill Selector (1 Bulan s/d 3 Tahun) */}
          <div
            className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl border mt-4 max-w-full"
            style={{ backgroundColor: t.bgCard2, borderColor: t.borderSoft }}
          >
            {activeDurations.map((dur) => {
              const isSelected = selectedDurationKey === dur.key;
              return (
                <button
                  key={dur.key}
                  type="button"
                  onClick={() => setSelectedDurationKey(dur.key)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  style={{
                    backgroundColor: isSelected ? "#4F46E5" : "transparent",
                    color: isSelected ? "#FFFFFF" : t.textSub,
                  }}
                >
                  <span>{dur.label}</span>
                  {dur.discountPercent > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? "bg-white/20 text-white" : "bg-emerald-500 text-white"
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

        {(() => {
          const starterCalc = calculateDurationPrice(150000, activeDuration);
          const proCalc = calculateDurationPrice(500000, activeDuration);

          return (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${expandedFaqIndex === null ? 'items-stretch' : 'items-start'}`}>
              {/* Starter / Basic */}
              <div
                className="p-7 sm:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between space-y-6 border"
                style={{ backgroundColor: t.bgCard, borderColor: t.borderSoft }}
              >
                <div className="space-y-4">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ backgroundColor: t.bgCard2, color: t.textSub }}
                  >
                    Paket Starter (Basic)
                  </span>
                  <div className="min-h-[4rem]">
                    <h3 className="text-2xl font-black" style={{ color: t.text }}>Starter Basic</h3>
                    <p className="text-xs mt-1" style={{ color: t.textSub }}>Ideal untuk outlet tunggal atau usaha rintisan mandiri.</p>
                  </div>
                  <div className="pt-2 min-h-[4.5rem] flex flex-col justify-center">
                    <span className="text-3xl sm:text-4xl font-black" style={{ color: t.text }}>
                      Rp {starterCalc.totalPrice.toLocaleString("id-ID")}
                    </span>
                    <div className="mt-1">
                      {activeDuration.months > 1 ? (
                        <span className="text-[11px] font-semibold text-emerald-500 block">
                          setara Rp {starterCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat Rp {starterCalc.savedAmount.toLocaleString("id-ID")} ({activeDuration.discountPercent}%)
                        </span>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: t.textMuted }}>
                          /bulan
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs pt-2" style={{ color: t.textSub }}>
                    {[
                      "1 Cabang Outlet Utama",
                      "5 Akun Kasir per Outlet",
                      "Kasir POS Cepat & Multi-Metode Bayar (QRIS, Tunai, Kartu)",
                      "Manajemen Produk & Kategori Tanpa Batas",
                      "Manajemen Stok Produk & Peringatan Stok Menipis",
                      "Pencatatan Harga Pokok Penjualan (HPP / Modal)",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
     
                    {expandedFaqIndex === "starter" && [
                      "Buka / Tutup Shift Kasir & Rekap Kas Harian",
                      "Laporan Penjualan & Laba Rugi Outlet",
                      "Kustomisasi Logo & Cetak Struk Kasir Termal"
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 animate-fadeIn">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === "starter" ? null : "starter")}
                    className="text-xs font-bold text-indigo-500 flex items-center justify-center gap-1 w-full py-1 hover:text-indigo-600 transition"
                  >
                    {expandedFaqIndex === "starter" ? (
                      <>Tutup Detail <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Lihat Detail Paket <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
                <Link
                  href="/register"
                  className="w-full py-3.5 rounded-xl font-bold text-xs transition text-center block border mt-4"
                  style={{ backgroundColor: t.bgCard2, color: t.text, borderColor: t.borderSoft }}
                >
                  Coba Starter Gratis
                </Link>
              </div>

              {/* Pro (Popular) */}
              <div
                className="p-7 sm:p-8 rounded-[2.2rem] shadow-2xl flex flex-col justify-between space-y-6 relative border-2"
                style={{ backgroundColor: t.bgCard, borderColor: "#4F46E5" }}
              >
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-md"
                  style={{ background: "linear-gradient(to right, #4F46E5, #7C3AED)" }}
                >
                  ⭐ Paling Diminati Bisnis Berkembang
                </div>
                <div className="space-y-4 pt-2">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                    style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
                  >
                    Paket Pro Multi-Cabang
                  </span>
                  <div className="min-h-[4rem]">
                    <h3 className="text-2xl font-black" style={{ color: t.text }}>Professional</h3>
                    <p className="text-xs mt-1" style={{ color: t.textSub }}>Untuk bisnis yang berkembang dan memiliki banyak cabang.</p>
                  </div>
                  <div className="pt-2 min-h-[4.5rem] flex flex-col justify-center">
                    <span className="text-3xl sm:text-4xl font-black" style={{ color: t.text }}>
                      Rp {proCalc.totalPrice.toLocaleString("id-ID")}
                    </span>
                    <div className="mt-1">
                      {activeDuration.months > 1 ? (
                        <span className="text-[11px] font-semibold text-emerald-500 block">
                          setara Rp {proCalc.effectiveMonthlyPrice.toLocaleString("id-ID")}/bln • Hemat Rp {proCalc.savedAmount.toLocaleString("id-ID")} ({activeDuration.discountPercent}%)
                        </span>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: t.textMuted }}>
                          /bulan
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs pt-2">
                    {[
                      "Hingga 10 Cabang Outlet Aktif",
                      "Unlimited Akun Kasir per Outlet",
                      "Hak Akses Role Admin Cabang Terisolasi",
                      "Laporan Konsolidasi Seluruh Cabang",
                      "Laporan Komparatif Laba Rugi Antar-Cabang",
                      "Monitoring Stok & Mutasi Multi-Outlet",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 font-bold" style={{ color: t.text }}>
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    
                    {expandedFaqIndex === "pro" && [
                      "Laporan Penjualan per Kasir & Audit Transaksi",
                      "Export Laporan Lengkap ke Excel / CSV / PDF",
                      "Kustomisasi Layout POS & Tema Dashboard",
                      "Kasir POS Cepat & Multi-Metode Bayar (QRIS, Tunai, Kartu)",
                      "Manajemen Produk & Kategori Tanpa Batas",
                      "Manajemen Stok Produk & Peringatan Stok Menipis",
                      "Pencatatan Harga Pokok Penjualan (HPP / Modal)",
                      "Buka / Tutup Shift Kasir & Rekap Kas Harian",
                      "Laporan Penjualan & Laba Rugi Outlet",
                      "Kustomisasi Logo & Cetak Struk Kasir Termal"
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 font-medium animate-fadeIn" style={{ color: t.textSub }}>
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === "pro" ? null : "pro")}
                    className="text-xs font-bold text-indigo-500 flex items-center justify-center gap-1 w-full py-1 hover:text-indigo-600 transition"
                  >
                    {expandedFaqIndex === "pro" ? (
                      <>Tutup Detail <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Lihat Detail Paket <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
                <Link
                  href="/register"
                  className="w-full py-4 rounded-xl text-white font-extrabold text-xs shadow-xl text-center block mt-4"
                  style={{ background: "linear-gradient(to right, #4F46E5, #7C3AED)" }}
                >
                  Mulai Berlangganan Pro
                </Link>
              </div>

              {/* Enterprise */}
              <div
                className="p-7 sm:p-8 rounded-[2rem] shadow-xl flex flex-col justify-between space-y-6 border"
                style={{ backgroundColor: t.bgCard, borderColor: t.borderSoft }}
              >
                <div className="space-y-4">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ backgroundColor: t.bgCard2, color: t.textSub }}
                  >
                    Paket Korporasi & Franchise
                  </span>
                  <div className="min-h-[4rem]">
                    <h3 className="text-2xl font-black" style={{ color: t.text }}>Enterprise</h3>
                    <p className="text-xs mt-1" style={{ color: t.textSub }}>Solusi khusus skala korporasi dengan ratusan cabang.</p>
                  </div>
                  <div className="pt-2 min-h-[4.5rem] flex flex-col justify-center">
                    <span className="text-3xl sm:text-4xl font-black" style={{ color: t.text }}>
                      Kustom
                    </span>
                    <span className="text-[11px] font-medium mt-1" style={{ color: t.textMuted }}>
                      Sesuai kebutuhan cabang &amp; dedicated resource
                    </span>
                  </div>
                  <ul className="space-y-2.5 text-xs pt-2" style={{ color: t.textSub }}>
                    {[
                      "Unlimited Cabang Outlet & Gudang Pusat",
                      "Unlimited Akun Kasir & Role Kustom",
                      "Akses Open API Sistem POS & Webhook Realtime",
                      "Integrasi Sistem ERP / Akuntansi Perusahaan",
                      "Laporan Konsolidasi Holding & Multi-Entitas",
                      "Manajemen Multi-Gudang & Distribusi Terpusat",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 font-bold" style={{ color: t.text }}>
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === "enterprise" ? null : "enterprise")}
                    className="text-xs font-bold text-indigo-500 flex items-center justify-center gap-1 w-full py-1 hover:text-indigo-600 transition"
                  >
                    {expandedFaqIndex === "enterprise" ? (
                      <>Tutup Detail <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Lihat Detail Paket <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
                <Link
                  href="/register"
                  className="w-full py-3.5 rounded-xl font-bold text-xs transition text-center block border mt-4"
                  style={{ backgroundColor: t.bgCard2, color: t.text, borderColor: t.borderSoft }}
                >
                  Konsultasi Enterprise
                </Link>
              </div>
            </div>
          );
        })()}
      </section>


      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">Pertanyaan Umum</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: t.text }}>
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3 pt-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden border transition"
                style={{ backgroundColor: t.faqBg, borderColor: t.borderSoft }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm transition"
                  style={{ color: t.text }}
                >
                  <span>{faq.q}</span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
                  }
                </button>
                {isOpen && (
                  <div
                    className="px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3"
                    style={{ color: t.textSub, borderColor: t.borderSoft }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-14 rounded-[3rem] text-center text-white space-y-6 shadow-2xl shadow-indigo-600/25 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6D28D9, #0EA5E9)" }}
        >
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Siap Membawa Operasional Bisnis Anda ke Level Selanjutnya?
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 font-medium">
              Bergabunglah dengan ratusan pengusaha modern di seluruh Indonesia yang menggunakan Qassa POS.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-indigo-950 font-black text-sm shadow-xl hover:bg-slate-100 transition flex items-center justify-center gap-2"
            >
              <span>Daftar Coba Gratis 30 Hari</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl text-white font-bold text-sm border border-white/30 hover:bg-white/10 transition"
            >
              Masuk Akun Saya
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="border-t py-12 px-4 sm:px-6 lg:px-8 relative z-10 transition-colors duration-300"
        style={{ borderColor: t.borderSoft, backgroundColor: t.bg }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs" style={{ color: t.textMuted }}>
          <div className="flex items-center ">
            <div className="relative w-9 h-9">
              <Image src="/smLogo.png" alt="Qassa" fill className="object-contain" />
            </div>

            <span className="font-bold" style={{ color: t.textSub }}>Qassa Cloud POS</span>
            <span>&copy; {new Date().getFullYear()} Qassa Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            {["#solutions", "#pricing"].map((href) => (
              <a key={href} href={href} className="hover:text-indigo-500 transition">
                {href === "#solutions" ? "Solusi Vertikal" : "Harga"}
              </a>
            ))}
            <Link href="/login" className="hover:text-indigo-500 transition">Masuk</Link>
            <Link href="/register" className="font-bold text-indigo-500 hover:text-indigo-400 transition">Daftar Akun</Link>
            {/* Theme Toggle in Footer too */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition"
              style={{ backgroundColor: t.toggleBg, borderColor: t.borderSoft }}
              title={isDark ? "Mode Terang" : "Mode Gelap"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
