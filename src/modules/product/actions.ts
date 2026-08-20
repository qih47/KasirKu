"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ProductType = "BARANG" | "JASA";

async function requireTenantUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login sebagai pengguna tenant.");
  }
  return session.user as any;
}

export async function getProductsData(explicitOutletId?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    return {
      products: [],
      categories: [],
      outlets: [],
      selectedOutletId: null,
      metrics: { totalItems: 0, totalBarang: 0, totalJasa: 0, lowStockCount: 0 },
    };
  }

  const user = session.user as any;
  const targetOutletId = explicitOutletId || user.outletId;

  const [products, outlets] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        outlet: true,
        outletStocks: {
          include: {
            outlet: true,
            movements: {
              take: 5,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    }),
    prisma.outlet.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Jika diakses oleh kasir spesifik atau outlet terpilih, transform stok & harga efektif
  const formattedProducts = products.map((p) => {
    const specificStock = targetOutletId
      ? p.outletStocks.find((s) => s.outletId === targetOutletId)
      : null;

    const effectiveStockQty =
      p.type === "JASA"
        ? null
        : specificStock
        ? specificStock.stockQty
        : p.stockQty ?? 0;

    const effectivePrice = specificStock?.priceOverride
      ? Number(specificStock.priceOverride)
      : Number(p.price);

    const isAvailableInOutlet = specificStock ? specificStock.isAvailable : p.isActive;
    const minAlert = p.minStockAlert ?? 5;
    const isOutOfStock = p.type === "BARANG" && (effectiveStockQty ?? 0) <= 0;
    const isLowStock = p.type === "BARANG" && !isOutOfStock && (effectiveStockQty ?? 0) <= minAlert;

    return {
      ...p,
      price: Number(p.price),
      effectivePrice,
      effectiveStockQty,
      isAvailableInOutlet,
      stockQty: effectiveStockQty,
      minStockAlert: minAlert,
      isOutOfStock,
      isLowStock,
    };
  });

  const totalItems = formattedProducts.length;
  const totalBarang = formattedProducts.filter((p) => p.type === "BARANG").length;
  const totalJasa = formattedProducts.filter((p) => p.type === "JASA").length;
  const lowStockCount = formattedProducts.filter(
    (p) => p.type === "BARANG" && (p.effectiveStockQty ?? 0) <= (p.minStockAlert ?? 5)
  ).length;

  const categories = Array.from(
    new Set(formattedProducts.map((p) => p.category).filter(Boolean) as string[])
  );

  return {
    products: JSON.parse(JSON.stringify(formattedProducts)),
    outlets: JSON.parse(JSON.stringify(outlets)),
    categories,
    selectedOutletId: targetOutletId || null,
    metrics: {
      totalItems,
      totalBarang,
      totalJasa,
      lowStockCount,
    },
  };
}

export async function getLowStockAlertProductsAction(explicitOutletId?: string) {
  const user = await requireTenantUser();
  const targetOutletId = explicitOutletId || user.outletId;

  const data = await getProductsData(targetOutletId);
  const lowStockProducts = data.products.filter(
    (p: any) => p.type === "BARANG" && (p.effectiveStockQty ?? 0) <= (p.minStockAlert ?? 5)
  );

  return {
    count: lowStockProducts.length,
    products: lowStockProducts,
  };
}

