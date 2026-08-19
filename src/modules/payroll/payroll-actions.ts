"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola penggajian & payroll.");
  }
  return session.user as any;
}

export interface PayrollStaffRecord {
  staffId: string;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  employmentType: string;
  joinDate?: string | null;
  outletName: string;
  outletId?: string | null;
  baseSalary: number;
  salaryType: string;
  workUnits: number;
  isProrated: boolean;
  prorateDays: number;
  prorateNote?: string | null;
  allowanceMeal: number;
  allowanceTransport: number;
  allowanceOther: number;
  overtimeRate: number;
  overtimeHours: number;
  overtimePay: number;
  isCommissionActive: boolean;
  totalFixedAllowances: number;
  totalCommissions: number;
  commissionCount: number;
  customBonus: number;
  deductions: number;
  takeHomePay: number;
  isLocked: boolean;
  lockedAt?: string | null;
  status: "DRAFT" | "LOCKED";
  commissionBreakdown: Array<{
    id: string;
    amount: number;
    rate: number;
    commissionType: string;
    productName: string;
    transactionNumber: string;
    qty: number;
    itemPrice: number;
    subtotal: number;
    createdAt: string;
    formattedDate: string;
  }>;
}

export async function updatePayrollCutoffAction(cutoffDay: number) {
  const user = await requireOwner();
  const day = Math.min(31, Math.max(1, Math.floor(cutoffDay)));

  await (prisma.tenant as any).update({
    where: { id: user.tenantId },
    data: { payrollCutoffDay: day },
  });

  revalidatePath("/dashboard/payroll");
  revalidatePath("/dashboard/store");
  return { success: true, cutoffDay: day };
}

export async function savePayrollSnapshotAction(payload: {
  periodMonth: string;
  cutoffStartDate: string;
  cutoffEndDate: string;
  records: Array<{
    staffId: string;
    salaryType: string;
    baseRate: number;
    workUnits: number;
    baseSalaryEarned: number;
    isProrated: boolean;
    prorateNote?: string | null;
    overtimeHours: number;
    overtimeRate: number;
    overtimePay: number;
    commissionCount: number;
    totalCommissions: number;
    allowanceMeal: number;
    allowanceTransport: number;
    allowanceOther: number;
    customBonus: number;
    deductions: number;
    takeHomePay: number;
  }>;
}) {
  const user = await requireOwner();
  const { periodMonth, cutoffStartDate, cutoffEndDate, records } = payload;

  const start = new Date(cutoffStartDate);
  const end = new Date(cutoffEndDate);

  await prisma.$transaction(
    records.map((r) =>
      (prisma as any).payrollRecord.upsert({
        where: {
          tenantId_staffId_periodMonth: {
            tenantId: user.tenantId,
            staffId: r.staffId,
            periodMonth,
          },
        },
        update: {
          cutoffStartDate: start,
          cutoffEndDate: end,
          salaryType: r.salaryType,
          baseRate: r.baseRate,
          workUnits: r.workUnits,
          baseSalaryEarned: r.baseSalaryEarned,
          isProrated: r.isProrated,
          prorateNote: r.prorateNote,
          overtimeHours: r.overtimeHours,
          overtimeRate: r.overtimeRate,
          overtimePay: r.overtimePay,
          commissionCount: r.commissionCount,
          totalCommissions: r.totalCommissions,
          allowanceMeal: r.allowanceMeal,
          allowanceTransport: r.allowanceTransport,
          allowanceOther: r.allowanceOther,
          customBonus: r.customBonus,
          deductions: r.deductions,
          takeHomePay: r.takeHomePay,
        },
        create: {
          tenantId: user.tenantId,
          staffId: r.staffId,
          periodMonth,
          cutoffStartDate: start,
          cutoffEndDate: end,
          salaryType: r.salaryType,
          baseRate: r.baseRate,
          workUnits: r.workUnits,
          baseSalaryEarned: r.baseSalaryEarned,
          isProrated: r.isProrated,
          prorateNote: r.prorateNote,
          overtimeHours: r.overtimeHours,
          overtimeRate: r.overtimeRate,
          overtimePay: r.overtimePay,
          commissionCount: r.commissionCount,
          totalCommissions: r.totalCommissions,
          allowanceMeal: r.allowanceMeal,
          allowanceTransport: r.allowanceTransport,
          allowanceOther: r.allowanceOther,
          customBonus: r.customBonus,
          deductions: r.deductions,
          takeHomePay: r.takeHomePay,
        },
      })
    )
  );

  revalidatePath("/dashboard/payroll");
  return { success: true };
}

