import { getTransactionHistoryAction } from "@/modules/transaction/actions";
import { HistoryClient } from "./history-client";

export default async function HistoryPage() {
  const transactions = await getTransactionHistoryAction({ limit: 50 });

  return <HistoryClient initialTransactions={transactions} />;
}
