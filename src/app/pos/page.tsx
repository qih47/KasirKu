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

  const [productsData, tenant, cafeTables] = await Promise.all([
    getProductsData(targetOutletId),
    user.tenantId
      ? prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                theme: { include: { theme: true } },
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
  ]);

  const activeSub = tenant?.subscriptions?.[0];
  const masterUiTheme = activeSub?.theme?.theme || null;
  const receiptConfig = (tenant?.receiptConfig as any) || {};
  const posThemeCode = receiptConfig.posThemeCode || receiptConfig.posLayout;

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
      appliedTheme={appliedPosTheme ? JSON.parse(JSON.stringify(appliedPosTheme)) : null}
      tenantInfo={{
        businessName: tenant?.businessName || "POS Universal",
        logoUrl: tenant?.logoUrl || null,
        receiptConfig: tenant?.receiptConfig || null,
      }}
    />
  );
}
