"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Akses ditolak: Sesi tidak ditemukan.");
  }
  const user = session.user as any;
  if (user?.role !== "OWNER" && user?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Owner atau Admin yang dapat mengelola tema Bisnis.");
  }
  return user;
}

/**
 * Seed default themes jika belum ada di database
 */
async function ensureDefaultThemesSeeded() {
  const defaultThemes = [
    {
      code: "default",
      name: "🌟 Qassa Default Modern",
      type: "DEFAULT" as const,
      priceMonthly: 0,

      tokens: {
        primaryColor: "#4f46e5",
        accentColor: "#06b6d4",
        fontFamily: "Inter, sans-serif",
        radius: "1.25rem",
        density: "NORMAL",
        layoutStyle: "MODERN",
        cardBg: "#FFFFFF",
        cardBorder: "rgba(226, 232, 240, 0.85)",
        cardShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        innerBoxBg: "#F8F9FD",
        inputBg: "#FFFFFF",
        bgStyle: "radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.04) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.04) 0px, transparent 50%), #F8FAFC",
        description: "Tema bawaan sistem Qassa modern clean.",
      },
    },
  ];

  for (const t of defaultThemes) {
    await prisma.theme.upsert({
      where: { code: t.code },
      create: t,
      update: {
        name: t.name,
        type: t.type,
        priceMonthly: t.priceMonthly,
      },
    });
  }
}


export async function getTenantThemesMarketplaceData() {
  const user = await requireOwner();
  await ensureDefaultThemesSeeded();

  let targetTenantId = user.tenantId;
  if (!targetTenantId && user.role === "SUPER_ADMIN") {
    const firstTenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "desc" },
    });
    targetTenantId = firstTenant?.id;
  }

  const [themes, activeSub] = await Promise.all([
    prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
    targetTenantId
      ? prisma.tenantSubscription.findFirst({
        where: { tenantId: targetTenantId, isActive: true },
        include: {
          theme: {
            include: { theme: true },
          },
          licenseTier: true,
        },
      })
      : null,
  ]);

  const activeThemeId = activeSub?.theme?.themeId || themes[0]?.id;

  return JSON.parse(
    JSON.stringify({
      themes,
      activeThemeId,
      appliedTheme: activeSub?.theme?.theme || themes[0],
      isTrial: activeSub?.licenseTier?.code === "trial" || false,
    })
  );
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
  return {
    success: true,
    appliedTheme: JSON.parse(JSON.stringify(targetTheme)),
    themeName: targetTheme.name,
  };
}
