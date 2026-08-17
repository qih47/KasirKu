import { getCafeTablesData } from "@/plugins/cafe/actions";
import { CafeTablesClient } from "./tables-client";

export default async function CafeTablesPage() {
  const data = await getCafeTablesData();

  return <CafeTablesClient initialData={data} />;
}
