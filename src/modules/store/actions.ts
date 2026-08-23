"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  ReceiptConfig,
  defaultReceiptConfig,
  ReceiptTemplateStyle,
  BusinessVertical,
} from "@/types/receipt";

import {
  POS_LAYOUTS_CATALOG,
  PosLayoutType,
} from "@/types/pos-layout";
import { applyThemeAction as baseApplyThemeAction } from "@/modules/tenant/theme-actions";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengakses Store.");
  }
  return session.user as any;
}

export async function getStoreData() {
  const user = await requireOwner();

  const [tenant, activeSub, allPlugins, allThemes] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { outlets: { take: 1 } },
    }),
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      include: {
        licenseTier: true,
        plugins: {
          where: { isActive: true },
          include: { plugin: true },
        },
        theme: {
          include: { theme: true },
        },
      },
    }),
    prisma.plugin.findMany({
      where: { isActive: true },
    }),
    prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const isTrial = tenant.status === "TRIAL";
  const isPaidActive = tenant.status === "ACTIVE";
  const savedReceiptConfig = (tenant.receiptConfig as any) || {};

  const currentReceiptConfig: ReceiptConfig = {
    ...defaultReceiptConfig,
    ...savedReceiptConfig,
    logoUrl: tenant.logoUrl || savedReceiptConfig.logoUrl || null,
  };

  const activePluginCodes =
    (activeSub?.plugins || []).map((tp: any) => tp.plugin?.code) || [];

  const activeUiThemeId = activeSub?.theme?.themeId || null;

  // Purchased receipt themes (if trial, unlock all for demo testing)
  const purchasedThemeIds: string[] = isTrial
    ? [
        "FORE_CLEAN",
        "RETRO_COFFEE",
        "VINTAGE_BARBER",
        "GENTLEMAN_LOUNGE",
        "RETAIL_BARCODE",
        "COMPACT_ECO",
        "LAUNDRY_TRACKING",
        "EXPRESS_LAUNDRY",
        "LUXURY_MINIMAL",
      ]
    : currentReceiptConfig.purchasedThemeIds || ["FORE_CLEAN"];

  // Purchased POS layout themes (if trial, unlock all for demo testing)
  const purchasedLayoutIds: string[] = isTrial
    ? [
        "CAFE_QUICK_ORDER",
        "BARBERSHOP_STATION",
        "RETAIL_FAST_BARCODE",
        "LAUNDRY_WEIGHING",
      ]
    : currentReceiptConfig.purchasedLayoutIds || [
        "CAFE_QUICK_ORDER",
        "BARBERSHOP_STATION",
      ];

  const activePosLayout: PosLayoutType =
    (currentReceiptConfig.posLayout as PosLayoutType) || "STANDARD";

  // Dynamic DB-driven UI Themes, POS Layouts, and Receipt Themes
  const dynamicUiThemes = (allThemes as any[]).filter(
    (t: any) =>
      (t.tokens as any)?.packageType !== "POS_LAYOUT" &&
      (t.tokens as any)?.packageType !== "RECEIPT_PRESET" &&
      !t.code?.startsWith("pos-") &&
      !t.code?.startsWith("receipt-")
  );

  const dynamicReceiptThemes = (allThemes as any[])
    .filter(
      (t: any) =>
        (t.tokens as any)?.packageType === "RECEIPT_PRESET" ||
        t.code?.startsWith("receipt-") ||
        Boolean((t.tokens as any)?.receipt?.paperWidth) ||
        Boolean((t.tokens as any)?.receipt?.blocks?.length)
    )
    .map((t: any) => {
      const tokens = (t.tokens as any) || {};
      const rc = tokens.receipt || {};
      return {
        id: t.code,
        name: t.name,
        vertical: (tokens.vertical as BusinessVertical) || "GENERAL",
        verticalLabel: tokens.vertical || "Umum",
        style: (t.code as ReceiptTemplateStyle) || "DEFAULT",
        priceMonthly: Number(t.priceMonthly),
        description: tokens.description || `Blueprint struk ${rc.paperWidth || "80mm"}`,
        badge: Number(t.priceMonthly) === 0 ? "GRATIS" : "PREMIUM",
        previewImage: tokens.previewImages?.[0] || null,
        highlights: rc.blocks?.map((b: any) => b.type) || ["Struk Thermal"],
        sampleItems: tokens.sampleItems || [
          { name: "Kopi Susu Gula Aren", qty: 1, price: 22000, mods: ["Normal Ice", "Less Sweet"] },
          { name: "Iced Caramel Macchiato", qty: 1, price: 28000, mods: ["Extra Shot"] },
          { name: "Butter Croissant", qty: 1, price: 24000 },
        ],
      };
    });


  const dynamicPosLayouts = (allThemes as any[])
    .filter(
      (t: any) =>
        (t.tokens as any)?.packageType === "POS_LAYOUT" ||
        t.code?.startsWith("pos-") ||
        Boolean((t.tokens as any)?.layouts?.pos?.cartDock)
    )
    .map((t: any) => {
      const tokens = (t.tokens as any) || {};
      const pos = tokens.layouts?.pos || {};
      return {
        id: t.code,
        name: t.name,
        vertical: tokens.vertical || "GENERAL",
        verticalLabel: tokens.vertical || "Umum",
        layoutType: (t.code as PosLayoutType) || "STANDARD",
        priceMonthly: Number(t.priceMonthly),
        description: tokens.description || `Tata letak kasir dock ${pos.cartDock || "right"} ${pos.productGridColumns || 4} kolom`,
        badge: Number(t.priceMonthly) === 0 ? "GRATIS" : "PREMIUM",
        previewImage: tokens.previewImages?.[0] || null,
        features: [`Dock: ${pos.cartDock || "right"}`, `Grid: ${pos.productGridColumns || 4} Kolom`],
      };
    });

  const activePosThemeCode = (currentReceiptConfig as any).posThemeCode || (currentReceiptConfig.posLayout !== "STANDARD" && currentReceiptConfig.posLayout !== "CAFE_QUICK_ORDER" && currentReceiptConfig.posLayout !== "BARBERSHOP_STATION" && currentReceiptConfig.posLayout !== "RETAIL_FAST_BARCODE" && currentReceiptConfig.posLayout !== "LAUNDRY_WEIGHING" ? currentReceiptConfig.posLayout : null) || "DEFAULT";

  return JSON.parse(
    JSON.stringify({
      tenantId: tenant.id,
      businessName: tenant.businessName,
      logoUrl: tenant.logoUrl,
      isTrial,
      isPaidActive,
      licenseTier: activeSub?.licenseTier || null,
      activePluginCodes,
      plugins: allPlugins,
      uiThemes: dynamicUiThemes,
      activeUiThemeId,
      activeUiThemeCode: activeSub?.theme?.theme?.code || "default",
      activeUiThemeName: activeSub?.theme?.theme?.name || "Qassa Default Modern",
      receiptThemes: dynamicReceiptThemes,
      purchasedThemeIds,
      activeReceiptThemeId: currentReceiptConfig.templateStyle || "DEFAULT",
      posLayouts: dynamicPosLayouts,
      purchasedLayoutIds,
      activePosLayout: activePosThemeCode,
      receiptConfig: currentReceiptConfig,
      primaryOutlet: tenant.outlets[0] || null,
    })
  );
}


