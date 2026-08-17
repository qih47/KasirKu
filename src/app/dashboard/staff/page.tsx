import { getStaffData } from "@/modules/tenant/staff-actions";
import { StaffClient } from "./staff-client";

export default async function StaffPage() {
  const data = await getStaffData();

  return <StaffClient initialData={data} />;
}
