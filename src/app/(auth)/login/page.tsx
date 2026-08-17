"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, LogIn, Mail, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error || "Email atau kata sandi tidak valid.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kendala saat menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFC] text-slate-900 font-sans relative overflow-hidden">
      {/* Background Vector Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-40 right-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/50 to-transparent blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-purple-100/40 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/25">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-950">
                POS Universal
              </span>
              <span className="text-[10px] ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                Masuk Akun
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Belum punya akun?</span>
            <Link
              href="/register"
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Daftar di sini
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Masuk ke Akun POS
            </h1>
            <p className="text-xs text-slate-500">
              Akses portal kasir dan kelola operasional bisnis Anda.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Email Akun
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="owner@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Belum memiliki akun? </span>
            <Link
              href="/register"
              className="font-bold text-indigo-600 hover:underline"
            >
              Daftar gratis di sini
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 relative z-10">
        POS Universal SaaS Platform &copy; 2026.
      </footer>
    </div>
  );
}
