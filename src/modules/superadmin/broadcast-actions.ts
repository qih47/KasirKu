"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin yang diizinkan.");
  }
  return session.user as any;
}

export async function getBroadcastsData() {
  await requireSuperAdmin();

  const messages = await prisma.broadcastMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return messages;
}

export async function createBroadcastAction(data: {
  title: string;
  content: string;
  type?: string;
}) {
  const admin = await requireSuperAdmin();
  const { title, content, type = "INFO" } = data;

  if (!title.trim() || !content.trim()) {
    throw new Error("Judul dan isi pengumuman wajib diisi.");
  }

  const broadcast = await prisma.broadcastMessage.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      type,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      superAdminId: admin.id,
      action: "create_broadcast",
      targetType: "BroadcastMessage",
      targetId: broadcast.id,
      detail: { title, type },
    },
  });

  revalidatePath("/admin/broadcast");
  revalidatePath("/dashboard");
  return { success: true, broadcast };
}

export async function toggleBroadcastAction(id: string) {
  await requireSuperAdmin();

  const msg = await prisma.broadcastMessage.findUnique({
    where: { id },
  });

  if (!msg) throw new Error("Pengumuman tidak ditemukan.");

  const updated = await prisma.broadcastMessage.update({
    where: { id },
    data: { isActive: !msg.isActive },
  });

  revalidatePath("/admin/broadcast");
  revalidatePath("/dashboard");
  return { success: true, broadcast: updated };
}

/**
 * Helper untuk Dashboard Tenant (Mendapatkan 1 pengumuman aktif terbaru jika ada)
 */
export async function getActiveBroadcastForTenant() {
  try {
    const broadcast = await prisma.broadcastMessage.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return broadcast;
  } catch (err) {
    return null;
  }
}
