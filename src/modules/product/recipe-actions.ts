"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface RecipeIngredient {
  ingredientProductId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

/**
 * Menyimpan resep / Bill of Materials (BOM) untuk menu produk Cafe/F&B.
 */
export async function saveProductRecipeAction(data: {
  productId: string;
  recipe: RecipeIngredient[];
}) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const user = session.user as any;
  const { productId, recipe } = data;

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
        recipe,
        hasRecipe: recipe.length > 0,
      },
    },
  });

  revalidatePath("/dashboard/cafe");
  revalidatePath("/dashboard/products");

  return { success: true, message: "Resep Bill of Materials (BOM) berhasil disimpan!" };
}

/**
 * Mengambil resep menu dan stok bahan baku real-time.
 */
export async function getProductRecipeAction(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak.");
  }

  const user = session.user as any;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: user.tenantId },
  });

  if (!product) throw new Error("Produk tidak ditemukan.");

  const recipe: RecipeIngredient[] = ((product.attributes as any)?.recipe || []);

  const ingredientIds = (recipe as any[]).map((r: any) => r.ingredientProductId);
  const ingredientProducts = await prisma.product.findMany({
    where: { id: { in: ingredientIds }, tenantId: user.tenantId },
  });

  const enrichedRecipe = (recipe as any[]).map((r: any) => {
    const found = (ingredientProducts as any[]).find((ip: any) => ip.id === r.ingredientProductId);
    return {
      ...r,
      currentStock: found?.stockQty ?? 0,
      ingredientPrice: Number(found?.price || 0),
    };
  });

  return {
    productId,
    productName: product.name,
    recipe: enrichedRecipe,
  };
}

/**
 * Mengurangi stok bahan baku secara otomatis saat transaksi kasir diselesaikan.
 */
export async function deductRecipeIngredients(
  tx: any,
  items: Array<{ productId: string; qty: number }>,
  outletId: string,
  referenceId: string
) {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) continue;

    const recipe: RecipeIngredient[] = (product.attributes as any)?.recipe || [];
    if (recipe.length === 0) continue;

    for (const ing of recipe) {
      // Pastikan takaran pecahan (misal 0.018 kg atau 0.2 L) minimal memotong 1 satuan terkecil di DB
      const rawDeduct = Number(ing.quantity || 0) * Number(item.qty || 1);
      const totalQtyToDeduct = rawDeduct > 0 && rawDeduct < 1 ? 1 : Math.round(rawDeduct);
      if (totalQtyToDeduct <= 0) continue;

      // Kurangi stok di produk bahan baku master
      await tx.product.update({
        where: { id: ing.ingredientProductId },
        data: {
          stockQty: {
            decrement: totalQtyToDeduct,
          },
        },
      }).catch(() => {});

      // Sinkronkan ke OutletStock cabang (buat otomatis jika belum ada)
      let targetOutletStock = await tx.outletStock.findFirst({
        where: { outletId, productId: ing.ingredientProductId },
      });

      if (!targetOutletStock) {
        targetOutletStock = await tx.outletStock.create({
          data: {
            outletId,
            productId: ing.ingredientProductId,
            stockQty: 0 - totalQtyToDeduct,
            isAvailable: true,
          },
        }).catch(() => null);
      } else {
        targetOutletStock = await tx.outletStock.update({
          where: { id: targetOutletStock.id },
          data: {
            stockQty: {
              decrement: totalQtyToDeduct,
            },
          },
        }).catch(() => null);
      }

      if (targetOutletStock) {
        await tx.stockMovement.create({
          data: {
            outletStockId: targetOutletStock.id,
            type: "OUT",
            qty: totalQtyToDeduct,
            note: `BOM: Pemakaian resep ${item.qty}x ${product.name}`,
            referenceId,
            status: "CONFIRMED",
          },
        }).catch(() => {});
      }
    }
  }
}

/**
 * Mengembalikan stok bahan baku secara otomatis saat transaksi kasir di-void/dibatalkan.
 */
export async function restoreRecipeIngredients(
  tx: any,
  items: Array<{ productId: string; qty: number }>,
  outletId: string,
  referenceId: string,
  reason?: string
) {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) continue;

    const recipe: RecipeIngredient[] = (product.attributes as any)?.recipe || [];
    if (recipe.length === 0) continue;

    for (const ing of recipe) {
      const rawRestore = Number(ing.quantity || 0) * Number(item.qty || 1);
      const totalQtyToRestore = rawRestore > 0 && rawRestore < 1 ? 1 : Math.round(rawRestore);
      if (totalQtyToRestore <= 0) continue;

      // Kembalikan stok di produk bahan baku master
      await tx.product.update({
        where: { id: ing.ingredientProductId },
        data: {
          stockQty: {
            increment: totalQtyToRestore,
          },
        },
      }).catch(() => {});

      // Kembalikan stok bahan baku di outlet
      let targetOutletStock = await tx.outletStock.findFirst({
        where: { outletId, productId: ing.ingredientProductId },
      });

      if (!targetOutletStock) {
        targetOutletStock = await tx.outletStock.create({
          data: {
            outletId,
            productId: ing.ingredientProductId,
            stockQty: totalQtyToRestore,
            isAvailable: true,
          },
        }).catch(() => null);
      } else {
        targetOutletStock = await tx.outletStock.update({
          where: { id: targetOutletStock.id },
          data: {
            stockQty: {
              increment: totalQtyToRestore,
            },
          },
        }).catch(() => null);
      }

      if (targetOutletStock) {
        await tx.stockMovement.create({
          data: {
            outletStockId: targetOutletStock.id,
            type: "IN",
            qty: totalQtyToRestore,
            note: `BOM Void: Pengembalian resep ${item.qty}x ${product.name}${reason ? ` (${reason})` : ""}`,
            referenceId,
            status: "CONFIRMED",
          },
        }).catch(() => {});
      }
    }
  }
}
