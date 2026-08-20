"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola cabang outlet.");
  }
  return session.user as any;
}

export async function getOutletsData() {
  const user = await requireOwner();

  const [tenant, activeSub] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: {
          orderBy: { createdAt: "asc" },
          include: {
            _count: {
              select: {
                users: true,
                transactions: true,
                products: true,
              },
            },
          },
        },
      },
    }),
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      include: { licenseTier: true },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const currentTier = activeSub?.licenseTier;
  const outletLimit = currentTier?.outletLimit ?? 1;
  const currentCount = tenant.outlets.length;
  const canAddOutlet = outletLimit === null || currentCount < outletLimit;

  return {
    outlets: tenant.outlets,
    currentCount,
    outletLimit,
    canAddOutlet,
    tierName: currentTier?.name || "Lisensi Basic",
  };
}

export async function createOutletAction(data: {
  name: string;
  address?: string;
}) {
  const user = await requireOwner();
  const { name, address } = data;

  if (!name.trim()) {
    throw new Error("Nama cabang outlet wajib diisi.");
  }

  // 1. Cek kuota limit outlet pada lisensi aktif
  const activeSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: user.tenantId, isActive: true },
    include: { licenseTier: true },
  });

  const outletLimit = activeSub?.licenseTier?.outletLimit ?? 1;

  if (outletLimit !== null) {
    const existingCount = await prisma.outlet.count({
      where: { tenantId: user.tenantId },
    });

    if (existingCount >= outletLimit) {
      throw new Error(
        `Batas kuota outlet tercapai (${existingCount}/${outletLimit} cabang). Silakan upgrade ke Lisensi Pro/Enterprise untuk menambah cabang.`
      );
    }
  }

  const newOutlet = await prisma.outlet.create({
    data: {
      tenantId: user.tenantId,
      name: name.trim(),
      address: address?.trim() || null,
      isActive: true,
    },
  });

  // Otomatis buatkan record OutletStock untuk semua produk existing di outlet baru ini
  const existingProducts = await prisma.product.findMany({
    where: { tenantId: user.tenantId },
  });

  for (const prod of existingProducts) {
    await prisma.outletStock.create({
      data: {
        outletId: newOutlet.id,
        productId: prod.id,
        stockQty: prod.stockQty ?? 0,
        isAvailable: prod.isActive,
        priceOverride: null,
      },
    });
  }

  revalidatePath("/dashboard/outlets");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { success: true, outlet: newOutlet };
}

export async function updateOutletAction(data: {
  outletId: string;
  name: string;
  address?: string;
}) {
  const user = await requireOwner();
  const { outletId, name, address } = data;

  if (!name.trim()) throw new Error("Nama cabang outlet wajib diisi.");

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
  });

  if (!outlet || outlet.tenantId !== user.tenantId) {
    throw new Error("Outlet tidak ditemukan.");
  }

  const updated = await prisma.outlet.update({
    where: { id: outletId },
    data: {
      name: name.trim(),
      address: address?.trim() || null,
    },
  });

  revalidatePath("/dashboard/outlets");
  revalidatePath("/dashboard/settings");
  return { success: true, outlet: updated };
}

export async function updateOutletOperatingHoursAction(data: {
  outletId: string;
  operatingHours: any;
}) {
  const user = await requireOwner();
  const { outletId, operatingHours } = data;

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
  });

  if (!outlet || outlet.tenantId !== user.tenantId) {
    throw new Error("Outlet tidak ditemukan.");
  }

  const updated = await prisma.outlet.update({
    where: { id: outletId },
    data: {
      operatingHours,
    },
  });

  revalidatePath("/dashboard/outlets");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
  return { success: true, outlet: updated };
}

export async function toggleOutletStatusAction(outletId: string) {
  const user = await requireOwner();

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
  });

  if (!outlet || outlet.tenantId !== user.tenantId) {
    throw new Error("Outlet tidak ditemukan.");
  }

  const updated = await prisma.outlet.update({
    where: { id: outletId },
    data: { isActive: !outlet.isActive },
  });

  revalidatePath("/dashboard/outlets");
  return { success: true, outlet: updated };
}
