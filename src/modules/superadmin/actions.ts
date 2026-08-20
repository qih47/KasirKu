"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";

export type TenantStatus = "TRIAL" | "ACTIVE" | "LOCKED" | "FROZEN";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang diizinkan.");
  }
  return session.user as any;
}

export async function getSuperAdminDashboardData() {
  await requireSuperAdmin();

  // Inisialisasi seeder default catalog jika belum ada
  await ensureDefaultCatalogSeeded();

  const now = new Date();

  // 1. Auto-Lock tenant dengan masa Trial yang sudah expired
  await prisma.tenant.updateMany({
    where: {
      status: "TRIAL",
      trialEndAt: { lt: now },
    },
    data: {
      status: "LOCKED",
    },
  });

  const [
    totalTenants,
    trialTenants,
    activeTenants,
    lockedTenants,
    frozenTenants,
    tenants,
    totalActiveVouchers,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "TRIAL" } }),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "LOCKED" } }),
    prisma.tenant.count({ where: { status: "FROZEN" } }),
    prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        users: { where: { role: "OWNER" }, take: 1 },
        subscriptions: {
          where: { isActive: true },
          include: { licenseTier: true, plugins: { include: { plugin: true } } },
        },
      },
    }),
    prisma.voucher.count({ where: { isActive: true } }),
  ]);

  // 2. Hitung estimasi Monthly Recurring Revenue (MRR) & ARR dari tenant ACTIVE
  const activeSubs = await prisma.tenantSubscription.findMany({
    where: { isActive: true, tenant: { status: "ACTIVE" } },
    include: {
      licenseTier: true,
      plugins: { include: { plugin: true } },
    },
  });

  let estimatedMRR = 0;
  for (const sub of activeSubs) {
    const tierMonthly = Number(sub.licenseTier.priceMonthly || 0);
    const pluginsMonthly = sub.plugins.reduce(
      (sum, p) => sum + Number(p.plugin.priceMonthly || 0),
      0
    );
    estimatedMRR += (tierMonthly + pluginsMonthly);
  }

  const estimatedARR = estimatedMRR * 12;

  // 3. Distribusi plugin terpasang
  const plugins = await prisma.plugin.findMany({
    include: {
      _count: {
        select: { tenantPlugins: true },
      },
    },
  });

  return {
    metrics: {
      totalTenants,
      trialTenants,
      activeTenants,
      lockedTenants,
      frozenTenants,
      estimatedMRR,
      estimatedARR,
      totalActiveVouchers,
    },
    recentTenants: tenants,
    pluginsDistribution: plugins,
  };
}

export async function getAllTenants() {
  await requireSuperAdmin();

  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { where: { role: "OWNER" } },
      outlets: true,
      subscriptions: {
        where: { isActive: true },
        include: {
          licenseTier: true,
          plugins: { include: { plugin: true } },
        },
      },
    },
  });
}

export async function extendTenantTrial(tenantId: string, daysToAdd: number) {
  const admin = await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const baseDate =
    tenant.trialEndAt && new Date(tenant.trialEndAt) > new Date()
      ? new Date(tenant.trialEndAt)
      : new Date();

  const newTrialEndAt = addDays(baseDate, daysToAdd);

  const updated = await prisma.$transaction(async (tx: any) => {
    const res = await tx.tenant.update({
      where: { id: tenantId },
      data: {
        trialEndAt: newTrialEndAt,
        status: "TRIAL",
      },
    });

    // Perpanjang periode subscription yang aktif
    await tx.tenantSubscription.updateMany({
      where: { tenantId, isActive: true },
      data: {
        currentPeriodEnd: newTrialEndAt,
      },
    });

    // Catat ke audit log
    await tx.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: "extend_trial",
        targetType: "Tenant",
        targetId: tenantId,
        detail: {
          tenantName: tenant.businessName,
          daysAdded: daysToAdd,
          previousTrialEndAt: tenant.trialEndAt,
          newTrialEndAt,
        },
      },
    });

    return res;
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  return { success: true, newTrialEndAt: updated.trialEndAt };
}

export async function updateTenantStatus(
  tenantId: string,
  newStatus: TenantStatus
) {
  const admin = await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  await prisma.$transaction(async (tx: any) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        status: newStatus,
        lockedAt: newStatus === "LOCKED" ? new Date() : null,
      },
    });

    await tx.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: "update_tenant_status",
        targetType: "Tenant",
        targetId: tenantId,
        detail: {
          tenantName: tenant.businessName,
          previousStatus: tenant.status,
          newStatus,
        },
      },
    });
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  return { success: true };
}

export async function getCatalogPricingData() {
  await requireSuperAdmin();
  await ensureDefaultCatalogSeeded();

  const [licenseTiers, plugins, themes] = await Promise.all([
    prisma.licenseTier.findMany({ orderBy: { priceMonthly: "asc" } }),
    prisma.plugin.findMany({ orderBy: { priceMonthly: "asc" } }),
    prisma.theme.findMany({ orderBy: { priceMonthly: "asc" } }),
  ]);

  return { licenseTiers, plugins, themes };
}

