"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Scissors,
  Coffee,
  User,
  Zap,
  Sun,
  Moon,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme tokens
  const t = {
    bg: isDark ? "#0B0F19" : "#F1F5F9",
    cardBg: isDark ? "rgba(19,27,46,0.92)" : "rgba(255,255,255,0.95)",
    cardBorder: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.25)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#94A3B8",
    inputBg: isDark ? "#0B0F19" : "#FFFFFF",
    inputBorder: isDark ? "#334155" : "#CBD5E1",
    inputText: isDark ? "#F8FAFC" : "#0F172A",
    inputPlaceholder: isDark ? "#475569" : "#94A3B8",
    demoBg: isDark ? "rgba(15,23,42,0.9)" : "#EEF2FF",
    demoBorder: isDark ? "#1E293B" : "#C7D2FE",
    demoItem: isDark ? "#1E293B" : "#E0E7FF",
    demoItemBorder: isDark ? "#334155" : "#A5B4FC",
    divider: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    navBg: isDark ? "rgba(11,15,25,0.85)" : "rgba(241,245,249,0.9)",
    navBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    toggleBg: isDark ? "#1E293B" : "#E2E8F0",
    pillBg: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
    pillBorder: isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.25)",
    pillText: isDark ? "#A5B4FC" : "#4F46E5",
    gridColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.07)",
    glow1: isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.07)",
    footerText: isDark ? "#475569" : "#94A3B8",
    footerBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (res?.error) {
        setError("Email atau kata sandi yang Anda masukkan salah.");
      } else {
        const lower = email.toLowerCase().trim();
        if (lower === "admin@qassa.id" || lower === "admin@posuniversal.com") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kendala saat menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {/* Background Grid + Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${t.gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${t.gridColor} 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -top-40 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${t.glow1}, transparent 70%)` }}
        />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header
        className="border-b backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300"
        style={{ backgroundColor: t.navBg, borderColor: t.navBorder }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 group-hover:scale-105 transition">
              <Image src="/smLogo.png" alt="Qassa" fill className="object-contain" priority />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight" style={{ color: t.text }}>Qassa</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-extrabold border uppercase tracking-wider"
                  style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
                >
                  POS
                </span>
              </div>
              <p className="text-[10px] font-medium" style={{ color: t.textMuted }}>Portal Akses Masuk</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition hover:scale-105"
              style={{ backgroundColor: t.toggleBg, borderColor: t.inputBorder }}
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <span className="hidden sm:inline" style={{ color: t.textMuted }}>Belum punya akun toko?</span>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-1"
            >
              <span>Daftar Coba Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-4">
        <div
          className="w-full max-w-md backdrop-blur-2xl p-7 sm:p-9 rounded-[2rem] shadow-2xl space-y-6 border transition-colors duration-300"
          style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
        >
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: t.text }}>
              Masuk ke Qassa POS
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: t.textSub }}>
              Kelola kasir, stok, multi-cabang, dan pantau omzet bisnis Anda.
            </p>
          </div>

          {/* Quick Fill Demo Accounts */}
          <div
            className="p-3.5 rounded-2xl border space-y-2"
            style={{ backgroundColor: t.demoBg, borderColor: t.demoBorder }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Satu-Klik Isi Akun Demo:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { icon: Scissors, color: "text-amber-400", label: "Barber", email: "owner@barberku.com", pass: "password123" },
                { icon: Coffee, color: "text-amber-400", label: "Cafe", email: "owner@forecoffee.com", pass: "password123" },
                { icon: User, color: "text-emerald-400", label: "Kasir", email: "kasir1@barberku.com", pass: "password123" },
                { icon: LogIn, color: "text-purple-400", label: "Admin", email: "admin@qassa.id", pass: "admin123456" },
              ].map(({ icon: Icon, color, label, email: demoEmail, pass: demoPass }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickFill(demoEmail, demoPass)}
                  className="px-1.5 py-2 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 border"
                  style={{ backgroundColor: t.demoItem, borderColor: t.demoItemBorder, color: t.text }}
                >
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@bisnisanda.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  style={{
                    backgroundColor: t.inputBg,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: t.inputBorder,
                    color: t.inputText,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold" style={{ color: t.textSub }}>Kata Sandi</label>
                <span className="text-[11px]" style={{ color: t.textMuted }}>Min. 6 karakter</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  style={{
                    backgroundColor: t.inputBg,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: t.inputBorder,
                    color: t.inputText,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                  style={{ color: t.textMuted }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard Qassa</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t" style={{ borderColor: t.divider }}>
            <p className="text-xs" style={{ color: t.textSub }}>
              Belum memiliki akun usaha?{" "}
              <Link href="/register" className="font-bold text-indigo-500 hover:text-indigo-400 underline ml-1">
                Daftar Coba Gratis 30 Hari
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs transition-colors duration-300" style={{ borderColor: t.footerBorder, color: t.footerText }}>
        <p>&copy; {new Date().getFullYear()} Qassa Inc. All rights reserved. Platform Kasir Cloud Multi-Vertikal.</p>
      </footer>
    </div>
  );
}
