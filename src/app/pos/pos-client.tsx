"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  openShiftAction,
  closeShiftAction,
  addCashMovementAction,
} from "@/modules/transaction/shift-actions";
import {
  createTransactionAction,
  CartItemInput,
} from "@/modules/transaction/actions";
import {
  ShoppingCart,
  Store,
  Clock,
  User,
  Plus,
  Minus,
  Trash2,
  Search,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  History,
  LayoutDashboard,
  X,
  Package,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";

interface PosClientProps {
  initialShiftData: {
    activeShift: any | null;
    outlets: any[];
    currentOutletId: string;
    currentUser: {
      id: string;
      name: string;
      role: string;
    };
  };
  initialProducts: any[];
  categories: string[];
}

export function PosClient({
  initialShiftData,
  initialProducts,
  categories,
}: PosClientProps) {
  const [shiftData, setShiftData] = useState(initialShiftData);
  const [products, setProducts] = useState(initialProducts);

  // Cart State
  const [cart, setCart] = useState<CartItemInput[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Payment / Cash State
  const [amountPaid, setAmountPaid] = useState<number | string>("");

  // Modal States
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Open Shift Form State
  const [openingCash, setOpeningCash] = useState<number | string>(100000);

  // Close Shift Form State
  const [closingCash, setClosingCash] = useState<number | string>("");
  const [closeShiftSummary, setCloseShiftSummary] = useState<any | null>(null);

  // Cash Movement Form State
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [movementAmount, setMovementAmount] = useState<number | string>("");
  const [movementNote, setMovementNote] = useState<string>("");

  // Receipt Modal State
  const [completedTrx, setCompletedTrx] = useState<any | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeShift = shiftData.activeShift;

  // Shortcut fokus ke input pencarian / barcode dengan tombol "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hitung total belanja
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const parsedPaid = Number(amountPaid) || 0;
  const change = Math.max(0, parsedPaid - totalAmount);

  // Tambah item ke keranjang
  const addToCart = (product: any) => {
    if (!activeShift) {
      setShowOpenShiftModal(true);
      return;
    }

    if (product.type === "BARANG" && (product.stockQty ?? 0) <= 0) {
      alert("Stok barang ini sudah habis.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (
          product.type === "BARANG" &&
          product.stockQty !== null &&
          existing.qty >= product.stockQty
        ) {
          alert(`Maksimal stok tersedia hanya ${product.stockQty}`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            qty: 1,
            notes: "",
          },
        ];
      }
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const newQty = item.qty + delta;
            if (
              product &&
              product.type === "BARANG" &&
              product.stockQty !== null &&
              newQty > product.stockQty
            ) {
              alert(`Maksimal stok hanya ${product.stockQty}`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItemInput[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid("");
  };

  // Pencarian otomatis saat scan barcode tekan enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const found = products.find(
        (p) =>
          p.barcode?.toLowerCase() === searchQuery.toLowerCase().trim() ||
          p.name.toLowerCase() === searchQuery.toLowerCase().trim()
      );
      if (found) {
        addToCart(found);
        setSearchQuery("");
      }
    }
  };

  // Handle Buka Shift
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await openShiftAction({
        outletId: shiftData.currentOutletId,
        openingCash: Number(openingCash) || 0,
      });

      if (res.success) {
        setShiftData((prev) => ({
          ...prev,
          activeShift: {
            ...res.shift,
            transactions: [],
            cashMovements: [],
          },
        }));
        setShowOpenShiftModal(false);
        setSuccessMsg("Shift kasir berhasil dibuka! Selamat bertugas.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal membuka shift.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Checkout Transaksi
  const handleCheckout = async () => {
    if (!activeShift) {
      alert("Harap buka shift kasir terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang belanja masih kosong.");
      return;
    }
    if (parsedPaid < totalAmount) {
      alert("Uang pembayaran kurang dari total tagihan.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await createTransactionAction({
        shiftId: activeShift.id,
        outletId: shiftData.currentOutletId,
        items: cart,
        paymentMethod: "CASH",
        amountPaid: parsedPaid,
      });

      if (res.success) {
        setCompletedTrx(res);
        setShowReceiptModal(true);

        // Kurangi stok lokal produk
        setProducts((prev) =>
          prev.map((p) => {
            const bought = cart.find((c) => c.productId === p.id);
            if (bought && p.type === "BARANG" && p.stockQty !== null) {
              return { ...p, stockQty: p.stockQty - bought.qty };
            }
            return p;
          })
        );

        // Update shift total transaksi lokal
        setShiftData((prev) => {
          if (!prev.activeShift) return prev;
          return {
            ...prev,
            activeShift: {
              ...prev.activeShift,
              transactions: [
                res.transaction,
                ...(prev.activeShift.transactions || []),
              ],
            },
          };
        });

        clearCart();
      }
    } catch (err: any) {
      setError(err.message || "Gagal memproses transaksi kasir.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Catat Kas Masuk/Keluar
  const handleCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    setError(null);
    setLoading(true);

    try {
      const res = await addCashMovementAction({
        shiftId: activeShift.id,
        type: movementType,
        amount: Number(movementAmount),
        note: movementNote,
      });

      if (res.success) {
        setShiftData((prev) => {
          if (!prev.activeShift) return prev;
          return {
            ...prev,
            activeShift: {
              ...prev.activeShift,
              cashMovements: [
                res.movement,
                ...(prev.activeShift.cashMovements || []),
              ],
            },
          };
        });

        setShowCashMovementModal(false);
        setMovementAmount("");
        setMovementNote("");
        setSuccessMsg(
          `Kas ${movementType === "IN" ? "Masuk" : "Keluar"} berhasil dicatat!`
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Gagal mencatat kas movement.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Tutup Shift
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    setError(null);
    setLoading(true);
    try {
      const res = await closeShiftAction({
        shiftId: activeShift.id,
        closingCash: Number(closingCash),
      });

      if (res.success) {
        setCloseShiftSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menutup shift.");
    } finally {
      setLoading(false);
    }
  };

  const finishCloseShift = () => {
    setShiftData((prev) => ({
      ...prev,
      activeShift: null,
    }));
    setShowCloseShiftModal(false);
    setCloseShiftSummary(null);
    setClosingCash("");
  };

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === "ALL" || p.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      query === "" ||
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query));
    return matchCat && matchSearch && p.isActive;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FD] text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top POS Navbar - Clean White Material 3 */}
      <header className="h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1.5 text-xs"
            title="Kembali ke Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              POS
            </div>
            <div>
              <p className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                {shiftData.outlets.find((o) => o.id === shiftData.currentOutletId)
                  ?.name || "Outlet Utama"}
                {activeShift ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Shift Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                    Shift Tertutup
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2">
          {activeShift ? (
            <>
              <button
                onClick={() => setShowCashMovementModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
              >
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Kas Masuk/Keluar</span>
              </button>

              <button
                onClick={() => {
                  setCloseShiftSummary(null);
                  setShowCloseShiftModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Tutup Shift</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Buka Shift Kasir</span>
            </button>
          )}

          <Link
            href="/pos/history"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            title="Riwayat Transaksi"
          >
            <History className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {successMsg && (
        <div className="bg-emerald-600 text-white py-1.5 px-4 text-xs font-bold text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* If Shift is Closed, Display Clean Open Shift Prompt Screen */}
      {!activeShift ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.04)] text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-sm">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950">
                Shift Kasir Belum Dibuka
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buka shift kasir terlebih dahulu dengan memasukkan modal uang kas awal di laci kasir untuk mulai melayani transaksi.
              </p>
            </div>

            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Buka Shift Kasir Sekarang
            </button>
          </div>
        </div>
      ) : (
        /* Main POS Active Interface - Clean Material 3 */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Product Catalog Grid */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200/90 bg-[#F8F9FD]">
            {/* Search & Category Filter Bar */}
            <div className="p-3.5 bg-white border-b border-slate-200/80 flex flex-col gap-2.5 shadow-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Scan barcode SKU atau cari nama produk... (Tekan Enter untuk auto-add)"
                  className="w-full pl-10 pr-9 py-2.5 bg-[#F8F9FD] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition font-medium"
                />
                <ScanLine className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition ${
                    selectedCategory === "ALL"
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="flex-1 p-3.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.productId === p.id);
                const isOutOfStock =
                  p.type === "BARANG" && (p.stockQty ?? 0) <= 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition relative overflow-hidden group ${
                      inCart
                        ? "bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-600/20"
                        : "bg-white border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-indigo-400 hover:shadow-md"
                    } ${isOutOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {inCart && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow">
                        {inCart.qty}
                      </span>
                    )}

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600">
                        Rp {Number(p.price).toLocaleString("id-ID")}
                      </span>

                      {p.type === "BARANG" ? (
                        <span
                          className={`text-[10px] font-bold ${
                            (p.stockQty ?? 0) <= 5
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          Stok {p.stockQty ?? 0}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600">
                          Jasa
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Cart & Cash Checkout - Clean White Surface */}
          <div className="w-80 md:w-96 flex flex-col bg-white border-l border-slate-200/90 flex-shrink-0 shadow-lg">
            {/* Cart Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                  Keranjang ({totalItemsCount})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs font-bold text-slate-600">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik produk di sebelah kiri atau scan barcode untuk menambahkan item.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 rounded-2xl bg-[#F8F9FD] border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Rp {item.price.toLocaleString("id-ID")} &times; {item.qty}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQty(item.productId, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary & Payment Keypad */}
            <div className="p-4 bg-[#F8F9FD] border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between text-slate-950 font-black text-sm pt-1.5 border-t border-slate-200">
                  <span>Total Tagihan:</span>
                  <span className="text-indigo-600 text-lg font-black">
                    Rp {totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              {totalAmount > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setAmountPaid(totalAmount)}
                      className="py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold"
                    >
                      Uang Pas
                    </button>
                    <button
                      onClick={() => setAmountPaid(50000)}
                      className="py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold"
                    >
                      Rp 50.000
                    </button>
                    <button
                      onClick={() => setAmountPaid(100000)}
                      className="py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold"
                    >
                      Rp 100.000
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Uang Tunai Diterima
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Masukkan nominal bayar..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {parsedPaid >= totalAmount && totalAmount > 0 && (
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
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 ||
                  parsedPaid < totalAmount ||
                  totalAmount <= 0 ||
                  loading
                }
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Bayar & Cetak Struk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS (CLEAN MATERIAL 3 WHITE SURFACES) ── */}

      {/* 1. Modal Buka Shift */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm flex items-center gap-2 text-slate-950">
                <Clock className="w-4 h-4 text-indigo-600" />
                Buka Shift Kasir Baru
              </h3>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kas Modal Awal di Laci (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Uang pecahan kembalian awal di laci kasir.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md hover:bg-indigo-700"
                >
                  {loading ? "Membuka..." : "Buka Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Kas Masuk / Keluar (Cash Movement) */}
      {showCashMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm flex items-center gap-2 text-slate-950">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Catat Mutasi Kas di Laci
              </h3>
              <button
                onClick={() => setShowCashMovementModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCashMovement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType("IN")}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                    movementType === "IN"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Kas Masuk (In)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("OUT")}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                    movementType === "OUT"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Kas Keluar (Out)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  required
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Misal: Tambah modal koin, Beli es batu"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashMovementModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md hover:bg-indigo-700"
                >
                  {loading ? "Menyimpan..." : "Simpan Mutasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Tutup Shift & Rekonsiliasi */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm flex items-center gap-2 text-slate-950">
                <Lock className="w-4 h-4 text-rose-600" />
                Tutup Shift Kasir & Rekonsiliasi
              </h3>
              {!closeShiftSummary && (
                <button
                  onClick={() => setShowCloseShiftModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {closeShiftSummary ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <p className="font-black text-emerald-800 text-sm">
                    ✓ Shift Berhasil Ditutup!
                  </p>
                  <div className="space-y-1 text-slate-700 pt-1 border-t border-emerald-200">
                    <div className="flex justify-between">
                      <span>Modal Awal:</span>
                      <span className="font-bold">
                        Rp {closeShiftSummary.openingCash?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Penjualan Tunai:</span>
                      <span className="font-bold">
                        Rp {closeShiftSummary.totalSalesCash?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Kas Masuk:</span>
                      <span className="font-bold text-emerald-600">
                        +Rp {closeShiftSummary.totalCashIn?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Kas Keluar:</span>
                      <span className="font-bold text-rose-600">
                        -Rp {closeShiftSummary.totalCashOut?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-300 pt-1 font-bold">
                      <span>Ekspektasi Uang di Laci:</span>
                      <span>
                        Rp {closeShiftSummary.expectedCash?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Uang Fisik Kasir:</span>
                      <span>
                        Rp {closeShiftSummary.actualCash?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 border-t border-emerald-300 pt-1">
                      <span>Selisih Kas:</span>
                      <span
                        className={
                          closeShiftSummary.difference === 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      >
                        Rp {closeShiftSummary.difference?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={finishCloseShift}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                >
                  Selesai & Keluar Shift
                </button>
              </div>
            ) : (
              <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hitung Total Uang Fisik di Laci Kasir (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Hitung seluruh uang fisik di laci..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#FAFAFC] focus:bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sistem akan otomatis menghitung rekonsiliasi dan selisih kas.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseShiftModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold shadow-md hover:bg-rose-700"
                  >
                    {loading ? "Memproses..." : "Tutup Shift Sekarang"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. Modal Cetak Struk Transaksi Selesai */}
      {showReceiptModal && completedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs border border-slate-200">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans text-[10px] font-bold">
                ✓ Transaksi Kasir Berhasil
              </span>
              <h4 className="font-black text-sm uppercase tracking-tight text-slate-950 pt-2">
                {shiftData.outlets.find((o) => o.id === shiftData.currentOutletId)?.name || "POS STORE"}
              </h4>
              <p className="text-[10px] text-slate-500">Struk Pembelian Kasir</p>
            </div>

            <div className="text-[11px] space-y-0.5 text-slate-600 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold">{completedTrx.transaction?.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{shiftData.currentUser.name}</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
              {completedTrx.transaction?.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <span>Rp {(item.quantity * item.price).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            <div className="text-xs font-bold space-y-1 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between text-slate-950">
                <span>TOTAL:</span>
                <span>Rp {completedTrx.transaction?.totalAmount?.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                <span>TUNAI:</span>
                <span>Rp {completedTrx.transaction?.amountPaid?.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-normal text-[11px]">
                <span>KEMBALI:</span>
                <span>Rp {completedTrx.transaction?.change?.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="text-center pt-1 text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Terima kasih atas kunjungan Anda!</p>
              <p className="text-[9px] text-slate-400">Struk Termal 58mm POS Universal</p>
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
                  setShowReceiptModal(false);
                  setCompletedTrx(null);
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
