"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getTenantActivePlugins } from "@/modules/tenant/plugin-helpers";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "OWNER") {
    throw new Error("Akses ditolak: Hanya Owner yang dapat mengelola staff & karyawan.");
  }
  return session.user as any;
}

async function requireStaffAccess() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "OWNER" && role !== "ADMIN_CABANG")) {
    throw new Error("Akses ditolak: Anda tidak memiliki wewenang untuk melihat data staf.");
  }
  return session.user as any;
}

export async function getStaffData(filterOutletId?: string) {
  const user = await requireStaffAccess();

  const isBranchAdmin = user.role === "ADMIN_CABANG";
  const effectiveOutletId = isBranchAdmin ? user.outletId : filterOutletId;

  const whereClause: any = { tenantId: user.tenantId };
  if (effectiveOutletId && effectiveOutletId !== "ALL") {
    whereClause.outletId = effectiveOutletId;
  }

  const [tenant, staffList, activePlugins] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        outlets: {
          where: isBranchAdmin && user.outletId ? { id: user.outletId } : undefined,
          orderBy: { name: "asc" },
        },
        subscriptions: {
          where: { isActive: true },
          include: { licenseTier: true },
        },
      },
    }),
    prisma.user.findMany({
      where: whereClause as any,
      orderBy: { createdAt: "desc" },
      include: { outlet: true },
    }),
    getTenantActivePlugins(user.tenantId),
  ]);

  const activeSub = tenant?.subscriptions[0];
  const kasirLimit = activeSub?.licenseTier?.kasirLimitPerOutlet ?? 5;

  // Staf yang memotong kuota kasir adalah staf dengan hasPosAccess = true dan role KASIR (atau staff kasir)
  const activeCashierCount = staffList.filter(
    (s: any) => s.role === "KASIR" && s.hasPosAccess !== false && s.isActive
  ).length;

  const operationalStaffCount = staffList.filter(
    (s: any) => s.hasPosAccess === false || s.role !== "KASIR"
  ).length;

  return JSON.parse(
    JSON.stringify({
      staffList,
      outlets: tenant?.outlets || [],
      licenseTierName: activeSub?.licenseTier?.name || "Lisensi Basic",
      activePlugins,
      kasirLimit,
      activeCashierCount,
      operationalStaffCount,
      totalStaffCount: staffList.length,
      isQuotaFull: kasirLimit !== null && activeCashierCount >= kasirLimit,
    })
  );
}

