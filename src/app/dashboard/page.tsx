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
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    tenant,
    todayTransactions,
    last7DaysTransactions,
    recentTransactionsList,
    lowStockProducts,
    cafeTables,
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
        })
      : [],
    targetTenantId
      ? prisma.transaction.findMany({
          where: {
            outlet: { tenantId: targetTenantId },
            createdAt: { gte: sevenDaysAgo },
          },
          select: {
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
            payments: { take: 1 },
            items: { take: 1, include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
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
      ? prisma.cafeTable.findMany({
          where: { tenantId: targetTenantId },
        })
      : [],
  ]);

  const activeSubscription = tenant?.subscriptions[0];
  const activePluginCodes = (activeSubscription?.plugins || []).map(
    (p: any) => p.plugin.code
  );

  const todayRevenue = todayTransactions.reduce(
    (acc: number, curr: any) => acc + Number(curr.totalAmount || 0),
    0
  );
  const todayTransactionsCount = todayTransactions.length;

  // Filter actual low-stock products based on each product's minStockAlert
  const realLowStockProducts = lowStockProducts
    .filter((p: any) => (p.stockQty ?? 0) <= (p.minStockAlert ?? 5))
    .slice(0, 8);

  // Real 7-day weekly sales aggregation
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

  const availableTables = cafeTables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedTables = cafeTables.filter((t) => t.status === "OCCUPIED").length;

  const rawWidgets = (tenant as any)?.dashboardWidgets;
  const initialWidgets =
    rawWidgets && Array.isArray(rawWidgets) && rawWidgets.length > 0
      ? rawWidgets
      : DEFAULT_DASHBOARD_LAYOUT;

  return (
    <DynamicDashboardGrid
      initialWidgets={initialWidgets}
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
        cafeStats: {
          totalTables: cafeTables.length,
          available: availableTables,
          occupied: occupiedTables,
        },
        barberStats: {
          activeChairs: 3,
          queueCount: 2,
        },
        laundryStats: {
          todayWeightKg: 42.5,
          pendingOrders: 5,
        },
      }}
    />
  );
}


