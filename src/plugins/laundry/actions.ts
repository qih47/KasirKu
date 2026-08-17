"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { LaundryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { addDays, format, startOfDay } from "date-fns";

async function requireTenantLaundryUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "laundry");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Laundry belum diaktifkan pada langganan toko Anda."
    );
  }

  return user;
}

export async function getLaundryOrdersData(explicitOutletId?: string) {
  const user = await requireTenantLaundryUser();
  const outletId = explicitOutletId || user.outletId;

  let targetOutletId = outletId;
  if (!targetOutletId) {
    const firstOutlet = await prisma.outlet.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
    });
    targetOutletId = firstOutlet?.id;
  }

  if (!targetOutletId) throw new Error("Outlet tidak ditemukan.");

  const [orders, tenant] = await Promise.all([
    prisma.laundryOrder.findMany({
      where: { outletId: targetOutletId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { outlets: true },
    }),
  ]);

  const activeOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  return {
    orders,
    activeOrders,
    completedOrders,
    outlets: tenant?.outlets || [],
    currentOutletId: targetOutletId,
  };
}

export async function createLaundryOrderAction(data: {
  outletId: string;
  customerName: string;
  customerPhone?: string;
  serviceType: "KILOAN" | "SATUAN";
  weightKg?: number;
  unitQty?: number;
  pricePerUnit: number;
  fragrance?: string;
  notes?: string;
  estimatedDays?: number;
}) {
  const user = await requireTenantLaundryUser();
  const {
    outletId,
    customerName,
    customerPhone,
    serviceType,
    weightKg,
    unitQty,
    pricePerUnit,
    fragrance,
    notes,
    estimatedDays = 2,
  } = data;

  if (!customerName) {
    throw new Error("Nama pelanggan wajib diisi.");
  }

  // Hitung total harga
  let totalAmount = 0;
  if (serviceType === "KILOAN") {
    totalAmount = (weightKg || 1) * pricePerUnit;
  } else {
    totalAmount = (unitQty || 1) * pricePerUnit;
  }

  // Generate nomor order unik LND-YYYYMMDD-XXXX
  const todayStr = format(new Date(), "yyyyMMdd");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `LND-${todayStr}-${randomSuffix}`;

  const estimatedCompletedAt = addDays(new Date(), estimatedDays);

  const order = await prisma.laundryOrder.create({
    data: {
      tenantId: user.tenantId,
      outletId,
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || null,
      serviceType,
      weightKg: weightKg ? Number(weightKg) : null,
      unitQty: unitQty || null,
      pricePerUnit,
      totalAmount,
      fragrance: fragrance || "Standard Fresh",
      status: "RECEIVED",
      notes: notes?.trim() || null,
      estimatedCompletedAt,
    },
  });

  revalidatePath("/dashboard/laundry/orders");
  return { success: true, order };
}

export async function updateLaundryStatusAction(
  orderId: string,
  status: LaundryStatus
) {
  const user = await requireTenantLaundryUser();

  const order = await prisma.laundryOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || order.tenantId !== user.tenantId) {
    throw new Error("Order laundry tidak ditemukan.");
  }

  const updateData: any = { status };
  if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const updated = await prisma.laundryOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  revalidatePath("/dashboard/laundry/orders");
  return { success: true, order: updated };
}
