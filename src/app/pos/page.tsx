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

  const [productsData, tenant, cafeTables, staffList] = await Promise.all([
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
  ]);

  const activeSub = tenant?.subscriptions?.[0];
  const masterUiTheme = activeSub?.theme?.theme || null;
  const receiptConfig = (tenant?.receiptConfig as any) || {};
  const posThemeCode = receiptConfig.posThemeCode || receiptConfig.posLayout;

  // Cek apakah plugin 'self_order' aktif untuk tenant ini
  const isSelfOrderActive = activeSub?.plugins?.some(
    (tp) => tp.plugin.code === "self_order" && tp.isActive
  ) ?? false;

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
      tenantInfo={{
        tenantId: user.tenantId,
        businessName: tenant?.businessName || "POS Universal",
        logoUrl: tenant?.logoUrl || null,
        receiptConfig: tenant?.receiptConfig || null,
      }}
    />
  );
}
