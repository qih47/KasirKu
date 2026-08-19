"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import {
  createLaundryOrderAction,
  updateLaundryStatusAction,
} from "@/plugins/laundry/actions";
import {
  Shirt,
  Plus,
  Clock,
  CheckCircle2,
  Printer,
  Sparkles,
  Phone,
  Scale,
  Sparkle,
  X,
  Loader2,
  ArrowRight,
  Package,
  Layers,
} from "lucide-react";
import { LaundryStatus } from "@prisma/client";

export function LaundryOrdersClient({
  initialData,
}: {
  initialData: any;
}) {
  const [data, setData] = useState(initialData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form input state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceType, setServiceType] = useState<"KILOAN" | "SATUAN">("KILOAN");
  const [weightKg, setWeightKg] = useState<number | "">(3);
  const [unitQty, setUnitQty] = useState<number | "">(1);
  const [pricePerUnit, setPricePerUnit] = useState<number | "">(8000);
  const [fragrance, setFragrance] = useState("Sakura Blossom");
  const [notes, setNotes] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(2);

  // Modal Cetak Nota
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !pricePerUnit) return;

    setLoading(true);
    try {
      await createLaundryOrderAction({
        outletId: data.currentOutletId,
        customerName,
        customerPhone,
        serviceType,
        weightKg: serviceType === "KILOAN" && weightKg ? Number(weightKg) : undefined,
        unitQty: serviceType === "SATUAN" && unitQty ? Number(unitQty) : undefined,
        pricePerUnit: Number(pricePerUnit),
        fragrance,
        notes,
        estimatedDays,
      });

      setShowAddModal(false);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal membuat order laundry.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: LaundryStatus) => {
    try {
      await updateLaundryStatusAction(orderId, status);
      window.location.reload();
    } catch (err: any) {
      toastError(err.message || "Gagal memperbarui status order.");
    }
  };

  const getStatusBadge = (status: LaundryStatus) => {
    switch (status) {
      case "RECEIVED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
            📥 Diterima
          </span>
        );
      case "WASHING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
            🌊 Sedang Dicuci
          </span>
        );
      case "DRYING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
            ☀️ Dikeringkan
          </span>
        );
      case "IRONING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
            👔 Disetrika
          </span>
        );
      case "READY":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
            ✨ Siap Diambil
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
            ✅ Selesai
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Laundry */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shirt className="w-3.5 h-3.5" />
            Modul Laundry Kiloan & Satuan
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Live Order Tracking & Cucian
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status cucian pelanggan dari penerimaan, proses cuci, setrika, hingga siap ambil.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Terima Cucian Baru</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Daftar Cucian Aktif
          </h3>
          <span className="text-xs text-slate-500">
            {data.activeOrders.length} order dalam pengerjaan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Layanan</th>
                <th className="py-3 px-4">Parfum</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.orders.length > 0 ? (
                data.orders.map((o: any) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {o.orderNumber}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {o.customerName}
                      </div>
                      {o.customerPhone && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {o.customerPhone}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {o.serviceType === "KILOAN"
                          ? `${o.weightKg} Kg`
                          : `${o.unitQty} Pcs`}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        @{Number(o.pricePerUnit).toLocaleString("id-ID")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {o.fragrance}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      Rp {Number(o.totalAmount).toLocaleString("id-ID")}
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(o.status)}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === "RECEIVED" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "WASHING")}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold"
                          >
                            Cuci &rarr;
                          </button>
                        )}
                        {o.status === "WASHING" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "DRYING")}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 text-[11px] font-bold"
                          >
                            Keringkan &rarr;
                          </button>
                        )}
                        {o.status === "DRYING" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "IRONING")}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] font-bold"
                          >
                            Setrika &rarr;
                          </button>
                        )}
                        {o.status === "IRONING" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "READY")}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[11px] font-bold"
                          >
                            Siap Ambil &rarr;
                          </button>
                        )}
                        {o.status === "READY" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "COMPLETED")}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold"
                          >
                            Serahkan (Selesai)
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActivePrintOrder(o);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                          title="Cetak Nota"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    Belum ada data cucian. Klik "Terima Cucian Baru" untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Order Laundry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-purple-600" /> Form Penerimaan Cucian Laundry
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Ibu Rina"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  No. WhatsApp (Untuk Notifikasi Siap Ambil)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Tipe Layanan
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => {
                      const val = e.target.value as "KILOAN" | "SATUAN";
                      setServiceType(val);
                      setPricePerUnit(val === "KILOAN" ? 8000 : 15000);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="KILOAN">Kiloan (Timbangan)</option>
                    <option value="SATUAN">Satuan (Bedcover/Jas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {serviceType === "KILOAN" ? "Berat (Kg)" : "Jumlah (Pcs)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={serviceType === "KILOAN" ? weightKg : unitQty}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : "";
                      if (serviceType === "KILOAN") setWeightKg(val);
                      else setUnitQty(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Pilihan Parfum
                  </label>
                  <select
                    value={fragrance}
                    onChange={(e) => setFragrance(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="Sakura Blossom">🌸 Sakura Blossom</option>
                    <option value="Lavender Relax">💜 Lavender Relax</option>
                    <option value="Ocean Fresh">🌊 Ocean Fresh</option>
                    <option value="Sweet Vanilla">🍦 Sweet Vanilla</option>
                    <option value="Tanpa Parfum">🚫 Tanpa Parfum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan Pakaian Khusus</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Baju putih jangan dicampur, noda di kerah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl flex justify-between items-center text-xs">
                <span className="font-semibold text-purple-900 dark:text-purple-200">
                  Total Estimasi:
                </span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400">
                  Rp{" "}
                  {(
                    (serviceType === "KILOAN"
                      ? Number(weightKg || 1)
                      : Number(unitQty || 1)) * Number(pricePerUnit || 0)
                  ).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Simpan & Cetak Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Laundry Receipt Modal */}
      {showPrintModal && activePrintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-purple-600" /> Nota Pengambilan Laundry
              </span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border border-slate-200 rounded-2xl bg-white space-y-4 text-xs font-mono">
              <div className="text-center border-b pb-3">
                <h3 className="text-base font-black uppercase">NOTA LAUNDRY</h3>
                <p className="text-xs font-bold text-purple-600 mt-1">
                  {activePrintOrder.orderNumber}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tgl Masuk: {new Date(activePrintOrder.createdAt).toLocaleString("id-ID")}
                </p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-bold">{activePrintOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Layanan:</span>
                  <span>{activePrintOrder.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kuantitas:</span>
                  <span>
                    {activePrintOrder.serviceType === "KILOAN"
                      ? `${activePrintOrder.weightKg} Kg`
                      : `${activePrintOrder.unitQty} Pcs`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parfum:</span>
                  <span>{activePrintOrder.fragrance}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-300 flex justify-between items-center text-sm font-black">
                <span>TOTAL:</span>
                <span className="text-purple-600">
                  Rp {Number(activePrintOrder.totalAmount).toLocaleString("id-ID")}
                </span>
              </div>

              <p className="text-[10px] text-center text-slate-400 pt-2 border-t">
                Harap bawa nota ini saat pengambilan cucian. Terima kasih!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
