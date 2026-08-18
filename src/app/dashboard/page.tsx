import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DynamicDashboardRenderer,
  DashboardMetricsData,
} from "@/components/dashboard/dynamic-dashboard-renderer";

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
    activeShift,
    productsList,
    topItemsGrouped,
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
                  include: {
                    plugin: true,
                  },
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
      ? prisma.shift.findFirst({
          where: { outlet: { tenantId: targetTenantId }, closedAt: null },
          include: { kasir: true },
          orderBy: { openedAt: "desc" },
        })
      : null,
    targetTenantId
      ? prisma.product.findMany({
          where: { tenantId: targetTenantId, isActive: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : [],
    targetTenantId
      ? prisma.transactionItem.groupBy({
          by: ["productId"],
          where: {
            transaction: {
              outlet: { tenantId: targetTenantId },
            },
          },
          _sum: {
            qty: true,
            subtotal: true,
          },
          orderBy: {
            _sum: {
              qty: "desc",
            },
          },
          take: 5,
        })
      : [],
  ]);

  const activeSubscription = tenant?.subscriptions[0];
  const activePlugins = (activeSubscription?.plugins || []).map((p) => ({
    id: p.plugin.id,
    name: p.plugin.name,
    code: p.plugin.code,
  }));

  const todayRevenue = todayTransactions.reduce(
    (acc, curr) => acc + Number(curr.totalAmount || 0),
    0
  );
  const todayTransactionsCount = todayTransactions.length;
  const averageOrderValue =
    todayTransactionsCount > 0
      ? Math.round(todayRevenue / todayTransactionsCount)
      : 0;

  // Real 7-day weekly sales aggregation
  const daysMap = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weeklySalesTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = daysMap[d.getDay()];
    const dateStr = d.toISOString().slice(0, 10);
    const dayTotal = last7DaysTransactions
      .filter((t) => t.createdAt.toISOString().slice(0, 10) === dateStr)
      .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    return {
      day: dayLabel,
      amount: dayTotal,
    };
  });

  // Resolve top products from group by or fallback to tenant product catalog
  let topProductsData = [];
  if (topItemsGrouped.length > 0) {
    const productIds = topItemsGrouped.map((g) => g.productId);
    const matchedProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(matchedProducts.map((p) => [p.id, p]));

    topProductsData = topItemsGrouped.map((g) => {
      const p = productMap.get(g.productId);
      return {
        id: g.productId,
        name: p?.name || "Produk",
        category: p?.category || "Umum",
        soldQty: g._sum.qty || 0,
        revenue: Number(g._sum.subtotal || 0),
      };
    });
  } else {
    topProductsData = productsList.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || "Umum",
      soldQty: 0,
      revenue: 0,
    }));
  }

  const metricsData: DashboardMetricsData = {
    tenantName: tenant?.businessName || user?.name || "Qassa Outlet",
    userName: user?.name || "Admin",
    isTrial: tenant?.status === "TRIAL",
    tierName: activeSubscription?.licenseTier?.name || "Lisensi Pro",
    outletsCount: tenant?.outlets.length || 1,
    maxOutlets: activeSubscription?.licenseTier?.outletLimit || null,
    usersCount: tenant?.users.length || 1,
    activePlugins,
    todayRevenue,
    todayTransactionsCount,
    averageOrderValue,
    weeklySalesTrend,
    activeShiftStatus: {
      isOpen: Boolean(activeShift),
      cashierName: activeShift?.kasir?.name || (Boolean(activeShift) ? "Kasir Aktif" : "Belum Ada Shift"),
      openedAt: activeShift
        ? new Date(activeShift.openedAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      openingCash: activeShift ? Number(activeShift.openingCash) : 0,
    },
    recentTransactions: recentTransactionsList.map((t: any) => ({
      id: t.id,
      receiptNumber: t.transactionNumber || `#INV-${t.id.slice(0, 6)}`,
      totalAmount: Number(t.totalAmount || 0),
      paymentMethod: t.payments?.[0]?.method || "CASH",
      createdAt: new Date(t.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    })),
    topProducts: topProductsData,
  };

  return <DynamicDashboardRenderer data={metricsData} />;
}


