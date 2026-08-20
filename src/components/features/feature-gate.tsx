"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface FeatureGateProps {
  isAllowed: boolean;
  featureName?: string;
  description?: string;
  requiredTier?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  isAllowed,
  featureName = "Fitur Eksklusif",
  description = "Buka akses penuh ke fitur canggih ini dengan mengupgrade lisensi Bisnis Anda.",
  requiredTier = "PRO",
  children,
  fallback,
}: FeatureGateProps) {
  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      className="p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 text-center max-w-xl mx-auto my-6 relative overflow-hidden"
      style={{
        backgroundColor: "var(--theme-card-bg, #ffffff)",
        borderColor: "var(--theme-card-border, #e2e8f0)",
      }}
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-600 border border-indigo-500/30 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Fitur Khusus {requiredTier.toUpperCase()}
        </span>
        <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
          {featureName} Terkunci
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition"
        >
          <span>Upgrade ke Paket {requiredTier.toUpperCase()}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export function ReportPaywallCard({
  title,
  description,
  requiredTier = "PRO",
}: {
  title: string;
  description: string;
  requiredTier?: string;
}) {
  return (
    <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-center space-y-4 max-w-2xl mx-auto my-8 animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
        <Lock className="w-7 h-7" />
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-sm">
          Eksklusif Paket {requiredTier}
        </span>
        <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
          {title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xl shadow-indigo-600/25 transition hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buka Akses Laporan {requiredTier} Sekarang</span>
        </Link>
      </div>
    </div>
  );
}
