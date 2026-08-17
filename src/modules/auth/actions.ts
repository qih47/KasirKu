"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export interface RegisterInput {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  verticalCode: string; // fallback primary vertical: "barbershop" | "cafe" | "retail" | "laundry"
  planType?: "TRIAL" | "PAID"; // "TRIAL" untuk coba 30 hari, "PAID" untuk daftar resmi langsung berbayar
  tierCode?: string; // "basic" | "pro" | "enterprise"
  billingCycle?: "MONTHLY" | "ANNUAL";
  pluginCodes?: string[]; // array plugin yang dipilih
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  userId?: string;
  invoiceId?: string;
}

export async function registerTenantAndOwner(
  data: RegisterInput
): Promise<RegisterResult> {
  const {
    businessName,
    ownerName,
    email,
    password,
    verticalCode = "barbershop",
    planType = "TRIAL",
    tierCode = "basic",
    billingCycle = "MONTHLY",
    pluginCodes = [],
  } = data;

  if (!businessName || !ownerName || !email || !password) {
    return {
      success: false,
      message: "Nama bisnis, nama pemilik, email, dan password wajib diisi lengkap.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Password minimal harus 6 karakter.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email sudah digunakan. Silakan gunakan email lain atau login.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    // Tentukan periode aktif berdasarkan tipe pendaftaran
    const isPaid = planType === "PAID";
    const durationDays = isPaid ? (billingCycle === "ANNUAL" ? 365 : 30) : 30;
    const periodEnd = addDays(now, durationDays);

    // Ambil lisensi yang dipilih dari database
    const targetTierCode = isPaid ? tierCode.toLowerCase() : "basic";
    let selectedTier = await prisma.licenseTier.findUnique({
      where: { code: targetTierCode },
    });

    if (!selectedTier) {
      selectedTier = await prisma.licenseTier.findFirst({
        where: { isActive: true },
      });
    }

    if (!selectedTier) {
      selectedTier = await prisma.licenseTier.create({
        data: {
          code: targetTierCode,
          name: targetTierCode === "pro" ? "Lisensi Pro" : "Lisensi Basic",
          priceMonthly: targetTierCode === "pro" ? 500000 : 150000,
          priceAnnual: targetTierCode === "pro" ? 4980000 : 1494000,
          outletLimit: targetTierCode === "pro" ? 10 : 1,
          kasirLimitPerOutlet: targetTierCode === "pro" ? 99 : 5,
        },
      });
    }

    // Kumpulkan plugin yang akan dihubungkan
    const activePluginCodesSet = new Set<string>();
    if (pluginCodes && pluginCodes.length > 0) {
      pluginCodes.forEach((c) => activePluginCodesSet.add(c.toLowerCase()));
    } else if (verticalCode) {
      activePluginCodesSet.add(verticalCode.toLowerCase());
    }

    const allDbPlugins = await prisma.plugin.findMany({
      where: { isActive: true },
    });

    const targetPlugins = allDbPlugins.filter((p) =>
      activePluginCodesSet.has(p.code.toLowerCase())
    );

    // Hitung total tagihan awal jika jalur resmi berbayar
    let initialTotalAmount = 0;
    if (isPaid) {
      const tierCost =
        billingCycle === "ANNUAL"
          ? Number(selectedTier.priceAnnual) || Number(selectedTier.priceMonthly) * 12 * 0.83
          : Number(selectedTier.priceMonthly);

      let pluginsCost = 0;
      targetPlugins.forEach((p) => {
        const pPrice =
          billingCycle === "ANNUAL"
            ? Number(p.priceAnnual) || Number(p.priceMonthly) * 12 * 0.83
            : Number(p.priceMonthly);
        pluginsCost += pPrice;
      });

      initialTotalAmount = tierCost + pluginsCost;
    }

    // Jalankan atomic transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Buat Tenant
      const tenant = await tx.tenant.create({
        data: {
          businessName,
          status: isPaid ? "ACTIVE" : "TRIAL",
          trialStartAt: isPaid ? null : now,
          trialEndAt: isPaid ? null : periodEnd,
        },
      });

      // 2. Buat Outlet Utama
      const outlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          name: "Outlet Utama",
        },
      });

      // 3. Buat Subscription
      const subscription = await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          licenseTierId: selectedTier.id,
          billingCycle: billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          isActive: true,
        },
      });

      // 4. Hubungkan Plugin-Plugin yang Dipilih
      for (const p of targetPlugins) {
        await tx.tenantPlugin.create({
          data: {
            subscriptionId: subscription.id,
            pluginId: p.id,
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
          name: ownerName,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          isActive: true,
        },
      });

      // 6. Jika Jalur Resmi Berbayar: Buat Invoice Resmi
      let invoice = null;
      if (isPaid && initialTotalAmount > 0) {
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        invoice = await tx.invoice.create({
          data: {
            tenantId: tenant.id,
            subscriptionId: subscription.id,
            invoiceNumber,
            amount: initialTotalAmount,
            status: "PAID",
            paidAt: now,
            dueDate: now,
          },
        });
      }

      return { tenant, user, invoice };
    });

    const successMessage = isPaid
      ? `Pendaftaran Jalur Resmi Berhasil! Paket ${selectedTier.name} (${billingCycle === "ANNUAL" ? "1 Tahun" : "1 Bulan"}) telah aktif.`
      : "Pendaftaran berhasil! Akun dan masa Trial 30 Hari Anda telah aktif.";

    return {
      success: true,
      message: successMessage,
      userId: result.user.id,
      invoiceId: result.invoice?.id,
    };
  } catch (error: any) {
    console.error("Gagal melakukan registrasi:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan pada server saat registrasi.",
    };
  }
}
