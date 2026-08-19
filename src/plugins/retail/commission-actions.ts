"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { revalidatePath } from "next/cache";

async function requireTenantRetailUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login sebagai akun bisnis.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "retail");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Retail & Mart belum aktif pada paket langganan Anda."
    );
  }

  return user;
}

export async function getRetailIncentivesData(params?: {
  daysBack?: number;
}) {
  const user = await requireTenantRetailUser();
  const daysBack = params?.daysBack || 30;

  const toDate = endOfDay(new Date());
  const fromDate = startOfDay(subDays(new Date(), daysBack));

  const [commissions, staffList, highMarginProducts] = await Promise.all([
    prisma.staffCommission.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        staff: true,
        transactionItem: {
          include: { product: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        tenantId: user.tenantId,
        type: "BARANG",
        isActive: true,
      },
      take: 20,
    }),
  ]);

  const totalIncentivesPaid = commissions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  return {
    commissions,
    staffList,
    highMarginProducts,
    totalIncentivesPaid,
    totalCommissionedItemsSold: commissions.length,
    dateRange: {
      from: format(fromDate, "dd MMM yyyy"),
      to: format(toDate, "dd MMM yyyy"),
    },
  };
}

export async function updateProductIncentiveAction(data: {
  productId: string;
  incentiveAmount: number;
}) {
  const user = await requireTenantRetailUser();
  const { productId, incentiveAmount } = data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  const currentAttrs: Record<string, any> = (product.attributes as any) || {};

  await prisma.product.update({
    where: { id: productId },
    data: {
      attributes: {
        ...currentAttrs,
        productIncentiveAmount: Number(incentiveAmount),
      },
    },
  });

  revalidatePath("/dashboard/retail/commissions");
  return { success: true };
}
