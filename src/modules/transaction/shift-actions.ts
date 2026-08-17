"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireCashierOrOwner() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko/kasir.");
  }
  return session.user as any;
}

export async function getCurrentShiftData(explicitOutletId?: string) {
  const user = await requireCashierOrOwner();
  const outletId = explicitOutletId || user.outletId;

  // Jika user adalah Owner tanpa outletId spesifik, ambil outlet pertama
  let targetOutletId = outletId;
  if (!targetOutletId) {
    const firstOutlet = await prisma.outlet.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
    });
    targetOutletId = firstOutlet?.id;
  }

  if (!targetOutletId) {
    throw new Error("Outlet tidak ditemukan pada akun toko Anda.");
  }

  // Cari shift yang sedang aktif (closedAt === null)
  const activeShift = await prisma.shift.findFirst({
    where: {
      outletId: targetOutletId,
      closedAt: null,
    },
    include: {
      kasir: true,
      outlet: true,
      cashMovements: {
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        where: { status: "PAID" },
        include: {
          items: { include: { product: true } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const outlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId, isActive: true },
  });

  return {
    activeShift,
    outlets,
    currentOutletId: targetOutletId,
    currentUser: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  };
}

export async function openShiftAction(data: {
  outletId: string;
  openingCash: number;
}) {
  const user = await requireCashierOrOwner();
  const { outletId, openingCash } = data;

  if (openingCash === undefined || openingCash < 0) {
    throw new Error("Modal kas awal harus diisi dengan angka valid (>= 0).");
  }

  // Cek apakah ada shift yang masih aktif di outlet ini
  const existingActive = await prisma.shift.findFirst({
    where: {
      outletId,
      closedAt: null,
    },
  });

  if (existingActive) {
    throw new Error("Masih ada shift kasir yang aktif di outlet ini. Harap tutup shift sebelumnya terlebih dahulu.");
  }

  const newShift = await prisma.shift.create({
    data: {
      outletId,
      kasirId: user.id,
      openingCash,
      openedAt: new Date(),
    },
    include: {
      kasir: true,
      outlet: true,
    },
  });

  revalidatePath("/pos");
  return { success: true, shift: newShift };
}

export async function addCashMovementAction(data: {
  shiftId: string;
  type: "IN" | "OUT";
  amount: number;
  note?: string;
}) {
  const user = await requireCashierOrOwner();
  const { shiftId, type, amount, note } = data;

  if (!amount || amount <= 0) {
    throw new Error("Nominal uang kas harus lebih dari 0.");
  }

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift || shift.closedAt !== null) {
    throw new Error("Shift tidak ditemukan atau sudah ditutup.");
  }

  const movement = await prisma.cashMovement.create({
    data: {
      shiftId,
      type,
      amount,
      note: note?.trim() || (type === "IN" ? "Kas Masuk Tambahan" : "Kas Keluar Operasional"),
    },
  });

  revalidatePath("/pos");
  return { success: true, movement };
}

export async function closeShiftAction(data: {
  shiftId: string;
  closingCash: number;
}) {
  const user = await requireCashierOrOwner();
  const { shiftId, closingCash } = data;

  if (closingCash === undefined || closingCash < 0) {
    throw new Error("Jumlah uang kas fisik di laci kasir wajib diisi.");
  }

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      cashMovements: true,
      transactions: {
        where: { status: "PAID" },
        include: { payments: true },
      },
    },
  });

  if (!shift || shift.closedAt !== null) {
    throw new Error("Shift tidak ditemukan atau sudah pernah ditutup.");
  }

  // Hitung total uang tunai yang seharusnya ada di laci kasir:
  // Modal Awal + Total Penjualan Cash + Kas Masuk - Kas Keluar
  const opening = Number(shift.openingCash);

  let cashSalesTotal = 0;
  shift.transactions.forEach((trx: any) => {
    trx.payments.forEach((p: any) => {
      if (p.method === "CASH" && p.status === "SUCCESS") {
        cashSalesTotal += Number(p.amount);
      }
    });
  });

  let cashIn = 0;
  let cashOut = 0;
  shift.cashMovements.forEach((cm: any) => {
    if (cm.type === "IN") cashIn += Number(cm.amount);
    if (cm.type === "OUT") cashOut += Number(cm.amount);
  });

  const expectedCash = opening + cashSalesTotal + cashIn - cashOut;
  const difference = closingCash - expectedCash;

  const closed = await prisma.shift.update({
    where: { id: shiftId },
    data: {
      closedAt: new Date(),
      closingCash,
    },
  });

  revalidatePath("/pos");
  return {
    success: true,
    summary: {
      shiftId,
      openingCash: opening,
      cashSalesTotal,
      cashIn,
      cashOut,
      expectedCash,
      closingCash,
      difference,
      closedAt: closed.closedAt,
    },
  };
}
