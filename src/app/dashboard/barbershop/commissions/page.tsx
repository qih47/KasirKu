import { getBarberCommissionsReport } from "@/plugins/barbershop/actions";
import { BarberCommissionsClient } from "./commissions-client";

export default async function BarberCommissionsPage() {
  const data = await getBarberCommissionsReport();

  return <BarberCommissionsClient initialData={data} />;
}
