import { getLaundryOrdersData } from "@/plugins/laundry/actions";
import { LaundryOrdersClient } from "./orders-client";

export default async function LaundryOrdersPage() {
  const data = await getLaundryOrdersData();

  return <LaundryOrdersClient initialData={data} />;
}
