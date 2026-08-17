import { prisma } from "@/lib/prisma";
import { RegisterClient } from "./register-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pendaftaran Akun & Langganan Resmi | POS Universal",
  description: "Daftar akun POS Universal jalur Trial 30 Hari atau langsung aktifkan Paket Resmi Berbayar.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [rawTiers, rawPlugins] = await Promise.all([
    prisma.licenseTier.findMany({
      where: { isActive: true },
    }),
    prisma.plugin.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ]);

  const tierOrderMap: Record<string, number> = {
    basic: 1,
    pro: 2,
    enterprise: 3,
  };

  const dbTiers = rawTiers.sort((a, b) => {
    const orderA = tierOrderMap[a.code.toLowerCase()] || 99;
    const orderB = tierOrderMap[b.code.toLowerCase()] || 99;
    return orderA - orderB;
  });

  const initialPlan = typeof searchParams.plan === "string" ? searchParams.plan : undefined;
  const initialBilling =
    typeof searchParams.billing === "string" && searchParams.billing === "ANNUAL"
      ? "ANNUAL"
      : "MONTHLY";

  return (
    <RegisterClient
      dbTiers={JSON.parse(JSON.stringify(dbTiers))}
      dbPlugins={JSON.parse(JSON.stringify(rawPlugins))}
      initialPlan={initialPlan}
      initialBilling={initialBilling}
    />
  );
}
