"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FeatureEntitlement } from "./types";
import { DEFAULT_FEATURE_ENTITLEMENTS } from "./feature-registry";

const SETTING_KEY = "feature_entitlements_matrix";

/**
 * Mengambil matriks hak akses fitur dari database (atau default jika belum diset)
 */
export async function getFeatureEntitlementsMatrix(): Promise<FeatureEntitlement[]> {
  try {
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT "value" FROM "platform_settings" WHERE "key" = $1 LIMIT 1`,
      SETTING_KEY
    );

    if (rows && rows.length > 0 && rows[0].value) {
      const dbMatrix = typeof rows[0].value === "string" ? JSON.parse(rows[0].value) : rows[0].value;
      if (Array.isArray(dbMatrix) && dbMatrix.length > 0) {
        return dbMatrix;
      }
    }
  } catch (err) {
    console.error("Error reading feature entitlements from DB:", err);
  }

  return DEFAULT_FEATURE_ENTITLEMENTS;
}

/**
 * Super Admin: Menyimpan perubahan matriks hak akses fitur ke database
 */
export async function updateFeatureEntitlementsMatrixAction(
  newMatrix: FeatureEntitlement[]
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang dapat mengubah matriks fitur platform.");
  }

  const jsonStr = JSON.stringify(newMatrix);

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "platform_settings" ("id", "key", "value", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE
    SET "value" = $2::jsonb, "updatedAt" = NOW();
    `,
    SETTING_KEY,
    jsonStr
  );

  revalidatePath("/admin/catalog");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/settings");

  return { success: true, count: newMatrix.length };
}

/**
 * Helper Server-side: Memeriksa apakah tenant memenuhi syarat untuk mengakses fitur tertentu
 */
export async function evaluateTenantFeatureAccess(
  tenantId: string,
  featureKey: string
): Promise<{
  isAllowed: boolean;
  feature?: FeatureEntitlement;
  reason?: string;
}> {
  const [matrix, activeSub, activePlugins] = await Promise.all([
    getFeatureEntitlementsMatrix(),
    prisma.tenantSubscription.findFirst({
      where: { tenantId, isActive: true },
      include: { licenseTier: true },
    }),
    prisma.tenantPlugin.findMany({
      where: {
        subscription: { tenantId, isActive: true },
        isActive: true,
      },
      include: { plugin: true },
    }),
  ]);

  const feat = (matrix as any[]).find((f: any) => f.key === featureKey);
  if (!feat) {
    return { isAllowed: true };
  }

  // 1. Cek prasyarat plugin vertikal
  if (feat.requiredPlugin) {
    const hasPlugin = (activePlugins as any[]).some((p: any) => p.plugin?.code === feat.requiredPlugin);
    if (!hasPlugin) {
      return {
        isAllowed: false,
        feature: feat,
        reason: `Memerlukan modul vertikal tambahan (${feat.requiredPlugin}).`,
      };
    }
  }

  // 2. Cek tier lisensi
  const tenantTierCode = (activeSub?.licenseTier?.code || "basic").toLowerCase();
  const normalizedTier = tenantTierCode === "basic" ? "starter" : tenantTierCode;

  const isTierAllowed = (feat.allowedTiers as any[]).some(
    (t: any) => t.toLowerCase() === normalizedTier || t.toLowerCase() === tenantTierCode
  );

  if (!isTierAllowed) {
    return {
      isAllowed: false,
      feature: feat,
      reason: `Tersedia secara eksklusif pada paket ${(feat.allowedTiers as any[]).map((t: any) => t.toUpperCase()).join(" / ")}.`,
    };
  }

  return { isAllowed: true, feature: feat };
}
