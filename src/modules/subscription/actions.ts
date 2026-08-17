"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, addYears, differenceInDays } from "date-fns";
import { revalidatePath } from "next/cache";

export type BillingCycle = "MONTHLY" | "ANNUAL";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola lisensi & langganan.");
  }
  return session.user as any;
}

export async function getSubscriptionData() {
  const user = await requireOwner();

  const [tenant, availableTiers, availablePlugins] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: true,
        users: { where: { role: "KASIR" } },
        subscriptions: {
          where: { isActive: true },
          include: {
            licenseTier: true,
            plugins: {
              where: { isActive: true },
              include: { plugin: true },
            },
          },
        },
      },
    }),
    prisma.licenseTier.findMany({ orderBy: { priceMonthly: "asc" } }),
    prisma.plugin.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const activeSub = tenant.subscriptions[0];
  const now = new Date();

  // Hitung sisa hari trial atau masa aktif
  let daysRemaining = 0;
  let isExpired = false;

  if (tenant.status === "TRIAL" && tenant.trialEndAt) {
    daysRemaining = Math.max(0, differenceInDays(new Date(tenant.trialEndAt), now));
    isExpired = new Date(tenant.trialEndAt) < now;
  } else if (activeSub?.currentPeriodEnd) {
    daysRemaining = Math.max(0, differenceInDays(new Date(activeSub.currentPeriodEnd), now));
    isExpired = new Date(activeSub.currentPeriodEnd) < now;
  }

  const outletsUsed = tenant.outlets.length;
  const cashiersUsed = tenant.users.length;

  const currentTier = activeSub?.licenseTier || availableTiers[0];
  const activePluginIds = activeSub?.plugins.map((p: any) => p.pluginId) || [];

  return {
    tenant: {
      id: tenant.id,
      businessName: tenant.businessName,
      status: tenant.status,
      trialEndAt: tenant.trialEndAt,
      daysRemaining,
      isExpired,
    },
    activeSubscription: activeSub,
    currentTier,
    activePlugins: activeSub?.plugins.map((p: any) => p.plugin) || [],
    activePluginIds,
    availableTiers,
    availablePlugins,
    quota: {
      outletsUsed,
      outletLimit: currentTier?.outletLimit ?? 1,
      cashiersUsed,
      kasirLimit: currentTier?.kasirLimitPerOutlet ?? 5,
    },
  };
}

export async function upgradeSubscriptionAction(data: {
  licenseTierId: string;
  billingCycle: BillingCycle;
  selectedPluginIds: string[];
}) {
  const user = await requireOwner();
  const { licenseTierId, billingCycle, selectedPluginIds } = data;

  const targetTier = await prisma.licenseTier.findUnique({
    where: { id: licenseTierId },
  });

  if (!targetTier) throw new Error("Lisensi tidak ditemukan.");

  const now = new Date();
  const periodEnd =
    billingCycle === "ANNUAL" ? addYears(now, 1) : addMonths(now, 1);

  await prisma.$transaction(async (tx: any) => {
    // 1. Nonaktifkan subscription lama
    await tx.tenantSubscription.updateMany({
      where: { tenantId: user.tenantId, isActive: true },
      data: { isActive: false },
    });

    // 2. Buat subscription baru yang aktif
    const newSub = await tx.tenantSubscription.create({
      data: {
        tenantId: user.tenantId,
        licenseTierId,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        isActive: true,
      },
    });

    // 3. Tambahkan plugin-plugin yang dipilih
    for (const pId of selectedPluginIds) {
      await tx.tenantPlugin.create({
        data: {
          subscriptionId: newSub.id,
          pluginId: pId,
          isActive: true,
        },
      });
    }

    // 4. Ubah status Tenant menjadi ACTIVE (Lunas/Langganan Aktif)
    await tx.tenant.update({
      where: { id: user.tenantId },
      data: {
        status: "ACTIVE",
        lockedAt: null,
      },
    });
  });

  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard");
  return { success: true };
}
