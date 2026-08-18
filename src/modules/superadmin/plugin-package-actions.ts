"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validatePluginPackage, PluginPackage } from "@/types/plugin-package";
import {
  sanitizePosSlots,
  sanitizeDashboardSlots,
  sanitizeReceiptBlocks,
} from "@/lib/registry/widget-registry";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang diizinkan mengimpor dan mempublikasikan paket plugin.");
  }
  return session.user as any;
}

/**
 * Validates and imports a standalone plugin/theme package JSON file into the platform catalog.
 */
export async function importPluginPackageAction({
  jsonContent,
  customPriceMonthly,
  customPriceAnnual,
}: {
  jsonContent: string;
  customPriceMonthly?: number;
  customPriceAnnual?: number;
}) {
  const admin = await requireSuperAdmin();

  let parsedRaw: any;
  try {
    parsedRaw = JSON.parse(jsonContent);
  } catch (err: any) {
    return {
      success: false,
      error: `Format JSON tidak valid: ${err.message}`,
    };
  }

  // 1. Validate against Zod schema
  const validation = validatePluginPackage(parsedRaw);
  if (!validation.success || !validation.package) {
    return {
      success: false,
      error: `Validasi Paket Gagal: ${validation.error || "Format tidak sesuai"}`,
    };
  }

  const pkg: PluginPackage = validation.package;
  const manifest = pkg.manifest;

  // 2. Sanitize and verify widgets
  const sanitizedPosSlots = pkg.layouts?.pos?.slots
    ? sanitizePosSlots(pkg.layouts.pos.slots)
    : [];
  const sanitizedDashboardSlots = pkg.layouts?.dashboard?.slots
    ? sanitizeDashboardSlots(pkg.layouts.dashboard.slots)
    : [];
  const sanitizedReceiptBlocks = pkg.receipt?.blocks
    ? sanitizeReceiptBlocks(pkg.receipt.blocks)
    : [];

  const priceMonthly =
    customPriceMonthly !== undefined
      ? Number(customPriceMonthly)
      : Number(manifest.priceMonthly || 0);
  const priceAnnual =
    customPriceAnnual !== undefined
      ? Number(customPriceAnnual)
      : Number(manifest.priceAnnual || priceMonthly * 10);

  // 3. Save as Theme, POS Layout, or Receipt Preset depending on type
  if (manifest.type === "THEME" || manifest.type === "POS_LAYOUT" || manifest.type === "RECEIPT_PRESET") {
    const existingTheme = await prisma.theme.findUnique({
      where: { code: manifest.id },
    });

    const themeData = {
      code: manifest.id,
      name: manifest.name,
      type: "PRESET" as const,
      priceMonthly,
      isActive: true,
      tokens: {
        ...(pkg.tokens || {}),
        packageType: manifest.type,
        vertical: manifest.vertical || "GENERAL",
        priceMonthly,
        priceAnnual,
        primaryColor: pkg.tokens?.colors?.primary || "#4f46e5",
        accentColor: pkg.tokens?.colors?.accent || "#06b6d4",
        fontFamily: pkg.tokens?.typography?.fontFamily || "Inter",
        radius: pkg.tokens?.effects?.borderRadius || "1.25rem",
        layoutStyle: pkg.tokens?.mode === "dark" ? "LUXE" : "MODERN",
        description: manifest.description,
        version: manifest.version,
        author: manifest.author,
        previewImages: manifest.previewUrls || [],
        layouts: {
          pos: {
            ...pkg.layouts?.pos,
            slots: sanitizedPosSlots,
          },
          dashboard: {
            ...pkg.layouts?.dashboard,
            slots: sanitizedDashboardSlots,
          },
        },
        receipt: {
          ...pkg.receipt,
          blocks: sanitizedReceiptBlocks,
        },
      },
    };




    let savedTheme;
    if (existingTheme) {
      savedTheme = await prisma.theme.update({
        where: { id: existingTheme.id },
        data: themeData,
      });
    } else {
      savedTheme = await prisma.theme.create({
        data: themeData,
      });
    }

    await prisma.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: existingTheme ? "update_theme_package" : "import_theme_package",
        targetType: "Theme",
        targetId: savedTheme.id,
        detail: {
          manifest,
          priceMonthly,
          priceAnnual,
          widgetCount: {
            pos: sanitizedPosSlots.length,
            dashboard: sanitizedDashboardSlots.length,
            receipt: sanitizedReceiptBlocks.length,
          },
        },
      },
    });

    revalidatePath("/admin/catalog");
    revalidatePath("/admin/themes");
    revalidatePath("/dashboard/themes");
    revalidatePath("/dashboard/subscription");

    return {
      success: true,
      type: "THEME" as const,
      item: savedTheme,
      manifest,
      stats: {
        posSlotsCount: sanitizedPosSlots.length,
        dashboardSlotsCount: sanitizedDashboardSlots.length,
        receiptBlocksCount: sanitizedReceiptBlocks.length,
      },
    };
  } else {
    // Save as Vertical Plugin (Barbershop, Cafe, Laundry, Receipt Studio, etc.)
    const existingPlugin = await prisma.plugin.findUnique({
      where: { code: manifest.id },
    });

    const pluginData = {
      code: manifest.id,
      name: manifest.name,
      description: manifest.description || `Paket plugin resmi ${manifest.name}`,
      priceMonthly,
      priceAnnual,
      isActive: true,
    };

    let savedPlugin;
    if (existingPlugin) {
      savedPlugin = await prisma.plugin.update({
        where: { id: existingPlugin.id },
        data: pluginData,
      });
    } else {
      savedPlugin = await prisma.plugin.create({
        data: pluginData,
      });
    }

    await prisma.auditLog.create({
      data: {
        superAdminId: admin.id,
        action: existingPlugin ? "update_plugin_package" : "import_plugin_package",
        targetType: "Plugin",
        targetId: savedPlugin.id,
        detail: {
          manifest,
          priceMonthly,
          priceAnnual,
        },
      },
    });

    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/subscription");

    return {
      success: true,
      type: "PLUGIN" as const,
      item: savedPlugin,
      manifest,
      stats: {
        posSlotsCount: sanitizedPosSlots.length,
        dashboardSlotsCount: sanitizedDashboardSlots.length,
        receiptBlocksCount: sanitizedReceiptBlocks.length,
      },
    };
  }
}
