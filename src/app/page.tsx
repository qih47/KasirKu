import { prisma } from "@/lib/prisma";
import { LandingClient } from "./landing-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Qassa POS - Satu Sistem Kasir Cerdas untuk Segala Bidang Bisnis",
  description:
    "Aplikasi kasir pintar multi-vertikal untuk Cafe & Resto, Barbershop, Retail, dan Laundry. Dilengkapi manajemen multi-cabang, kalkulator komisi staff, dan printer struk thermal profesional.",
};

export default async function HomePage() {
  const [rawTiers, rawPlugins, rawThemes] = await Promise.all([
    prisma.licenseTier.findMany({
      where: { isActive: true },
    }),
    prisma.plugin.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
    prisma.theme.findMany({
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

  return (
    <LandingClient
      tiers={JSON.parse(JSON.stringify(dbTiers))}
      plugins={JSON.parse(JSON.stringify(rawPlugins))}
      themes={JSON.parse(JSON.stringify(rawThemes))}
    />
  );
}
