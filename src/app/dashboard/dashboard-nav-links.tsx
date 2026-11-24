"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Store,
  TrendingUp,
  Scissors,
  Coffee,
  Shirt,
  ShoppingBasket,
  DollarSign,
  UserCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Sliders,
  PanelLeft,
  PanelTop,
  Sun,
  Moon,
  Ticket,
  Settings,
  ShoppingBag,
  Check,
  X,
  LayoutGrid,
  List,
  Image as ImageIcon,
} from "lucide-react";
import {
  updateThemeShellConfigAction,
  ThemeShellConfig,
} from "@/modules/tenant/theme-actions";
import { toastSuccess, toastError } from "@/lib/swal";

interface DashboardNavLinksProps {
  activePlugins?: { code: string; name: string }[];
  userRole?: string;
  shellConfig?: ThemeShellConfig;
  themeTokens?: {
    primaryColor?: string;
    accentColor?: string;
    layoutStyle?: string;
    isLuxeDark?: boolean;
  };
  children?: React.ReactNode;
}

const COLOR_PRESETS = [
  { name: "Indigo Royal", primary: "#4f46e5", accent: "#06b6d4" },
  { name: "Emerald Cafe", primary: "#059669", accent: "#10b981" },
  { name: "Ocean Blue", primary: "#2563eb", accent: "#0ea5e9" },
  { name: "Amber Barber", primary: "#d97706", accent: "#f59e0b" },
  { name: "Rose Vibrant", primary: "#e11d48", accent: "#f43f5e" },
  { name: "Violet Cyber", primary: "#7c3aed", accent: "#a855f7" },
];

