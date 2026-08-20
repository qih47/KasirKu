import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai Inisialisasi & Migrasi Database Qassa POS...");

  // 1. SEED LICENSE TIERS
  console.log("📦 1. Seeding License Tiers (Basic, Pro, Enterprise)...");
  const licenseTiers = [
    {
      code: "basic",
      name: "Lisensi Basic",
      priceMonthly: 150000,
      priceAnnual: 1494000, // 150.000 * 12 * 0.83 (17% diskon)
      outletLimit: 1,
      kasirLimitPerOutlet: 5,
      hasAdminCabang: false,
      hasConsolidatedReport: false,
      hasApiAccess: false,
    },
    {
      code: "pro",
      name: "Lisensi Pro",
      priceMonthly: 500000,
      priceAnnual: 4980000, // 500.000 * 12 * 0.83 (17% diskon)
      outletLimit: 10,
      kasirLimitPerOutlet: null, // Unlimited
      hasAdminCabang: true,
      hasConsolidatedReport: true,
      hasApiAccess: false,
    },
    {
      code: "enterprise",
      name: "Lisensi Enterprise",
      priceMonthly: 0, // Custom / Hubungi Sales
      priceAnnual: 0,
      outletLimit: null, // Unlimited
      kasirLimitPerOutlet: null, // Unlimited
      hasAdminCabang: true,
      hasConsolidatedReport: true,
      hasApiAccess: true,
    },
  ];

  for (const tier of licenseTiers) {
    await prisma.licenseTier.upsert({
      where: { code: tier.code },
      update: tier,
      create: tier,
    });
  }

  // 2. SEED PLUGINS (VERTIKAL BISNIS & ADD-ONS)
  console.log("🧩 2. Seeding Plugin Modul Vertikal & Add-ons...");
  const plugins = [
    {
      code: "cafe",
      name: "Cafe / F&B",
      description: "Modul manajemen denah meja & split bill, kitchen order ticket (KOT), modifier menu, dan kasir resto.",
      priceMonthly: 100000,
      priceAnnual: 996000,
    },
    {
      code: "retail",
      name: "Retail & Minimarket",
      description: "Modul barcode & SKU scanner lanjutan, grosir, varian produk, dan stok multi-gudang.",
      priceMonthly: 60000,
      priceAnnual: 597600,
    },
    {
      code: "barbershop",
      name: "Barbershop & Salon",
      description: "Modul booking jadwal & nomor antrian pelanggan, komisi per staff/kapster/stylist.",
      priceMonthly: 50000,
      priceAnnual: 498000,
    },
    {
      code: "laundry",
      name: "Laundry Tracking",
      description: "Modul tracking timbangan/kg, status cuci/kering/setrika, dan invoice estimasi selesai.",
      priceMonthly: 40000,
      priceAnnual: 398400,
    },
    {
      code: "receipt_designer",
      name: "Premium Receipt Studio",
      description: "Koleksi template struk eksklusif, visual layout builder, divider custom, split print dapur, & kupon repeat order.",
      priceMonthly: 29000,
      priceAnnual: 290000,
    },
    {
      code: "self_order",
      name: "QR Self-Order & Live Order",
      description: "Pemesanan mandiri pelanggan via scan QR meja/area dengan sinkronisasi Live Order real-time ke POS kasir.",
      priceMonthly: 75000,
      priceAnnual: 747000,
    },
  ];

  for (const plugin of plugins) {
    await prisma.plugin.upsert({
      where: { code: plugin.code },
      update: plugin,
      create: plugin,
    });
  }

  // 3. SEED THEMES, POS LAYOUTS & RECEIPT PRESETS
  console.log("🎨 3. Seeding Tema UI, Layout POS & Template Struk...");
  const themes = [
    // A. UI Themes
    {
      code: "default",
      name: "Default Modern (Qassa Indigo)",
      type: "DEFAULT" as const,
      priceMonthly: 0,
      tokens: {
        primary: "#4F46E5",
        accent: "#6366F1",
        radius: "1rem",
        cardBg: "#FFFFFF",
        cardBorder: "#E2E8F0",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        innerBoxBg: "#F8FAFC",
        inputBg: "#FFFFFF",
        description: "Tema bawaan resmi Qassa POS dengan aksen indigo bersih.",
      },
    },
    {
      code: "theme-artisan-emerald",
      name: "Artisan Cafe Emerald",
      type: "PRESET" as const,
      priceMonthly: 25000,
      tokens: {
        primary: "#059669",
        accent: "#10B981",
        radius: "1.25rem",
        cardBg: "#FFFFFF",
        cardBorder: "#E2E8F0",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        innerBoxBg: "#F0FDF4",
        inputBg: "#FFFFFF",
        description: "Tema visual bernuansa hijau kopi artisan segar dan estetik.",
      },
    },
    {
      code: "theme-dark-cyber-pro",
      name: "Dark Cyber Pro",
      type: "PRESET" as const,
      priceMonthly: 35000,
      tokens: {
        primary: "#818CF8",
        accent: "#6366F1",
        radius: "1.5rem",
        cardBg: "#111A2E",
        cardBorder: "#1E293B",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        innerBoxBg: "#162035",
        inputBg: "#0F172A",
        description: "Tema dark mode elegan bertenaga tinggi untuk kenyamanan mata.",
      },
    },
    // B. POS Layouts
    {
      code: "pos-cafe-table",
      name: "Layout POS Resto & Meja",
      type: "PRESET" as const,
      priceMonthly: 0,
      tokens: {
        packageType: "POS_LAYOUT",
        vertical: "Cafe / Resto",
        layouts: {
          pos: {
            cartDock: "RIGHT",
            gridColumns: 4,
            showTableSelector: true,
          },
        },
      },
    },
    {
      code: "pos-retail-barcode",
      name: "Layout POS Fast Barcode",
      type: "PRESET" as const,
      priceMonthly: 0,
      tokens: {
        packageType: "POS_LAYOUT",
        vertical: "Retail",
        layouts: {
          pos: {
            cartDock: "LEFT",
            gridColumns: 3,
            fastBarcodeMode: true,
          },
        },
      },
    },
    // C. Receipt Presets
    {
      code: "receipt-compact-58mm",
      name: "Struk Kompak 58mm",
      type: "PRESET" as const,
      priceMonthly: 0,
      tokens: {
        packageType: "RECEIPT_PRESET",
        vertical: "Umum",
        receipt: {
          paperWidth: "58mm",
          divider: "DASHED",
          fontScale: "COMPACT",
        },
      },
    },
    {
      code: "receipt-modern-thermal-80mm",
      name: "Struk Resto Modern 80mm",
      type: "PRESET" as const,
      priceMonthly: 0,
      tokens: {
        packageType: "RECEIPT_PRESET",
        vertical: "Cafe / Resto",
        receipt: {
          paperWidth: "80mm",
          divider: "DOUBLE",
          fontScale: "NORMAL",
        },
      },
    },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { code: theme.code },
      update: theme,
      create: theme,
    });
  }

  // 4. SEED SUPER ADMIN PLATFORM
  console.log("👑 4. Seeding Akun Super Admin Platform...");
  const adminPasswordHash = await bcrypt.hash("admin123456", 10);
  await prisma.superAdmin.upsert({
    where: { email: "admin@qassa.id" },
    update: {
      name: "Super Admin Qassa",
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "Super Admin Qassa",
      email: "admin@qassa.id",
      passwordHash: adminPasswordHash,
    },
  });

  // 5. SEED SAMPLE DEMO TENANT & OUTLET (SIAP PAKAI)
  console.log("🏪 5. Seeding Demo Tenant Toko & Akun Kasir...");
  const ownerPasswordHash = await bcrypt.hash("owner123456", 10);
  const cashierPasswordHash = await bcrypt.hash("kasir123456", 10);

  // Cari Lisensi Basic & Plugin Cafe
  const basicTier = await prisma.licenseTier.findUnique({ where: { code: "basic" } });
  const cafePlugin = await prisma.plugin.findUnique({ where: { code: "cafe" } });
  const defaultTheme = await prisma.theme.findUnique({ where: { code: "default" } });

  let demoTenant = await prisma.tenant.findFirst({
    where: { businessName: "Kopi Senja Nusantara" },
  });

  if (!demoTenant) {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    demoTenant = await prisma.tenant.create({
      data: {
        businessName: "Kopi Senja Nusantara",
        status: "ACTIVE",
        trialEndAt: trialEndDate,
        receiptConfig: {
          templateStyle: "DEFAULT",
          showLogo: true,
          showAddress: true,
          showPhone: true,
          showCashier: true,
          showTableNumber: true,
          showQueueNumber: true,
          showOrderType: true,
          showPb1: true,
          pb1Percent: 10,
          showServiceCharge: true,
          servicePercent: 5,
          showPoweredBy: true,
          footerText: "Terima kasih atas kunjungan Anda di Kopi Senja!",
          socialMediaInstagram: "@kopisenja.id",
          socialMediaTiktok: "@kopisenja.official",
          socialMediaWebsite: "kopisenja.id",
        },
      },
    });

    // Buat Outlet Utama
    const primaryOutlet = await prisma.outlet.create({
      data: {
        tenantId: demoTenant.id,
        name: "Outlet Pusat Senja Jakarta",
        address: "Jl. Sudirman No. 45, Jakarta Selatan",
      },
    });

    // Buat User Owner
    await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        name: "Owner Kopi Senja",
        email: "owner@qassa.id",
        passwordHash: ownerPasswordHash,
        role: "OWNER",
      },
    });

    // Buat User Kasir
    await prisma.user.create({
      data: {
        tenantId: demoTenant.id,
        outletId: primaryOutlet.id,
        name: "Kasir Rian",
        email: "kasir@qassa.id",
        passwordHash: cashierPasswordHash,
        role: "KASIR",
      },
    });

    // Buat Subscription Aktif
    if (basicTier) {
      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const sub = await prisma.tenantSubscription.create({
        data: {
          tenantId: demoTenant.id,
          licenseTierId: basicTier.id,
          billingCycle: "MONTHLY",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          isActive: true,
        },
      });

      if (cafePlugin) {
        await prisma.tenantPlugin.create({
          data: {
            subscriptionId: sub.id,
            pluginId: cafePlugin.id,
            isActive: true,
          },
        });
      }

      if (defaultTheme) {
        await prisma.tenantTheme.create({
          data: {
            subscriptionId: sub.id,
            themeId: defaultTheme.id,
          },
        });
      }
    }

    // Buat Sample Produk
    await prisma.product.createMany({
      data: [
        {
          tenantId: demoTenant.id,
          outletId: primaryOutlet.id,
          name: "Kopi Susu Gula Aren",
          price: 22000,
          category: "Kopi & Minuman",
          barcode: "KOP-001",
          stockQty: 150,
          type: "BARANG",
        },
        {
          tenantId: demoTenant.id,
          outletId: primaryOutlet.id,
          name: "Iced Caramel Macchiato",
          price: 28000,
          category: "Kopi & Minuman",
          barcode: "KOP-002",
          stockQty: 120,
          type: "BARANG",
        },
        {
          tenantId: demoTenant.id,
          outletId: primaryOutlet.id,
          name: "Butter Croissant",
          price: 24000,
          category: "Pastry & Makanan",
          barcode: "PAS-001",
          stockQty: 45,
          type: "BARANG",
        },
      ],
    });
  }

  console.log("\n========================================================");
  console.log("✅ MIGRASI & SEED DATABASE BERHASIL SELESAI!");
  console.log("========================================================");
  console.log("🔑 Akun Super Admin:  email: admin@qassa.id | pass: admin123456");
  console.log("🔑 Akun Demo Owner:   email: owner@qassa.id | pass: owner123456");
  console.log("🔑 Akun Demo Kasir:   email: kasir@qassa.id | pass: kasir123456");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat migrasi database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
