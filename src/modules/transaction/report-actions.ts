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

  // 7. Advanced Analytics: Jam Ramai Transaksi (Peak Hours) Dinamis Sesuai Jam Operasional
  let targetOutletSchedule: any = null;
  if (params.outletId && params.outletId !== "ALL") {
    const matchedOutlet = allOutlets.find((o) => o.id === params.outletId);
    targetOutletSchedule = (matchedOutlet as any)?.operatingHours;
  } else if (allOutlets.length > 0) {
    targetOutletSchedule = (allOutlets[0] as any)?.operatingHours;
  }

  // Helper: Konversi day-of-week number ke key jadwal (0=Minggu, 1=Senin, dst)
  const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayDayKey = DAY_KEYS[new Date().getDay()];
  const todaySchedule = targetOutletSchedule?.[todayDayKey] ?? null;

  // Helper: Parse closeTime — "00:00" artinya tengah malam (24:00), bukan jam 0 pagi
  const parseCloseHour = (closeTime: string, openHour: number): number => {
    const [h] = closeTime.split(":").map(Number);
    if (h === 0 && openHour > 0) return 24; // tengah malam → 24 (setelah 23)
    if (h < openHour && h > 0) return 23;   // melewati tengah malam → tampilkan s/d 23
    return h;
  };

  // Hitung rentang jam operasional dari HARI INI dulu, fallback ke aggregate semua hari
  let startH = 8;
  let endH = 22;
  let is24H = false;
  // Simpan string waktu lengkap (HH:MM) untuk label agar menit tidak hilang
  let labelOpenStr = "08:00";
  let labelCloseStr = "22:00";
  let labelIsMidnight = false; // tutup di tengah malam (00:00)

  if (targetOutletSchedule) {
    // Prioritas: gunakan jadwal hari ini untuk label
    if (todaySchedule && todaySchedule.isOpen) {
      if (todaySchedule.is24Hours) {
        is24H = true;
        labelOpenStr = "00:00";
        labelCloseStr = "23:59";
        startH = 0;
        endH = 23;
      } else {
        const rawOpen  = todaySchedule.openTime  || "08:00";
        const rawClose = todaySchedule.closeTime || "22:00";
        const [opH]  = rawOpen.split(":").map(Number);
        const clHParsed = parseCloseHour(rawClose, opH);

        labelOpenStr  = rawOpen;
        labelIsMidnight = clHParsed === 24;
        labelCloseStr = labelIsMidnight ? "23:59" : rawClose;

        startH = isNaN(opH) ? 8 : opH;
        endH   = clHParsed === 24 ? 23 : clHParsed;
      }
    }

    // Perluas range heatmap ke seluruh hari jika periode lebih dari 1 hari
    if (period !== "TODAY") {
      const allDays = Object.values(targetOutletSchedule) as any[];
      allDays.forEach((d) => {
        if (d && d.isOpen) {
          if (d.is24Hours) { is24H = true; return; }
          const [opH] = (d.openTime || "08:00").split(":").map(Number);
          const rawClose = d.closeTime || "22:00";
          const clHParsed = parseCloseHour(rawClose, opH);
          if (!isNaN(opH)) startH = Math.min(startH, opH);
          endH = Math.max(endH, clHParsed === 24 ? 23 : clHParsed);
        }
      });
    }
  }

  // Cari jam transaksi terluar agar tidak ada transaksi yang terpotong
  transactions.forEach((t: any) => {
    const h = new Date(t.createdAt).getHours();
    startH = Math.min(startH, h);
    endH = Math.max(endH, h);
  });

  if (is24H) {
    startH = 0;
    endH = 23;
    labelOpenStr  = "00:00";
    labelCloseStr = "23:59";
  }

  // Bangun label dinamis — gunakan string asli (HH:MM) bukan hanya angka jam
  let peakHoursLabel: string;
  if (is24H) {
    peakHoursLabel = "00:00 - 23:59 (24 Jam)";
  } else if (todaySchedule && todaySchedule.isOpen) {
    peakHoursLabel = `${labelOpenStr} - ${labelCloseStr} WIB`;
    peakHoursLabel += period !== "TODAY" ? " (Hari Ini)" : "";
  } else {
    const fmtH = (h: number) => String(h).padStart(2, "0") + ":00";
    peakHoursLabel = `${fmtH(startH)} - ${fmtH(endH)} WIB`;
  }

  const hourlyCounts: Record<number, number> = {};
  for (let i = startH; i <= endH; i++) {
    hourlyCounts[i] = 0;
  }

  transactions.forEach((t: any) => {
    const hour = new Date(t.createdAt).getHours();
    if (hourlyCounts[hour] !== undefined) {
      hourlyCounts[hour] += 1;
    }
  });

  const peakHours = Object.entries(hourlyCounts).map(([hour, count]) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
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
    peakHoursRange: {
      startH,
      endH,
      is24H,
      label: peakHoursLabel,
    },
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
