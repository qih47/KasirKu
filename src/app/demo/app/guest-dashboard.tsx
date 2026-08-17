"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  LayoutDashboard,
  Package,
  Users,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Settings,
  Palette,
  Sparkles,
  ArrowRight,
  RotateCcw,
  DollarSign,
  Receipt,
  Layers,
  Radio,
  Building,
  CheckCircle2,
  Percent,
} from "lucide-react";

export function GuestDashboard() {
  const [config, setConfig] = useState<any>({
    tier: { name: "Lisensi Pro", code: "pro", outletLimit: 5, kasirLimitPerOutlet: 25 },
    plugins: ["barbershop", "cafe", "retail", "laundry"],
    theme: {
      name: "Modern Minimalist",
      tokens: { primaryColor: "#4f46e5", accentColor: "#06b6d4", layoutStyle: "MODERN", radius: "1.25rem" },
    },
    billingCycle: "MONTHLY",
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_guest_demo_config");
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  const activePlugins = config.plugins || [];
  const isBarber = activePlugins.includes("barbershop");
  const isCafe = activePlugins.includes("cafe");
  const isRetail = activePlugins.includes("retail");
  const isLaundry = activePlugins.includes("laundry");

  const getPluginIcon = (code: string) => {
    switch (code) {
      case "barbershop":
        return <Scissors className="w-4 h-4 text-amber-500" />;
      case "cafe":
        return <Coffee className="w-4 h-4 text-emerald-500" />;
      case "retail":
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case "laundry":
        return <Shirt className="w-4 h-4 text-purple-500" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getPluginName = (code: string) => {
    switch (code) {
      case "barbershop":
        return "Barbershop & Salon";
      case "cafe":
        return "Cafe & Resto F&B";
      case "retail":
        return "Retail & Minimarket";
      case "laundry":
        return "Laundry Kiloan";
      default:
        return code;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Subtle Sandbox Top Announcement */}
      <div className="bg-indigo-900 text-indigo-100 px-4 py-2 text-xs border-b border-indigo-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-white/15 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-indigo-100">
              Mode Guest Demo: <strong className="text-white">{config.tier?.name || "Lisensi Pro"}</strong> ({activePlugins.length} modul aktif) &bull; Uji coba bebas tanpa database.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Ganti Konfigurasi</span>
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white transition text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <span>Daftar Akun Resmi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Header - Clean White Material 3 */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-8 z-40 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-950">
                  Demo Store Indonesia
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {config.tier?.name || "Lisensi Pro"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Outlet Utama &bull; Role:{" "}
                <span className="font-bold text-indigo-600">
                  OWNER (Demo Guest)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900">
                Tamu Demo (Guest)
              </p>
              <p className="text-[11px] text-slate-500">guest.demo@posuniversal.com</p>
            </div>
            <Link
              href="/demo/app/pos"
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir (POS)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Nav Links */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <Link
              href="/demo/app/pos"
              className="px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 font-bold"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir (POS)</span>
            </Link>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                activeTab === "products"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Produk</span>
            </button>

            {isBarber && (
              <button
                onClick={() => setActiveTab("barber")}
                className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "barber"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span>Antrian Kursi</span>
              </button>
            )}

            {isCafe && (
              <button
                onClick={() => setActiveTab("cafe")}
                className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "cafe"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                <span>Meja Cafe</span>
              </button>
            )}

            {isLaundry && (
              <button
                onClick={() => setActiveTab("laundry")}
                className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                  activeTab === "laundry"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <Shirt className="w-3.5 h-3.5 text-purple-500" />
                <span>Order Laundry</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                activeTab === "reports"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Laporan</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </div>
        </div>

        {/* ── TAB CONTENT: DASHBOARD OVERVIEW ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Mode Guest Demo Aktif
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Selamat Datang di Demo Store! 👋
                </h1>
                <p className="text-indigo-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Semua transaksi dan alur kerja di mode ini berjalan secara lokal. Anda bebas mencoba alur kasir, cetak struk, dan kelola antrian.
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3">
                <Link
                  href="/demo/app/pos"
                  className="px-6 py-3.5 rounded-2xl bg-white text-indigo-600 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition flex items-center gap-2"
                >
                  <span>Buka Kasir (POS)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Omset Demo Hari Ini</span>
                  <p className="text-2xl font-black text-slate-950">Rp 1.450.000</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Transaksi</span>
                  <p className="text-2xl font-black text-slate-950">18 Struk</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Kasir & Kapster Aktif</span>
                  <p className="text-2xl font-black text-slate-950">4 Akun</p>
                </div>
              </div>
            </div>

            {/* Active Modules Overview */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Modul Vertikal yang Anda Pasang di Simulator
                </span>
                <span className="text-xs text-indigo-600 font-bold">
                  {activePlugins.length} Modul Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activePlugins.map((code: string) => (
                  <div
                    key={code}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5"
                  >
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                      {getPluginIcon(code)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-950">
                        {getPluginName(code)}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600">● Modul Aktif</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: PRODUK ── */}
        {activeTab === "products" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-950">Katalog Produk & Jasa (Mode Demo)</h3>
            <p className="text-xs text-slate-500">Data contoh katalog produk untuk simulasi kasir.</p>
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { name: "Gentlemen Haircut + Wash", cat: "Barber Jasa", price: "Rp 65.000", stock: "Unlimited" },
                { name: "Iced Caramel Macchiato", cat: "Cafe Minuman", price: "Rp 32.000", stock: "45 Pcs" },
                { name: "Cuci Kering Setrika 5 Kg", cat: "Laundry Jasa", price: "Rp 35.000", stock: "Unlimited" },
                { name: "Pomade Matte Clay", cat: "Retail Barang", price: "Rp 75.000", stock: "12 Pcs" },
              ].map((p, i) => (
                <div key={i} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <span className="text-[10px] text-slate-400">{p.cat}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-950">{p.price}</p>
                    <span className="text-[10px] text-emerald-600">Stok: {p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: BARBER LIVE QUEUE ── */}
        {activeTab === "barber" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-950">Live Chair Board Antrian Kursi</h3>
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                Modul Barbershop
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Menunggu (2)</span>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="font-bold text-slate-900">#04 - Budi Santoso</p>
                  <p className="text-[10px] text-slate-400">Haircut &bull; Kapster: Hendra</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <span className="font-bold text-amber-800 uppercase text-[10px]">Sedang Pangkas (Kursi 1)</span>
                <div className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-sm">
                  <p className="font-bold text-slate-900">#03 - Rizky Pratama</p>
                  <p className="text-[10px] text-amber-700">Mulai: 14:15 &bull; Haircut + Shave</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-800 uppercase text-[10px]">Selesai Hari Ini (12)</span>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-sm">
                  <p className="font-bold text-slate-900">#02 - Ahmad Fajar</p>
                  <p className="text-[10px] text-emerald-700">Omset: Rp 65.000 &bull; Komisi: Rp 26.000</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: CAFE FLOOR MAP ── */}
        {activeTab === "cafe" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-950">Denah Meja Visual Cafe (Floor Map)</h3>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Modul Cafe & Resto
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <p className="text-lg font-black text-emerald-700">Meja 01</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">KOSONG</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1">
                <p className="text-lg font-black text-rose-700">Meja 02</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">TERISI (3 Tamu)</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                <p className="text-lg font-black text-amber-700">Meja 03</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">BILLING</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <p className="text-lg font-black text-emerald-700">VIP Room</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">KOSONG</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        POS Universal &bull; Guest Demo Sandbox Environment
      </footer>
    </div>
  );
}
