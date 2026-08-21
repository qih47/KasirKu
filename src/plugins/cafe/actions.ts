"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { TableStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireTenantCafeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "cafe");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Cafe & F&B belum diaktifkan pada langganan Bisnis Anda."
    );
  }

  return user;
}

export async function getCafeTablesData(explicitOutletId?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    return {
      tables: [],
      availableCount: 0,
      occupiedCount: 0,
      reservedCount: 0,
      currentOutletId: "",
      tenantId: "",
      businessName: "Cafe & Resto",
      logoUrl: null,
      outletName: "Outlet Utama",
      outlets: [],
      userRole: "KASIR",
    };
  }

  const user = session.user as any;

  // Ambil semua outlet aktif untuk tenant ini
  const allOutlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, address: true },
  });

  // Tentukan target outlet:
  let targetOutletId = explicitOutletId;
  if (!targetOutletId || !allOutlets.some((o) => o.id === targetOutletId)) {
    if (user.outletId && allOutlets.some((o) => o.id === user.outletId)) {
      targetOutletId = user.outletId;
    } else {
      targetOutletId = allOutlets[0]?.id;
    }
  }

  if (!targetOutletId) throw new Error("Outlet tidak ditemukan.");

  // Ambil atau inisialisasi default 8 meja jika belum ada
  let tables = await prisma.cafeTable.findMany({
    where: { outletId: targetOutletId },
    orderBy: { tableNumber: "asc" },
  });

  if (tables.length === 0) {
    const defaultTables = [
      { tableNumber: "Meja 01", capacity: 2 },
      { tableNumber: "Meja 02", capacity: 4 },
      { tableNumber: "Meja 03", capacity: 4 },
      { tableNumber: "Meja 04", capacity: 6 },
      { tableNumber: "Meja 05 (VIP)", capacity: 8 },
      { tableNumber: "Outdoor 01", capacity: 4 },
      { tableNumber: "Outdoor 02", capacity: 4 },
    ];

    for (const t of defaultTables) {
      await prisma.cafeTable.create({
        data: {
          tenantId: user.tenantId,
          outletId: targetOutletId,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          status: "AVAILABLE",
        },
      });
    }

    tables = await prisma.cafeTable.findMany({
      where: { outletId: targetOutletId },
      orderBy: { tableNumber: "asc" },
    });
  }

  const [tenant, currentOutlet] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, businessName: true, logoUrl: true },
    }),
    prisma.outlet.findUnique({
      where: { id: targetOutletId },
      select: { id: true, name: true, address: true },
    }),
  ]);

  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;

  return {
    tables,
    availableCount,
    occupiedCount,
    reservedCount,
    currentOutletId: targetOutletId,
    tenantId: user.tenantId,
    businessName: tenant?.businessName || "Cafe & Resto",
    logoUrl: tenant?.logoUrl || null,
    outletName: currentOutlet?.name || "Outlet Utama",
    outletAddress: currentOutlet?.address || null,
    outlets: allOutlets,
    userRole: user.role,
  };
}

export async function createCafeTableAction(data: {
  outletId: string;
  tableNumber: string;
  capacity?: number;
}) {
  const user = await requireTenantCafeUser();
  const { outletId, tableNumber, capacity = 4 } = data;

  if (!tableNumber) throw new Error("Nomor/Nama meja wajib diisi.");

  const table = await prisma.cafeTable.create({
    data: {
      tenantId: user.tenantId,
      outletId,
      tableNumber: tableNumber.trim(),
      capacity,
      status: "AVAILABLE",
    },
  });

  revalidatePath("/dashboard/cafe/tables");
  return { success: true, table };
}

export async function updateCafeTableAction(data: {
  tableId: string;
  tableNumber: string;
  capacity?: number;
  areaZone?: string;
}) {
  const user = await requireTenantCafeUser();
  const { tableId, tableNumber, capacity = 4, areaZone = "INDOOR" } = data;

  if (!tableNumber.trim()) throw new Error("Nomor/Nama meja wajib diisi.");

  const table = await prisma.cafeTable.findUnique({
    where: { id: tableId },
  });

  if (!table || table.tenantId !== user.tenantId) {
    throw new Error("Meja tidak ditemukan.");
  }

  const updated = await prisma.cafeTable.update({
    where: { id: tableId },
    data: {
      tableNumber: tableNumber.trim(),
      capacity: Number(capacity) || 4,
      areaZone: areaZone || "INDOOR",
    },
  });

  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/pos");
  return { success: true, table: updated };
}

export async function deleteCafeTableAction(tableId: string) {
  const user = await requireTenantCafeUser();

  const table = await prisma.cafeTable.findUnique({
    where: { id: tableId },
  });

  if (!table || table.tenantId !== user.tenantId) {
    throw new Error("Meja tidak ditemukan.");
  }

  if (table.status === "OCCUPIED") {
    throw new Error("Meja sedang digunakan (Occupied / Ada Tamu). Harap selesaikan billing sebelum menghapus meja.");
  }

  await prisma.cafeTable.delete({
    where: { id: tableId },
  });

  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/pos");
  return { success: true };
}

