"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import {
  barbershopReceiptPreset,
  cafeReceiptPreset,
  retailReceiptPreset,
  laundryReceiptPreset,
  BusinessVertical,
} from "@/types/receipt";
import { sendOtpToAllChannels } from "@/lib/notifications";
import { getTrialConfigurationAction } from "@/modules/superadmin/trial-actions";
import {
  calculateTrialEndDate,
  getTrialDurationLabel,
} from "@/types/trial-configuration";

export interface RegisterInput {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  verticalCode: "barbershop" | "cafe" | "retail" | "laundry" | string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  userId?: string;
  tenantId?: string;
  otpCode?: string;
}

// Global in-memory OTP Store fallback
const memoryOtpStore = new Map<string, { otp: string; expiresAt: number; phone?: string; createdAt: number }>();

async function saveOtp(email: string, data: { otp: string; expiresAt: number; phone?: string; createdAt: number }) {
  memoryOtpStore.set(email, data);
  try {
    const key = `otp_${email}`;
    await (prisma.platformSetting as any).upsert({
      where: { key },
      update: { value: data },
      create: { key, value: data },
    });
  } catch (err) {
    console.warn("Could not persist OTP to database, using memory fallback:", err);
  }
}

async function getOtp(email: string): Promise<{ otp: string; expiresAt: number; phone?: string; createdAt: number } | null> {
  try {
    const key = `otp_${email}`;
    const record = await (prisma.platformSetting as any).findUnique({
      where: { key },
    });
    if (record && record.value) {
      return record.value as any;
    }
  } catch (err) {
    console.warn("Could not read OTP from database, checking memory fallback:", err);
  }
  return memoryOtpStore.get(email) || null;
}

async function removeOtp(email: string) {
  memoryOtpStore.delete(email);
  try {
    const key = `otp_${email}`;
    await (prisma.platformSetting as any).delete({
      where: { key },
    }).catch(() => {});
  } catch (err) {
    // Ignore error
  }
}

/**
 * 1. Kirim Kode OTP 6-Digit ke Email & WhatsApp Calon Merchant
 */
export async function sendRegistrationOtpAction(data: {
  email: string;
  phone: string;
  businessName: string;
  ownerName: string;
}): Promise<{ success: boolean; message: string }> {
  const { email, phone, businessName, ownerName } = data;

  if (!email || !phone || !businessName || !ownerName) {
    return {
      success: false,
      message: "Nama bisnis, nama pemilik, nomor WhatsApp, dan email wajib diisi.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cek apakah email sudah terdaftar sebelumnya
  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      success: false,
      message: "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
    };
  }

  // Generate 6-digit random secure OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // Berlaku 10 menit

  await saveOtp(normalizedEmail, {
    otp,
    expiresAt,
    phone,
    createdAt: Date.now(),
  });

  // Dispatch OTP ke Email & WhatsApp via Notification Service
  await sendOtpToAllChannels({
    toEmail: normalizedEmail,
    toPhone: phone,
    ownerName,
    businessName,
    otp,
  });

  return {
    success: true,
    message: `Kode verifikasi 6-digit telah dikirim ke email ${normalizedEmail} dan WhatsApp ${phone}.`,
  };
}

/**
 * 2. Verifikasi OTP & Daftarkan Akun Tenant Onboarding Lengkap
 */