export async function createStaffAction(data: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  outletId?: string | null;
  role?: "ADMIN_CABANG" | "KASIR";
  position: string;
  hasPosAccess: boolean;
  employmentType?: string;
  joinDate?: string | Date | null;
  baseSalary?: number | null;
  salaryType?: string;
  allowanceMeal?: number | null;
  allowanceTransport?: number | null;
  allowanceOther?: number | null;
  overtimeRate?: number | null;
  isCommissionActive?: boolean;
  commissionPercent?: number | null;
  commissionFlat?: number | null;
}) {
  const user = await requireOwner();
  const {
    name,
    email,
    phone,
    password,
    outletId,
    role = "KASIR",
    position,
    hasPosAccess,
    employmentType = "FULL_TIME",
    joinDate,
    baseSalary,
    salaryType = "MONTHLY",
    allowanceMeal,
    allowanceTransport,
    allowanceOther,
    overtimeRate,
    isCommissionActive = false,
    commissionPercent,
    commissionFlat,
  } = data;

  if (!name || !name.trim()) {
    throw new Error("Nama lengkap karyawan wajib diisi.");
  }
  if (!email || !email.trim()) {
    throw new Error("Email karyawan wajib diisi.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validasi kuota jika staf diberikan akses login kasir POS
  if (hasPosAccess) {
    if (!password || password.length < 6) {
      throw new Error("Password akses POS minimal harus 6 karakter.");
    }

    const [tenant, currentCount] = await Promise.all([
        prisma.tenant.findUnique({
          where: { id: user.tenantId },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: { licenseTier: true },
            },
            outlets: true,
          },
        }),
        prisma.user.count({
          where: {
            tenantId: user.tenantId,
            role: "KASIR",
            hasPosAccess: true,
            isActive: true,
            ...(outletId ? { outletId } : {}),
          },
        }),
      ]);

      const activeSub = tenant?.subscriptions?.[0];
      const kasirLimit = activeSub?.licenseTier?.kasirLimitPerOutlet ?? 5;
      const effectiveLimit = outletId ? kasirLimit : kasirLimit * Math.max(1, tenant?.outlets?.length || 1);

      if (kasirLimit !== null && currentCount >= effectiveLimit) {
        throw new Error(
          `Kuota kasir aktif ${outletId ? "untuk cabang ini" : "bisnis"} sudah penuh (${currentCount}/${effectiveLimit} kasir pada ${activeSub?.licenseTier?.name || "Lisensi Bisnis"}). Silakan upgrade lisensi atau nonaktifkan akses POS kasir lain.`
        );
      }
  }

  // Cek duplikasi email di tenant
  const existingUser = await prisma.user.findFirst({
    where: {
      tenantId: user.tenantId,
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new Error("Email ini sudah digunakan oleh karyawan lain di Bisnis Anda.");
  }

  // Generate password hash (atau random password jika non-login POS)
  const effectivePassword = password && password.trim() ? password : `StaffPass_${Date.now()}`;
  const hashedPassword = await bcrypt.hash(effectivePassword, 10);

  const effectiveJoinDate = joinDate ? new Date(joinDate) : new Date();

  if (role === "ADMIN_CABANG") {
    if (!outletId || outletId === "ALL") {
      throw new Error("Admin Cabang wajib ditugaskan ke salah satu cabang outlet spesifik.");
    }
    if (!password || password.trim().length < 6) {
      throw new Error("Password akses Admin Cabang minimal harus 6 karakter.");
    }
  }

  const newStaff = await prisma.user.create({
    data: {
      tenantId: user.tenantId,
      outletId: outletId && outletId !== "ALL" ? outletId : null,
      role: role === "ADMIN_CABANG" ? "ADMIN_CABANG" : "KASIR",
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      passwordHash: hashedPassword,
      position: position || "KASIR",
      hasPosAccess: Boolean(hasPosAccess),
      employmentType: employmentType || "FULL_TIME",
      joinDate: effectiveJoinDate,
      baseSalary: baseSalary !== null && baseSalary !== undefined && baseSalary >= 0 ? baseSalary : null,
      salaryType: salaryType || "MONTHLY",
      allowanceMeal: allowanceMeal !== null && allowanceMeal !== undefined && allowanceMeal >= 0 ? allowanceMeal : null,
      allowanceTransport: allowanceTransport !== null && allowanceTransport !== undefined && allowanceTransport >= 0 ? allowanceTransport : null,
      allowanceOther: allowanceOther !== null && allowanceOther !== undefined && allowanceOther >= 0 ? allowanceOther : null,
      overtimeRate: overtimeRate !== null && overtimeRate !== undefined && overtimeRate >= 0 ? overtimeRate : null,
      isCommissionActive: Boolean(isCommissionActive),
      commissionPercent: commissionPercent !== null && commissionPercent !== undefined && commissionPercent >= 0 ? commissionPercent : null,
      commissionFlat: commissionFlat !== null && commissionFlat !== undefined && commissionFlat >= 0 ? commissionFlat : null,
      isActive: true,
    } as any,
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/pos");
  return { success: true, user: JSON.parse(JSON.stringify(newStaff)) };
}

export async function updateStaffAction(data: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  outletId?: string | null;
  role?: "ADMIN_CABANG" | "KASIR";
  position?: string;
  hasPosAccess?: boolean;
  employmentType?: string;
  joinDate?: string | Date | null;
  baseSalary?: number | null;
  salaryType?: string;
  allowanceMeal?: number | null;
  allowanceTransport?: number | null;
  allowanceOther?: number | null;
  overtimeRate?: number | null;
  isCommissionActive?: boolean;
  commissionPercent?: number | null;
  commissionFlat?: number | null;
}) {
  const user = await requireOwner();
  const {
    id,
    name,
    email,
    phone,
    password,
    outletId,
    role,
    position,
    hasPosAccess,
    employmentType,
    joinDate,
    baseSalary,
    salaryType,
    allowanceMeal,
    allowanceTransport,
    allowanceOther,
    overtimeRate,
    isCommissionActive,
    commissionPercent,
    commissionFlat,
  } = data;

  const existingStaff = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingStaff || existingStaff.tenantId !== user.tenantId) {
    throw new Error("Karyawan tidak ditemukan.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cek duplikasi email jika diganti
  if (normalizedEmail !== existingStaff.email) {
    const duplicate = await prisma.user.findFirst({
      where: {
        tenantId: user.tenantId,
        email: normalizedEmail,
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new Error("Email ini sudah digunakan oleh karyawan lain.");
    }
  }

  if (role === "ADMIN_CABANG") {
    const finalOutletId = outletId && outletId !== "ALL" ? outletId : existingStaff.outletId;
    if (!finalOutletId) {
      throw new Error("Admin Cabang wajib ditugaskan ke salah satu cabang outlet spesifik.");
    }
  }

  const updatePayload: any = {
    name: name.trim(),
    email: normalizedEmail,
    phone: phone?.trim() || null,
    ...(role ? { role: role === "ADMIN_CABANG" ? "ADMIN_CABANG" : "KASIR" } : {}),
    outletId: outletId && outletId !== "ALL" ? outletId : null,
    position: position || (existingStaff as any).position || "KASIR",
    hasPosAccess: hasPosAccess !== undefined ? Boolean(hasPosAccess) : (existingStaff as any).hasPosAccess,
    employmentType: employmentType || (existingStaff as any).employmentType,
    joinDate: joinDate ? new Date(joinDate) : (existingStaff as any).joinDate || new Date(),
    baseSalary: baseSalary !== null && baseSalary !== undefined && baseSalary >= 0 ? baseSalary : null,
    salaryType: salaryType || (existingStaff as any).salaryType,
    allowanceMeal: allowanceMeal !== null && allowanceMeal !== undefined && allowanceMeal >= 0 ? allowanceMeal : null,
    allowanceTransport: allowanceTransport !== null && allowanceTransport !== undefined && allowanceTransport >= 0 ? allowanceTransport : null,
    allowanceOther: allowanceOther !== null && allowanceOther !== undefined && allowanceOther >= 0 ? allowanceOther : null,
    overtimeRate: overtimeRate !== null && overtimeRate !== undefined && overtimeRate >= 0 ? overtimeRate : null,
    isCommissionActive: isCommissionActive !== undefined ? Boolean(isCommissionActive) : (existingStaff as any).isCommissionActive,
    commissionPercent: commissionPercent !== null && commissionPercent !== undefined && commissionPercent >= 0 ? commissionPercent : null,
    commissionFlat: commissionFlat !== null && commissionFlat !== undefined && commissionFlat >= 0 ? commissionFlat : null,
  };

  if (password && password.trim().length >= 6) {
    updatePayload.passwordHash = await bcrypt.hash(password.trim(), 10);
  }

  const updatedStaff = await prisma.user.update({
    where: { id },
    data: updatePayload as any,
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/pos");
  return { success: true, user: JSON.parse(JSON.stringify(updatedStaff)) };
}

export async function toggleStaffStatusAction(userId: string) {
  const user = await requireOwner();

  const targetStaff = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetStaff || targetStaff.tenantId !== user.tenantId) {
    throw new Error("Karyawan tidak ditemukan.");
  }

  if (targetStaff.role === "OWNER") {
    throw new Error("Akun Owner tidak dapat dinonaktifkan dari menu ini.");
  }

  // Jika akan mengaktifkan kembali staf yang memiliki akses POS, cek kuota kasir
  if (!targetStaff.isActive && targetStaff.role === "KASIR" && targetStaff.hasPosAccess) {
    const [tenant, currentCount] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        include: {
          subscriptions: {
            where: { isActive: true },
            include: { licenseTier: true },
          },
          outlets: true,
        },
      }),
      prisma.user.count({
        where: {
          tenantId: user.tenantId,
          role: "KASIR",
          hasPosAccess: true,
          isActive: true,
          ...(targetStaff.outletId ? { outletId: targetStaff.outletId } : {}),
        },
      }),
    ]);

    const activeSub = tenant?.subscriptions?.[0];
    const kasirLimit = activeSub?.licenseTier?.kasirLimitPerOutlet ?? 5;
    const effectiveLimit = targetStaff.outletId ? kasirLimit : kasirLimit * Math.max(1, tenant?.outlets?.length || 1);

    if (kasirLimit !== null && currentCount >= effectiveLimit) {
      throw new Error(
        `Tidak dapat mengaktifkan kasir. Kuota kasir aktif ${targetStaff.outletId ? "cabang ini" : "bisnis"} sudah penuh (${currentCount}/${effectiveLimit} kasir). Harap upgrade lisensi atau nonaktifkan kasir lain terlebih dahulu.`
      );
    }
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
    throw new Error("Karyawan tidak ditemukan.");
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
