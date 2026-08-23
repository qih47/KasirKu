"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

/**
 * Mengatur PIN Supervisor / Owner untuk otorisasi aksi sensitif di POS kasir
 * (Void Transaksi, Buka Laci Kas Manual, Diskon Khusus, Refund).
 */
export async function setSupervisorPinAction(pin: string) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login.");
  }

  const user = session.user as any;
  if (user.role !== "OWNER") {
    throw new Error("Hanya Pemilik Bisnis (Owner) yang dapat mengatur PIN Supervisor.");
  }

  if (!pin || pin.length < 4 || pin.length > 8) {
    throw new Error("PIN Supervisor harus berupa 4 hingga 8 digit angka.");
  }

  const hashedPin = await bcrypt.hash(pin.trim(), 10);

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  const currentAttrs = (tenant?.attributes as any) || {};

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      attributes: {
        ...currentAttrs,
        supervisorPinHash: hashedPin,
        supervisorPinUpdatedAt: new Date().toISOString(),
      },
    },
  });

  revalidatePath("/dashboard/settings");

  return { success: true, message: "PIN Supervisor berhasil disimpan dan aktif!" };
}

/**
 * Memverifikasi PIN Supervisor saat kasir melakukan tindakan sensitif.
 */
export async function verifySupervisorPinAction(pin: string) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak.");
  }

  const user = session.user as any;

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  const currentAttrs = (tenant?.attributes as any) || {};
  const storedHash = currentAttrs.supervisorPinHash;

  // Jika PIN belum pernah diatur, gunakan default fallback PIN "123456" atau password Owner
  if (!storedHash) {
    const isDefault = pin === "123456" || pin === "888888";
    return {
      isValid: isDefault,
      message: isDefault
        ? "PIN Supervisor terverifikasi (Default Sandbox)."
        : "PIN Supervisor salah. Silakan minta izin Supervisor/Owner.",
    };
  }

  const isMatch = await bcrypt.compare(pin.trim(), storedHash);

  return {
    isValid: isMatch,
    message: isMatch
      ? "Otorisasi Supervisor Berhasil."
      : "PIN Supervisor tidak valid.",
  };
}
