"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { revalidatePath } from "next/cache";

async function requireTenantLaundryUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login sebagai akun bisnis.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "laundry");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Laundry belum aktif pada paket langganan Anda."
    );
  }

  return user;
}

export async function getLaundryCommissionsData(params?: {
  staffId?: string;
  daysBack?: number;
}) {
  const user = await requireTenantLaundryUser();
  const daysBack = params?.daysBack || 30;
  const staffId = params?.staffId;

  const toDate = endOfDay(new Date());
  const fromDate = startOfDay(subDays(new Date(), daysBack));

  const whereClause: any = {
    tenantId: user.tenantId,
    createdAt: { gte: fromDate, lte: toDate },
  };

  if (staffId && staffId !== "ALL") {
    whereClause.staffId = staffId;
  }

  const [commissions, staffList, orders] = await Promise.all([
    prisma.staffCommission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        staff: true,
        transactionItem: {
          include: {
            product: true,
            transaction: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.laundryOrder.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: fromDate, lte: toDate },
      },
    }),
  ]);

  const totalCommissionsPaid = (commissions as any[]).reduce(
    (sum: number, c: any) => sum + Number(c.amount || 0),
    0
  );

  // Grouping per staf produktivitas laundry
  const staffSummaryMap: Record<
    string,
    {
      id: string;
      name: string;
      email: string;
      totalTasks: number;
      totalCommission: number;
    }
  > = {};

  (staffList as any[]).forEach((s: any) => {
    staffSummaryMap[s.id] = {
      id: s.id,
      name: s.name,
      email: s.email,
      totalTasks: 0,
      totalCommission: 0,
    };
  });

  (commissions as any[]).forEach((c: any) => {
    if (staffSummaryMap[c.staffId]) {
      staffSummaryMap[c.staffId].totalTasks += 1;
      staffSummaryMap[c.staffId].totalCommission += Number(c.amount || 0);
    }
  });

  const staffSummaryList = Object.values(staffSummaryMap).sort(
    (a: any, b: any) => Number(b.totalCommission || 0) - Number(a.totalCommission || 0)
  );

  const totalKgProcessed = (orders as any[]).reduce((sum: number, o: any) => sum + (o.weightKg ? Number(o.weightKg) : 0), 0);

  return {
    commissions,
    staffSummaryList,
    staffList,
    totalCommissionsPaid,
    totalKgProcessed,
    totalOrdersCount: orders.length,
    dateRange: {
      from: format(fromDate, "dd MMM yyyy"),
      to: format(toDate, "dd MMM yyyy"),
    },
  };
}

export async function updateStaffLaundryRatesAction(data: {
  staffId: string;
  ironingRatePerKg: number;
  washingRatePerKg: number;
  deliveryRatePerTrip?: number;
}) {
  const user = await requireTenantLaundryUser();
  const { staffId, ironingRatePerKg, washingRatePerKg, deliveryRatePerTrip } = data;

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff || staff.tenantId !== user.tenantId) {
    throw new Error("Staff tidak ditemukan.");
  }

  const currentAttrs: Record<string, any> = ((staff as any).attributes as any) || {};

  await prisma.user.update({
    where: { id: staffId },
    data: {
      attributes: {
        ...currentAttrs,
        ironingRatePerKg,
        washingRatePerKg,
        deliveryRatePerTrip: deliveryRatePerTrip || 3000,
      },
    } as any,
  });

  revalidatePath("/dashboard/laundry/commissions");
  return { success: true };
}
