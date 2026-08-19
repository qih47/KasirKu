"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Tags,
  Palette,
  Radio,
  ScrollText,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

export function AdminNavLinks() {
  const pathname = usePathname();
  const { locale, t } = useTranslation();

  // Jangan render nav jika berada di /admin/login
  if (pathname === "/admin/login") return null;

  const links = [
    {
      name: locale === "en" ? "Dashboard Overview" : "Ringkasan Platform",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: locale === "en" ? "Manage Businesses" : "Kelola Bisnis & Tenant",
      href: "/admin/tenants",
      icon: Building2,
    },
    {
      name: locale === "en" ? "Catalog & Pricing" : "Katalog & Durasi Lisensi",
      href: "/admin/catalog",
      icon: Tags,
    },
    {
      name: locale === "en" ? "Broadcast Message" : "Pesan Broadcast",
      href: "/admin/broadcast",
      icon: Radio,
    },
    {
      name: locale === "en" ? "Audit Logs" : "Catatan Log Aktivitas",
      href: "/admin/audit",
      icon: ScrollText,
    },
  ];

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
