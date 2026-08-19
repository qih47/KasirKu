import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Building2,
  Tags,
  ScrollText,
  ExternalLink,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminNavLinks } from "./admin-nav-links";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Jika belum login atau bukan role SUPER_ADMIN, redirect ke login admin
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    // Abaikan jika halaman yang diakses adalah /admin/login (Next.js layout wraps all sub-routes, tapi login page ditangani)
    // Supaya aman jika login page dirender di luar layout, Next.js nested layout akan apply.
    // Tapi untuk /admin/login, kita return langsung children jika login route.
  }

  const user = session?.user as any;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Super Admin
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                Platform Layer
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <AdminNavLinks />
        </div>

        {/* Bottom Profile & Actions */}
        <div className="pt-4 mt-6 border-t border-slate-800/80 space-y-3">

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            <span>Buka Landing Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || "Super Admin"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "admin@posuniversal.com"}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-h-screen p-4 sm:p-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
