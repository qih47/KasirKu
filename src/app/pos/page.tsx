import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentShiftData } from "@/modules/transaction/shift-actions";
import { getProductsData } from "@/modules/product/actions";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  const shiftData = await getCurrentShiftData();
  const targetOutletId = user.outletId || shiftData?.currentOutletId || shiftData?.outlets?.[0]?.id;

  const [productsData, tenant, cafeTables, staffList, rawVouchers] = await Promise.all([
    getProductsData(targetOutletId),
    user.tenantId
      ? prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                theme: { include: { theme: true } },
                plugins: {
                  where: { isActive: true },
                  include: { plugin: true },
                },
              },
              take: 1,
            },
          },
        })
      : null,
    user.tenantId
      ? prisma.cafeTable.findMany({
          where: {
            tenantId: user.tenantId,
            ...(targetOutletId ? { outletId: targetOutletId } : {}),
          },
          orderBy: { tableNumber: "asc" },
        })
      : [],
    user.tenantId
      ? prisma.user.findMany({
          where: {
            tenantId: user.tenantId,
            isActive: true,
            isCommissionActive: true, // Hanya staf yang diaktifkan skema komisinya yang muncul di POS
            ...(targetOutletId
              ? {
                  OR: [{ outletId: targetOutletId }, { outletId: null }],
                }
              : {}),
          } as any,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            position: true,
            role: true,
            commissionPercent: true,
            commissionFlat: true,
            outletId: true,
          },
        })
      : [],
    user.tenantId
      ? prisma.voucher.findMany({
          where: {
            tenantId: user.tenantId,
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  const now = new Date();
  const activeVouchers = (rawVouchers || []).filter((v: any) => {
    if (v.startDate && new Date(v.startDate) > now) return false;
    if (v.endDate && new Date(v.endDate) < now) return false;
    if (v.usageLimit !== null && v.usedCount >= v.usageLimit) return false;
    return true;
  });

  const activeSub = tenant?.subscriptions?.[0];
  const masterUiTheme = activeSub?.theme?.theme || null;
  const receiptConfig = (tenant?.receiptConfig as any) || {};
  const posThemeCode = receiptConfig.posThemeCode || receiptConfig.posLayout;

  // Cek apakah plugin vertikal & self_order aktif untuk tenant ini
  const isSelfOrderActive = ((activeSub?.plugins || []) as any[]).some(
    (tp: any) => tp.plugin?.code === "self_order" && tp.isActive
  ) ?? false;

  const isBarbershopActive = ((activeSub?.plugins || []) as any[]).some(
    (tp: any) => tp.plugin?.code === "barbershop" && tp.isActive
  ) ?? false;

  const isCafeActive = ((activeSub?.plugins || []) as any[]).some(
    (tp: any) => tp.plugin?.code === "cafe" && tp.isActive
  ) ?? false;

  const isLaundryActive = ((activeSub?.plugins || []) as any[]).some(
    (tp: any) => tp.plugin?.code === "laundry" && tp.isActive
  ) ?? false;

  const isRetailActive = ((activeSub?.plugins || []) as any[]).some(
    (tp: any) => tp.plugin?.code === "retail" && tp.isActive
  ) ?? (!isBarbershopActive && !isCafeActive && !isLaundryActive);

  let initialBarberBookings: any[] = [];
  if (isBarbershopActive && user.tenantId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: user.tenantId,
        ...(targetOutletId ? { outletId: targetOutletId } : {}),
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { in: ["WAITING", "IN_PROGRESS", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            role: true,
            commissionPercent: true,
            commissionFlat: true,
            attributes: true,
          },
        },
        service: true,
        customer: true,
      },
    });
    initialBarberBookings = JSON.parse(JSON.stringify(bookings));
  }

  // Resolve custom POS theme if explicitly chosen in Store "Tema POS", otherwise use master UI theme
  let appliedPosTheme = masterUiTheme;
  if (posThemeCode && posThemeCode !== "DEFAULT" && posThemeCode !== "STANDARD") {
    const customTheme = await prisma.theme.findFirst({
      where: {
        OR: [{ code: posThemeCode }, { id: posThemeCode }],
        isActive: true,
      },
    });
    if (customTheme) {
      appliedPosTheme = customTheme;
    }
  }

  return (
    <PosClient
      initialShiftData={shiftData}
      initialProducts={productsData.products}
      categories={productsData.categories}
      cafeTables={cafeTables}
      staffList={staffList ? JSON.parse(JSON.stringify(staffList)) : []}
      appliedTheme={appliedPosTheme ? JSON.parse(JSON.stringify(appliedPosTheme)) : null}
      hasSelfOrderPlugin={isSelfOrderActive}
      hasBarbershopPlugin={isBarbershopActive}
      hasCafePlugin={isCafeActive}
      hasLaundryPlugin={isLaundryActive}
      hasRetailPlugin={isRetailActive}
      initialBarberBookings={initialBarberBookings}
      activeVouchers={activeVouchers ? JSON.parse(JSON.stringify(activeVouchers)) : []}
      tenantInfo={{
        tenantId: user.tenantId,
        businessName: tenant?.businessName || "POS Universal",
        logoUrl: tenant?.logoUrl || (tenant?.receiptConfig as any)?.logoUrl || null,
        receiptConfig: tenant?.receiptConfig || null,
      }}
    />
  );
}
