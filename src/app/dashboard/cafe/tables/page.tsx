import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCafeTablesData } from "@/plugins/cafe/actions";
import { CafeTablesClient } from "./tables-client";

export default async function CafeTablesPage({
  searchParams,
}: {
  searchParams?: Promise<{ outletId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const data = await getCafeTablesData(resolvedParams.outletId);

  return <CafeTablesClient initialData={data} />;
}
