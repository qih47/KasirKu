import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVouchersData } from "@/modules/voucher/actions";
import { VouchersClient } from "./vouchers-client";

export default async function VouchersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const initialData = await getVouchersData();

  return <VouchersClient initialData={initialData} />;
}
