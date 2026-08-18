"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReceiptConfig, defaultReceiptConfig } from "@/types/receipt";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Akses ditolak: Sesi tidak ditemukan.");
  }
  const user = session.user as any;
  if (user?.role !== "OWNER" && user?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengakses Receipt Studio.");
  }
  return user;
}

export async function getReceiptDesignerData() {
  const user = await requireOwner();

  let targetTenantId = user.tenantId;
  if (!targetTenantId && user.role === "SUPER_ADMIN") {
    const firstTenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "desc" },
    });
    targetTenantId = firstTenant?.id;
  }

  const [tenant, activeSub, designerPlugin] = await Promise.all([
    targetTenantId
      ? prisma.tenant.findUnique({
          where: { id: targetTenantId },
          include: { outlets: { take: 1 } },
        })
      : null,
    targetTenantId
      ? prisma.tenantSubscription.findFirst({
          where: { tenantId: targetTenantId, isActive: true },
          include: {
            licenseTier: true,
            plugins: {
              where: { isActive: true },
              include: { plugin: true },
            },
          },
        })
      : null,
    prisma.plugin.findUnique({
      where: { code: "receipt_designer" },
    }),
  ]);

  if (!tenant) {
    return {
      tenantId: "super-admin-preview",
      businessName: "Qassa Demo Store",
      logoUrl: null,
      receiptConfig: defaultReceiptConfig,
      hasDesignerPlugin: true,
      isTrial: true,
      isPaidActive: true,
      pluginInfo: {
        name: "Receipt Studio Pro",
        priceMonthly: 19000,
        priceAnnual: 190000,
      },
      primaryOutlet: {
        name: "Cabang Utama",
        address: "Jl. Jenderal Sudirman No. 88, Jakarta Selatan",
      },
    };
  }


  const isTrial = tenant.status === "TRIAL";
  const isPaidActive = tenant.status === "ACTIVE";

  // Check if receipt_designer plugin is active in tenant's subscription
  const hasDesignerPlugin = Boolean(
    isTrial ||
      activeSub?.plugins?.some(
        (tp) => tp.plugin?.code === "receipt_designer" && tp.isActive
      ) ||
      activeSub?.licenseTier?.code === "enterprise"
  );

  const savedConfig = (tenant.receiptConfig as any) || {};
  const currentConfig: ReceiptConfig = {
    ...defaultReceiptConfig,
    ...savedConfig,
    logoUrl: tenant.logoUrl || savedConfig.logoUrl || null,
  };

  return JSON.parse(
    JSON.stringify({
      tenantId: tenant.id,
      businessName: tenant.businessName,
      logoUrl: tenant.logoUrl,
      receiptConfig: currentConfig,
      hasDesignerPlugin,
      isTrial,
      isPaidActive,
      pluginInfo: designerPlugin || {
        name: "Premium Receipt Studio",
        priceMonthly: 29000,
        priceAnnual: 290000,
      },
      primaryOutlet: tenant.outlets[0] || null,
    })
  );
}

export async function saveReceiptDesignAction(config: Partial<ReceiptConfig>) {
  const user = await requireOwner();

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const existingConfig = (tenant.receiptConfig as any) || {};
  const updatedConfig: ReceiptConfig = {
    ...defaultReceiptConfig,
    ...existingConfig,
    ...config,
  };

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      receiptConfig: updatedConfig as any,
    },
  });

  revalidatePath("/dashboard/receipt-designer");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pos");

  return { success: true };
}
