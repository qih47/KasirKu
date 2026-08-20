import { getSuperAdminDashboardData } from "@/modules/superadmin/actions";
import Link from "next/link";
import {
  Building2,
  Users,
  ShieldCheck,
  Lock,
  DollarSign,
  ArrowRight,
  Sparkles,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Layers,
} from "lucide-react";

export default async function SuperAdminDashboardPage() {
  const { metrics, recentTenants, pluginsDistribution } =
    await getSuperAdminDashboardData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ACTIVE
          </span>
        );
      case "TRIAL":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            TRIAL
          </span>
        );
      case "LOCKED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            LOCKED
          </span>
        );
      case "FROZEN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            FROZEN
          </span>
        );
      default:
        return null;
    }
  };

  const getPluginIcon = (code: string) => {
    switch (code) {
      case "barbershop":
        return <Scissors className="w-4 h-4 text-amber-400" />;
      case "cafe":
        return <Coffee className="w-4 h-4 text-emerald-400" />;
      case "retail":
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case "laundry":
        return <Shirt className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Management &bull; Super Admin
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Command Center
          </h1>
          <p className="text-sm text-slate-400">
            Ringkasan performa tenant, revenue berlangganan, dan status operasional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/catalog"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-800 transition"
          >
            Atur Katalog Harga
          </Link>
          <Link
            href="/admin/tenants"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            Kelola Tenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Tenant
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{metrics.totalTenants}</p>
          <p className="text-xs text-slate-500 mt-1">Terdaftar di platform</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tenant Trial
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400">
            {metrics.trialTenants}
          </p>
          <p className="text-xs text-slate-500 mt-1">Dalam masa percobaan 30 hari</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tenant Aktif Berlangganan
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {metrics.activeTenants}
          </p>
          <p className="text-xs text-slate-500 mt-1">Paying customers</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estimasi MRR / ARR
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white">
            Rp {metrics.estimatedMRR.toLocaleString("id-ID")}
            <span className="text-xs font-normal text-slate-400">/bln</span>
          </p>
          <p className="text-[11px] text-indigo-400 font-semibold mt-1">
            ARR: Rp {(metrics.estimatedARR || metrics.estimatedMRR * 12).toLocaleString("id-ID")}/thn
          </p>
        </div>
      </div>

      {/* Grid Content: Recent Tenants & Plugin Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tenants Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Tenant Terbaru</h2>
            <Link
              href="/admin/tenants"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Bisnis & Owner</th>
                  <th className="py-2.5 px-3">Modul Plugin</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Trial Berakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTenants.length > 0 ? (
                  recentTenants.map((t) => {
                    const owner = t.users[0];
                    const activeSub = t.subscriptions[0];
                    const plugins = activeSub?.plugins || [];

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">
                            {t.businessName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {owner ? `${owner.name} (${owner.email})` : "-"}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {plugins.map((p) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700"
                              >
                                {getPluginIcon(p.plugin.code)}
                                {p.plugin.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(t.status)}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {t.trialEndAt
                            ? new Date(t.trialEndAt).toLocaleDateString("id-ID")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Belum ada data tenant terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plugin Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Distribusi Plugin
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Vertikal bisnis paling banyak diaktifkan
            </p>

            <div className="space-y-3">
              {pluginsDistribution.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {getPluginIcon(p.code)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Rp {Number(p.priceMonthly).toLocaleString("id-ID")}/bln
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-400">
                      {p._count.tenantPlugins}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">Tenant</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/admin/catalog"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ubah Harga & Tambah Modul Plugin &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
