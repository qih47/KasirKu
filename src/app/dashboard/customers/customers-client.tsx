"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  TrendingUp,
  ShoppingBag,
  Scissors,
  Shirt,
  Calendar,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Filter,
  Building2,
} from "lucide-react";
import {
  CustomersPageData,
  CustomerSummaryItem,
  getCustomersData,
  getCustomerDetail,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "@/modules/customer/actions";

interface CustomersClientProps {
  initialData: CustomersPageData;
}

export function CustomersClient({ initialData }: CustomersClientProps) {
  const [data, setData] = useState<CustomersPageData>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"visits" | "totalSpent" | "lastVisitAt" | "name" | "recent">("recent");
  const [selectedOutletId, setSelectedOutletId] = useState<string>(initialData.selectedOutletId || "ALL");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerSummaryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail 360° Drawer State
  const [detailCustomer, setDetailCustomer] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"transactions" | "bookings" | "laundry">("transactions");

  // Alert State
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showAlert = (type: "success" | "error", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const reloadData = async (query = searchQuery, sort = sortBy, outlet = selectedOutletId) => {
    setLoading(true);
    try {
      const res = await getCustomersData({ search: query, sortBy: sort, outletId: outlet });
      setData(res);
    } catch (err: any) {
      showAlert("error", err.message || "Gagal memuat data pelanggan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    reloadData(searchQuery, sortBy, selectedOutletId);
  };

  const handleSortChange = (newSort: any) => {
    setSortBy(newSort);
    reloadData(searchQuery, newSort, selectedOutletId);
  };

  const handleOutletChange = (newOutlet: string) => {
    setSelectedOutletId(newOutlet);
    reloadData(searchQuery, sortBy, newOutlet);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (customer: CustomerSummaryItem) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingCustomer) {
        await updateCustomerAction(editingCustomer.id, formData);
        showAlert("success", `Data pelanggan "${formData.name}" berhasil diperbarui!`);
      } else {
        await createCustomerAction(formData);
        showAlert("success", `Pelanggan baru "${formData.name}" berhasil ditambahkan!`);
      }
      setShowAddModal(false);
      reloadData();
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (customer: CustomerSummaryItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pelanggan "${customer.name}"? Riwayat transaksi lama tetap tersimpan.`)) {
      return;
    }

    try {
      await deleteCustomerAction(customer.id);
      showAlert("success", `Pelanggan "${customer.name}" berhasil dihapus.`);
      reloadData();
      if (detailCustomer?.id === customer.id) {
        setDetailCustomer(null);
      }
    } catch (err: any) {
      showAlert("error", err.message || "Gagal menghapus pelanggan.");
    }
  };

  const open360Detail = async (customerId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await getCustomerDetail(customerId);
      setDetailCustomer(detail);
      // Auto switch to available history tab
      if (detail.transactions.length > 0) {
        setActiveDetailTab("transactions");
      } else if (detail.bookings.length > 0) {
        setActiveDetailTab("bookings");
      } else if (detail.laundryOrders.length > 0) {
        setActiveDetailTab("laundry");
      }
    } catch (err: any) {
      showAlert("error", err.message || "Gagal memuat detail pelanggan.");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 ${alertMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === "success" ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{alertMsg.text}</span>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            Customer Database & CRM
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola profil pelanggan pintar, preferensi khusus, riwayat kunjungan, dan retensi multi-vertikal.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pelanggan Baru
        </button>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pelanggan
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {data.stats.totalCustomers.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">Orang</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aktif 30 Hari Terakhir
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">
              {data.stats.activeThisMonth.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">Pelanggan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Omset Pelanggan
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              Rp {data.stats.totalSpentAll.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata LTV
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-600">
              Rp {data.stats.averageSpentPerCustomer.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">/ orang</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, no HP / WA, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Multi-Outlet Filter */}
          {data.outlets && data.outlets.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedOutletId}
                onChange={(e) => handleOutletChange(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">🏢 Semua Cabang</option>
                {data.outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    📍 {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutkan:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="recent">Terbaru Ditambahkan</option>
            <option value="visits">Kunjungan Terbanyak</option>
            <option value="totalSpent">Total Belanja Tertinggi</option>
            <option value="lastVisitAt">Kunjungan Terakhir</option>
            <option value="name">Nama (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {data.customers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Belum Ada Data Pelanggan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Tambahkan pelanggan pertama Anda atau lakukan transaksi di kasir POS untuk mengumpulkan basis data pelanggan secara otomatis.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Pelanggan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pelanggan &amp; Cabang</th>
                  <th className="py-3.5 px-4">Kontak &amp; Alamat</th>
                  <th className="py-3.5 px-4">Preferensi / Catatan</th>
                  <th className="py-3.5 px-4 text-center">Kunjungan</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja (LTV)</th>
                  <th className="py-3.5 px-4">Terakhir Hadir</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.customers.map((c) => {
                  const initials = c.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const cleanPhone = c.phone?.replace(/[^0-9]/g, "") || "";
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}`
                    : null;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => open360Detail(c.id)}
                    >
                      {/* Customer Name & Branch Outlet */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                              {c.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-400">ID: {c.id.slice(0, 8)}</span>
                              {c.lastOutletName ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {c.lastOutletName}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Universal</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Address */}
                      <td className="py-3.5 px-4 text-xs" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {c.phone ? (
                            <a
                              href={waUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md font-semibold transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {c.phone}
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Tanpa No HP</span>
                          )}

                          {c.email && (
                            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {c.email}
                            </div>
                          )}

                          {c.address && (
                            <div className="flex items-center gap-1 text-slate-500 text-[11px] max-w-[200px] truncate">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{c.address}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Notes / Preferences */}
                      <td className="py-3.5 px-4 text-xs">
                        {c.notes ? (
                          <div className="inline-flex items-start gap-1.5 bg-amber-50 border border-amber-200/80 text-amber-900 px-2.5 py-1 rounded-lg max-w-[220px]">
                            <FileText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <span className="text-[11px] line-clamp-2">{c.notes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Visits */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${c.visits >= 10
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : c.visits >= 3
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                        >
                          {c.visits} x
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          Rp {c.totalSpent.toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* Last Visit */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {c.lastVisitAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(c.lastVisitAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => open360Detail(c.id)}
                            title="Lihat Profil 360°"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Pelanggan"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            title="Hapus Pelanggan"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Tambah / Edit Pelanggan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  {editingCustomer ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingCustomer ? "Edit Profil Pelanggan" : "Tambah Pelanggan Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data tersimpan ke database CRM tenant dan otomatis tersedia di kasir POS.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="budi@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Jl. Mawar No. 12, Kelurahan ..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferensi & Catatan Khusus
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Alergi kacang, Parfum favorit: Sakura, Potongan favorit: Sidepart fade, Barber langganan: Mas Budi"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">
                  Catatan ini akan otomatis muncul saat kasir memilih pelanggan ini di POS.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {formLoading ? "Menyimpan..." : editingCustomer ? "Simpan Perubahan" : "Tambahkan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 2: 360° Detail Profil Pelanggan */}
      {detailCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header Profil */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex-shrink-0 relative">
              <button
                onClick={() => setDetailCustomer(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0">
                  {detailCustomer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-white">{detailCustomer.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      {detailCustomer.visits}x Kunjungan
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                    {detailCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" />
                        {detailCustomer.phone}
                      </span>
                    )}
                    {detailCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        {detailCustomer.email}
                      </span>
                    )}
                    {detailCustomer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {detailCustomer.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                    Total Belanja (LTV)
                  </div>
                  <div className="text-lg font-black text-emerald-400">
                    Rp {detailCustomer.totalSpent.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Notes Callout */}
              {detailCustomer.notes && (
                <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/15 text-xs text-amber-200 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Catatan & Preferensi: </span>
                    {detailCustomer.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 flex-shrink-0">
              <button
                onClick={() => setActiveDetailTab("transactions")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeDetailTab === "transactions"
                    ? "border-indigo-600 text-indigo-600 bg-white shadow-sm -mb-[1px] rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Riwayat Transaksi POS ({detailCustomer.transactions.length})
              </button>

              <button
                onClick={() => setActiveDetailTab("bookings")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeDetailTab === "bookings"
                    ? "border-indigo-600 text-indigo-600 bg-white shadow-sm -mb-[1px] rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                Riwayat Barbershop ({detailCustomer.bookings.length})
              </button>

              <button
                onClick={() => setActiveDetailTab("laundry")}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeDetailTab === "laundry"
                    ? "border-indigo-600 text-indigo-600 bg-white shadow-sm -mb-[1px] rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                Riwayat Laundry ({detailCustomer.laundryOrders.length})
              </button>
            </div>

            {/* Tab Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {/* TAB 1: Transaksi POS */}
              {activeDetailTab === "transactions" && (
                <div className="space-y-3">
                  {detailCustomer.transactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Belum ada riwayat transaksi belanja POS.
                    </div>
                  ) : (
                    detailCustomer.transactions.map((trx: any) => (
                      <div
                        key={trx.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {trx.transactionNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {trx.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              • {trx.outlet?.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap gap-1">
                            {trx.items?.map((item: any, idx: number) => (
                              <span key={item.id} className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {item.qty}x {item.product?.name}
                              </span>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(trx.createdAt).toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">
                            Rp {trx.totalAmount.toLocaleString("id-ID")}
                          </div>
                          {trx.discountAmount > 0 && (
                            <div className="text-[10px] text-emerald-600">
                              Hemat: Rp {trx.discountAmount.toLocaleString("id-ID")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Barbershop Bookings */}
              {activeDetailTab === "bookings" && (
                <div className="space-y-3">
                  {detailCustomer.bookings.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Belum ada riwayat booking atau treatment barbershop.
                    </div>
                  ) : (
                    detailCustomer.bookings.map((b: any) => (
                      <div
                        key={b.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {b.service?.name || "Treatment Barbershop"}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700">
                              {b.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Kapster: <span className="font-semibold">{b.barber?.name || "Stylist Bisnis"}</span> • Kursi: #{b.chairNumber || 1}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(b.scheduledAt).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-right font-bold text-slate-900 text-xs">
                          {b.queueNumber}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Laundry Orders */}
              {activeDetailTab === "laundry" && (
                <div className="space-y-3">
                  {detailCustomer.laundryOrders.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Belum ada riwayat pesanan laundry.
                    </div>
                  ) : (
                    detailCustomer.laundryOrders.map((l: any) => (
                      <div
                        key={l.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {l.orderNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700">
                              {l.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Paket: <span className="font-semibold">{l.serviceType}</span> ({l.weightKg ? `${l.weightKg} Kg` : `${l.unitQty} Pcs`}) • Parfum: {l.fragrance || "Standard"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(l.createdAt).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-right font-black text-slate-900 text-xs">
                          Rp {Number(l.totalAmount || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
