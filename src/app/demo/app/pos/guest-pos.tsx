"use client";

import { useState, useEffect } from "react";
import { swalWarning } from "@/lib/swal";
import Link from "next/link";
import {
  Store,
  ArrowLeft,
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  Layers,
  RotateCcw,
} from "lucide-react";

export function GuestPOS() {
  const [config, setConfig] = useState<any>({
    tier: { name: "Paket Pro" },
    theme: { tokens: { primaryColor: "#4f46e5", radius: "1rem" } },
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<any[]>([
    { id: "1", name: "Gentlemen Haircut + Wash", price: 65000, qty: 1, cat: "BARBER" },
    { id: "3", name: "Iced Caramel Macchiato", price: 32000, qty: 2, cat: "CAFE" },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER" | "CARD">("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(150000);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTrxNumber, setLastTrxNumber] = useState("TRX-DEMO-001");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_guest_demo_config");
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  const themeTokens = config.theme?.tokens || {};
  const pColor = themeTokens.primaryColor || "#4f46e5";

  // Mock Products Catalog
  const products = [
    { id: "1", name: "Gentlemen Haircut + Wash", price: 65000, cat: "BARBER", type: "JASA", stock: null },
    { id: "2", name: "Beard Shave & Hot Towel", price: 40000, cat: "BARBER", type: "JASA", stock: null },
    { id: "3", name: "Iced Caramel Macchiato", price: 32000, cat: "CAFE", type: "BARANG", stock: 45 },
    { id: "4", name: "Croissant Butter Almond", price: 28000, cat: "CAFE", type: "BARANG", stock: 18 },
    { id: "5", name: "Spaghetti Aglio Olio", price: 45000, cat: "CAFE", type: "BARANG", stock: 24 },
    { id: "6", name: "Minyak Goreng Pouch 2L", price: 34000, cat: "RETAIL", type: "BARANG", stock: 50 },
    { id: "7", name: "Beras Premium 5 Kg", price: 72000, cat: "RETAIL", type: "BARANG", stock: 20 },
    { id: "8", name: "Cuci Kering Lipat 4 Kg", price: 28000, cat: "LAUNDRY", type: "JASA", stock: null },
    { id: "9", name: "Bed Cover Jumbo", price: 45000, cat: "LAUNDRY", type: "JASA", stock: null },
    { id: "10", name: "Pomade Matte Clay", price: 75000, cat: "RETAIL", type: "BARANG", stock: 12 },
  ];

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setPaidAmount(0);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const change = Math.max(0, paidAmount - totalAmount);

  const handleProcessPayment = async () => {
    if (cart.length === 0) return;
    if (paidAmount < totalAmount) {
      await swalWarning("Pembayaran Kurang", "Nominal pembayaran kurang dari total tagihan.");
      return;
    }
    const newTrx = `TRX-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    setLastTrxNumber(newTrx);
    setShowReceipt(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === "ALL" || p.cat === selectedCategory;
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cat.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FD] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-emerald-600 px-4 py-2 text-white font-bold text-xs flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>
            MESIN KASIR GUEST DEMO — Semua transaksi berjalan secara lokal di browser Anda (Bebas coba tanpa akun).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/demo/app"
            className="px-3 py-1 rounded-full bg-emerald-800 text-white hover:bg-emerald-900 transition text-[11px] font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke Dashboard Demo</span>
          </Link>
        </div>
      </div>

      {/* POS Top Navbar - Clean White Material 3 */}
      <header className="border-b border-slate-200/90 bg-white px-4 sm:px-6 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black shadow-sm"
            style={{ backgroundColor: pColor }}
          >
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-sm text-slate-950">
              POS Register &bull; Kasir Demo
            </span>
            <span className="text-[10px] ml-2 text-slate-500 font-medium">
              Shift Aktif: Dimas (Kasir 1)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk / barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8F9FD] border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
          </div>
        </div>
      </header>

      {/* Main POS Register Area */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left 7 Cols: Category Filters & Product Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
            {[
              { id: "ALL", label: "Semua Kategori" },
              { id: "BARBER", label: "✂️ Barbershop" },
              { id: "CAFE", label: "☕ Cafe F&B" },
              { id: "RETAIL", label: "🛍️ Retail" },
              { id: "LAUNDRY", label: "🧺 Laundry" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl transition flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const inCart = cart.find((item) => item.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition relative group ${
                    inCart
                      ? "bg-indigo-50/70 border-indigo-600 shadow-sm ring-2 ring-indigo-600/20"
                      : "bg-white border-slate-200/90 hover:border-indigo-400 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md"
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow">
                      {inCart.qty}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {p.cat}
                    </span>
                    <p className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                      {p.name}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600">
                      Rp {p.price.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {p.stock ? `Stok ${p.stock}` : "Jasa"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Cart Summary & Checkout */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                Keranjang Kasir ({totalItemsCount})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-bold text-slate-600">Keranjang Masih Kosong</p>
                  <p className="text-[11px] text-slate-400">Klik produk di sebelah kiri untuk menambah pesanan.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#F8F9FD] border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Rp {item.price.toLocaleString("id-ID")} &times; {item.qty}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout & Quick Cash Keypad */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">TOTAL BILL:</span>
              <span className="text-2xl font-black text-slate-950">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>

            {totalAmount > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setPaidAmount(totalAmount)}
                    className="py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold"
                  >
                    Uang Pas
                  </button>
                  <button
                    onClick={() => setPaidAmount(50000)}
                    className="py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold"
                  >
                    Rp 50.000
                  </button>
                  <button
                    onClick={() => setPaidAmount(100000)}
                    className="py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold"
                  >
                    Rp 100.000
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Uang Tunai Pembeli (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F9FD] border border-slate-200 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {paidAmount >= totalAmount && totalAmount > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-bold">
                    <span>Kembalian:</span>
                    <span className="text-sm font-black">
                      Rp {change.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              disabled={cart.length === 0 || paidAmount < totalAmount}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              <span>Bayar & Cetak Struk Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans text-[10px] font-bold">
                ✓ Transaksi Demo Berhasil
              </span>
              <h4 className="font-black text-sm uppercase tracking-tight text-slate-950 pt-2">
                DEMO STORE POS UNIVERSAL
              </h4>
              <p className="text-[10px] text-slate-500">Struk Pembelian Kasir 58mm</p>
            </div>

            <div className="text-[11px] space-y-0.5 text-slate-600 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>No. TRX:</span>
                <span className="font-bold">{lastTrxNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>Dimas (Kasir 1)</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {item.qty}x {item.name}
                  </span>
                  <span>Rp {(item.qty * item.price).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            <div className="text-xs font-bold space-y-1 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between text-slate-950">
                <span>TOTAL:</span>
                <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                <span>TUNAI:</span>
                <span>Rp {paidAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                <span>KEMBALI:</span>
                <span>Rp {change.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="text-center pt-1 text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Terima kasih atas kunjungan Anda!</p>
              <p className="text-[9px] text-slate-400">Struk Simulasi Demo POS</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  clearCart();
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
