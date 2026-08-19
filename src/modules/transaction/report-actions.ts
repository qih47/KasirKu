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

  const outletFilter = params.outletId && params.outletId !== "ALL" ? { outletId: params.outletId } : {};

  if (params.outletId && params.outletId !== "ALL") {
    whereClause.outletId = params.outletId;
  }

  // 1. Fetch Transaksi & Data 4 Vertikal secara Paralel
  const [
    transactions,
    tenant,
    allOutlets,
    cafeTables,
    bookings,
    laundryOrders,
    commissions,
    outletStocks,
  ] = await Promise.all([
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
    prisma.cafeTable.findMany({
      where: {
        tenantId: user.tenantId,
        ...outletFilter,
      },
    }),
    prisma.booking.findMany({
      where: {
        tenantId: user.tenantId,
        ...outletFilter,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { barber: true, service: true },
    }),
    prisma.laundryOrder.findMany({
      where: {
        tenantId: user.tenantId,
        ...outletFilter,
        createdAt: { gte: fromDate, lte: toDate },
      },
    }),
    prisma.staffCommission.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { staff: true },
    }),
    prisma.outletStock.findMany({
      where: {
        outlet: { tenantId: user.tenantId },
        ...outletFilter,
      },
      include: { product: true, outlet: true },
    }),
  ]);

  // 2. Hitung Metrik Utama (Core KPIs)
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
  let targetOutletSchedule: any = null;
  if (params.outletId && params.outletId !== "ALL") {
    const matchedOutlet = allOutlets.find((o) => o.id === params.outletId);
    targetOutletSchedule = (matchedOutlet as any)?.operatingHours;
  } else if (allOutlets.length > 0) {
    targetOutletSchedule = (allOutlets[0] as any)?.operatingHours;
  }

  const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayDayKey = DAY_KEYS[new Date().getDay()];
  const todaySchedule = targetOutletSchedule?.[todayDayKey] ?? null;

  const parseCloseHour = (closeTime: string, openHour: number): number => {
    const [h] = closeTime.split(":").map(Number);
    if (h === 0 && openHour > 0) return 24;
    if (h < openHour && h > 0) return 23;
    return h;
  };

  let startH = 8;
  let endH = 22;
  let is24H = false;
  let labelOpenStr = "08:00";
  let labelCloseStr = "22:00";

  if (targetOutletSchedule) {
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
        labelCloseStr = clHParsed === 24 ? "23:59" : rawClose;
        startH = isNaN(opH) ? 8 : opH;
        endH   = clHParsed === 24 ? 23 : clHParsed;
      }
    }
  }

  transactions.forEach((t: any) => {
    const h = new Date(t.createdAt).getHours();
    startH = Math.min(startH, h);
    endH = Math.max(endH, h);
  });

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

  // ============================================================
  // 8. MULTI-VERTICAL REAL ANALYTICS ENGINES
  // ============================================================

  // --- VERTICAL 1: CAFE & F&B ---
  const totalTables = cafeTables.length;
  const occupiedTables = cafeTables.filter((t) => t.status === "OCCUPIED").length;
  const tableOccupancyPercent = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
  
  let cafeSignatureRevenue = 0;
  let cafeFoodRevenue = 0;
  let cafeBeverageRevenue = 0;
  let cafeOtherRevenue = 0;

  transactions.forEach((t: any) => {
    t.items.forEach((item: any) => {
      const cat = (item.product.category || "").toLowerCase();
      const sub = Number(item.subtotal);
      if (cat.includes("kopi") || cat.includes("coffee") || cat.includes("signature")) {
        cafeSignatureRevenue += sub;
      } else if (cat.includes("makan") || cat.includes("food") || cat.includes("meal")) {
        cafeFoodRevenue += sub;
      } else if (cat.includes("minum") || cat.includes("drink") || cat.includes("tea")) {
        cafeBeverageRevenue += sub;
      } else {
        cafeOtherRevenue += sub;
      }
    });
  });

  const totalCafeCatRev = cafeSignatureRevenue + cafeFoodRevenue + cafeBeverageRevenue + cafeOtherRevenue || 1;
  const cafeCategoryBreakdown = [
    { name: "Signature Coffee", amount: cafeSignatureRevenue, percent: Math.round((cafeSignatureRevenue / totalCafeCatRev) * 100), color: "bg-amber-500" },
    { name: "Food & Main Course", amount: cafeFoodRevenue, percent: Math.round((cafeFoodRevenue / totalCafeCatRev) * 100), color: "bg-indigo-500" },
    { name: "Non-Coffee & Tea", amount: cafeBeverageRevenue, percent: Math.round((cafeBeverageRevenue / totalCafeCatRev) * 100), color: "bg-emerald-500" },
    { name: "Pastry & Snacks", amount: cafeOtherRevenue, percent: Math.round((cafeOtherRevenue / totalCafeCatRev) * 100), color: "bg-pink-500" },
  ];

  const cafeAnalytics = {
    totalTables,
    occupiedTables,
    tableOccupancyPercent,
    avgTicketPerTable: totalTransactions > 0 ? `Rp ${Math.round(totalRevenue / totalTransactions).toLocaleString("id-ID")}` : "Rp 0",
    categoryBreakdown: cafeCategoryBreakdown,
  };

  // --- VERTICAL 2: BARBERSHOP & SALON ---
  const totalHeadsCut = bookings.filter((b) => b.status === "COMPLETED").length;
  const totalCommissionPaid = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  let barberServiceRevenue = 0;
  let barberRetailProductRevenue = 0;

  transactions.forEach((t: any) => {
    t.items.forEach((item: any) => {
      if (item.product.type === "JASA") {
        barberServiceRevenue += Number(item.subtotal);
      } else {
        barberRetailProductRevenue += Number(item.subtotal);
      }
    });
  });

  const totalBarberRev = barberServiceRevenue + barberRetailProductRevenue || 1;
  const barberServiceVsProduct = [
    { name: "Jasa Treatment & Potong Rambut", amount: barberServiceRevenue, percent: Math.round((barberServiceRevenue / totalBarberRev) * 100), color: "bg-cyan-500" },
    { name: "Produk Retail (Pomade, Wax & Hair Tonic)", amount: barberRetailProductRevenue, percent: Math.round((barberRetailProductRevenue / totalBarberRev) * 100), color: "bg-amber-500" },
  ];

  // Barber Staff Breakdown
  const barberStaffMap: Record<string, { name: string; cuts: number; revenue: number; commission: number }> = {};
  bookings.forEach((b) => {
    if (b.barber) {
      if (!barberStaffMap[b.barber.id]) {
        barberStaffMap[b.barber.id] = { name: b.barber.name, cuts: 0, revenue: 0, commission: 0 };
      }
      barberStaffMap[b.barber.id].cuts += 1;
    }
  });

  commissions.forEach((c) => {
    if (c.staff && barberStaffMap[c.staff.id]) {
      barberStaffMap[c.staff.id].commission += Number(c.amount);
    }
  });

  const capsterPerformance = Object.values(barberStaffMap);

  const barberAnalytics = {
    totalHeadsCut,
    totalCommissionReady: `Rp ${totalCommissionPaid.toLocaleString("id-ID")}`,
    serviceVsProduct: barberServiceVsProduct,
    capsterPerformance,
  };

  // --- VERTICAL 3: LAUNDRY SERVICE ---
  let totalWeightKg = 0;
  let totalLaundrySatuan = 0;
  let laundryKiloanOrders = 0;
  let laundrySatuanOrders = 0;

  laundryOrders.forEach((o) => {
    if (o.serviceType === "KILOAN") {
      totalWeightKg += Number(o.weightKg || 0);
      laundryKiloanOrders += 1;
    } else {
      totalLaundrySatuan += Number(o.unitQty || 1);
      laundrySatuanOrders += 1;
    }
  });

  const activeLaundryOrders = laundryOrders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
  const completedLaundryOrders = laundryOrders.filter((o) => o.status === "COMPLETED").length;
  const slaOnTimePercent = laundryOrders.length > 0 ? Math.round((completedLaundryOrders / laundryOrders.length) * 100) : 100;

  const laundryAnalytics = {
    totalWeightKg: `${totalWeightKg.toFixed(1)} Kg`,
    totalSatuanPcs: `${totalLaundrySatuan} Pcs`,
    pendingPickup: `${activeLaundryOrders} Nota`,
    onTimeSlaPercent: `${slaOnTimePercent}%`,
    kiloanOrders: laundryKiloanOrders,
    satuanOrders: laundrySatuanOrders,
  };

  // --- VERTICAL 4: RETAIL & MART ---
  let totalStockValuation = 0;
  let totalStockUnits = 0;
  const fastMovingSku: any[] = [];
  const deadStockSku: any[] = [];

  outletStocks.forEach((os) => {
    const qty = os.stockQty ?? 0;
    const price = os.priceOverride ? Number(os.priceOverride) : Number(os.product.price);
    totalStockValuation += qty * price;
    totalStockUnits += qty;

    const soldInPeriod = productMap[os.productId]?.qty || 0;
    if (soldInPeriod > 0) {
      fastMovingSku.push({
        sku: os.product.barcode || os.product.id.slice(0, 8),
        name: os.product.name,
        salesQty: soldInPeriod,
        stockQty: qty,
        outletName: os.outlet.name,
      });
    } else if (qty > 0 && os.product.type === "BARANG") {
      deadStockSku.push({
        sku: os.product.barcode || os.product.id.slice(0, 8),
        name: os.product.name,
        stockQty: qty,
        val: `Rp ${(qty * price).toLocaleString("id-ID")}`,
        outletName: os.outlet.name,
      });
    }
  });

  const retailAnalytics = {
    totalStockValuation: `Rp ${totalStockValuation.toLocaleString("id-ID")}`,
    totalStockUnits,
    fastMovingSku: fastMovingSku.sort((a, b) => b.salesQty - a.salesQty).slice(0, 6),
    deadStockSku: deadStockSku.slice(0, 6),
  };

  return JSON.parse(
    JSON.stringify({
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
        label: is24H ? "00:00 - 23:59 (24 Jam)" : `${labelOpenStr} - ${labelCloseStr} WIB`,
      },
      // 4 Multi-Vertical Live Engines
      cafeAnalytics,
      barberAnalytics,
      laundryAnalytics,
      retailAnalytics,
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
    })
  );
}
