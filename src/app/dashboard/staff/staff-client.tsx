"use client";

import { useState } from "react";
import { toastSuccess, toastError, swalConfirm } from "@/lib/swal";
import {
  createStaffAction,
  updateStaffAction,
  toggleStaffStatusAction,
  deleteStaffAction,
  getStaffData,
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
  Phone,
  Briefcase,
  DollarSign,
  Percent,
  Edit2,
  Coffee,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  Utensils,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/language-context";

import Link from "next/link";

export function StaffClient({
  initialData,
}: {
  initialData: {
    staffList: any[];
    outlets: any[];
    licenseTierName: string;
    activePlugins?: Array<{ code: string; name: string }>;
    kasirLimit: number | null;
    activeCashierCount: number;
    operationalStaffCount: number;
    totalStaffCount: number;
    isQuotaFull: boolean;
  };
}) {
  const { locale, tr } = useTranslation();
  const [data, setData] = useState(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  const isCafeActive = (data.activePlugins || []).some((p) => p.code === "cafe");
  const isBarberActive = (data.activePlugins || []).some((p) => p.code === "barbershop");
  const isLaundryActive = (data.activePlugins || []).some((p) => p.code === "laundry");
  const isRetailActive = (data.activePlugins || []).some((p) => p.code === "retail");

  // Dynamic positions tailored to active vertical
  const availablePositions = [
    { value: "KASIR", label: "Kasir POS (Front Desk)" },
    ...(isBarberActive
      ? [
          { value: "BARBER", label: "Barber / Capster (Potong Rambut)" },
          { value: "HAIR_STYLIST", label: "Hair Stylist / Beautician" },
        ]
      : []),
    ...(isCafeActive
      ? [
          { value: "BARISTA", label: "Barista (Minuman & Kopi)" },
          { value: "WAITER", label: "Waiter / Server Resto" },
          { value: "COOK", label: "Cook / Chef Dapur" },
          { value: "BARTENDER", label: "Bartender" },
        ]
      : []),
    ...(isLaundryActive
      ? [
          { value: "PENCUCI", label: "Operator Cuci (Washer)" },
          { value: "PENYETRIKA", label: "Penyetrika (Ironer)" },
          { value: "KURIR", label: "Kurir Antar-Jemput" },
        ]
      : []),
    ...(isRetailActive || (!isBarberActive && !isCafeActive && !isLaundryActive)
      ? [
          { value: "PRAMUNIAGA", label: "Pramuniaga / Sales Toko" },
          { value: "STAFF_GUDANG", label: "Staff Gudang / Inventory" },
        ]
      : []),
    { value: "SUPERVISOR", label: "Supervisor / Admin Cabang" },
  ];

  // Filters
  const [filterOutlet, setFilterOutlet] = useState<string>("ALL");
  const [filterPosition, setFilterPosition] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [outletId, setOutletId] = useState(data.outlets[0]?.id || "");
  const [position, setPosition] = useState("KASIR");
  const [hasPosAccess, setHasPosAccess] = useState(true);
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [baseSalary, setBaseSalary] = useState<number | string>("");
  const [salaryType, setSalaryType] = useState("MONTHLY");
  const [joinDate, setJoinDate] = useState<string>("");
  const [allowanceMeal, setAllowanceMeal] = useState<number | string>("");
  const [allowanceTransport, setAllowanceTransport] = useState<number | string>("");
  const [allowanceOther, setAllowanceOther] = useState<number | string>("");
  const [overtimeRate, setOvertimeRate] = useState<number | string>("");
  const [showAllowances, setShowAllowances] = useState(false);
  const [isCommissionActive, setIsCommissionActive] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState<number | string>("");
  const [commissionFlat, setCommissionFlat] = useState<number | string>("");

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const refreshStaffList = async () => {
    try {
      const refreshed = await getStaffData(filterOutlet);
      setData(refreshed);
    } catch (err) {
      console.error("Error refreshing staff data:", err);
    }
  };

  const openCreateModal = () => {
    setEditItem(null);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setOutletId(data.outlets[0]?.id || "");
    setPosition("KASIR");
    setHasPosAccess(true);
    setEmploymentType("FULL_TIME");
    setJoinDate(new Date().toISOString().split("T")[0]);
    setBaseSalary("");
    setSalaryType("MONTHLY");
    setAllowanceMeal("");
    setAllowanceTransport("");
    setAllowanceOther("");
    setOvertimeRate("");
    setShowAllowances(false);
    setIsCommissionActive(false);
    setCommissionPercent("");
    setCommissionFlat("");
    setShowModal(true);
  };

  const openEditModal = (staff: any) => {
    setEditItem(staff);
    setName(staff.name || "");
    setEmail(staff.email || "");
    setPhone(staff.phone || "");
    setPassword("");
    setOutletId(staff.outletId || (data.outlets[0]?.id || ""));
    setPosition(staff.position || "KASIR");
    setHasPosAccess(staff.hasPosAccess !== false);
    setEmploymentType(staff.employmentType || "FULL_TIME");
    setJoinDate(
      staff.joinDate
        ? new Date(staff.joinDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setBaseSalary(staff.baseSalary !== null && staff.baseSalary !== undefined ? String(staff.baseSalary) : "");
    setSalaryType(staff.salaryType || "MONTHLY");
    setAllowanceMeal(staff.allowanceMeal !== null && staff.allowanceMeal !== undefined ? String(staff.allowanceMeal) : "");
    setAllowanceTransport(staff.allowanceTransport !== null && staff.allowanceTransport !== undefined ? String(staff.allowanceTransport) : "");
    setAllowanceOther(staff.allowanceOther !== null && staff.allowanceOther !== undefined ? String(staff.allowanceOther) : "");
    setOvertimeRate(staff.overtimeRate !== null && staff.overtimeRate !== undefined ? String(staff.overtimeRate) : "");
    setShowAllowances(
      Boolean(staff.allowanceMeal || staff.allowanceTransport || staff.allowanceOther || staff.overtimeRate)
    );
    setIsCommissionActive(Boolean(staff.isCommissionActive));
    setCommissionPercent(staff.commissionPercent !== null && staff.commissionPercent !== undefined ? String(staff.commissionPercent) : "");
    setCommissionFlat(staff.commissionFlat !== null && staff.commissionFlat !== undefined ? String(staff.commissionFlat) : "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editItem) {
        // Update Action
        await updateStaffAction({
          id: editItem.id,
          name,
          email,
          phone: phone || undefined,
          password: password || undefined,
          outletId: outletId || null,
          position,
          hasPosAccess,
          employmentType,
          joinDate: joinDate || undefined,
          baseSalary: baseSalary !== "" ? Number(baseSalary) : null,
          salaryType,
          allowanceMeal: allowanceMeal !== "" ? Number(allowanceMeal) : null,
          allowanceTransport: allowanceTransport !== "" ? Number(allowanceTransport) : null,
          allowanceOther: allowanceOther !== "" ? Number(allowanceOther) : null,
          overtimeRate: overtimeRate !== "" ? Number(overtimeRate) : null,
          isCommissionActive,
          commissionPercent: isCommissionActive && commissionPercent !== "" ? Number(commissionPercent) : null,
          commissionFlat: isCommissionActive && commissionFlat !== "" ? Number(commissionFlat) : null,
        });

        toastSuccess(`Data staf "${name}" berhasil diperbarui!`);
      } else {
        // Create Action
        await createStaffAction({
          name,
          email,
          phone: phone || undefined,
          password: password || undefined,
          outletId: outletId || null,
          position,
          hasPosAccess,
          employmentType,
          joinDate: joinDate || undefined,
          baseSalary: baseSalary !== "" ? Number(baseSalary) : null,
          salaryType,
          allowanceMeal: allowanceMeal !== "" ? Number(allowanceMeal) : null,
          allowanceTransport: allowanceTransport !== "" ? Number(allowanceTransport) : null,
          allowanceOther: allowanceOther !== "" ? Number(allowanceOther) : null,
          overtimeRate: overtimeRate !== "" ? Number(overtimeRate) : null,
          isCommissionActive,
          commissionPercent: isCommissionActive && commissionPercent !== "" ? Number(commissionPercent) : null,
          commissionFlat: isCommissionActive && commissionFlat !== "" ? Number(commissionFlat) : null,
        });

        toastSuccess(`Staf "${name}" berhasil ditambahkan!`);
      }

      setShowModal(false);
      await refreshStaffList();
    } catch (err: any) {
      toastError(err.message || "Gagal menyimpan data staf.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId: string, currentStatus: boolean) => {
    setActionLoadingId(userId);
    try {
      await toggleStaffStatusAction(userId);
      setData((prev) => ({
        ...prev,
        staffList: prev.staffList.map((s) =>
          s.id === userId ? { ...s, isActive: !s.isActive } : s
        ),
      }));
      toastSuccess(
        !currentStatus ? "Akun staf diaktifkan kembali." : "Akun staf dinonaktifkan."
      );
    } catch (err: any) {
      toastError(err.message || "Gagal mengubah status staf.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (userId: string, staffName: string) => {
    const isConfirmed = await swalConfirm(
      "Hapus Karyawan?",
      `Apakah Anda yakin ingin menghapus data staf "${staffName}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!isConfirmed) return;

    setActionLoadingId(userId);
    try {
      await deleteStaffAction(userId);
      setData((prev) => ({
        ...prev,
        staffList: prev.staffList.filter((s) => s.id !== userId),
      }));
      toastSuccess(`Data staf "${staffName}" berhasil dihapus.`);
    } catch (err: any) {
      toastError(err.message || "Gagal menghapus data staf.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper badge position
  const getPositionBadge = (pos: string) => {
    switch (pos?.toUpperCase()) {
      case "KASIR":
        return { label: "Kasir POS", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: ShoppingBag };
      case "BARISTA":
        return { label: "Barista", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20", icon: Coffee };
      case "WAITER":
        return { label: "Waiter / Server", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: User };
      case "BARBER":
        return { label: "Barber / Stylist", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20", icon: Scissors };
      case "PENYETRIKA":
        return { label: "Penyetrika", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Shirt };
      case "PENCUCI":
        return { label: "Pencuci (Washer)", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: Shirt };
      case "KURIR":
        return { label: "Kurir Delivery", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Store };
      case "STAFF_GUDANG":
        return { label: "Staff Gudang", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20", icon: Briefcase };
      case "SUPERVISOR":
        return { label: "Supervisor", color: "bg-pink-500/10 text-pink-600 border-pink-500/20", icon: Shield };
      default:
        return { label: pos || "Staff Operasional", color: "bg-slate-100 text-slate-700 border-slate-200", icon: User };
    }
  };

  // Filtered staff
  const filteredStaff = data.staffList.filter((s) => {
    if (filterOutlet !== "ALL" && s.outletId !== filterOutlet) return false;
    if (filterPosition !== "ALL" && s.position !== filterPosition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      const matchPhone = s.phone?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Manajemen Staf &amp; Karyawan</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola seluruh tim operasional toko (Kasir, Barista, Barber, Penyetrika, Waiter) per cabang.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/payroll"
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition flex items-center gap-2 flex-shrink-0 cursor-pointer border border-emerald-500/20 shadow-xs"
          >
            <DollarSign className="w-4 h-4" />
            <span>Rekap Gaji &amp; Slip (Payroll)</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan Baru</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Seluruh Tim
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {data.totalStaffCount}{" "}
            <span className="text-xs text-slate-400 font-semibold">Orang</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Semua karyawan terdaftar</p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Kasir Aktif (Akses POS)
          </span>
          <p className="text-2xl font-black text-emerald-600">
            {data.activeCashierCount}{" "}
            <span className="text-xs text-slate-400 font-normal">
              / {data.kasirLimit !== null ? `${data.kasirLimit} maks` : "Unlimited"}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Memotong kuota {data.licenseTierName}
          </p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Staf Operasional Non-Login
          </span>
          <p className="text-2xl font-black text-indigo-600">
            {data.operationalStaffCount}{" "}
            <span className="text-xs text-slate-400 font-semibold">Orang</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Barista, Barber, Waiter, dll (Tanpa Batas)</p>
        </div>

        <div className="p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cabang Penempatan
          </span>
          <p className="text-2xl font-black text-purple-600">
            {data.outlets.length}{" "}
            <span className="text-xs text-slate-400 font-semibold">Outlet</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Tersebar di seluruh cabang aktif</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Outlet Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterOutlet}
              onChange={(e) => setFilterOutlet(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Cabang</option>
              {data.outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Posisi Jabatan</option>
              <option value="KASIR">Kasir POS</option>
              <option value="BARISTA">Barista</option>
              <option value="WAITER">Waiter / Server</option>
              <option value="BARBER">Barber / Stylist</option>
              <option value="PENYETRIKA">Penyetrika (Laundry)</option>
              <option value="PENCUCI">Pencuci (Laundry)</option>
              <option value="KURIR">Kurir Delivery</option>
              <option value="STAFF_GUDANG">Staff Gudang</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, no HP..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Nama &amp; Kontak</th>
                <th className="py-3.5 px-4">Cabang Penempatan</th>
                <th className="py-3.5 px-4">Posisi Jabatan</th>
                <th className="py-3.5 px-4">Akses POS</th>
                <th className="py-3.5 px-4">Struktur Gaji / Komisi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data karyawan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const posBadge = getPositionBadge(staff.position || "KASIR");
                  const PosIcon = posBadge.icon;
                  const isOwner = staff.role === "OWNER";

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                    >
                      {/* 1. Name & Contacts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-900 dark:text-white font-bold block">
                                {staff.name}
                              </strong>
                              {isOwner && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                                  OWNER
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {staff.email}
                            </span>
                            {staff.phone && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                                <Phone className="w-2.5 h-2.5" />
                                {staff.phone}
                              </span>
                            )}
                            {staff.joinDate && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                📅 Masuk: {new Date(staff.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Branch */}
                      <td className="py-3.5 px-4">
                        {staff.outlet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            {staff.outlet.name}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic">
                            Semua Cabang (Mobile)
                          </span>
                        )}
                      </td>

                      {/* 3. Position Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${posBadge.color}`}
                        >
                          <PosIcon className="w-3.5 h-3.5" />
                          <span>{posBadge.label}</span>
                        </span>
                      </td>

                      {/* 4. POS Access */}
                      <td className="py-3.5 px-4">
                        {staff.hasPosAccess !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3" />
                            <span>Bisa Buka POS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <span>Non-Login (Operasional)</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Salary Structure & Commission Status */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {staff.salaryType === "COMMISSION_ONLY" ? (
                          <div className="font-bold text-indigo-600">Bagi Hasil Murni</div>
                        ) : staff.baseSalary ? (
                          <div className="text-slate-800 dark:text-slate-200 font-bold">
                            Rp {Number(staff.baseSalary).toLocaleString("id-ID")}{" "}
                            <span className="text-[9.5px] font-semibold text-slate-400">
                              /{staff.salaryType === "DAILY" ? "hari" : staff.salaryType === "PER_SHIFT" ? "shift" : "bulan"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Tanpa Gaji Tetap</span>
                        )}

                        {staff.overtimeRate ? (
                          <div className="text-[9.5px] text-slate-500 font-normal">
                            ⏰ Lembur: Rp {Number(staff.overtimeRate).toLocaleString("id-ID")}/jam
                          </div>
                        ) : null}

                        {staff.isCommissionActive ? (
                          staff.commissionPercent ? (
                            <div className="text-emerald-600 font-bold text-[10px]">
                              + {staff.commissionPercent}% Bagi Hasil
                            </div>
                          ) : staff.commissionFlat ? (
                            <div className="text-emerald-600 font-bold text-[10px]">
                              + Rp {Number(staff.commissionFlat).toLocaleString("id-ID")} / Unit
                            </div>
                          ) : (
                            <div className="text-emerald-600 font-semibold text-[10px]">Komisi Aktif</div>
                          )
                        ) : (
                          <span className="inline-block text-[9.5px] text-slate-400 font-normal mt-0.5">
                            Pure Gaji (Tanpa Komisi)
                          </span>
                        )}
                      </td>

                      {/* 6. Active Toggle */}
                      <td className="py-3.5 px-4">
                        {!isOwner ? (
                          <button
                            onClick={() => handleToggle(staff.id, staff.isActive)}
                            disabled={actionLoadingId === staff.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold transition cursor-pointer ${
                              staff.isActive
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                staff.isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{staff.isActive ? "Aktif" : "Non-aktif"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">Aktif</span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {actionLoadingId === staff.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(staff)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Edit Profil &amp; Gaji"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!isOwner && (
                              <button
                                onClick={() => handleDelete(staff.id, staff.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Karyawan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {editItem ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lengkapi profil staf, penugasan cabang, dan pengaturan komisi/gaji.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dimas Prasetyo"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  />
                </div>
              </div>

              {/* Email & Cabang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Email Karyawan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dimas@toko.com"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Penempatan Cabang
                  </label>
                  <select
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                  >
                    <option value="">Semua Cabang (Mobile)</option>
                    {data.outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jabatan / Role (Dinamis Sesuai Plugin Toko) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Posisi / Jabatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      if (e.target.value === "KASIR") setHasPosAccess(true);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                  >
                    {availablePositions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Status Ikatan Kerja
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                  >
                    <option value="FULL_TIME">Karyawan Tetap (Full-time)</option>
                    <option value="PART_TIME">Paruh Waktu (Part-time)</option>
                    <option value="FREELANCE">Freelance / Harian</option>
                    <option value="COMMISSION_ONLY">Bagi Hasil Murni (Komisi Saja)</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Mulai Bekerja (Join Date) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Mulai Bekerja (Join Date)
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <span className="text-[10px] text-slate-400 block">
                  Digunakan untuk otomatisasi perhitungan gaji prorata jika staf baru bergabung di tengah periode cut-off.
                </span>
              </div>

              {/* Hak Akses POS Switch */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Berikan Akses Login Kasir POS?
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Hanya aktifkan jika staf ini ditugaskan mengoperasikan terminal kasir.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPosAccess}
                    onChange={(e) => setHasPosAccess(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {hasPosAccess && (
                  <div className="space-y-1 animate-fadeIn pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {editItem ? "Password / PIN POS Baru (Kosongkan jika tidak diubah)" : "Password / PIN Akses POS *"}
                    </label>
                    <input
                      type="password"
                      required={!editItem && hasPosAccess}
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter PIN/Password"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                )}
              </div>

              {/* Pengaturan Gaji & Komisi */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Struktur Penggajian &amp; Komisi (Payroll)
                  </span>
                </div>

                {/* Gaji Pokok & Periode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Gaji Pokok Utama (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      placeholder="Contoh: 2500000"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Skema / Periode Gaji Pokok
                    </label>
                    <select
                      value={salaryType}
                      onChange={(e) => setSalaryType(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                    >
                      <option value="MONTHLY">Bulanan Tetap (Monthly Fixed)</option>
                      <option value="DAILY">Harian (Rp / Hari Masuk)</option>
                      <option value="PER_SHIFT">Per Shift (Rp / Shift Kerja)</option>
                      <option value="COMMISSION_ONLY">Bagi Hasil Murni (Komisi Saja)</option>
                      <option value="NONE">Tanpa Gaji Tetap</option>
                    </select>
                  </div>
                </div>

                {/* Toggle Tunjangan & Tarif Lembur Opsional */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAllowances(!showAllowances)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tunjangan Tetap &amp; Tarif Lembur (Opsional)</span>
                    </span>
                    {showAllowances ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showAllowances && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          🍽️ Uang Makan (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={allowanceMeal}
                          onChange={(e) => setAllowanceMeal(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          🛵 Uang Transport (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={allowanceTransport}
                          onChange={(e) => setAllowanceTransport(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          🎖️ Tunjangan Jabatan / Lain (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={allowanceOther}
                          onChange={(e) => setAllowanceOther(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          ⏰ Tarif Uang Lembur / Jam (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={overtimeRate}
                          onChange={(e) => setOvertimeRate(e.target.value)}
                          placeholder="Contoh: 25000"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Skema Komisi / Bagi Hasil (Toggle Eksplisit Pure Gaji vs Komisi) */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Aktifkan Skema Bagi Hasil / Komisi POS?
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isCommissionActive
                          ? "Staf ini akan muncul di pilihan petugas keranjang kasir POS."
                          : "Status Pure Gaji: Tanpa komisi dan disembunyikan dari dropdown kasir."}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isCommissionActive}
                      onChange={(e) => setIsCommissionActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {isCommissionActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {isBarberActive
                            ? "Komisi Bagi Hasil Jasa (%)"
                            : isLaundryActive
                            ? "Bagi Hasil Cuci / Setrika (%)"
                            : isCafeActive
                            ? "Bagi Hasil Menu Cafe (%)"
                            : "Insentif Penjualan Produk (%)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={commissionPercent}
                          onChange={(e) => setCommissionPercent(e.target.value)}
                          placeholder={
                            isBarberActive
                              ? "Contoh: 30 (% jasa potong)"
                              : isLaundryActive
                              ? "Contoh: 20 (% bagi hasil cuci)"
                              : isCafeActive
                              ? "Contoh: 5 (% omset shift)"
                              : "Contoh: 5 (% penjualan)"
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {isBarberActive
                            ? "Komisi Flat per Customer (Rp)"
                            : isLaundryActive
                            ? "Komisi per Kg Laundry (Rp)"
                            : isCafeActive
                            ? "Komisi Flat per Shift / Porsi (Rp)"
                            : "Komisi Flat per Transaksi (Rp)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={commissionFlat}
                          onChange={(e) => setCommissionFlat(e.target.value)}
                          placeholder={
                            isBarberActive
                              ? "Contoh: 10000 (per customer)"
                              : isLaundryActive
                              ? "Contoh: 1500 (per kg)"
                              : isCafeActive
                              ? "Contoh: 2000 (per porsi)"
                              : "Contoh: 5000 (per transaksi)"
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editItem ? "Simpan Perubahan" : "Simpan Karyawan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
