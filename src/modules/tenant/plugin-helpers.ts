import { prisma } from "@/lib/prisma";

export type PluginCode = "barbershop" | "cafe" | "retail" | "laundry";

export interface TenantPluginInfo {
  code: string;
  name: string;
  isActive: boolean;
  activatedAt: Date;
}

/**
 * Mengambil daftar seluruh plugin vertikal yang aktif pada tenant tertentu
 */
export async function getTenantActivePlugins(tenantId: string): Promise<TenantPluginInfo[]> {
  const activeSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId, isActive: true },
    include: {
      plugins: {
        where: { isActive: true },
        include: { plugin: true },
      },
    },
  });

  if (!activeSub || !activeSub.plugins) {
    return [];
  }

  return activeSub.plugins.map((tp: any) => ({
    code: tp.plugin.code,
    name: tp.plugin.name,
    isActive: tp.isActive,
    activatedAt: tp.activatedAt,
  }));
}

/**
 * Pengecekan apakah tenant memiliki izin/akses ke plugin tertentu
 */
export async function hasTenantPlugin(tenantId: string, pluginCode: string): Promise<boolean> {
  const activePlugins = await getTenantActivePlugins(tenantId);
  return activePlugins.some((p) => p.code === pluginCode);
}
