"use client";

import { useState } from "react";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";
import {
  createCashierAction,
  toggleStaffStatusAction,
  deleteStaffAction,
} from "@/modules/tenant/staff-actions";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Power,
  Store,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";

export function StaffClient({
  initialData,
}: {
  initialData: {
    staffList: any[];
    outlets: any[];
    licenseTierName: string;
    kasirLimit: number | null;
    currentCashierCount: number;
    isQuotaFull: boolean;
  };
}) {
  const { locale, tr } = useTranslation();
  const [data, setData] = useState(initialData);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [outletId, setOutletId] = useState(data.outlets[0]?.id || "");

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createCashierAction({
        name,
        email,
        password,
        outletId,
      });

      if (res.success) {
        setData((prev) => ({
          ...prev,
          staffList: [res.user, ...prev.staffList],
          currentCashierCount: prev.currentCashierCount + 1,
          isQuotaFull:
            prev.kasirLimit !== null &&
            prev.currentCashierCount + 1 >= prev.kasirLimit,
        }));

        setSuccessMsg(`Kasir "${name}" berhasil ditambahkan!`);
        setShowModal(false);
        setName("");
        setEmail("");
        setPassword("");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal membuat akun kasir.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await toggleStaffStatusAction(userId);
      setData((prev) => ({
        ...prev,
        staffList: prev.staffList.map((s) =>
          s.id === userId ? { ...s, isActive: !s.isActive } : s
        ),
      }));
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status staff.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (userId: string, staffName: string) => {
    const ok = await swalConfirm(
      "Hapus Kasir?",
      `Kasir "${staffName}" akan dihapus permanen.`,
      { confirmText: "Ya, Hapus", isDanger: true }
    );
    if (!ok) return;
    setActionLoadingId(userId);
    try {
      await deleteStaffAction(userId);
      setData((prev) => ({
        ...prev,
        staffList: prev.staffList.filter((s) => s.id !== userId),
        currentCashierCount: prev.currentCashierCount - 1,
        isQuotaFull:
          prev.kasirLimit !== null &&
          prev.currentCashierCount - 1 >= prev.kasirLimit,
      }));
      toastSuccess(`Kasir "${staffName}" berhasil dihapus.`);
    } catch (err: any) {
      toastError(err.message || "Gagal menghapus kasir.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {tr("Manajemen Staf & Hak Akses")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {tr("Atur akun kasir, kapster, barista, dan hak akses staf.")}
          </p>
        </div>

        <button
          onClick={() => {
            if (data.isQuotaFull) {
              toastError("Kuota akun kasir telah mencapai batas maksimal paket Anda.");
              return;
            }
            setShowModal(true);
          }}
          disabled={data.isQuotaFull}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" />
          <span>{tr("Tambah Staf")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quota Progress Card - Clean White */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Kuota Kasir Aktif
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {data.licenseTierName}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-950">
                {data.currentCashierCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {data.kasirLimit ?? "Unlimited"} Kasir
              </span>
            </div>

            <div className="w-full bg-[#F8F9FD] border border-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  data.isQuotaFull ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{
                  width: `${
                    data.kasirLimit
                      ? Math.min((data.currentCashierCount / data.kasirLimit) * 100, 100)
                      : 20
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Table - Clean White */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FD] text-slate-600 border-b border-slate-200/80 font-bold">
              <tr>
                <th className="py-3.5 px-6">Nama & Email</th>
                <th className="py-3.5 px-6">Role Akun</th>
                <th className="py-3.5 px-6">Penugasan Outlet</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.staffList.map((staff) => {
                const isOwner = staff.role === "OWNER";
                const isLoading = actionLoadingId === staff.id;

                return (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-50/80 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-950 text-sm">
                        {staff.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {staff.email}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOwner
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {staff.role}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>{staff.outlet?.name || "Semua Cabang"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          staff.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            staff.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {staff.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {isOwner ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Pemilik Utama
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(staff.id)}
                            disabled={isLoading}
                            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              staff.isActive
                                ? "bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                            title={staff.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(staff.id, staff.name)}
                            disabled={isLoading}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition"
                            title="Hapus Kasir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Kasir */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2 text-slate-950">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Tambah Akun Kasir Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Kasir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ahmad Dani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Email Login Kasir *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ahmad.kasir@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Password Login Kasir *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Penugasan Cabang Outlet *
                </label>
                <select
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {data.outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    "Buat Akun Kasir"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
