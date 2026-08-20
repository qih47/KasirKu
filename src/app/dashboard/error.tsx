"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  LogIn,
  RefreshCw,
  Home,
  AlertTriangle,
  ShoppingCart,
  Lock,
  ArrowLeft,
  UserCheck,
} from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  const errorMsg = error?.message || "";
  const isRoleRestricted =
    errorMsg.toLowerCase().includes("hanya owner") ||
    errorMsg.toLowerCase().includes("hanya admin") ||
    errorMsg.toLowerCase().includes("izin khusus");

  const isSessionExpired =
    !isRoleRestricted &&
    (errorMsg.toLowerCase().includes("akses ditolak") ||
      errorMsg.toLowerCase().includes("login") ||
      errorMsg.toLowerCase().includes("tenant"));

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-fadeIn">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${isRoleRestricted
              ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400"
              : isSessionExpired
                ? "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
        >
          {isRoleRestricted ? (
            <Lock className="w-8 h-8" />
          ) : isSessionExpired ? (
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${isRoleRestricted
                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : isSessionExpired
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
          >
            {isRoleRestricted
              ? "Hak Akses Terbatas (Role Restriction)"
              : isSessionExpired
                ? "Sesi Login Berakhir (403)"
                : "Terjadi Kendala"}
          </span>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isRoleRestricted
              ? "Akses Fitur Terbatas"
              : isSessionExpired
                ? "Perlu Login Ke Akun Bisnis"
                : "Halaman Tidak Dapat Dimuat"}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {errorMsg || "Anda tidak memiliki izin atau sesi login Anda telah berakhir."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {isRoleRestricted ? (
            <>
              <Link
                href="/dashboard"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Dashboard Utama</span>
              </Link>
              <Link
                href="/pos"
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                <span>Buka Kasir POS</span>
              </Link>
              <Link
                href="/login"
                className="text-[11px] text-slate-400 hover:text-indigo-600 pt-1"
              >
                Ingin ganti akun? Login sebagai Owner &rarr;
              </Link>
            </>
          ) : isSessionExpired ? (
            <>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Login Ke Akun Bisnis</span>
              </Link>
              <Link
                href="/demo"
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                <span>Coba Mode Guest Demo</span>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => reset()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>
              <Link
                href="/dashboard"
                className="text-xs text-slate-400 hover:text-slate-600 pt-1"
              >
                Kembali ke Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