export async function toggleLockPayrollPeriodAction(payload: {
  periodMonth: string;
  isLocked: boolean;
}) {
  const user = await requireOwner();
  const { periodMonth, isLocked } = payload;

  await (prisma as any).payrollRecord.updateMany({
    where: {
      tenantId: user.tenantId,
      periodMonth,
    },
    data: {
      isLocked,
      lockedAt: isLocked ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/payroll");
  return { success: true, isLocked };
}

export async function getPayrollData(params?: {
  month?: string; // Format: "YYYY-MM" (contoh: "2026-08")
  outletId?: string;
}) {
  const user = await requireOwner();

  // Ambil data tenant terlebih dahulu untuk membaca konfigurasi payrollCutoffDay
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    include: {
      outlets: { orderBy: { name: "asc" } },
    },
  });

  const cutoffDay = (tenant as any)?.payrollCutoffDay || 25;

  // Tentukan rentang tanggal periode gaji berdasarkan tanggal cut-off
  const now = new Date();
  const currentMonthStr = params?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [yearStr, monthStr] = currentMonthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  let startDate: Date;
  let endDate: Date;
  let periodLabel = "";

  if (cutoffDay === 1) {
    // Skema 1 s/d Akhir Bulan Kalender
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
    periodLabel = `${startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} (Gajian Akhir Bulan)`;
  } else {
    // Skema Cut-Off Tanggal X (contoh: Tgl 25 bulan lalu s/d Tgl 24 bulan ini)
    startDate = new Date(year, month - 2, cutoffDay, 0, 0, 0, 0);
    endDate = new Date(year, month - 1, cutoffDay - 1, 23, 59, 59, 999);
    periodLabel = `${startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} (Gajian Tgl ${cutoffDay})`;
  }

  const whereStaff: any = { tenantId: user.tenantId, isActive: true };
  if (params?.outletId && params.outletId !== "ALL") {
    whereStaff.outletId = params.outletId;
  }

  const [staffList, commissions, savedSnapshots] = await Promise.all([
    prisma.user.findMany({
      where: whereStaff,
      orderBy: { name: "asc" },
      include: { outlet: true },
    }),
    prisma.staffCommission.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        transactionItem: {
          include: {
            product: true,
            transaction: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    (prisma as any).payrollRecord.findMany({
      where: {
        tenantId: user.tenantId,
        periodMonth: currentMonthStr,
      },
    }),
  ]);

  const isPeriodLocked = savedSnapshots.length > 0 && savedSnapshots.every((s: any) => s.isLocked);

  const records: PayrollStaffRecord[] = staffList.map((staff: any) => {
    const staffCommissions = commissions.filter((c: any) => c.staffId === staff.id);
    const totalCommissions = staffCommissions.reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0
    );

    const saved = savedSnapshots.find((s: any) => s.staffId === staff.id);

    const baseSalaryNum = staff.baseSalary ? Number(staff.baseSalary) : 0;
    const allowanceMealNum = staff.allowanceMeal ? Number(staff.allowanceMeal) : 0;
    const allowanceTransportNum = staff.allowanceTransport ? Number(staff.allowanceTransport) : 0;
    const allowanceOtherNum = staff.allowanceOther ? Number(staff.allowanceOther) : 0;
    const totalFixedAllowances = allowanceMealNum + allowanceTransportNum + allowanceOtherNum;
    const overtimeRateNum = staff.overtimeRate ? Number(staff.overtimeRate) : 0;

    // Deteksi Prorata Tanggal Masuk (Join Date)
    const joinDateObj = staff.joinDate ? new Date(staff.joinDate) : null;
    const isMidPeriodJoiner = Boolean(
      joinDateObj &&
      joinDateObj.getTime() >= startDate.getTime() &&
      joinDateObj.getTime() <= endDate.getTime()
    );

    let defaultWorkUnits = 26;
    let isProrated = false;
    let prorateDays = 26;
    let prorateNote: string | null = null;

    if (isMidPeriodJoiner && joinDateObj) {
      // Hitung sisa hari dari tanggal join s/d end of period
      const diffMs = endDate.getTime() - joinDateObj.getTime();
      const calculatedDays = Math.min(26, Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
      defaultWorkUnits = calculatedDays;
      isProrated = true;
      prorateDays = calculatedDays;
      prorateNote = `Karyawan baru masuk ${joinDateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })} (${calculatedDays}/26 hari)`;
    }

    const workUnits = saved ? saved.workUnits : defaultWorkUnits;
    const overtimeHours = saved ? Number(saved.overtimeHours) : 0;
    const overtimePay = saved ? Number(saved.overtimePay) : overtimeHours * overtimeRateNum;
    const customBonus = saved ? Number(saved.customBonus) : 0;
    const deductions = saved ? Number(saved.deductions) : 0;

    // Kalkulasi Base Salary Earned
    let baseSalaryEarned = baseSalaryNum;
    if (staff.salaryType === "DAILY" || staff.salaryType === "PER_SHIFT") {
      baseSalaryEarned = workUnits * baseSalaryNum;
    } else if (staff.salaryType === "MONTHLY" && isProrated) {
      baseSalaryEarned = Math.round((workUnits / 26) * baseSalaryNum);
    } else if (staff.salaryType === "NONE" || staff.salaryType === "COMMISSION_ONLY") {
      baseSalaryEarned = 0;
    }

    const takeHomePay = Math.max(
      0,
      baseSalaryEarned + totalCommissions + totalFixedAllowances + overtimePay + customBonus - deductions
    );

    return {
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      position: staff.position || "KASIR",
      employmentType: staff.employmentType || "FULL_TIME",
      joinDate: staff.joinDate ? new Date(staff.joinDate).toISOString() : null,
      outletName: staff.outlet?.name || "Semua Cabang (Mobile)",
      outletId: staff.outletId,
      baseSalary: baseSalaryNum,
      salaryType: staff.salaryType || "MONTHLY",
      workUnits,
      isProrated,
      prorateDays,
      prorateNote,
      allowanceMeal: allowanceMealNum,
      allowanceTransport: allowanceTransportNum,
      allowanceOther: allowanceOtherNum,
      overtimeRate: overtimeRateNum,
      overtimeHours,
      overtimePay,
      isCommissionActive: Boolean(staff.isCommissionActive),
      totalFixedAllowances,
      totalCommissions,
      commissionCount: staffCommissions.length,
      customBonus,
      deductions,
      takeHomePay,
      isLocked: saved ? saved.isLocked : false,
      lockedAt: saved?.lockedAt ? saved.lockedAt.toISOString() : null,
      status: saved?.isLocked ? "LOCKED" : "DRAFT",
      commissionBreakdown: staffCommissions.map((c: any) => ({
        id: c.id,
        amount: Number(c.amount),
        rate: Number(c.rate),
        commissionType: c.commissionType,
        productName: c.transactionItem?.product?.name || "Layanan / Produk POS",
        transactionNumber: c.transactionItem?.transaction?.transactionNumber || "-",
        qty: c.transactionItem?.qty || 1,
        itemPrice: Number(c.transactionItem?.price || 0),
        subtotal: Number(c.transactionItem?.subtotal || 0),
        createdAt: c.createdAt.toISOString(),
        formattedDate: new Date(c.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    };
  });

  const totalPayrollExpenditure = records.reduce((sum, r) => sum + r.takeHomePay, 0);
  const totalBaseSalarySum = records.reduce((sum, r) => sum + (r.isProrated && r.salaryType === 'MONTHLY' ? Math.round((r.workUnits/26)*r.baseSalary) : (r.salaryType === 'DAILY' || r.salaryType === 'PER_SHIFT' ? r.workUnits * r.baseSalary : r.baseSalary)), 0);
  const totalCommissionsSum = records.reduce((sum, r) => sum + r.totalCommissions, 0);

  return JSON.parse(
    JSON.stringify({
      selectedMonth: currentMonthStr,
      monthLabel: new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      periodLabel,
      payrollCutoffDay: cutoffDay,
      cutoffStartDate: startDate.toISOString(),
      cutoffEndDate: endDate.toISOString(),
      isPeriodLocked,
      hasSavedSnapshots: savedSnapshots.length > 0,
      records,
      outlets: tenant?.outlets || [],
      businessName: tenant?.businessName || "Toko Saya",
      summary: {
        totalStaffCount: records.length,
        totalPayrollExpenditure,
        totalBaseSalarySum,
        totalCommissionsSum,
      },
    })
  );
}
