import { getBarbershopQueueData } from "@/plugins/barbershop/actions";
import { BarbershopQueueClient } from "./queue-client";

export default async function BarbershopQueuePage() {
  const data = await getBarbershopQueueData();

  return <BarbershopQueueClient initialData={data} />;
}
