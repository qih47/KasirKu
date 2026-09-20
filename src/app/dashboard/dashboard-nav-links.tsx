"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Layers,
  Sparkles,
} from "lucide-react";

interface DashboardNavLinksProps {
  activePlugins?: { code: string; name: string }[];
  themeTokens?: {
    primaryColor?: string;
    accentColor?: string;
    layoutStyle?: string;
    isLuxeDark?: boolean;
  };
}

export function DashboardNavLinks({
  activePlugins = [],
  themeTokens = {},
}: DashboardNavLinksProps) {
  const pathname = usePathname();
  const primaryColor = themeTokens.primaryColor || "#4f46e5";
  const isLuxeDark = themeTokens.isLuxeDark || false;

  const isBarbershopActive = activePlugins.some((p) => p.code === "barbershop");
  const isCafeActive = activePlugins.some((p) => p.code === "cafe");
  const isLaundryActive = activePlugins.some((p) => p.code === "laundry");
  const isRetailActive = activePlugins.some((p) => p.code === "retail");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // 1. Core Operasional Links
  const isStaffActive = pathname.startsWith("/dashboard/staff") || pathname.startsWith("/dashboard/payroll");
  const isVerticalActive =
    pathname.startsWith("/dashboard/cafe") ||
    pathname.startsWith("/dashboard/barbershop") ||
    pathname.startsWith("/dashboard/laundry") ||
    pathname.startsWith("/dashboard/retail");

  // Vertical modules list
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

  return (
    <div className="mb-6 relative z-30" ref={navRef}>
      {/* 1-Row Compact Navigation Bar */}
      <div
        className={`inline-flex items-center justify-start gap-1 p-1 sm:p-1.5 rounded-2xl border shadow-[0_2px_15px_rgba(0,0,0,0.04)] max-w-full transition-colors ${
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

        {/* 2. Outlet */}
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
    </div>
  );
}
