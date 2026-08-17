import { getOutletsData } from "@/modules/tenant/outlet-actions";
import { OutletsClient } from "./outlets-client";

export default async function OutletsPage() {
  const data = await getOutletsData();

  return <OutletsClient initialData={data} />;
}