export async function verifyOtpAndRegisterTenant(
  data: RegisterInput & { otpCode: string }
): Promise<RegisterResult> {
  const {
    businessName,
    ownerName,
    phone,
    address,
    email,
    password,
    verticalCode = "cafe",
    otpCode,
  } = data;

  if (!businessName || !ownerName || !email || !password || !phone || !address) {
    return {
      success: false,
      message: "Semua kolom pendaftaran wajib diisi lengkap.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Kata sandi minimal harus 6 karakter.",
    };
  }

  if (!otpCode || !otpCode.trim()) {
    return {
      success: false,
      message: "Kode verifikasi OTP wajib diisi.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validasi Kode OTP
  const record = await getOtp(normalizedEmail);
  if (!record) {
    return {
      success: false,
      message: "Kode verifikasi tidak ditemukan atau telah kedaluwarsa. Silakan minta kode baru.",
    };
  }

  if (Date.now() > record.expiresAt) {
    await removeOtp(normalizedEmail);
    return {
      success: false,
      message: "Kode verifikasi telah kedaluwarsa. Silakan kirim ulang kode.",
    };
  }

  if (record.otp !== otpCode.trim()) {
    return {
      success: false,
      message: "Kode verifikasi 6-digit yang Anda masukkan salah.",
    };
  }

  // OTP Valid -> Hapus dari store agar tidak bisa dipakai ulang
  await removeOtp(normalizedEmail);

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email sudah digunakan oleh akun lain.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const trialConfig = await getTrialConfigurationAction();
    const trialEnd = calculateTrialEndDate(trialConfig, now);


    // Tentukan preset berdasarkan bidang usaha yang dipilih
    let initialReceiptConfig: any = cafeReceiptPreset;
    let initialPosLayout = "CAFE_QUICK_ORDER";
    const vCode = verticalCode.toLowerCase();

    if (vCode === "barbershop") {
      initialReceiptConfig = {
        ...barbershopReceiptPreset,
        posLayout: "BARBERSHOP_STATION",
        purchasedLayoutIds: ["BARBERSHOP_STATION", "CAFE_QUICK_ORDER"],
      };
      initialPosLayout = "BARBERSHOP_STATION";
    } else if (vCode === "retail") {
      initialReceiptConfig = {
        ...retailReceiptPreset,
        posLayout: "RETAIL_FAST_BARCODE",
        purchasedLayoutIds: ["RETAIL_FAST_BARCODE", "CAFE_QUICK_ORDER"],
      };
      initialPosLayout = "RETAIL_FAST_BARCODE";
    } else if (vCode === "laundry") {
      initialReceiptConfig = {
        ...laundryReceiptPreset,
        posLayout: "LAUNDRY_WEIGHING",
        purchasedLayoutIds: ["LAUNDRY_WEIGHING", "CAFE_QUICK_ORDER"],
      };
      initialPosLayout = "LAUNDRY_WEIGHING";
    } else {
      initialReceiptConfig = {
        ...cafeReceiptPreset,
        posLayout: "CAFE_QUICK_ORDER",
        purchasedLayoutIds: ["CAFE_QUICK_ORDER", "BARBERSHOP_STATION"],
      };
      initialPosLayout = "CAFE_QUICK_ORDER";
    }

    initialReceiptConfig.phone = phone;
    initialReceiptConfig.outletName = "Cabang Utama";

    // Ambil lisensi default "basic" atau lisensi aktif pertama
    let defaultTier = await prisma.licenseTier.findUnique({
      where: { code: "basic" },
    });

    if (!defaultTier) {
      defaultTier = await prisma.licenseTier.findFirst({
        where: { isActive: true },
      });
    }

    if (!defaultTier) {
      defaultTier = await prisma.licenseTier.create({
        data: {
          code: "basic",
          name: "Lisensi Starter",
          priceMonthly: 150000,
          priceAnnual: 1494000,
          outletLimit: 1,
          kasirLimitPerOutlet: 5,
        },
      });
    }

    // Ambil semua plugin yang sesuai dengan vertikal yang dipilih
    const targetPlugin = await prisma.plugin.findUnique({
      where: { code: vCode },
    });

    // Jalankan atomic database creation
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Buat Tenant
      const tenant = await tx.tenant.create({
        data: {
          businessName,
          status: "TRIAL",
          trialStartAt: now,
          trialEndAt: trialEnd,
          receiptConfig: initialReceiptConfig,
        },
      });

      // 2. Buat Outlet Utama
      const outlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          name: "Cabang Utama",
          address: address.trim(),
        },
      });

      // 3. Buat Subscription Trial
      const subscription = await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          licenseTierId: defaultTier!.id,
          billingCycle: "MONTHLY",
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          isActive: true,
        },
      });

      // 4. Hubungkan Plugin Vertikal jika ada di DB
      if (targetPlugin) {
        await tx.tenantPlugin.create({
          data: {
            subscriptionId: subscription.id,
            pluginId: targetPlugin.id,
            isActive: true,
          },
        });
      }

      // 5. Buat User Owner
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          outletId: outlet.id,
          role: "OWNER",
          name: ownerName.trim(),
          email: normalizedEmail,
          passwordHash: hashedPassword,
          isActive: true,
        },
      });

      return { tenant, user };
    });

    const trialLabel = getTrialDurationLabel(trialConfig, "id");
    return {
      success: true,
      message: `Selamat datang di Qassa! Akun dan masa Trial Gratis ${trialLabel} Anda telah aktif.`,
      userId: result.user.id,
      tenantId: result.tenant.id,
    };
  } catch (error: any) {
    console.error("Gagal melakukan registrasi Qassa:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kendala pada server saat pendaftaran.",
    };
  }
}

// Backwards compatibility alias
export async function registerTenantAndOwner(data: any): Promise<any> {
  return verifyOtpAndRegisterTenant({
    ...data,
    otpCode: data.otpCode || "",
  });
}

