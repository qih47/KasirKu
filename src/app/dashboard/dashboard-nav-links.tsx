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
  CreditCard,
  Scissors,
  Coffee,
  Shirt,
  Settings,
  ShoppingBag,
  DollarSign,
  UserCheck,
  ChevronDown,
  ShoppingBasket,
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

  // Core Management Links
  const coreLinks = [
    {
      name: "Ringkasan",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Outlet",
      href: "/dashboard/outlets",
      icon: Store,
    },
    {
      name: "Produk",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      name: "Staf",
      href: "/dashboard/staff",
      icon: Users,
    },
    {
      name: "Gaji & Komisi",
      href: "/dashboard/payroll",
      icon: DollarSign,
    },
    {
      name: "Pelanggan",
      href: "/dashboard/customers",
      icon: UserCheck,
    },
  ];

  // Vertical Plugin Grouped Links
  const verticalGroups = [
    ...(isCafeActive
      ? [
          {
            id: "cafe",
            name: "Cafe & Resto",
            icon: Coffee,
            badge: "Resto",
            isActive: pathname.startsWith("/dashboard/cafe"),
            items: [
              {
                name: "Denah Meja",
                href: "/dashboard/cafe/tables",
                icon: Coffee,
                desc: "Kelola meja & live status billing",
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
            badge: "Barber",
            isActive: pathname.startsWith("/dashboard/barbershop"),
            items: [
              {
                name: "Antrean & Kursi",
                href: "/dashboard/barbershop/queue",
                icon: Scissors,
                desc: "Live antrean potong & booking",
              },
              {
                name: "Komisi Kapster",
                href: "/dashboard/barbershop/commissions",
                icon: DollarSign,
                desc: "Rekap komisi bagi hasil kapster",
              },
            ],
          },
        ]
      : []),
    ...(isLaundryActive
      ? [
          {
            id: "laundry",
            name: "Laundry",
            icon: Shirt,
            badge: "Cuci",
            isActive: pathname.startsWith("/dashboard/laundry"),
            items: [
              {
                name: "Pesanan Cucian",
                href: "/dashboard/laundry/orders",
                icon: Shirt,
                desc: "Tracking proses cuci, kering, setrika",
              },
              {
                name: "Komisi Laundry",
                href: "/dashboard/laundry/commissions",
                icon: DollarSign,
                desc: "Rekap komisi operator & penyetrika",
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
            badge: "Retail",
            isActive: pathname.startsWith("/dashboard/retail"),
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

  // System & Financial Links
  const systemLinks = [
    {
      name: "Laporan",
      href: "/dashboard/reports",
      icon: TrendingUp,
    },
    {
      name: "Langganan",
      href: "/dashboard/subscription",
      icon: CreditCard,
    },
    {
      name: "Store",
      href: "/dashboard/store",
      icon: ShoppingBag,
    },
    {
      name: "Pengaturan",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="mb-6 relative z-40" ref={navRef}>
      {/* Compact Grouped Navigation Bar */}
      <div
        className={`inline-flex flex-wrap items-center justify-start gap-1 p-1 sm:p-1.5 rounded-2xl border shadow-[0_2px_15px_rgba(0,0,0,0.04)] max-w-full transition-colors ${
          isLuxeDark
            ? "bg-[#111827] border-slate-800"
            : "bg-white border-slate-200/90"
        }`}
      >
        {/* 1. Core Links Group */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {coreLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                style={
                  isActive
                    ? {
                        backgroundColor: primaryColor,
                        color: "#ffffff",
                        boxShadow: `0 4px 12px ${primaryColor}35`,
                      }
                    : undefined
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
                  isActive
                    ? "text-white"
                    : isLuxeDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/80 active:bg-slate-800"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 active:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Separator if vertical groups exist */}
        {verticalGroups.length > 0 && (
          <div
            className={`h-4 w-px mx-1 flex-shrink-0 ${
              isLuxeDark ? "bg-slate-700/80" : "bg-slate-300/80"
            }`}
          />
        )}

        {/* 2. Vertical Division Group Dropdowns */}
        {verticalGroups.length > 0 && (
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {verticalGroups.map((group) => {
              const Icon = group.icon;
              const isOpen = openDropdown === group.id;
              const isGroupActive = group.isActive;

              return (
                <div key={group.id} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(isOpen ? null : group.id)
                    }
                    style={
                      isGroupActive
                        ? {
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                            borderColor: `${primaryColor}50`,
                          }
                        : undefined
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 border cursor-pointer flex-shrink-0 ${
                      isGroupActive
                        ? "shadow-sm"
                        : isLuxeDark
                        ? "border-slate-800 text-slate-300 hover:bg-slate-800/80"
                        : "border-slate-200/90 text-slate-700 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{group.name}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div
                      className={`absolute top-full mt-2 left-0 min-w-[220px] p-1.5 rounded-2xl border shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 ${
                        isLuxeDark
                          ? "bg-[#111827]/95 border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                          : "bg-white/95 border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                      }`}
                    >
                      <div className="px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                          Menu Divisi {group.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {group.badge}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = pathname === item.href;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={true}
                              className={`flex items-start gap-2.5 p-2 rounded-xl transition-all duration-150 ${
                                isItemActive
                                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold"
                                  : isLuxeDark
                                  ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                                  isItemActive
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : isLuxeDark
                                    ? "bg-slate-800 text-slate-400"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="text-xs font-bold leading-none mb-0.5">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {item.desc}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Separator for System Links */}
        <div
          className={`h-4 w-px mx-1 flex-shrink-0 ${
            isLuxeDark ? "bg-slate-700/80" : "bg-slate-300/80"
          }`}
        />

        {/* 3. System Links Group */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {systemLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                style={
                  isActive
                    ? {
                        backgroundColor: primaryColor,
                        color: "#ffffff",
                        boxShadow: `0 4px 12px ${primaryColor}35`,
                      }
                    : undefined
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
                  isActive
                    ? "text-white"
                    : isLuxeDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/80 active:bg-slate-800"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 active:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

