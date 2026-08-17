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
} from "lucide-react";

export function DashboardNavLinks({
  activePlugins = [],
}: {
  activePlugins?: { code: string; name: string }[];
}) {
  const pathname = usePathname();

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
      name: "Cabang Outlet",
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
            name: "Antrian Kursi",
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
      name: "Tema UI",
      href: "/dashboard/themes",
      icon: Palette,
    },
    {
      name: "Pengaturan & Branding",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      {/* Clean White Pill Navigation Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-x-auto max-w-full">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/pos"
        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-2 flex-shrink-0"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>Buka Kasir POS</span>
      </Link>
    </div>
  );
}
