"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { revalidatePath } from "next/cache";

async function requireTenantCafeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login sebagai akun bisnis.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "cafe");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Cafe & Resto belum aktif pada paket langganan Anda."
    );
  }

  return user;
}

export async function getCafeServiceChargePoolData(params?: {
  daysBack?: number;
}) {
  const user = await requireTenantCafeUser();
  const daysBack = params?.daysBack || 30;

  const toDate = endOfDay(new Date());
  const fromDate = startOfDay(subDays(new Date(), daysBack));

  // Ambil transaksi F&B pada periode terkait
  const [transactions, staffList, tenant] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        outlet: { tenantId: user.tenantId },
        status: "PAID",
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: { product: true },
        },
        shift: {
          include: { kasir: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
    }),
  ]);

  const tenantAttrs: Record<string, any> = ((tenant as any)?.attributes as any) || {};
  const serviceChargePercent = Number(tenantAttrs.serviceChargePercent || 5);

  const totalOmzet = (transactions as any[]).reduce((sum: number, t: any) => sum + Number(t.totalAmount || 0), 0);
  const totalServiceChargeCollected = Math.round((totalOmzet * serviceChargePercent) / 100);

  // Bagi rata service charge ke seluruh staf aktif
  const staffCount = staffList.length || 1;
  const estimatedPoolPerStaff = Math.round(totalServiceChargeCollected / staffCount);

  return {
    totalOmzet,
    serviceChargePercent,
    totalServiceChargeCollected,
    staffCount,
    estimatedPoolPerStaff,
    staffList,
    totalTransactions: transactions.length,
    dateRange: {
      from: format(fromDate, "dd MMM yyyy"),
      to: format(toDate, "dd MMM yyyy"),
    },
  };
}

export async function updateCafeServiceChargeConfigAction(data: {
  serviceChargePercent: number;
  poolDistributionMethod?: string;
}) {
  const user = await requireTenantCafeUser();
  const { serviceChargePercent, poolDistributionMethod } = data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const currentAttrs: Record<string, any> = ((tenant as any).attributes as any) || {};

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      attributes: {
        ...currentAttrs,
        serviceChargePercent: Number(serviceChargePercent),
        poolDistributionMethod: poolDistributionMethod || "EQUAL_SPLIT",
      },
    } as any,
  });

  revalidatePath("/dashboard/cafe/commissions");
  return { success: true };
}
