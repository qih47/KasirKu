"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface UomLevel {
  unitName: string; // Misal: "DUS", "PACK", "LUSIN", "PCS"
  conversionFactor: number; // Misal: 1 DUS = 24 PCS
  price: number; // Harga jual pada level satuan ini
  barcode?: string;
  isDefault?: boolean;
}

/**
 * Menyimpan hierarki Multi-Satuan UOM untuk produk retail/supermarket.
 */
export async function saveProductUomLevelsAction(data: {
  productId: string;
  uomLevels: UomLevel[];
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const user = session.user as any;
  const { productId, uomLevels } = data;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: user.tenantId },
  });

  if (!product) throw new Error("Produk tidak ditemukan.");

  const currentAttrs = (product.attributes as any) || {};

  await prisma.product.update({
    where: { id: productId },
    data: {
      attributes: {
        ...currentAttrs,
        uomLevels,
        hasMultiUom: uomLevels.length > 0,
      },
    },
  });

  revalidatePath("/dashboard/retail");
  revalidatePath("/dashboard/products");
  revalidatePath("/pos");

  return { success: true, message: "Multi-satuan UOM berhasil disimpan!" };
}

/**
 * Mengambil konfigurasi Multi-Satuan UOM suatu produk.
 */
export async function getProductUomLevelsAction(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, price: true, attributes: true },
  });

  if (!product) return [];

  const uomLevels: UomLevel[] = (product.attributes as any)?.uomLevels || [];
  return uomLevels;
}
