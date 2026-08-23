import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DynamicDashboardGrid } from "@/components/dashboard/dynamic-dashboard-grid";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/modules/dashboard/widget-types";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  let targetTenantId = user?.tenantId;
  if (!targetTenantId && user?.role === "SUPER_ADMIN") {
    const firstTenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "desc" },
    });
    targetTenantId = firstTenant?.id;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    tenant,
    todayTransactions,
    last7DaysTransactions,
    recentTransactionsList,
    lowStockProducts,
    allProducts,
    cafeTables,
    liveOrders,
    barberBookings,
    laundryOrders,
    activeShifts,
    allPaymentsToday,
    staffCommissionsMonth,
  ] = await Promise.all([
    targetTenantId
      ? prisma.tenant.findUnique({
          where: { id: targetTenantId },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                licenseTier: true,
                plugins: {
                  include: { plugin: true },
                },
              },
            },
            outlets: true,
            users: true,
          },
        })
      : null,
    targetTenantId
      ? prisma.transaction.findMany({
          where: {
            outlet: { tenantId: targetTenantId },
            createdAt: { gte: startOfToday },
          },
          include: {
            outlet: true,
            payments: true,
            items: { include: { product: true } },
          },
        })
      : [],
    targetTenantId
      ? prisma.transaction.findMany({
          where: {
            outlet: { tenantId: targetTenantId },
            createdAt: { gte: sevenDaysAgo },
          },
          select: {
            outletId: true,
            createdAt: true,
            totalAmount: true,
          },
        })
      : [],
    targetTenantId
      ? prisma.transaction.findMany({
          where: {
            outlet: { tenantId: targetTenantId },
          },
          include: {
            outlet: true,
            payments: { take: 1 },
            items: { take: 2, include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : [],
    targetTenantId
      ? prisma.product.findMany({
          where: { tenantId: targetTenantId, isActive: true, type: "BARANG" },
          orderBy: { stockQty: "asc" },
          take: 30,
        })
      : [],
    targetTenantId
      ? prisma.product.findMany({
          where: { tenantId: targetTenantId, isActive: true },
          select: { id: true, name: true, price: true, stockQty: true, category: true, type: true },
        })
      : [],
    targetTenantId
      ? (prisma.cafeTable as any).findMany({
          where: { tenantId: targetTenantId },
        })
      : [],
    targetTenantId && (prisma as any).liveOrder
      ? (prisma as any).liveOrder.findMany({
          where: { tenantId: targetTenantId },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [],
    targetTenantId
      ? prisma.booking.findMany({
          where: {
            tenantId: targetTenantId,
            createdAt: { gte: startOfToday },
          },
          include: {
            barber: true,
            service: true,
            outlet: true,
          },
          orderBy: { scheduledAt: "asc" },
        })
      : [],
    targetTenantId
      ? prisma.laundryOrder.findMany({
          where: {
            tenantId: targetTenantId,
            createdAt: { gte: startOfToday },
          },
          include: {
            outlet: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
    targetTenantId
      ? prisma.shift.findMany({
          where: {
            outlet: { tenantId: targetTenantId },
            closedAt: null,
          },
          include: {
            kasir: true,
            outlet: true,
          },
        })
      : [],
    targetTenantId
      ? prisma.payment.findMany({
          where: {
            transaction: {
              outlet: { tenantId: targetTenantId },
              createdAt: { gte: startOfToday },
            },
          },
        })
      : [],
    targetTenantId
      ? prisma.staffCommission.findMany({
          where: {
            tenantId: targetTenantId,
            createdAt: { gte: startOfMonth },
          },
          include: {
            staff: true,
          },
        })
      : [],
  ]);

  const activeSubscription = tenant?.subscriptions[0];
  const activePluginCodes = (activeSubscription?.plugins || []).map(
    (p: any) => p.plugin.code
  );
  const activeTierCode = activeSubscription?.licenseTier?.code || "BASIC";
  const outletsList = tenant?.outlets || [];

  // 1. Overall Revenue
  const todayRevenue = todayTransactions.reduce(
    (acc: number, curr: any) => acc + Number(curr.totalAmount || 0),
    0
  );
  const todayTransactionsCount = todayTransactions.length;

  // 2. Multi-Outlet Breakdown
  const outletBreakdown = outletsList.map((outlet: any) => {
    const outletTrx = todayTransactions.filter((t: any) => t.outletId === outlet.id);
    const outletRev = outletTrx.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount || 0), 0);
    const activeShift = activeShifts.find((s: any) => s.outletId === outlet.id);

    return {
      id: outlet.id,
      name: outlet.name,
      address: outlet.address,
      todayRevenue: outletRev,
      todayTransactionsCount: outletTrx.length,
      isOpen: !!activeShift,
      activeCashier: activeShift?.kasir?.name || null,
      openingCash: activeShift ? Number(activeShift.openingCash || 0) : 0,
    };
  });

  // 3. Low-stock & Stock Valuation
  const realLowStockProducts = lowStockProducts
    .filter((p: any) => (p.stockQty ?? 0) <= (p.minStockAlert ?? 5))
    .slice(0, 8);

  const stockValuationRp = allProducts.reduce((sum: number, p: any) => {
    const qty = p.stockQty || 0;
    const cost = Number(p.price || 0);
    return sum + (qty * cost);
  }, 0);

  // 4. Real 7-day weekly sales aggregation
  const daysMap = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weeklyTrends = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = daysMap[d.getDay()];
    const dateStr = d.toISOString().slice(0, 10);
    const dayTransactions = last7DaysTransactions.filter(
      (t: any) => t.createdAt.toISOString().slice(0, 10) === dateStr
    );
    const dayTotal = dayTransactions.reduce(
      (sum: number, t: any) => sum + Number(t.totalAmount || 0),
      0
    );
    return {
      day: dayLabel,
      revenue: dayTotal,
      transactions: dayTransactions.length,
    };
  });

  // 5. Vertical: Cafe Stats
  const availableTables = cafeTables.filter((t: any) => t.status === "AVAILABLE").length;
  const occupiedTables = cafeTables.filter((t: any) => t.status === "OCCUPIED").length;
  const cafeKitchenPreparing = liveOrders.filter((o: any) => o.status === "PREPARING" || o.status === "PENDING").length;
  const cafeKitchenReady = liveOrders.filter((o: any) => o.status === "READY").length;

  // 6. Vertical: Barbershop Stats
  const barberWaiting = barberBookings.filter((b: any) => b.status === "WAITING");
  const barberInProgress = barberBookings.filter((b: any) => b.status === "IN_PROGRESS");
  const barberCompleted = barberBookings.filter((b: any) => b.status === "COMPLETED");

  // Stylist Leaderboard
  const stylistStatsMap: Record<string, { name: string; cuts: number; commission: number }> = {};
  barberCompleted.forEach((b: any) => {
    const sName = b.barber?.name || "Stylist";
    if (!stylistStatsMap[sName]) {
      stylistStatsMap[sName] = { name: sName, cuts: 0, commission: 0 };
    }
    stylistStatsMap[sName].cuts += 1;
    stylistStatsMap[sName].commission += Number(b.service?.price || 0) * 0.3; // Estimasi 30%
  });
  const stylistLeaderboard = Object.values(stylistStatsMap).sort((a, b) => b.cuts - a.cuts).slice(0, 5);

  // 7. Vertical: Laundry Stats
  const laundryReceived = laundryOrders.filter((o: any) => o.status === "RECEIVED").length;
  const laundryWashing = laundryOrders.filter((o: any) => o.status === "WASHING" || o.status === "DRYING").length;
  const laundryIroning = laundryOrders.filter((o: any) => o.status === "IRONING").length;
  const laundryReady = laundryOrders.filter((o: any) => o.status === "READY_FOR_PICKUP");
  const laundryCompleted = laundryOrders.filter((o: any) => o.status === "COMPLETED").length;
  const laundryTodayWeightKg = laundryOrders.reduce((sum: number, o: any) => sum + Number(o.weightKg || 0), 0);
  const laundryTodayUnitQty = laundryOrders.reduce((sum: number, o: any) => sum + Number(o.unitQty || 0), 0);

  // Fragrance popularity
  const fragranceMap: Record<string, number> = {};
  laundryOrders.forEach((o: any) => {
    const f = o.fragrance || "Reguler";
    fragranceMap[f] = (fragranceMap[f] || 0) + 1;
  });
  const topFragrance = Object.entries(fragranceMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // 8. Vertical: Retail Stats
  const soldSkuMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  todayTransactions.forEach((trx: any) => {
    (trx.items || []).forEach((item: any) => {
      const pName = item.product?.name || "Item";
      if (!soldSkuMap[pName]) {
        soldSkuMap[pName] = { name: pName, qty: 0, revenue: 0 };
      }
      soldSkuMap[pName].qty += Number(item.qty || 1);
      soldSkuMap[pName].revenue += Number(item.subtotal || 0);
    });
  });
  const fastMovingSku = Object.values(soldSkuMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // 9. Financial: Payment Methods & Cash Drawer
  let cashIn = 0;
  let qrisIn = 0;
  let transferIn = 0;
  let edcIn = 0;
  allPaymentsToday.forEach((p: any) => {
    const amt = Number(p.amount || 0);
    if (p.method === "CASH" || p.method === "TUNAI") cashIn += amt;
    else if (p.method === "QRIS") qrisIn += amt;
    else if (p.method === "TRANSFER") transferIn += amt;
    else if (p.method === "EDC" || p.method === "DEBIT" || p.method === "CREDIT") edcIn += amt;
  });

  const totalCommissionsMonth = staffCommissionsMonth.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

  const rawWidgets = (tenant as any)?.dashboardWidgets;
  const initialWidgets =
    rawWidgets && Array.isArray(rawWidgets) && rawWidgets.length > 0
      ? rawWidgets
      : DEFAULT_DASHBOARD_LAYOUT;

  return (
    <DynamicDashboardGrid
      initialWidgets={initialWidgets}
      outlets={outletsList}
      activeTierCode={activeTierCode}
      metricsData={{
        tenantName: tenant?.businessName || user?.name || "KasirKu Store",
        outletName: tenant?.outlets?.[0]?.name || "Cabang Utama",
        activeTierName: activeSubscription?.licenseTier?.name || "Lisensi Pro",
        activePlugins: activePluginCodes,
        todayRevenue,
        todayTransactionsCount,
        weeklyTrends,
        recentTransactions: recentTransactionsList.map((t: any) => ({
          id: t.id,
          outletName: t.outlet?.name || "Outlet",
          transactionNumber: t.transactionNumber || `TRX-${t.id.slice(0, 6)}`,
          totalAmount: Number(t.totalAmount || 0),
          paymentMethod: t.payments?.[0]?.method || "TUNAI",
          itemsSummary: t.items?.[0]?.product?.name || "Item Belanja",
        })),
        lowStockProducts: realLowStockProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stockQty || 0,
          minStockAlert: p.minStockAlert ?? 5,
        })),
        outletBreakdown,
        stockValuationRp,
        fastMovingSku,
        cafeStats: {
          totalTables: cafeTables.length,
          available: availableTables,
          occupied: occupiedTables,
          tablesList: cafeTables.slice(0, 8),
          kitchenPreparing: cafeKitchenPreparing,
          kitchenReady: cafeKitchenReady,
          recentSelfOrders: liveOrders.slice(0, 5),
        },
        barberStats: {
          activeChairs: barberInProgress.length,
          queueCount: barberWaiting.length,
          waitingList: barberWaiting.slice(0, 5),
          inProgressList: barberInProgress.slice(0, 4),
          stylistLeaderboard,
        },
        laundryStats: {
          todayWeightKg: laundryTodayWeightKg,
          todayUnitQty: laundryTodayUnitQty,
          pipeline: {
            received: laundryReceived,
            washing: laundryWashing,
            ironing: laundryIroning,
            ready: laundryReady.length,
            completed: laundryCompleted,
          },
          rackReadyList: laundryReady.slice(0, 5).map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            weightKg: Number(o.weightKg || 0),
          })),
          topFragrance,
        },
        financialStats: {
          cashIn,
          qrisIn,
          transferIn,
          edcIn,
          totalCommissionsMonth,
          activeShiftsCount: activeShifts.length,
        },
      }}
    />
  );
}


