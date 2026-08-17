"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfMonth, format } from "date-fns";

async function requireTenantUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko.");
  }
  return session.user as any;
}

export type ReportPeriod = "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "CUSTOM";

export async function getSalesReportData(params: {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  outletId?: string;
}) {
  const user = await requireTenantUser();
  const period = params.period || "LAST_7_DAYS";

  const now = new Date();
  let fromDate: Date;
  let toDate: Date = endOfDay(now);

  switch (period) {
    case "TODAY":
      fromDate = startOfDay(now);
      break;
    case "LAST_7_DAYS":
      fromDate = startOfDay(subDays(now, 6));
      break;
    case "LAST_30_DAYS":
      fromDate = startOfDay(subDays(now, 29));
      break;
    case "THIS_MONTH":
      fromDate = startOfMonth(now);
      break;
    case "CUSTOM":
      fromDate = params.startDate ? startOfDay(new Date(params.startDate)) : startOfDay(subDays(now, 6));
      toDate = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(now);
      break;
    default:
      fromDate = startOfDay(subDays(now, 6));
  }

  const whereClause: any = {
    outlet: { tenantId: user.tenantId },
    status: "PAID",
    createdAt: {
      gte: fromDate,
      lte: toDate,
    },
  };

  if (params.outletId && params.outletId !== "ALL") {
    whereClause.outletId = params.outletId;
  }

  // 1. Fetch Transaksi Lengkap
  const [transactions, tenant, allOutlets] = await Promise.all([
    prisma.transaction.findMany({
      where: whereClause,
      include: {
        outlet: true,
        shift: {
          include: { kasir: true },
        },
        items: {
          include: { product: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
    }),
    prisma.outlet.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // 2. Hitung Metrik Utama (KPIs)
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce(
    (sum: number, t: any) => sum + Number(t.totalAmount),
    0
  );
  const averageOrderValue =
    totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  let totalItemsSold = 0;
  transactions.forEach((t: any) => {
    t.items.forEach((item: any) => {
      totalItemsSold += item.qty;
    });
  });

  // 3. Konsolidasi Breakdown Antar Cabang Outlet
  const outletSummaryMap: Record<
    string,
    { id: string; name: string; trxCount: number; totalRevenue: number }
  > = {};

  allOutlets.forEach((o: any) => {
    outletSummaryMap[o.id] = {
      id: o.id,
      name: o.name,
      trxCount: 0,
      totalRevenue: 0,
    };
  });

  transactions.forEach((t: any) => {
    if (outletSummaryMap[t.outletId]) {
      outletSummaryMap[t.outletId].trxCount += 1;
      outletSummaryMap[t.outletId].totalRevenue += Number(t.totalAmount);
    }
  });

  const outletPerformance = Object.values(outletSummaryMap).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  // 4. Rekap Penjualan Harian
  const dailyMap: Record<string, { date: string; formattedDate: string; trxCount: number; totalRevenue: number; itemsCount: number }> = {};

  transactions.forEach((t: any) => {
    const dStr = format(new Date(t.createdAt), "yyyy-MM-dd");
    const dFormatted = format(new Date(t.createdAt), "dd MMM yyyy");

    if (!dailyMap[dStr]) {
      dailyMap[dStr] = {
        date: dStr,
        formattedDate: dFormatted,
        trxCount: 0,
        totalRevenue: 0,
        itemsCount: 0,
      };
    }

    dailyMap[dStr].trxCount += 1;
    dailyMap[dStr].totalRevenue += Number(t.totalAmount);
    t.items.forEach((item: any) => {
      dailyMap[dStr].itemsCount += item.qty;
    });
  });

  const dailyTrends = Object.values(dailyMap).sort((a, b) => (a.date > b.date ? -1 : 1));

  // 5. Top 5 Produk Terlaris
  const productMap: Record<string, { id: string; name: string; category: string; qty: number; revenue: number }> = {};

  transactions.forEach((t: any) => {
    t.items.forEach((item: any) => {
      const pId = item.productId;
      if (!productMap[pId]) {
        productMap[pId] = {
          id: pId,
          name: item.product.name,
          category: item.product.category || "Umum",
          qty: 0,
          revenue: 0,
        };
      }
      productMap[pId].qty += item.qty;
      productMap[pId].revenue += Number(item.subtotal);
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // 6. Performa Staff Kasir
  const cashierMap: Record<string, { id: string; name: string; trxCount: number; totalRevenue: number }> = {};

  transactions.forEach((t: any) => {
    const kasirId = t.shift.kasir.id;
    const kasirName = t.shift.kasir.name;

    if (!cashierMap[kasirId]) {
      cashierMap[kasirId] = {
        id: kasirId,
        name: kasirName,
        trxCount: 0,
        totalRevenue: 0,
      };
    }

    cashierMap[kasirId].trxCount += 1;
    cashierMap[kasirId].totalRevenue += Number(t.totalAmount);
  });

  const cashierPerformance = Object.values(cashierMap).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  // 7. Advanced Analytics: Jam Ramai Transaksi (Peak Hours)
  const hourlyCounts: Record<number, number> = {};
  for (let i = 8; i <= 22; i++) hourlyCounts[i] = 0;

  transactions.forEach((t: any) => {
    const hour = new Date(t.createdAt).getHours();
    if (hourlyCounts[hour] !== undefined) {
      hourlyCounts[hour] += 1;
    }
  });

  const peakHours = Object.entries(hourlyCounts).map(([hour, count]) => ({
    hour: `${hour.padStart(2, "0")}:00`,
    count,
  }));

  return {
    tenantName: tenant?.businessName || "POS Universal",
    allOutlets,
    selectedOutletId: params.outletId || "ALL",
    dateRange: {
      from: format(fromDate, "yyyy-MM-dd"),
      to: format(toDate, "yyyy-MM-dd"),
      fromFormatted: format(fromDate, "dd MMM yyyy"),
      toFormatted: format(toDate, "dd MMM yyyy"),
    },
    metrics: {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      totalItemsSold,
    },
    outletPerformance,
    dailyTrends,
    topProducts,
    cashierPerformance,
    peakHours,
    transactionsList: transactions.map((t: any) => ({
      id: t.id,
      transactionNumber: t.transactionNumber,
      date: format(new Date(t.createdAt), "dd/MM/yyyy HH:mm"),
      outletName: t.outlet.name,
      cashierName: t.shift.kasir.name,
      itemsSummary: t.items.map((i: any) => `${i.product.name} (${i.qty})`).join(", "),
      totalAmount: Number(t.totalAmount),
      paymentMethod: t.payments[0]?.method || "CASH",
    })),
  };
}
