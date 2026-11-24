"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
export type LaundryStatus =
  | "RECEIVED"
  | "WASHING"
  | "DRYING"
  | "IRONING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";
import { revalidatePath } from "next/cache";
import { addDays, format, startOfDay } from "date-fns";

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  outletId?: string | null;
}

async function requireTenantLaundryUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as AuthenticatedUser | undefined;
  if (!session || !user?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis.");
  }

  const isPluginActive = await hasTenantPlugin(user.tenantId, "laundry");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Laundry belum diaktifkan pada langganan Bisnis Anda."
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

  const activeOrders = (orders as any[]).filter(
    (o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  );
  const completedOrders = (orders as any[]).filter((o: any) => o.status === "COMPLETED");

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
  const cleanName = customerName.trim();
  const cleanPhone = customerPhone?.trim() || null;

  // Cari atau auto-create Customer di CRM tenant
  let customerId: string | null = null;
  if (cleanPhone) {
    let customer = await prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId: user.tenantId,
          phone: cleanPhone,
        },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: user.tenantId,
          name: cleanName,
          phone: cleanPhone,
        },
      });
    }
    customerId = customer.id;
  }

  const order = await prisma.laundryOrder.create({
    data: {
      tenantId: user.tenantId,
      outletId,
      customerId,
      orderNumber,
      customerName: cleanName,
      customerPhone: cleanPhone,
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
  revalidatePath("/dashboard/customers");
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

    const isPaidFromPos = (order.notes || "").includes("Pembayaran Kasir POS #");

    if (isPaidFromPos) {
      // Jika order dibuat & sudah lunas via Kasir POS, akumulasi LTV sudah tercatat saat transaksi POS dibuat.
      // Tidak perlu increment ulang agar tidak terjadi double-counting.
    } else {
      // Jika order diinput dari Dashboard Laundry dan belum memiliki transaksi POS:
      // Otomatis buatkan transaksi kasir lunas resmi pada shift aktif outlet
      let activeShift = await prisma.shift.findFirst({
        where: { outletId: order.outletId, closedAt: null },
      });

      if (!activeShift) {
        activeShift = await prisma.shift.create({
          data: {
            outletId: order.outletId,
            kasirId: user.id,
            openingCash: 0,
          },
        });
      }

      const todayStr = format(new Date(), "yyyyMMdd");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const transactionNumber = `TRX-${todayStr}-${randomSuffix}`;
      const finalAmount = Number(order.totalAmount || 0);

      const trx = await prisma.transaction.create({
        data: {
          outletId: order.outletId,
          shiftId: activeShift.id,
          customerId: order.customerId || null,
          transactionNumber,
          subtotalAmount: finalAmount,
          discountAmount: 0,
          taxAmount: 0,
          serviceCharge: 0,
          totalAmount: finalAmount,
          status: "PAID",
        },
      });

      await prisma.payment.create({
        data: {
          transactionId: trx.id,
          method: "CASH",
          amount: finalAmount,
          status: "SUCCESS",
        },
      });

      // Hubungkan ke item transaksi (TransactionItem) agar tercatat rapi di laporan penjualan & akuntansi
      let laundryProduct = await prisma.product.findFirst({
        where: {
          tenantId: user.tenantId,
          type: "JASA",
          name: { contains: order.serviceType === "KILOAN" ? "Kiloan" : "Satuan", mode: "insensitive" },
        },
      });

      if (!laundryProduct) {
        laundryProduct = await prisma.product.findFirst({
          where: {
            tenantId: user.tenantId,
            name: { contains: "Laundry", mode: "insensitive" },
          },
        });
      }

      if (!laundryProduct) {
        laundryProduct = await prisma.product.findFirst({
          where: {
            tenantId: user.tenantId,
          },
        });
      }

      if (!laundryProduct) {
        laundryProduct = await prisma.product.create({
          data: {
            tenantId: user.tenantId,
            name: `Jasa Laundry ${order.serviceType === "KILOAN" ? "Kiloan" : "Satuan"}`,
            category: "Laundry",
            price: Number(order.pricePerUnit || finalAmount),
            type: "JASA",
          },
        });
      }

      const itemQty = order.serviceType === "KILOAN" && order.weightKg
        ? Math.max(1, Math.round(Number(order.weightKg)))
        : (order.unitQty || 1);

      await prisma.transactionItem.create({
        data: {
          transactionId: trx.id,
          productId: laundryProduct.id,
          qty: itemQty,
          price: Number(order.pricePerUnit || (itemQty > 0 ? Math.round(finalAmount / itemQty) : finalAmount)),
          subtotal: finalAmount,
        },
      });

      // Update akumulasi LTV Customer & Loyalty Points jika terkait CRM
      if (order.customerId) {
        const pointsEarned = Math.floor(finalAmount / 10000);
        await prisma.customer.update({
          where: { id: order.customerId },
          data: {
            visits: { increment: 1 },
            totalSpent: { increment: finalAmount },
            points: { increment: pointsEarned },
            lastVisitAt: new Date(),
          },
        });
      }

      updateData.notes = (order.notes ? order.notes + " | " : "") + `[Pelunasan Nota: ${transactionNumber}]`;
    }
  }

  const updated = await prisma.laundryOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  revalidatePath("/dashboard/laundry/orders");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
  return { success: true, order: updated };
}
