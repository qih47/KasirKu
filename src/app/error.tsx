"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, LogIn, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global App Error:", error);
  }, [error]);

  const isAccessDenied =
    error.message?.toLowerCase().includes("akses ditolak") ||
    error.message?.toLowerCase().includes("login") ||
    error.message?.toLowerCase().includes("tenant");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400">
            {isAccessDenied ? "Akses Ditolak (403)" : "Terjadi Kesalahan"}
          </span>
          <h2 className="text-xl font-black text-white">
            {isAccessDenied ? "Sesi Login Berakhir" : "Gagal Memuat Halaman"}
          </h2>
          <p className="text-xs text-slate-400">
            {error.message || "Silakan login kembali untuk melanjutkan ke akun Bisnis Anda."}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {isAccessDenied ? (
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Ke Akun Bisnis</span>
            </Link>
          ) : (
            <button
              onClick={() => reset()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          )}

          <Link
            href="/"
            className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
