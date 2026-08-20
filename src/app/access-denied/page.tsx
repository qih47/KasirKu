"use client";

import Link from "next/link";
import {
  ShieldAlert,
  LogIn,
  Home,
  Store,
  Sparkles,
  ArrowLeft,
  Lock,
  Gamepad2,
  RefreshCw,
} from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6 animate-fadeIn">
        {/* Animated Badge Icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner shadow-rose-500/20">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
            <Lock className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold tracking-wider uppercase">
            Error 403 • Access Denied
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Akses Ditolak
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Sesi login Anda telah berakhir atau Anda belum masuk ke akun Bisnis yang berwenang untuk mengakses halaman ini.
          </p>
        </div>

        {/* Suggested Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/login"
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Ke Akun Bisnis</span>
          </Link>

          <Link
            href="/demo"
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span>Coba Simulator Guest Demo (Bebas Akun)</span>
          </Link>

          <Link
            href="/"
            className="w-full py-2.5 rounded-2xl text-slate-400 hover:text-white font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
          KasirKu Universal SaaS Platform &bull; Security Guard
        </div>
      </div>
    </div>
  );
}
