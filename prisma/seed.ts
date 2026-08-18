import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding License Tiers...");
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
      priceAnnual: 4980000, // 500.000 * 12 * 0.83
      outletLimit: 10,
      kasirLimitPerOutlet: null, // Unlimited
      hasAdminCabang: true,
      hasConsolidatedReport: true,
      hasApiAccess: false,
    },
    {
      code: "enterprise",
      name: "Lisensi Enterprise",
      priceMonthly: 0, // Nego / Custom
      priceAnnual: 0,
      outletLimit: null, // Custom / unlimited
      kasirLimitPerOutlet: null,
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

  console.log("Seeding Plugins...");
  const plugins = [
    {
      code: "barbershop",
      name: "Barbershop / Salon",
      description: "Modul booking & antrian pelanggan, komisi per staff/kapster",
      priceMonthly: 50000,
      priceAnnual: 498000, // 50.000 * 12 * 0.83
    },
    {
      code: "retail",
      name: "Retail",
      description: "Modul barcode/SKU lanjutan, varian produk, dan stok multi-gudang",
      priceMonthly: 60000,
      priceAnnual: 597600, // 60.000 * 12 * 0.83
    },
    {
      code: "laundry",
      name: "Laundry",
      description: "Modul tracking status invoice laundry dan estimasi selesai",
      priceMonthly: 40000,
      priceAnnual: 398400, // 40.000 * 12 * 0.83
    },
    {
      code: "cafe",
      name: "Cafe / F&B",
      description: "Modul manajemen meja & split bill, kitchen order ticket (KOT), modifier menu",
      priceMonthly: 100000,
      priceAnnual: 996000, // 100.000 * 12 * 0.83
    },
    {
      code: "receipt_designer",
      name: "Premium Receipt Studio",
      description: "Koleksi template struk eksklusif, visual layout builder, divider custom, split print struk dapur, dan generator voucher promo otomatis.",
      priceMonthly: 29000,
      priceAnnual: 290000,
    },
  ];

  for (const plugin of plugins) {
    await prisma.plugin.upsert({
      where: { code: plugin.code },
      update: plugin,
      create: plugin,
    });
  }

  console.log("Seeding Themes...");
  const themes = [
    {
      code: "default",
      name: "Default Modern",
      type: "DEFAULT" as const,
      priceMonthly: 0,
      tokens: {
        primaryColor: "#4f46e5",
        accentColor: "#6366f1",
        borderRadius: "0.5rem",
      },
    },
    {
      code: "dark-slate",
      name: "Dark Slate Velvet",
      type: "PRESET" as const,
      priceMonthly: 25000,
      tokens: {
        primaryColor: "#0ea5e9",
        accentColor: "#38bdf8",
        borderRadius: "0.75rem",
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

  console.log("Seeding Super Admin Platform...");
  const defaultPasswordHash = await bcrypt.hash("admin123456", 10);
  await prisma.superAdmin.upsert({
    where: { email: "admin@qassa.id" },
    update: {
      name: "Super Admin Qassa",
      passwordHash: defaultPasswordHash,
    },
    create: {
      name: "Super Admin Qassa",
      email: "admin@qassa.id",
      passwordHash: defaultPasswordHash,
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
