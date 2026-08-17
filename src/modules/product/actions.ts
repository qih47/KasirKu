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

export async function getProductsData() {
  const user = await requireTenantUser();

  const products = await prisma.product.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    include: { outlet: true },
  });

  const totalItems = products.length;
  const totalBarang = products.filter((p) => p.type === "BARANG").length;
  const totalJasa = products.filter((p) => p.type === "JASA").length;
  const lowStockCount = products.filter(
    (p) => p.type === "BARANG" && (p.stockQty ?? 0) <= 5
  ).length;

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  );

  return {
    products,
    categories,
    metrics: {
      totalItems,
      totalBarang,
      totalJasa,
      lowStockCount,
    },
  };
}

export async function createProductAction(data: {
  name: string;
  type: ProductType;
  price: number;
  barcode?: string;
  category?: string;
  stockQty?: number | null;
  attributes?: Record<string, any>;
}) {
  const user = await requireTenantUser();
  const { name, type, price, barcode, category, stockQty, attributes } = data;

  if (!name || price === undefined || price < 0) {
    throw new Error("Nama dan harga produk wajib diisi dengan benar.");
  }

  // Jika tipe JASA, stockQty selalu null
  const finalStock = type === "JASA" ? null : (stockQty ?? 0);

  const product = await prisma.product.create({
    data: {
      tenantId: user.tenantId,
      outletId: user.outletId || null,
      name: name.trim(),
      type,
      price,
      barcode: barcode?.trim() || null,
      category: category?.trim() || "Umum",
      stockQty: finalStock,
      attributes: attributes || {},
      isActive: true,
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
  return { success: true, product };
}

export async function updateProductAction(
  id: string,
  data: {
    name: string;
    type: ProductType;
    price: number;
    barcode?: string;
    category?: string;
    stockQty?: number | null;
    attributes?: Record<string, any>;
  }
) {
  const user = await requireTenantUser();
  const { name, type, price, barcode, category, stockQty, attributes } = data;

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
      barcode: barcode?.trim() || null,
      category: category?.trim() || "Umum",
      stockQty: finalStock,
      attributes: attributes || existing.attributes || {},
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");
  return { success: true, product: updated };
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
