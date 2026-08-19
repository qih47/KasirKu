"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_DURATION_SETTINGS,
  DurationSettingItem,
} from "@/types/subscription-duration";

const DURATION_SETTINGS_KEY = "subscription_duration_discounts";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang dapat mengelola diskon durasi.");
  }
  return session.user as any;
}

/**
 * Mengambil pengaturan diskon durasi langganan dari tabel PlatformSetting.
 * Jika belum ada di DB, kembalikan default dan inisialisasi di DB.
 */
export async function getSubscriptionDurationSettingsAction(): Promise<DurationSettingItem[]> {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT "value" FROM "platform_settings" WHERE "key" = $1 LIMIT 1`,
      DURATION_SETTINGS_KEY
    );

    if (rows && rows.length > 0 && Array.isArray(rows[0].value)) {
      return rows[0].value as DurationSettingItem[];
    }

    return DEFAULT_DURATION_SETTINGS;
  } catch (error) {
    console.error("Gagal mengambil duration settings:", error);
    return DEFAULT_DURATION_SETTINGS;
  }
}

/**
 * Menyimpan pembaruan persentase diskon durasi oleh Super Admin
 */
export async function updateSubscriptionDurationSettingsAction(
  settings: DurationSettingItem[]
) {
  await requireSuperAdmin();

  if (!Array.isArray(settings) || settings.length === 0) {
    throw new Error("Data pengaturan durasi tidak valid.");
  }

  // Validasi nilai persentase diskon
  const sanitizedSettings = settings.map((s) => ({
    key: s.key,
    label: s.label || s.key,
    months: Number(s.months) || 1,
    discountPercent: Math.max(0, Math.min(99, Number(s.discountPercent) || 0)),
    isActive: Boolean(s.isActive),
    badgeText: s.discountPercent > 0 ? `Hemat ${s.discountPercent}%` : "Standar",
    isPopular: s.key === "1Y" || Boolean(s.isPopular),
  }));

  const jsonStr = JSON.stringify(sanitizedSettings);

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "platform_settings" ("id", "key", "value", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = $2::jsonb, "updatedAt" = NOW();
    `,
    DURATION_SETTINGS_KEY,
    jsonStr
  );

  // Revalidate halaman terkait
  revalidatePath("/admin/catalog");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/");

  return {
    success: true,
    message: "Pengaturan diskon durasi langganan berhasil disimpan dan diterapkan!",
    settings: sanitizedSettings,
  };
}
