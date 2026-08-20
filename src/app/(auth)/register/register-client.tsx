"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Coffee,
  Scissors,
  ShoppingBag,
  Shirt,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Check,
  Eye,
  EyeOff,
  Store,
  Sparkles,
  KeyRound,
  RotateCcw,
  Sun,
  Moon,
} from "lucide-react";
import {
  sendRegistrationOtpAction,
  verifyOtpAndRegisterTenant,
} from "@/modules/auth/actions";

interface RegisterClientProps {
  initialVertical?: string;
}

export function RegisterClient({ initialVertical = "cafe" }: RegisterClientProps) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  // Theme Tokens
  const t = {
    bg: isDark ? "#0B0F19" : "#F1F5F9",
    cardBg: isDark ? "rgba(19,27,46,0.92)" : "rgba(255,255,255,0.96)",
    cardBorder: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.25)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    textSub: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#94A3B8",
    inputBg: isDark ? "#0B0F19" : "#FFFFFF",
    inputBorder: isDark ? "#334155" : "#CBD5E1",
    inputText: isDark ? "#F8FAFC" : "#0F172A",
    inputPlaceholder: isDark ? "#475569" : "#94A3B8",
    catCard: isDark ? "rgba(15,23,42,0.7)" : "#F8FAFC",
    catCardBorder: isDark ? "#1E293B" : "#E2E8F0",
    catCardSelected: isDark ? "rgba(79,70,229,0.12)" : "rgba(79,70,229,0.08)",
    divider: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    navBg: isDark ? "rgba(11,15,25,0.85)" : "rgba(241,245,249,0.9)",
    navBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    toggleBg: isDark ? "#1E293B" : "#E2E8F0",
    pillBg: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
    pillBorder: isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.25)",
    pillText: isDark ? "#A5B4FC" : "#4F46E5",
    sectionLabel: isDark ? "#CBD5E1" : "#475569",
    otpBg: isDark ? "#0B0F19" : "#F8FAFC",
    otpBorder: isDark ? "#334155" : "#CBD5E1",
    infoBg: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
    infoBorder: isDark ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.2)",
    infoText: isDark ? "#C7D2FE" : "#4338CA",
    gridColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)",
    glow1: isDark ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.06)",
    footerText: isDark ? "#475569" : "#94A3B8",
    footerBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
  };

  // Step State: 1 = Form Input, 2 = 6-Digit OTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [selectedVertical, setSelectedVertical] = useState<string>(initialVertical);
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP State (6 Digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Loading & Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Countdown Timer for OTP Resend
  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const businessCategories = [
    {
      id: "cafe",
      name: "Cafe, F&B & Resto",
      icon: Coffee,
      badge: "Populer F&B",
      desc: "Manajemen denah meja, varian rasa minuman & kirim tiket dapur (KOT).",
    },
    {
      id: "barbershop",
      name: "Barbershop & Salon",
      icon: Scissors,
      badge: "Spesialis Barber",
      desc: "Antrean kursi station, komisi kapster & treatment potong rambut.",
    },
    {
      id: "retail",
      name: "Supermarket & Retail",
      icon: ShoppingBag,
      badge: "High Speed",
      desc: "Barcode scanner cepat, multi-satuan grosir & Numpad kasir.",
    },
    {
      id: "laundry",
      name: "Laundry Service",
      icon: Shirt,
      badge: "Tracking",
      desc: "Timbangan Kg desimal, aroma parfum laundry & slot rak cucian.",
    },
  ];

  // STEP 1 SUBMIT -> Kirim OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok dengan kata sandi.");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal harus 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const res = await sendRegistrationOtpAction({
        email,
        phone,
        businessName,
        ownerName,
      });

      if (!res.success) {
        setError(res.message);
        setLoading(false);
        return;
      }

      setSuccessInfo(res.message);
      setStep(2);
      setCountdown(60);
      setCanResend(false);

      // Auto focus ke kotak OTP pertama
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengirim kode verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Digit Change Handler
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const cleanDigits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (cleanDigits.length > 1) {
        const filled = [...otpDigits];
        cleanDigits.forEach((d, i) => {
          if (index + i < 6) filled[index + i] = d;
        });
        setOtpDigits(filled);
        const nextIdx = Math.min(index + cleanDigits.length, 5);
        otpInputRefs.current[nextIdx]?.focus();
        return;
      }
      value = value.slice(-1);
    }

    const clean = value.replace(/\D/g, "");
    const newOtp = [...otpDigits];
    newOtp[index] = clean;
    setOtpDigits(newOtp);

    // Auto-advance ke input berikutnya jika ada angka
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;

    const newDigits = pasted.split("");
    const filled = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      filled[i] = newDigits[i] || "";
    }
    setOtpDigits(filled);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // STEP 2 SUBMIT -> Verifikasi OTP & Finalisasi Registrasi
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setError("Silakan masukkan 6-digit kode verifikasi lengkap.");
      return;
    }

    setLoading(true);

    try {
      const regRes = await verifyOtpAndRegisterTenant({
        businessName,
        ownerName,
        phone,
        address,
        email,
        password,
        verticalCode: selectedVertical,
        otpCode: fullOtp,
      });

      if (!regRes.success) {
        setError(regRes.message || "Verifikasi kode OTP gagal.");
        setLoading(false);
        return;
      }

      // Auto Login via NextAuth
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      });

      if (signInRes?.error) {
        router.push("/login?registered=1");
      } else {
        router.push("/dashboard?welcome=1");
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kendala saat verifikasi akun.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null);
    setLoading(true);

    try {
      const res = await sendRegistrationOtpAction({
        email,
        phone,
        businessName,
        ownerName,
      });

      if (res.success) {
        setSuccessInfo("Kode verifikasi baru telah dikirim ulang!");
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError("Gagal mengirim ulang kode verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: t.bg, color: t.text }}
    >
      {/* Background Vector Mesh & Ambient Glow */}
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

      {/* Top Navbar */}
      <header
        className="border-b backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300"
        style={{ backgroundColor: t.navBg, borderColor: t.navBorder }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 group">
            <div className="relative w-20 h-20 group-hover:scale-105 transition">
              <Image src="/smLogo.png" alt="Qassa" fill className="object-contain" priority />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight" style={{ color: t.text }}>Qassa</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-extrabold border uppercase tracking-wider"
                  style={{ backgroundColor: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.3)", color: "#34D399" }}
                >
                  Trial 30 Hari
                </span>
              </div>
              <p className="text-[10px] font-medium" style={{ color: t.textMuted }}>Pendaftaran Akun Baru</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            {/* Dark/Light Toggle */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition hover:scale-105"
              style={{ backgroundColor: t.toggleBg, borderColor: t.navBorder }}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
            <span className="hidden sm:inline" style={{ color: t.textSub }}>Sudah memiliki akun?</span>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl font-bold border transition flex items-center gap-1"
              style={{ backgroundColor: t.toggleBg, color: t.text, borderColor: t.navBorder }}
            >
              <span>Masuk Akun</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 my-4">
        <div
          className="w-full max-w-2xl backdrop-blur-2xl p-7 sm:p-10 rounded-[2.5rem] shadow-2xl space-y-7 border transition-colors duration-300"
          style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
        >

          {/* Header Title */}
          <div className="text-center space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border"
              style={{ backgroundColor: t.pillBg, borderColor: t.pillBorder, color: t.pillText }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Coba Gratis 30 Hari Penuh • Tanpa Kartu Kredit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: t.text }}>
              {step === 1 ? "Mulai Bisnis Lebih Cepat dengan Qassa" : "Verifikasi Akun Usaha Anda"}
            </h1>
            <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed" style={{ color: t.textSub }}>
              {step === 1
                ? "Daftarkan Bisnis Anda sekarang dan nikmati kemudahan kelola kasir, stok, dan laporan keuangan."
                : `Masukkan 6-digit kode OTP yang kami kirimkan ke ${email}`}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: FORM PENDAFTARAN LENGKAP */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              {/* Seksi 1: Pemilihan Jenis Usaha */}
              <div className="space-y-3">
                <label
                  className="block text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: t.sectionLabel }}
                >
                  1. Pilih Jenis Bidang Usaha Anda
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businessCategories.map((cat) => {
                    const isSelected = selectedVertical === cat.id;
                    const IconComp = cat.icon;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedVertical(cat.id)}
                        className="p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5"
                        style={{
                          backgroundColor: isSelected ? t.catCardSelected : t.catCard,
                          borderColor: isSelected ? "#4F46E5" : t.catCardBorder,
                          boxShadow: isSelected ? "0 0 0 2px rgba(79,70,229,0.25), 0 4px 20px rgba(79,70,229,0.1)" : "none",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center border"
                            style={{
                              backgroundColor: isSelected ? "#4F46E5" : (isDark ? "#1E293B" : "#E2E8F0"),
                              borderColor: isSelected ? "#4F46E5" : t.catCardBorder,
                              color: isSelected ? "#FFFFFF" : t.textMuted,
                            }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: isSelected ? t.pillBg : (isDark ? "#1E293B" : "#E2E8F0"),
                              borderColor: isSelected ? t.pillBorder : t.catCardBorder,
                              color: isSelected ? t.pillText : t.textMuted,
                            }}
                          >
                            {cat.badge}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-xs" style={{ color: isSelected ? "#4F46E5" : t.text }}>
                            {cat.name}
                          </h4>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: t.textMuted }}>
                            {cat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seksi 2: Informasi Bisnis & Pemilik */}
              <div className="space-y-4 pt-2">
                <label
                  className="block text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: t.sectionLabel }}
                >
                  2. Informasi Bisnis &amp; Akun Pemilik
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Bisnis */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                      Nama Bisnis <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Contoh: Kopi Senja / Barber House"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
                      />
                    </div>
                  </div>

                  {/* Nama Pemilik */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                      Nama Pemilik (Owner) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Nama Lengkap Anda"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
                      />
                    </div>
                  </div>

                  {/* Nomor HP / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                      Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
                      />
                    </div>
                  </div>

                  {/* Email Login — sejajar dengan WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                      Alamat Email Login <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@usahaanda.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
                      />
                    </div>
                  </div>

                  {/* Alamat Lengkap — full width */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                      Alamat Outlet Utama <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Jl. Sudirman No. 45, Jakarta"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
                      />
                    </div>
                  </div>

                  {/* Kata Sandi */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: t.textSub }}>
                      Kata Sandi (Min. 6 Karakter) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
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

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (() => {
                      const hasUpper = /[A-Z]/.test(password);
                      const hasNum = /[0-9]/.test(password);
                      const hasSpecial = /[^A-Za-z0-9]/.test(password);
                      const score = (password.length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0);
                      const levels = [
                        { label: "Lemah", color: "#EF4444" },
                        { label: "Sedang", color: "#F59E0B" },
                        { label: "Kuat", color: "#10B981" },
                        { label: "Sangat Kuat", color: "#6366F1" },
                      ];
                      const lvl = score <= 1 ? 0 : score === 2 ? 1 : score === 3 ? 2 : 3;
                      const { label, color } = levels[lvl];
                      return (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{ backgroundColor: i <= lvl ? color : (isDark ? "#1E293B" : "#E2E8F0") }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Konfirmasi Kata Sandi */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold" style={{ color: t.textSub }}>
                        Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      {confirmPassword && (
                        <span
                          className={`text-[10px] font-bold ${password === confirmPassword ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {password === confirmPassword ? "✓ Cocok" : "✗ Tidak Cocok"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        style={{ backgroundColor: t.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: t.inputBorder, color: t.inputText }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="pt-2 space-y-3">
                {/* Checkbox Ketentuan Layanan */}
                <label
                  className="flex items-start gap-2.5 cursor-pointer select-none group"
                  htmlFor="terms-checkbox"
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      id="terms-checkbox"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: agreedToTerms ? "#4F46E5" : "transparent",
                        borderColor: agreedToTerms ? "#4F46E5" : t.inputBorder,
                      }}
                    >
                      {agreedToTerms && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] leading-relaxed" style={{ color: t.textMuted }}>
                    Saya menyetujui{" "}
                    <a href="#" className="text-indigo-500 hover:text-indigo-400 font-semibold underline">Ketentuan Layanan</a>
                    {" "}&amp;{" "}
                    <a href="#" className="text-indigo-500 hover:text-indigo-400 font-semibold underline">Kebijakan Privasi</a>
                    {" "}Qassa POS.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Kode OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Registrasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px]" style={{ color: t.textMuted }}>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Gratis 30 Hari Penuh
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Tanpa Kartu Kredit
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Langsung Siap Pakai
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFIKASI KODE 6-DIGIT OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
              {/* Notification Banner */}
              <div
                className="p-4 rounded-2xl border text-xs leading-relaxed space-y-2"
                style={{
                  backgroundColor: t.infoBg,
                  borderColor: t.infoBorder,
                  color: t.infoText,
                }}
              >
                <div
                  className="flex items-center gap-2 font-bold"
                  style={{ color: isDark ? "#FFFFFF" : "#312E81" }}
                >
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span>Kode Verifikasi 6-Digit Telah Dikirim</span>
                </div>
                <p style={{ color: isDark ? "#C7D2FE" : "#4338CA" }}>
                  Silakan periksa kotak masuk email <strong>{email}</strong> atau pesan WhatsApp nomor <strong>{phone}</strong> untuk melihat 6-digit kode verifikasi Anda.
                </p>
              </div>

              {/* 6-Digit Auto Advancing Input Boxes */}
              <div className="space-y-3">
                <label
                  className="block text-center text-xs font-bold uppercase tracking-wider"
                  style={{ color: t.sectionLabel }}
                >
                  Masukkan 6-Digit Kode OTP:
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePasteOtp}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition shadow-sm"
                      style={{
                        backgroundColor: t.inputBg,
                        borderColor: digit ? "#4F46E5" : t.inputBorder,
                        color: t.inputText,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown & Resend Option */}
              <div
                className="text-center text-xs flex items-center justify-center gap-2"
                style={{ color: t.textMuted }}
              >
                <span>Tidak menerima kode?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-indigo-500 hover:text-indigo-600 underline flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kirim Ulang Kode</span>
                  </button>
                ) : (
                  <span className="font-mono font-medium" style={{ color: t.textSub }}>
                    Kirim ulang dalam {countdown}s
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading || otpDigits.join("").length !== 6}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyiapkan Akun Bisnis Anda...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verifikasi &amp; Buka Dashboard Qassa</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-full py-2.5 text-xs transition flex items-center justify-center gap-1 font-semibold hover:underline"
                  style={{ color: t.textMuted }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Data atau Email Pendaftaran</span>
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 text-center border-t" style={{ borderColor: t.divider }}>
            <p className="text-xs" style={{ color: t.textMuted }}>
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan &amp; Kebijakan Privasi Qassa POS.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-xs transition-colors duration-300"
        style={{ borderColor: t.footerBorder, color: t.footerText }}
      >
        <p>&copy; {new Date().getFullYear()} Qassa Inc. All rights reserved. Platform Kasir Cloud Multi-Vertikal.</p>
      </footer>
    </div>
  );
}
