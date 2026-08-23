import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.tenantId) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda harus login sebagai akun bisnis." },
        { status: 401 }
      );
    }

    const tenantId = (session.user as any).tenantId;
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const originalNamesRaw = formData.getAll("originalNames") as string[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada file gambar yang diunggah." },
        { status: 400 }
      );
    }

    // Buat direktori upload tenant jika belum ada
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products", tenantId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const results: Array<{
      originalName: string;
      savedFileName: string;
      publicUrl: string;
      matchedProductId?: string;
      matchedProductName?: string;
    }> = [];

    // Ambil seluruh produk tenant untuk pencocokan otomatis
    const tenantProducts = await prisma.product.findMany({
      where: { tenantId },
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = originalNamesRaw[i] || file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      // Sanitasi nama file agar aman disimpan di filesystem
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(uploadDir, sanitizedName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/products/${tenantId}/${sanitizedName}`;

      // Cari produk yang cocok
      // 1. Cocok dengan imageUrl yang berisi nama file asli (misal: 'kopi-senja.jpg' atau 'kopi-senja.webp')
      // 2. Cocok dengan barcode (misal file dinamai '89923451.webp')
      // 3. Cocok dengan nama produk yang disanitasi
      const baseOriginal = originalName.replace(/\.[^/.]+$/, "").toLowerCase().trim();
      const baseSanitized = sanitizedName.replace(/\.[^/.]+$/, "").toLowerCase().trim();

      const matchedProduct = (tenantProducts as any[]).find((p: any) => {
        if (p.imageUrl) {
          const pImgBase = p.imageUrl.split("/").pop()?.replace(/\.[^/.]+$/, "").toLowerCase();
          if (pImgBase === baseOriginal || pImgBase === baseSanitized || p.imageUrl === originalName) {
            return true;
          }
        }
        if (p.barcode && p.barcode.toLowerCase() === baseOriginal) {
          return true;
        }
        if (p.name.toLowerCase().trim() === baseOriginal) {
          return true;
        }
        return false;
      });

      if (matchedProduct) {
        // Update URL foto di database
        await prisma.product.update({
          where: { id: matchedProduct.id },
          data: { imageUrl: publicUrl },
        });

        results.push({
          originalName,
          savedFileName: sanitizedName,
          publicUrl,
          matchedProductId: matchedProduct.id,
          matchedProductName: matchedProduct.name,
        });
      } else {
        results.push({
          originalName,
          savedFileName: sanitizedName,
          publicUrl,
        });
      }
    }

    const totalMatched = results.filter((r) => r.matchedProductId).length;

    return NextResponse.json({
      success: true,
      totalUploaded: files.length,
      totalMatched,
      results,
    });
  } catch (error: any) {
    console.error("Upload Product Images Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah foto produk." },
      { status: 500 }
    );
  }
}
