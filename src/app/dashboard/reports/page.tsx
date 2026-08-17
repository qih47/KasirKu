import { getSalesReportData } from "@/modules/transaction/report-actions";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const data = await getSalesReportData({ period: "LAST_7_DAYS" });

  return <ReportsClient initialData={data} />;
}
