import { getBarbershopQueueData } from "@/plugins/barbershop/actions";
import { BarbershopQueueClient } from "./queue-client";

export default async function BarbershopQueuePage({
  searchParams,
}: {
  searchParams?: Promise<{ outletId?: string }>;
}) {
  const sp = await searchParams;
  const data = await getBarbershopQueueData(sp?.outletId);

  return <BarbershopQueueClient initialData={data} />;
}
