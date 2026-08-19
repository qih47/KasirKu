import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { getLaundryCommissionsData } from "@/plugins/laundry/commission-actions";
import { LaundryCommissionsClient } from "./commissions-client";

export default async function LaundryCommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const tenantId = (session.user as any).tenantId;
  const isLaundryActive = await hasTenantPlugin(tenantId, "laundry");

  if (!isLaundryActive) {
    redirect("/dashboard/store");
  }

  const initialData = await getLaundryCommissionsData();

  return <LaundryCommissionsClient initialData={initialData} />;
}
