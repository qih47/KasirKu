import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionHistoryAction } from "@/modules/transaction/actions";
import { HistoryClient, PosHistoryClient } from "./history-client";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const [transactions, tenant] = await Promise.all([
    getTransactionHistoryAction({ limit: 50 }),
    user?.tenantId
      ? prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                theme: { include: { theme: true } },
              },
              take: 1,
            },
          },
        })
      : null,
  ]);

  const activeSub = tenant?.subscriptions?.[0];
  const appliedTheme = activeSub?.theme?.theme || null;

  return (
    <HistoryClient
      initialTransactions={transactions}
      appliedTheme={appliedTheme ? JSON.parse(JSON.stringify(appliedTheme)) : null}
    />
  );
}
