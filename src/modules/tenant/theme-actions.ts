"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ThemeShellConfig {
  dashboardNavPosition?: "TOP_NAV" | "SIDEBAR_LEFT";
  sidebarCollapsed?: boolean;
  sidebarCollapsedDefault?: boolean;
  posCategoryPosition?: "TOP_PILLS" | "SIDEBAR_LEFT";
  posCartDock?: "RIGHT" | "LEFT";
  posGridColumns?: 3 | 4 | 5;
  posCardStyle?: "GRID_CARD" | "COMPACT_ROW" | "LARGE_PHOTO";
  primaryColor?: string;
  accentColor?: string;
  mode?: "light" | "dark";
  radius?: string;
}

async function requireTenantSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Akses ditolak: Sesi tidak ditemukan.");
  }
  return session.user as any;
}

async function requireOwner() {
  const user = await requireTenantSession();
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
        mode: "light",
        cardBg: "#FFFFFF",
        cardBorder: "rgba(226, 232, 240, 0.85)",
        cardShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        innerBoxBg: "#F8F9FD",
        inputBg: "#FFFFFF",
        bgStyle:
          "radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.04) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.04) 0px, transparent 50%), #F8FAFC",
        description: "Tema bawaan sistem Qassa modern clean dengan navigasi fleksibel.",
        shell: {
          dashboardNavPosition: "TOP_NAV",
          posCategoryPosition: "TOP_PILLS",
          posCartDock: "RIGHT",
          posGridColumns: 4,
          posCardStyle: "GRID_CARD",
        },
      },
    },
    {
      code: "theme-executive-sidebar",
      name: "🏛️ Executive Left-Sidebar Pro",
      type: "PRESET" as const,
      priceMonthly: 0,
      tokens: {
        primaryColor: "#2563eb",
        accentColor: "#0ea5e9",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        radius: "1rem",
        density: "COMFORTABLE",
        layoutStyle: "SIDEBAR_PRO",
        mode: "light",
        cardBg: "#FFFFFF",
        cardBorder: "#E2E8F0",
        cardShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
        textPrimary: "#0F172A",
        textSecondary: "#475569",
        innerBoxBg: "#F1F5F9",
        inputBg: "#FFFFFF",
        bgStyle: "#F8FAFC",
        description:
          "Tata letak enterprise dengan Sidebar Kiri di Dashboard dan Sidebar Kategori + Stasiun di POS Kasir.",
        shell: {
          dashboardNavPosition: "SIDEBAR_LEFT",
          posCategoryPosition: "SIDEBAR_LEFT",
          posCartDock: "RIGHT",
          posGridColumns: 4,
          posCardStyle: "GRID_CARD",
        },
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

  const [themes, activeSub, tenant] = await Promise.all([
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
    targetTenantId
      ? prisma.tenant.findUnique({
          where: { id: targetTenantId },
          select: { attributes: true },
        })
      : null,
  ]);

  const activeThemeId = activeSub?.theme?.themeId || themes[0]?.id;
  const customConfig = (activeSub?.theme?.customConfig as any) || {};
  const tenantAttrs = (tenant?.attributes as any) || {};
  const shellConfig: ThemeShellConfig = {
    dashboardNavPosition: "TOP_NAV",
    posCategoryPosition: "TOP_PILLS",
    posCartDock: "RIGHT",
    posGridColumns: 4,
    posCardStyle: "GRID_CARD",
    ...(activeSub?.theme?.theme?.tokens as any)?.shell,
    ...customConfig?.shell,
    ...tenantAttrs?.themeShell,
  };

  return JSON.parse(
    JSON.stringify({
      themes,
      activeThemeId,
      appliedTheme: activeSub?.theme?.theme || themes[0],
      customConfig,
      shellConfig,
      isTrial: activeSub?.licenseTier?.code === "trial" || false,
    })
  );
}

export async function applyThemeAction(themeId: string) {
  const user = await requireOwner();

  const [activeSub, tenant] = await Promise.all([
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      include: { theme: true },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { attributes: true },
    }),
  ]);

  if (!activeSub) {
    throw new Error("Tidak ada langganan aktif yang ditemukan.");
  }

  const targetTheme = await prisma.theme.findUnique({
    where: { id: themeId },
  });

  if (!targetTheme) {
    throw new Error("Tema tidak ditemukan.");
  }

  const targetTokens = (targetTheme.tokens as any) || {};
  const prevCustom = (activeSub.theme?.customConfig as any) || {};
  const tenantAttrs = (tenant?.attributes as any) || {};

  // Jika tema memiliki preset shell sendiri (misal theme-executive-sidebar), gunakan shell tema tersebut,
  // namun jika tidak, pertahankan preferensi shell user sebelumnya
  const mergedShell: ThemeShellConfig = {
    dashboardNavPosition:
      targetTokens.shell?.dashboardNavPosition ||
      tenantAttrs.themeShell?.dashboardNavPosition ||
      prevCustom.shell?.dashboardNavPosition ||
      "TOP_NAV",
    posCategoryPosition:
      targetTokens.shell?.posCategoryPosition ||
      tenantAttrs.themeShell?.posCategoryPosition ||
      prevCustom.shell?.posCategoryPosition ||
      "TOP_PILLS",
    posCartDock:
      targetTokens.shell?.posCartDock ||
      targetTokens.layouts?.pos?.cartDock?.toUpperCase() ||
      tenantAttrs.themeShell?.posCartDock ||
      prevCustom.shell?.posCartDock ||
      "RIGHT",
    posGridColumns:
      targetTokens.shell?.posGridColumns ||
      targetTokens.layouts?.pos?.productGridColumns ||
      tenantAttrs.themeShell?.posGridColumns ||
      prevCustom.shell?.posGridColumns ||
      4,
    posCardStyle:
      targetTokens.shell?.posCardStyle ||
      tenantAttrs.themeShell?.posCardStyle ||
      prevCustom.shell?.posCardStyle ||
      "GRID_CARD",
  };

  const mergedCustomConfig = {
    ...targetTokens,
    shell: mergedShell,
  };

  // Terapkan tema ke subscription tenant
  await prisma.tenantTheme.upsert({
    where: { subscriptionId: activeSub.id },
    create: {
      subscriptionId: activeSub.id,
      themeId: targetTheme.id,
      customConfig: mergedCustomConfig as any,
    },
    update: {
      themeId: targetTheme.id,
      customConfig: mergedCustomConfig as any,
      activatedAt: new Date(),
    },
  });

  const existingPurchasedUi: string[] = tenantAttrs.purchasedUiThemeIds || [];
  const updatedPurchasedUi = Array.from(
    new Set([...existingPurchasedUi, targetTheme.id, targetTheme.code])
  );

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      attributes: {
        ...tenantAttrs,
        purchasedUiThemeIds: updatedPurchasedUi,
        themeShell: {
          ...(tenantAttrs.themeShell || {}),
          ...mergedShell,
          primaryColor: targetTokens.primaryColor || targetTokens.primary || "#4f46e5",
          accentColor: targetTokens.accentColor || targetTokens.accent || "#06b6d4",
          mode: targetTokens.mode || (targetTokens.layoutStyle === "LUXE" ? "dark" : "light"),
          radius: targetTokens.radius || "1.25rem",
        },
      } as any,
    },
  });

  revalidatePath("/dashboard/themes");
  revalidatePath("/dashboard/store");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return {
    success: true,
    appliedTheme: JSON.parse(JSON.stringify(targetTheme)),
    shellConfig: mergedShell,
    themeName: targetTheme.name,
  };
}

