"use client";

import { useState } from "react";
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
} from "lucide-react";

interface CustomerMenuClientProps {
  tenant: any;
  products: any[];
}

export function CustomerMenuClient({
  tenant,
  products = [],
}: CustomerMenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<{ [id: string]: { product: any; qty: number } }>({});
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [showCartModal, setShowCartModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  const addToCart = (product: any) => {
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
    (sum, item) => sum + Number(item.product.price) * item.qty,
    0
  );

  const totalCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory;
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !tableNumber || totalCount === 0) return;

    setIsSubmitting(true);
    try {
      // Simulasi submit order berhasil
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSuccess(true);
      setCart({});
      setShowCartModal(false);
    } catch (err: any) {
      alert(err.message || "Gagal mengirim pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-900 flex flex-col justify-between selection:bg-emerald-600 selection:text-white font-sans text-left">
      {/* Top Header - Clean White Surface */}
      <header className="p-4 sm:p-6 bg-white/90 border-b border-slate-200/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight text-slate-950 flex items-center gap-1.5">
              {tenant?.businessName || "POS Cafe"}
            </h1>
            <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
              Digital Menu & Self-Order
            </p>
          </div>
        </div>

        {totalCount > 0 && (
          <button
            onClick={() => setShowCartModal(true)}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 animate-bounce"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{totalCount} Item</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Success Alert */}
        {isSuccess && (
          <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-emerald-900">
              Pesanan Anda Berhasil Dikirim ke Kasir & Dapur!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              Mohon menunggu, pesanan Anda atas nama <strong>{customerName}</strong> di <strong>{tableNumber}</strong> sedang disiapkan.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              Pesan Tambahan
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === "ALL"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 hover:text-slate-950 border border-slate-200"
            }`}
          >
            Semua Menu ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white text-slate-600 hover:text-slate-950 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid - Clean White Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const inCart = cart[p.id]?.qty || 0;

            return (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                      {p.category || "Umum"}
                    </span>
                    <span className="font-black text-sm text-emerald-600">
                      Rp {Number(p.price).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-950 mt-2">
                    {p.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {inCart > 0 ? (
                    <div className="flex items-center gap-2 bg-[#F8F9FD] border border-slate-200 p-1 rounded-2xl">
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="w-7 h-7 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black w-6 text-center text-slate-950">
                        {inCart}
                      </span>
                      <button
                        onClick={() => addToCart(p)}
                        className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Pesanan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Cart Modal - Clean White */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base flex items-center gap-2 text-slate-950">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Konfirmasi Pesanan Saya
              </h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.values(cart).map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8F9FD] border border-slate-200"
                  >
                    <div>
                      <p className="font-bold text-slate-950">{item.product.name}</p>
                      <span className="text-[11px] text-slate-500">
                        {item.qty} &times; Rp {Number(item.product.price).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span className="font-black text-slate-950">
                      Rp {(item.qty * Number(item.product.price)).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-bold text-slate-500">Total Pembayaran:</span>
                <span className="text-xl font-black text-emerald-600">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Anda / Pemesan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Budi / Meja 4"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Meja / Ruangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 03 / VIP"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kurang manis, tanpa es batu"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCartModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20 hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Mengirim..." : "Kirim Pesanan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        {tenant?.businessName || "POS Cafe"} &bull; Powered by POS Universal QR Menu
      </footer>
    </div>
  );
}
