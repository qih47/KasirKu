import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Store, LogOut, LayoutDashboard, ShoppingCart, Package, Users, Settings, Bell, Radio, Info, AlertTriangle } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { DashboardNavLinks } from "./dashboard-nav-links";
import { prisma } from "@/lib/prisma";
import { getTenantActivePlugins } from "@/modules/tenant/plugin-helpers";
import { getActiveBroadcastForTenant } from "@/modules/superadmin/broadcast-actions";
import { LanguageSwitcher } from "@/lib/i18n/language-switcher";

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
  const [activePlugins, activeBroadcast, tenant] = await Promise.all([
    getTenantActivePlugins(user.tenantId),
    getActiveBroadcastForTenant(),
    user.tenantId
      ? prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                licenseTier: true,
                theme: { include: { theme: true } },
              },
              take: 1,
            },
          },
        })
      : null,
  ]);

  const activeSub = tenant?.subscriptions?.[0];
  const isTrial = tenant?.status === "TRIAL";
  const tierName = activeSub?.licenseTier?.name || "Langganan";
  
  let trialRemainingDays = 0;
  if (isTrial && tenant?.trialEndAt) {
    const now = new Date();
    const end = new Date(tenant.trialEndAt);
    trialRemainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  // Theme Engine (Fully dynamic from database)
  const appliedTheme = activeSub?.theme?.theme;
  const tokens = (appliedTheme?.tokens as any) || {};
  const primaryColor = tokens.primaryColor || tokens.colors?.primary || "#4f46e5";
  const accentColor = tokens.accentColor || tokens.colors?.accent || "#06b6d4";
  const isDark = tokens.mode === "dark" || tokens.layoutStyle === "LUXE";
  const isLuxeDark = isDark;
  const layoutStyle = tokens.layoutStyle || (isDark ? "LUXE" : "MODERN");
  const isWarm = layoutStyle === "WARM";
  const isCompact = layoutStyle === "COMPACT";
  const fontFamily = tokens.fontFamily || tokens.typography?.fontFamily || "inherit";
  const radius = tokens.radius || tokens.effects?.borderRadius || (isCompact ? "0.375rem" : isWarm ? "1.75rem" : "1.25rem");


  const bgStyle = tokens.bgStyle || tokens.colors?.background || (isDark ? "radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.09) 0%, transparent 60%), #090D16" : isWarm ? "radial-gradient(circle at 10% 20%, rgba(217, 119, 6, 0.05) 0%, transparent 40%), #F7F3EB" : isCompact ? "#ECEFF1" : "#F8FAFC");
  const cardBg = tokens.cardBg || tokens.colors?.card || (isDark ? "#111A2E" : isWarm ? "#FFFDF9" : "#FFFFFF");
  const cardBorder = tokens.cardBorder || tokens.colors?.border || (isDark ? "#1E293B" : isWarm ? "#E8DCB8" : isCompact ? "#CBD5E1" : "rgba(226, 232, 240, 0.9)");
  const cardShadow = tokens.cardShadow || (isDark ? "0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(99, 102, 241, 0.04)" : isCompact ? "0 1px 3px rgba(0,0,0,0.06)" : "0 4px 20px -2px rgba(0, 0, 0, 0.03)");
  const textPrimary = tokens.textPrimary || tokens.colors?.primaryForeground || (isDark ? "#F8FAFC" : isWarm ? "#29180E" : "#0F172A");
  const textSecondary = tokens.textSecondary || (isDark ? "#94A3B8" : isWarm ? "#785D4F" : "#64748B");
  const innerBoxBg = tokens.innerBoxBg || tokens.colors?.backgroundMuted || (isDark ? "#162035" : isWarm ? "#F3EDE2" : isCompact ? "#F1F5F9" : "#F8F9FD");
  const inputBg = tokens.inputBg || (isDark ? "#0B1120" : isWarm ? "#FFFDF9" : "#FFFFFF");

  // Dynamic Header Styles
  let headerBg = "border-slate-200/80 bg-white/90";
  let footerBg = "border-slate-200/80 bg-white text-slate-500";
  let logoText = "text-slate-950";

  if (isDark) {
    headerBg = "border-slate-800/90 bg-[#111A2E]/95 shadow-[0_4px_25px_rgba(0,0,0,0.7)]";
    footerBg = "border-slate-800 bg-[#0B1120] text-slate-400";
    logoText = "text-white";
  } else if (isWarm) {
    headerBg = "border-amber-200/70 bg-[#FFFDF9]/95 shadow-[0_4px_20px_rgba(217,119,6,0.04)]";
    footerBg = "border-amber-200/70 bg-[#FFFDF9] text-stone-600";
    logoText = "text-amber-950";
  } else if (isCompact) {
    headerBg = "border-slate-300 bg-white/95 shadow-sm";
    footerBg = "border-slate-300 bg-white text-slate-500";
    logoText = "text-emerald-950";
  }


  return (
    <div
      data-theme-container="true"
      className="min-h-screen flex flex-col font-sans transition-all duration-300"
      style={{
        background: bgStyle,
        color: textPrimary,
        fontFamily,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --theme-primary: ${primaryColor};
          --theme-accent: ${accentColor};
          --theme-radius: ${radius};
          --theme-card-bg: ${cardBg};
          --theme-card-border: ${cardBorder};
          --theme-card-shadow: ${cardShadow};
          --theme-text-primary: ${textPrimary};
          --theme-text-secondary: ${textSecondary};
          --theme-inner-bg: ${innerBoxBg};
          --theme-input-bg: ${inputBg};
        }

        /* Full Dynamic Transformation for all cards & containers */
        [data-theme-container] .bg-white {
          background-color: var(--theme-card-bg) !important;
          border-color: var(--theme-card-border) !important;
          color: var(--theme-text-primary) !important;
          box-shadow: var(--theme-card-shadow) !important;
          border-radius: var(--theme-radius) !important;
        }

        [data-theme-container] h1,
        [data-theme-container] h2,
        [data-theme-container] h3,
        [data-theme-container] .text-slate-950,
        [data-theme-container] .text-slate-900 {
          color: var(--theme-text-primary) !important;
        }

        [data-theme-container] .text-slate-400,
        [data-theme-container] .text-slate-500,
        [data-theme-container] .text-slate-600,
        [data-theme-container] .text-slate-700 {
          color: var(--theme-text-secondary) !important;
        }

        [data-theme-container] .bg-slate-50,
        [data-theme-container] .bg-\\[\\#F8F9FD\\],
        [data-theme-container] .bg-slate-100 {
          background-color: var(--theme-inner-bg) !important;
          border-color: var(--theme-card-border) !important;
          color: var(--theme-text-primary) !important;
        }

        /* Hover states for table rows & cards */
        [data-theme-container] tr:hover,
        [data-theme-container] tr.hover\\:bg-slate-50\\/70:hover,
        [data-theme-container] tr.hover\\:bg-slate-50:hover,
        [data-theme-container] .hover\\:bg-slate-50:hover,
        [data-theme-container] .hover\\:bg-slate-50\\/70:hover,
        [data-theme-container] .hover\\:bg-slate-100:hover {
          background-color: var(--theme-inner-bg) !important;
        }

        /* Table header and borders */
        [data-theme-container] thead {
          background-color: var(--theme-inner-bg) !important;
          border-color: var(--theme-card-border) !important;
        }

        [data-theme-container] thead th {
          color: var(--theme-text-secondary) !important;
        }

        [data-theme-container] .divide-slate-100 > * + *,
        [data-theme-container] .divide-slate-200 > * + * {
          border-color: var(--theme-card-border) !important;
        }

        /* Dynamic High-Contrast Badges */
        [data-theme-container] .bg-blue-50 {
          background-color: rgba(59, 130, 246, 0.18) !important;
          color: #60a5fa !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
        }

        [data-theme-container] .bg-emerald-50 {
          background-color: rgba(16, 185, 129, 0.18) !important;
          color: #34d399 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }

        [data-theme-container] .bg-amber-50 {
          background-color: rgba(245, 158, 11, 0.18) !important;
          color: #fbbf24 !important;
          border: 1px solid rgba(245, 158, 11, 0.3) !important;
        }

        [data-theme-container] .bg-rose-50 {
          background-color: rgba(244, 63, 94, 0.18) !important;
          color: #fb7185 !important;
          border: 1px solid rgba(244, 63, 94, 0.3) !important;
        }

        [data-theme-container] .bg-indigo-50,
        [data-theme-container] .bg-indigo-50\\/70 {
          background-color: rgba(99, 102, 241, 0.18) !important;
          color: #818cf8 !important;
          border: 1px solid rgba(99, 102, 241, 0.3) !important;
        }

        [data-theme-container] .border-slate-200,
        [data-theme-container] .border-slate-200\\/80,
        [data-theme-container] .border-slate-200\\/90,
        [data-theme-container] .border-slate-100 {
          border-color: var(--theme-card-border) !important;
        }

        [data-theme-container] input,
        [data-theme-container] select,
        [data-theme-container] textarea {
          background-color: var(--theme-input-bg) !important;
          border-color: var(--theme-card-border) !important;
          color: var(--theme-text-primary) !important;
        }

      `,
        }}
      />

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

      {/* Top Navbar - Dynamic Theme Surface */}
      <header
        className={`border-b backdrop-blur-md sticky top-0 z-40 transition-colors duration-300 ${headerBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.businessName || "Logo"}
                className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-md flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-300 flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Store className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-base tracking-tight ${logoText}`}>
                  {tenant?.businessName || user.businessName || "POS Universal"}
                </span>

                {isTrial ? (
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Trial {trialRemainingDays > 0 ? `${trialRemainingDays} Hari` : "Aktif"}
                  </span>
                ) : (
                  <span
                    className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border transition-colors"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                      borderColor: `${primaryColor}40`,
                    }}
                  >
                    {tierName} • Aktif
                  </span>
                )}
                {appliedTheme && (
                  <span
                    className="hidden sm:inline-flex text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: isLuxeDark ? "#1f293d" : "#f1f5f9",
                      color: isLuxeDark ? "#f59e0b" : "#475569",
                      borderColor: isLuxeDark ? "#f59e0b40" : "#cbd5e1",
                    }}
                  >
                    Tema: {appliedTheme.name.split(" ")[1] || appliedTheme.name}
                  </span>
                )}
              </div>
              <p className={`text-xs font-medium ${isLuxeDark ? "text-slate-400" : "text-slate-500"}`}>
                {user.outletName || "Outlet Utama"} &bull; Role:{" "}
                <span className="font-bold" style={{ color: primaryColor }}>
                  {user.role}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all duration-150 active:scale-95 flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buka Kasir POS</span>
            </Link>

            <div
              className={`hidden sm:block text-right pl-2 border-l ${
                isLuxeDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <p className={`text-xs font-bold ${isLuxeDark ? "text-slate-100" : "text-slate-900"}`}>
                {user.name}
              </p>
              <p className={`text-[11px] ${isLuxeDark ? "text-slate-400" : "text-slate-500"}`}>
                {user.email}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <DashboardNavLinks
          activePlugins={activePlugins}
          themeTokens={{ primaryColor, accentColor, layoutStyle, isLuxeDark }}
        />
        {children}
      </div>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors ${footerBg}`}>
        POS Universal SaaS Platform &copy; 2026 &bull; Theme:{" "}
        <strong>{appliedTheme?.name || "Modern Minimalist"}</strong>
      </footer>
    </div>
  );
}
