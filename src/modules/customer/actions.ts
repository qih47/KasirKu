"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.tenantId) {
    throw new Error("Akses ditolak: Anda harus login ke akun toko.");
  }
  return session.user as any;
}

export interface CustomerSummaryItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  visits: number;
  totalSpent: number;
  lastVisitAt: string | null;
  createdAt: string;
  _count?: {
    transactions: number;
    bookings: number;
    laundryOrders: number;
  };
}

export interface CustomersPageData {
  customers: CustomerSummaryItem[];
  stats: {
    totalCustomers: number;
    activeThisMonth: number;
    totalSpentAll: number;
    averageSpentPerCustomer: number;
  };
  totalCount: number;
}

export async function getCustomersData(params?: {
  search?: string;
  sortBy?: "name" | "visits" | "totalSpent" | "lastVisitAt" | "recent";
  limit?: number;
}): Promise<CustomersPageData> {
  const user = await requireAuth();

  const whereClause: any = {
    tenantId: user.tenantId,
  };

  if (params?.search && params.search.trim() !== "") {
    const q = params.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (params?.sortBy === "visits") {
    orderBy = { visits: "desc" };
  } else if (params?.sortBy === "totalSpent") {
    orderBy = { totalSpent: "desc" };
  } else if (params?.sortBy === "lastVisitAt") {
    orderBy = { lastVisitAt: "desc" };
  } else if (params?.sortBy === "name") {
    orderBy = { name: "asc" };
  }

  const [rawCustomers, allCustomersStats] = await Promise.all([
    prisma.customer.findMany({
      where: whereClause,
      orderBy: orderBy,
      take: params?.limit || 100,
      include: {
        _count: {
          select: {
            transactions: true,
            bookings: true,
            laundryOrders: true,
          },
        },
      },
    }),
    prisma.customer.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true,
        totalSpent: true,
        lastVisitAt: true,
      },
    }),
  ]);

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const totalCustomers = allCustomersStats.length;
  const activeThisMonth = allCustomersStats.filter(
    (c: { lastVisitAt: Date | null }) => c.lastVisitAt && new Date(c.lastVisitAt) >= oneMonthAgo
  ).length;

  const totalSpentAll = allCustomersStats.reduce(
    (acc: number, curr: { totalSpent: any }) => acc + Number(curr.totalSpent || 0),
    0
  );

  const averageSpentPerCustomer =
    totalCustomers > 0 ? Math.round(totalSpentAll / totalCustomers) : 0;

  const customers: CustomerSummaryItem[] = rawCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    notes: c.notes,
    visits: c.visits,
    totalSpent: Number(c.totalSpent || 0),
    lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  return {
    customers,
    stats: {
      totalCustomers,
      activeThisMonth,
      totalSpentAll,
      averageSpentPerCustomer,
    },
    totalCount: rawCustomers.length,
  };
}

export async function getCustomerDetail(customerId: string) {
  const user = await requireAuth();

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: user.tenantId,
    },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          outlet: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true, type: true } },
            },
          },
          payments: true,
        },
      },
      bookings: {
        orderBy: { scheduledAt: "desc" },
        take: 15,
        include: {
          barber: { select: { name: true } },
          service: { select: { name: true, price: true } },
          outlet: { select: { name: true } },
        },
      },
      laundryOrders: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          outlet: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) {
    throw new Error("Data pelanggan tidak ditemukan.");
  }

  return {
    ...customer,
    totalSpent: Number(customer.totalSpent || 0),
    transactions: customer.transactions.map((t: any) => ({
      ...t,
      subtotalAmount: Number(t.subtotalAmount || 0),
      discountAmount: Number(t.discountAmount || 0),
      totalAmount: Number(t.totalAmount || 0),
    })),
  };
}

export async function createCustomerAction(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const user = await requireAuth();

  if (!data.name || data.name.trim() === "") {
    throw new Error("Nama pelanggan wajib diisi.");
  }

  const cleanPhone = data.phone?.trim() || null;

  if (cleanPhone) {
    const existing = await prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId: user.tenantId,
          phone: cleanPhone,
        },
      },
    });

    if (existing) {
      throw new Error(`Pelanggan dengan nomor telepon "${cleanPhone}" sudah terdaftar (${existing.name}).`);
    }
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: user.tenantId,
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/pos");
  return {
    success: true,
    customer: {
      ...customer,
      totalSpent: Number(customer.totalSpent),
    },
  };
}

export async function updateCustomerAction(
  customerId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }
) {
  const user = await requireAuth();

  const existing = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: user.tenantId,
    },
  });

  if (!existing) {
    throw new Error("Pelanggan tidak ditemukan.");
  }

  const cleanPhone = data.phone !== undefined ? data.phone.trim() || null : existing.phone;

  if (cleanPhone && cleanPhone !== existing.phone) {
    const phoneTaken = await prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId: user.tenantId,
          phone: cleanPhone,
        },
      },
    });

    if (phoneTaken && phoneTaken.id !== customerId) {
      throw new Error(`Nomor telepon "${cleanPhone}" sudah digunakan oleh pelanggan lain (${phoneTaken.name}).`);
    }
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: data.name !== undefined ? data.name.trim() : existing.name,
      phone: cleanPhone,
      email: data.email !== undefined ? data.email.trim() || null : existing.email,
      address: data.address !== undefined ? data.address.trim() || null : existing.address,
      notes: data.notes !== undefined ? data.notes.trim() || null : existing.notes,
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/pos");
  return { success: true, customer: updated };
}

export async function deleteCustomerAction(customerId: string) {
  const user = await requireAuth();

  const existing = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenantId: user.tenantId,
    },
  });

  if (!existing) {
    throw new Error("Pelanggan tidak ditemukan.");
  }

  await prisma.customer.delete({
    where: { id: customerId },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/pos");
  return { success: true };
}

export async function searchCustomerQuickAction(query: string) {
  const user = await requireAuth();
  if (!query || query.trim() === "") {
    return [];
  }

  const q = query.trim();
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: user.tenantId,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: { lastVisitAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      visits: true,
      totalSpent: true,
      lastVisitAt: true,
    },
  });

  return customers.map((c: any) => ({
    ...c,
    totalSpent: Number(c.totalSpent || 0),
  }));
}
