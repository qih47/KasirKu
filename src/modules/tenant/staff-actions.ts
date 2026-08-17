"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola staff & kasir.");
  }
  return session.user as any;
}

export async function getStaffData() {
  const user = await requireOwner();

  const [tenant, staffList] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: true,
        subscriptions: {
          where: { isActive: true },
          include: { licenseTier: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      include: { outlet: true },
    }),
  ]);

  const activeSub = tenant?.subscriptions[0];
  const kasirLimit = activeSub?.licenseTier?.kasirLimitPerOutlet ?? 5;
  const currentCashierCount = staffList.filter((s) => s.role === "KASIR").length;

  return {
    staffList,
    outlets: tenant?.outlets || [],
    licenseTierName: activeSub?.licenseTier?.name || "Lisensi Basic",
    kasirLimit,
    currentCashierCount,
    isQuotaFull: kasirLimit !== null && currentCashierCount >= kasirLimit,
  };
}

export async function createCashierAction(data: {
  name: string;
  email: string;
  password: string;
  outletId: string;
}) {
  const user = await requireOwner();
  const { name, email, password, outletId } = data;

  if (!name || !email || !password || !outletId) {
    throw new Error("Seluruh data kasir wajib diisi.");
  }

  if (password.length < 6) {
    throw new Error("Password minimal harus 6 karakter.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Cek kuota kasir
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: { licenseTier: true },
      },
      users: {
        where: { role: "KASIR" },
      },
    },
  });

  const activeSub = tenant?.subscriptions[0];
  const kasirLimit = activeSub?.licenseTier?.kasirLimitPerOutlet ?? 5;
  const currentCount = tenant?.users.length || 0;

  if (kasirLimit !== null && currentCount >= kasirLimit) {
    throw new Error(
      `Kuota kasir penuh (Maks. ${kasirLimit} kasir pada ${
        activeSub?.licenseTier?.name || "Lisensi Basic"
      }). Silakan upgrade lisensi Anda.`
    );
  }

  // 2. Cek apakah email sudah terdaftar di tenant ini
  const existingUser = await prisma.user.findFirst({
    where: {
      tenantId: user.tenantId,
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error("Email ini sudah digunakan oleh staff lain di toko Anda.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newStaff = await prisma.user.create({
    data: {
      tenantId: user.tenantId,
      outletId,
      role: "KASIR",
      name,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/staff");
  return { success: true, user: newStaff };
}

export async function toggleStaffStatusAction(userId: string) {
  const user = await requireOwner();

  const targetStaff = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetStaff || targetStaff.tenantId !== user.tenantId) {
    throw new Error("Staff tidak ditemukan.");
  }

  if (targetStaff.role === "OWNER") {
    throw new Error("Akun Owner tidak dapat dinonaktifkan dari menu ini.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !targetStaff.isActive },
  });

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function deleteStaffAction(userId: string) {
  const user = await requireOwner();

  const targetStaff = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetStaff || targetStaff.tenantId !== user.tenantId) {
    throw new Error("Staff tidak ditemukan.");
  }

  if (targetStaff.role === "OWNER") {
    throw new Error("Akun Owner tidak dapat dihapus.");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/dashboard/staff");
  return { success: true };
}
