"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwnerOrAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko.");
  }
  const user = session.user as any;
  if (user.role !== "OWNER" && user.role !== "ADMIN_OUTLET") {
    throw new Error("Akses ditolak: Hanya Owner atau Admin yang dapat mengelola kasbon.");
  }
  return user;
}

export interface StaffAdvanceItem {
  id: string;
  staffId: string;
  staffName: string;
  staffPosition: string;
  outletName: string;
  outletId?: string | null;
  amount: number;
  remainingAmount: number;
  installmentMonthly: number | null;
  note?: string | null;
  status: "PENDING" | "ACTIVE" | "PAID_OFF" | "REJECTED";
  approvedAt?: string | null;
  paidOffAt?: string | null;
  createdAt: string;
}

export async function getStaffAdvancesData(params?: {
  staffId?: string;
  status?: string;
  outletId?: string;
}) {
  const user = await requireOwnerOrAdmin();

  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (params?.staffId && params.staffId !== "ALL") {
    whereClause.staffId = params.staffId;
  }
  if (params?.status && params.status !== "ALL") {
    whereClause.status = params.status;
  }
  if (params?.outletId && params.outletId !== "ALL") {
    whereClause.outletId = params.outletId;
  }

  const [advances, staffList, outlets] = await Promise.all([
    prisma.staffAdvance.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            position: true,
            outlet: { select: { id: true, name: true } },
          },
        },
        outlet: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        position: true,
        outletId: true,
        outlet: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.outlet.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const formattedAdvances: StaffAdvanceItem[] = advances.map((a) => ({
    id: a.id,
    staffId: a.staffId,
    staffName: a.staff?.name || "Karyawan",
    staffPosition: a.staff?.position || "Staf",
    outletName: a.outlet?.name || a.staff?.outlet?.name || "Semua Cabang",
    outletId: a.outletId || a.staff?.outlet?.id || null,
    amount: Number(a.amount),
    remainingAmount: Number(a.remainingAmount),
    installmentMonthly: a.installmentMonthly ? Number(a.installmentMonthly) : null,
    note: a.note,
    status: a.status as any,
    approvedAt: a.approvedAt ? a.approvedAt.toISOString() : null,
    paidOffAt: a.paidOffAt ? a.paidOffAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  const totalActiveAdvance = formattedAdvances
    .filter((a) => a.status === "ACTIVE")
    .reduce((sum, a) => sum + a.remainingAmount, 0);

  const totalPaidOffAdvance = formattedAdvances
    .filter((a) => a.status === "PAID_OFF")
    .reduce((sum, a) => sum + a.amount, 0);

  const activeStaffCount = new Set(
    formattedAdvances.filter((a) => a.status === "ACTIVE").map((a) => a.staffId)
  ).size;

  return {
    advances: JSON.parse(JSON.stringify(formattedAdvances)),
    staffList: JSON.parse(JSON.stringify(staffList)),
    outlets: JSON.parse(JSON.stringify(outlets)),
    metrics: {
      totalActiveAdvance,
      totalPaidOffAdvance,
      activeStaffCount,
      totalTransactionsCount: formattedAdvances.length,
    },
  };
}

export async function createStaffAdvanceAction(data: {
  staffId: string;
  amount: number;
  installmentMonthly?: number | null;
  note?: string;
  outletId?: string | null;
}) {
  const user = await requireOwnerOrAdmin();
  const { staffId, amount, installmentMonthly, note, outletId } = data;

  if (!staffId || !amount || amount <= 0) {
    throw new Error("Pilih karyawan dan masukkan nominal kasbon yang valid.");
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff || staff.tenantId !== user.tenantId) {
    throw new Error("Karyawan tidak ditemukan.");
  }

  const advance = await prisma.staffAdvance.create({
    data: {
      tenantId: user.tenantId,
      staffId,
      outletId: outletId || staff.outletId || null,
      amount,
      remainingAmount: amount,
      installmentMonthly: installmentMonthly && installmentMonthly > 0 ? installmentMonthly : null,
      note: note?.trim() || "Pinjaman kasbon karyawan",
      status: "ACTIVE",
      approvedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/payroll");
  return { success: true, advance: JSON.parse(JSON.stringify(advance)) };
}

export async function recordManualAdvancePaymentAction(data: {
  advanceId: string;
  paymentAmount: number;
  note?: string;
}) {
  const user = await requireOwnerOrAdmin();
  const { advanceId, paymentAmount } = data;

  const advance = await prisma.staffAdvance.findUnique({
    where: { id: advanceId },
  });

  if (!advance || advance.tenantId !== user.tenantId) {
    throw new Error("Data kasbon tidak ditemukan.");
  }

  const currentRemaining = Number(advance.remainingAmount);
  if (currentRemaining <= 0) {
    throw new Error("Kasbon ini sudah lunas.");
  }

  const pay = Math.min(currentRemaining, Math.max(0, paymentAmount));
  const newRemaining = Math.max(0, currentRemaining - pay);
  const isPaidOff = newRemaining <= 0;

  const updated = await prisma.staffAdvance.update({
    where: { id: advanceId },
    data: {
      remainingAmount: newRemaining,
      status: isPaidOff ? "PAID_OFF" : "ACTIVE",
      paidOffAt: isPaidOff ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/payroll");
  return {
    success: true,
    paidAmount: pay,
    remainingAmount: newRemaining,
    isPaidOff,
    advance: JSON.parse(JSON.stringify(updated)),
  };
}

export async function deleteStaffAdvanceAction(advanceId: string) {
  const user = await requireOwnerOrAdmin();

  const advance = await prisma.staffAdvance.findUnique({
    where: { id: advanceId },
  });

  if (!advance || advance.tenantId !== user.tenantId) {
    throw new Error("Data kasbon tidak ditemukan.");
  }

  await prisma.staffAdvance.delete({
    where: { id: advanceId },
  });

  revalidatePath("/dashboard/payroll");
  return { success: true };
}
