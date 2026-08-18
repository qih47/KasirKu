"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Store,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Scissors,
  Percent,
  Coffee,
  Shirt,
  Settings,
  Palette,
  Printer,
  Sparkles,
  ShoppingBag,
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

  const isBarbershopActive = activePlugins.some(
    (p) => p.code === "barbershop"
  );
  const isCafeActive = activePlugins.some((p) => p.code === "cafe");
  const isLaundryActive = activePlugins.some((p) => p.code === "laundry");

  const links = [
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
      name: "Produk & Jasa",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      name: "Staff & Kasir",
      href: "/dashboard/staff",
      icon: Users,
    },
    // Modul Dinamis Barbershop
    ...(isBarbershopActive
      ? [
        {
          name: "Antrian",
          href: "/dashboard/barbershop/queue",
          icon: Scissors,
        },
        {
          name: "Komisi Barber",
          href: "/dashboard/barbershop/commissions",
          icon: Percent,
        },
      ]
      : []),
    // Modul Dinamis Cafe
    ...(isCafeActive
      ? [
        {
          name: "Meja Cafe",
          href: "/dashboard/cafe/tables",
          icon: Coffee,
        },
      ]
      : []),
    // Modul Dinamis Laundry
    ...(isLaundryActive
      ? [
        {
          name: "Order Laundry",
          href: "/dashboard/laundry/orders",
          icon: Shirt,
        },
      ]
      : []),
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
      name: "Store & Add-on",
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
    <div className="mb-6">
      {/* Dynamic Theme Pill Navigation Bar */}
      <div
        className={`flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl border shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto max-w-full transition-colors ${
          isLuxeDark
            ? "bg-[#111827] border-slate-800"
            : "bg-white border-slate-200/90"
        }`}
      >
        {links.map((link) => {
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
                      boxShadow: `0 4px 14px ${primaryColor}40`,
                    }
                  : undefined
              }
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex-shrink-0 ${
                isActive
                  ? "text-white"
                  : isLuxeDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 active:bg-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
