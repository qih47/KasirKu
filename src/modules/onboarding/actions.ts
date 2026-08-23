"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type VerticalIndustryType = "BARBERSHOP" | "CAFE" | "LAUNDRY" | "RETAIL";

export interface OnboardingSetupInput {
  businessName: string;
  outletName: string;
  address?: string;
  phone?: string;
  vertical: VerticalIndustryType;
  seedSampleData: boolean;
}

/**
 * Menyuntikkan template starter pack katalog produk, meja, kursi, dan konfigurasi struk
 * sesuai industri vertikal pilihan merchant.
 */
export async function setupTenantIndustryVerticalAction(data: OnboardingSetupInput) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const user = session.user as any;
  const tenantId = user.tenantId;
  const { businessName, outletName, address, phone, vertical, seedSampleData } = data;

  const vCode = vertical.toLowerCase();

  // 1. Ambil atau Buat Plugin yang Sesuai
  const plugin = await prisma.plugin.findUnique({
    where: { code: vCode },
  });

  // 2. Ambil Outlet Aktif
  let outlet = await prisma.outlet.findFirst({
    where: { tenantId, isActive: true },
  });

  if (!outlet) {
    outlet = await prisma.outlet.create({
      data: {
        tenantId,
        name: outletName || "Cabang Utama",
        address: address || "",
      },
    });
  } else if (outletName || address) {
    outlet = await prisma.outlet.update({
      where: { id: outlet.id },
      data: {
        name: outletName || outlet.name,
        address: address !== undefined ? address : outlet.address,
      },
    });
  }

  // Pastikan user owner memiliki outletId utama terhubung
  if (outlet) {
    await prisma.user.updateMany({
      where: { tenantId, role: "OWNER", outletId: null },
      data: { outletId: outlet.id },
    });
  }

  // 3. Update Business Name & Receipt Config
  let receiptConfig: any = {
    vertical,
    paperSize: "58mm",
    showLogo: false,
    showAddress: true,
    showPhone: true,
    phone: phone || "",
    outletName: outlet.name,
    headerText: `Selamat Datang di ${businessName}`,
    footerText: "Terima kasih atas kunjungan Anda!",
  };

  if (vertical === "BARBERSHOP") {
    receiptConfig.posLayout = "BARBERSHOP_STATION";
    receiptConfig.cashierLabel = "Kasir & Kapster";
  } else if (vertical === "CAFE") {
    receiptConfig.posLayout = "CAFE_QUICK_ORDER";
    receiptConfig.showTableNumber = true;
    receiptConfig.showOrderType = true;
    receiptConfig.showPb1 = true;
    receiptConfig.pb1Percent = 10;
    receiptConfig.showServiceCharge = true;
    receiptConfig.servicePercent = 5;
  } else if (vertical === "LAUNDRY") {
    receiptConfig.posLayout = "LAUNDRY_WEIGHING";
    receiptConfig.cashierLabel = "Operator Laundry";
  } else if (vertical === "RETAIL") {
    receiptConfig.posLayout = "RETAIL_FAST_BARCODE";
    receiptConfig.showTax = true;
    receiptConfig.taxPercent = 11;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      businessName: businessName || undefined,
      receiptConfig,
    },
  });

  // 4. Hubungkan Plugin ke Subscription Aktif
  const activeSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId, isActive: true },
  });

  if (activeSub && plugin) {
    await prisma.tenantPlugin.upsert({
      where: {
        subscriptionId_pluginId: {
          subscriptionId: activeSub.id,
          pluginId: plugin.id,
        },
      },
      update: { isActive: true },
      create: {
        subscriptionId: activeSub.id,
        pluginId: plugin.id,
        isActive: true,
      },
    });
  }

  // 5. Seed Starter Pack Data jika dipilih
  if (seedSampleData) {
    if (vertical === "BARBERSHOP") {
      // Jasa Pangkas
      const barberServices = [
        { name: "Gentlemen Haircut", price: 45000, category: "HAIRCUT", type: "JASA" },
        { name: "Haircut + Wash & Tonic", price: 60000, category: "HAIRCUT", type: "JASA" },
        { name: "Kids Haircut", price: 35000, category: "HAIRCUT", type: "JASA" },
        { name: "Shaving & Hot Towel", price: 25000, category: "TREATMENT", type: "JASA" },
        { name: "Creambath & Head Massage", price: 50000, category: "TREATMENT", type: "JASA" },
        { name: "Hair Color Black / Brown", price: 120000, category: "COLORING", type: "JASA" },
        // Produk Retail
        { name: "Waterbased Pomade Strong 100g", price: 75000, category: "PRODUCT", type: "BARANG", stockQty: 24, barcode: "POM-001" },
        { name: "Matte Clay Texture 100g", price: 85000, category: "PRODUCT", type: "BARANG", stockQty: 18, barcode: "CLAY-001" },
        { name: "Cooling Hair Tonic 150ml", price: 45000, category: "PRODUCT", type: "BARANG", stockQty: 30, barcode: "TONIC-001" },
      ];

      for (const item of barberServices) {
        await prisma.product.create({
          data: {
            tenantId,
            outletId: outlet.id,
            name: item.name,
            price: item.price,
            category: item.category,
            type: item.type as any,
            stockQty: item.stockQty ?? null,
            barcode: item.barcode ?? null,
            isActive: true,
          },
        });
      }
    } else if (vertical === "CAFE") {
      // Meja Cafe
      const sampleTables = [
        { tableNumber: "01", capacity: 2, areaZone: "INDOOR" },
        { tableNumber: "02", capacity: 4, areaZone: "INDOOR" },
        { tableNumber: "03", capacity: 4, areaZone: "INDOOR" },
        { tableNumber: "04", capacity: 6, areaZone: "INDOOR" },
        { tableNumber: "05", capacity: 4, areaZone: "OUTDOOR" },
        { tableNumber: "06", capacity: 4, areaZone: "OUTDOOR" },
        { tableNumber: "VIP-1", capacity: 8, areaZone: "VIP" },
      ];

      for (const t of sampleTables) {
        await (prisma.cafeTable as any).create({
          data: {
            tenantId,
            outletId: outlet.id,
            tableNumber: t.tableNumber,
            capacity: t.capacity,
            areaZone: t.areaZone,
            status: "AVAILABLE",
          },
        }).catch(() => {});
      }

      // Produk Menu Cafe
      const cafeMenu = [
        { name: "Caffe Latte", price: 28000, category: "ESPRESSO", type: "BARANG", stockQty: 100 },
        { name: "Americano Ice", price: 22000, category: "ESPRESSO", type: "BARANG", stockQty: 100 },
        { name: "Caramel Macchiato", price: 32000, category: "SIGNATURE", type: "BARANG", stockQty: 80 },
        { name: "Matcha Fusion Latte", price: 30000, category: "NON_COFFEE", type: "BARANG", stockQty: 80 },
        { name: "Nasi Goreng Spesial Cafe", price: 35000, category: "MAIN_COURSE", type: "BARANG", stockQty: 50 },
        { name: "Croissant Butter", price: 25000, category: "PASTRY", type: "BARANG", stockQty: 30 },
        { name: "French Fries BBQ", price: 20000, category: "SNACK", type: "BARANG", stockQty: 60 },
      ];

      for (const item of cafeMenu) {
        await prisma.product.create({
          data: {
            tenantId,
            outletId: outlet.id,
            name: item.name,
            price: item.price,
            category: item.category,
            type: item.type as any,
            stockQty: item.stockQty,
            isActive: true,
          },
        });
      }
    } else if (vertical === "LAUNDRY") {
      const laundryServices = [
        { name: "Cuci Kering Setrika (Kiloan)", price: 8000, category: "KILOAN", type: "JASA" },
        { name: "Cuci Basah (Kiloan)", price: 5000, category: "KILOAN", type: "JASA" },
        { name: "Setrika Saja (Kiloan)", price: 5000, category: "KILOAN", type: "JASA" },
        { name: "Bedcover King Size", price: 30000, category: "SATUAN", type: "JASA" },
        { name: "Jas Pria / Blazer", price: 25000, category: "SATUAN", type: "JASA" },
        { name: "Cuci Sepatu Sneaker", price: 35000, category: "SATUAN", type: "JASA" },
      ];

      for (const item of laundryServices) {
        await prisma.product.create({
          data: {
            tenantId,
            outletId: outlet.id,
            name: item.name,
            price: item.price,
            category: item.category,
            type: item.type as any,
            isActive: true,
          },
        });
      }
    } else if (vertical === "RETAIL") {
      const retailProducts = [
        { name: "Beras Premium 5 Kg", price: 72000, category: "SEMBAKO", barcode: "8991001", stockQty: 50 },
        { name: "Minyak Goreng Pouch 2 Liter", price: 34000, category: "SEMBAKO", barcode: "8991002", stockQty: 60 },
        { name: "Gula Pasir Kristal 1 Kg", price: 17500, category: "SEMBAKO", barcode: "8991003", stockQty: 80 },
        { name: "Kopi Bubuk Arabika 250g", price: 28000, category: "MINUMAN", barcode: "8991004", stockQty: 40 },
        { name: "Air Mineral Botol 600ml", price: 3500, category: "MINUMAN", barcode: "8991005", stockQty: 120 },
        { name: "Keripik Kentang Renyah 68g", price: 11000, category: "SNACK", barcode: "8991006", stockQty: 75 },
        { name: "Sabun Cuci Piring 750ml", price: 14000, category: "KEBERSIHAN", barcode: "8991007", stockQty: 45 },
      ];

      for (const item of retailProducts) {
        await prisma.product.create({
          data: {
            tenantId,
            outletId: outlet.id,
            name: item.name,
            price: item.price,
            category: item.category,
            type: "BARANG",
            stockQty: item.stockQty,
            barcode: item.barcode,
            isActive: true,
          },
        });
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/pos");

  return {
    success: true,
    message: `Setup industri ${vertical} berhasil diselesaikan!`,
    outletId: outlet.id,
  };
}