export async function updateTableStatusAction(data: {
  tableId: string;
  status: TableStatus;
  guestName?: string;
  notes?: string;
}) {
  const user = await requireTenantCafeUser();
  const { tableId, status, guestName, notes } = data;

  const table = await prisma.cafeTable.findUnique({
    where: { id: tableId },
  });

  if (!table || table.tenantId !== user.tenantId) {
    throw new Error("Meja tidak ditemukan.");
  }

  const updated = await prisma.cafeTable.update({
    where: { id: tableId },
    data: {
      status,
      currentGuestName: status === "AVAILABLE" ? null : guestName || table.currentGuestName,
      currentOrderNotes: status === "AVAILABLE" ? null : notes || table.currentOrderNotes,
    },
  });

  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/pos");
  return { success: true, table: updated };
}

export async function transferTableAction(data: {
  sourceTableId: string;
  targetTableId: string;
}) {
  const user = await requireTenantCafeUser();
  const { sourceTableId, targetTableId } = data;

  if (sourceTableId === targetTableId) {
    throw new Error("Meja asal dan meja tujuan tidak boleh sama.");
  }

  const [sourceTable, targetTable] = await Promise.all([
    prisma.cafeTable.findUnique({ where: { id: sourceTableId } }),
    prisma.cafeTable.findUnique({ where: { id: targetTableId } }),
  ]);

  if (!sourceTable || sourceTable.tenantId !== user.tenantId) {
    throw new Error("Meja asal tidak ditemukan.");
  }
  if (!targetTable || targetTable.tenantId !== user.tenantId) {
    throw new Error("Meja tujuan tidak ditemukan.");
  }

  if (targetTable.status === "OCCUPIED") {
    throw new Error(`Meja tujuan (${targetTable.tableNumber}) sedang terisi. Pilih meja yang kosong.`);
  }

  // Atomic swap in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Move guest info to target table and set to OCCUPIED
    await tx.cafeTable.update({
      where: { id: targetTableId },
      data: {
        status: "OCCUPIED",
        currentGuestName: sourceTable.currentGuestName,
        currentOrderNotes: sourceTable.currentOrderNotes,
      },
    });

    // 2. Clear source table and set to AVAILABLE
    await tx.cafeTable.update({
      where: { id: sourceTableId },
      data: {
        status: "AVAILABLE",
        currentGuestName: null,
        currentOrderNotes: null,
      },
    });

    // 3. If there are active LiveOrders on the source table, update their tableNumber
    if (sourceTable.outletId) {
      await tx.liveOrder.updateMany({
        where: {
          outletId: sourceTable.outletId,
          tableNumber: sourceTable.tableNumber,
          status: { in: ["PENDING", "PREPARING", "READY"] },
        },
        data: {
          tableNumber: targetTable.tableNumber,
        },
      });
    }
  });

  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/pos");
  return { success: true };
}

export async function saveTableOpenBillAction(data: {
  tableId: string;
  guestName?: string;
  cart: any[];
  customer?: any;
  subtotal: number;
  discountType?: string;
  discountValue?: number;
  appliedVoucherCode?: string;
}) {
  const user = await requireTenantCafeUser();
  const { tableId, guestName, cart, customer, subtotal, discountType, discountValue, appliedVoucherCode } = data;

  const table = await prisma.cafeTable.findUnique({
    where: { id: tableId },
  });

  if (!table || table.tenantId !== user.tenantId) {
    throw new Error("Meja tidak ditemukan.");
  }

  const orderPayload = JSON.stringify({
    cart,
    customer: customer || null,
    subtotal,
    discountType: discountType || null,
    discountValue: discountValue || 0,
    appliedVoucherCode: appliedVoucherCode || null,
    savedAt: new Date().toISOString(),
  });

  const updated = await prisma.cafeTable.update({
    where: { id: tableId },
    data: {
      status: "OCCUPIED",
      currentGuestName: guestName || table.currentGuestName || "Tamu Meja",
      currentOrderNotes: orderPayload,
    },
  });

  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/pos");
  return { success: true, table: updated };
}

export async function clearTableOpenBillAction(tableId: string) {
  const user = await requireTenantCafeUser();
  const table = await prisma.cafeTable.findUnique({
    where: { id: tableId },
  });

  if (!table || table.tenantId !== user.tenantId) {
    throw new Error("Meja tidak ditemukan.");
  }

  const updated = await prisma.cafeTable.update({
    where: { id: tableId },
    data: {
      status: "AVAILABLE",
      currentGuestName: null,
      currentOrderNotes: null,
    },
  });

  revalidatePath("/dashboard/cafe/tables");
  revalidatePath("/pos");
  return { success: true, table: updated };
}