export async function updateLicenseTierAction(
  id: string,
  data: {
    name: string;
    priceMonthly: number;
    priceAnnual: number;
    outletLimit: number | null;
    kasirLimitPerOutlet: number | null;
  }
) {
  const admin = await requireSuperAdmin();

  const tier = await prisma.licenseTier.findUnique({ where: { id } });
  if (!tier) throw new Error("Lisensi tidak ditemukan.");

  await prisma.$transaction(async (tx: any) => {
    await tx.licenseTier.update({
      where: { id },
      data: {
        name: data.name,
        priceMonthly: data.priceMonthly,
        priceAnnual: data.priceAnnual,
        outletLimit: data.outletLimit,
        kasirLimitPerOutlet: data.kasirLimitPerOutlet,
      },
    });

    await tx.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: "update_license_tier_price",
        targetType: "LicenseTier",
        targetId: id,
        detail: {
          code: tier.code,
          oldPrices: { monthly: tier.priceMonthly, annual: tier.priceAnnual },
          newPrices: { monthly: data.priceMonthly, annual: data.priceAnnual },
        },
      },
    });
  });

  revalidatePath("/admin/catalog");
  return { success: true };
}

export async function updatePluginAction(
  id: string,
  data: {
    name: string;
    priceMonthly: number;
    priceAnnual: number;
    isActive: boolean;
  }
) {
  const admin = await requireSuperAdmin();

  const plugin = await prisma.plugin.findUnique({ where: { id } });
  if (!plugin) throw new Error("Plugin tidak ditemukan.");

  await prisma.$transaction(async (tx: any) => {
    await tx.plugin.update({
      where: { id },
      data: {
        name: data.name,
        priceMonthly: data.priceMonthly,
        priceAnnual: data.priceAnnual,
        isActive: data.isActive,
      },
    });

    await tx.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: "update_plugin_pricing",
        targetType: "Plugin",
        targetId: id,
        detail: {
          code: plugin.code,
          oldData: {
            monthly: plugin.priceMonthly,
            annual: plugin.priceAnnual,
            isActive: plugin.isActive,
          },
          newData: data,
        },
      },
    });
  });

  revalidatePath("/admin/catalog");
  return { success: true };
}

export async function updateThemeAction(
  id: string,
  data: {
    name: string;
    priceMonthly: number;
    isActive: boolean;
  }
) {
  const admin = await requireSuperAdmin();

  const theme = await prisma.theme.findUnique({ where: { id } });
  if (!theme) throw new Error("Tema tidak ditemukan.");

  await prisma.$transaction(async (tx: any) => {
    await tx.theme.update({
      where: { id },
      data: {
        name: data.name,
        priceMonthly: data.priceMonthly,
        isActive: data.isActive,
      },
    });

    await tx.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: "update_theme_pricing",
        targetType: "Theme",
        targetId: id,
        detail: {
          code: theme.code,
          oldPrice: theme.priceMonthly,
          newPrice: data.priceMonthly,
        },
      },
    });
  });

  revalidatePath("/admin/catalog");
  return { success: true };
}

export async function getAuditLogsList(params?: { search?: string; limit?: number }) {
  await requireSuperAdmin();

  const take = params?.limit ? Math.min(200, Math.max(10, params.limit)) : 100;
  const where: any = {};

  if (params?.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { targetType: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.auditLog.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      superAdmin: {
        select: { name: true, email: true },
      },
    },
  });
}

// Helper auto-seed jika tabel katalog belum memiliki record awal
async function ensureDefaultCatalogSeeded() {
  const licenseCount = await prisma.licenseTier.count();
  if (licenseCount === 0) {
    await prisma.licenseTier.createMany({
      data: [
        {
          code: "basic",
          name: "Lisensi Basic",
          priceMonthly: 150000,
          priceAnnual: 1494000,
          outletLimit: 1,
          kasirLimitPerOutlet: 5,
        },
        {
          code: "pro",
          name: "Lisensi Pro",
          priceMonthly: 500000,
          priceAnnual: 4980000,
          outletLimit: 10,
          kasirLimitPerOutlet: null,
          hasAdminCabang: true,
          hasConsolidatedReport: true,
        },
        {
          code: "enterprise",
          name: "Lisensi Enterprise",
          priceMonthly: 0,
          priceAnnual: 0,
          outletLimit: null,
          kasirLimitPerOutlet: null,
          hasAdminCabang: true,
          hasConsolidatedReport: true,
          hasApiAccess: true,
        },
      ],
    });
  }

  const pluginCount = await prisma.plugin.count();
  if (pluginCount === 0) {
    await prisma.plugin.createMany({
      data: [
        {
          code: "barbershop",
          name: "Barbershop / Salon",
          description: "Modul booking & antrian pelanggan, komisi per staff/kapster",
          priceMonthly: 50000,
          priceAnnual: 498000,
        },
        {
          code: "cafe",
          name: "Cafe & F&B",
          description: "Modul manajemen meja & split bill, kitchen order ticket (KOT)",
          priceMonthly: 100000,
          priceAnnual: 996000,
        },
        {
          code: "retail",
          name: "Retail & Minimarket",
          description: "Modul barcode/SKU lanjutan, varian produk, dan stok multi-gudang",
          priceMonthly: 60000,
          priceAnnual: 597600,
        },
        {
          code: "laundry",
          name: "Laundry",
          description: "Modul tracking status invoice laundry dan estimasi selesai",
          priceMonthly: 40000,
          priceAnnual: 398400,
        },
      ],
    });
  }

  const themeCount = await prisma.theme.count();
  if (themeCount === 0) {
    await prisma.theme.createMany({
      data: [
        {
          code: "default",
          name: "Default Modern",
          type: "DEFAULT",
          priceMonthly: 0,
        },
        {
          code: "dark-slate",
          name: "Dark Slate Velvet",
          type: "PRESET",
          priceMonthly: 25000,
        },
      ],
    });
  }
}
