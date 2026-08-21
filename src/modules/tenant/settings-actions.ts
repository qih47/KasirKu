"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengatur branding Bisnis.");
  }
  return session.user as any;
}

import {
  ReceiptConfig,
  defaultReceiptConfig,
  barbershopReceiptPreset,
  cafeReceiptPreset,
  retailReceiptPreset,
  laundryReceiptPreset,
  BusinessVertical,
} from "@/types/receipt";

export type { ReceiptConfig, BusinessVertical };

export async function getTenantSettingsData(explicitOutletId?: string) {
  const user = await requireOwner();

  const [tenant, activeSub, allThemes] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: {
          orderBy: { createdAt: "asc" },
        },
      },
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
    prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const isTrial = tenant.status === "TRIAL";
  const isPaidActive = tenant.status === "ACTIVE";
  const savedConfig = (tenant.receiptConfig as any) || {};

  // Deteksi vertikal dari plugin aktif atau nama bisnis
  const activePluginCode = activeSub?.plugins?.[0]?.plugin?.code?.toLowerCase() || "";
  const nameLower = tenant.businessName.toLowerCase();

  let detectedVertical: BusinessVertical = "CAFE";
  let defaultPreset = cafeReceiptPreset;

  if (savedConfig.vertical) {
    detectedVertical = savedConfig.vertical;
  } else if (activePluginCode.includes("barber") || nameLower.includes("barber") || nameLower.includes("potong")) {
    detectedVertical = "BARBERSHOP";
    defaultPreset = barbershopReceiptPreset;
  } else if (activePluginCode.includes("cafe") || nameLower.includes("kopi") || nameLower.includes("cafe") || nameLower.includes("coffee")) {
    detectedVertical = "CAFE";
    defaultPreset = cafeReceiptPreset;
  } else if (activePluginCode.includes("retail") || nameLower.includes("mart") || nameLower.includes("retail") || nameLower.includes("Bisnis")) {
    detectedVertical = "RETAIL";
    defaultPreset = retailReceiptPreset;
  } else if (activePluginCode.includes("laundry") || nameLower.includes("laundry") || nameLower.includes("cuci")) {
    detectedVertical = "LAUNDRY";
    defaultPreset = laundryReceiptPreset;
  }

  const mergedConfig: ReceiptConfig = {
    ...defaultPreset,
    ...savedConfig,
    vertical: detectedVertical,
    logoUrl: tenant.logoUrl || savedConfig.logoUrl || null,
  };

  const purchasedLayoutIds: string[] = savedConfig.purchasedLayoutIds || [];
  const purchasedThemeIds: string[] = savedConfig.purchasedThemeIds || [];
  const activeUiThemeId = activeSub?.theme?.themeId || null;

  // Saring hanya tema yang sudah dibeli / gratis / sedang aktif
  const ownedUiThemes = allThemes
    .filter(
      (t) =>
        (t.tokens as any)?.packageType !== "POS_LAYOUT" &&
        (t.tokens as any)?.packageType !== "RECEIPT_PRESET" &&
        !t.code?.startsWith("pos-") &&
        !t.code?.startsWith("receipt-") &&
        (Number(t.priceMonthly) === 0 || t.id === activeUiThemeId || isTrial)
    )
    .map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      priceMonthly: Number(t.priceMonthly),
    }));

  const ownedPosLayouts = allThemes
    .filter(
      (t) =>
        (t.tokens as any)?.packageType === "POS_LAYOUT" ||
        t.code?.startsWith("pos-") ||
        Boolean((t.tokens as any)?.layouts?.pos?.cartDock)
    )
    .filter(
      (t) =>
        Number(t.priceMonthly) === 0 ||
        purchasedLayoutIds.includes(t.code) ||
        purchasedLayoutIds.includes(t.id) ||
        isTrial
    )
    .map((t) => ({
      id: t.code,
      name: t.name,
      vertical: (t.tokens as any)?.vertical || "Umum",
    }));

  const ownedReceiptThemes = allThemes
    .filter(
      (t) =>
        (t.tokens as any)?.packageType === "RECEIPT_PRESET" ||
        t.code?.startsWith("receipt-") ||
        Boolean((t.tokens as any)?.receipt?.paperWidth)
    )
    .filter(
      (t) =>
        Number(t.priceMonthly) === 0 ||
        purchasedThemeIds.includes(t.code) ||
        purchasedThemeIds.includes(t.id) ||
        isTrial
    )
    .map((t) => ({
      id: t.code,
      name: t.name,
      vertical: (t.tokens as any)?.vertical || "Umum",
    }));

  const activePosLayout = savedConfig.posThemeCode || (savedConfig.posLayout !== "STANDARD" && savedConfig.posLayout !== "CAFE_QUICK_ORDER" && savedConfig.posLayout !== "BARBERSHOP_STATION" && savedConfig.posLayout !== "RETAIL_FAST_BARCODE" && savedConfig.posLayout !== "LAUNDRY_WEIGHING" ? savedConfig.posLayout : null) || "DEFAULT";

  const hasReceiptProPlugin =
    isTrial ||
    Boolean(
      activeSub?.plugins?.some(
        (p) =>
          p.plugin.code.toLowerCase().includes("receipt") ||
          p.plugin.code.toLowerCase().includes("custom")
      )
    ) ||
    savedConfig.hasReceiptProPlugin === true;

  const outlets = tenant.outlets || [];
  const selectedOutlet = explicitOutletId
    ? outlets.find((o) => o.id === explicitOutletId) || outlets[0] || null
    : outlets[0] || null;

  return JSON.parse(
    JSON.stringify({
      tenantId: tenant.id,
      businessName: tenant.businessName,
      logoUrl: tenant.logoUrl,
      receiptConfig: mergedConfig,
      detectedVertical,
      isTrial,
      isPaidActive,
      tierName: activeSub?.licenseTier?.name || (isTrial ? "Trial Aktif" : "Lisensi Aktif"),
      canCustomBrand: true,
      hasReceiptProPlugin,
      outlets,
      selectedOutlet,
      primaryOutlet: outlets[0] || null,
      ownedUiThemes,
      ownedPosLayouts,
      ownedReceiptThemes,
      activeUiThemeId,
      activePosLayout,
      activeReceiptTemplate: mergedConfig.templateStyle || "DEFAULT",
      shiftMode: tenant.shiftMode || "FAST",
    })
  );
}

