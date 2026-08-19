import { getPayrollData } from "@/modules/payroll/payroll-actions";
import { PayrollClient } from "@/app/dashboard/payroll/payroll-client";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; outletId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const data = await getPayrollData({
    month: resolvedParams.month,
    outletId: resolvedParams.outletId,
  });

  return <PayrollClient initialData={data} />;
}
