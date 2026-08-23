import { getLaundryOrdersData } from "@/plugins/laundry/actions";
import { LaundryOrdersClient } from "./orders-client";

export default async function LaundryOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ outletId?: string }>;
}) {
  const sp = await searchParams;
  const data = await getLaundryOrdersData(sp?.outletId);

  return <LaundryOrdersClient initialData={data} />;
}
