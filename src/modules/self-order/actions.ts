"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LiveOrderStatus, LiveOrderPaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko.");
  }
  return session.user as any;
}

export interface LiveOrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  notes?: string;
  type?: string;
}

export interface LiveOrderSummary {
  id: string;
  orderNumber: string;
  verticalType: "CAFE" | "BARBERSHOP" | "LAUNDRY" | "RETAIL";
  customerName: string;
  customerPhone: string | null;
  customerId: string | null;
  tableNumber: string | null;
  queueNumber: string | null;
  serviceType: string | null;
  fragrance: string | null;
  assignedStaffId: string | null;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID_CASH" | "PAID_ONLINE";
  items: LiveOrderItem[];
  subtotal: number;
  totalAmount: number;
  customerNotes: string | null;
  transactionId: string | null;
  createdAt: string;
}

// 1. Cek apakah tenant berlangganan plugin 'self_order'
export async function hasSelfOrderPlugin(tenantId: string): Promise<boolean> {
  const sub = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      isActive: true,
      plugins: {
        some: {
          plugin: { code: "self_order" },
          isActive: true,
        },
      },
    },
  });

  return !!sub;
}

// 2. Ambil Live Orders aktif untuk POS Kasir
export async function getLiveOrdersAction(params?: {
  outletId?: string;
  status?: string;
}): Promise<LiveOrderSummary[]> {
  const user = await requireAuth();

  const isEnabled = await hasSelfOrderPlugin(user.tenantId);
  if (!isEnabled) {
    return [];
  }

  const targetOutletId = params?.outletId || user.outletId;

  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (targetOutletId) {
    whereClause.outletId = targetOutletId;
  }

  if (params?.status && params.status !== "ALL") {
    whereClause.status = params.status;
  } else {
    // Default: Ambil order yang belum selesai (PENDING, CONFIRMED, PREPARING, READY)
    whereClause.status = {
      in: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
    };
  }

  const rawOrders = await prisma.liveOrder.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rawOrders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    verticalType: o.verticalType as any,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerId: o.customerId,
    tableNumber: o.tableNumber,
    queueNumber: o.queueNumber,
    serviceType: o.serviceType,
    fragrance: o.fragrance,
    assignedStaffId: o.assignedStaffId,
    status: o.status as any,
    paymentStatus: o.paymentStatus as any,
    items: (o.items as any) || [],
    subtotal: Number(o.subtotal || 0),
    totalAmount: Number(o.totalAmount || 0),
    customerNotes: o.customerNotes,
    transactionId: o.transactionId,
    createdAt: o.createdAt.toISOString(),
  }));
}

