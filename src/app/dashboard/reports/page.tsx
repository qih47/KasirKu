import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSalesReportData } from "@/modules/transaction/report-actions";
import { getFeatureEntitlementsMatrix } from "@/modules/features/feature-actions";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const user = session.user as any;
  const targetTenantId = user.tenantId;

  const [data, tenant, featureMatrix] = await Promise.all([
    getSalesReportData({ period: "LAST_7_DAYS" }),
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
          },
        })
      : null,
    getFeatureEntitlementsMatrix(),
  ]);

  const activeSub = tenant?.subscriptions?.[0];
  const currentTierCode = activeSub?.licenseTier?.code || "basic";
  const activePlugins = activeSub?.plugins?.map((p: any) => ({
    code: p.plugin.code,
    name: p.plugin.name,
  })) || [];

  return (
    <ReportsClient
      initialData={data}
      activeTierCode={currentTierCode}
      activePlugins={activePlugins}
      featureMatrix={featureMatrix}
    />
  );
}
