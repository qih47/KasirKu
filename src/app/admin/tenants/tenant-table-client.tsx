"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import {
  extendTenantTrial,
  updateTenantStatus,
  TenantStatus,
} from "@/modules/superadmin/actions";
import {
  CalendarPlus,
  ShieldCheck,
  Lock,
  Snowflake,
  Search,
  Loader2,
  Building2,
  CheckCircle2,
  Scissors,
  Coffee,
  ShoppingBag,
  Shirt,
  Layers,
} from "lucide-react";

interface TenantWithDetails {
  id: string;
  businessName: string;
  status: TenantStatus;
  trialStartAt: Date;
  trialEndAt: Date;
  users: Array<{ id: string; name: string; email: string }>;
  outlets: Array<{ id: string; name: string }>;
  subscriptions: Array<{
    id: string;
    licenseTier: { name: string; code: string };
    plugins: Array<{ plugin: { id: string; name: string; code: string } }>;
  }>;
}

export function TenantTableClient({
  initialTenants,
}: {
  initialTenants: any[];
}) {
  const [tenants, setTenants] = useState<any[]>(initialTenants);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string } | null>(null);

  const getPluginIcon = (code: string) => {
    switch (code) {
      case "barbershop":
        return <Scissors className="w-3.5 h-3.5 text-amber-400" />;
      case "cafe":
        return <Coffee className="w-3.5 h-3.5 text-emerald-400" />;
      case "retail":
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />;
      case "laundry":
        return <Shirt className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const handleExtend = async (tenantId: string, days: number) => {
    setActionLoadingId(tenantId);
    try {
      const res = await extendTenantTrial(tenantId, days);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId
            ? { ...t, trialEndAt: res.newTrialEndAt, status: "TRIAL" }
            : t
        )
      );
      setMsg({ id: tenantId, text: `Trial diperpanjang +${days} hari!` });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      toastError(err.message || "Gagal memperpanjang trial");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (
    tenantId: string,
    newStatus: TenantStatus
  ) => {
    setActionLoadingId(tenantId);
    try {
      await updateTenantStatus(tenantId, newStatus);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
      );
      setMsg({ id: tenantId, text: `Status diubah ke ${newStatus}` });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status tenant");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    const owner = t.users[0];
    const matchSearch =
      t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDurationBadge = (sub: any) => {
    if (!sub) return null;
    const key = sub.durationKey;
    const months = sub.durationMonths || (sub.billingCycle === "ANNUAL" ? 12 : 1);
    if (key === "1M" || months === 1) return "1 Bulan";
    if (key === "3M" || months === 3) return "3 Bulan";
    if (key === "6M" || months === 6) return "6 Bulan";
    if (key === "1Y" || months === 12) return "1 Tahun";
    if (key === "2Y" || months === 24) return "2 Tahun";
    if (key === "3Y" || months === 36) return "3 Tahun";
    return `${months} Bulan`;
  };

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

  return (
    <div className="space-y-4">
      {/* Filters & Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {["ALL", "TRIAL", "ACTIVE", "LOCKED", "FROZEN"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari toko / nama owner..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Bisnis &amp; Pemilik</th>
                <th className="py-3 px-4">Lisensi & Outlet</th>
                <th className="py-3 px-4">Modul Plugin</th>
                <th className="py-3 px-4">Status & Masa Aktif</th>
                <th className="py-3 px-4 text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length > 0 ? (
                filteredTenants.map((t) => {
                  const owner = t.users[0];
                  const activeSub = t.subscriptions[0];
                  const plugins = activeSub?.plugins || [];
                  const isLoading = actionLoadingId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-100 text-sm">
                          {t.businessName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Owner: {owner?.name || "-"} &bull; {owner?.email}
                        </div>
                        {msg && msg.id === t.id && (
                          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {msg.text}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-200">
                            {activeSub?.licenseTier?.name || "Lisensi Basic"}
                          </span>
                          {activeSub && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                              {formatDurationBadge(activeSub)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {t.outlets?.length || 1} Cabang/Outlet
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {plugins.length > 0 ? (
                            plugins.map((p: any) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                              >
                                {getPluginIcon(p.plugin.code)}
                                {p.plugin.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-[11px]">
                              Tidak ada
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div>{getStatusBadge(t.status)}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          s/d{" "}
                          {t.trialEndAt
                            ? new Date(t.trialEndAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {isLoading ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Memproses...
                          </div>
                        ) : (
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {/* Extend +7 Hari */}
                            <button
                              onClick={() => handleExtend(t.id, 7)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                              title="Perpanjang trial 7 hari"
                            >
                              +7 Hari
                            </button>

                            {/* Extend +30 Hari */}
                            <button
                              onClick={() => handleExtend(t.id, 30)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-medium transition"
                              title="Perpanjang trial 30 hari"
                            >
                              +30 Hari
                            </button>

                            {/* Toggle ACTIVE */}
                            {t.status !== "ACTIVE" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(t.id, "ACTIVE")
                                }
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition"
                                title="Ubah status ke Active (Paid)"
                              >
                                Set Active
                              </button>
                            )}

                            {/* Toggle LOCKED */}
                            {t.status !== "LOCKED" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(t.id, "LOCKED")
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-[11px] font-medium transition"
                                title="Kunci akun (hentikan transaksi)"
                              >
                                Lock
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    Tidak ditemukan data tenant yang sesuai dengan filter.
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
