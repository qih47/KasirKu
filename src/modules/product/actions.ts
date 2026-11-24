"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { resolveProductVertical } from "@/lib/vertical-helpers";

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
  const isBranchAdmin = user.role === "ADMIN_CABANG";
  const targetOutletId = isBranchAdmin ? user.outletId : (explicitOutletId || user.outletId);

  const [products, outlets, activeTenantPlugins] = await Promise.all([
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
    prisma.tenantPlugin.findMany({
      where: {
        subscription: { tenantId: user.tenantId, isActive: true },
        isActive: true,
      },
      include: { plugin: true },
    }),
  ]);

  const hasBarbershopPlugin = (activeTenantPlugins as any[]).some((tp: any) => tp.plugin?.code === "barbershop");
  const hasCafePlugin = (activeTenantPlugins as any[]).some((tp: any) => tp.plugin?.code === "cafe");
  const hasLaundryPlugin = (activeTenantPlugins as any[]).some((tp: any) => tp.plugin?.code === "laundry");
  const hasRetailPlugin = (activeTenantPlugins as any[]).some((tp: any) => tp.plugin?.code === "retail") || (!hasBarbershopPlugin && !hasCafePlugin && !hasLaundryPlugin);

  const activeVertical: "BARBERSHOP" | "CAFE" | "LAUNDRY" | "RETAIL" = hasBarbershopPlugin
    ? "BARBERSHOP"
    : hasCafePlugin
    ? "CAFE"
    : hasLaundryPlugin
    ? "LAUNDRY"
    : "RETAIL";

  // Jika diakses oleh kasir spesifik atau outlet terpilih, transform stok & harga efektif
  const formattedProducts = (products as any[]).map((p: any) => {
    const specificStock = targetOutletId
      ? (p.outletStocks || []).find((s: any) => s.outletId === targetOutletId)
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
  const totalBarang = (formattedProducts as any[]).filter((p: any) => p.type === "BARANG").length;
  const totalJasa = (formattedProducts as any[]).filter((p: any) => p.type === "JASA").length;
  const lowStockCount = (formattedProducts as any[]).filter(
    (p: any) => p.type === "BARANG" && (p.effectiveStockQty ?? 0) <= (p.minStockAlert ?? 5)
  ).length;

  const categories = Array.from(
    new Set((formattedProducts as any[]).map((p: any) => p.category).filter(Boolean) as string[])
  );

  return {
    products: JSON.parse(JSON.stringify(formattedProducts)),
    outlets: JSON.parse(JSON.stringify(isBranchAdmin ? outlets.filter((o: any) => o.id === user.outletId) : outlets)),
    categories,
    selectedOutletId: isBranchAdmin ? user.outletId : (targetOutletId || null),
    activeVertical,
    verticalFlags: {
      isBarbershop: hasBarbershopPlugin,
      isCafe: hasCafePlugin,
      isLaundry: hasLaundryPlugin,
      isRetail: hasRetailPlugin,
    },
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

  const resolvedVertical = resolveProductVertical({
    category: category?.trim() || "Umum",
    type,
    attributes: attributes || {},
  });

  const mergedAttributes = {
    ...(attributes || {}),
    verticalType: (attributes?.verticalType || resolvedVertical).toUpperCase(),
  };

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
      attributes: mergedAttributes,
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

  const effectiveAttrs = attributes || (existing.attributes as any) || {};
  const resolvedVertical = resolveProductVertical({
    category: category?.trim() || existing.category,
    type: type || (existing.type as any),
    attributes: effectiveAttrs,
  });

  const mergedAttributes = {
    ...effectiveAttrs,
    verticalType: (effectiveAttrs.verticalType || resolvedVertical).toUpperCase(),
  };

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
      attributes: mergedAttributes,
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
    } else if (type === "BARANG" && finalStock !== null && finalStock !== existing.stockQty && outlet.id === (existing.outletId || activeOutlets[0]?.id)) {
      // Jika user mengedit stok produk dari tabel utama, sinkronkan ke cabang utama
      await prisma.outletStock.update({
        where: { id: existingStock.id },
        data: { stockQty: finalStock },
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

  if (user.role === "ADMIN_CABANG" && outletId !== user.outletId) {
    throw new Error("Akses ditolak: Admin Cabang hanya dapat menyesuaikan stok di cabangnya sendiri.");
  }

  if (qty < 0) {
    throw new Error("Jumlah stok tidak boleh bernilai negatif.");
  }

  if (user.role === "ADMIN_CABANG" && outletId !== user.outletId) {
    throw new Error("Akses ditolak: Admin Cabang hanya dapat mengubah ketersediaan di cabangnya sendiri.");
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

  let defaultMovementNote = "Penyesuaian Stok";
  if (mode === "ADD") {
    newQty = currentQty + qty;
    movementType = "IN";
    defaultMovementNote = "Penambahan Stok (Restock)";
  } else if (mode === "SUBTRACT") {
    if (currentQty < qty) {
      throw new Error(`Stok saat ini (${currentQty}) tidak mencukupi untuk pengurangan ${qty}.`);
    }
    newQty = currentQty - qty;
    movementType = "OUT";
    defaultMovementNote = "Pengurangan Stok";
  } else if (mode === "SET") {
    newQty = qty;
    movementType = "ADJUSTMENT";
    movementQty = Math.abs(qty - currentQty);
    const diff = qty - currentQty;
    defaultMovementNote = diff >= 0
      ? `Stok Opname: Selisih Lebih (+${diff}) [Fisik: ${qty}, Sistem: ${currentQty}]`
      : `Stok Opname: Selisih Kurang (${diff}) [Fisik: ${qty}, Sistem: ${currentQty}]`;
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
      note: note || defaultMovementNote,
      status: "CONFIRMED",
    },
  });

  // Sinkronkan stok agregat di tabel Product agar selalu sejalan dengan total seluruh cabang
  const allOutletStocks = await prisma.outletStock.findMany({
    where: { productId },
    select: { stockQty: true },
  });
  const totalAggregateStock = allOutletStocks.reduce((sum: number, s: any) => sum + Number(s.stockQty || 0), 0);

  await prisma.product.update({
    where: { id: productId },
    data: { stockQty: totalAggregateStock },
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

  if (user.role === "ADMIN_CABANG" && outletId !== user.outletId) {
    throw new Error("Akses ditolak: Admin Cabang hanya dapat mengubah harga di cabangnya sendiri.");
  }

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

  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      transactionItems: { take: 1 },
      bookings: { take: 1 },
    },
  });

  if (!existing || existing.tenantId !== user.tenantId) {
    throw new Error("Produk tidak ditemukan.");
  }

  // Jika produk sudah memiliki riwayat transaksi / booking, lakukan soft-delete agar laporan historis tidak rusak
  if ((existing as any).transactionItems?.length > 0 || (existing as any).bookings?.length > 0) {
    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { isActive: false },
      }),
      prisma.outletStock.updateMany({
        where: { productId: id },
        data: { isAvailable: false },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.stockMovement.deleteMany({
        where: { outletStock: { productId: id } },
      }),
      prisma.outletStock.deleteMany({
        where: { productId: id },
      }),
      prisma.product.delete({
        where: { id },
      }),
    ]);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
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
  if (user.role === "ADMIN_CABANG" && fromOutletId !== user.outletId) {
    throw new Error("Akses ditolak: Transfer stok hanya dapat diinisiasi dari cabang asal tempat Anda bertugas.");
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

  const fromStock = product.outletStocks.find((s: any) => s.outletId === fromOutletId);
  const currentFromQty = fromStock ? fromStock.stockQty : (product.stockQty ?? 0);

  if (currentFromQty < qty) {
    throw new Error(
      `Stok di ${fromOutlet.name} tidak mencukupi. Sisa stok: ${currentFromQty} unit, permintaan transfer: ${qty} unit.`
    );
  }

  const transferRefCode = `TRF-${Date.now().toString().slice(-6)}`;

  // Run atomic transfer transaction
  const result = await prisma.$transaction(async (tx: any) => {
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

