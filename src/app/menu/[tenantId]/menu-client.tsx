"use client";

import { useState } from "react";
import { toastError } from "@/lib/swal";
import { submitSelfOrderAction } from "@/modules/self-order/actions";
import {
  Coffee,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  User,
  MapPin,
  Utensils,
  X,
  FileText,
  Phone,
  DollarSign,
  QrCode,
  Sparkles,
  Store,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface TableItem {
  id: string;
  tableNumber: string;
  status: string;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  category: string;
  type: string;
  stockQty?: number | null;
}

interface CustomerMenuClientProps {
  tenant: {
    id: string;
    businessName: string;
    logoUrl?: string | null;
    outletId: string;
    outletName: string;
  };
  tables: TableItem[];
  initialTableQuery?: string;
  products: ProductItem[];
}

export function CustomerMenuClient({
  tenant,
  tables = [],
  initialTableQuery,
  products = [],
}: CustomerMenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<{ [id: string]: { product: ProductItem; qty: number; notes?: string } }>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState(
    initialTableQuery || (tables[0]?.tableNumber || "Meja 01")
  );
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UNPAID_CASH" | "PAID_ONLINE">("UNPAID_CASH");

  const [showCartModal, setShowCartModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const cur = prev[product.id]?.qty || 0;
      return {
        ...prev,
        [product.id]: { product, qty: cur + 1 },
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const cur = prev[productId]?.qty || 0;
      if (cur <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: { ...prev[productId], qty: cur - 1 },
      };
    });
  };

  const totalAmount = Object.values(cart).reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  const totalCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory;
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toastError("Harap masukkan nama pemesan.");
      return;
    }
    if (totalCount === 0) {
      toastError("Keranjang belanja Anda masih kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = Object.values(cart).map((it) => ({
        productId: it.product.id,
        name: it.product.name,
        qty: it.qty,
        price: it.product.price,
        notes: it.notes,
        type: it.product.type,
      }));

      const res = await submitSelfOrderAction({
        tenantId: tenant.id,
        outletId: tenant.outletId,
        verticalType: "CAFE",
        customerName,
        customerPhone: customerPhone.trim() || undefined,
        tableNumber,
        items: itemsPayload,
        customerNotes: customerNotes.trim() || undefined,
        paymentStatus: paymentMethod,
      });

      if (res.success && res.order) {
        setSubmittedOrder(res.order);
        setCart({});
        setShowCartModal(false);
      }
    } catch (err: any) {
      toastError(err.message || "Gagal mengirimkan pesanan mandiri.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS TICKET VIEW
  if (submittedOrder) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
              Pesanan Berhasil Terkirim ke Kasir
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {submittedOrder.orderNumber}
            </h2>
            <p className="text-xs text-slate-400">
              {tenant.businessName} • {submittedOrder.tableNumber}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-left text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Pemesan:</span>
              <span className="font-bold text-white">{submittedOrder.customerName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Metode Bayar:</span>
              <span className="font-bold text-indigo-400">
                {submittedOrder.paymentStatus === "PAID_ONLINE"
                  ? "QRIS Dinamis (Online)"
                  : "Bayar Tunai di Kasir"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 font-black text-sm">
              <span className="text-white">Total Tagihan:</span>
              <span className="text-emerald-400">
                Rp {submittedOrder.totalAmount?.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[11px] text-indigo-300 text-left flex items-start gap-2">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              Pesanan Anda sedang disiapkan oleh tim barista/dapur. {submittedOrder.paymentStatus === "UNPAID_CASH" && "Silakan menuju kasir untuk melakukan pembayaran."}
            </span>
          </div>

          <button
            onClick={() => setSubmittedOrder(null)}
            className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
          >
            Pesan Menu Tambahan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans">
      {/* Top Header */}
      <header className="p-4 sm:p-5 bg-white/90 border-b border-slate-200 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.businessName} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              tenant.businessName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">
              {tenant.businessName}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Self-Order Digital</span>
              <span>•</span>
              <span className="text-indigo-600 font-bold">🪑 {tableNumber}</span>
            </div>
          </div>
        </div>

        {/* Quick Cart Button */}
        {totalCount > 0 && (
          <button
            onClick={() => setShowCartModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{totalCount} item</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Banner / Info Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xl space-y-2 relative overflow-hidden">
          <div className="relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">
              Menu Digital &amp; Pesan Mandiri
            </span>
            <h2 className="text-lg font-black mt-1">Pilih Menu Favorit Anda</h2>
            <p className="text-xs text-slate-300">
              Pesan langsung dari meja tanpa menunggu antrean. Pesanan akan otomatis terkirim ke kasir &amp; dapur.
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Semua Menu ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredProducts.map((p) => {
            const inCartQty = cart[p.id]?.qty || 0;

            return (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    {p.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                    {p.name}
                  </h3>
                  <div className="text-xs font-black text-slate-900 mt-1">
                    Rp {p.price.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {inCartQty > 0 ? (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-black shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-slate-900">
                        {inCartQty}
                      </span>
                      <button
                        onClick={() => addToCart(p)}
                        className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Sticky Floating Bar if cart has items */}
      {totalCount > 0 && !showCartModal && (
        <div className="sticky bottom-0 z-20 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-500 font-bold">Total ({totalCount} Item):</div>
              <div className="text-base font-black text-slate-900">
                Rp {totalAmount.toLocaleString("id-ID")}
              </div>
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <span>Lanjut Pesan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Drawer Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900">Konfirmasi Pesanan Meja</h3>
                <p className="text-[11px] text-slate-500 font-medium">Lengkapi detail pemesan untuk kasir</p>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitOrder} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Order Items Review */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-500">Daftar Menu yang Dipesan:</div>
                {Object.values(cart).map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">
                      {item.qty}x {item.product.name}
                    </span>
                    <span className="font-mono text-slate-600">
                      Rp {(item.product.price * item.qty).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="text-indigo-600">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Table Selection / Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor Meja:
                </label>
                {tables.length > 0 ? (
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {tables.map((tbl) => (
                      <option key={tbl.id} value={tbl.tableNumber}>
                        {tbl.tableNumber}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Misal: Meja 03 / Area Sofa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Anda: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kak Budi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* WhatsApp Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  No. WhatsApp (Opsional):
                </label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Customer Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Khusus (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Less sugar, es sedikit, pisah saus..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilihan Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UNPAID_CASH")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      paymentMethod === "UNPAID_CASH"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Bayar di Kasir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PAID_ONLINE")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      paymentMethod === "PAID_ONLINE"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS Dinamis</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || totalCount === 0 || !customerName.trim()}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Pesanan (Rp {totalAmount.toLocaleString("id-ID")})</span>
                    </>
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
