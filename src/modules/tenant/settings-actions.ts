"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengatur branding toko.");
  }
  return session.user as any;
}

export async function getTenantSettingsData() {
  const user = await requireOwner();

  const [tenant, activeSub] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: { take: 1 },
      },
    }),
    prisma.tenantSubscription.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
      include: { licenseTier: true },
    }),
  ]);

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const isTrial = tenant.status === "TRIAL";
  const isPaidActive = tenant.status === "ACTIVE";

  return {
    tenant: {
      id: tenant.id,
      businessName: tenant.businessName,
      status: tenant.status,
    },
    primaryOutlet: tenant.outlets[0] || null,
    isTrial,
    isPaidActive,
    tierName: activeSub?.licenseTier?.name || "Trial 30 Hari",
  };
}

export async function updateTenantBrandingAction(data: {
  businessName: string;
  receiptFooter?: string;
  phone?: string;
  address?: string;
}) {
  const user = await requireOwner();

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  // Validasi: Fitur Custom Branding terkunci di mode TRIAL
  if (tenant.status === "TRIAL") {
    throw new Error(
      "Fitur Ganti Logo & Custom Branding hanya dapat digunakan setelah membeli paket lisensi aktif (Basic/Pro/Enterprise)."
    );
  }

  const { businessName, receiptFooter, phone, address } = data;

  if (!businessName.trim()) {
    throw new Error("Nama brand / bisnis wajib diisi.");
  }

  // Update nama bisnis tenant
  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      businessName: businessName.trim(),
    },
  });

  // Update alamat outlet utama jika ada
  const firstOutlet = await prisma.outlet.findFirst({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "asc" },
  });

  if (firstOutlet) {
    await prisma.outlet.update({
      where: { id: firstOutlet.id },
      data: {
        address: address?.trim() || firstOutlet.address,
      },
    });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { success: true };
}