export function DashboardNavLinks({
  activePlugins = [],
  userRole = "OWNER",
  shellConfig: initialShell = {},
  themeTokens = {},
  children,
}: DashboardNavLinksProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [shell, setShell] = useState<ThemeShellConfig>({
    dashboardNavPosition: initialShell.dashboardNavPosition || "TOP_NAV",
    posCategoryPosition: initialShell.posCategoryPosition || "TOP_PILLS",
    posCartDock: initialShell.posCartDock || "RIGHT",
    posGridColumns: initialShell.posGridColumns || 4,
    posCardStyle: initialShell.posCardStyle || "GRID_CARD",
    primaryColor: initialShell.primaryColor || themeTokens.primaryColor || "#4f46e5",
    accentColor: initialShell.accentColor || themeTokens.accentColor || "#06b6d4",
    mode: initialShell.mode || (themeTokens.isLuxeDark ? "dark" : "light"),
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    initialShell.sidebarCollapsed || false
  );
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  const primaryColor = shell.primaryColor || themeTokens.primaryColor || "#4f46e5";
  const isLuxeDark = shell.mode === "dark" || themeTokens.isLuxeDark || false;
  const navPosition = shell.dashboardNavPosition || "TOP_NAV";

  const isBarbershopActive = activePlugins.some((p) => p.code === "barbershop");
  const isCafeActive = activePlugins.some((p) => p.code === "cafe");
  const isLaundryActive = activePlugins.some((p) => p.code === "laundry");
  const isRetailActive = activePlugins.some((p) => p.code === "retail");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  const handleSaveShellConfig = async (updates: Partial<ThemeShellConfig>) => {
    const nextShell = { ...shell, ...updates };
    setShell(nextShell);
    setSavingConfig(true);
    try {
      await updateThemeShellConfigAction(nextShell);
      toastSuccess("Konfigurasi tampilan & tata letak berhasil diterapkan!");
      router.refresh();
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan konfigurasi tampilan.");
    } finally {
      setSavingConfig(false);
    }
  };

  const isStaffActive =
    pathname.startsWith("/dashboard/staff") || pathname.startsWith("/dashboard/payroll");
  const isVerticalActive =
    pathname.startsWith("/dashboard/cafe") ||
    pathname.startsWith("/dashboard/barbershop") ||
    pathname.startsWith("/dashboard/laundry") ||
    pathname.startsWith("/dashboard/retail");

  const verticalModules = [
    ...(isCafeActive
      ? [
          {
            id: "cafe",
            name: "Kafe & Resto",
            icon: Coffee,
            items: [
              {
                name: "Denah Meja & Billing",
                href: "/dashboard/cafe/tables",
                icon: Coffee,
                desc: "Live status meja & open bill",
              },
              {
                name: "Komisi Cafe",
                href: "/dashboard/cafe/commissions",
                icon: DollarSign,
                desc: "Rekap komisi barista & chef",
              },
            ],
          },
        ]
      : []),
    ...(isBarbershopActive
      ? [
          {
            id: "barbershop",
            name: "Barbershop",
            icon: Scissors,
            items: [
              {
                name: "Antrean & Kursi Potong",
                href: "/dashboard/barbershop/queue",
                icon: Scissors,
                desc: "Live antrean & booking kapster",
              },
              {
                name: "Komisi Kapster",
                href: "/dashboard/barbershop/commissions",
                icon: DollarSign,
                desc: "Rekap bagi hasil kapster",
              },
            ],
          },
        ]
      : []),
    ...(isLaundryActive
      ? [
          {
            id: "laundry",
            name: "Laundry & Cuci",
            icon: Shirt,
            items: [
              {
                name: "Pesanan Cucian",
                href: "/dashboard/laundry/orders",
                icon: Shirt,
                desc: "Tracking cuci, kering, & setrika",
              },
              {
                name: "Komisi Laundry",
                href: "/dashboard/laundry/commissions",
                icon: DollarSign,
                desc: "Rekap komisi operator laundry",
              },
            ],
          },
        ]
      : []),
    ...(isRetailActive
      ? [
          {
            id: "retail",
            name: "Retail & Mart",
            icon: ShoppingBasket,
            items: [
              {
                name: "Komisi Retail",
                href: "/dashboard/retail/commissions",
                icon: DollarSign,
                desc: "Insentif penjualan produk toko",
              },
            ],
          },
        ]
      : []),
  ];

  const hasAnyVertical = verticalModules.length > 0;

  // Customizer Drawer Modal UI
  const customizerModal = showCustomizer ? (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowCustomizer(false);
      }}
    >
      <div
        className={`w-full max-w-md h-full overflow-y-auto p-6 border-l shadow-2xl flex flex-col justify-between space-y-6 ${
          isLuxeDark
            ? "bg-[#0F172A] border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                <Sparkles className="w-3 h-3" />
                Dynamic UI &amp; Theme Engine
              </span>
              <h3 className="text-lg font-black tracking-tight">
                Kustomisasi Tata Letak &amp; Tema
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur posisi navigasi Dashboard, layout Kasir POS, dan palet warna secara real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomizer(false)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. Posisi Navigasi Dashboard */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
              1. Posisi Navigasi Dashboard
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveShellConfig({ dashboardNavPosition: "TOP_NAV" })}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer space-y-1.5 ${
                  navPosition === "TOP_NAV"
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <PanelTop className="w-5 h-5 text-indigo-500" />
                  {navPosition === "TOP_NAV" && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Tab Navigasi Atas</div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Menu horizontal ringkas di bagian atas halaman.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveShellConfig({ dashboardNavPosition: "SIDEBAR_LEFT" })}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer space-y-1.5 ${
                  navPosition === "SIDEBAR_LEFT"
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <PanelLeft className="w-5 h-5 text-indigo-500" />
                  {navPosition === "SIDEBAR_LEFT" && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Sidebar Kiri Modern</div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Navigasi vertikal di sisi kiri yang dapat dilipat (collapsible).
                </p>
              </button>
            </div>
          </div>

          {/* 2. Posisi Kategori & Stasiun di POS Kasir */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
              2. Navigasi Kategori &amp; Stasiun di POS Kasir
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveShellConfig({ posCategoryPosition: "TOP_PILLS" })}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer space-y-1.5 ${
                  shell.posCategoryPosition === "TOP_PILLS"
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <PanelTop className="w-5 h-5 text-emerald-500" />
                  {shell.posCategoryPosition === "TOP_PILLS" && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Tab Horizontal Atas</div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Kategori produk berjajar sebagai pill di atas katalog POS.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveShellConfig({ posCategoryPosition: "SIDEBAR_LEFT" })}
                className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer space-y-1.5 ${
                  shell.posCategoryPosition === "SIDEBAR_LEFT"
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <PanelLeft className="w-5 h-5 text-emerald-500" />
                  {shell.posCategoryPosition === "SIDEBAR_LEFT" && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Sidebar Kiri Kasir POS</div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Stasiun kerja &amp; kategori produk berada di sidebar kiri POS.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Posisi Keranjang & Gaya Kartu Produk POS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Posisi Keranjang POS
              </label>
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 gap-1">
                {(["RIGHT", "LEFT"] as const).map((dock) => (
                  <button
                    key={dock}
                    type="button"
                    onClick={() => handleSaveShellConfig({ posCartDock: dock })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      shell.posCartDock === dock
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {dock === "RIGHT" ? "Kanan" : "Kiri"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Kolom Grid Produk
              </label>
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 gap-1">
                {([3, 4, 5] as const).map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => handleSaveShellConfig({ posGridColumns: cols })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      shell.posGridColumns === cols
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cols} Kol
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Gaya Tampilan Item Produk di POS */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Gaya Tampilan Produk di POS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "GRID_CARD", label: "Kartu Grid", icon: LayoutGrid },
                { id: "LARGE_PHOTO", label: "Foto Besar", icon: ImageIcon },
                { id: "COMPACT_ROW", label: "List Cepat", icon: List },
              ].map((st) => {
                const IconComp = st.icon;
                const active = shell.posCardStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      handleSaveShellConfig({
                        posCardStyle: st.id as ThemeShellConfig["posCardStyle"],
                      })
                    }
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      active
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="text-[11px]">{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Mode Gelap / Terang & Palet Warna */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Mode Warna &amp; Palet Utama
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handleSaveShellConfig({ mode: "light" })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    shell.mode !== "dark"
                      ? "bg-amber-500 text-white"
                      : "text-slate-400"
                  }`}
                >
                  <Sun className="w-3 h-3" /> Terang
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveShellConfig({ mode: "dark" })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    shell.mode === "dark"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400"
                  }`}
                >
                  <Moon className="w-3 h-3" /> Gelap
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected =
                  (shell.primaryColor || "").toLowerCase() === preset.primary.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      handleSaveShellConfig({
                        primaryColor: preset.primary,
                        accentColor: preset.accent,
                      })
                    }
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "border-slate-900 dark:border-white ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="text-[11px] font-bold truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <Link
            href="/dashboard/themes"
            onClick={() => setShowCustomizer(false)}
            className="text-xs font-bold text-indigo-500 hover:underline"
          >
            Buka Galeri Tema Lengkap &rarr;
          </Link>
          <button
            type="button"
            onClick={() => setShowCustomizer(false)}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            {savingConfig ? "Menyimpan..." : "Selesai"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ============================================================================
  // MODE B: SIDEBAR_LEFT LAYOUT (Left Vertical Sidebar + Main Content Area)
  // ============================================================================
  if (navPosition === "SIDEBAR_LEFT") {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {customizerModal}

        {/* Left Collapsible Sidebar */}
        <aside
          className={`w-full ${
            sidebarCollapsed ? "lg:w-[76px]" : "lg:w-64"
          } flex-shrink-0 rounded-3xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3 transition-all duration-200 lg:sticky lg:top-20 ${
            isLuxeDark
              ? "bg-[#111827] border-slate-800 text-slate-200"
              : "bg-white border-slate-200/90 text-slate-800"
          }`}
        >
          {/* Sidebar Header & Collapse Toggle */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-slate-100 dark:border-slate-800">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Menu Navigasi
              </span>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setShowCustomizer(true)}
                title="Kustomisasi Layout & Tema"
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500 transition cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                title={sidebarCollapsed ? "Perlebar Sidebar" : "Kecilkan Sidebar"}
                className="hidden lg:flex p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <nav className="space-y-4">
            {/* Group 1: Operasional Utama */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Operasional Inti
                </div>
              )}
              {[
                { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard, exact: true },
                ...(userRole !== "ADMIN_CABANG" ? [{ name: "Cabang Outlet", href: "/dashboard/outlets", icon: Store }] : []),
                { name: "Produk & Stok", href: "/dashboard/products", icon: Package },
                { name: "Pelanggan (CRM)", href: "/dashboard/customers", icon: UserCheck },
                { name: "Promo & Voucher", href: "/dashboard/vouchers", icon: Ticket },
              ].map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.name}
                    style={
                      active
                        ? {
                            backgroundColor: primaryColor,
                            color: "#ffffff",
                            boxShadow: `0 4px 12px ${primaryColor}35`,
                          }
                        : undefined
                    }
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      active
                        ? "text-white"
                        : isLuxeDark
                        ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Group 2: Modul Usaha Vertikal */}
            {hasAnyVertical && (
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                {!sidebarCollapsed && (
                  <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                    Unit Bisnis Vertikal
                  </div>
                )}
                {verticalModules.map((mod) =>
                  mod.items.map((sub) => {
                    const SubIcon = sub.icon;
                    const active = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        title={`${mod.name}: ${sub.name}`}
                        style={
                          active
                            ? {
                                backgroundColor: primaryColor,
                                color: "#ffffff",
                                boxShadow: `0 4px 12px ${primaryColor}35`,
                              }
                            : undefined
                        }
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          active
                            ? "text-white"
                            : isLuxeDark
                            ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                            : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{sub.name}</span>}
                      </Link>
                    );
                  })
                )}
              </div>
            )}

            {/* Group 3: SDM, Laporan & Pengaturan */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              {!sidebarCollapsed && (
                <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  SDM, Analitik &amp; Sistem
                </div>
              )}
              {[
                { name: "Data & Akun Staf", href: "/dashboard/staff", icon: Users },
                { name: "Gaji & Komisi", href: "/dashboard/payroll", icon: DollarSign },
                { name: "Laporan & Analitik", href: "/dashboard/reports", icon: TrendingUp },
                ...(userRole !== "ADMIN_CABANG"
                  ? [
                      { name: "Store & Tema UI", href: "/dashboard/store", icon: ShoppingBag },
                      { name: "Pengaturan Bisnis", href: "/dashboard/settings", icon: Settings },
                    ]
                  : []),
              ].map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.name}
                    style={
                      active
                        ? {
                            backgroundColor: primaryColor,
                            color: "#ffffff",
                            boxShadow: `0 4px 12px ${primaryColor}35`,
                          }
                        : undefined
                    }
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      active
                        ? "text-white"
                        : isLuxeDark
                        ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Quick Switch to Topbar */}
            {!sidebarCollapsed && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSaveShellConfig({ dashboardNavPosition: "TOP_NAV" })}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition cursor-pointer"
                >
                  <PanelTop className="w-3.5 h-3.5" />
                  <span>Pindah ke Tab Atas</span>
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 min-w-0 w-full">{children}</div>
      </div>
    );
  }

  // ============================================================================
  // MODE A: TOP_NAV LAYOUT (Horizontal Bar at Top + Full-Width Content Below)
  // ============================================================================
  return (
    <div>
      {customizerModal}
      <div className="mb-6 relative z-30 flex flex-wrap items-center justify-between gap-2" ref={navRef}>
        {/* 1-Row Compact Navigation Bar */}
        <div
          className={`inline-flex flex-wrap items-center justify-start gap-1 p-1 sm:p-1.5 rounded-2xl border shadow-[0_2px_15px_rgba(0,0,0,0.04)] max-w-full transition-colors ${
            isLuxeDark
              ? "bg-[#111827] border-slate-800"
              : "bg-white border-slate-200/90"
          }`}
        >
          {/* 1. Ringkasan */}
          <Link
            href="/dashboard"
            prefetch={true}
            style={
              pathname === "/dashboard"
                ? {
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    boxShadow: `0 4px 12px ${primaryColor}35`,
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
              pathname === "/dashboard"
                ? "text-white"
                : isLuxeDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Ringkasan</span>
          </Link>

          {/* 2. Outlet (Hanya Owner) */}
          {userRole !== "ADMIN_CABANG" && (
            <Link
              href="/dashboard/outlets"
              prefetch={true}
              style={
                pathname.startsWith("/dashboard/outlets")
                  ? {
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      boxShadow: `0 4px 12px ${primaryColor}35`,
                    }
                  : undefined
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
                pathname.startsWith("/dashboard/outlets")
                  ? "text-white"
                  : isLuxeDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <Store className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Outlet</span>
            </Link>
          )}

          {/* 3. Produk & Stok */}
          <Link
            href="/dashboard/products"
            prefetch={true}
            style={
              pathname.startsWith("/dashboard/products")
                ? {
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    boxShadow: `0 4px 12px ${primaryColor}35`,
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
              pathname.startsWith("/dashboard/products")
                ? "text-white"
                : isLuxeDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
            }`}
          >
            <Package className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Produk</span>
          </Link>

          {/* 4. Dropdown SDM: Staf & Gaji */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "staff" ? null : "staff")}
              style={
                isStaffActive
                  ? {
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor,
                      borderColor: `${primaryColor}50`,
                    }
                  : undefined
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 border cursor-pointer flex-shrink-0 ${
                isStaffActive
                  ? "shadow-sm"
                  : isLuxeDark
                  ? "border-slate-800 text-slate-300 hover:bg-slate-800/80"
                  : "border-slate-200/90 text-slate-700 hover:bg-slate-100/80"
              }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Staf &amp; Gaji</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  openDropdown === "staff" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "staff" && (
              <div
                className={`absolute top-full mt-2 left-0 min-w-[210px] p-1.5 rounded-2xl border shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLuxeDark
                    ? "bg-[#111827]/95 border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                    : "bg-white/95 border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                }`}
              >
                <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                    Manajemen SDM &amp; Payroll
                  </span>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/staff"
                    prefetch={true}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition ${
                      pathname.startsWith("/dashboard/staff")
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold"
                        : isLuxeDark
                        ? "text-slate-300 hover:bg-slate-800/80"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 flex-shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Data &amp; Akun Staf</div>
                      <div className="text-[10px] text-slate-400">Hak akses &amp; penugasan outlet</div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/payroll"
                    prefetch={true}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition ${
                      pathname.startsWith("/dashboard/payroll")
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold"
                        : isLuxeDark
                        ? "text-slate-300 hover:bg-slate-800/80"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 flex-shrink-0 mt-0.5">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Gaji &amp; Komisi</div>
                      <div className="text-[10px] text-slate-400">Slip gaji, kasbon, &amp; bagi hasil</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 5. Pelanggan (CRM) */}
          <Link
            href="/dashboard/customers"
            prefetch={true}
            style={
              pathname.startsWith("/dashboard/customers")
                ? {
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    boxShadow: `0 4px 12px ${primaryColor}35`,
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
              pathname.startsWith("/dashboard/customers")
                ? "text-white"
                : isLuxeDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Pelanggan</span>
          </Link>

          {/* Separator if vertical modules exist */}
          {hasAnyVertical && (
            <div
              className={`h-4 w-px mx-1 flex-shrink-0 ${
                isLuxeDark ? "bg-slate-700/80" : "bg-slate-300/80"
              }`}
            />
          )}

          {/* 6. Dropdown Terpadu: Modul Usaha Vertikal */}
          {hasAnyVertical && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "verticals" ? null : "verticals")}
                style={
                  isVerticalActive
                    ? {
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                        borderColor: `${primaryColor}50`,
                      }
                    : undefined
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 border cursor-pointer flex-shrink-0 ${
                  isVerticalActive
                    ? "shadow-sm"
                    : isLuxeDark
                    ? "border-slate-800 text-slate-300 hover:bg-slate-800/80"
                    : "border-slate-200/90 text-slate-700 hover:bg-slate-100/80"
                }`}
              >
                <Layers className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
                <span className="whitespace-nowrap">Modul Usaha</span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600">
                  {verticalModules.length}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openDropdown === "verticals" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "verticals" && (
                <div
                  className={`absolute top-full mt-2 left-0 min-w-[260px] p-2 rounded-2xl border shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isLuxeDark
                      ? "bg-[#111827]/95 border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                      : "bg-white/95 border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                  }`}
                >
                  <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                      Modul Bisnis Spesifik
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-2">
                    {verticalModules.map((mod) => {
                      const ModIcon = mod.icon;
                      return (
                        <div key={mod.id} className="space-y-0.5">
                          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <ModIcon className="w-3 h-3" />
                            <span>{mod.name}</span>
                          </div>
                          {mod.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isItemActive = pathname === item.href;

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={`flex items-start gap-2.5 px-3 py-1.5 rounded-xl transition ${
                                  isItemActive
                                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold"
                                    : isLuxeDark
                                    ? "text-slate-300 hover:bg-slate-800/80"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <div
                                  className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                                    isItemActive
                                      ? "bg-indigo-600 text-white"
                                      : isLuxeDark
                                      ? "bg-slate-800 text-slate-400"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <ItemIcon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold leading-tight">{item.name}</div>
                                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Separator before Laporan */}
          <div
            className={`h-4 w-px mx-1 flex-shrink-0 ${
              isLuxeDark ? "bg-slate-700/80" : "bg-slate-300/80"
            }`}
          />

          {/* 7. Laporan & Analitik */}
          <Link
            href="/dashboard/reports"
            prefetch={true}
            style={
              pathname.startsWith("/dashboard/reports")
                ? {
                    backgroundColor: primaryColor,
                    color: "#ffffff",
                    boxShadow: `0 4px 12px ${primaryColor}35`,
                  }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
              pathname.startsWith("/dashboard/reports")
                ? "text-white"
                : isLuxeDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/80"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Laporan</span>
          </Link>
        </div>

        {/* Quick Layout & Theme Customizer Trigger Button */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSaveShellConfig({ dashboardNavPosition: "SIDEBAR_LEFT" })}
            title="Ubah Navigasi ke Sidebar Kiri"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isLuxeDark
                ? "bg-[#111827] border-slate-800 text-slate-300 hover:text-white"
                : "bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <PanelLeft className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Mode Sidebar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomizer(true)}
            title="Kustomisasi Tata Letak & Tema UI"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isLuxeDark
                ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60"
                : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kustomisasi UI</span>
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}