export async function updateTenantShiftModeAction(shiftMode: "FAST" | "STRICT") {
  const user = await requireOwner();

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: { shiftMode },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/store");
  revalidatePath("/pos");
  return { success: true, shiftMode };
}

export async function updateTenantBrandingAction(data: {
  businessName: string;
  logoUrl?: string | null;
  receiptConfig?: Partial<ReceiptConfig>;
  phone?: string;
  address?: string;
  outletId?: string;
  activeUiThemeId?: string;
  activePosLayout?: string;
  activeReceiptTemplate?: string;
}) {
  const user = await requireOwner();

  const [tenant, activeSub] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
    }),
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const {
    businessName,
    logoUrl,
    receiptConfig,
    phone,
    address,
    outletId,
    activeUiThemeId,
    activePosLayout,
    activeReceiptTemplate,
  } = data;

  if (!businessName.trim()) {
    throw new Error("Nama brand / bisnis wajib diisi.");
  }

  const existingConfig = (tenant.receiptConfig as any) || defaultReceiptConfig;
  const updatedConfig: any = {
    ...existingConfig,
    ...receiptConfig,
    logoUrl: logoUrl !== undefined ? logoUrl : existingConfig.logoUrl,
    phone: phone !== undefined ? phone : existingConfig.phone,
    templateStyle: activeReceiptTemplate || receiptConfig?.templateStyle || existingConfig.templateStyle,
    posThemeCode: activePosLayout === "DEFAULT" ? null : (activePosLayout || existingConfig.posThemeCode),
    posLayout: activePosLayout === "DEFAULT" ? "STANDARD" : (activePosLayout || existingConfig.posLayout),
  };

  // Update tenant record
  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      businessName: businessName.trim(),
      logoUrl: logoUrl !== undefined ? logoUrl : tenant.logoUrl,
      receiptConfig: updatedConfig,
    },
  });

  // Update alamat outlet target jika ada
  let targetOutlet = null;
  if (outletId) {
    targetOutlet = await prisma.outlet.findFirst({
      where: { id: outletId, tenantId: user.tenantId },
    });
  }
  if (!targetOutlet) {
    targetOutlet = await prisma.outlet.findFirst({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "asc" },
    });
  }

  if (targetOutlet && address !== undefined) {
    await prisma.outlet.update({
      where: { id: targetOutlet.id },
      data: {
        address: address.trim() || null,
      },
    });
  }

  // Jika activeUiThemeId diubah, perbarui subscription theme
  if (activeUiThemeId && activeSub) {
    const targetTheme = await prisma.theme.findUnique({
      where: { id: activeUiThemeId },
    });
    if (targetTheme) {
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
    }
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/store");
  revalidatePath("/pos");
  return { success: true };
}
