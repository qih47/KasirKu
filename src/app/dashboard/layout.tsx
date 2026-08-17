import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Store, LogOut, LayoutDashboard, ShoppingCart, Package, Users, Settings, Bell, Radio, Info, AlertTriangle } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { DashboardNavLinks } from "./dashboard-nav-links";
import { getTenantActivePlugins } from "@/modules/tenant/plugin-helpers";
import { getActiveBroadcastForTenant } from "@/modules/superadmin/broadcast-actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  const [activePlugins, activeBroadcast] = await Promise.all([
    getTenantActivePlugins(user.tenantId),
    getActiveBroadcastForTenant(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Active Broadcast Announcement Banner */}
      {activeBroadcast && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white px-4 py-2 text-xs shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-white/20 text-amber-300">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <span className="font-bold text-amber-200">
                [{activeBroadcast.type}] {activeBroadcast.title}:
              </span>
              <span className="text-white">{activeBroadcast.content}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar - Clean White Material 3 Surface */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-950">
                  {user.businessName || "POS Universal"}
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Trial 30 Hari
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {user.outletName || "Outlet Utama"} &bull; Role:{" "}
                <span className="font-bold text-indigo-600">
                  {user.role}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500">{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <DashboardNavLinks activePlugins={activePlugins} />
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        POS Universal SaaS Platform &copy; 2026
      </footer>
    </div>
  );
}
