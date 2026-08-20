"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, addYears, differenceInDays } from "date-fns";
import { revalidatePath } from "next/cache";

import { getSubscriptionDurationSettingsAction } from "@/modules/superadmin/duration-actions";

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
    prisma.licenseTier.findMany(),
    prisma.plugin.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  // Urutkan tier: Basic -> Pro -> Enterprise
  const tierOrder: Record<string, number> = { basic: 1, pro: 2, enterprise: 3 };
  availableTiers.sort((a, b) => (tierOrder[a.code.toLowerCase()] || 99) - (tierOrder[b.code.toLowerCase()] || 99));


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
  let activePluginIds = activeSub?.plugins.map((p: any) => p.pluginId) || [];

  if (activePluginIds.length === 0 && availablePlugins.length > 0) {
    const nameLower = tenant.businessName.toLowerCase();
    const defaultPlugin =
      availablePlugins.find((p) => {
        const code = p.code.toLowerCase();
        if (nameLower.includes("cafe") || nameLower.includes("kopi") || nameLower.includes("coffee")) return code.includes("cafe");
        if (nameLower.includes("barber") || nameLower.includes("potong")) return code.includes("barber");
        if (nameLower.includes("retail") || nameLower.includes("mart") || nameLower.includes("Bisnis")) return code.includes("retail");
        if (nameLower.includes("laundry") || nameLower.includes("cuci")) return code.includes("laundry");
        return false;
      }) || availablePlugins[0];

    if (defaultPlugin) {
      activePluginIds = [defaultPlugin.id];
    }
  }

  const activePlugins = availablePlugins.filter((p) => activePluginIds.includes(p.id));

  // Ambil pengaturan diskon durasi dinamis dari database (PlatformSetting)
  const durationSettings = await getSubscriptionDurationSettingsAction();

  const currentDurationKey = (activeSub as any)?.durationKey || (activeSub?.billingCycle === "ANNUAL" ? "1Y" : "1M");

  return JSON.parse(
    JSON.stringify({
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
      currentDurationKey,
      durationSettings,
      activePlugins,
      activePluginIds,
      availableTiers,
      availablePlugins,
      quota: {
        outletsUsed,
        outletLimit: currentTier?.outletLimit ?? 1,
        cashiersUsed,
        kasirLimit: currentTier?.kasirLimitPerOutlet ?? 5,
      },
    })
  );
}

export async function upgradeSubscriptionAction(data: {
  licenseTierId: string;
  billingCycle?: BillingCycle;
  durationKey?: string;
  durationMonths?: number;
  selectedPluginIds: string[];
}) {
  const user = await requireOwner();
  const { licenseTierId, selectedPluginIds } = data;
  const durationMonths = Number(data.durationMonths) || (data.billingCycle === "ANNUAL" ? 12 : 1);
  const durationKey = data.durationKey || (durationMonths >= 12 ? (durationMonths === 12 ? "1Y" : durationMonths === 24 ? "2Y" : "3Y") : durationMonths === 6 ? "6M" : durationMonths === 3 ? "3M" : "1M");
  const billingCycle: BillingCycle = durationMonths >= 12 ? "ANNUAL" : "MONTHLY";

  const targetTier = await prisma.licenseTier.findUnique({
    where: { id: licenseTierId },
  });

  if (!targetTier) throw new Error("Lisensi tidak ditemukan.");

  const now = new Date();
  const periodEnd = addMonths(now, durationMonths);

  await prisma.$transaction(async (tx: any) => {
    // 1. Nonaktifkan subscription lama
    await tx.tenantSubscription.updateMany({
      where: { tenantId: user.tenantId, isActive: true },
      data: { isActive: false },
    });

    // 2. Buat subscription baru yang aktif dengan durasi fleksibel
    const newSub = await tx.tenantSubscription.create({
      data: {
        tenantId: user.tenantId,
        licenseTierId,
        billingCycle,
        durationMonths,
        durationKey,
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

    // 4. Ubah status Tenant menjadi ACTIVE
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
  revalidatePath("/pos");
  revalidatePath("/admin/tenants");

  return { success: true };
}

