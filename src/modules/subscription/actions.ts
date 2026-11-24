"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, addYears, differenceInDays } from "date-fns";
import { revalidatePath } from "next/cache";

import { getSubscriptionDurationSettingsAction } from "@/modules/superadmin/duration-actions";

export type BillingCycle = "MONTHLY" | "ANNUAL";

interface AuthenticatedOwner {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

async function requireOwner(): Promise<AuthenticatedOwner> {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as AuthenticatedOwner | undefined;
  if (!session || user?.role !== "OWNER" || !user?.tenantId) {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola lisensi & langganan.");
  }
  return user;
}

export async function getSubscriptionData() {
  const user = await requireOwner();

  const [tenant, availableTiers, availablePlugins] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: true,
        users: {
          where: {
            role: "KASIR",
            isActive: true,
            hasPosAccess: true,
          },
        },
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
  availableTiers.sort((a: any, b: any) => (tierOrder[a.code.toLowerCase()] || 99) - (tierOrder[b.code.toLowerCase()] || 99));


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
  let activePluginIds = (activeSub?.plugins || []).map((p: any) => p.pluginId);

  if (activePluginIds.length === 0 && availablePlugins.length > 0) {
    const nameLower = tenant.businessName.toLowerCase();
    const defaultPlugin =
      availablePlugins.find((p: any) => {
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

  const activePlugins = availablePlugins.filter((p: any) => activePluginIds.includes(p.id));

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
  actionType?: "RENEW" | "UPGRADE_TIER" | "ADD_PLUGIN_MID_CYCLE" | "DOWNGRADE";
}) {
  const user = await requireOwner();
  let { licenseTierId, selectedPluginIds, actionType } = data;
  const durationMonths = Number(data.durationMonths) || (data.billingCycle === "ANNUAL" ? 12 : 1);
  const durationKey = data.durationKey || (durationMonths >= 12 ? (durationMonths === 12 ? "1Y" : durationMonths === 24 ? "2Y" : "3Y") : durationMonths === 6 ? "6M" : durationMonths === 3 ? "3M" : "1M");
  const billingCycle: BillingCycle = durationMonths >= 12 ? "ANNUAL" : "MONTHLY";

  const targetTier = await prisma.licenseTier.findUnique({
    where: { id: licenseTierId },
  });

  if (!targetTier) throw new Error("Lisensi tidak ditemukan.");

  // Validasi Aturan Vertikal vs Add-on: Basic hanya boleh 1 vertikal bisnis utama
  const VERTICAL_PLUGIN_CODES = ["barbershop", "cafe", "retail", "laundry"];
  const isBasicTier = targetTier.code.toLowerCase() === "basic";

  if (isBasicTier && selectedPluginIds.length > 0) {
    const selectedPluginsDb = await prisma.plugin.findMany({
      where: { id: { in: selectedPluginIds } },
    });
    const selectedVerticals = selectedPluginsDb.filter((p: any) =>
      VERTICAL_PLUGIN_CODES.includes(p.code.toLowerCase())
    );
    const selectedAddons = selectedPluginsDb.filter(
      (p: any) => !VERTICAL_PLUGIN_CODES.includes(p.code.toLowerCase())
    );

    if (selectedVerticals.length > 1) {
      // Pertahankan hanya vertikal pertama yang dipilih, pertahankan semua utility add-on
      selectedPluginIds = [
        selectedVerticals[0].id,
        ...selectedAddons.map((p: any) => p.id),
      ];
    }
  }

  // Cek langganan aktif saat ini untuk akumulasi hari, migrasi tema, dan preservasi plugin
  const existingActiveSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: user.tenantId, isActive: true },
    include: { theme: true, plugins: { where: { isActive: true } } },
  });

  // Jika selectedPluginIds kosong dan bukan tindakan downgrade, warisi plugin aktif sebelumnya (mencegah wipeout saat renewal)
  if ((!selectedPluginIds || selectedPluginIds.length === 0) && actionType !== "DOWNGRADE" && existingActiveSub) {
    selectedPluginIds = (existingActiveSub.plugins || []).map((p: any) => p.pluginId);
  }

  const now = new Date();

  // Idempotent Guard: Cegah pemanggilan ganda dari Webhook + Client Polling dalam kurun waktu 60 detik
  if (
    existingActiveSub &&
    existingActiveSub.licenseTierId === licenseTierId &&
    now.getTime() - new Date(existingActiveSub.createdAt).getTime() < 60000 &&
    (existingActiveSub.plugins || []).length >= (selectedPluginIds || []).length
  ) {
    return { success: true, message: "Subscription already activated idempotently." };
  }

  let periodEnd: Date;

  if (
    actionType === "ADD_PLUGIN_MID_CYCLE" &&
    existingActiveSub &&
    new Date(existingActiveSub.currentPeriodEnd) > now
  ) {
    // Skenario Co-Termed: Tenant hanya menambah modul plugin di tengah masa aktif tanpa memperpanjang durasi utama
    periodEnd = new Date(existingActiveSub.currentPeriodEnd);
  } else {
    // Skenario Renewal atau Upgrade Tier
    let baseEndDate = now;
    if (
      existingActiveSub &&
      existingActiveSub.licenseTierId === licenseTierId &&
      new Date(existingActiveSub.currentPeriodEnd) > now
    ) {
      baseEndDate = new Date(existingActiveSub.currentPeriodEnd);
    }
    periodEnd = addMonths(baseEndDate, durationMonths);
  }

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

    // 2b. Migrasikan tema aktif & customConfig dari subscription lama agar tidak hilang
    if (existingActiveSub?.theme) {
      await tx.tenantTheme.create({
        data: {
          subscriptionId: newSub.id,
          themeId: existingActiveSub.theme.themeId,
          customConfig: existingActiveSub.theme.customConfig,
        },
      });
    }

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

    // 4. Jika downgrade ke Basic (limit 1 outlet), pastikan hanya 1 outlet utama yang aktif
    if (isBasicTier && targetTier.outletLimit === 1) {
      const outlets = await tx.outlet.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "asc" },
      });

      if (outlets.length > 1) {
        // Biarkan outlet pertama aktif, nonaktifkan outlet kedua dst
        const extraOutletIds = outlets.slice(1).map((o: any) => o.id);
        await tx.outlet.updateMany({
          where: { id: { in: extraOutletIds } },
          data: { isActive: false },
        });
      }
    }

    // 4b. Jika downgrade dan kasir aktif melebihi limit baru, nonaktifkan kasir berlebih
    if (targetTier.kasirLimitPerOutlet !== null) {
      const activeCashiers = await tx.user.findMany({
        where: {
          tenantId: user.tenantId,
          role: "KASIR",
          isActive: true,
          hasPosAccess: true,
        },
        orderBy: { createdAt: "asc" },
      });

      if (activeCashiers.length > targetTier.kasirLimitPerOutlet) {
        const excessIds = activeCashiers.slice(targetTier.kasirLimitPerOutlet).map((c: any) => c.id);
        await tx.user.updateMany({
          where: { id: { in: excessIds } },
          data: { isActive: false },
        });
      }
    }

    // 5. Ubah status Tenant menjadi ACTIVE
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
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/store");
  revalidatePath("/pos");
  revalidatePath("/admin/tenants");
  revalidatePath("/admin");

  return { success: true };
}