export async function createProductAction(data: {
  name: string;
  type: ProductType;
  price: number;
  imageUrl?: string;
  barcode?: string;
  category?: string;
  stockQty?: number | null;
  minStockAlert?: number;
  outletId?: string | null;
  attributes?: Record<string, any>;
}) {
  const user = await requireTenantUser();
  const { name, type, price, imageUrl, barcode, category, stockQty, minStockAlert, outletId, attributes } = data;

  if (!name || price === undefined || price < 0) {
    throw new Error("Nama dan harga produk wajib diisi dengan benar.");
  }

  // Jika tipe JASA, stockQty selalu null
  const finalStock = type === "JASA" ? null : (stockQty ?? 0);

  const product = await prisma.product.create({
    data: {
      tenantId: user.tenantId,
      outletId: outletId !== undefined ? outletId : (user.outletId || null),
      name: name.trim(),
      type,
      price,
      imageUrl: imageUrl?.trim() || null,
      barcode: barcode?.trim() || null,
      category: category?.trim() || "Umum",
      stockQty: finalStock,
      minStockAlert: minStockAlert !== undefined && minStockAlert >= 0 ? minStockAlert : 5,
      attributes: attributes || {},
      isActive: true,
    },
  });

  // Otomatis buatkan record OutletStock & StockMovement di semua outlet aktif tenant
  const activeOutlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId, isActive: true },
  });

  for (const outlet of activeOutlets) {
    const newStock = await prisma.outletStock.create({
      data: {
        outletId: outlet.id,
        productId: product.id,
        stockQty: finalStock ?? 0,
        isAvailable: true,
        priceOverride: null,
      },
    });

    if (type === "BARANG" && (finalStock ?? 0) > 0) {
      await prisma.stockMovement.create({
        data: {
          outletStockId: newStock.id,
          type: "IN",
          qty: finalStock ?? 0,
          note: "Stok awal produk baru",
          status: "CONFIRMED",
        },
      });
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { success: true, product };
}

export async function updateProductAction(
  id: string,
  data: {
    name: string;
    type: ProductType;
    price: number;
    imageUrl?: string;
    barcode?: string;
    category?: string;
    stockQty?: number | null;
    minStockAlert?: number;
    attributes?: Record<string, any>;
  }
) {
  const user = await requireTenantUser();
  const { name, type, price, imageUrl, barcode, category, stockQty, minStockAlert, attributes } = data;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  const finalStock = type === "JASA" ? null : (stockQty ?? 0);

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: name.trim(),
      type,
      price,
      imageUrl: imageUrl !== undefined ? (imageUrl.trim() || null) : existing.imageUrl,
      barcode: barcode?.trim() || null,
      category: category?.trim() || "Umum",
      stockQty: finalStock,
      minStockAlert: minStockAlert !== undefined && minStockAlert >= 0 ? minStockAlert : existing.minStockAlert,
      attributes: attributes || existing.attributes || {},
    },
  });

  // Pastikan record OutletStock tersedia di semua outlet aktif tenant
  const activeOutlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId, isActive: true },
  });

  for (const outlet of activeOutlets) {
    const existingStock = await prisma.outletStock.findUnique({
      where: {
        outletId_productId: {
          outletId: outlet.id,
          productId: id,
        },
      },
    });

    if (!existingStock) {
      await prisma.outletStock.create({
        data: {
          outletId: outlet.id,
          productId: id,
          stockQty: finalStock ?? 0,
          isAvailable: true,
          priceOverride: null,
        },
      });
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { success: true, product: updated };
}

export async function getProductStockDetailsAction(productId: string) {
  const user = await requireTenantUser();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      outletStocks: {
        include: {
          outlet: true,
          movements: {
            orderBy: { createdAt: "desc" },
            take: 30,
          },
        },
      },
    },
  });

  if (!product || product.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  return JSON.parse(JSON.stringify(product));
}

