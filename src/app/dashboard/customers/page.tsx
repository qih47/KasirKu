import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomersData } from "@/modules/customer/actions";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const initialData = await getCustomersData();

  return <CustomersClient initialData={initialData} />;
}