/**
 * Simpan kustomisasi tata letak navigasi & shell (Topbar vs Sidebar, Cart Dock, Grid Columns, Card Style, Warna)
 */
export async function updateThemeShellConfigAction(newShell: Partial<ThemeShellConfig>) {
  const user = await requireTenantSession();
  if (!user.tenantId) {
    throw new Error("Tenant ID tidak ditemukan.");
  }

  const [activeSub, tenant] = await Promise.all([
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      include: { theme: { include: { theme: true } } },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { attributes: true, receiptConfig: true },
    }),
  ]);

  const tenantAttrs = (tenant?.attributes as any) || {};
  const existingShell: ThemeShellConfig = {
    dashboardNavPosition: "TOP_NAV",
    posCategoryPosition: "TOP_PILLS",
    posCartDock: "RIGHT",
    posGridColumns: 4,
    posCardStyle: "GRID_CARD",
    ...(activeSub?.theme?.customConfig as any)?.shell,
    ...(tenantAttrs.themeShell || {}),
  };

  const updatedShell: ThemeShellConfig = {
    ...existingShell,
    ...newShell,
  };

  // Simpan di Tenant.attributes.themeShell
  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      attributes: {
        ...tenantAttrs,
        themeShell: updatedShell,
      } as any,
    },
  });

  // Jika ada TenantTheme pada subscription aktif, sinkronkan juga customConfig-nya
  if (activeSub?.theme) {
    const currentCustom = (activeSub.theme.customConfig as any) || (activeSub.theme.theme?.tokens as any) || {};
    await prisma.tenantTheme.update({
      where: { id: activeSub.theme.id },
      data: {
        customConfig: {
          ...currentCustom,
          ...(newShell.primaryColor ? { primaryColor: newShell.primaryColor } : {}),
          ...(newShell.accentColor ? { accentColor: newShell.accentColor } : {}),
          ...(newShell.mode ? { mode: newShell.mode } : {}),
          ...(newShell.radius ? { radius: newShell.radius } : {}),
          shell: updatedShell,
        } as any,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/themes");
  revalidatePath("/dashboard/store");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pos");

  return {
    success: true,
    shellConfig: updatedShell,
  };
}
