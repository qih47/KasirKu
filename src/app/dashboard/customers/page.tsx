import { getCustomersData } from "@/modules/customer/actions";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage() {
  const initialData = await getCustomersData();

  return <CustomersClient initialData={initialData} />;
}
