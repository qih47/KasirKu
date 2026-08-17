"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang diizinkan.");
  }
  return session.user as any;
}

export async function getThemesCatalog() {
  await requireSuperAdmin();

  const themes = await prisma.theme.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { tenantThemes: true },
      },
    },
  });

  return themes;
}

export async function createThemeAction(data: {
  code: string;
  name: string;
  type: "DEFAULT" | "PRESET" | "CUSTOM";
  priceMonthly: number;
  tokens: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    radius: string;
    layoutStyle?: string;
    density?: string;
    description?: string;
  };
}) {
  const admin = await requireSuperAdmin();
  const { code, name, type, priceMonthly, tokens } = data;

  const existing = await prisma.theme.findUnique({
    where: { code: code.trim().toLowerCase() },
  });

  if (existing) {
    throw new Error(`Tema dengan kode "${code}" sudah terdaftar.`);
  }

  const newTheme = await prisma.theme.create({
    data: {
      code: code.trim().toLowerCase(),
      name: name.trim(),
      type,
      priceMonthly,
      tokens: {
        ...tokens,
        layoutStyle: tokens.layoutStyle || "MODERN",
        density: tokens.density || "NORMAL",
        description: tokens.description || `Tema ${name} dengan layout ${tokens.layoutStyle || "MODERN"}.`,
      },
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      superAdminId: admin.id,
      action: "create_theme",
      targetType: "Theme",
      targetId: newTheme.id,
      detail: { code, name, priceMonthly, tokens },
    },
  });

  revalidatePath("/admin/themes");
  revalidatePath("/dashboard/themes");
  revalidatePath("/admin");
  return { success: true, theme: newTheme };
}