export async function updateOutletStockAction(data: {
  outletId: string;
  productId: string;
  mode: "ADD" | "SUBTRACT" | "SET";
  qty: number;
  note?: string;
}) {
  const user = await requireTenantUser();
  const { outletId, productId, mode, qty, note } = data;

  if (qty < 0) {
    throw new Error("Jumlah stok tidak boleh bernilai negatif.");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  const existingStock = await prisma.outletStock.findUnique({
    where: {
      outletId_productId: {
        outletId,
        productId,
      },
    },
  });

  const currentQty = existingStock ? existingStock.stockQty : (product.stockQty ?? 0);
  let newQty = currentQty;
  let movementType: "IN" | "OUT" | "ADJUSTMENT" = "ADJUSTMENT";
  let movementQty = qty;

  if (mode === "ADD") {
    newQty = currentQty + qty;
    movementType = "IN";
  } else if (mode === "SUBTRACT") {
    if (currentQty < qty) {
      throw new Error(`Stok saat ini (${currentQty}) tidak mencukupi untuk pengurangan ${qty}.`);
    }
    newQty = currentQty - qty;
    movementType = "OUT";
  } else if (mode === "SET") {
    newQty = qty;
    movementType = "ADJUSTMENT";
    movementQty = Math.abs(qty - currentQty);
  }

  const outletStock = await prisma.outletStock.upsert({
    where: {
      outletId_productId: {
        outletId,
        productId,
      },
    },
    create: {
      outletId,
      productId,
      stockQty: Math.max(0, newQty),
      isAvailable: true,
    },
    update: {
      stockQty: Math.max(0, newQty),
    },
  });

  // Catat riwayat pergerakan ke tabel ledger
  await prisma.stockMovement.create({
    data: {
      outletStockId: outletStock.id,
      type: movementType,
      qty: movementQty,
      performedById: user.id || null,
      note:
        note ||
        (mode === "ADD"
          ? "Penambahan Stok (Restock)"
          : mode === "SUBTRACT"
          ? "Pengurangan Stok"
          : "Stok Opname / Penyesuaian Fisik"),
      status: "CONFIRMED",
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
  return { success: true, outletStock, newQty };
}

export async function toggleProductOutletAvailabilityAction(data: {
  outletId: string;
  productId: string;
  isAvailable: boolean;
}) {
  const user = await requireTenantUser();
  const { outletId, productId, isAvailable } = data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  const updated = await prisma.outletStock.upsert({
    where: {
      outletId_productId: {
        outletId,
        productId,
      },
    },
    create: {
      outletId,
      productId,
      stockQty: product.stockQty ?? 0,
      isAvailable,
    },
    update: {
      isAvailable,
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
  return { success: true, outletStock: updated };
}

export async function updateProductOutletPriceAction(data: {
  outletId: string;
  productId: string;
  priceOverride: number | null;
}) {
  const user = await requireTenantUser();
  const { outletId, productId, priceOverride } = data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  const updated = await prisma.outletStock.upsert({
    where: {
      outletId_productId: {
        outletId,
        productId,
      },
    },
    create: {
      outletId,
      productId,
      stockQty: product.stockQty ?? 0,
      priceOverride: priceOverride !== null && priceOverride >= 0 ? priceOverride : null,
      isAvailable: true,
    },
    update: {
      priceOverride: priceOverride !== null && priceOverride >= 0 ? priceOverride : null,
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
  return { success: true, outletStock: updated };
}

export async function toggleProductStatusAction(id: string) {
  const user = await requireTenantUser();

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function deleteProductAction(id: string) {
  const user = await requireTenantUser();

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  await prisma.product.delete({
    where: { id },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function transferProductStockAction(data: {
  productId: string;
  fromOutletId: string;
  toOutletId: string;
  qty: number;
  note?: string;
}) {
  const user = await requireTenantUser();
  const { productId, fromOutletId, toOutletId, qty, note } = data;

  if (!fromOutletId || !toOutletId) {
    throw new Error("Cabang asal dan cabang tujuan harus dipilih.");
  }
  if (fromOutletId === toOutletId) {
    throw new Error("Cabang asal dan tujuan tidak boleh sama.");
  }
  if (isNaN(qty) || qty <= 0) {
    throw new Error("Jumlah unit yang ditransfer harus lebih besar dari 0.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      outletStocks: {
        where: {
          outletId: { in: [fromOutletId, toOutletId] },
        },
        include: { outlet: true },
      },
    },
  });

  if (!product || product.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  const [fromOutlet, toOutlet] = await Promise.all([
    prisma.outlet.findUnique({ where: { id: fromOutletId } }),
    prisma.outlet.findUnique({ where: { id: toOutletId } }),
  ]);

  if (!fromOutlet || fromOutlet.tenantId !== user.tenantId) {
    throw new Error("Cabang asal tidak valid.");
  }
  if (!toOutlet || toOutlet.tenantId !== user.tenantId) {
    throw new Error("Cabang tujuan tidak valid.");
  }

  const fromStock = product.outletStocks.find((s) => s.outletId === fromOutletId);
  const currentFromQty = fromStock ? fromStock.stockQty : (product.stockQty ?? 0);

  if (currentFromQty < qty) {
    throw new Error(
      `Stok di ${fromOutlet.name} tidak mencukupi. Sisa stok: ${currentFromQty} unit, permintaan transfer: ${qty} unit.`
    );
  }

  const transferRefCode = `TRF-${Date.now().toString().slice(-6)}`;

  // Run atomic transfer transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Deduct from source outlet
    const updatedFrom = await tx.outletStock.upsert({
      where: {
        outletId_productId: {
          outletId: fromOutletId,
          productId,
        },
      },
      create: {
        outletId: fromOutletId,
        productId,
        stockQty: Math.max(0, currentFromQty - qty),
        isAvailable: true,
      },
      update: {
        stockQty: { decrement: qty },
      },
    });

    // 2. Add to destination outlet
    const updatedTo = await tx.outletStock.upsert({
      where: {
        outletId_productId: {
          outletId: toOutletId,
          productId,
        },
      },
      create: {
        outletId: toOutletId,
        productId,
        stockQty: qty,
        isAvailable: true,
      },
      update: {
        stockQty: { increment: qty },
      },
    });

    // 3. Write StockMovement TRANSFER_OUT
    await tx.stockMovement.create({
      data: {
        outletStockId: updatedFrom.id,
        type: "TRANSFER_OUT",
        qty: qty,
        performedById: user.id || null,
        referenceId: transferRefCode,
        note: `Transfer ke ${toOutlet.name}${note ? `: ${note}` : ""}`,
        status: "CONFIRMED",
      },
    });

    // 4. Write StockMovement TRANSFER_IN
    await tx.stockMovement.create({
      data: {
        outletStockId: updatedTo.id,
        type: "TRANSFER_IN",
        qty: qty,
        performedById: user.id || null,
        referenceId: transferRefCode,
        note: `Diterima dari ${fromOutlet.name}${note ? `: ${note}` : ""}`,
        status: "CONFIRMED",
      },
    });

    return { updatedFrom, updatedTo };
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
  return {
    success: true,
    transferRefCode,
    fromOutletName: fromOutlet.name,
    toOutletName: toOutlet.name,
    qty,
  };
}

