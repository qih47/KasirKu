"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis.");
  }
  return session.user as any;
}

export interface VoucherItem {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isExpired: boolean;
  isQuotaFull: boolean;
  createdAt: string;
}

export interface VoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  totalRedeemed: number;
  expiredVouchers: number;
}

export interface VoucherValidationResult {
  code: string;
  type: "PERCENT" | "FIXED";
  discountValue: number;
  discountAmount: number;
  description: string;
  minOrder: number;
  maxDiscount?: number;
}

// 1. Ambil List Voucher & Statistik untuk Tenant Dashboard
export async function getVouchersData(params?: {
  search?: string;
  status?: "ALL" | "ACTIVE" | "EXPIRED" | "INACTIVE";
}): Promise<{ vouchers: VoucherItem[]; stats: VoucherStats }> {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    return {
      vouchers: [],
      stats: { totalVouchers: 0, activeVouchers: 0, totalRedeemed: 0, expiredVouchers: 0 },
    };
  }
  const user = session.user as any;
  const now = new Date();

  const rawVouchers = await prisma.voucher.findMany({
    where: {
      tenantId: user.tenantId,
      ...(params?.search
        ? {
          OR: [
            { code: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
          ],
        }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  let totalRedeemed = 0;
  let activeCount = 0;
  let expiredCount = 0;

  const formatted: VoucherItem[] = rawVouchers.map((v: any) => {
    const isExpired = v.endDate ? new Date(v.endDate) < now : false;
    const isQuotaFull = v.usageLimit !== null ? v.usedCount >= v.usageLimit : false;
    const isCurrentlyActive = v.isActive && !isExpired && !isQuotaFull;

    if (isCurrentlyActive) activeCount++;
    if (isExpired) expiredCount++;
    totalRedeemed += v.usedCount;

    return {
      id: v.id,
      code: v.code,
      description: v.description,
      discountType: v.discountType as "PERCENT" | "FIXED",
      discountValue: Number(v.discountValue),
      minOrder: Number(v.minOrder),
      maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
      usageLimit: v.usageLimit,
      usedCount: v.usedCount,
      startDate: v.startDate ? v.startDate.toISOString() : null,
      endDate: v.endDate ? v.endDate.toISOString() : null,
      isActive: v.isActive,
      isExpired,
      isQuotaFull,
      createdAt: v.createdAt.toISOString(),
    };
  });

  // Filter status jika dipilih
  let filtered = formatted;
  if (params?.status === "ACTIVE") {
    filtered = formatted.filter((v) => v.isActive && !v.isExpired && !v.isQuotaFull);
  } else if (params?.status === "EXPIRED") {
    filtered = formatted.filter((v) => v.isExpired);
  } else if (params?.status === "INACTIVE") {
    filtered = formatted.filter((v) => !v.isActive);
  }

  return {
    vouchers: filtered,
    stats: {
      totalVouchers: rawVouchers.length,
      activeVouchers: activeCount,
      totalRedeemed,
      expiredVouchers: expiredCount,
    },
  };
}

// 2. Buat Voucher Baru
export async function createVoucherAction(data: {
  code: string;
  description?: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}) {
  const user = await requireAuth();

  const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, "");
  if (!cleanCode) {
    throw new Error("Kode kupon voucher wajib diisi.");
  }

  if (data.discountValue <= 0) {
    throw new Error("Nilai diskon harus lebih besar dari 0.");
  }

  if (data.discountType === "PERCENT" && data.discountValue > 100) {
    throw new Error("Diskon persentase tidak boleh melebihi 100%.");
  }

  // Cek duplikasi kode kupon pada tenant yang sama
  const existing = await prisma.voucher.findUnique({
    where: {
      tenantId_code: {
        tenantId: user.tenantId,
        code: cleanCode,
      },
    },
  });

  if (existing) {
    throw new Error(`Kode voucher "${cleanCode}" sudah digunakan di Bisnis Anda. Gunakan kode lain.`);
  }

  const voucher = await prisma.voucher.create({
    data: {
      tenantId: user.tenantId,
      code: cleanCode,
      description: data.description?.trim() || null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrder: data.minOrder || 0,
      maxDiscount: data.maxDiscount || null,
      usageLimit: data.usageLimit || null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  revalidatePath("/dashboard/vouchers");
  revalidatePath("/pos");

  return { success: true, voucher };
}

// 3. Edit Voucher
export async function updateVoucherAction(
  id: string,
  data: {
    code?: string;
    description?: string;
    discountType?: "PERCENT" | "FIXED";
    discountValue?: number;
    minOrder?: number;
    maxDiscount?: number;
    usageLimit?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }
) {
  const user = await requireAuth();

  const voucher = await prisma.voucher.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!voucher) {
    throw new Error("Voucher tidak ditemukan.");
  }

  let cleanCode = voucher.code;
  if (data.code) {
    cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, "");
    if (cleanCode !== voucher.code) {
      const duplicate = await prisma.voucher.findUnique({
        where: {
          tenantId_code: {
            tenantId: user.tenantId,
            code: cleanCode,
          },
        },
      });
      if (duplicate) {
        throw new Error(`Kode voucher "${cleanCode}" sudah digunakan.`);
      }
    }
  }

  const updated = await prisma.voucher.update({
    where: { id },
    data: {
      code: cleanCode,
      description: data.description !== undefined ? data.description.trim() || null : voucher.description,
      discountType: data.discountType || voucher.discountType,
      discountValue: data.discountValue !== undefined ? data.discountValue : voucher.discountValue,
      minOrder: data.minOrder !== undefined ? data.minOrder : voucher.minOrder,
      maxDiscount: data.maxDiscount !== undefined ? (data.maxDiscount || null) : voucher.maxDiscount,
      usageLimit: data.usageLimit !== undefined ? (data.usageLimit || null) : voucher.usageLimit,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : voucher.startDate,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : voucher.endDate,
      isActive: data.isActive !== undefined ? data.isActive : voucher.isActive,
    },
  });

  revalidatePath("/dashboard/vouchers");
  revalidatePath("/pos");

  return { success: true, voucher: updated };
}

// 4. Toggle Status Aktif / Non-aktif
export async function toggleVoucherStatusAction(id: string, isActive: boolean) {
  const user = await requireAuth();

  const voucher = await prisma.voucher.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!voucher) {
    throw new Error("Voucher tidak ditemukan.");
  }

  const updated = await prisma.voucher.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/dashboard/vouchers");
  revalidatePath("/pos");

  return { success: true, isActive: updated.isActive };
}

// 5. Hapus Voucher
export async function deleteVoucherAction(id: string) {
  const user = await requireAuth();

  const voucher = await prisma.voucher.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!voucher) {
    throw new Error("Voucher tidak ditemukan.");
  }

  await prisma.voucher.delete({
    where: { id },
  });

  revalidatePath("/dashboard/vouchers");
  revalidatePath("/pos");

  return { success: true };
}

// 6. Verifikasi Kupon Voucher di POS Kasir (Database-driven & Real-time)
export async function verifyVoucherAction(
  code: string,
  subtotal: number,
  overrideTenantId?: string
): Promise<VoucherValidationResult> {
  let tenantId = overrideTenantId;

  if (!tenantId) {
    const session = await getServerSession(authOptions);
    tenantId = (session?.user as any)?.tenantId;
  }

  if (!tenantId) {
    throw new Error("Tenant ID tidak ditemukan untuk verifikasi voucher.");
  }

  const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
  const now = new Date();

  // 1. Cari voucher di database
  const voucher = await prisma.voucher.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code: normalized,
      },
    },
  });

  if (!voucher) {
    // Fallback builtin static presets jika ada
    const BUILTIN_FALLBACKS: Record<string, { type: "PERCENT" | "FIXED"; value: number; maxDiscount?: number; minOrder?: number; description: string }> = {
      HEMAT10: { type: "PERCENT", value: 10, maxDiscount: 20000, minOrder: 30000, description: "Diskon Hemat 10%" },
      PROMO20: { type: "PERCENT", value: 20, maxDiscount: 35000, minOrder: 50000, description: "Promo Spesial 20%" },
      DISKON10K: { type: "FIXED", value: 10000, minOrder: 40000, description: "Potongan Langsung Rp 10.000" },
      KASIRKU: { type: "PERCENT", value: 15, maxDiscount: 25000, minOrder: 25000, description: "Voucher Sahabat KasirKu 15%" },
    };

    const fallback = BUILTIN_FALLBACKS[normalized];
    if (fallback) {
      if (subtotal < (fallback.minOrder || 0)) {
        throw new Error(
          `Voucher "${normalized}" membutuhkan minimum belanja Rp ${(fallback.minOrder || 0).toLocaleString("id-ID")}.`
        );
      }
      let discountAmount = 0;
      if (fallback.type === "PERCENT") {
        discountAmount = Math.round((subtotal * fallback.value) / 100);
        if (fallback.maxDiscount && discountAmount > fallback.maxDiscount) {
          discountAmount = fallback.maxDiscount;
        }
      } else {
        discountAmount = Math.min(fallback.value, subtotal);
      }
      return {
        code: normalized,
        type: fallback.type,
        discountValue: fallback.value,
        discountAmount,
        description: fallback.description,
        minOrder: fallback.minOrder || 0,
        maxDiscount: fallback.maxDiscount,
      };
    }

    throw new Error(`Kode voucher "${normalized}" tidak ditemukan atau tidak berlaku di Bisnis ini.`);
  }

  // 2. Cek status aktif
  if (!voucher.isActive) {
    throw new Error(`Voucher "${normalized}" sedang dinonaktifkan oleh Bisnis.`);
  }

  // 3. Cek tanggal mulai berlaku
  if (voucher.startDate && new Date(voucher.startDate) > now) {
    throw new Error(
      `Voucher "${normalized}" baru dapat digunakan mulai tanggal ${new Date(voucher.startDate).toLocaleDateString("id-ID")}.`
    );
  }

  // 4. Cek tanggal kedaluwarsa (Expired)
  if (voucher.endDate && new Date(voucher.endDate) < now) {
    throw new Error(`Voucher "${normalized}" sudah kedaluwarsa pada ${new Date(voucher.endDate).toLocaleDateString("id-ID")}.`);
  }

  // 5. Cek batas kuota penggunaan (Usage limit)
  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
    throw new Error(`Kuota penggunaan voucher "${normalized}" telah habis (${voucher.usedCount}/${voucher.usageLimit} digunakan).`);
  }

  // 6. Cek minimum order belanja
  const minOrderNum = Number(voucher.minOrder);
  if (subtotal < minOrderNum) {
    throw new Error(
      `Voucher "${normalized}" membutuhkan minimum belanja Rp ${minOrderNum.toLocaleString("id-ID")}. (Subtotal saat ini: Rp ${subtotal.toLocaleString("id-ID")})`
    );
  }

  // 7. Hitung nilai potongan diskon
  const discountValNum = Number(voucher.discountValue);
  const maxDiscountNum = voucher.maxDiscount ? Number(voucher.maxDiscount) : undefined;
  let discountAmount = 0;

  if (voucher.discountType === "PERCENT") {
    discountAmount = Math.round((subtotal * discountValNum) / 100);
    if (maxDiscountNum && discountAmount > maxDiscountNum) {
      discountAmount = maxDiscountNum;
    }
  } else {
    // FIXED NOMINAL
    discountAmount = Math.min(discountValNum, subtotal);
  }

  return {
    code: voucher.code,
    type: voucher.discountType as "PERCENT" | "FIXED",
    discountValue: discountValNum,
    discountAmount,
    description: voucher.description || `Diskon ${voucher.code}`,
    minOrder: minOrderNum,
    maxDiscount: maxDiscountNum,
  };
}
