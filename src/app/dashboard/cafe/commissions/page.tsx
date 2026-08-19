import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { getCafeServiceChargePoolData } from "@/plugins/cafe/commission-actions";
import { CafeCommissionsClient } from "./commissions-client";

export default async function CafeCommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const tenantId = (session.user as any).tenantId;
  const isCafeActive = await hasTenantPlugin(tenantId, "cafe");

  if (!isCafeActive) {
    redirect("/dashboard/store");
  }

  const initialData = await getCafeServiceChargePoolData();

  return <CafeCommissionsClient initialData={initialData} />;
}
