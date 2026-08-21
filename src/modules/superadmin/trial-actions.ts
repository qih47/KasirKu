"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_TRIAL_CONFIGURATION,
  TrialConfiguration,
} from "@/types/trial-configuration";

const TRIAL_CONFIG_KEY = "trial_configuration";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang dapat mengelola masa trial.");
  }
  return session.user as any;
}

/**
 * Mengambil pengaturan durasi trial dari tabel platform_settings.
 * Jika belum ada, kembalikan DEFAULT_TRIAL_CONFIGURATION.
 */
export async function getTrialConfigurationAction(): Promise<TrialConfiguration> {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: TRIAL_CONFIG_KEY },
    });

    if (setting && setting.value && typeof setting.value === "object") {
      const val = setting.value as any;
      return {
        durationValue: Math.max(1, Number(val.durationValue) || 30),
        durationUnit: val.durationUnit === "MONTHS" ? "MONTHS" : "DAYS",
        isEnabled: val.isEnabled !== undefined ? Boolean(val.isEnabled) : true,
        customBadgeText: typeof val.customBadgeText === "string" ? val.customBadgeText : "",
      };
    }

    return DEFAULT_TRIAL_CONFIGURATION;
  } catch (error) {
    // Fallback via raw query jika prisma model cache berbeda
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT "value" FROM "platform_settings" WHERE "key" = $1 LIMIT 1`,
        TRIAL_CONFIG_KEY
      );
      if (rows && rows.length > 0 && rows[0].value) {
        const val = rows[0].value;
        return {
          durationValue: Math.max(1, Number(val.durationValue) || 30),
          durationUnit: val.durationUnit === "MONTHS" ? "MONTHS" : "DAYS",
          isEnabled: val.isEnabled !== undefined ? Boolean(val.isEnabled) : true,
          customBadgeText: typeof val.customBadgeText === "string" ? val.customBadgeText : "",
        };
      }
    } catch (innerErr) {
      console.error("Gagal mengambil trial configuration fallback:", innerErr);
    }
    return DEFAULT_TRIAL_CONFIGURATION;
  }
}

/**
 * Menyimpan konfigurasi masa trial oleh Super Admin
 */
export async function updateTrialConfigurationAction(config: Partial<TrialConfiguration>) {
  await requireSuperAdmin();

  const sanitized: TrialConfiguration = {
    durationValue: Math.max(1, Math.min(365, Number(config.durationValue) || 30)),
    durationUnit: config.durationUnit === "MONTHS" ? "MONTHS" : "DAYS",
    isEnabled: config.isEnabled !== undefined ? Boolean(config.isEnabled) : true,
    customBadgeText: (config.customBadgeText || "").trim(),
  };

  const jsonStr = JSON.stringify(sanitized);

  try {
    await prisma.platformSetting.upsert({
      where: { key: TRIAL_CONFIG_KEY },
      create: {
        key: TRIAL_CONFIG_KEY,
        value: sanitized as any,
      },
      update: {
        value: sanitized as any,
      },
    });
  } catch (err) {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "platform_settings" ("id", "key", "value", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = $2::jsonb, "updatedAt" = NOW();
      `,
      TRIAL_CONFIG_KEY,
      jsonStr
    );
  }

  // Revalidate seluruh halaman yang menampilkan info trial
  revalidatePath("/");
  revalidatePath("/(auth)/register");
  revalidatePath("/(auth)/login");
  revalidatePath("/register");
  revalidatePath("/login");
  revalidatePath("/demo");
  revalidatePath("/admin");
  revalidatePath("/admin/catalog");
  revalidatePath("/admin/tenants");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Pengaturan durasi trial berhasil disimpan dan diterapkan ke seluruh platform!",
    config: sanitized,
  };
}
