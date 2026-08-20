"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DashboardWidgetItem, DEFAULT_DASHBOARD_LAYOUT } from "./widget-types";

async function requireTenantUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !user.tenantId) {
    throw new Error("Akses ditolak: Anda harus Login Ke Akun Bisnis.");
  }
  return user;
}

export async function saveTenantDashboardWidgetsAction(
  widgets: DashboardWidgetItem[]
) {
  const user = await requireTenantUser();

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      dashboardWidgets: widgets as any,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, count: widgets.length };
}

export async function getTenantDashboardWidgets(): Promise<DashboardWidgetItem[]> {
  try {
    const user = await requireTenantUser();
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { dashboardWidgets: true },
    });

    if (tenant?.dashboardWidgets && Array.isArray(tenant.dashboardWidgets)) {
      return tenant.dashboardWidgets as unknown as DashboardWidgetItem[];
    }
  } catch (err) {
    console.error("Error reading dashboard widgets:", err);
  }

  return DEFAULT_DASHBOARD_LAYOUT;
}
