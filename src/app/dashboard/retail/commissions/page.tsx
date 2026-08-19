import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { getRetailIncentivesData } from "@/plugins/retail/commission-actions";
import { RetailCommissionsClient } from "./commissions-client";

export default async function RetailCommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const tenantId = (session.user as any).tenantId;
  const isRetailActive = await hasTenantPlugin(tenantId, "retail");

  if (!isRetailActive) {
    redirect("/dashboard/store");
  }

  const initialData = await getRetailIncentivesData();

  return <RetailCommissionsClient initialData={initialData} />;
}