export async function purchaseReceiptThemeAction(themeId: string) {
  const user = await requireOwner();

  const [tenant, themeRecord] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
    }),
    prisma.theme.findFirst({
      where: { OR: [{ code: themeId }, { id: themeId }] },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const currentConfig: ReceiptConfig = {
    ...defaultReceiptConfig,
    ...((tenant.receiptConfig as any) || {}),
  };

  const existingPurchased = new Set(currentConfig.purchasedThemeIds || []);
  if (themeId !== "DEFAULT") {
    existingPurchased.add(themeId);
  }

  const tokens = (themeRecord?.tokens as any) || {};
  const rc = tokens.receipt || {};

  const updatedConfig: ReceiptConfig = {
    ...currentConfig,
    purchasedThemeIds: Array.from(existingPurchased),
    templateStyle: themeId as ReceiptTemplateStyle,
    dividerStyle: rc.dividerStyle || currentConfig.dividerStyle,
    fontScale: rc.fontScale || currentConfig.fontScale,
  };

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      receiptConfig: updatedConfig as any,
    },
  });

  revalidatePath("/dashboard/store");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pos");

  return { success: true, appliedTheme: themeRecord || { id: themeId, name: themeId } };
}

export async function purchasePosLayoutAction(layoutId: string) {
  const user = await requireOwner();

  const [tenant, layoutRecord] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
    }),
    prisma.theme.findFirst({
      where: { OR: [{ code: layoutId }, { id: layoutId }] },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const currentConfig: any = {
    ...defaultReceiptConfig,
    ...((tenant.receiptConfig as any) || {}),
  };

  const existingPurchased = new Set(currentConfig.purchasedLayoutIds || []);
  if (layoutId !== "DEFAULT") {
    existingPurchased.add(layoutId);
  }

  const updatedConfig: any = {
    ...currentConfig,
    purchasedLayoutIds: Array.from(existingPurchased),
    posThemeCode: layoutId === "DEFAULT" ? null : layoutId,
    posLayout: layoutId === "DEFAULT" ? "STANDARD" : layoutId,
  };

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      receiptConfig: updatedConfig,
    },
  });

  revalidatePath("/dashboard/store");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pos");

  return { success: true, appliedLayout: layoutRecord || { id: layoutId, name: layoutId === "DEFAULT" ? "Bawaan Tema UI" : layoutId } };
}


export async function applyUiThemeAction(themeId: string) {
  return await baseApplyThemeAction(themeId);
}

