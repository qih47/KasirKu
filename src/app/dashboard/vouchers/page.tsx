import { getVouchersData } from "@/modules/voucher/actions";
import { VouchersClient } from "./vouchers-client";

export default async function VouchersPage() {
  const initialData = await getVouchersData();

  return <VouchersClient initialData={initialData} />;
}
