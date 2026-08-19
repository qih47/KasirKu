"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type DuplicateStrategy = "UPDATE_EXISTING" | "SKIP_EXISTING" | "CREATE_NEW";

export interface ParsedProductRow {
  name: string;
  type: "BARANG" | "JASA";
  price: number;
  category?: string;
  stockQty?: number | null;
  barcode?: string;
  imageUrl?: string;
  rowNumber?: number;
}

export interface ImportResult {
  totalProcessed: number;
  totalImported: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  errors: Array<{ row: number; item: string; error: string }>;
}

async function requireTenantUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login sebagai akun bisnis.");
  }
  return session.user as any;
}

export async function importProductsBatchAction(params: {
  rows: ParsedProductRow[];
  duplicateStrategy: DuplicateStrategy;
  targetOutletId?: string;
}): Promise<ImportResult> {
  const user = await requireTenantUser();
  const { rows, duplicateStrategy, targetOutletId } = params;

  if (!rows || rows.length === 0) {
    throw new Error("Tidak ada data produk untuk diimpor.");
  }

  const tenantId = user.tenantId;
  const outletId = targetOutletId || user.outletId || null;

  // Ambil semua produk tenant yang ada saat ini untuk pengecekan duplikat
  const existingProducts = await prisma.product.findMany({
    where: { tenantId },
    select: { id: true, name: true, barcode: true, stockQty: true, type: true },
  });

  // Buat index pencarian cepat berdasarkan barcode dan nama
  const barcodeMap = new Map<string, typeof existingProducts[0]>();
  const nameMap = new Map<string, typeof existingProducts[0]>();

  existingProducts.forEach((p) => {
    if (p.barcode) barcodeMap.set(p.barcode.toLowerCase().trim(), p);
    nameMap.set(p.name.toLowerCase().trim(), p);
  });

  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const errors: Array<{ row: number; item: string; error: string }> = [];

  const itemsToCreate: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = row.rowNumber || i + 1;

    try {
      const cleanName = row.name?.trim();
      const cleanPrice = Number(row.price);

      if (!cleanName) {
        throw new Error("Nama produk tidak boleh kosong.");
      }
      if (isNaN(cleanPrice) || cleanPrice < 0) {
        throw new Error(`Harga produk '${cleanName}' tidak valid (${row.price}).`);
      }

      const cleanType: "BARANG" | "JASA" =
        row.type?.toUpperCase() === "JASA" ? "JASA" : "BARANG";
      const cleanStock = cleanType === "JASA" ? null : (Number(row.stockQty) || 0);
      const cleanBarcode = row.barcode?.trim() || null;
      const cleanCategory = row.category?.trim() || "Umum";
      const cleanImage = row.imageUrl?.trim() || null;

      // Cek apakah item sudah ada di database
      let existingMatch: typeof existingProducts[0] | undefined;
      if (cleanBarcode) {
        existingMatch = barcodeMap.get(cleanBarcode.toLowerCase());
      }
      if (!existingMatch) {
        existingMatch = nameMap.get(cleanName.toLowerCase());
      }

      if (existingMatch && duplicateStrategy !== "CREATE_NEW") {
        if (duplicateStrategy === "SKIP_EXISTING") {
          totalSkipped += 1;
          continue;
        }

        if (duplicateStrategy === "UPDATE_EXISTING") {
          // Update item yang sudah ada
          const updatedStock =
            cleanType === "JASA"
              ? null
              : (existingMatch.stockQty ?? 0) + (cleanStock ?? 0);

          await prisma.product.update({
            where: { id: existingMatch.id },
            data: {
              name: cleanName,
              type: cleanType,
              price: cleanPrice,
              category: cleanCategory,
              stockQty: updatedStock,
              barcode: cleanBarcode || existingMatch.barcode,
              imageUrl: cleanImage || undefined,
            },
          });

          totalUpdated += 1;
          continue;
        }
      }

      // Siapkan item untuk di-insert baru
      itemsToCreate.push({
        tenantId,
        outletId,
        name: cleanName,
        type: cleanType,
        price: cleanPrice,
        category: cleanCategory,
        stockQty: cleanStock,
        barcode: cleanBarcode,
        imageUrl: cleanImage,
        isActive: true,
        attributes: {},
      });

      // Update map lokal agar baris berikutnya di CSV yang duplikat juga terdeteksi
      const fakeObj = {
        id: "temp",
        name: cleanName,
        barcode: cleanBarcode,
        stockQty: cleanStock,
        type: cleanType,
      };
      if (cleanBarcode) barcodeMap.set(cleanBarcode.toLowerCase(), fakeObj);
      nameMap.set(cleanName.toLowerCase(), fakeObj);
    } catch (err: any) {
      totalFailed += 1;
      errors.push({
        row: rowNum,
        item: row.name || `Baris ${rowNum}`,
        error: err.message || "Data tidak valid",
      });
    }
  }

  // Batch insert ke PostgreSQL dalam chunks 200 items per batch
  const CHUNK_SIZE = 200;
  for (let i = 0; i < itemsToCreate.length; i += CHUNK_SIZE) {
    const chunk = itemsToCreate.slice(i, i + CHUNK_SIZE);
    await prisma.product.createMany({
      data: chunk,
    });
    totalImported += chunk.length;
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/pos");

  return {
    totalProcessed: rows.length,
    totalImported,
    totalUpdated,
    totalSkipped,
    totalFailed,
    errors,
  };
}
