import { getAllTenants } from "@/modules/superadmin/actions";
import { TenantTableClient } from "./tenant-table-client";
import { Building2 } from "lucide-react";

export default async function AdminTenantsPage() {
  const tenants = await getAllTenants();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5" />
          Platform Tenant Layer
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Manajemen Tenant & Langganan
        </h1>
        <p className="text-xs text-slate-400">
          Kelola seluruh bisnis yang terdaftar, perpanjang masa trial secara manual, atau kunci akun.
        </p>
      </div>

      <TenantTableClient initialTenants={tenants} />
    </div>
  );
}
