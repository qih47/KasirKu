import { prisma } from "@/lib/prisma";
import { DemoClient } from "./demo-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Simulator Harga & Demo Interaktif | POS Universal",
  description: "Coba seluruh alur kasir POS, konfigurasi paket lisensi, dan ganti tema visual langsung dari database katalog resmi.",
};

export default async function DemoPage() {
  // Ambil data harga lisensi, plugin, dan tema secara live langsung dari database katalog
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
    <DemoClient
      dbTiers={JSON.parse(JSON.stringify(dbTiers))}
      dbPlugins={JSON.parse(JSON.stringify(rawPlugins))}
      dbThemes={JSON.parse(JSON.stringify(rawThemes))}
    />
  );
}
