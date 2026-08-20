"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireCashierOrOwner() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis/kasir.");
  }
  return session.user as any;
}

export async function getCurrentShiftData(explicitOutletId?: string) {
  const user = await requireCashierOrOwner();
  const outletId = explicitOutletId || user.outletId;

  // Ambil tenant untuk membaca status langganan dan setting shiftMode ("FAST" | "STRICT")
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { shiftMode: true, businessName: true, status: true, trialEndAt: true },
  });

  if (!tenant) {
    throw new Error("Bisnis tidak ditemukan.");
  }

  if (tenant.status === "LOCKED" || tenant.status === "FROZEN") {
    throw new Error("Akun Bisnis Anda sedang dinonaktifkan/dikunci. Silakan hubungi Super Admin.");
  }

  if (tenant.status === "TRIAL" && tenant.trialEndAt && new Date(tenant.trialEndAt) < new Date()) {
    throw new Error("Masa percobaan (Trial) bisnis Anda telah berakhir. Silakan upgrade paket langganan Anda.");
  }

  const shiftMode = tenant?.shiftMode || "FAST";

  // Jika user adalah Owner tanpa outletId spesifik, ambil outlet pertama
  let targetOutletId = outletId;
  if (!targetOutletId) {
    const firstOutlet = await prisma.outlet.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
    });
    targetOutletId = firstOutlet?.id;
  }

  if (!targetOutletId) {
    throw new Error("Outlet tidak ditemukan pada akun Bisnis Anda.");
  }

  // Cari shift yang sedang aktif (closedAt === null)
  let activeShift = await prisma.shift.findFirst({
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

  // Jika mode FAST (Cepat) dan belum ada shift aktif, buat shift otomatis di background
  if (!activeShift && shiftMode === "FAST") {
    activeShift = await prisma.shift.create({
      data: {
        outletId: targetOutletId,
        kasirId: user.id,
        openingCash: 0,
        openedAt: new Date(),
      },
      include: {
        kasir: true,
        outlet: true,
        cashMovements: true,
        transactions: {
          where: { status: "PAID" },
          include: {
            items: { include: { product: true } },
            payments: true,
          },
        },
      },
    });
  }

  const outlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId, isActive: true },
  });

  return {
    activeShift,
    shiftMode,
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

  // Validasi status langganan tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { status: true, trialEndAt: true },
  });

  if (tenant?.status === "LOCKED" || tenant?.status === "FROZEN") {
    throw new Error("Akun Bisnis Anda sedang dinonaktifkan/dikunci. Silakan hubungi Super Admin.");
  }

  if (tenant?.status === "TRIAL" && tenant?.trialEndAt && new Date(tenant.trialEndAt) < new Date()) {
    throw new Error("Masa percobaan (Trial) bisnis Anda telah berakhir. Silakan upgrade paket langganan Anda.");
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
      cashMovements: true,
      transactions: {
        where: { status: "PAID" },
        include: {
          items: { include: { product: true } },
          payments: true,
        },
      },
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

export async function getLiveShiftSummaryAction(shiftId: string) {
  const user = await requireCashierOrOwner();

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      kasir: true,
      outlet: true,
      cashMovements: {
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        where: { status: "PAID" },
        include: {
          payments: true,
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shift) {
    throw new Error("Shift tidak ditemukan.");
  }

  const opening = Number(shift.openingCash || 0);

  let cashSalesTotal = 0;
  let qrisSalesTotal = 0;
  let transferSalesTotal = 0;
  let cardSalesTotal = 0;
  let grossSalesTotal = 0;

  shift.transactions.forEach((trx: any) => {
    grossSalesTotal += Number(trx.totalAmount || 0);
    trx.payments.forEach((p: any) => {
      const amt = Number(p.amount || 0);
      if (p.method === "CASH") cashSalesTotal += amt;
      else if (p.method === "QRIS") qrisSalesTotal += amt;
      else if (p.method === "TRANSFER") transferSalesTotal += amt;
      else if (p.method === "CARD") cardSalesTotal += amt;
    });
  });

  let cashIn = 0;
  let cashOut = 0;
  shift.cashMovements.forEach((cm: any) => {
    if (cm.type === "IN") cashIn += Number(cm.amount);
    if (cm.type === "OUT") cashOut += Number(cm.amount);
  });

  const expectedCash = opening + cashSalesTotal + cashIn - cashOut;

  // Hitung produk terlaris di shift ini
  const itemQtyMap: Record<string, { name: string; qty: number; subtotal: number }> = {};
  shift.transactions.forEach((trx: any) => {
    trx.items.forEach((item: any) => {
      const pName = item.product?.name || "Produk";
      if (!itemQtyMap[pName]) {
        itemQtyMap[pName] = { name: pName, qty: 0, subtotal: 0 };
      }
      itemQtyMap[pName].qty += item.qty;
      itemQtyMap[pName].subtotal += Number(item.subtotal || 0);
    });
  });

  const topProducts = Object.values(itemQtyMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  return JSON.parse(
    JSON.stringify({
      shiftId: shift.id,
      cashierName: shift.kasir?.name || "Kasir",
      outletName: shift.outlet?.name || "Outlet",
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openingCash: opening,
      totalTransactions: shift.transactions.length,
      grossSalesTotal,
      cashSalesTotal,
      qrisSalesTotal,
      transferSalesTotal,
      cardSalesTotal,
      nonCashTotal: qrisSalesTotal + transferSalesTotal + cardSalesTotal,
      cashIn,
      cashOut,
      expectedCash,
      topProducts,
      recentTransactions: shift.transactions.map((t: any) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        totalAmount: Number(t.totalAmount),
        paymentMethod: t.payments[0]?.method || "CASH",
        createdAt: t.createdAt,
        itemsCount: t.items.reduce((s: number, i: any) => s + i.qty, 0),
        itemsSummary: t.items.map((i: any) => `${i.product?.name || "Item"} (${i.qty})`).join(", "),
      })),
      cashMovements: shift.cashMovements.map((cm: any) => ({
        id: cm.id,
        type: cm.type,
        amount: Number(cm.amount),
        note: cm.note,
        createdAt: cm.createdAt,
      })),
    })
  );
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
      kasir: true,
      outlet: true,
      cashMovements: true,
      transactions: {
        where: { status: "PAID" },
        include: { payments: true, items: { include: { product: true } } },
      },
    },
  });

  if (!shift || shift.closedAt !== null) {
    throw new Error("Shift tidak ditemukan atau sudah pernah ditutup.");
  }

  const opening = Number(shift.openingCash || 0);

  let cashSalesTotal = 0;
  let qrisSalesTotal = 0;
  let transferSalesTotal = 0;
  let cardSalesTotal = 0;
  let grossSalesTotal = 0;

  shift.transactions.forEach((trx: any) => {
    grossSalesTotal += Number(trx.totalAmount || 0);
    trx.payments.forEach((p: any) => {
      const amt = Number(p.amount || 0);
      if (p.method === "CASH") cashSalesTotal += amt;
      else if (p.method === "QRIS") qrisSalesTotal += amt;
      else if (p.method === "TRANSFER") transferSalesTotal += amt;
      else if (p.method === "CARD") cardSalesTotal += amt;
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
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  return {
    success: true,
    summary: {
      shiftId,
      cashierName: shift.kasir?.name || "Kasir",
      outletName: shift.outlet?.name || "Outlet",
      openedAt: shift.openedAt,
      closedAt: closed.closedAt,
      openingCash: opening,
      totalTransactions: shift.transactions.length,
      grossSalesTotal,
      cashSalesTotal,
      qrisSalesTotal,
      transferSalesTotal,
      cardSalesTotal,
      nonCashTotal: qrisSalesTotal + transferSalesTotal + cardSalesTotal,
      cashIn,
      cashOut,
      expectedCash,
      closingCash,
      difference,
    },
  };
}
