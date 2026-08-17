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
    throw new Error("Akses ditolak: Anda harus login ke akun toko.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "cafe");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Cafe & F&B belum diaktifkan pada langganan toko Anda."
    );
  }

  return user;
}

export async function getCafeTablesData(explicitOutletId?: string) {
  const user = await requireTenantCafeUser();
  const outletId = explicitOutletId || user.outletId;

  let targetOutletId = outletId;
  if (!targetOutletId) {
    const firstOutlet = await prisma.outlet.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
    });
    targetOutletId = firstOutlet?.id;
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

  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;

  return {
    tables,
    availableCount,
    occupiedCount,
    reservedCount,
    currentOutletId: targetOutletId,
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
  return { success: true, table: updated };
}