// 3. Submit Self-Order dari Layar Publik Pelanggan (Scan QR Meja)
export async function submitSelfOrderAction(data: {
  tenantId: string;
  outletId: string;
  verticalType?: "CAFE" | "BARBERSHOP" | "LAUNDRY" | "RETAIL";
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  queueNumber?: string;
  serviceType?: string;
  fragrance?: string;
  assignedStaffId?: string;
  items: LiveOrderItem[];
  customerNotes?: string;
  paymentStatus?: "UNPAID_CASH" | "PAID_ONLINE";
}) {
  const {
    tenantId,
    outletId,
    verticalType = "CAFE",
    customerName,
    customerPhone,
    tableNumber,
    queueNumber,
    serviceType,
    fragrance,
    assignedStaffId,
    items,
    customerNotes,
    paymentStatus = "UNPAID_CASH",
  } = data;

  if (!items || items.length === 0) {
    throw new Error("Keranjang pesanan masih kosong.");
  }

  // Cek apakah tenant berhak atas plugin self_order
  const isEnabled = await hasSelfOrderPlugin(tenantId);
  if (!isEnabled) {
    throw new Error("Layanan Self-Order belum diaktifkan oleh pemilik toko.");
  }

  // Cari atau buat customer secara otomatis jika ada nomor kontak
  let customerId: string | null = null;
  const cleanPhone = customerPhone?.trim() || null;

  if (customerName.trim()) {
    if (cleanPhone) {
      let existingCustomer = await prisma.customer.findUnique({
        where: {
          tenantId_phone: {
            tenantId,
            phone: cleanPhone,
          },
        },
      });

      if (!existingCustomer) {
        existingCustomer = await prisma.customer.create({
          data: {
            tenantId,
            name: customerName.trim(),
            phone: cleanPhone,
          },
        });
      }
      customerId = existingCustomer.id;
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAmount = subtotal;

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${todayStr}-${randomSuffix}`;

  const liveOrder = await prisma.liveOrder.create({
    data: {
      tenantId,
      outletId,
      orderNumber,
      verticalType,
      customerName: customerName.trim() || "Tamu Meja",
      customerPhone: cleanPhone,
      customerId,
      tableNumber: tableNumber || null,
      queueNumber: queueNumber || null,
      serviceType: serviceType || null,
      fragrance: fragrance || null,
      assignedStaffId: assignedStaffId || null,
      status: "PENDING",
      paymentStatus,
      items: items as any,
      subtotal,
      totalAmount,
      customerNotes: customerNotes?.trim() || null,
    },
  });

  revalidatePath("/pos");
  return {
    success: true,
    order: {
      ...liveOrder,
      subtotal: Number(liveOrder.subtotal),
      totalAmount: Number(liveOrder.totalAmount),
      createdAt: liveOrder.createdAt.toISOString(),
    },
  };
}

// 4. Update Status Live Order (Kasir / Dapur mengubah status)
export async function updateLiveOrderStatusAction(
  orderId: string,
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
) {
  const user = await requireAuth();

  const order = await prisma.liveOrder.findFirst({
    where: {
      id: orderId,
      tenantId: user.tenantId,
    },
  });

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  const updated = await prisma.liveOrder.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/pos");
  return { success: true, order: updated };
}

// 5. Kasir Menerima Bayar & Menyelesaikan Live Order Langsung ke Transaksi POS
export async function checkoutLiveOrderAction(data: {
  orderId: string;
  shiftId: string;
  paymentMethod: "CASH" | "QRIS";
  amountPaid: number;
}) {
  const user = await requireAuth();
  const { orderId, shiftId, paymentMethod, amountPaid } = data;

  const order = await prisma.liveOrder.findFirst({
    where: {
      id: orderId,
      tenantId: user.tenantId,
    },
  });

  if (!order) {
    throw new Error("Pesanan tidak ditemukan.");
  }

  const items = (order.items as any[]) || [];
  const totalAmount = Number(order.totalAmount);

  if (amountPaid < totalAmount) {
    throw new Error(`Uang pembayaran kurang dari total tagihan (Rp ${totalAmount.toLocaleString("id-ID")}).`);
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const transactionNumber = `TRX-${todayStr}-${randomSuffix}`;

  // Atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Buat Transaksi POS
    const transaction = await tx.transaction.create({
      data: {
        outletId: order.outletId,
        shiftId,
        customerId: order.customerId || null,
        transactionNumber,
        subtotalAmount: totalAmount,
        discountAmount: 0,
        totalAmount,
        status: "PAID",
      },
    });

    // 2. Buat TransactionItems & kurangi stok
    for (const item of items) {
      if (item.productId) {
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            subtotal: item.price * item.qty,
          },
        });

        // Kurangi stok barang
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.type === "BARANG" && product.stockQty !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: { decrement: item.qty },
            },
          });
        }
      }
    }

    // 3. Catat Pembayaran
    await tx.payment.create({
      data: {
        transactionId: transaction.id,
        method: paymentMethod,
        amount: totalAmount,
        status: "SUCCESS",
      },
    });

    // 4. Update status Customer (LTV) jika ada
    if (order.customerId) {
      await (tx as any).customer.update({
        where: { id: order.customerId },
        data: {
          visits: { increment: 1 },
          totalSpent: { increment: totalAmount },
          lastVisitAt: new Date(),
        },
      });
    }

    // 5. Tandai Live Order sebagai COMPLETED
    await (tx as any).liveOrder.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        transactionId: transaction.id,
      },
    });

    return {
      transaction,
      change: amountPaid - totalAmount,
    };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/dashboard/customers");

  return { success: true, ...result };
}

// 6. Ambil Data Menu Digital & Tenant untuk Halaman Publik Self-Order Pelanggan
export async function getPublicSelfOrderMenuData(tenantId: string, tableQuery?: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      outlets: {
        where: { isActive: true },
        take: 1,
      },
      cafeTables: {
        orderBy: { tableNumber: "asc" },
      },
      products: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      subscriptions: {
        where: { isActive: true },
        include: {
          plugins: {
            where: { isActive: true },
            include: { plugin: true },
          },
          theme: { include: { theme: true } },
        },
        take: 1,
      },
    },
  });

  if (!tenant) {
    return { isFound: false, isEnabled: false };
  }

  const activeSub = tenant.subscriptions?.[0];
  const isSelfOrderActive = activeSub?.plugins?.some(
    (tp) => tp.plugin.code === "self_order"
  ) ?? false;

  const defaultOutlet = tenant.outlets[0] || null;

  const categories = Array.from(
    new Set(tenant.products.map((p) => p.category || "Umum"))
  );

  return {
    isFound: true,
    isEnabled: isSelfOrderActive,
    tenant: {
      id: tenant.id,
      businessName: tenant.businessName,
      logoUrl: tenant.logoUrl,
      outletId: defaultOutlet?.id || null,
      outletName: defaultOutlet?.name || "Outlet Utama",
    },
    tables: tenant.cafeTables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      areaZone: t.areaZone,
      status: t.status,
    })),
    selectedTable: tableQuery || tenant.cafeTables[0]?.tableNumber || "Meja 01",
    products: tenant.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      category: p.category || "Umum",
      type: p.type,
      stockQty: p.stockQty,
      attributes: p.attributes,
    })),
    categories,
  };
}
