import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || !user?.tenantId) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda harus login sebagai akun bisnis." },
        { status: 401 }
      );
    }

    const tenantId = user.tenantId;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file gambar logo yang diunggah." },
        { status: 400 }
      );
    }

    // Buat direktori upload logo tenant jika belum ada
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos", tenantId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name) || ".webp";
    const fileName = `logo_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/logos/${tenantId}/${fileName}`;

    // Update langsung logoUrl di database tenant
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentReceiptConfig = (currentTenant?.receiptConfig as any) || {};
    const updatedReceiptConfig = {
      ...currentReceiptConfig,
      logoUrl: publicUrl,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl: publicUrl,
        receiptConfig: updatedReceiptConfig,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    revalidatePath("/dashboard/receipt-designer");

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      message: "Logo berhasil diunggah dan disimpan ke profil bisnis.",
    });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah logo bisnis." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || !user?.tenantId) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda harus login sebagai akun bisnis." },
        { status: 401 }
      );
    }

    const tenantId = user.tenantId;
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentReceiptConfig = (currentTenant?.receiptConfig as any) || {};
    const updatedReceiptConfig = {
      ...currentReceiptConfig,
      logoUrl: null,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl: null,
        receiptConfig: updatedReceiptConfig,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    revalidatePath("/dashboard/receipt-designer");

    return NextResponse.json({
      success: true,
      message: "Logo berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("Logo delete error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus logo bisnis." },
      { status: 500 }
    );
  }
}
