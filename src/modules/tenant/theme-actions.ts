"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola tema toko.");
  }
  return session.user as any;
}

/**
 * Seed default themes jika belum ada di database
 */
async function ensureDefaultThemesSeeded() {
  const count = await prisma.theme.count();
  if (count === 0) {
    const defaultThemes = [
      {
        code: "default_modern",
        name: "🌟 Modern Minimalist (Glassmorphism)",
        type: "DEFAULT" as const,
        priceMonthly: 0,
        tokens: {
          primaryColor: "#4f46e5",
          accentColor: "#06b6d4",
          fontFamily: "Inter, sans-serif",
          radius: "1.25rem",
          density: "NORMAL",
          layoutStyle: "MODERN",
          description: "Desain lega, kartu floating dengan rounded-3xl dan sentuhan indigo glassmorphism modern.",
        },
      },
      {
        code: "compact_retail",
        name: "⚡ Compact High-Density (Retail & Minimarket)",
        type: "PRESET" as const,
        priceMonthly: 25000,
        tokens: {
          primaryColor: "#059669",
          accentColor: "#10b981",
          fontFamily: "Inter, sans-serif",
          radius: "0.5rem",
          density: "COMPACT",
          layoutStyle: "COMPACT",
          description: "Layout berkepadatan tinggi, border tegas, tabel ringkas dan tombol kasir cepat untuk transaksi volume tinggi.",
        },
      },
      {
        code: "luxe_dark",
        name: "🖤 Luxe Dark & Gold (Barbershop & Lounge)",
        type: "PRESET" as const,
        priceMonthly: 35000,
        tokens: {
          primaryColor: "#f59e0b",
          accentColor: "#fbbf24",
          fontFamily: "Outfit, sans-serif",
          radius: "1rem",
          density: "NORMAL",
          layoutStyle: "LUXE",
          description: "Tampilan gelap pekat (OLED Pure Dark) dengan aksen emas glow mewah, cocok untuk barbershop & salon premium.",
        },
      },
      {
        code: "warm_bistro",
        name: "☕ Warm Bistro & Cafe (Organic Earthly)",
        type: "PRESET" as const,
        priceMonthly: 30000,
        tokens: {
          primaryColor: "#d97706",
          accentColor: "#b45309",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          radius: "1.5rem",
          density: "SPACIOUS",
          layoutStyle: "WARM",
          description: "Warna terakota hangat dan bayangan halus organik, menciptakan atmosfer cafe & bakery yang nyaman.",
        },
      },
    ];

    for (const t of defaultThemes) {
      await prisma.theme.create({ data: t });
    }
  }
}

export async function getTenantThemesMarketplaceData() {
  const user = await requireOwner();
  await ensureDefaultThemesSeeded();

  const [themes, activeSub] = await Promise.all([
    prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      include: {
        theme: {
          include: { theme: true },
        },
        licenseTier: true,
      },
    }),
  ]);

  const activeThemeId = activeSub?.theme?.themeId || themes[0]?.id;

  return {
    themes,
    activeThemeId,
    appliedTheme: activeSub?.theme?.theme || themes[0],
    isTrial: activeSub?.licenseTier?.code === "trial" || false,
  };
}

export async function applyThemeAction(themeId: string) {
  const user = await requireOwner();

  const activeSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: user.tenantId, isActive: true },
  });

  if (!activeSub) {
    throw new Error("Tidak ada langganan aktif yang ditemukan.");
  }

  const targetTheme = await prisma.theme.findUnique({
    where: { id: themeId },
  });

  if (!targetTheme) {
    throw new Error("Tema tidak ditemukan.");
  }

  // Terapkan tema ke subscription tenant
  await prisma.tenantTheme.upsert({
    where: { subscriptionId: activeSub.id },
    create: {
      subscriptionId: activeSub.id,
      themeId: targetTheme.id,
      customConfig: targetTheme.tokens as any,
    },
    update: {
      themeId: targetTheme.id,
      customConfig: targetTheme.tokens as any,
      activatedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/themes");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { success: true, appliedTheme: targetTheme };
}
