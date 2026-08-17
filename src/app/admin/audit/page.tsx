import { getAuditLogsList } from "@/modules/superadmin/actions";
import { ScrollText, ShieldAlert } from "lucide-react";

export default async function AdminAuditPage() {
  const logs = await getAuditLogsList();

  const getActionBadge = (action: string) => {
    switch (action) {
      case "extend_trial":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            EXTEND TRIAL
          </span>
        );
      case "update_tenant_status":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            UPDATE STATUS
          </span>
        );
      case "update_license_tier_price":
      case "update_plugin_pricing":
      case "update_theme_pricing":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            UPDATE PRICING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <ScrollText className="w-3.5 h-3.5" />
          Platform Security & Audit Trail
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Histori Log Aktivitas Super Admin
        </h1>
        <p className="text-xs text-slate-400">
          Catatan setiap perubahan harga katalog atau intervensi manual terhadap tenant.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Super Admin</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Target & Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {log.superAdmin.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {log.superAdmin.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-semibold text-slate-300">
                        Target: {log.targetType || "-"}
                      </div>
                      {log.detail && (
                        <pre className="mt-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono overflow-x-auto max-w-lg">
                          {JSON.stringify(log.detail, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
