"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTenantPlugin } from "@/modules/tenant/plugin-helpers";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export type BookingStatusType = "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

async function requireTenantBarbershopUser() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis.");
  }

  const user = session.user as any;
  const isPluginActive = await hasTenantPlugin(user.tenantId, "barbershop");
  if (!isPluginActive) {
    throw new Error(
      "Akses ditolak: Modul Barbershop belum diaktifkan pada langganan Bisnis Anda."
    );
  }

  return user;
}

export async function getBarbershopQueueData(explicitOutletId?: string) {
  const user = await requireTenantBarbershopUser();
  const outletId = explicitOutletId || user.outletId;

  let targetOutletId = outletId;
  if (!targetOutletId) {
    const firstOutlet = await prisma.outlet.findFirst({
      where: { tenantId: user.tenantId, isActive: true },
    });
    targetOutletId = firstOutlet?.id;
  }

  if (!targetOutletId) throw new Error("Outlet tidak ditemukan.");

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [bookings, barbers, services, tenant] = await Promise.all([
    prisma.booking.findMany({
      where: {
        outletId: targetOutletId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { createdAt: "asc" },
      include: {
        barber: true,
        service: true,
      },
    }),
    prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        OR: [
          { outletId: targetOutletId },
          { outletId: null },
        ],
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        tenantId: user.tenantId,
        type: "JASA",
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { outlets: true },
    }),
  ]);

  const waitingList = bookings.filter((b) => b.status === "WAITING");
  const inProgressList = bookings.filter((b) => b.status === "IN_PROGRESS");
  const completedList = bookings.filter((b) => b.status === "COMPLETED");

  return {
    bookings,
    waitingList,
    inProgressList,
    completedList,
    barbers,
    services,
    outlets: tenant?.outlets || [],
    currentOutletId: targetOutletId,
  };
}

export async function createQueueBookingAction(data: {
  outletId: string;
  customerName: string;
  customerPhone?: string;
  barberId?: string;
  serviceId?: string;
  chairNumber?: number;
  notes?: string;
}) {
  const user = await requireTenantBarbershopUser();
  const {
    outletId,
    customerName,
    customerPhone,
    barberId,
    serviceId,
    chairNumber,
    notes,
  } = data;

  if (!customerName) {
    throw new Error("Nama pelanggan wajib diisi.");
  }

  // Hitung nomor antrian hari ini (B-01, B-02, dst)
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const countToday = await prisma.booking.count({
    where: {
      outletId,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });

  const nextSeq = countToday + 1;
  const queueNumber = `B-${String(nextSeq).padStart(2, "0")}`;

  const booking = await prisma.booking.create({
    data: {
      tenantId: user.tenantId,
      outletId,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || null,
      barberId: barberId || null,
      serviceId: serviceId || null,
      queueNumber,
      chairNumber: chairNumber || null,
      status: "WAITING",
      notes: notes?.trim() || null,
    },
    include: {
      barber: true,
      service: true,
    },
  });

  revalidatePath("/dashboard/barbershop/queue");
  return { success: true, booking };
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatusType,
  chairNumber?: number
) {
  const user = await requireTenantBarbershopUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.tenantId !== user.tenantId) {
    throw new Error("Antrian tidak ditemukan.");
  }

  const now = new Date();
  const updateData: any = { status };

  if (chairNumber !== undefined) {
    updateData.chairNumber = chairNumber;
  }

  if (status === "IN_PROGRESS" && !booking.startedAt) {
    updateData.startedAt = now;
  } else if (status === "COMPLETED") {
    updateData.completedAt = now;
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    include: {
      barber: true,
      service: true,
    },
  });

  revalidatePath("/dashboard/barbershop/queue");
  return { success: true, booking: updated };
}

export async function getBarberCommissionsReport(params?: {
  startDate?: string;
  endDate?: string;
  barberId?: string;
}) {
  const user = await requireTenantBarbershopUser();

  const now = new Date();
  const fromDate = params?.startDate
    ? startOfDay(new Date(params.startDate))
    : startOfDay(subDays(now, 29));
  const toDate = params?.endDate
    ? endOfDay(new Date(params.endDate))
    : endOfDay(now);

  const whereClause: any = {
    tenantId: user.tenantId,
    createdAt: { gte: fromDate, lte: toDate },
  };

  if (params?.barberId && params.barberId !== "ALL") {
    whereClause.staffId = params.barberId;
  }

  const [commissions, barbers] = await Promise.all([
    prisma.staffCommission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        staff: true,
        transactionItem: {
          include: {
            product: true,
            transaction: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalCommissionsPaid = commissions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  // Group per barber
  const barberSummaryMap: Record<
    string,
    { id: string; name: string; email: string; totalServices: number; totalCommission: number }
  > = {};

  barbers.forEach((b) => {
    barberSummaryMap[b.id] = {
      id: b.id,
      name: b.name,
      email: b.email,
      totalServices: 0,
      totalCommission: 0,
    };
  });

  commissions.forEach((c) => {
    if (barberSummaryMap[c.staffId]) {
      barberSummaryMap[c.staffId].totalServices += 1;
      barberSummaryMap[c.staffId].totalCommission += Number(c.amount);
    }
  });

  const barberSummaryList = Object.values(barberSummaryMap).sort(
    (a, b) => b.totalCommission - a.totalCommission
  );

  return {
    commissions,
    barberSummaryList,
    barbers,
    totalCommissionsPaid,
    dateRange: {
      from: format(fromDate, "dd MMM yyyy"),
      to: format(toDate, "dd MMM yyyy"),
    },
  };
}

export async function updateStaffBarberRateAction(data: {
  staffId: string;
  schemeType: "PERCENTAGE" | "FLAT";
  serviceRate: number;
  productCommissionRate?: number;
  tierLabel?: string;
}) {
  const user = await requireTenantBarbershopUser();
  const { staffId, schemeType, serviceRate, productCommissionRate, tierLabel } = data;

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff || staff.tenantId !== user.tenantId) {
    throw new Error("Kapster tidak ditemukan.");
  }

  const currentAttrs: Record<string, any> = ((staff as any).attributes as any) || {};

  await prisma.user.update({
    where: { id: staffId },
    data: {
      attributes: {
        ...currentAttrs,
        schemeType,
        serviceRate: Number(serviceRate),
        productCommissionRate: Number(productCommissionRate || 5),
        tierLabel: tierLabel || "Kapster",
      },
    } as any,
  });

  revalidatePath("/dashboard/barbershop/commissions");
  return { success: true };
}

